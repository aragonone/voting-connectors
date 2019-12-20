const { assertRevert } = require('@aragon/test-helpers/assertThrow')

const { deployDao } = require('./helpers/deploy.js')(artifacts)

const ERC20 = artifacts.require('ERC20Sample')
const ERC20Bad = artifacts.require('ERC20Bad')
const TokenWrapper = artifacts.require('TokenWrapper')

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

contract('TokenWrapper', ([_, root, holder, someone]) => {
  describe('Wrapping a proper token', () => {
    let dao, acl, tokenWrapper, erc20

    before('deploy dao with token wrapper', async () => {
      ({ dao, acl } = await deployDao(root))

      const tokenWrapperBase = await TokenWrapper.new()
      const { logs } = await dao.newAppInstance('0x1234', tokenWrapperBase.address, '0x', false, { from: root })
      tokenWrapper = TokenWrapper.at(logs.find(l => l.event === 'NewAppProxy').args.proxy)

      erc20 = await ERC20.new({ from: holder }) // mints 1M e 18 tokens to sender
      await tokenWrapper.initialize(erc20.address, 'Token Wrapper', 'TWR')
    })

    it('has an erc20 token', async () => {
      assert.isTrue(await tokenWrapper.isForwarder())
      assert.equal(await tokenWrapper.depositedToken(), erc20.address)
      assert.equal(await tokenWrapper.decimals(), 18) // hardcoded in ERC20Sample
    })

    it('can mint tokens', async () => {
      const amount = 2e18
      await erc20.approve(tokenWrapper.address, amount, { from: holder })
      await tokenWrapper.deposit(amount, { from: holder })

      assert.equal((await tokenWrapper.balanceOf(holder)).toString(), amount, 'Holder balance doesn\'t match')
      assert.equal((await tokenWrapper.totalSupply()).toString(), amount, 'Total supply doesn\'t match')
      assert.isTrue(await tokenWrapper.canForward(holder, '0x'))
      assert.equal((await erc20.balanceOf(holder)).toString(), 999998e18)
    })

    it('can not mint invalid amounts', async () => {
      await assertRevert(tokenWrapper.deposit(0, { from: holder }), 'TW_DEPOSIT_AMOUNT_ZERO')
      await assertRevert(tokenWrapper.deposit(1e30, { from: holder }), 'TW_TOKEN_TRANSFER_FROM_FAILED')
    })

    it('can burn tokens', async () => {
      const previousBalance = await tokenWrapper.balanceOf(holder)
      const previousSupply = await tokenWrapper.totalSupply()

      const amount = new web3.BigNumber(1e18)
      await tokenWrapper.withdraw(amount, { from: holder })

      assert.equal((await tokenWrapper.balanceOf(holder)).toString(), previousBalance.sub(amount), 'Holder balance doesn\'t match')
      assert.equal((await tokenWrapper.totalSupply()).toString(), previousSupply.sub(amount), 'Total supply doesn\'t match')

      assert.equal((await erc20.balanceOf(holder)).toString(), 999999e18)
    })

    it('can not burn invalid amounts', async () => {
      await assertRevert(tokenWrapper.withdraw(0, { from: holder }), 'TW_WITHDRAW_AMOUNT_ZERO')
      await assertRevert(tokenWrapper.withdraw(1e30, { from: holder }), 'TW_INVALID_WITHDRAW_AMOUNT')
    })
  })

  describe('Wrapping a proper token', () => {
    let dao, acl, tokenWrapper, erc20

    before('deploy dao with token wrapper', async () => {
      ({ dao, acl } = await deployDao(root))

      const tokenWrapperBase = await TokenWrapper.new()
      const { logs } = await dao.newAppInstance('0x1234', tokenWrapperBase.address, '0x', false, { from: root })
      tokenWrapper = TokenWrapper.at(logs.find(l => l.event === 'NewAppProxy').args.proxy)

      erc20 = await ERC20Bad.new({ from: holder }) // mints 1M e 18 tokens to sender
      await tokenWrapper.initialize(erc20.address, 'Token Wrapper', 'TWR')
    })

    it('can not burn if transfer fails', async () => {
      // mint
      await erc20.enable(true)
      const amount = 1e18
      await erc20.approve(tokenWrapper.address, amount, { from: holder })
      await tokenWrapper.deposit(amount, { from: holder })

      // disable token and try to burn
      await erc20.enable(false)
      await assertRevert(tokenWrapper.withdraw(amount, { from: holder }), 'TW_TOKEN_TRANSFER_FAILED')
    })
  })
})
