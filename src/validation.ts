/*
MIT License

Copyright (c) 2026 Shane Froebel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/
import { FastifyRabbitMQOptions } from "./decorate";
import { errors } from "./errors";

/**
 * Validate Options
 *
 * The plugin validates only the *shape* of `connection` -- that it is a
 * non-empty connection string or a `ConnectionOptions` object. Parsing the URL
 * and validating the broker options (hosts, TLS, reconnect, etc.) is delegated
 * to `rabbitmq-client`. The shape guard exists because `new Connection(...)`
 * accepts garbage (a number, an array, `null`, `{}`) without throwing and then
 * silently fails to connect at runtime; rejecting it here surfaces a clear
 * registration-time error instead.
 * @since 1.0.0
 * @param options
 */
export const validateOpts = async (
  options: FastifyRabbitMQOptions,
): Promise<void> => {
  const { connection } = options;

  // Mandatory
  if (connection === undefined) {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS(
      "connection must be defined.",
    );
  }

  if (typeof connection === "string") {
    if (connection.length === 0) {
      throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS(
        "connection string must not be empty.",
      );
    }
    return;
  }

  const isConnectionOptions =
    typeof connection === "object" &&
    connection !== null &&
    !Array.isArray(connection);

  if (!isConnectionOptions) {
    throw new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS(
      "connection must be a connection string or a ConnectionOptions object.",
    );
  }
};
