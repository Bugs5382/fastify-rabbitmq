import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager'

export interface FastifyRabbitMQAmqpConnectionManager extends AmqpConnectionManager {
  /**
   * Used to create an RPC Client and send the "input" to the corresponding RPC server.
   * @since 1.0.0
   * @param queueName {string}
   * @param dataInput {Unknown}
   * @param jsonProcess {boolean}
   * @example
   */
  createRPCClient: <T, K>(queueName: string, dataInput: T, jsonProcess?: boolean) => Promise<K>
  /**
   * Used to create an RPC Server
   * @since 1.0.0
   * @param queueName
   * @param onMessage {function} A function that returns something from the RPC Server.
   * @example
   */
  createRPCServer: <T, K>(queueName: string, onMessage: (input: T) => K | Promise<K>) => Promise<ChannelWrapper>
}
