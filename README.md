# Fastify RabbitMq
A Fastify RabbitMQ Plugin Developed in Pure TypeScript. Providing a lot more expandability on the ```amqplib``` package and RabbitMQ functionally.

## Notice

This NPM package is still going **active development** so things will break. Review the issues list for on going development work and if you want to help out, submit a PR.

Help Wanted:
* Documentation
* GitHub Workflows
* Unit Testing using Jest

## Table of Contents

1. [Install](#install)
2. [Basic Usage](#basic-usage)
3. [Documentation](#full-documentation)
   1. [Options](#options)
      1. [host](#host)
      2. [port](#port)
      3. [username](#username)
      4. [password](#password)
   2. [Methods](#methods)
      1. [createBind](#createbind)
      2. [createBindRPC](#createbindrpc)

## Install
```
npm i fastify-rabbitmq
```

## Basic Usage
Register this as a plugin.
Make sure it is loaded before any ***routes*** are loaded.

Quick Setup on the Server Side:

```js
import fastifyRabbit from "fastify-rabbitmq"

fastify.register(fastifyRabbit)

fastify.ready().then(async () => {

  await fastify.rabbitmq.createBind('foo', async (message, channel: Channel) => {

    fastify.log.debug('[Process Bind:] foo')

    if (!message) {
      return
    }

    // parse rabbitmq message 
    let data = JSON.parse(message.content.toString())

    fastify.log.debug('[Incoming:] %s', data)
  
    // *** your logic here ***
    
  })
})
```

Quick Setup on the Client Side:

```js
import fastifyRabbit from "fastify-rabbitmq"

fastify.register(fastifyRabbit)

fastify.ready().then(async () => {

  // Note: Must return a string. So if your "message" is an object, your must JSON.stringify the result in the message processing function. 
  fastify.rabbitmq.publishMessage('foo', "bar", (message) => { return message; } )
  
})
```
Within server instance can also call the same queue as long as it has access to the ``fastify.rabbitmq`` decorator.
Traditionally, a separate app is running and is the client sending messages to the client.

## Full Documentation

### Options

```typescript
export interface FastifyRabbitMQOptions {
  host?: string
  namespace?: string
  password?: string
  port?: string
  username?: string
}
```

#### `host`

By default, it's ```localhost``` but pass your RabbitMQ server hostname or IP address.

#### `port`

By default it's ```5672``` but pass your RabbitMQ port.

#### `username`

By default, it's ```guest``` but pass your RabbitMQ username.

#### `password`

By default, it's ```guest``` but pass your RabbitMQ password.

### Methods

#### createBind

Your basic queue generator for your server instance.

```js
/**
 * createBind
 * @param queue {string} Name ot the queue to create.
 * @param consumeMessageFn {function} A function that passes on amqplib message and channel which will be processed when this queue gets a message. 
 */
createBind: (queue: string, consumeMessageFn: (message: ConsumeMessage | null, channel: Channel) => void) => Promise<void>
```

##### Example

```typescript
await fastify.rabbitmq.createBind('foo', async (message, channel: Channel) => {

  fastify.log.debug('[Process Bind:] foo')

  if (!message) {
    return
  }

  // parse rabbitmq message 
  let data = JSON.parse(message.content.toString())

  fastify.log.debug('[Incoming:] %s', data)

  const options: any = {
    json: {
      ...data
    },
  };
  
  const {body} = await got.post(`http://localhost:3000/hello`, options)

})
```

#### createBindRPC

Creating a Remote Procedure Call (RPC) queue.
If you name your RPC queue "foo" it will auto add "-rpc" to the end to the queue name in RabbitMQ.
These queues are designed
to make a sure message designed for this queue send back the result to the origin client call and no one else.
The result must be a string.

```js
/**
 * createBindRPC
 * @param queue {string} Name ot the queue to create.
 * @param consumeMessageFn {function} A function that passes on amqplib message and channel which will be processed when this queue gets a message. You return a string result that the client would get back.
 */
createBindRPC: (queue: string, consumeMessageFn: (message: ConsumeMessage | null, channel: Channel) => void) => Promise<void>
```
##### Example

```typescript
await fastify.rabbitmq.createBindRPC('foo', async (message, channel: Channel) => {

  fastify.log.debug('[Process Bind:] foo')

  if (!message) {
    return
  }

  // parse rabbitmq message 
  let data = JSON.parse(message.content.toString())

  fastify.log.debug('[Incoming:] %s', data)

  const options: any = {
    json: {
      ...data
    },
  };

  const {body} = await got.post(`http://localhost:3000/hello`, options)
  
  // You can here use JSON.stringify to send back an object. Just make sure on the client you JSON.parse the information.
  return JSON.stringify(body)

})
```