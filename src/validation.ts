import {errors} from './errors'

export const validateOpts = async (opts: any): Promise<void> => {
  // Mandatory
  if (typeof opts.urLs === 'undefined' && typeof opts.findServers === 'undefined') {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('urLs or findServers must be defined.')
  }

  // Mandatory
  if (typeof opts.urLs !== 'undefined' && opts.urLs.length < 1) {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('urLs must have one item in the array.')
  }

  // Optional
  if (typeof opts.heartbeatIntervalInSeconds !== 'undefined' && opts.heartbeatIntervalInSeconds < 0) {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('heartbeatIntervalInSeconds must be a valid number greater than or equal to 0.')
  }

  // Optional
  if (typeof opts.reconnectTimeInSeconds !== 'undefined' && opts.reconnectTimeInSeconds < 0) {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('reconnectTimeInSeconds must be a valid number greater than or equal to 0.')
  }

  // Optional
  if (typeof opts.enableRPC !== 'undefined' && typeof opts.enableRPC !== 'boolean') {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('enableRPC must be a boolean.')
  } else {
    if (typeof opts.namespace !== 'undefined' && opts.enableRPC) {
      throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('enableRPC right now can not be used in namespaced RabbitMQ instances.')
    }
  }
}
