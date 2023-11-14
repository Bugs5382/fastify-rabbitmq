import AmqpConnectionManager from "amqp-connection-manager/dist/types/AmqpConnectionManager";
import ChannelWrapper from "amqp-connection-manager/dist/types/ChannelWrapper";
import {AmqpConnectionOptions} from "amqp-connection-manager/dist/types/decorate";

export interface FastifyRabbitMQOptions {
  /**
   * Amqp Connection Options
   */
  connectionOptions?: AmqpConnectionOptions;
  /**
   * Enable RPC Built In System
   * Warning: Experiential
   */
  enableRPC?: boolean
  /**
   * Namespace
   */
  namespace?: string
  /**
   * URL Settings
   */
  urls: string[] | string | null
}

export type FastifyRabbitMQAmqpConnectionManager = AmqpConnectionManager & {
  /**
   * Used to create an RPC Client and send the "input" to the corresponding RPC server.
   * @since 1.0.0
   * @param queueName {string}
   * @param dataInput
   * @param jsonProcess {boolean}
   * @example
   */
  createRPCClient: <T>(queueName: string, dataInput: T, jsonProcess?: boolean) => Promise<string | undefined>
  /**
   * Used to create an RPC Server
   * @since 1.0.0
   * @param queueName
   * @param onMessage {function} A function that returns something from the RPC Server.
   * @example
   */
  createRPCServer: (queueName: string, onMessage: (input: any) => any | Promise<any>) => Promise<ChannelWrapper>
  /**
   * Send RPC
   * A RPC Client can send an RPC command.
   * The queueName must match the server and client creation process.
   * @param queueName
   * @param dataInput
   */
  sendRPC: <T>(queueName: string, dataInput: T) => Promise<string>
}