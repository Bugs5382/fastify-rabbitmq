import amqp, {ChannelWrapper} from "amqp-connection-manager"
import type {
  AmqpConnectionManager,
  AmqpConnectionManagerOptions,
  ConnectionUrl,
} from "amqp-connection-manager"
import { FastifyInstance, FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'

import FastifyRabbitMQOptions = fastifyRabbitMQ.FastifyRabbitMQOptions;
import FastifyRabbitMQObject = fastifyRabbitMQ.FastifyRabbitMQObject;

declare module 'fastify' {

  interface FastifyInstance {
    rabbitmq: FastifyRabbitMQObject & fastifyRabbitMQ.FastifyRabbitMQNestedObject
  }

}

type fastifyRabbitMQPlugin = FastifyPluginCallback<
  NonNullable<fastifyRabbitMQ.FastifyRabbitMQOptions>
>

declare namespace fastifyRabbitMQ {

  export interface FastifyRabbitMQObject extends AmqpConnectionManager {
    channel?: ChannelWrapper
  }

  export interface FastifyRabbitMQNestedObject {
    [namespace: string]: FastifyRabbitMQObject
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
 * @param options
 * @param connection
 */
const decorateFastifyInstance = (fastify: FastifyInstance, options: FastifyRabbitMQOptions, connection: any): void => {

  const {
   logLevel,
   namespace = ''
  } = options

  // override log level
  const logger = fastify.log.child({}, {level: logLevel})

  if (namespace) {
    logger.debug('[fastify-rabbitmq] Namespace: %s', namespace)
  }

  if (namespace) {
    if (!fastify.rabbitmq) {
      fastify.decorate('rabbitmq', connection)
    }
    if (fastify.rabbitmq[namespace]) {
      throw Error('[fastify-rabbitmq] Connection name already registered: ' + namespace)
    }
    logger.trace('[fastify-rabbitmq] Decorate Fastify with Namespace: %', namespace)
    fastify.rabbitmq[namespace] = connection
  } else {
    if (fastify.rabbitmq) {
      throw Error('[fastify-rabbitmq] Already registered')
    }
  }

  if (!fastify.rabbitmq) {
    logger.trace('[fastify-rabbitmq] Decorate Fastify')
    fastify.decorate('rabbitmq', connection )
  }
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
  const logger = fastify.log.child({}, {level: logLevel})

  const connection = amqp.connect(urLs, {
    heartbeatIntervalInSeconds,
    reconnectTimeInSeconds,
    findServers,
    connectionOptions
  })

  connection.on('connect', function() {
    logger.debug('[fastify-rabbitmq] Connection to RabbitMQ Successful');
  });

  connection.on('disconnect', function() {
    logger.debug('[fastify-rabbitmq] Connection to RabbitMQ Disconnected');
  });

  /**
   * Decorate Fastify
   */
  decorateFastifyInstance(fastify,  options, connection)
})

export default fastifyRabbit
