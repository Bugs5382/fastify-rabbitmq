import { Connection as RabbitMQConnection } from 'rabbitmq-client'

declare module 'fastify' {
  export interface FastifyInstance {
    /** Main Decorator for Fastify **/
    rabbitmq: RabbitMQConnection & fastifyRabbitMQ.FastifyRabbitMQNO
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace fastifyRabbitMQ {
  export interface FastifyRabbitMQNO {
    [namespace: string]: RabbitMQConnection
  }
}
