import { AmqpConnectionManager, ChannelWrapper, ConnectionUrl } from 'amqp-connection-manager'
import { FastifyPluginAsync, FastifyPluginOptions } from 'fastify'

export interface FastifyRabbitMQCreateSender {
  /* Name of the Channel */
  name: string
  /* RabbitMQ Options for Sending */
  options: any
}

declare module 'fastify' {

  interface FastifyInstance {
    rabbitmq: fastifyRabbitMQ.FastifyRabbitMQObject & fastifyRabbitMQ.FastifyRabbitMQNestedObject
  }

}

type FastifyRabbitMQ = FastifyPluginAsync<fastifyRabbitMQ.FastifyRabbitMQOptions>

declare namespace fastifyRabbitMQ {

  export interface FastifyRabbitMQObject extends AmqpConnectionManager {
    /**
     * Create a sender channel
     */
    createSender: (opts: FastifyRabbitMQCreateSender) => void
    /**
     * Get wrapper channel
     */
    getSendChannel: (name: string) => ChannelWrapper
  }

  export interface FastifyRabbitMQNestedObject {
    /**
     * Nested Namespace
     */
    [namespace: string]: FastifyRabbitMQObject
  }

  export interface FastifyRabbitMQOptions extends FastifyPluginOptions {
    /**
     * Log Level for RabbitMQ Debugging
     */
    logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error'
    /**
     * Namespace
     */
    namespace?: string
    /**
     * Connection URLS for AmqpConnectionManager
     */
    urLs: ConnectionUrl | ConnectionUrl[] | undefined | null
  }

}
