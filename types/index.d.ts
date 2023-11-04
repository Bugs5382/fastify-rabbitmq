import { ChannelWrapper, ConnectionUrl } from 'amqp-connection-manager'
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/types/AmqpConnectionManager'
import { FastifyPluginAsync, FastifyPluginOptions } from 'fastify'

declare module 'fastify' {

  interface FastifyInstance {
    /**
     * RabbitMQ Connection
     */
    rabbitmq: IAmqpConnectionManager & fastifyRabbitMQ.FastifyRabbitMQAmqpNestedObject
  }

}

type FastifyRabbitMQ = FastifyPluginAsync<fastifyRabbitMQ.FastifyRabbitMQOptions>

declare namespace fastifyRabbitMQ {

  export interface FastifyRabbitMQChannelProperties {
    /* Name of the Channel */
    name: string
    /* RabbitMQ Options for Channel */
    options: any
  }

  export interface FastifyRabbitMQChannels extends FastifyRabbitMQChannelProperties {
    /* The channel wrapper from amqp-connection-manager */
    channel: ChannelWrapper
  }

  export interface FastifyRabbitMQAmqpNestedObject {
    /**
     * Nested Namespace
     */
    [namespace: string]: IAmqpConnectionManager
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
