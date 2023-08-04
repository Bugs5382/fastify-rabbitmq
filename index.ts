import {FastifyInstance, FastifyPluginCallback} from 'fastify'
import fp from 'fastify-plugin'
import amqp, {Channel, ConsumeMessage} from 'amqplib'


import FastifyRabbitMQOptions = fastifyRabbitMQ.FastifyRabbitMQOptions;

declare module 'fastify' {
  interface FastifyInstance {
    rabbitmq: fastifyRabbitMQ.FastifyRabbitMQObject & fastifyRabbitMQ.FastifyRabbitMQNestedObject;
  }

}

type fastifyRabbitMQPlugin = FastifyPluginCallback<
  NonNullable<fastifyRabbitMQ.FastifyRabbitMQOptions>
>;

declare namespace fastifyRabbitMQ {

  export interface FastifyRabbitMQObject {
    publishMessage (sendQueue: string, messageObject: any): void
    directMessage (sendQueue: string, messageObject: any): void
  }

  export interface FastifyRabbitMQNestedObject {
    [name: string]: FastifyRabbitMQObject;
  }

  export interface FastifyRabbitMQOptions {
    name?: string
    queue: string
    host?: string
    port?: string
    username?: string
    password?: string
    consumeMessageFn: (message: ConsumeMessage, channel: Channel) => void;
    confirmChannel?: boolean
  }

  export const fastifyRabbitMQPlugin: fastifyRabbitMQPlugin
  export { fastifyRabbitMQPlugin as default }

}

const decorateFastifyInstance = (fastify: FastifyInstance, options: FastifyRabbitMQOptions, functions: any): void => {
  const { name } = options

  if (name) {
    if (typeof fastify.rabbitmq === 'undefined') {
      fastify.decorate('rabbitmq', {...functions})
    }
    if (typeof fastify.rabbitmq[name] !== 'undefined') {
      throw Error('Connection name already registered: ' + name)
    }

  } else {
    if (typeof fastify.rabbitmq !== 'undefined') {
      throw Error('fastify-rabbitmq has already registered')
    }
  }

  if (typeof fastify.rabbitmq === 'undefined') {
    fastify.decorate('rabbitmq', {...functions})
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
    consumeMessageFn
  } = options

  const RABBITMQ_FULL_URL = `amqp://${username}:${password}@${host}:${port}`

  async function getRabbitChannel (confirmChannel: boolean): Promise<Channel> {
    const conn = await amqp.connect(RABBITMQ_FULL_URL)
    return confirmChannel ? await conn.createConfirmChannel() : await conn.createChannel()
  }

  async function consumeRabbitMessage (msg: ConsumeMessage, channel: Channel): Promise<void> {
    if (typeof consumeMessageFn === 'function') {
      consumeMessageFn(msg, channel)
    }
  }

  const channel = await getRabbitChannel(confirmChannel)

  await channel?.assertQueue(queue, { durable: false }).then(async () => {
    return await channel.consume(queue, async (msg:amqp.ConsumeMessage | null): Promise<void> => {
      await consumeRabbitMessage(<ConsumeMessage>msg, channel)
    }, {
      noAck: true
    })
  })

  function publishMessage (sendQueue: string, messageObject: any): void {
    const msg = JSON.stringify(messageObject)
    channel?.publish('', sendQueue, Buffer.from(msg))
  }

  function directMessage (sendQueue: string, messageObject: any): void {
    const msg = JSON.stringify(messageObject)
    channel?.sendToQueue(sendQueue, Buffer.from(msg), {
      replyTo: queue
    })
  }

  // make the function available in fastify scope
  decorateFastifyInstance(fastify, options, {publishMessage, directMessage})
})

export default fastifyRabbit
