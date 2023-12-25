# Fastify RabbitMQ

A Fastify RabbitMQ Plugin Developed in Pure TypeScript.
It uses the [rabbitmq-client](https://github.com/cody-greene/node-rabbitmq-client/) plugin as a wrapper.

The build exports this to valid ESM and CJS for ease of cross-compatibility.

If you are using this NPM package, please consider giving it a :star: star.
This will increase its visibility and solicit more contribution from the outside.

## Table of Contents

1. [Install](#install)
2. [Basic Usage](#basic-usage)
3. [Full Documentation](#full-documentation)
   1. [Options](#options)
4. [Acknowledgements](#acknowledgements)
5. [License](#license)

## Install

```
npm install fastify-rabbitmq
```

## Basic Usage

Register this as a plugin.
Make sure it is loaded before any ***routes*** are loaded.

### Quick Setup on the Server Side

```typescript
export default fp<FastifyRabbitMQOptions>((fastify, options, done) => {

   void fastify.register(fastifyRabbit, {
      connection: `amqp://guest:guest@localhost`
   })

   void fastify.ready().then(async () => {

     const snowAssignAssetTag = fastify.rabbitmq.createConsumer({
       queue: 'foo',
       queueOptions: {durable: true}
     }, async (msg: any) => {
        console.log(msg) // ==> bar
     })
      
   })
  
});
```
### Quick Setup on the Client Side

Within any "endpoint" function, or if you have access to ```fastify.rabbitmq``` you can then call:

```js
fastify.get('/rabbitmq', async (request, reply) => {
   let pub = request.rabbitmq.createPublisher({
      confirm: true,
      maxAttempts: 1
   })

   await pub.send('foo', "bar") // ==> sent to foo queue
})
```

Sending the string ```bar``` to the queue called ```foo```.

## Full Documentation

### Options

```typescript
export interface FastifyRabbitMQOptions {
   /** Connection String or object pointing to the RabbitMQ Broker Services */
   connection: string | ConnectionOptions
   /** To set the custom nNamespace within this plugin instance. Used to register this plugin more than one time. */
   namespace?: string
}
```

#### FastifyRabbitMQOptions

##### `connection`

Connection String or object pointing to the RabbitMQ Broker Services.
This can be an object of ```ConnectionOptions``` from the ```rabbitmq-client``` plugin options.

##### `namespace`

If you need more than one "connection" to a different set and/or array of RabbitMQ servers,
either on network or cloud, each registration of the plugin needs it to be in its own namespace.
If not provided, your application will fail to load.


## Acknowledgements

- [rabbitmq-client](https://www.npmjs.com/package/rabbitmq-client)
- [fastify](https://fastify.dev/)
- ... and my Wife and Baby Girl.

## License

Licensed under [MIT](./LICENSE).
