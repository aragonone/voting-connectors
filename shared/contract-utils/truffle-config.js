const truffleConfig = require('@aragon/truffle-config-v5')

truffleConfig.plugins = ["solidity-coverage"]
truffleConfig.compilers = {
  solc: {
    version: "0.4.24", // A version or constraint - Ex. "^0.5.0".
    // Can also be set to "native" to use a native solc
    // docker: true,   // Use a version obtained through docker
    settings: {
      // See the solidity docs for advice about optimization and evmVersion
      // https://solidity.readthedocs.io/en/v0.5.12/using-the-compiler.html#setting-the-evm-version-to-target
      optimizer: {
        enabled: true,
        runs: 10000   // Optimize for how many times you intend to run the code
      }
      // evmVersion: <string>   // Default: "petersburg"
    }
  }
}

module.exports = truffleConfig
