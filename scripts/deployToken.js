const MiniMeToken = artifacts.require('@aragon/apps-shared-minime/contracts/MiniMeToken')

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const deployToken = async (name, symbol) => {
  const token = await MiniMeToken.new(ZERO_ADDRESS, ZERO_ADDRESS, 0, name, 18, symbol, true)
  await token.generateTokens('0xb4124cEB3451635DAcedd11767f004d8a28c6eE7', '20e18')
  return token
}

module.exports = async callback => {
  const name = process.argv[3]
  const symbol = process.argv[4]

  const token = await deployToken(name, symbol)
  console.log(token.address)
  callback()
}
