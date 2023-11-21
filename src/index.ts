import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { ConnectionOptions, Connection as RabbitMQConnection } from 'rabbitmq-client'
import { FastifyRabbitMQOptions } from './decorate.js'
import { errors } from './errors.js'
import { validateOpts } from './validation.js'
export * from './types.js'

const decorateFastifyInstance = (fastify: FastifyInstance, options: FastifyRabbitMQOptions, connection: any): void => {
  const {
    namespace = ''
  } = options

  if (typeof namespace !== 'undefined') {
    fastify.log.debug('[fastify-rabbitmq] Namespace: %s', namespace)
  }
  if (typeof namespace !== 'undefined' && namespace !== '') {
    if (typeof fastify.rabbitmq === 'undefined') {
      fastify.decorate('rabbitmq', Object.create(null))
    }

    if (typeof fastify.rabbitmq[namespace] !== 'undefined') {
      throw new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS(`Already registered with namespace: ${namespace}`)
    }

    fastify.log.trace('[fastify-rabbitmq] Decorate Fastify with Namespace: %', namespace)
    fastify.rabbitmq[namespace] = connection
  } else {
    if (typeof fastify.rabbitmq !== 'undefined') {
      throw new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS('Already registered.')
    }
  }

  if (typeof fastify.rabbitmq === 'undefined') {
    fastify.log.trace('[fastify-rabbitmq] Decorate Fastify')
    fastify.decorate('rabbitmq', connection)
  }
}

/**
 * Main Function
 * @since 1.0.0
 * @example
 * This is the basics on how to use this plugin:
 * ```js
 * app.register(fastifyRabbit, {
 *  connection: 'amqp://guest:guest@localhost'
 * })
 * ```
 * This will allow you to read from your Fastify "object" and
 * use this plugin at the "rabbitmq" level. From there you can execute and maintain
 * the RabbitMQ Connection using the 'rabbitmq-client' package, which is wrapping around
 * this plugin to execute functions it provides.
 *
 * @see [https://cody-greene.github.io/node-rabbitmq-client/latest/index.html](https://cody-greene.github.io/node-rabbitmq-client/latest/index.html)
 *
 */
const fastifyRabbit = fp<FastifyRabbitMQOptions>(async (fastify, opts, done) => {
  await validateOpts(opts)

  const { connection } = opts

  const c = new RabbitMQConnection(connection)

  decorateFastifyInstance(fastify, opts, c)

  done()
})

export default fastifyRabbit

export { decorateFastifyInstance, FastifyRabbitMQOptions, ConnectionOptions }
