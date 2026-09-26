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
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { Connection as RabbitMQConnection } from "rabbitmq-client";

import { FastifyRabbitMQOptions } from "./decorate";
import { errors } from "./errors";
import { validateOpts } from "./validation";
export { type FastifyRabbitMQOptions } from "./decorate";

/**
 * How we talk with Fastify
 * @since 1.0.0
 * @param fastify
 * @param options
 * @param connection
 */
const decorateFastifyInstance = (
  fastify: FastifyInstance,
  options: FastifyRabbitMQOptions,
  connection: any,
): void => {
  const { namespace = "" } = options;

  if (namespace !== undefined && namespace !== "") {
    fastify.log.debug("[fastify-rabbitmq] Namespace Attempt: %s", namespace);
  }
  if (namespace !== undefined && namespace !== "") {
    if (fastify.rabbitmq === undefined) {
      fastify.decorate("rabbitmq", Object.create(null));
    }

    if (fastify.rabbitmq[namespace] !== undefined) {
      throw new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS(
        `Already registered with namespace: ${namespace}`,
      );
    }

    fastify.log.trace(
      `[fastify-rabbitmq] Decorate Fastify with Namespace: ${namespace}`,
    );
    fastify.rabbitmq[namespace] = connection;
  } else {
    if (fastify.rabbitmq !== undefined) {
      throw new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS(
        "Already registered.",
      );
    }
  }

  if (fastify.rabbitmq === undefined) {
    fastify.log.trace("[fastify-rabbitmq] Decorate Fastify");
    fastify.decorate("rabbitmq", connection);
  }
};

/**
 * Main Function
 * @since 1.0.0
 * @example
 * This is the basics on how to use this plugin:
 * ```js
 * app.register(fastifyRabbit, {
 *  connection: 'amqp://guest:guest@localhost'
 * })
 * ```
 * This will allow you to read from your Fastify "object" and
 * use this plugin at the "rabbitmq" level. From there you can execute and maintain
 * the RabbitMQ Connection using the 'rabbitmq-client' package, which is wrapping around
 * this plugin to execute functions it provides.
 *
 * @see [https://cody-greene.github.io/node-rabbitmq-client/latest/index.html](https://cody-greene.github.io/node-rabbitmq-client/latest/index.html)
 *
 */
const fastifyRabbit = fp<FastifyRabbitMQOptions>(async (fastify, opts) => {
  await validateOpts(opts);

  const { connection, namespace = "" } = opts;
  // A label for log lines only. The connection string can carry credentials,
  // so it is never logged.
  const label = namespace === "" ? "(default)" : namespace;

  fastify.log.debug(
    "[fastify-rabbitmq] Creating connection for namespace %s",
    label,
  );
  const c = new RabbitMQConnection(connection);

  watchConnection(fastify, c, label);

  decorateFastifyInstance(fastify, opts, c);

  // Close the connection with the app (#164). Without this the socket (or the
  // reconnect timer, when the broker is down) keeps the process alive after
  // app.close(). Fastify runs onClose hooks last-registered first, and an app
  // adds its hooks after registering this plugin, so its consumers and
  // publishers have already released their channels when this runs.
  fastify.addHook("onClose", async () => {
    const started = Date.now();
    fastify.log.debug(
      "[fastify-rabbitmq] Closing connection for namespace %s",
      label,
    );
    try {
      await c.close();
      fastify.log.info(
        "[fastify-rabbitmq] Connection for namespace %s closed in %dms",
        label,
        Date.now() - started,
      );
    } catch (error) {
      fastify.log.error(
        { err: error },
        "[fastify-rabbitmq] Failed to close connection for namespace %s",
        label,
      );
    }
  });
});

/**
 * Log the connection's lifecycle events. The 'error' listener also keeps a
 * refused or dropped connection from becoming an unhandled 'error' event,
 * which would crash the process (#164). rabbitmq-client keeps retrying in the
 * background, so an error here is reported, not fatal.
 * @since 3.4.1
 * @param fastify
 * @param c
 * @param label
 */
const watchConnection = (
  fastify: FastifyInstance,
  c: RabbitMQConnection,
  label: string,
): void => {
  c.on("error", (err: unknown) => {
    fastify.log.error(
      { err },
      "[fastify-rabbitmq] RabbitMQ connection error for namespace %s",
      label,
    );
  });
  c.on("connection", () => {
    fastify.log.info(
      "[fastify-rabbitmq] RabbitMQ connection established for namespace %s",
      label,
    );
  });
  c.on("connection.blocked", (reason: string) => {
    fastify.log.warn(
      "[fastify-rabbitmq] RabbitMQ connection blocked for namespace %s: %s",
      label,
      reason,
    );
  });
  c.on("connection.unblocked", () => {
    fastify.log.info(
      "[fastify-rabbitmq] RabbitMQ connection unblocked for namespace %s",
      label,
    );
  });
};

export default fastifyRabbit;

export { decorateFastifyInstance };

export * from "./types";

// Re-export the rabbitmq-client surface so consumers import from this package
// instead of reaching for the wrapped client. These are the exact types the
// app.rabbitmq decorator hands back, so they stay correct without owning a
// parallel definition.
export type {
  AsyncMessage,
  Channel,
  Connection,
  ConnectionOptions,
  Consumer,
  ConsumerHandler,
  ConsumerProps,
  Envelope,
  HeaderFields,
  MessageBody,
  Publisher,
  PublisherProps,
  ReturnedMessage,
  RPCClient,
  RPCProps,
  SyncMessage,
} from "rabbitmq-client";
export {
  AMQPChannelError,
  AMQPConnectionError,
  AMQPError,
  ConsumerStatus,
} from "rabbitmq-client";
