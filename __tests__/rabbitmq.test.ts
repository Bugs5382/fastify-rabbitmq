import fastify, {FastifyInstance} from "fastify";
import fastifyRabbit from "../src";

let app: FastifyInstance;

beforeEach(() => {
  app = fastify();
});

afterEach(async () => {
  app.close.bind(app);
});

describe('fastify-rabbitmq', () => {

  it("check to make sure we don't error out", async () => {

    app.register(fastifyRabbit, {
      urLs: ['amqp://localhost']
    }).ready((err) => {
      expect(err).toBeUndefined();
    })

  });

  it('ensure basic properties are accessible', async () => {

    app.register(fastifyRabbit, {
      urLs: ['amqp://localhost']
    })

    app.ready().then(async () => {
      expect(app.rabbitmq).toHaveProperty('createChannel');
      expect(app.rabbitmq).toHaveProperty('isConnected');
      expect(app.rabbitmq).toHaveProperty('reconnect');
      expect(app.rabbitmq).toHaveProperty('close');
      expect(app.rabbitmq.channel).toBeUndefined();

      await app.rabbitmq.close()

    })

  })

  it('total channels should be 0', async () => {

    app.register(fastifyRabbit, {
      urLs: ['amqp://localhost']
    })

    app.ready().then(async () => {
      expect(app.rabbitmq.channelCount).toBe(0)
      await app.rabbitmq.close()
    })

  })


  it('unroutable host', async () => {
    app.register(fastifyRabbit, {
      urLs: ['amqp://doesnotexist']
    })

    app.ready().then(async () => {
      expect(app.rabbitmq.isConnected()).toBe(false)
      await app.rabbitmq.close()
    })

  })

  it('invaild protocol', async () => {
    app.register(fastifyRabbit, {
      urLs: ['xamqp://localhost']
    })

    app.ready().then(async () => {
      expect(app.rabbitmq.isConnected()).toBe(false)
      await app.rabbitmq.close()
    })

  })

});