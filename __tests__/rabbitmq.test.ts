import fastify, {FastifyInstance} from "fastify";
import fastifyRabbit from "../src";

let app: FastifyInstance;

beforeEach(() => {
  app = fastify();
});

afterEach(async () => {
  await app.close();
});

describe('fastify-rabbitmq', () => {

  it("check to make sure we don't error out", async () => {
    app.register(fastifyRabbit).ready((err) => {
      expect(err).toBeUndefined();
    })
  });

});