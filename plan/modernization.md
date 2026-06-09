# fastify-rabbitmq modernization plan

Local prep notes (not committed). Target shape = the hub Fastify template at
`~/Code/bugs5382/project-template/ecosystems/fastify/template`.

## Status
In good shape: Fastify v5, `fastify-plugin` v5, wraps `rabbitmq-client` v5.0.4, vitest, flat eslint.
**Not blocked** by anything (no node-hl7 dependency). Small effort (~1-2h). Currently on branch
`fix-typedoc` (minor fixes vs main: LICENSE/README text, drop `test` from precommit, point
`typedoc.json` at `tsconfig.json`) — merge those first.

## Steps
1. Merge/land the `fix-typedoc` branch (the typedoc.json fix is the substantive one).
2. Build: replace **tsup** with **tsdown** (`^0.22`); mirror the hub template's `tsdown.config.ts`
   + `tsconfig.json`; output `dist/` (was `lib/`).
3. `package.json`: add `"type": "module"`; exports → `dist/index.{mjs,cjs}` + `.d.mts`/`.d.cts`;
   relax engine to `>=20`; drop `eslint-plugin-sort-class-members` (covered by shared config).
4. eslint: adopt `@the-rabbit-hole/eslint-config` (backlog #13) in place of the local flat config.
5. Deps: confirm `rabbitmq-client` is latest (bump if newer); align typescript/vitest to the
   template's versions.
6. Publish: ensure `action-deploy-npm` uses OIDC + `provenance: true` (it already publishes with
   provenance; confirm OIDC trusted-publisher rather than NPM_TOKEN).

## Tests
Unit tests (`__tests__/rabbitmq.test.ts`) pass (10/10). Integration tests (`__tests__/app.test.ts`)
need a live RabbitMQ broker — they time out locally without one. Run them in CI with a RabbitMQ
service container, or gate them behind a broker-available check.

## Verify
`npm i && npm run build && npm test && npm run lint`; integration tests against a RabbitMQ broker;
release via a GitHub Release (OIDC publish).
