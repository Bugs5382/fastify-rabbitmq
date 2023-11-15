import { FastifyRabbitMQOptions } from './decorate'
import { errors } from './errors'

export const validateOpts = async (options: FastifyRabbitMQOptions): Promise<void> => {
  // Mandatory
  if (typeof options.connection === 'undefined') {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('connection or findServers must be defined.')
  }

  // Mandatory
  if (typeof options.connection !== 'undefined') {
    if (typeof options.connection !== 'object') {
      // we need to do some sort of check here to make sure RabbitMQOptions is "valid"
    }
  }
}
