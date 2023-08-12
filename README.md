# Fastify RabbitMq

A Fastify RabbitMQ Plugin Developed in Pure TypeScript.
It uses the [node-amqp-connection-manager](https://github.com/jwalton/node-amqp-connection-manager) plugin as a wrapper.

This comes right from the README on ```node-amqp-connection-manager```:

> Features
> * Automatically reconnect when your amqplib broker dies in a fire.
> * Round-robin connections between multiple brokers in a cluster.
> * If messages are sent while the broker is unavailable, queues messages in memory until we reconnect.
> * Supports both promises and callbacks (using promise-breaker)
> * Very un-opinionated library—a thin wrapper around amqplib.

## Notice

This NPM package is still going **active development** so things will break. Review the issues list for on going development work and if you want to help out, submit a PR.

Help Wanted:
* Documentation
* GitHub Workflows
* Unit Testing using Jest

## Table of Contents

1. [Notice](#notice)
2. [Install](#install)
2. [Basic Usage](#basic-usage)
3. [Full Documentation](#full-documentation)
   1. [Options](#options)
4. [Acknowledgements](#acknowledgements)
5. [License](#license)

## Install
```
npm i fastify-rabbitmq amqplib
npm i --save-dev @types/amqplib
```

## Basic Usage
Register this as a plugin.
Make sure it is loaded before any ***routes*** are loaded.

### Quick Setup on the Server Side

```typescript
export default fp<any>(async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  
   fastify.register(fastifyRabbit, {
      urLs: ['amqp://localhost']
   })

   fastify.ready().then(async () => {
      fastify.log.debug('[rabbitmq] Started RabbitMQ')
      fastify.rabbitmq.channel = fastify.rabbitmq.createChannel({
         json: true,
         setup: function (channel: ConfirmChannel) {
            return Promise.all([
               channel.assertQueue('server', {durable: true}),
               channel.prefetch(1),
               channel.consume('server', async (message) => {
                  fastify.log.debug(JSON.stringify(data))
                  fastify.rabbitmq.channel?.ack(message);
               })
            ]);
         },
      })
   })
   
});
```

Within server instance can also call the same queue as long as it has access to the ``fastify.rabbitmq`` decorator.
Traditionally, a separate app is running and is the client sending messages to the client.

### Quick Setup on the Client Side

First set up your plugin to register the plugin.

```typescript
import {ConfirmChannel} from "amqplib";
import {
   FastifyInstance,
   FastifyPluginOptions,
} from 'fastify';
import fp from "fastify-plugin";
import fastifyRabbit from "fastify-rabbitmq"

export default fp<any>(async (fastify: FastifyInstance, options: FastifyPluginOptions) => {

  fastify.register(fastifyRabbit, {
    urLs: ['amqp://localhost']
  })

  fastify.ready().then(async () => {

    fastify.rabbitmq.channel = fastify.rabbitmq.createChannel({
      json: true,
      setup: function (channel: ConfirmChannel) {
        return channel.assertQueue('client', { durable: true });
      }
    });

  })

})
```

Now in your routes or anywhere the fastify.rabbitmq can be accessed:

```typescript
fastify.get('/rabbitmq', {}, async (request, reply) => {
   try {
      fastify.rabbitmq.channel?.sendToQueue('server', { foo: 'bar'})
      return reply.code(200).send({ result: true});
   } catch (error) {
      return reply.send(404);
   }
});
```

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

```typescript
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

## Acknowledgements

- [node-amqp-connection-manager](https://github.com/jwalton/node-amqp-connection-manager)
- [fastify](https://fastify.dev/)
- ...and of course my Wife and Baby Girl.

## License

Licensed under [MIT](./LICENSE).