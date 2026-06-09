# AGENTS.md - fastify-rabbitmq

Guide for AI agents working in this repo. Pair with `CLAUDE.md` (the working agreement and
hook-enforced rules). Keep this file current when the build, layout, or public API changes.

## What this is

A Fastify plugin (built on `fastify-plugin`) that wraps the
[`rabbitmq-client`](https://www.npmjs.com/package/rabbitmq-client) package so a Fastify app can
publish, consume, and RPC over RabbitMQ (AMQP 0-9-1). The plugin decorates the Fastify instance with
`app.rabbitmq` — a live `rabbitmq-client` `Connection` — and supports multiple named connections.

Published to npm as `fastify-rabbitmq`. Ships dual ESM + CJS with type declarations.

## Using fastify-rabbitmq in an app

If you are an agent wiring this plugin into a Fastify app (not editing this repo), start from the
[README](./README.md) — it has recipes for publish, consume, RPC, topology declaration, and
namespaces. The contract to respect:

- **Single entry point.** Register the plugin (`await app.register(fastifyRabbitMQ, opts)`) and use
  the `app.rabbitmq` decorator. Do not import `rabbitmq-client` directly in app code — its types
  (`Publisher`, `Consumer`, `RPCClient`, `Connection`, `ConnectionOptions`, `Envelope`, the message
  types, and the AMQP error classes) are re-exported from `fastify-rabbitmq`.
- **`app.rabbitmq` is the full Connection.** It exposes the underlying `rabbitmq-client` `Connection`
  API directly (`createPublisher`, `createConsumer`, `createRPCClient`, `exchangeDeclare`,
  `queueDeclare`, `queueBind`, `acquire`, `ready`, `close`) — nothing is wrapped away.
- **`connection` is required** — a connection string or a `rabbitmq-client` `ConnectionOptions`.
- **Namespaces for multiple brokers.** Register once per unique `namespace`; reach each at
  `app.rabbitmq.<namespace>`. Re-using a namespace throws `FASTIFY_RABBIT_MQ_ERR_SETUP_ERRORS`.
- In a route, reach the instance via `request.server.rabbitmq`.
- **Prefer encapsulating messaging in your own `fastify-plugin`.** Register this plugin there, declare
  topology and publishers once at startup, expose an intent-named decorator (e.g. `app.events`) so
  routes do not touch AMQP, and close consumers/publishers in an `onClose` hook. See the README recipe
  "Encapsulate messaging in your own plugin".

## Layout

- `src/index.ts` - plugin entry; registered through `fastify-plugin`, decorates the instance with the
  `rabbitmq-client` `Connection` (per namespace).
- `src/decorate.ts` - the `FastifyRabbitMQOptions` interface (`connection`, `namespace`).
- `src/types.ts` - the Fastify augmentation (`declare module "fastify"`) exposing `rabbitmq`.
- `src/validation.ts` - plugin option validation.
- `src/errors.ts` - `@fastify/error` definitions.
- `__tests__/` - vitest suite; the integration tests connect to a real broker.

## Build, test, lint

- Build: `npm run build` (tsdown -> ESM+CJS in `dist/`; types via `tsc --emitDeclarationOnly`).
- Test: `npm test` (vitest). The **integration tests need a running RabbitMQ broker** at
  `RABBITMQ_URL` (default `amqp://guest:guest@localhost`); CI provides one via a `rabbitmq` service.
  The unit/registration tests run without a broker.
- Lint: `npm run lint` (the shared `@the-rabbit-hole/eslint-config`); `npm run lint:fix` to autofix.
- License headers: `task license` verifies the MIT header (CI); `task license:fix` injects it.
- Docs: `npm run typedoc`.

## Conventions and gotchas

- The plugin is the only public entry point. Construct RabbitMQ objects through `app.rabbitmq`, not by
  importing `rabbitmq-client` directly in app code.
- Integration tests require a broker — run one locally (`docker run -p 5672:5672 rabbitmq:4-alpine`)
  or rely on CI's `rabbitmq` service; without it, the integration tests time out.
- See `CLAUDE.md` for branch/commit/PR rules; these are enforced by the git hooks in `.claude/hooks`.
