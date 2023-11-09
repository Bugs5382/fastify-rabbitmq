import createError from '@fastify/error'

export const errors = {
  /**
   * Validation Errors
   */
  FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS: createError(
    'FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS',
    'Invalid options: %s'
  ),

  /**
   * Setup Errors
   */
  FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS: createError(
    'FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS',
    'Setup error: %s'
  ),

  /**
   * Usage Errors
   */
  FASTIFY_RABBIT_MQ_ERR_USAGE: createError(
    'FASTIFY_RABBIT_MQ_ERR_USAGE',
    'Usage error: %s'
  )
}
