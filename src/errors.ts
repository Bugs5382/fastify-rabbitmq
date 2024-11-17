import createError from "@fastify/error";

export const errors = {
  /** Error if there is an invalid option used during registration. */
  FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS: createError(
    "FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS",
    "Invalid options: %s",
  ),
  /** Error if there is an setup error of the plugin itself. */
  FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS: createError(
    "FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS",
    "Setup error: %s",
  ),
  /** If an invalid usage error was done, this error would pop up. */
  FASTIFY_RABBIT_MQ_ERR_USAGE: createError(
    "FASTIFY_RABBIT_MQ_ERR_USAGE",
    "Usage error: %s",
  ),
};
