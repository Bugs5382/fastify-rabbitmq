# Fastify RabbitMq

A Fastify RabbitMQ Plugin Developed in Pure TypeScript.
It uses the [node-amqp-connection-manager](https://github.com/jwalton/node-amqp-connection-manager)plugin as a wrapper.

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
   2. [Example](#example)

## Install
```
npm i fastify-rabbitmq amqplib
npm i --save-dev @types/amqplib
```

## Basic Usage
Register this as a plugin.
Make sure it is loaded before any ***routes*** are loaded.

Quick Setup on the Server Side:

```js

```

Quick Setup on the Client Side:

```js

```

Within server instance can also call the same queue as long as it has access to the ``fastify.rabbitmq`` decorator.
Traditionally, a separate app is running and is the client sending messages to the client.

## Full Documentation

### Options

```typescript
export interface FastifyRabbitMQOptions extends AmqpConnectionManagerOptions {
   logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error'
   namespace?: string
   urLs: ConnectionUrl | ConnectionUrl[] | undefined | null
}
```
#### FastifyRabbitMQOptions

##### `logLevel`

Set the log level for Fastify RabbitMQ plugin. This is usefull for development work. The default value is ```silent```

##### `namespace`

If you need more than one "connection" to a different set and/or array of RabbitMQ servers,
either on network or cloud, each registration of the plugin needs it to be in its own namespace.
If not provided, your application will fail to load.

##### `urLs`

This needs to be an array of the RabbitMQ host:

```js
fastify.register(fastifyRabbit, {
  urLs: ['amqp://localhost']
})
```

This is not needed
if you use AmqpConnectionManagerOptions [findServers](https://github.com/jwalton/node-amqp-connection-manager#connecturls-options)
which overrides the urls value if it's set.
If you need
to pass in credentials to the RabbitMQ or vHost for the connection review the [connection options](#amqpconnectionmanageroptions).

Please review the options [here](https://github.com/jwalton/node-amqp-connection-manager/blob/master/src/AmqpConnectionManager.ts#L26C13-L26C34).
(Note:
This URL might bring you to the wrong line
if the file has been changed on the ```node-amqp-connection-manager``` package.)

#### ```AmqpConnectionManagerOptions```

See [Connection Options](https://github.com/jwalton/node-amqp-connection-manager#connecturls-options) for 'node-amqp-connection-manager' for detailed options that can be passed in.

### Example

```typescript

```