import { AmqpConnectionManager, ConnectionUrl } from 'amqp-connection-manager'
import { FastifyPluginAsync, FastifyPluginOptions } from 'fastify'

declare module 'fastify' {

  interface FastifyInstance {
    /**
     * RabbitMQ Connection
     */
    rabbitmq: AmqpConnectionManager & fastifyRabbitMQ.FastifyRabbitMQAmqpNestedObject
  }

}

type FastifyRabbitMQ = FastifyPluginAsync<fastifyRabbitMQ.FastifyRabbitMQOptions>

declare namespace fastifyRabbitMQ {

  export interface FastifyRabbitMQAmqpNestedObject {
    /**
     * Nested Namespace
     */
    [namespace: string]: AmqpConnectionManager
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
