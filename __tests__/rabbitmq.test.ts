import fastify, { FastifyInstance } from 'fastify'
import { describe, expect, test, beforeEach, afterEach } from 'vitest'
import fastifyRabbit from '../src'
import { errors } from '../src/errors'

let app: FastifyInstance

const RABBITMQ_URL = process.env.RABBITMQ_URL || `amqp://guest:guest@localhost`

beforeEach(() => {
  app = fastify()
})

afterEach(async () => {
  await app.close()
})

describe('plugin fastify-rabbitmq tests', () => {
  describe('registration tests', () => {
    test('register - error out - no urls', async () => {
      try {
        await app.register(fastifyRabbit)
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('connection or findServers must be defined.'))
      }
    })

    test('register - error out - connection not defined', async () => {
      try {
        // @ts-expect-error
        await app.register(fastifyRabbit, { connection: undefined })
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('connection or findServers must be defined.'))
      }
    })

    test('register - error out - urls is not a string', async () => {
      try {
        // @ts-expect-error
        await app.register(fastifyRabbit, {
          connection: 1
        })
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('urls must be defined.'))
      }
    })

    test('register - error out - urls less than 0', async () => {
      try {
        // @ts-expect-error
        await app.register(fastifyRabbit, {
          connection: []
        })
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('urls must contain one or more item in the array.'))
      }
    })
  })

  describe('sanity checks', () => {
    test("register - can't be registered twice", async () => {
      try {
        await app.register(fastifyRabbit, {
          connection: RABBITMQ_URL
        })

        await app.register(fastifyRabbit, {
          connection: RABBITMQ_URL
        })
      } catch (err) {
        expect(err).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS('Already registered.'))
      }
    })

    test("register - can't be registered twice - namespace", async () => {
      try {
        await app.register(fastifyRabbit, {
          connection: RABBITMQ_URL,
          namespace: 'error'
        })

        await app.register(fastifyRabbit, {
          connection: RABBITMQ_URL,
          namespace: 'error'
        })
      } catch (err) {
        expect(err).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS('Already registered with namespace: error'))
      }
    })
  })

  describe('common action tests', () => {
    test('ensure basic properties are accessible', async () => {
      try {
        await app.register(fastifyRabbit, {
          connection: 'amqp://guest:guest@localhost'
        })
        expect(app.rabbitmq).toHaveProperty('acquire')
        expect(app.rabbitmq).toHaveProperty('close')
        expect(app.rabbitmq).toHaveProperty('createConsumer')
        expect(app.rabbitmq).toHaveProperty('createPublisher')
        expect(app.rabbitmq).toHaveProperty('createRPCClient')
        expect(app.rabbitmq).toHaveProperty('exchangeDeclare')
        expect(app.rabbitmq).toHaveProperty('queueDeclare')
        expect(app.rabbitmq).toHaveProperty('queueBind')
        expect(app.rabbitmq).toHaveProperty('ready')

        await app.rabbitmq.close()
      } catch (e) {
        /* should not error */
      }
    })

    test('ensure basic properties are accessible via namespace', async () => {
      try {
        await app.register(fastifyRabbit, {
          connection: RABBITMQ_URL,
          namespace: 'unittest'
        }).ready().then(async () => {
          expect(app.rabbitmq.unittest).toHaveProperty('acquire')
          expect(app.rabbitmq.unittest).toHaveProperty('close')
          expect(app.rabbitmq.unittest).toHaveProperty('createConsumer')
          expect(app.rabbitmq.unittest).toHaveProperty('createPublisher')
          expect(app.rabbitmq.unittest).toHaveProperty('createRPCClient')
          expect(app.rabbitmq.unittest).toHaveProperty('exchangeDeclare')
          expect(app.rabbitmq.unittest).toHaveProperty('queueDeclare')
          expect(app.rabbitmq.unittest).toHaveProperty('queueBind')
          expect(app.rabbitmq.unittest).toHaveProperty('ready')
        })

        await app.rabbitmq.unittest.close()
      } catch (e) {
        /* should not error */
      }
    })

    test('register with log level: debug', async () => {
      try {
        await app.register(fastifyRabbit, {
          connection: RABBITMQ_URL,
          logLevel: 'debug'
        }).ready().then(async () => {
          expect(app.rabbitmq.unittest).toHaveProperty('createConsumer')
          await app.rabbitmq.close()
        })
      } catch (e) {
        /* should not error */
      }
    })

    test('register with log level: trace', async () => {
      try {
        await app.register(fastifyRabbit, {
          connection: RABBITMQ_URL,
          logLevel: 'trace'
        }).ready().then(async () => {
          expect(app.rabbitmq.unittest).toHaveProperty('createConsumer')
          await app.rabbitmq.close()
        })
      } catch (e) {
        /* should not error */
      }
    })
  })
})
