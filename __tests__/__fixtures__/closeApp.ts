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
// Child-process fixture for __tests__/lifecycle.test.ts (#164). It registers
// the plugin, optionally waits for the broker, then calls only app.close().
// The test asserts that this process exits on its own: an open connection,
// retry timer, or unhandled 'error' event would keep it alive or crash it.
//
// Env:
//   FIXTURE_URL      connection string (a dead port for the no-broker case)
//   FIXTURE_WAIT     "connect" to wait for the broker, or a delay in ms
//   FIXTURE_NS       optional namespace
import fastify from "fastify";

import fastifyRabbit from "../../src";

const url = process.env.FIXTURE_URL ?? "amqp://guest:guest@localhost";
const wait = process.env.FIXTURE_WAIT ?? "connect";
const namespace = process.env.FIXTURE_NS;

const app = fastify({ logger: { level: "debug" } });

await app.register(fastifyRabbit, {
  connection: url,
  ...(namespace === undefined ? {} : { namespace }),
});
await app.ready();

const conn = namespace === undefined ? app.rabbitmq : app.rabbitmq[namespace];

if (wait === "connect") {
  await conn.onConnect(5000);
  console.log("FIXTURE connected");
} else {
  await new Promise((resolve) => setTimeout(resolve, Number(wait)));
}

await app.close();
console.log(`FIXTURE closed ready=${String(conn.ready)}`);
