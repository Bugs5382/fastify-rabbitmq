import { AmqpConnectionManager, AmqpConnectionManagerOptions, ConnectionUrl } from '../../node-amqp-connection-manager'
import { FastifyRabbitMQAmqpConnectionManager } from './decorate'

declare module 'fastify' {

  export interface FastifyInstance {
    /**
     * RabbitMQ Connection
     */
    rabbitmq: AmqpConnectionManager & FastifyRabbitMQAmqpConnectionManager & fastifyRabbitMQ.FastifyRabbitMQAmqpNestedObject
  }

}

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace fastifyRabbitMQ {

  export interface FastifyRabbitMQAmqpNestedObject {
    /**
     * Nested Namespace
     */
    [namespace: string]: AmqpConnectionManager
  }

  export interface FastifyRabbitMQOptions extends AmqpConnectionManagerOptions {
    /**
     * Enable RPC Built In System
     *
     * Warning: Experiential
     */
    enableRPC?: boolean
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
