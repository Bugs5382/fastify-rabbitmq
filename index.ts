import { randomUUID } from 'crypto'
import { FastifyInstance, FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import amqp, { Channel, ConsumeMessage } from 'amqplib'

import FastifyRabbitMQOptions = fastifyRabbitMQ.FastifyRabbitMQOptions

declare module 'fastify' {
  interface FastifyInstance {
    rabbitmq: fastifyRabbitMQ.FastifyRabbitMQObject & fastifyRabbitMQ.FastifyRabbitMQNestedObject
  }

}

type fastifyRabbitMQPlugin = FastifyPluginCallback<
NonNullable<fastifyRabbitMQ.FastifyRabbitMQOptions>
>

declare namespace fastifyRabbitMQ {

  export interface FastifyRabbitMQObject {
    createBind: (queue: string, consumeMessageFn: (message: ConsumeMessage | null, channel: Channel) => void) => Promise<void>
    createBindRPC: (queue: string, consumeMessageFn: (message: ConsumeMessage | null, channel: Channel) => void) => Promise<string>
    createExchange: (exchangeName: string, exchangeType: string, consumeMessageFn: (message: ConsumeMessage | null, channel: Channel) => void) => Promise<void>
    directMessage: (sendQueue: string, fromQueue: string, message: any, preProcessMessage: (message: any) => string) => void
    publishMessage: (sendQueue: string, message: any, preProcessMessage: (message: any) => string) => void
    publishMessageExchange: (queue: string, routingKey: string, message: any, preProcessMessage: (message: any) => string) => void
    publishRPC: (sendQueue: string, message: any, preProcessMessage: (message: any) => string) => Promise<string>
  }

  export interface FastifyRabbitMQNestedObject {
    [namespace: string]: FastifyRabbitMQObject
  }

  export interface FastifyRabbitMQOptions {
    host?: string
    namespace?: string
    password?: string
    port?: string
    username?: string
  }

  export const fastifyRabbitMQPlugin: fastifyRabbitMQPlugin
  export { fastifyRabbitMQPlugin as default }

}

/**
 * decorateFastifyInstance
 * @since 0.0.1
 * @param fastify
 * @param options
 * @param functions
 */
const decorateFastifyInstance = (fastify: FastifyInstance, options: FastifyRabbitMQOptions, functions: any): void => {
  const { namespace } = options

  if (namespace) {
    if (typeof fastify.rabbitmq === 'undefined') {
      fastify.decorate('rabbitmq', { ...functions })
    }
    if (typeof fastify.rabbitmq[namespace] !== 'undefined') {
      throw Error('Connection name already registered: ' + namespace)
    }
  } else {
    if (typeof fastify.rabbitmq !== 'undefined') {
      throw Error('fastify-rabbitmq has already registered')
    }
  }

  if (typeof fastify.rabbitmq === 'undefined') {
    fastify.decorate('rabbitmq', { ...functions })
  }
}

const fastifyRabbit = fp(async (fastify: FastifyInstance, options: FastifyRabbitMQOptions): Promise<void> => {
  const {
    host = 'localhost',
    port = '5672',
    username = 'guest',
    password = 'guest'
  } = options

  const RABBITMQ_FULL_URL = `amqp://${username}:${password}@${host}:${port}`

  /**
   * getRabbitChannel
   * @since 0.0.1
   */
  async function getRabbitChannel (): Promise<Channel> {
    const conn = await amqp.connect(RABBITMQ_FULL_URL)
    return await conn.createChannel()
  }

  // create the channel
  const channel = await getRabbitChannel()

  /**
   * createBind
   * @since 0.0.1
   * @param queue
   * @param consumeMessageFn
   */
  async function createBind (queue: string, consumeMessageFn: (message: ConsumeMessage | null, channel: Channel) => void): Promise<void> {
    await channel?.assertQueue(queue, { durable: false }).then(async () => {
      fastify.log.debug('[X] Waiting Queue (%s)', queue)
      await channel.consume(queue, async (msg: amqp.ConsumeMessage | null): Promise<void> => {
        consumeMessageFn(msg, channel)
      }, {
        noAck: true
      })
    })
  }

  /**
   * createBindRPC
   * Create an RPC queue for returning data back to the client from the server.
   * @since 0.0.1
   * @param queue {string}
   * @param consumeMessageFn {function}
   */
  async function createBindRPC (queue: string, consumeMessageFn: (message: ConsumeMessage | null, channel: Channel) => Promise<string>): Promise<void> {
    await channel?.assertQueue(queue + '-rpc', { durable: false }).then(async () => {
      await channel.prefetch(1)
      fastify.log.debug('[X] Waiting RPC Server Queue (%s)', queue + '-rpc')
      await channel.consume(queue + '-rpc', async (msg: amqp.ConsumeMessage | null): Promise<void> => {
        fastify.log.debug('[X] RPC Server Correlation ID: %s', msg?.properties.correlationId)
        fastify.log.debug('[X] RPC Server Data Received: %s', JSON.parse(JSON.stringify(msg?.content.toString())))
        const response = await consumeMessageFn(msg, channel)
        channel.sendToQueue(msg?.properties.replyTo, Buffer.from(response), {
          correlationId: msg?.properties.correlationId
        })
      }, {
        noAck: true
      })
    })
  }

  /**
   * createExchange
   * @since 0.0.1
   * @param exchangeName
   * @param exchangeType
   * @param consumeMessageFn
   */
  async function createExchange (exchangeName: string, exchangeType: string, consumeMessageFn: (message: ConsumeMessage | null, channel: Channel) => void): Promise<void> {
    await channel?.assertExchange(exchangeName + '-exchange', exchangeType, { durable: true }).then(async () => {
      await channel.consume(exchangeName + '-exchange', async (msg: amqp.ConsumeMessage | null): Promise<void> => {
        consumeMessageFn(msg, channel)
      }, {
        noAck: true
      })
    })
  }

  /**
   * directMessage
   * @since 0.0.1
   * @param sendQueue {string} The target queue and directed to that queue. No one else can take it.
   * @param fromQueue
   * @param message {any} You can publish anything as long as it goes out over as a string.
   * @param preProcessMessage
   */
  function directMessage (sendQueue: string, fromQueue: string, message: any, preProcessMessage: (message: any) => string): void {
    const msg = preProcessMessage(message)
    channel?.sendToQueue(sendQueue, Buffer.from(msg), {
      replyTo: fromQueue
    })
  }

  /**
   * publishMessage
   * @since 0.0.1
   * @param sendQueue {string} The target queue.
   * @param message {any} You can publish anything as long as it goes out over as a string.
   * @param preProcessMessage
   */
  function publishMessage (sendQueue: string, message: any, preProcessMessage: (message: any) => string): void {
    const msg = preProcessMessage(message)
    fastify.log.debug('[X] Publish to Queue (%s): %s', '', [sendQueue, msg])
    channel?.publish('', sendQueue, Buffer.from(msg))
  }

  /**
   * publishMessageExchange
   * @since 0.0.1
   * @param queue
   * @param routingKey {string} The target queue.
   * @param message {any} You can publish anything as long as it goes out over as a string.
   * @param preProcessMessage
   */
  function publishMessageExchange (queue: string, routingKey: string, message: any, preProcessMessage: (message: any) => string): void {
    const msg = preProcessMessage(message)
    fastify.log.debug('[X] Publish to Queue (%s), Routing Queue (%s): %s', queue, routingKey, msg)
    channel?.publish(queue + '-exchange', routingKey, Buffer.from(msg))
  }

  /**
   * publishRPC
   * Send an RPC message to an RPC Queue
   * @since 0.0.1
   * @param sendQueue {string}
   * @param message {any}
   * @param preProcessMessage {function}
   */
  async function publishRPC (sendQueue: string, message: any, preProcessMessage: (message: any) => string): Promise<void> {
    channel?.assertQueue('', { exclusive: true }).then(async (q) => {
      const correlationId = randomUUID()
      const msgProcess = preProcessMessage(message)
      fastify.log.debug('[X] RPC Client Correlation ID: ' + correlationId)
      fastify.log.debug('[X] RPC Client Message: ' + msgProcess)
      await channel.consume(q.queue, async (msg: amqp.ConsumeMessage | null): Promise<any> => {
        if (msg?.properties.correlationId === correlationId) {
          fastify.log.debug('[X] RPC Client Got Message: ' + msg.content.toString())
          setTimeout(async () => {
            await channel.close()
            process.exit(0)
          }, 100)
        }
      }, {
        noAck: true
      })
      channel?.sendToQueue(sendQueue + '-rpc', Buffer.from(msgProcess), {
        correlationId,
        replyTo: q.queue
      })
    })
  }

  /**
   * Decorate Fastify
   */
  decorateFastifyInstance(fastify, options, { createExchange, createBind, createBindRPC, directMessage, publishMessage, publishMessageExchange, publishRPC })
})

export default fastifyRabbit
