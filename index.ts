import {FastifyInstance, FastifyPluginAsync} from 'fastify'
import fp from 'fastify-plugin'
import amqp, {Channel, ConsumeMessage} from 'amqplib'

import FastifyRabbitMQOptions = fastifyRabbitMQ.FastifyRabbitMQOptions;

declare module 'fastify' {
  interface FastifyInstance {
    rabbitmq: fastifyRabbitMQ.FastifyRabbitMQObject & fastifyRabbitMQ.FastifyRabbitMQNestedObject;
  }
}

type fastifyRabbitMQ = FastifyPluginAsync<fastifyRabbitMQ.FastifyRabbitMQObject>;

declare namespace fastifyRabbitMQ {

  export interface FastifyRabbitMQObject {
    rabbitmq?: ''
  }

  export interface FastifyRabbitMQNestedObject {
    [name: string]: FastifyRabbitMQObject;
  }

  export interface FastifyRabbitMQOptions {
    queue: string
    host?: string
    port?: string
    username?: string
    password?: string
    consumeMessageFn: (message: ConsumeMessage, channel: Channel) => void;
    confirmChannel?: boolean
  }

  export const fastifyRabbitMQ: fastifyRabbitMQ
  export { fastifyRabbitMQ as default }

}

const decorateFastifyInstance = (fastify: FastifyInstance, options: any): void => {
  const { name, functions } = options

  if (typeof name === 'string') {
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
    consumeMessageFn,
    confirmChannel = false
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

  // make the function available in fastify scope
  decorateFastifyInstance(fastify, { name: queue, functions: { publishMessage } })
})

export default fastifyRabbit
