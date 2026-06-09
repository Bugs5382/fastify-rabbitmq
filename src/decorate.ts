import { ConnectionOptions } from "rabbitmq-client";

export interface FastifyRabbitMQOptions {
  /**
   * @since 1.0.0
   * @remarks Connection String or object pointing to the RabbitMQ Broker Services
   */
  connection: ConnectionOptions | string;
  /**
   * @since 1.0.0
   * @remarks To set the custom nNamespace within this plugin instance. Used to register this plugin more than one time.
   */
  namespace?: string;
}
