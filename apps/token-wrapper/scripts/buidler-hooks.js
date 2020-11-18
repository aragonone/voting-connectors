/*
 * These hooks are called by the Aragon Buidler plugin during the start task's lifecycle. Use them to perform custom tasks at certain entry points of the development build process, like deploying a token before a proxy is initialized, etc.
 *
 * Link them to the main buidler config file (buidler.config.js) in the `aragon.hooks` property.
 *
 * All hooks receive two parameters:
 * 1) A params object that may contain other objects that pertain to the particular hook.
 * 2) A "bre" or BuidlerRuntimeEnvironment object that contains enviroment objects like web3, Truffle artifacts, etc.
 *
 * Please see AragonConfigHooks, in the plugin's types for further details on these interfaces.
 * https://github.com/aragon/buidler-aragon/blob/develop/src/types.ts#L31
 */

const VOTING_SETTINGS = [
  '500000000000000000',
  '200000000000000000',
  '86400',
]
let token

module.exports = {
  // Called before a dao is deployed.
  preDao: async ({ log }, { web3, artifacts }) => {},

  // Called after a dao is deployed.
  postDao: async (
    { dao, _experimentalAppInstaller, log },
    { web3, artifacts }
  ) => {
    const ERC20Sample = artifacts.require('ERC20Sample')

    // ERC20Sample automatically mints tokens to msg.sender.
    token = await ERC20Sample.new()

    const [addr1, addr2] = await web3.eth.getAccounts()
  
    // Mint tokens
    // NOTE: Tokens are automatically minted to the deploying addrress (addr1).
    await token.transfer(addr2, '1000000000000000000000')
  
    log(`addr1 balance`, (await token.balanceOf(addr1)).toString())
    log(`addr2 balance`, (await token.balanceOf(addr2)).toString())
  },

  // Called after the app's proxy is created, but before it's initialized.
  preInit: async (
    { proxy, _experimentalAppInstaller, log },
    { web3, artifacts }
  ) => {},

  // Called after the app's proxy is initialized.
  postInit: async (
    { proxy, _experimentalAppInstaller, log },
    { web3, artifacts }
  ) => {
    const voting = await _experimentalAppInstaller('voting', {
      initializeArgs: [token.address, ...VOTING_SETTINGS],
    })
    await voting.createPermission('CREATE_VOTES_ROLE')
  },

  // Called when the start task needs to know the app proxy's init parameters.
  // Must return an array with the proxy's init parameters.
  getInitParams: async ({ log }, { web3, artifacts }) => {
    return [token.address, "Wrapped sample token", "wSPL"]
  },

  // Called after the app's proxy is updated with a new implementation.
  postUpdate: async ({ proxy, log }, { web3, artifacts }) => {},
}