# fastify-rabbitmq
A Fastify RabbitMQ Plugin Developed in Pure TypeScript. Providing a lot more expandability on the ```amqplib``` package and RabbitMQ functionally.

## Install
```
npm i fastify-rabbitmq
```

## Usage
Register as a plugin. This will decorate your `fastify` instance with the following methods:

* fastify.rabbitmq.publishMessage
* fastify.rabbitmq.directMessage

```js
import fastifyRabbit from "fastify-rabbitmq"

fastify.register(fastifyRabbit, {
  queue: 'rabbitqueue',
  consumeMessageFn: async (message, channel: Channel) => {
    console.log(message.content.toString())
  }
})
```

## Options

```typescript
export interface FastifyRabbitMQOptions {
  namespace?: string
  queue: string
  host?: string
  port?: string
  username?: string
  password?: string
  preProcessMessageFn?: (message: any) => string;
  consumeMessageFn: (message: ConsumeMessage, channel: Channel) => void;
  confirmChannel?: boolean
}
```
### `queue` (required)

The RabbitMQ queue to create.

### `consumeMessageFn` (required)

How this particular queue will process messages. Rememer that plugins in fastify can not access the request/reply scope. You will need to send your data that you get to a REST API endpoint for it to be processed.

```typescript
consumeMessageFn: async (message, channel: Channel) => {
  const data = message.content.toString()
  const options: any = {
    json: {
      ...data
    },
  };
  const {body} = await got.post(`http://localhost:3000/foo`, options)
}
```
One example using the ```got``` NPM package to then pass the results from theis RabbitMQ data.

### `name`

If you register more than one RabbitMQ queue within the same application, you must give it a namespace.
The name can be the same as the queue.

### `host`

By default, it's ```localhost``` but pass your RabbitMQ server hostname or IP address. 

### `port`

By default it's ```5672``` but pass your RabbitMQ port.

### `username`

By default, it's ```guest``` but pass your RabbitMQ username.

### `password`

By default, it's ```guest``` but pass your RabbitMQ password.

### `preProcessMessageFn`

Before your message goes out, do something to your message.
This is good so all your message go out correctly.
If not, just make sure you are only sending strings out.

### `confirmChannel`

By default,
it's ```false``` but mark this ture in order for you to mark your queue
always confirm that it received data from a remote RabbitMQ.
