module.exports = {
  "branches": ["main"],
  "verifyConditions": [
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/git'
  ],
  "plugins": [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/git'
  ],
  "prepare": [
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/git'
  ]
}
