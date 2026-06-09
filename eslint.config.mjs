import { createESLintConfig } from "@the-rabbit-hole/eslint-config";

// Node library (a Fastify plugin) -- no React, a11y, Storybook, or testing-library.
// The shared config keeps TypeScript, Unicorn, Perfectionist, and Prettier-as-a-rule,
// and already ignores dist/lib/coverage/docs/node_modules globally.
export default createESLintConfig({
  disableExtends: [
    "eslintReact",
    "eslintA11y",
    "eslintStorybook",
    "eslintTesting",
  ],
  rules: {
    // Matches this package's long-standing config.
    "@typescript-eslint/no-explicit-any": "off",
    // res/req/opts/msg are Fastify + AMQP idioms, not abbreviations to expand.
    "unicorn/prevent-abbreviations": "off",
  },
});
