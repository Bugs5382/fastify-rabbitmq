import amqp, {ChannelWrapper} from 'amqp-connection-manager'
import {Channel, ConfirmChannel, ConsumeMessage} from 'amqplib'
import {randomUUID} from "crypto";
import {FastifyInstance} from 'fastify'
import fp from 'fastify-plugin'
import {defer} from "promise-tools";
import {AmqpConnectionManager, AmqpConnectionManagerOptions, ConnectionUrl} from '../../node-amqp-connection-manager'
import {FastifyRabbitMQAmqpConnectionManager} from "./decorate";
import {errors} from './errors'
import {validateOpts} from './validation'
import FastifyRabbitMQOptions = fastifyRabbitMQ.FastifyRabbitMQOptions;

declare module 'fastify' {

  export interface FastifyInstance {
    /**
     * RabbitMQ Connection
     */
    rabbitmq: AmqpConnectionManager & FastifyRabbitMQAmqpConnectionManager & fastifyRabbitMQ.FastifyRabbitMQAmqpNestedObject
  }

}

declare namespace fastifyRabbitMQ {

  export interface FastifyRabbitMQAmqpNestedObject {
    /**
     * Nested Namespace
     */
    [namespace: string]: AmqpConnectionManager & FastifyRabbitMQAmqpConnectionManager
  }

  export interface FastifyRabbitMQOptions extends AmqpConnectionManagerOptions {
    /**
     * Enable RPC Built In System
     *
     * Warning: Experiential
     */
    enableRPC?: boolean
    /**
     * Namespace
     */
    namespace?: string
    /**
     * Connection URLS for AmqpConnectionManager
     */
    urLs: ConnectionUrl | ConnectionUrl[] | undefined | null
  }

}

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

const fastifyRabbit = fp<FastifyRabbitMQOptions>(async (fastify, options, done) => {
  // validate
  await validateOpts(options)

  const {
    urLs,
    heartbeatIntervalInSeconds,
    reconnectTimeInSeconds,
    findServers,
    connectionOptions,
    enableRPC = false
  } = options

  // we need this 'writeable'
  let connection

  if (typeof enableRPC !== 'undefined' && !enableRPC) {

      connection = amqp.connect(urLs, {
        heartbeatIntervalInSeconds,
        reconnectTimeInSeconds,
        findServers,
        connectionOptions
      })

    } else {

      // spin up this connection but as the experimental
      connection = amqp.connect(urLs, {
        heartbeatIntervalInSeconds,
        reconnectTimeInSeconds,
        findServers,
        connectionOptions
      }) as FastifyRabbitMQAmqpConnectionManager

    /**
     * Create RPC Server Function
     * @since 1.0.0
     * @param queueName {string} The name of the server queue.
     * This is the name the client must send to work.
     */
      connection.createRPCServer = async (queueName: string): Promise<ChannelWrapper> => {

        if (typeof queueName !== 'undefined') {
          throw new errors.FASTIFY_RABBIT_MQ_ERR_USAGE('queueName is missing.')
        }

        return fastify.rabbitmq.createChannel({
          name: queueName,
          setup: async (channel: ConfirmChannel) => {
            await channel.assertQueue(queueName, {durable: false, autoDelete: true});
            await channel.prefetch(1);
            await channel.consume(
              queueName,
              (message) => {
                if (message) {
                  channel.sendToQueue(message.properties.replyTo, Buffer.from('world'), {
                    correlationId: message.properties.correlationId,
                  });
                }
              },
              {noAck: true}
            );
          },
        })

      }

    /**
     *
     * @since 1.0.0
     * @param queueName
     */
      connection.createRPCClient = async (queueName: string): Promise<any> => {

        const correlationId = randomUUID()
        const messageId = randomUUID()
        const result = defer<any>();
        let rpcClientQueueName = '';

        const rpcClient = fastify.rabbitmq.createChannel({
          name: 'rpcClient',
          setup: async (channel: ConfirmChannel) => {
            const qok = await channel.assertQueue('', { exclusive: true });
            rpcClientQueueName = qok.queue;

            await channel.consume(
              rpcClientQueueName,
              (message) => {
                result.resolve(message?.content.toString());
              },
              { noAck: true }
            );
          },
        });

        await rpcClient.waitForConnect()

        await rpcClient.sendToQueue(queueName, 'hello', {
          correlationId: correlationId,
          replyTo: rpcClientQueueName,
          messageId: messageId,
        });

        return await result.promise

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
  decorateFastifyInstance(fastify, options, { connection })

  done()
})

export { Channel, ConfirmChannel, ConsumeMessage }
export default fastifyRabbit
