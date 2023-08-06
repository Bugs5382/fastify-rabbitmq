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
    publishMessage: (sendQueue: string, message: any) => void
    directMessage: (sendQueue: string, message: any) => void
  }

  export interface FastifyRabbitMQNestedObject {
    [namespace: string]: FastifyRabbitMQObject
  }

  export interface FastifyRabbitMQOptions {
    namespace?: string
    queue: string
    host?: string
    port?: string
    username?: string
    password?: string
    preProcessMessageFn?: (message: any) => string
    consumeMessageFn: (message: ConsumeMessage, channel: Channel) => void
    confirmChannel?: boolean
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
    queue,
    host = 'localhost',
    port = '5672',
    username = 'guest',
    password = 'guest',
    confirmChannel = false,
    consumeMessageFn,
    preProcessMessageFn
  } = options

  const RABBITMQ_FULL_URL = `amqp://${username}:${password}@${host}:${port}`

  /**
   * getRabbitChannel
   * @since 0.0.1
   * @param confirmChannel {boolean} Set this to true if you want the channel to always ask for a confirmation that it was sent and received by the other side.
   */
  async function getRabbitChannel (confirmChannel: boolean): Promise<Channel> {
    const conn = await amqp.connect(RABBITMQ_FULL_URL)
    return confirmChannel ? await conn.createConfirmChannel() : await conn.createChannel()
  }

  /**
   * consumeRabbitMessage
   * Process the incoming message from another queue. This is required.
   * @since 0.0.1
   * @param msg {ConsumeMessage} Data from RabbitMQ. It's in a string format; however, you need to interpret the data.
   * @param channel {Channel} What channel did it comes from and the properties of that channel.
   */
  async function consumeRabbitMessage (msg: ConsumeMessage, channel: Channel): Promise<void> {
    if (typeof consumeMessageFn === 'function') {
      consumeMessageFn(msg, channel)
    }
  }

  /**
   * preProcessMessage
   * If the parameter preProcessMessageFn is passed, it will use that function to process the data.
   * @since 0.0.1
   * @param message {any} The data you want to send, however it must be a string.
   */
  function preProcessMessage (message: any): string {
    if (typeof preProcessMessageFn === 'function') {
      return preProcessMessageFn(message)
    } else {
      return message
    }
  }

  const channel = await getRabbitChannel(confirmChannel)

  await channel?.assertQueue(queue, { durable: false }).then(async () => {
    return await channel.consume(queue, async (msg: amqp.ConsumeMessage | null): Promise<void> => {
      await consumeRabbitMessage(msg as ConsumeMessage, channel)
    }, {
      noAck: true
    })
  })

  /**
   * publishMessage
   * @since 0.0.1
   * @param sendQueue {string} The target queue.
   * @param message {any} You can publish anything as long as it goes out over as a string.
   */
  function publishMessage (sendQueue: string, message: any): void {
    channel?.publish('', sendQueue, Buffer.from(preProcessMessage(message)))
  }

  /**
   * directMessage
   * @since 0.0.1
   * @param sendQueue {string} The target queue and directed to that queue. No one else can take it.
   * @param message {any} You can publish anything as long as it goes out over as a string.
   */
  function directMessage (sendQueue: string, message: any): void {
    channel?.sendToQueue(sendQueue, Buffer.from(preProcessMessage(message)), {
      replyTo: queue
    })
  }

  /**
   * Decorate Fastify
   */
  decorateFastifyInstance(fastify, options, { publishMessage, directMessage })
})

export default fastifyRabbit
