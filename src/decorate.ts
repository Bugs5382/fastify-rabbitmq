import {AmqpConnectionManager} from "amqp-connection-manager";

export interface FastifyRabbitMQAmqpConnectionManager extends AmqpConnectionManager {
  createRPCClient: () => Promise<void>
  createRPCServer: () => Promise<void>
}