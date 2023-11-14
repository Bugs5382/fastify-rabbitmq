import AmqpConnectionManager from "amqp-connection-manager/dist/types/AmqpConnectionManager";
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

}
