import { ConnectionOptions as RabbitMQOptions } from 'rabbitmq-client'

export interface FastifyRabbitMQOptions {
  namespace?: string
  connection: string | RabbitMQOptions
}
