import fastify, {FastifyInstance} from "fastify";
import fastifyRabbit from "../src";
import {errors} from "../src/errors";

let app: FastifyInstance;

beforeEach(() => {
  app = fastify();
});

afterEach( () => {
  app.close.bind(app);
});

describe('fastify-rabbitmq', () => {

  describe('registration tests', () => {

    it("register - error out - no urLs", async () => {

      try {
        await app.register(fastifyRabbit)
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('urLs or findServers must be defined.'))
      }

    });

    it("register - error out - urLs less than 0", async () => {

      try {
        await app.register(fastifyRabbit, {
          urLs: [],
        })
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('urLs must have one item in the array.'))
      }

    });

    it("register - error out - heartbeatIntervalInSeconds not a number greater than 0", async () => {

      try {
        await app.register(fastifyRabbit, {
          urLs: ['amqp://localhost'],
          heartbeatIntervalInSeconds: -1
        })
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('heartbeatIntervalInSeconds must be a valid number greater than 0.'))
      }

    });

    it("register - error out - reconnectTimeInSeconds not a number greater than 0", async () => {

      try {
        await app.register(fastifyRabbit, {
          urLs: ['amqp://localhost'],
          reconnectTimeInSeconds: -1
        })
      } catch (error) {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_INVALID_OPTS('reconnectTimeInSeconds must be a valid number greater than 0.'))
      }

    });

    it("register - can't be registered twice", async () => {

      app.register(fastifyRabbit, {
        urLs: ['amqp://localhost']
      })

      app.register(fastifyRabbit, {
        urLs: ['amqp://localhost']
      }).ready((error) => {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS('Already registered.'))
      })

    });

    it("register - can't be registered twice - namespace", async () => {

      app.register(fastifyRabbit, {
        urLs: ['amqp://localhost'],
        namespace: 'error'
      })

      app.register(fastifyRabbit, {
        urLs: ['amqp://localhost'],
        namespace: 'error'
      }).ready((error) => {
        expect(error).toEqual(new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS('Already registered with namespace: error'))
      })

    });

  })

  describe('common action tests', () => {

    it('ensure basic properties are accessible', async () => {
      await app.register(fastifyRabbit, {
        urLs: ['amqp://localhost']
      }).ready().then(async () => {
        expect(app.rabbitmq).toHaveProperty('createChannel');
        expect(app.rabbitmq).toHaveProperty('isConnected');
        expect(app.rabbitmq).toHaveProperty('reconnect');
        expect(app.rabbitmq).toHaveProperty('close');
        expect(app.rabbitmq.channel).toBeUndefined();

      })

      await app.rabbitmq.close()

    })

    it('ensure basic properties are accessible via namespace', async () => {

      await app.register(fastifyRabbit, {
        urLs: ['amqp://localhost'],
        namespace: 'unittest'
      }).ready().then(async () => {
        expect(app.rabbitmq.unittest).toHaveProperty('createChannel');
        expect(app.rabbitmq.unittest).toHaveProperty('isConnected');
        expect(app.rabbitmq.unittest).toHaveProperty('reconnect');
        expect(app.rabbitmq.unittest).toHaveProperty('close');
        expect(app.rabbitmq.channel).toBeUndefined();

      })

      await app.rabbitmq.unittest?.close()

    })

    it('register with log level: debug', async () => {

      await app.register(fastifyRabbit, {
        urLs: ['amqp://localhost'],
        logLevel: 'debug'
      }).ready().then(async () => {
        await app.rabbitmq.close()
      })

    })

    it('register with log level: trace', async () => {

      await app.register(fastifyRabbit, {
        urLs: ['amqp://localhost'],
        logLevel: 'trace'
      }).ready().then(async () => {
        await app.rabbitmq.close()
      })

    })

    it('total channels should be 0', async () => {

      await app.register(fastifyRabbit, {
        urLs: ['amqp://localhost']
      }).ready().then(async () => {
        expect(app.rabbitmq.channelCount).toBe(0)
        await app.rabbitmq.close()
      })

    })


    it('host does not exist', async () => {

      await app.register(fastifyRabbit, {
        urLs: ['amqp://doesnotexist'],
        connectionOptions: {
          keepAlive: false,
          timeout: 0.1
        }
      })

      expect(app.rabbitmq.isConnected()).toBe(false)

    })

    it('invalid protocol', async () => {
      await app.register(fastifyRabbit, {
        urLs: ['xamqp://localhost']
      })

      expect(app.rabbitmq.isConnected()).toBe(false)

      await app.rabbitmq.close()

    })

  })

});