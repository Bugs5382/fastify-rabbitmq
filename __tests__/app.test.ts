import { ConfirmChannel, Message } from 'amqplib'
import fastify, { FastifyInstance } from 'fastify'
import { defer } from 'promise-tools'
import fastifyRabbit, { Channel } from '../src'
import { errors } from '../src/errors'

describe('fastify-rabbitmq sample app tests', () => {
  describe('create a receiver and a sender', () => {
    let app: FastifyInstance

    beforeAll(async () => {
      app = fastify({ logger: false })

      await app.register(fastifyRabbit, {
        urLs: ['amqp://localhost']
      })

      app.rabbitmq.on('connect', function (result) {
        app.log.debug(result)
      })

      app.rabbitmq.on('disconnect', function (err) {
        app.log.debug(err)
      })

      await app.listen()

      await app.ready()
    })

    afterAll(async () => {
      await app.close()
    })

    test('create/get sender (foo) and receiver/listener (bar)', async () => {
      const DATE = Date.now()

      const LISTEN_QUEUE_NAME = 'bar'

      const onMessage = (data: Message | null): void => {
        if (data == null) return
        const message = JSON.parse(data.content.toString()) as string
        channelWrapper.ack(data)

        expect(message).toMatchObject({ time: DATE })

        void channelWrapper.close()
        void sendChannelFunc.close()
      }

      // create the channel 'bar'
      const channelWrapper = app.rabbitmq.createChannel({
        name: LISTEN_QUEUE_NAME,
        setup: async function (channel: Channel) {
          return await Promise.all([
            channel.assertQueue(LISTEN_QUEUE_NAME, { durable: true }),
            channel.prefetch(1),
            channel.consume(LISTEN_QUEUE_NAME, onMessage)
          ])
        }
      })

      const SEND_QUEUE_NAME = 'foo'

      // create the channel 'foo'
      const sendChannelFunc = app.rabbitmq.createChannel({
        name: SEND_QUEUE_NAME,
        json: true,
        setup: async function (channel: Channel) {
          return await channel.assertQueue(SEND_QUEUE_NAME, { durable: true })
        }
      })

      // get the channel
      const sendChannel = app.rabbitmq.findChannel(SEND_QUEUE_NAME)

      expect(sendChannel).toBe(sendChannelFunc)

      await sendChannel?.sendToQueue('bar', { time: DATE })
    })
  })

  describe('basic RPC/direct-reply-to tests', () => {
    let app: FastifyInstance

    beforeAll(async () => {
      app = fastify()

      await app.register(fastifyRabbit, {
        urLs: ['amqp://localhost']
      })

      await app.listen()

      await app.ready()

      app.rabbitmq.on('connect', function (result) {
        app.log.debug(result)
      })

      app.rabbitmq.on('disconnect', function (err) {
        app.log.debug(err)
      })
    })

    test('RPC', async () => {
      const queueName = 'testQueueRpc'
      let rpcClientQueueName = ''

      const result = defer<string | undefined>()

      const rpcClient = app.rabbitmq.createChannel({
        setup: async (channel: ConfirmChannel) => {
          const qok = await channel.assertQueue('', { exclusive: true })
          rpcClientQueueName = qok.queue

          await channel.consume(
            rpcClientQueueName,
            (message) => {
              result.resolve(message?.content.toString())
            },
            { noAck: true }
          )
        }
      })

      const rpcServer = app.rabbitmq.createChannel({
        setup: async (channel: ConfirmChannel) => {
          await channel.assertQueue(queueName, { durable: false, autoDelete: true })
          await channel.prefetch(1)
          await channel.consume(
            queueName,
            (message) => {
              if (message != null) {
                channel.sendToQueue(message.properties.replyTo, Buffer.from('world'), {
                  correlationId: message.properties.correlationId
                })
              }
            },
            { noAck: true }
          )
        }
      })

      await rpcClient.waitForConnect()

      await rpcClient.sendToQueue(queueName, 'hello', {
        correlationId: 'test',
        replyTo: rpcClientQueueName,
        messageId: 'asdkasldk'
      })

      const reply = await result.promise
      expect(reply).toBe('world')

      await rpcClient.close()
      await rpcServer.close()
    })

    test('direct-reply-to', async () => {
      const rpcClientQueueName = 'amq.rabbitmq.reply-to'
      const queueName = 'testQueueRpc'
      const result = defer<string | undefined>()

      const rpcClient = app.rabbitmq.createChannel({
        setup: async (channel: ConfirmChannel) => {
          await channel.consume(
            rpcClientQueueName,
            (message) => {
              result.resolve(message?.content.toString())
            },
            { noAck: true }
          )
        }
      })

      const rpcServer = app.rabbitmq.createChannel({
        setup: async (channel: ConfirmChannel) => {
          await channel.assertQueue(queueName, { durable: false, autoDelete: true })
          await channel.prefetch(1)
          await channel.consume(
            queueName,
            (message) => {
              if (message != null) {
                channel.sendToQueue(message.properties.replyTo, Buffer.from('world'), {
                  correlationId: message.properties.correlationId
                })
              }
            },
            { noAck: true }
          )
        }
      })

      await rpcServer.waitForConnect()
      await rpcClient.waitForConnect()

      // Send a message from client to server.
      await rpcClient.sendToQueue(queueName, 'hello', {
        correlationId: 'test',
        replyTo: rpcClientQueueName,
        messageId: 'asdkasldk'
      })

      const reply = await result.promise
      expect(reply).toBe('world')

      await rpcClient.close()
      await rpcServer.close()
    })
  })

  describe('basic RPC/direct-reply-to tests, namespace', () => {
    let app: FastifyInstance

    beforeAll(async () => {
      app = fastify()

      await app.register(fastifyRabbit, {
        urLs: ['amqp://localhost'],
        namespace: 'helloworld'
      })

      await app.listen()

      await app.ready()

      app.rabbitmq.helloworld.on('connect', function (result) {
        app.log.debug(result)
      })

      app.rabbitmq.helloworld.on('disconnect', function (err) {
        app.log.debug(err)
      })
    })

    test('RPC', async () => {
      const queueName = 'testQueueRpc'
      let rpcClientQueueName = ''

      const result = defer<string | undefined>()

      const rpcClient = app.rabbitmq.helloworld.createChannel({
        setup: async (channel: ConfirmChannel) => {
          const qok = await channel.assertQueue('', { exclusive: true })
          rpcClientQueueName = qok.queue

          await channel.consume(
            rpcClientQueueName,
            (message) => {
              result.resolve(message?.content.toString())
            },
            { noAck: true }
          )
        }
      })

      const rpcServer = app.rabbitmq.helloworld.createChannel({
        setup: async (channel: ConfirmChannel) => {
          await channel.assertQueue(queueName, { durable: false, autoDelete: true })
          await channel.prefetch(1)
          await channel.consume(
            queueName,
            (message) => {
              if (message != null) {
                channel.sendToQueue(message.properties.replyTo, Buffer.from('world'), {
                  correlationId: message.properties.correlationId
                })
              }
            },
            { noAck: true }
          )
        }
      })

      await rpcClient.waitForConnect()

      await rpcClient.sendToQueue(queueName, 'hello', {
        correlationId: 'test',
        replyTo: rpcClientQueueName,
        messageId: 'asdkasldk'
      })

      const reply = await result.promise
      expect(reply).toBe('world')

      await rpcClient.close()
      await rpcServer.close()
    })

    test('direct-reply-to', async () => {
      const rpcClientQueueName = 'amq.rabbitmq.reply-to'
      const queueName = 'testQueueRpc'
      const result = defer<string | undefined>()

      const rpcClient = app.rabbitmq.helloworld.createChannel({
        setup: async (channel: ConfirmChannel) => {
          await channel.consume(
            rpcClientQueueName,
            (message) => {
              result.resolve(message?.content.toString())
            },
            { noAck: true }
          )
        }
      })

      const rpcServer = app.rabbitmq.helloworld.createChannel({
        setup: async (channel: ConfirmChannel) => {
          await channel.assertQueue(queueName, { durable: false, autoDelete: true })
          await channel.prefetch(1)
          await channel.consume(
            queueName,
            (message) => {
              if (message != null) {
                channel.sendToQueue(message.properties.replyTo, Buffer.from('world'), {
                  correlationId: message.properties.correlationId
                })
              }
            },
            { noAck: true }
          )
        }
      })

      await rpcServer.waitForConnect()
      await rpcClient.waitForConnect()

      // Send a message from client to server.
      await rpcClient.sendToQueue(queueName, 'hello', {
        correlationId: 'test',
        replyTo: rpcClientQueueName,
        messageId: 'asdkasldk'
      })

      const reply = await result.promise
      expect(reply).toBe('world')

      await rpcClient.close()
      await rpcServer.close()
    })
  })

  describe('complex RPC/direct-reply-to tests', () => {
    let app: FastifyInstance

    beforeAll(async () => {
      app = fastify()

      await app.register(fastifyRabbit, {
        urLs: ['amqp://localhost'],
        enableRPC: true
      })

      await app.listen()

      await app.ready()

      app.rabbitmq.on('connect', function (result) {
        app.log.debug(result)
      })

      app.rabbitmq.on('disconnect', function (err) {
        app.log.debug(err)
      })
    })

    test('RPC, no queueName passed to createRPCServer', async () => {
      try {
        // @ts-expect-error need this for unit testing
        await app.rabbitmq.createRPCServer()
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_USAGE('queueName is missing.'))
      }
    })

    test('RPC, onMessage is not a function', async () => {
      try {
        // @ts-expect-error need this for unit testing
        await app.rabbitmq.createRPCServer("queue", "not-a-function")
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_USAGE('onMessage must be a function.'))
      }
    })

    test('RPC, adding numbers 1 + 1 = 2', async () => {

      /**
       * This is a sample input called "funcAdd" which will add the number passed over by 1.
       * @since 1.0.0
       * @param input {number} The Number
       * @returns number
       */
      const funcAdd = (input: string): number => {
        return parseInt(input) + 1;
      }

      // ok setup service instance
      const serverInstance = await app.rabbitmq.createRPCServer('unit-testing', funcAdd)

      // wait for the server to start before continuing on in the code
      await serverInstance.waitForConnect()

      // the first type is the dataInput field
      // the second one is the return type from the client
      const clientResult = await app.rabbitmq.createRPCClient<string, number>('unit-testing', "1", false)

      expect(Number(clientResult)).toBe(2)
    })
  })
})
