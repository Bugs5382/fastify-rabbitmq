# Fastify RabbitMQ

A Fastify RabbitMQ Plugin Developed in Pure TypeScript.
It uses the [node-amqp-connection-manager](https://github.com/jwalton/node-amqp-connection-manager) plugin as a wrapper.

The build exports this to vaild ESM and CJS for ease of cross-compatibility. 

This comes right from the README on ```node-amqp-connection-manager```:

> Features
> * Automatically reconnect when your amqplib broker dies in a fire.
> * Round-robin connections between multiple brokers in a cluster.
> * If messages are sent while the broker is unavailable, queues messages in memory until we reconnect.
> * Supports both promises and callbacks (using promise-breaker)
> * Very un-opinionated library—a thin wrapper around amqplib.

## Table of Contents

1. [Install](#install)
2. [Basic Usage](#basic-usage)
3. [Full Documentation](#full-documentation)
   1. [Options](#options)
4. [Acknowledgements](#acknowledgements)
5. [License](#license)

## Install
```
npm i fastify-rabbitmq
```

Plugin includes all needed functions and exports from the ```amqplib``` library
without having to bring it into your project.

## Basic Usage
Register this as a plugin.
Make sure it is loaded before any ***routes*** are loaded.

### Quick Setup on the Server Side

```typescript
export default fp<FastifyRabbitMQOptions>((fastify, options, done) => {
  
   fastify.register(fastifyRabbit, {
      urLs: ['amqp://localhost']
   })

   fastify.rabbitmq.on('connect', function (result) {
      // on connect, do something here?
   });

   fastify.rabbitmq.on('disconnect', function (err) {
      // on disconnect, do something here?
   });

   const LISTEN_QUEUE_NAME = 'bar'

   // create the channel 'bar'
   fastify.rabbitmq.createChannel({
      name: LISTEN_QUEUE_NAME,
      setup: function(channel: Channel) {
         return Promise.all([
            channel.assertQueue(LISTEN_QUEUE_NAME, {durable: true}),
            channel.prefetch(1),
            channel.consume(LISTEN_QUEUE_NAME, onMessage)
         ]);
      }
   });

   const onMessage = function(data: ConsumeMessage) {
      const message = JSON.parse(data.content.toString());
      channelWrapper.ack(data);
   }
   
});
```

Within any "endpoint" function, or if you have access to ```fastify.rabbitmq``` you can then call:

```js
fastify.get('/rabbitmq', async (request, reply) => {
  const getChannel = fastify.rabbitmq.findChannel('bar');
  await getChannel?.sendToQueue('bar', {time: DATE})
})
```

Sending the time to another queue called ```bar``` from the queue ```foo````.

### Quick Setup on the Client Side

Using the above example server code above, up your plugin to register the plugin.
This could be on the same service as the server or another service all together.

```typescript
import {ConfirmChannel} from "amqplib";
import {FastifyInstance} from 'fastify';
import fp from "fastify-plugin";
import fastifyRabbit, {FastifyRabbitMQOptions} from "fastify-rabbitmq"

export default fp<FastifyRabbitMQOptions>((fastify, options, done) => {

  fastify.register(fastifyRabbit, {
    urLs: ['amqp://localhost']
  })

   const LISTEN_QUEUE_NAME = 'bar'

   // create the channel 'bar'
   const channelWrapper = fastify.rabbitmq.createChannel({
      name: LISTEN_QUEUE_NAME,
      setup: function(channel: Channel) {
         return Promise.all([
            channel.assertQueue(LISTEN_QUEUE_NAME, {durable: true}),
            channel.prefetch(1),
            channel.consume(LISTEN_QUEUE_NAME, onMessage)
         ]);
      }
   });

   const onMessage = function(data: ConsumeMessage) {
      const message = JSON.parse(data.content.toString());
      channelWrapper.ack(data);
   }
   
   done()
})
```
## Full Documentation

### Options

```typescript
export interface FastifyRabbitMQOptions extends FastifyPluginOptions {
   /**
    * Log Level for RabbitMQ Debugging
    */
   logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error'
   /**
    * Namespace
    */
   namespace?: string
   /**
    * Connection URLS for IAmqpConnectionManager
    */
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
to pass in credentials to the RabbitMQ or vHost for the connection review [connection options](#amqpconnectionmanageroptions).

Please review the options [here](https://github.com/jwalton/node-amqp-connection-manager/blob/master/src/AmqpConnectionManager.ts#L26C13-L26C34).
(Note:
This URL might bring you to the wrong line
if the file has been changed on the ```node-amqp-connection-manager``` package.)

#### ```AmqpConnectionManagerOptions```

See [Connection Options](https://github.com/jwalton/node-amqp-connection-manager#connecturls-options) for 'node-amqp-connection-manager' for detailed options that can be passed in.

## Acknowledgements

- [node-amqp-connection-manager](https://github.com/jwalton/node-amqp-connection-manager)
- [fastify](https://fastify.dev/)
- ... and my Wife and Baby Girl.

## License

Licensed under [MIT](./LICENSE).