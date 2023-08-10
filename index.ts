import amqp from "amqp-connection-manager";
import type {
  AmqpConnectionManagerOptions,
  ConnectionUrl,
} from "amqp-connection-manager"
import {IAmqpConnectionManager} from "amqp-connection-manager/dist/types/AmqpConnectionManager";
import { FastifyInstance, FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'

import FastifyRabbitMQOptions = fastifyRabbitMQ.FastifyRabbitMQOptions;

declare module 'fastify' {

  interface FastifyInstance {
    rabbitmq: IAmqpConnectionManager & fastifyRabbitMQ.FastifyRabbitMQNestedObject
  }

}

type fastifyRabbitMQPlugin = FastifyPluginCallback<
  NonNullable<fastifyRabbitMQ.FastifyRabbitMQOptions>
>

declare namespace fastifyRabbitMQ {

  export interface FastifyRabbitMQNestedObject {
    [namespace: string]: IAmqpConnectionManager
  }

  export interface FastifyRabbitMQOptions extends AmqpConnectionManagerOptions {
    logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error'
    namespace?: string
    urLs: ConnectionUrl | ConnectionUrl[] | undefined | null
  }

  export const fastifyRabbitMQPlugin: fastifyRabbitMQPlugin
  export { fastifyRabbitMQPlugin as default }

}

/**
 * decorateFastifyInstance
 * @since 0.0.1
 * @param fastify
 * @param connection
 */
const decorateFastifyInstance = (fastify: FastifyInstance, connection: any): void => {
  fastify.log.trace('[fastify-rabbitmq] Decorate Fastify')
  fastify.decorate('rabbitmq', connection )
}

const fastifyRabbit = fp(async (fastify: FastifyInstance, options: FastifyRabbitMQOptions): Promise<void> => {

  const {
    logLevel = 'silent',
    urLs,
    heartbeatIntervalInSeconds,
    reconnectTimeInSeconds,
    findServers,
    connectionOptions
  } = options

  // override log level
  fastify.log.child({}, {level: logLevel})

  const connection = amqp.connect(urLs, {
    heartbeatIntervalInSeconds,
    reconnectTimeInSeconds,
    findServers,
    connectionOptions
  })

  connection.on('connect', function() {
    fastify.log.debug('[fastify-rabbitmq] Connection to RabbitMQ Successful');
  });

  connection.on('disconnect', function() {
    fastify.log.debug('[fastify-rabbitmq] Connection to RabbitMQ Disconnected');
  });

  /**
   * Decorate Fastify
   */
  decorateFastifyInstance(fastify, {...connection})
})

export default fastifyRabbit
