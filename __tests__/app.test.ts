import {ConsumeMessage} from "amqplib";
import fastify, {FastifyInstance} from "fastify";
import {Channel} from "../../node-amqp-connection-manager";
import fastifyRabbit from "../src";

describe('fastify-rabbitmq sample app tests',  () => {

  describe("create a receiver and a sender",  () => {

    let app: FastifyInstance;

    beforeAll(async () => {
      app = fastify()

      app.register(fastifyRabbit, {
        urLs: ['amqp://localhost']
      })

      await app.listen({ port: 3000});

      await app.ready()

      app.rabbitmq.on('connect', function (result) {
        app.log.debug(result)
      });

      app.rabbitmq.on('disconnect', function (err) {
        app.log.debug(err);
      });
    })

    it("create/get sender (foo) and receiver/listener (bar)",  async () => {

      const DATE = Date.now()

      const LISTEN_QUEUE_NAME = 'bar'

      // create the channel 'bar'
      const channelWrapper = app.rabbitmq.createChannel({
        name: LISTEN_QUEUE_NAME,
        setup: function(channel: Channel) {
          return Promise.all([
            channel.assertQueue(LISTEN_QUEUE_NAME, {durable: true}),
            channel.prefetch(1),
            channel.consume(LISTEN_QUEUE_NAME, onMessage)
          ]);
        }
      });

      const onMessage = function(data: ConsumeMessage) {
        const message = JSON.parse(data.content.toString());
        channelWrapper.ack(data);
        expect(message).toBe(DATE)
      }

      const SEND_QUEUE_NAME = 'foo';

      // create the channel 'foo'
      const sendChannelFunc = app.rabbitmq.createChannel({
        name: SEND_QUEUE_NAME,
        json: true,
        setup: function(channel: Channel) {
          return channel.assertQueue(SEND_QUEUE_NAME, {durable: true});
        }
      });

      // get the channel
      const sendChannel = app.rabbitmq.findChannel(SEND_QUEUE_NAME)

      expect(sendChannel).toBe(sendChannelFunc)

      await sendChannel?.sendToQueue('bar', {time: DATE})

    })

  })



})