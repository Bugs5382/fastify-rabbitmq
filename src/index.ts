import {Channel, ConfirmChannel, ConsumeMessage, Replies} from 'amqplib'
import amqp, { AmqpConnectionManager, ChannelWrapper, ConnectionUrl } from 'amqp-connection-manager'
import {randomUUID} from "crypto";
import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { errors } from './errors'
import { validateOpts } from './validation'

import FastifyRabbitMQOptions = fastifyRabbitMQ.FastifyRabbitMQOptions


/**
 * Custom Override which builds in extendability of ChannelWrapper
 */
export  interface FastifyRabbitMQChannelWrapper extends  ChannelWrapper {
  /* Number of seconds to wait before */
  ttl: number;
  /* Send RPC Message */
  sendRPC: (msg: any, ttl: number, exchangeName: string, routingKey: string) => void;
  /* Correlation ID */
  corr: string;
}

/**
 * Custom Override which builds in extendability of AmqpConnectionManager
 */
export interface FastifyRabbitMQAmqpConnectionManager extends AmqpConnectionManager {
  /* List of Channels */
  _channels: ChannelWrapper[]
  /* Create an RPC Client */
  createRPCClient: (queue_name: string, ttl: number, setup: () => any) => Promise<ChannelWrapper>
  /* Create an RPC Server */
  createRPCServer: () => Promise<ChannelWrapper>
  /* Find Channels */
  findChannel: (name: string) => ChannelWrapper | undefined
}

declare module 'fastify' {

  interface FastifyInstance {
    /**
     * RabbitMQ Connection
     */
    rabbitmq: FastifyRabbitMQAmqpConnectionManager & fastifyRabbitMQ.FastifyRabbitMQAmqpNestedObject
  }

}

declare namespace fastifyRabbitMQ {

  export interface FastifyRabbitMQAmqpNestedObject {
    /**
     * Nested Namespace
     */
    [namespace: string]: FastifyRabbitMQAmqpConnectionManager
  }

  export interface FastifyRabbitMQOptions extends FastifyPluginOptions {
    /**
     * Log Level for RabbitMQ Debugging
     */
    logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error'
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
    logLevel = 'silent',
    namespace = ''
  } = options

  // override log level
  const logger = fastify.log.child({}, { level: logLevel })

  if (typeof namespace !== 'undefined') {
    logger.debug('[fastify-rabbitmq] Namespace: %s', namespace)
  }

  if (typeof namespace !== 'undefined' && namespace !== '') {
    if (typeof fastify.rabbitmq !== 'undefined' && typeof fastify.rabbitmq[namespace] !== 'undefined') {
      throw new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS(`Already registered with namespace: ${namespace}`)
    }

    logger.trace('[fastify-rabbitmq] Decorate Fastify with Namespace: %', namespace)

    fastify.decorate('rabbitmq', {
      ...fastify.rabbitmq,
      [namespace]: connection
    })
  } else {
    if (typeof fastify.rabbitmq !== 'undefined') {
      throw new errors.FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS('Already registered.')
    }
  }

  if (typeof fastify.rabbitmq === 'undefined') {
    logger.trace('[fastify-rabbitmq] Decorate Fastify')
    fastify.decorate('rabbitmq', connection)
  }
}

const fastifyRabbit = fp<FastifyRabbitMQOptions>(async (fastify, options, done) => {
  // validate
  await validateOpts(options)

  const {
    logLevel = 'silent',
    urLs,
    heartbeatIntervalInSeconds,
    reconnectTimeInSeconds,
    findServers,
    connectionOptions
  } = options

  // override log level
  const logger = fastify.log.child({}, { level: logLevel })

  // we need this 'writeable'
  let connection = amqp.connect(urLs, {
    heartbeatIntervalInSeconds,
    reconnectTimeInSeconds,
    connectionOptions,
    findServers
  }) as FastifyRabbitMQAmqpConnectionManager

  connection.on('connect', function () {
    logger.debug('[fastify-rabbitmq] Connection to RabbitMQ Successful')
  })

  connection.on('connectFailed', function () {
    logger.debug('[fastify-rabbitmq] Connection to RabbitMQ Connection Failed')
  })

  connection.createRPCServer = async function () {
    const channelWrapper = connection.createChannel({
      json: true,
      setup: () => {}
    })
    return channelWrapper
  }

  connection.createRPCClient = async function (queue_name: string = "", ttl: number = 0, setup: Function) {
    let channelWrapper = connection.createChannel({
      json: true,
      setup: function (channel: Channel) {
        channelWrapper.ttl = ttl;
        return new Promise(async function (resolve, reject) {
          try {

            let queue: Promise<Replies.AssertQueue> | any;
            if (typeof setup !== "function") {
              queue = await channel.assertQueue('', { exclusive: true });
            } else {
              queue = await setup(channel);
            }

            channelWrapper.sendRPC = async function (msg, ttl, exchangeName = "", routingKey = queue_name) {
              let corr = randomUUID();
              channelWrapper.corr = corr;
              await channelWrapper.publish(exchangeName, routingKey, msg, {
                correlationId: corr,
                replyTo: queue.queue,
                expiration: (ttl !== undefined ? ttl : channelWrapper.ttl) * 1000
              });
              return await getResponse(channelWrapper, corr, channelWrapper.ttl);
            };

            await channel.consume(queue.queue, function (msg) {
              let cache = channelWrapper.cache;
              if (cache) {
                let value = cache.get(msg?.properties.correlationId);
                if (value) {
                  cache.del(msg?.properties.correlationId);
                  try {
                      let json = JSON.parse(msg.content.toString());
                      if (json.err) {
                        value.reject(json.err);
                      } else {
                        value.resolve(json.msg);
                      }
                  } catch (err) {
                    value.reject(err);
                  }
                }
              }
            }, {
              noAck: true
            });

            resolve();

          } catch (err) {
            reject(err);
          }
        });
      }
    }) as FastifyRabbitMQChannelWrapper;

    if (channelWrapper.sendRPC === null) {
      channelWrapper.sendRPC = async () => {
        throw new Error('Channel Not Ready');
      };
    }

    return channelWrapper
  }

  /**
   * Find Channel
   * @since 1.0.0
   * @param name {string} Name of the Queue
   * @returns ChannelWrapper | undefined
   */
  connection.findChannel = function (name: string): ChannelWrapper | undefined {
    return connection._channels.find(channel => channel.name == name) || undefined
  }

  /**
   * Decorate Fastify
   */
  decorateFastifyInstance(fastify, options, { connection })

  done()
})

export { Channel, ConfirmChannel, ConsumeMessage }
export default fastifyRabbit
