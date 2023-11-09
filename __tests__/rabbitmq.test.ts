import fastify, {FastifyInstance} from "fastify";
import fastifyRabbit from "../src";
import {errors} from "../src/errors";

let app: FastifyInstance;

beforeEach(() => {
  app = fastify({logger: false});
});

afterEach(async () => {
  await app.close()
});

describe('plugin fastify-rabbitmq tests', () => {

  describe('registration tests', () => {

    test("register - error out - no urLs", async () => {

      try {
        app.register(fastifyRabbit)
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('urLs or findServers must be defined.'))
      }

    });

    test("register - error out - urLs less than 0", async () => {

      try {
        app.register(fastifyRabbit, {
          urLs: [],
        })
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('urLs must have one item in the array.'))
      }

    });

    test("register - error out - enableRPC must be a boolean", async () => {

      try {
        // @ts-ignore this is here so we can do the unit testing
        app.register(fastifyRabbit, {
          urLs: ['amqp://localhost'],
          enableRPC: 'test'
        })
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS(''))
      }

    });

    test("register - error out - heartbeatIntervalInSeconds not a number greater than 0", async () => {

      try {
        app.register(fastifyRabbit, {
          urLs: ['amqp://localhost'],
          heartbeatIntervalInSeconds: -1
        })
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('heartbeatIntervalInSeconds must be a valid number greater than or equal to 0.'))
      }

    });

    test("register - error out - reconnectTimeInSeconds not a number greater than 0", async () => {

      try {
        app.register(fastifyRabbit, {
          urLs: ['amqp://localhost'],
          reconnectTimeInSeconds: -1
        })
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('reconnectTimeInSeconds must be a valid number greater than or equal to 0.'))
      }

    });

  })

  describe('sanity checks', () => {

    test("register - can't be registered twice", async () => {

      let err;
      try {
        await app.register(fastifyRabbit, {
          urLs: ['amqp://localhost']
        })

        await app.register(fastifyRabbit, {
          urLs: ['amqp://localhost']
        })
      } catch (error) {
        err = error
      }

      expect(err).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS('Already registered.'))

    });

    test("register - can't be registered twice - namespace", async () => {
      let err;
      try {
        await app.register(fastifyRabbit, {
          urLs: ['amqp://localhost'],
          namespace: 'error'
        })

        await app.register(fastifyRabbit, {
          urLs: ['amqp://localhost'],
          namespace: 'error'
        })
      } catch (error) {
        err = error
      }

      expect(err).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS('Already registered with namespace: error'))

    })

    test("register - can't be registered twice  (experiential)", async () => {

      let err;
      try {
        await app.register(fastifyRabbit, {
          urLs: ['amqp://localhost'],
          enableRPC: true
        })

        await app.register(fastifyRabbit, {
          urLs: ['amqp://localhost'],
          enableRPC: true
        })
      } catch (error) {
        err = error
      }

      expect(err).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS('Already registered.'))

    });

    test("register - can't be registered twice - namespace  (experiential)", async () => {
      let err;
      try {
        await app.register(fastifyRabbit, {
          urLs: ['amqp://localhost'],
          namespace: 'error',
          enableRPC: true
        })

        await app.register(fastifyRabbit, {
          urLs: ['amqp://localhost'],
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
        app.register(fastifyRabbit, {
          urLs: ['amqp://localhost']
        })
        expect(app.rabbitmq).toHaveProperty('createChannel');
        expect(app.rabbitmq).toHaveProperty('isConnected');
        expect(app.rabbitmq).toHaveProperty('reconnect');
        expect(app.rabbitmq).toHaveProperty('close');
      } catch (e) {
        /* should not error */
      }

    })

    test('ensure basic properties are accessible via namespace', async () => {
      try {
        await app.register(fastifyRabbit, {
          urLs: ['amqp://localhost'],
          namespace: 'unittest'
        }).ready().then(async () => {
          expect(app.rabbitmq.unittest).toHaveProperty('createChannel');
          expect(app.rabbitmq.unittest).toHaveProperty('isConnected');
          expect(app.rabbitmq.unittest).toHaveProperty('reconnect');
          expect(app.rabbitmq.unittest).toHaveProperty('close');
        })

        await app.rabbitmq.unittest.close()

      } catch (e) {
        /* should not error */
      }

    })

    test('ensure basic properties are accessible (experiential)', async () => {

      try {
        app.register(fastifyRabbit, {
          urLs: ['amqp://localhost'],
          enableRPC: true
        })
        expect(app.rabbitmq).toHaveProperty('createRPCServer');
        expect(app.rabbitmq).toHaveProperty('createRPCClient');
        expect(app.rabbitmq).toHaveProperty('createChannel');
        expect(app.rabbitmq).toHaveProperty('isConnected');
        expect(app.rabbitmq).toHaveProperty('reconnect');
        expect(app.rabbitmq).toHaveProperty('close');

        await app.rabbitmq.close()
      } catch (e) {
        /* should not error */
      }

    })

    test('ensure basic properties are accessible via namespace  (experiential)', async () => {
      try {
        await app.register(fastifyRabbit, {
          urLs: ['amqp://localhost'],
          namespace: 'unittest',
          enableRPC: true
        }).ready().then(async () => {
          expect(app.rabbitmq.unittest).toHaveProperty('createRPCServer');
          expect(app.rabbitmq.unittest).toHaveProperty('createRPCClient');
          expect(app.rabbitmq.unittest).toHaveProperty('createChannel');
          expect(app.rabbitmq.unittest).toHaveProperty('isConnected');
          expect(app.rabbitmq.unittest).toHaveProperty('reconnect');
          expect(app.rabbitmq.unittest).toHaveProperty('close');
        })

        await app.rabbitmq.unittest.close()

      } catch (e) {
        /* should not error */
      }

    })

    test('register with log level: debug', async () => {
      try {
        await app.register(fastifyRabbit, {
          urLs: ['amqp://localhost'],
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
          urLs: ['amqp://localhost'],
          logLevel: 'trace'
        }).ready().then(async () => {
          await app.rabbitmq.close()
        })
      } catch (e) {
        /!* should not error *!/
      }
    })

    test('total channels should be 0', async () => {
      try {
        await app.register(fastifyRabbit, {
          urLs: ['amqp://localhost']
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
          urLs: ['amqp://doesnotexist'],
          connectionOptions: {
            keepAlive: false,
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
          urLs: ['xamqp://localhost']
        })

        expect(app.rabbitmq.isConnected()).toBe(false)

        await app.rabbitmq.close()
      } catch (e) {
        /* should not error */
      }

    })

  })

});