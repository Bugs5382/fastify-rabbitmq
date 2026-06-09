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

const DECORATED_METHODS = [
  "acquire",
  "close",
  "createConsumer",
  "createPublisher",
  "createRPCClient",
  "exchangeDeclare",
  "queueDeclare",
  "queueBind",
  "ready",
];

describe("plugin fastify-rabbitmq tests", () => {
  describe("option validation", () => {
    test("rejects a missing options object", async () => {
      await expect(
        // @ts-expect-error registering with no options is a type error; this exercises the runtime validation.
        app.register(fastifyRabbit).ready(),
      ).rejects.toThrow("connection must be defined.");
    });

    test("rejects an undefined connection", async () => {
      await expect(
        // @ts-expect-error connection: undefined is not assignable; this exercises the runtime guard.
        app.register(fastifyRabbit, { connection: undefined }).ready(),
      ).rejects.toThrow("connection must be defined.");
    });

    test("rejects an empty connection string", async () => {
      await expect(
        app.register(fastifyRabbit, { connection: "" }).ready(),
      ).rejects.toThrow("connection string must not be empty.");
    });

    test("rejects a non-string, non-object connection (number)", async () => {
      await expect(
        // @ts-expect-error connection: 1 (a number) is not a valid type; this exercises the runtime validation.
        app.register(fastifyRabbit, { connection: 1 }).ready(),
      ).rejects.toThrow(
        "connection must be a connection string or a ConnectionOptions object.",
      );
    });

    test("rejects an array connection", async () => {
      await expect(
        // @ts-expect-error connection: [] (an array) is not a valid type; this exercises the runtime validation.
        app.register(fastifyRabbit, { connection: [] }).ready(),
      ).rejects.toThrow(
        "connection must be a connection string or a ConnectionOptions object.",
      );
    });

    test("rejects a null connection", async () => {
      await expect(
        // @ts-expect-error connection: null is not a valid type; this exercises the runtime validation.
        app.register(fastifyRabbit, { connection: null }).ready(), // eslint-disable-line unicorn/no-null -- exercising the guard against a null connection
      ).rejects.toThrow(
        "connection must be a connection string or a ConnectionOptions object.",
      );
    });
  });

  describe("duplicate registration", () => {
    test("rejects a second registration without a namespace", async () => {
      await app.register(fastifyRabbit, { connection: RABBITMQ_URL });
      await app.register(fastifyRabbit, { connection: RABBITMQ_URL });

      await expect(app.ready()).rejects.toThrow(
        new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS("Already registered.")
          .message,
      );
    });

    test("rejects re-using a namespace", async () => {
      await app.register(fastifyRabbit, {
        connection: RABBITMQ_URL,
        namespace: "error",
      });
      await app.register(fastifyRabbit, {
        connection: RABBITMQ_URL,
        namespace: "error",
      });

      await expect(app.ready()).rejects.toThrow(
        "Already registered with namespace: error",
      );
    });
  });

  describe("decorator", () => {
    test("exposes the rabbitmq-client Connection on app.rabbitmq", async () => {
      await app.register(fastifyRabbit, { connection: RABBITMQ_URL }).ready();

      for (const method of DECORATED_METHODS) {
        expect(app.rabbitmq).toHaveProperty(method);
      }

      await app.rabbitmq.close();
    });

    test("exposes the Connection under app.rabbitmq.<namespace>", async () => {
      await app
        .register(fastifyRabbit, {
          connection: RABBITMQ_URL,
          namespace: "unittest",
        })
        .ready();

      for (const method of DECORATED_METHODS) {
        expect(app.rabbitmq.unittest).toHaveProperty(method);
      }

      await app.rabbitmq.unittest.close();
    });
  });
});
