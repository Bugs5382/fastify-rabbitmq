import { Channel, ConfirmChannel } from 'amqplib'
import amqp, {
  AmqpConnectionManager,
  AmqpConnectionManagerOptions,
  ChannelWrapper,
  ConnectionUrl
} from 'amqp-connection-manager'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import {errors} from "./errors";
import {validateOpts} from "./validation";

import FastifyRabbitMQOptions = fastifyRabbitMQ.FastifyRabbitMQOptions
import FastifyRabbitMQObject = fastifyRabbitMQ.FastifyRabbitMQObject

declare module 'fastify' {

  interface FastifyInstance {
    rabbitmq: FastifyRabbitMQObject & fastifyRabbitMQ.FastifyRabbitMQNestedObject
  }

}

declare namespace fastifyRabbitMQ {

  export interface FastifyRabbitMQObject extends AmqpConnectionManager {
    channel?: ChannelWrapper
  }

  export interface FastifyRabbitMQNestedObject {
    [namespace: string]: FastifyRabbitMQObject
  }

  export type FastifyRabbitMQOptions = AmqpConnectionManagerOptions & {
    logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error'
    namespace?: string
    urLs: ConnectionUrl | ConnectionUrl[] | undefined | null
  }

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
    logLevel = 'silent',
    namespace = ''
  } = options

  // override log level
  const logger = fastify.log.child({}, { level: logLevel })

  if (typeof namespace !== 'undefined') {
    logger.debug('[fastify-rabbitmq] Namespace: %s', namespace)
  }

  if (namespace !== '') {
    if (typeof fastify.rabbitmq === 'undefined') {
      fastify.decorate('rabbitmq', connection)
    }
    if (fastify.rabbitmq[namespace] != null) {
      throw new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS(`Already registered with namespace: ${namespace}`)
    }
    logger.trace('[fastify-rabbitmq] Decorate Fastify with Namespace: %', namespace)
    fastify.rabbitmq[namespace] = connection
  } else {
    if (typeof fastify.rabbitmq !== 'undefined') {
      throw new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS('Already registered.')
    }
  }

  if (typeof fastify.rabbitmq === 'undefined') {
    logger.trace('[fastify-rabbitmq] Decorate Fastify')
    fastify.decorate('rabbitmq', connection)
  }
}

const fastifyRabbit = fp<FastifyRabbitMQOptions>( async (fastify, options) => {

  // validate
  await validateOpts(options)

  const {
    logLevel = 'silent',
    urLs,
    heartbeatIntervalInSeconds,
    reconnectTimeInSeconds,
    findServers,
    connectionOptions
  } = options

  // override log level
  const logger = fastify.log.child({}, { level: logLevel })

  const connection = amqp.connect(urLs, {
    heartbeatIntervalInSeconds,
    reconnectTimeInSeconds,
    connectionOptions,
    findServers,
  })

  connection.on('connect', function () {
    logger.debug('[fastify-rabbitmq] Connection to RabbitMQ Successful')
  })

  connection.on('connectFailed', function () {
    logger.debug('[fastify-rabbitmq] Connection to RabbitMQ Connection Failed')
  })

  connection.on('close', function () {
    logger.debug('[fastify-rabbitmq] Connection to RabbitMQ Closed')
  })

  connection.on('disconnect', function () {
    logger.debug('[fastify-rabbitmq] Connection to RabbitMQ Disconnected')
  })

  connection.on('blocked', function () {
    logger.debug('[fastify-rabbitmq] Connection to RabbitMQ Blocked')
  })

  connection.on('unblocked', function () {
    logger.debug('[fastify-rabbitmq] Connection to RabbitMQ Un-Blocked')
  })

  /**
   * Decorate Fastify
   */
  decorateFastifyInstance(fastify, options, connection)
})

export { Channel, ConfirmChannel }
export default fastifyRabbit
