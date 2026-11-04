import shared from "@bugs5382/node-oxlint-config/oxfmt";

export default {
  ...shared,
  ignorePatterns: [
    ...shared.ignorePatterns,
    "CLAUDE.md",
    "dist/**",
    "docs/**",
    "coverage/**",
  ],
};
