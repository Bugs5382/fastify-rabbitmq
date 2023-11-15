import createError from '@fastify/error'

export const errors = {
  FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS: createError(
    'FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS',
    'Invalid options: %s'
  ),
  FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS: createError(
    'FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS',
    'Setup error: %s'
  ),
  FASTIFY_RABBIT_MQ_ERR_USAGE: createError(
    'FASTIFY_RABBIT_MQ_ERR_USAGE',
    'Usage error: %s'
  )
}
