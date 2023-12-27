import fastify, { FastifyInstance } from 'fastify'
import { Consumer, Publisher, RPCClient } from 'rabbitmq-client'
import fastifyRabbit from '../src'
import { createDeferred, expectEvent, sleep } from './__utils__/utils'

describe('fastify-rabbitmq sample app tests', () => {
  describe('no namespace', () => {
    let app: FastifyInstance
    let sub: Consumer
    let pub: Publisher | RPCClient

    beforeEach(async () => {
      app = fastify()

      await app.register(fastifyRabbit, {
        connection: 'amqp://guest:guest@localhost'
      })

      await app.listen()

      await app.ready()
    })

    afterEach(async () => {
      await pub.close()

      await sub.close()

      await app.rabbitmq.close()

      await app.close()
    })

    test('create/get sender  and receiver/listener (foo)', async () => {
      const LISTEN_QUEUE_NAME = 'foo'

      const dfd = createDeferred<void>() // eslint-disable-line

      await app.rabbitmq.queueDelete(LISTEN_QUEUE_NAME)

      sub = app.rabbitmq.createConsumer({
        queue: LISTEN_QUEUE_NAME,
        queueOptions: { durable: true },
        qos: { prefetchCount: 2 }
      }, async (msg: any) => {
        expect(msg.body.id).toBe(1)
        expect(msg.body.name).toBe('Alan Turing')
        dfd.resolve()
      })

      await sleep(1)

      await expectEvent(sub, 'ready')

      pub = app.rabbitmq.createPublisher({
        confirm: true,
        maxAttempts: 1
      })

      await pub.send(LISTEN_QUEUE_NAME, { id: 1, name: 'Alan Turing' })

      await dfd.promise
    })

    test('rpc', async () => {
      const LISTEN_RPC_NAME = 'fooRPC'

      await app.rabbitmq.queueDelete(LISTEN_RPC_NAME)

      sub = app.rabbitmq.createConsumer({
        queue: LISTEN_RPC_NAME
      }, async (_req: any, reply: any) => {
        await reply('pong')
      })

      await sleep(1)

      await expectEvent(sub, 'ready')

      pub = app.rabbitmq.createRPCClient({ confirm: true })

      const res = await pub.send(LISTEN_RPC_NAME, 'ping')

      expect(res.body).toBe('pong')
    })
  })

  describe('namespace', () => {
    let app: FastifyInstance
    let sub: Consumer
    let pub: Publisher | RPCClient

    beforeEach(async () => {
      app = fastify()

      await app.register(fastifyRabbit, {
        connection: 'amqp://guest:guest@localhost',
        namespace: 'unittest'
      })

      await app.listen()

      await app.ready()
    })

    afterEach(async () => {
      await pub.close()

      await sub.close()

      await app.rabbitmq.unittest.close()

      await app.close()
    })

    test('create/get sender and receiver/listener (bar)', async () => {
      const LISTEN_QUEUE_NAME = 'bar'

      const dfd = createDeferred<void>() // eslint-disable-line

      await app.rabbitmq.unittest.queueDelete(LISTEN_QUEUE_NAME)

      sub = app.rabbitmq.unittest.createConsumer({
        queue: LISTEN_QUEUE_NAME,
        queueOptions: { durable: true },
        qos: { prefetchCount: 2 }
      }, async (msg: any) => {
        expect(msg.body.id).toBe(1)
        expect(msg.body.name).toBe('Alan Turing')
        dfd.resolve()
      })

      await sleep(1)

      await expectEvent(sub, 'ready')

      pub = app.rabbitmq.unittest.createPublisher({
        confirm: true,
        maxAttempts: 1
      })

      await pub.send(LISTEN_QUEUE_NAME, { id: 1, name: 'Alan Turing' })

      await dfd.promise
    })

    test('rpc', async () => {
      const LISTEN_RPC_NAME = 'fooRPC'

      await app.rabbitmq.unittest.queueDelete(LISTEN_RPC_NAME)

      sub = app.rabbitmq.unittest.createConsumer({
        queue: LISTEN_RPC_NAME
      }, async (_req: any, reply: any) => {
        await reply('pong')
      })

      await sleep(1)

      await expectEvent(sub, 'ready')

      pub = app.rabbitmq.unittest.createRPCClient({ confirm: true })

      const res = await pub.send(LISTEN_RPC_NAME, 'ping')

      expect(res.body).toBe('pong')
    })
  })
})
