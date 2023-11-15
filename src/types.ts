import { Connection as RabbitMQConnection } from 'rabbitmq-client'

declare module 'fastify' {
  export interface FastifyInstance {
    rabbitmq: RabbitMQConnection & fastifyRabbitMQ.FastifyRabbitMQAmqpNestedObject
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace fastifyRabbitMQ {
  export interface FastifyRabbitMQAmqpNestedObject {
    [namespace: string]: RabbitMQConnection
  }
}
