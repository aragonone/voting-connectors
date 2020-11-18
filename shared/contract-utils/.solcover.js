module.exports = {
  skipFiles: [
    'interfaces',
    'test',
    '@aragon/os',
    '@aragon/contract-helpers-test'
  ],
  mocha: {
    timeout: 200000
  }
}
