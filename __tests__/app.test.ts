import fastify, {FastifyInstance} from "fastify";
import fastifyRabbit from "../src";

describe('fastify-rabbitmq sample app tests',  () => {

  describe("create a receiver and a sender",  () => {

    let app: FastifyInstance;

    beforeAll(() => {
      app = fastify()

      app.register(fastifyRabbit, {
        urLs: ['amqp://localhost']
      })

      app.rabbitmq.connection?.on('connect', function(result) {
        app.log.debug(result)
      });

      app.rabbitmq.connection?.on('disconnect', function(err) {
        app.log.debug(err.stack);
      });
    })

    it("create sender",  () => {

      app.rabbitmq.createSender({
        name: 'foo',
        options: {
          durable: true
        }
      })

    })

  })



})