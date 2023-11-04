import { Channel, ConfirmChannel } from 'amqplib'
import amqp from 'amqp-connection-manager'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { errors } from './errors'
import { validateOpts } from './validation'
import { AmqpConnectionManager, ConnectionUrl } from 'amqp-connection-manager'
import { FastifyPluginOptions } from 'fastify'

declare module 'fastify' {

  interface FastifyInstance {
    /**
     * RabbitMQ Connection
     */
    rabbitmq: AmqpConnectionManager & fastifyRabbitMQ.FastifyRabbitMQAmqpNestedObject
  }

}

declare namespace fastifyRabbitMQ {

  export interface FastifyRabbitMQAmqpNestedObject {
    /**
     * Nested Namespace
     */
    [namespace: string]: AmqpConnectionManager
  }

  export interface FastifyRabbitMQOptions extends FastifyPluginOptions {
    /**
     * Log Level for RabbitMQ Debugging
     */
    logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error'
    /**
     * Namespace
     */
    namespace?: string
    /**
     * Connection URLS for AmqpConnectionManager
     */
    urLs: ConnectionUrl | ConnectionUrl[] | undefined | null
  }

}

import FastifyRabbitMQOptions = fastifyRabbitMQ.FastifyRabbitMQOptions

/**
 * decorateFastifyInstance
 * @since 1.0.0
 * @param fastify
 * @param options
 * @param decorateOptions
 */
const decorateFastifyInstance = (fastify: FastifyInstance, options: FastifyRabbitMQOptions, decorateOptions: any): void => {
  const { connection } = decorateOptions

  const {
    logLevel = 'silent',
    namespace = ''
  } = options

  // override log level
  const logger = fastify.log.child({}, { level: logLevel })

  if (typeof namespace !== 'undefined') {
    logger.debug('[fastify-rabbitmq] Namespace: %s', namespace)
  }

  if (typeof namespace !== 'undefined' && namespace !== '') {
    if (typeof fastify.rabbitmq !== 'undefined' && typeof fastify.rabbitmq[namespace] !== 'undefined') {
      throw new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS(`Already registered with namespace: ${namespace}`)
    }

    logger.trace('[fastify-rabbitmq] Decorate Fastify with Namespace: %', namespace)

    fastify.decorate('rabbitmq', {
      ...fastify.rabbitmq,
      [namespace]: connection
    })
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

const fastifyRabbit = fp<FastifyRabbitMQOptions>(async (fastify, options, done) => {
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
    findServers
  })

  connection.on('connect', function () {
    logger.debug('[fastify-rabbitmq] Connection to RabbitMQ Successful')
  })

  connection.on('connectFailed', function () {
    logger.debug('[fastify-rabbitmq] Connection to RabbitMQ Connection Failed')
  })

  /**
   * Decorate Fastify
   */
  decorateFastifyInstance(fastify, options, { connection })

  done()
})

export { Channel, ConfirmChannel }
export default fastifyRabbit
