import {AmqpConnectionManager, ChannelWrapper} from "amqp-connection-manager";

export interface FastifyRabbitMQAmqpConnectionManager extends AmqpConnectionManager {
  /**
   * Used to create an RPC Client and send the "input" to the corresponding RPC server.
   * @since 1.0.0
   * @param queueName
   * @example
   */
  createRPCClient: <T>(queueName: string) => Promise<T>
  /**
   * Used to create an RPC Server
   * @since 1.0.0
   * @param queueName
   * @example
   */
  createRPCServer: (queueName: string) => Promise<ChannelWrapper>
}