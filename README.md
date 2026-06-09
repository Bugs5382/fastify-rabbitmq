# 🐰 Fastify RabbitMQ

A Fastify RabbitMQ plugin developed in pure TypeScript.
It wraps the [`rabbitmq-client`](https://www.npmjs.com/package/rabbitmq-client) package so a Fastify
app can publish, consume, and RPC over RabbitMQ (AMQP 0-9-1).

The build exports valid ESM and CJS for cross-compatibility.

If you use this package, please consider giving it a ⭐ — it raises visibility and brings in more
contribution from the outside.

> This documentation covers **how to use the plugin**. The decorator `app.rabbitmq` is a live
> `rabbitmq-client` `Connection`, so its full API is available — for publisher/consumer/RPC option
> details, see [External Libraries](#-external-libraries).

> 🟢 **Requires Node.js ≥ 20.15.**

## Table of Contents

1. [Install](#-install)
2. [Basic Usage](#-basic-usage)
3. [Recipes](#-recipes)
   1. [Publish a message](#1-publish-a-message)
   2. [Consume a queue](#2-consume-a-queue)
   3. [RPC (request/response)](#3-rpc-requestresponse)
   4. [Declare exchanges, queues, and bindings](#4-declare-exchanges-queues-and-bindings)
   5. [Multiple connections with namespaces](#5-multiple-connections-with-namespaces)
4. [API Reference](#-api-reference-fastifyrabbitmq)
5. [Plugin Options](#-plugin-options)
6. [External Libraries](#-external-libraries)
7. [Acknowledgements](#-acknowledgements)
8. [License](#-license)

## 📦 Install

```shell
npm install fastify-rabbitmq
```

Requires Node.js ≥ 20.15.

## 🚀 Basic Usage

Register the plugin (before any routes that use it):

```ts
import fastify from "fastify";
import fastifyRabbitMQ from "fastify-rabbitmq";

const app = fastify();

await app.register(fastifyRabbitMQ, {
  connection: "amqp://guest:guest@localhost",
});
```

Registering decorates the Fastify instance with `app.rabbitmq` — a live `rabbitmq-client`
`Connection`. Use it to create publishers, consumers, and RPC clients, or to declare topology.

## 🧩 Recipes

### 1. Publish a message

```ts
const publisher = app.rabbitmq.createPublisher({
  confirm: true,
  maxAttempts: 1,
});

await publisher.send("foo", "bar"); // routing key "foo", body "bar"
```

In a route, reach the instance via `request.server`:

```ts
app.get("/publish", async (request, reply) => {
  const publisher = request.server.rabbitmq.createPublisher({ confirm: true });
  await publisher.send("foo", "bar");
  return { sent: true };
});
```

### 2. Consume a queue

```ts
const consumer = app.rabbitmq.createConsumer(
  {
    queue: "foo",
    queueOptions: { durable: true },
  },
  async (msg) => {
    app.log.info({ body: msg.body }, "received");
    // ...handle the message...
  },
);
```

### 3. RPC (request/response)

```ts
const rpc = app.rabbitmq.createRPCClient({ confirm: true });
const response = await rpc.send("my-rpc-queue", "ping");
app.log.info({ response: response.body }, "rpc reply");
```

### 4. Declare exchanges, queues, and bindings

```ts
await app.rabbitmq.queueDeclare({ queue: "foo", durable: true });
await app.rabbitmq.exchangeDeclare({ exchange: "my-exchange", type: "topic" });
await app.rabbitmq.queueBind({
  queue: "foo",
  exchange: "my-exchange",
  routingKey: "foo.#",
});
```

### 5. Multiple connections with namespaces

To talk to more than one broker (or keep separate connections), register the plugin once per
`namespace`; each is reachable at `app.rabbitmq.<namespace>`:

```ts
await app.register(fastifyRabbitMQ, {
  connection: "amqp://guest:guest@broker-a",
  namespace: "a",
});
await app.register(fastifyRabbitMQ, {
  connection: "amqp://guest:guest@broker-b",
  namespace: "b",
});

const pubA = app.rabbitmq.a.createPublisher();
const pubB = app.rabbitmq.b.createPublisher();
```

Registering the same namespace twice throws `FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS`.

## 📖 API Reference (`fastify.rabbitmq`)

`app.rabbitmq` is a `rabbitmq-client` `Connection` (and, with namespaces, an index of them). The
methods you will use most:

| Method | Description |
|---|---|
| `createPublisher(options?)` | Create a `Publisher` (`.send(routingKey, body)`). |
| `createConsumer(options, handler)` | Create a `Consumer` bound to a queue; `handler(msg)` runs per message. |
| `createRPCClient(options?)` | Create an RPC client (`.send(queue, body)` returns the reply). |
| `exchangeDeclare(params)` | Declare an exchange. |
| `queueDeclare(params)` | Declare a queue. |
| `queueBind(params)` | Bind a queue to an exchange. |
| `acquire()` | Acquire a raw channel. |
| `ready()` | Resolve once the connection is established. |
| `close()` | Close the connection. |

The full option shapes for each come from `rabbitmq-client` — see [External Libraries](#-external-libraries).

## ⚙️ Plugin Options

Pass these to `app.register(fastifyRabbitMQ, options)`:

### `connection`

A connection string (e.g. `"amqp://guest:guest@localhost"`) or a `ConnectionOptions` object from
`rabbitmq-client` pointing at the broker. **Required.**

### `namespace`

`string` — register the plugin more than once by giving each instance a unique namespace; the
connection is then exposed at `app.rabbitmq.<namespace>`. Re-using a namespace fails to load.

## 🔌 External Libraries

This plugin documents only its own surface. For publisher/consumer/RPC options, connection options
(`ConnectionOptions`), TLS, and reconnect behavior, see the package it wraps:

- [`rabbitmq-client`](https://www.npmjs.com/package/rabbitmq-client) — the underlying AMQP client
  (repo: [cody-greene/node-rabbitmq-client](https://github.com/cody-greene/node-rabbitmq-client)).

## 🙏 Acknowledgements

- [`rabbitmq-client`](https://www.npmjs.com/package/rabbitmq-client)
- [Fastify](https://fastify.dev/)
- ...and my Wife and Baby Girl.

## 📄 License

Licensed under [MIT](./LICENSE).
