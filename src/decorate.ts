import { ConnectionOptions } from 'rabbitmq-client'

export interface FastifyRabbitMQOptions {
  /** Connection String or object pointing to the RabbitMQ Broker Services */
  connection: string | ConnectionOptions
  /** To set the custom nNamespace within this plugin instance. Used to register this plugin more than one time. */
  namespace?: string
}
