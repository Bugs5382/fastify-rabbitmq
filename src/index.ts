import amqp from "amqp-connection-manager";
import { Channel } from "amqp-connection-manager/dist/types/decorate";
import ChannelWrapper from "amqp-connection-manager/dist/types/ChannelWrapper";
import {FastifyInstance} from "fastify";
import fp from 'fastify-plugin'
import { defer } from 'promise-tools'
import * as randomstring from "randomstring";
import {FastifyRabbitMQAmqpConnectionManager, FastifyRabbitMQOptions} from "./decorate";
import { errors } from './errors'
import { validateOpts } from './validation'

/**
 * decorateFastifyInstance
 * @since 1.0.0
 * @param fastify
 * @param options
 * @param decorateOptions
 */
const decorateFastifyInstance = (fastify: FastifyInstance, options: FastifyRabbitMQOptions, decorateOptions: any): void => {
  const { connection } = decorateOptions

  const {
    namespace = ''
  } = options

  if (typeof namespace !== 'undefined') {
    fastify.log.debug('[fastify-rabbitmq] Namespace: %s', namespace)
  }
  if (typeof namespace !== 'undefined' && namespace !== '') {
    if (typeof fastify.rabbitmq === 'undefined') {
      fastify.decorate('rabbitmq', Object.create(null))
    }

    if (typeof fastify.rabbitmq[namespace] !== 'undefined') {
      throw new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS(`Already registered with namespace: ${namespace}`)
    }

    fastify.log.trace('[fastify-rabbitmq] Decorate Fastify with Namespace: %', namespace)
    fastify.rabbitmq[namespace] = connection
  } else {
    if (typeof fastify.rabbitmq !== 'undefined') {
      throw new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS('Already registered.')
    }
  }

  if (typeof fastify.rabbitmq === 'undefined') {
    fastify.log.trace('[fastify-rabbitmq] Decorate Fastify')
    fastify.decorate('rabbitmq', connection)
  }
}

const fastifyRabbit = fp<FastifyRabbitMQOptions>(async (fastify, opts, done) => {
  // validate our custom ops
  await validateOpts(opts)

  const {
    enableRPC = false,
    urls = null,
    connectionOptions
  } = opts

  /**
   * We are going to override AmqpConnectionManager if we are doing our custom RPC implementation
   */
  let connection

  if (typeof enableRPC !== 'undefined' && !enableRPC) {
    connection = await amqp.connect(urls, { connectionOptions: connectionOptions })

  } else {
    connection = await amqp.connect(urls, {connectionOptions: connectionOptions}) as FastifyRabbitMQAmqpConnectionManager

    /**
     * Used to create an RPC Client and send the "input" to the corresponding RPC server.
     * @since 1.0.0
     * @param queueName
     * @param dataInput
     * @param jsonProcess
     */
    connection.createRPCClient = async <T>(queueName: string, dataInput: T, jsonProcess: boolean = true): Promise<string | undefined> => {
      const correlationId = randomstring.generate();
      const messageId = randomstring.generate()
      const result = defer<string | undefined>()
      let rpcClientQueueName = ''

      const rpcClient = fastify.rabbitmq.createChannel({
        name: queueName,
        json: jsonProcess,
        setup: async (channel: Channel) => {
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

      await rpcClient.waitForConnect()

      await rpcClient.sendToQueue(queueName, dataInput, {
        correlationId,
        replyTo: rpcClientQueueName,
        messageId
      })

      return await result.promise
    }

    /**
     * Create RPC Server Function and Map Function that will be processed by the client
     * @since 1.0.0
     * @param queueName {string} The name of the server queue.
     * This is the name the client must send to work.
     * @param onMessage {function} How the data is processed.
     */
    connection.createRPCServer = async (queueName: string, onMessage: any): Promise<ChannelWrapper> => {
      if (typeof queueName === 'undefined') {
        throw new errors.FASTIFY_RABBIT_MQ_ERR_USAGE('queueName is missing.')
      }

      if (typeof onMessage !== 'function') {
        throw new errors.FASTIFY_RABBIT_MQ_ERR_USAGE('onMessage must be a function.')
      }

      const serverInstance = fastify.rabbitmq.createChannel({
        name: queueName,
        setup: async (channel: Channel) => {
          await channel.assertQueue(queueName, { durable: false, autoDelete: true })
          await channel.prefetch(1)
          await channel.consume(
            queueName,
            (message) => {
              if (message != null) {
                const responseMessage = onMessage(message.content.toString())
                channel.sendToQueue(message.properties.replyTo, Buffer.from(responseMessage.toString()), {
                  correlationId: message.properties.correlationId
                })
              }
            },
            { noAck: true }
          )
        }
      })

      // let's make sure the server is connected and going before returning
      await serverInstance.waitForConnect()

      // return the server now
      return serverInstance
    }

  }

  connection.on('connect', function () {
    fastify.log.debug('[fastify-rabbitmq] Connection to RabbitMQ Successful')
  })

  connection.on('connectFailed', function () {
    fastify.log.debug('[fastify-rabbitmq] Connection to RabbitMQ Connection Failed')
  })

  /**
   * Decorate Fastify
   */
  decorateFastifyInstance(fastify, opts, { connection })

  done()
})

export default fastifyRabbit
