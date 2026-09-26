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
import fastify from "fastify";
import { spawn } from "node:child_process";
import path from "node:path";
import { Writable } from "node:stream";
import { describe, expect, test } from "vitest";

import fastifyRabbit from "../src";

// Connection lifecycle (#164): app.close() must close the connection the
// plugin opened, and connection errors must be handled instead of crashing
// the process when no broker is reachable.

const RABBITMQ_URL = process.env.RABBITMQ_URL || `amqp://guest:guest@localhost`;
// Nothing listens on port 1, so every connect attempt is refused.
const DEAD_URL = "amqp://guest:guest@127.0.0.1:1";

const ROOT = path.resolve(__dirname, "..");
const FIXTURE = path.join(__dirname, "__fixtures__", "closeApp.ts");
const VITE_NODE = path.join(ROOT, "node_modules", "vite-node", "vite-node.mjs");

interface RunResult {
  code: null | number;
  signal: NodeJS.Signals | null;
  stderr: string;
  stdout: string;
  timedOut: boolean;
}

/** A Fastify logger that keeps every JSON log line for assertions. */
function captureLogs(): { lines: any[]; stream: Writable } {
  const lines: any[] = [];
  const stream = new Writable({
    write(chunk, _enc, done) {
      for (const line of String(chunk).split("\n")) {
        if (line.trim() !== "") lines.push(JSON.parse(line));
      }
      done();
    },
  });
  return { lines, stream };
}

/** Run the fixture in its own Node process and report how it ended. */
async function runFixture(
  env: Record<string, string>,
  timeoutMs = 15_000,
): Promise<RunResult> {
  return await new Promise((resolve) => {
    const child = spawn(process.execPath, [VITE_NODE, FIXTURE], {
      cwd: ROOT,
      env: { ...process.env, ...env },
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    child.stdout.on("data", (chunk) => (stdout += String(chunk)));
    child.stderr.on("data", (chunk) => (stderr += String(chunk)));
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);
    child.on("exit", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, stderr, stdout, timedOut });
    });
  });
}

async function waitFor(check: () => boolean, timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("condition not met in time");
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

describe("connection lifecycle", () => {
  describe("with a broker", () => {
    test("app.close() closes the connection", async () => {
      const app = fastify();
      await app.register(fastifyRabbit, { connection: RABBITMQ_URL });
      await app.ready();
      await app.rabbitmq.onConnect(5000);
      expect(app.rabbitmq.ready).toBe(true);

      await app.close();

      expect(app.rabbitmq.ready).toBe(false);
    });

    test("app.close() closes every namespaced connection", async () => {
      const app = fastify();
      await app.register(fastifyRabbit, {
        connection: RABBITMQ_URL,
        namespace: "one",
      });
      await app.register(fastifyRabbit, {
        connection: RABBITMQ_URL,
        namespace: "two",
      });
      await app.ready();
      await app.rabbitmq.one.onConnect(5000);
      await app.rabbitmq.two.onConnect(5000);

      await app.close();

      expect(app.rabbitmq.one.ready).toBe(false);
      expect(app.rabbitmq.two.ready).toBe(false);
    });

    test("an app that closes its own consumer and publisher in onClose still closes", async () => {
      // The README "Encapsulate messaging" recipe: the app's onClose closes
      // its consumer and publisher, and the plugin closes the connection.
      const app = fastify();
      await app.register(fastifyRabbit, { connection: RABBITMQ_URL });
      const publisher = app.rabbitmq.createPublisher({ confirm: true });
      const consumer = app.rabbitmq.createConsumer(
        { queue: "lifecycle", queueOptions: { exclusive: true } },
        async () => {},
      );
      app.addHook("onClose", async () => {
        await consumer.close();
        await publisher.close();
      });
      await app.ready();
      await app.rabbitmq.onConnect(5000);

      await app.close();

      expect(app.rabbitmq.ready).toBe(false);
    });

    test("the process exits after app.close()", async () => {
      const res = await runFixture({
        FIXTURE_URL: RABBITMQ_URL,
        FIXTURE_WAIT: "connect",
      });

      expect(res.timedOut, res.stderr).toBe(false);
      expect(res.code, res.stderr).toBe(0);
      expect(res.stdout).toContain("FIXTURE connected");
      expect(res.stdout).toContain("FIXTURE closed ready=false");
    }, 20_000);
  });

  describe("without a broker", () => {
    test("a connection error is logged, not thrown", async () => {
      const { lines, stream } = captureLogs();
      const app = fastify({ logger: { level: "debug", stream } });
      await app.register(fastifyRabbit, { connection: DEAD_URL });
      await app.ready();

      await waitFor(() =>
        lines.some((l) => l.level === 50 && /connection error/.test(l.msg)),
      );

      await app.close();

      const errorLine = lines.find(
        (l) => l.level === 50 && /connection error/.test(l.msg),
      );
      expect(errorLine.err).toBeDefined();
      expect(app.rabbitmq.ready).toBe(false);
    });

    test("the process neither crashes nor hangs", async () => {
      const res = await runFixture({
        FIXTURE_URL: DEAD_URL,
        FIXTURE_WAIT: "500",
      });

      expect(res.timedOut, res.stderr).toBe(false);
      expect(res.code, res.stdout + res.stderr).toBe(0);
      expect(res.stdout).toContain("connection error");
      expect(res.stdout).toContain("FIXTURE closed ready=false");
    }, 20_000);
  });
});
