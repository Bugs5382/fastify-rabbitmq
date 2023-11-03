import {errors} from "./errors";

export const validateOpts =  async (opts: any) => {
  // Mandatory
  if (typeof opts.urLs == 'undefined' && typeof opts.findServers == 'undefined') {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('urLs or undefined must be defined.')
  }

  // Mandatory
  if (typeof opts.urLs !== 'undefined' && opts.urLs.length < 1) {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('urLs must have one item in the array.')
  }

  // Optional
  if (typeof opts.heartbeatIntervalInSeconds !== 'undefined' && typeof opts.heartbeatIntervalInSeconds !== 'number' && opts.heartbeatIntervalInSeconds > 0) {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('heartbeatIntervalInSeconds must be a valid number greater than 0.')
  }

  // Optional
  if (typeof opts.reconnectTimeInSeconds !== 'undefined' && typeof opts.reconnectTimeInSeconds !== 'number' && opts.reconnectTimeInSeconds > 0) {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('reconnectTimeInSeconds must be a valid number greater than 0.')
  }
}
