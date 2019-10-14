const ERC20Sample = artifacts.require('./ERC20Sample')

const deployToken = async () => {
  // ERC20Sample automatically mints tokens to msg.sender.
  return await ERC20Sample.new()
}

module.exports = async callback => {
  const token = await deployToken()
  console.log(token.address)
  callback()
}
