import {FastifyRabbitMQOptions} from "./decorate";
import { errors } from './errors'

export const validateOpts = async (options: FastifyRabbitMQOptions): Promise<void> => {
  // Mandatory
  if (typeof options.urls === 'undefined' && typeof options.connectionOptions?.findServers === 'undefined') {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('options.findServers must be defined.')
  }

  // Mandatory
  if (typeof options.urls !== 'undefined') {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('urLs must be defined.')
  }

  // Mandatory
  if (typeof options.urls !== 'undefined') {
    if (typeof options.urls === 'object') {
      if (Array.isArray( options.urls)) {
        throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('urLs object must have more than than one item in the array.')
      }
    } else {
      throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('urLs must a valid string.')
    }
  }

  // Optional
  if (typeof options.connectionOptions?.heartbeatIntervalInSeconds !== 'undefined' && options.connectionOptions?.heartbeatIntervalInSeconds < 0) {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('options.heartbeatIntervalInSeconds must be a valid number greater than or equal to 0.')
  }

  // Optional
  if (typeof options.connectionOptions?.reconnectTimeInSeconds !== 'undefined' && options.connectionOptions?.reconnectTimeInSeconds < 0) {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('options.reconnectTimeInSeconds must be a valid number greater than 0.')
  }

  // Optional
  if (typeof options.enableRPC !== 'undefined') {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('enableRPC must be a boolean.')
  } else {
    if (typeof options.namespace !== 'undefined' && options.enableRPC === true) {
      throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('enableRPC right now can not be used in namespaced RabbitMQ instances.')
    }
  }
}
