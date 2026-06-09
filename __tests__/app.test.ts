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
import { Consumer, Publisher, RPCClient } from "rabbitmq-client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import fastifyRabbit from "../src";
import { createDeferred, expectEvent, sleep } from "./__utils__/utils";

const RABBITMQ_URL = process.env.RABBITMQ_URL || `amqp://guest:guest@localhost`;

describe("fastify-rabbitmq sample app tests", () => {
  describe("no namespace", () => {
    let app: FastifyInstance;
    let sub: Consumer;
    let pub: Publisher | RPCClient;

    beforeEach(async () => {
      app = fastify();

      await app.register(fastifyRabbit, {
        connection: RABBITMQ_URL,
      });

      await app.listen();

      await app.ready();
    });

    afterEach(async () => {
      await pub.close();

      await sub.close();

      await app.rabbitmq.close();

      await app.close();
    });

    test("create/get sender  and receiver/listener (foo)", async () => {
      const LISTEN_QUEUE_NAME = "foo";

      const dfd = createDeferred<void>();

      await app.rabbitmq.queueDelete(LISTEN_QUEUE_NAME);

      sub = app.rabbitmq.createConsumer(
        {
          qos: { prefetchCount: 2 },
          queue: LISTEN_QUEUE_NAME,
          queueOptions: { durable: true },
        },
        async (msg: any) => {
          expect(msg.body.id).toBe(1);
          expect(msg.body.name).toBe("Alan Turing");
          dfd.resolve();
        },
      );

      await sleep(1);

      await expectEvent(sub, "ready");

      pub = app.rabbitmq.createPublisher({
        confirm: true,
        maxAttempts: 1,
      });

      await pub.send(LISTEN_QUEUE_NAME, { id: 1, name: "Alan Turing" });

      await dfd.promise;
    });

    test("rpc", async () => {
      const LISTEN_RPC_NAME = "fooRPC";

      await app.rabbitmq.queueDelete(LISTEN_RPC_NAME);

      sub = app.rabbitmq.createConsumer(
        {
          queue: LISTEN_RPC_NAME,
        },
        async (_req: any, reply: any) => {
          await reply("pong");
        },
      );

      await sleep(1);

      await expectEvent(sub, "ready");

      pub = app.rabbitmq.createRPCClient({ confirm: true });

      const res = await pub.send(LISTEN_RPC_NAME, "ping");

      expect(res.body).toBe("pong");
    });
  });

  describe("namespace", () => {
    let app: FastifyInstance;
    let sub: Consumer;
    let pub: Publisher | RPCClient;

    beforeEach(async () => {
      app = fastify();

      await app.register(fastifyRabbit, {
        connection: RABBITMQ_URL,
        namespace: "unittest",
      });

      await app.listen();

      await app.ready();
    });

    afterEach(async () => {
      await pub.close();

      await sub.close();

      await app.rabbitmq.unittest.close();

      await app.close();
    });

    test("create/get sender and receiver/listener (bar)", async () => {
      const LISTEN_QUEUE_NAME = "bar";

      const dfd = createDeferred<void>();

      await app.rabbitmq.unittest.queueDelete(LISTEN_QUEUE_NAME);

      sub = app.rabbitmq.unittest.createConsumer(
        {
          qos: { prefetchCount: 2 },
          queue: LISTEN_QUEUE_NAME,
          queueOptions: { durable: true },
        },
        async (msg: any) => {
          expect(msg.body.id).toBe(1);
          expect(msg.body.name).toBe("Alan Turing");
          dfd.resolve();
        },
      );

      await sleep(1);

      await expectEvent(sub, "ready");

      pub = app.rabbitmq.unittest.createPublisher({
        confirm: true,
        maxAttempts: 1,
      });

      await pub.send(LISTEN_QUEUE_NAME, { id: 1, name: "Alan Turing" });

      await dfd.promise;
    });

    test("rpc", async () => {
      const LISTEN_RPC_NAME = "fooRPC";

      await app.rabbitmq.unittest.queueDelete(LISTEN_RPC_NAME);

      sub = app.rabbitmq.unittest.createConsumer(
        {
          queue: LISTEN_RPC_NAME,
        },
        async (_req: any, reply: any) => {
          await reply("pong");
        },
      );

      await sleep(1);

      await expectEvent(sub, "ready");

      pub = app.rabbitmq.unittest.createRPCClient({ confirm: true });

      const res = await pub.send(LISTEN_RPC_NAME, "ping");

      expect(res.body).toBe("pong");
    });
  });
});
