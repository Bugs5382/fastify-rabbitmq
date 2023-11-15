# Fastify RabbitMQ

A Fastify RabbitMQ Plugin Developed in Pure TypeScript.
It uses the [rabbitmq-client](https://github.com/jwalton/node-amqp-connection-manager) plugin as a wrapper.

The build exports this to valid ESM and CJS for ease of cross-compatibility.

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

## Basic Usage

Register this as a plugin.
Make sure it is loaded before any ***routes*** are loaded.

### Quick Setup on the Server Side

```typescript
export default fp<FastifyRabbitMQOptions>((fastify, options, done) => {
  
});
```

Within any "endpoint" function, or if you have access to ```fastify.rabbitmq``` you can then call:

```js
fastify.get('/rabbitmq', async (request, reply) => {

})
```

Sending the time to another queue called ```foo```.

### Quick Setup on the Client Side

## Full Documentation

### Options

```typescript
export interface FastifyRabbitMQOptions {

}
```

#### FastifyRabbitMQOptions

##### `logLevel`

Set the log level for Fastify RabbitMQ plugin. This is usefull for development work. The default value is ```silent```

##### `namespace`

If you need more than one "connection" to a different set and/or array of RabbitMQ servers,
either on network or cloud, each registration of the plugin needs it to be in its own namespace.
If not provided, your application will fail to load.


#### ``````


## Acknowledgements

- [rabbitmq-client](https://www.npmjs.com/package/rabbitmq-client)
- [fastify](https://fastify.dev/)
- ... and my Wife and Baby Girl.

## License

Licensed under [MIT](./LICENSE).