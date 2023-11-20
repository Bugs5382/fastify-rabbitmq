import { ConnectionOptions } from 'rabbitmq-client'

export interface FastifyRabbitMQOptions {
  /**
   * @since 1.0.0
   * @description Connection String or object pointing to the RabbitMQ Broker Services
   */
  connection: string | ConnectionOptions
  /**
   * @since 1.0.0
   * @description To set the custom nNamespace within this plugin instance. Used to register this plugin more than one time.
   */
  namespace?: string
}