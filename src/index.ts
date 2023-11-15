import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { Connection as RabbitMQConnection } from 'rabbitmq-client'
import { FastifyRabbitMQOptions } from './decorate'
import { errors } from './errors'
import { validateOpts } from './validation'
export * from './types'

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

const fastifyRabbit = fp<FastifyRabbitMQOptions>(async (fastify, opts, done) => {
  await validateOpts(opts)

  const { connection } = opts

  const c = new RabbitMQConnection(connection)

  decorateFastifyInstance(fastify, opts, c)

  done()
})

export default fastifyRabbit
