import {AmqpConnectionManager, ChannelWrapper} from "amqp-connection-manager";

export interface FastifyRabbitMQAmqpConnectionManager extends AmqpConnectionManager {
  createRPCClient: () => Promise<void>
  createRPCServer: (queueName: string) => Promise<ChannelWrapper>
}