import createError from '@fastify/error'

export const errors = {
  /**
   * Validation errors
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
  )
}
