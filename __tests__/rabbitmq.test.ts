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
import fastify, { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import fastifyRabbit from "../src";
import { errors } from "../src/errors";

let app: FastifyInstance;

const RABBITMQ_URL = process.env.RABBITMQ_URL || `amqp://guest:guest@localhost`;

beforeEach(() => {
  app = fastify();
});

afterEach(async () => {
  await app.close();
});

describe("plugin fastify-rabbitmq tests", () => {
  describe("registration tests", () => {
    test("register - error out - no urls", async () => {
      try {
        // @ts-expect-error registering with no options is a type error; this exercises the runtime validation.
        await app.register(fastifyRabbit);
      } catch (error) {
        expect(error).toEqual(
          new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS(
            "connection or findServers must be defined.",
          ),
        );
      }
    });

    test("register - error out - connection not defined", async () => {
      try {
        // @ts-expect-error connection: undefined is not assignable; this exercises the runtime guard.
        await app.register(fastifyRabbit, { connection: undefined });
      } catch (error) {
        expect(error).toEqual(
          new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS(
            "connection or findServers must be defined.",
          ),
        );
      }
    });

    test("register - error out - urls is not a string", async () => {
      try {
        // @ts-expect-error connection: 1 (a number) is not a valid type; this exercises the runtime validation.
        await app.register(fastifyRabbit, {
          connection: 1,
        });
      } catch (error) {
        expect(error).toEqual(
          new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS(
            "urls must be defined.",
          ),
        );
      }
    });

    test("register - error out - urls less than 0", async () => {
      try {
        // @ts-expect-error connection: [] (an array) is not a valid type; this exercises the runtime validation.
        await app.register(fastifyRabbit, {
          connection: [],
        });
      } catch (error) {
        expect(error).toEqual(
          new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS(
            "urls must contain one or more item in the array.",
          ),
        );
      }
    });
  });

  describe("sanity checks", () => {
    test("register - can't be registered twice", async () => {
      try {
        await app.register(fastifyRabbit, {
          connection: RABBITMQ_URL,
        });

        await app.register(fastifyRabbit, {
          connection: RABBITMQ_URL,
        });
      } catch (error) {
        expect(error).toEqual(
          new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS("Already registered."),
        );
      }
    });

    test("register - can't be registered twice - namespace", async () => {
      try {
        await app.register(fastifyRabbit, {
          connection: RABBITMQ_URL,
          namespace: "error",
        });

        await app.register(fastifyRabbit, {
          connection: RABBITMQ_URL,
          namespace: "error",
        });
      } catch (error) {
        expect(error).toEqual(
          new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS(
            "Already registered with namespace: error",
          ),
        );
      }
    });
  });

  describe("common action tests", () => {
    test("ensure basic properties are accessible", async () => {
      try {
        await app.register(fastifyRabbit, {
          connection: "amqp://guest:guest@localhost",
        });
        expect(app.rabbitmq).toHaveProperty("acquire");
        expect(app.rabbitmq).toHaveProperty("close");
        expect(app.rabbitmq).toHaveProperty("createConsumer");
        expect(app.rabbitmq).toHaveProperty("createPublisher");
        expect(app.rabbitmq).toHaveProperty("createRPCClient");
        expect(app.rabbitmq).toHaveProperty("exchangeDeclare");
        expect(app.rabbitmq).toHaveProperty("queueDeclare");
        expect(app.rabbitmq).toHaveProperty("queueBind");
        expect(app.rabbitmq).toHaveProperty("ready");

        await app.rabbitmq.close();
      } catch {
        /* should not error */
      }
    });

    test("ensure basic properties are accessible via namespace", async () => {
      try {
        await app
          .register(fastifyRabbit, {
            connection: RABBITMQ_URL,
            namespace: "unittest",
          })
          .ready()
          .then(async () => {
            expect(app.rabbitmq.unittest).toHaveProperty("acquire");
            expect(app.rabbitmq.unittest).toHaveProperty("close");
            expect(app.rabbitmq.unittest).toHaveProperty("createConsumer");
            expect(app.rabbitmq.unittest).toHaveProperty("createPublisher");
            expect(app.rabbitmq.unittest).toHaveProperty("createRPCClient");
            expect(app.rabbitmq.unittest).toHaveProperty("exchangeDeclare");
            expect(app.rabbitmq.unittest).toHaveProperty("queueDeclare");
            expect(app.rabbitmq.unittest).toHaveProperty("queueBind");
            expect(app.rabbitmq.unittest).toHaveProperty("ready");
          });

        await app.rabbitmq.unittest.close();
      } catch {
        /* should not error */
      }
    });

    test("register with log level: debug", async () => {
      try {
        await app
          .register(fastifyRabbit, {
            connection: RABBITMQ_URL,
            logLevel: "debug",
          })
          .ready()
          .then(async () => {
            expect(app.rabbitmq.unittest).toHaveProperty("createConsumer");
            await app.rabbitmq.close();
          });
      } catch {
        /* should not error */
      }
    });

    test("register with log level: trace", async () => {
      try {
        await app
          .register(fastifyRabbit, {
            connection: RABBITMQ_URL,
            logLevel: "trace",
          })
          .ready()
          .then(async () => {
            expect(app.rabbitmq.unittest).toHaveProperty("createConsumer");
            await app.rabbitmq.close();
          });
      } catch {
        /* should not error */
      }
    });
  });
});
