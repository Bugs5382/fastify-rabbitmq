import fastify, { FastifyInstance } from 'fastify'
import fastifyRabbit from '../src'
import { errors } from '../src/errors'

let app: FastifyInstance

beforeEach(() => {
  app = fastify({ logger: false })
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
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('urls or options.findServers must be defined.'))
      }
    })

    test('register - error out - urls is not a string', async () => {
      try {
        // @ts-expect-error
        await app.register(fastifyRabbit, {
          urls: 1,
        })
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('urls must be defined.'))
      }
    })


    test('register - error out - urls less than 0', async () => {
      try {
        await app.register(fastifyRabbit, {
          urls: []
        })
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('urls must contain one or more item in the array.'))
      }
    })

    test('register - error out - enableRPC must be a boolean', async () => {
      try {
        // @ts-expect-error enableRPC is a string, not a boolean
        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost',
          enableRPC: 'true'
        })
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('enableRPC must be a boolean.'))
      }
    })

    test('register - error out - enableRPC not allowed with namespace', async () => {
      try {
        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost',
          namespace: 'unittesting',
          enableRPC: true
        })
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('enableRPC right now can not be used in namespaced RabbitMQ instances.'))
      }
    })

    test('register - error out - heartbeatIntervalInSeconds not a number greater than or equal to 0.', async () => {
      try {
        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost',
          connectionOptions: {
            heartbeatIntervalInSeconds: -1
          }
        })
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('options.heartbeatIntervalInSeconds must be a valid number greater than or equal to 0.'))
      }
    })

    test('register - error out - reconnectTimeInSeconds not a number greater than or equal to 0.', async () => {
      try {
        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost',
          connectionOptions: {
            reconnectTimeInSeconds: -1
          }
        })
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('options.reconnectTimeInSeconds must be a valid number greater than or equal to 0.'))
      }
    })
  })

  describe('sanity checks', () => {
    test("register - can't be registered twice", async () => {
      let err
      try {
        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost'
        })

        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost'
        })
      } catch (error) {
        err = error
      }

      expect(err).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS('Already registered.'))
    })

    test("register - can't be registered twice - namespace", async () => {
      let err
      try {
        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost',
          namespace: 'error'
        })

        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost',
          namespace: 'error'
        })
      } catch (error) {
        err = error
      }

      expect(err).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS('Already registered with namespace: error'))
    })

    test("register - can't be registered twice  (experiential)", async () => {
      let err
      try {
        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost',
          enableRPC: true
        })

        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost',
          enableRPC: true
        })
      } catch (error) {
        err = error
      }

      expect(err).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS('Already registered.'))
    })

    test.skip("register - can't be registered twice - namespace  (experiential)", async () => {
      let err
      try {
        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost',
          namespace: 'error',
          enableRPC: true
        })

        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost',
          namespace: 'error',
          enableRPC: true
        })
      } catch (error) {
        err = error
      }

      expect(err).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS('Already registered with namespace: error'))
    })
  })

  describe('common action tests', () => {
    test('ensure basic properties are accessible', async () => {
      try {
        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost'
        })
        expect(app.rabbitmq).toHaveProperty('createChannel')
        expect(app.rabbitmq).toHaveProperty('isConnected')
        expect(app.rabbitmq).toHaveProperty('reconnect')
        expect(app.rabbitmq).toHaveProperty('close')
      } catch (e) {
        /* should not error */
      }
    })

    test('ensure basic properties are accessible via namespace', async () => {
      try {
        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost',
          namespace: 'unittest'
        }).ready().then(async () => {
          expect(app.rabbitmq.unittest).toHaveProperty('createChannel')
          expect(app.rabbitmq.unittest).toHaveProperty('isConnected')
          expect(app.rabbitmq.unittest).toHaveProperty('reconnect')
          expect(app.rabbitmq.unittest).toHaveProperty('close')
        })

        await app.rabbitmq.unittest.close()
      } catch (e) {
        /* should not error */
      }
    })

    test.skip('ensure basic properties are accessible (experiential)', async () => {
      try {
        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost',
          enableRPC: true
        })
        expect(app.rabbitmq).toHaveProperty('createRPCServer')
        expect(app.rabbitmq).toHaveProperty('createRPCClient')
        expect(app.rabbitmq).toHaveProperty('createChannel')
        expect(app.rabbitmq).toHaveProperty('isConnected')
        expect(app.rabbitmq).toHaveProperty('reconnect')
        expect(app.rabbitmq).toHaveProperty('close')

        await app.rabbitmq.close()
      } catch (e) {
        /* should not error */
      }
    })

    test.skip('ensure basic properties are accessible via namespace  (experiential)', async () => {
      try {
        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost',
          namespace: 'unittest',
          enableRPC: true
        }).ready().then(async () => {
          expect(app.rabbitmq.unittest).toHaveProperty('createRPCServer')
          expect(app.rabbitmq.unittest).toHaveProperty('createRPCClient')
          expect(app.rabbitmq.unittest).toHaveProperty('createChannel')
          expect(app.rabbitmq.unittest).toHaveProperty('isConnected')
          expect(app.rabbitmq.unittest).toHaveProperty('reconnect')
          expect(app.rabbitmq.unittest).toHaveProperty('close')
        })

        await app.rabbitmq.unittest.close()
      } catch (e) {
        /* should not error */
      }
    })

    test('register with log level: debug', async () => {
      try {
        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost',
          logLevel: 'debug'
        }).ready().then(async () => {
          await app.rabbitmq.close()
        })
      } catch (e) {
        /* should not error */
      }
    })

    test('register with log level: trace', async () => {
      try {
        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost',
          logLevel: 'trace'
        }).ready().then(async () => {
          await app.rabbitmq.close()
        })
      } catch (e) {
        /* should not error */
      }
    })

    test('total channels should be 0', async () => {
      try {
        await app.register(fastifyRabbit, {
          urls: 'amqp://localhost'
        }).ready().then(async () => {
          expect(app.rabbitmq.channelCount).toBe(0)
          await app.rabbitmq.close()
        })
      } catch (e) {
        /* should not error */
      }
    })

    test('host does not exist', async () => {
      try {
        await app.register(fastifyRabbit, {
          urls: 'amqp://doesnotexist',
          connectionOptions: {
            timeout: 0.1
          }
        })

        expect(app.rabbitmq.isConnected()).toBe(false)
      } catch (e) {
        /* should not error */
      }
    })

    test('invalid protocol', async () => {
      try {
        await app.register(fastifyRabbit, {
          urls: 'xamqp://localhost',
          connectionOptions: {
            timeout: 0.1
          }
        })

        expect(app.rabbitmq.isConnected()).toBe(false)

        await app.rabbitmq.close()
      } catch (e) {
        /* should not error */
      }
    })
  })
})
