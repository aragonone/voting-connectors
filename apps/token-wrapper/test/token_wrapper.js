const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const { getNewProxyAddress } = require('@aragon/test-helpers/events')
const getBlockNumber = require('@aragon/test-helpers/blockNumber')(web3)
const { encodeCallScript } = require('@aragon/test-helpers/evmScript')

const { deployDao } = require('./helpers/deploy.js')(artifacts)

const ERC20 = artifacts.require('ERC20Sample')
const ERC20Disablable = artifacts.require('ERC20Disablable')
const TokenWrapper = artifacts.require('TokenWrapper')
const ExecutionTarget = artifacts.require('ExecutionTarget')

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

contract('TokenWrapper', ([_, root, holder, someone]) => {
  const wrappedName = 'Token Wrapper'
  const wrappedSymbol = 'TWR'
  let tokenWrapperBase, tokenWrapper

  before('deploy base', async () => {
    tokenWrapperBase = await TokenWrapper.new()
  })

  beforeEach('deploy dao with uninitialized token wrapper', async () => {
    const { dao, acl } = await deployDao(root)

    const installReceipt = await dao.newAppInstance('0x1234', tokenWrapperBase.address, '0x', false, { from: root })
    tokenWrapper = TokenWrapper.at(getNewProxyAddress(installReceipt))
  })

  describe('Wrong initialization', () => {
    it('fails initializing if token is not contract', async () => {
      await assertRevert(tokenWrapper.initialize(someone, wrappedName, wrappedSymbol), 'TW_TOKEN_NOT_CONTRACT')
    })
  })

  describe('Wrapping a proper token', () => {
    let erc20

    beforeEach('initialize token wrapper with token', async () => {
      erc20 = await ERC20.new({ from: holder }) // mints 1M e 18 tokens to sender
      await tokenWrapper.initialize(erc20.address, wrappedName, wrappedSymbol)
    })

    it('is an erc20', async () => {
      assert.equal(await tokenWrapper.name(), wrappedName)
      assert.equal(await tokenWrapper.symbol(), wrappedSymbol)
      assert.equal((await tokenWrapper.decimals()).toString(), (await erc20.decimals()).toString())
    })

    it('is a forwarder', async () => {
      assert.isTrue(await tokenWrapper.isForwarder())
    })

    it('fails to forward if balance is zero', async () => {
      const executionTarget = await ExecutionTarget.new()

      const action = { to: executionTarget.address, calldata: executionTarget.contract.execute.getData() }
      const script = encodeCallScript([action])

      await assertRevert(tokenWrapper.forward(script, { from: holder }), 'TW_CAN_NOT_FORWARD')
    })

    it('allows to forward', async () => {
      const executionTarget = await ExecutionTarget.new()

      const action = { to: executionTarget.address, calldata: executionTarget.contract.execute.getData() }
      const script = encodeCallScript([action])

      const amount = 1
      await erc20.approve(tokenWrapper.address, amount, { from: holder })
      await tokenWrapper.deposit(amount, { from: holder })

      await tokenWrapper.forward(script, { from: holder })
      assert.equal((await executionTarget.counter()).toString(), 1, 'should have received execution call')
    })

    it('has an erc20 token', async () => {
      assert.equal(await tokenWrapper.depositedToken(), erc20.address)
    })

    it('can mint tokens', async () => {
      const amount = 2e18
      const initialBlockNumber = new web3.BigNumber(await getBlockNumber())

      await erc20.approve(tokenWrapper.address, amount, { from: holder })
      await tokenWrapper.deposit(amount, { from: holder })

      assert.equal((await tokenWrapper.balanceOfAt(holder, initialBlockNumber)).toString(), 0, 'Holder balance doesn\'t match')
      assert.equal((await tokenWrapper.totalSupplyAt(initialBlockNumber)).toString(), 0, 'Total supply doesn\'t match')
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
      // First add wrapped tokens
      const wrappedAmount = 2e18
      await erc20.approve(tokenWrapper.address, wrappedAmount, { from: holder })
      await tokenWrapper.deposit(wrappedAmount, { from: holder })

      const previousBalance = await tokenWrapper.balanceOf(holder)
      const previousSupply = await tokenWrapper.totalSupply()

      // Withdraw
      const unwrappedAmount = new web3.BigNumber(1e18)
      await tokenWrapper.withdraw(unwrappedAmount, { from: holder })

      assert.equal((await tokenWrapper.balanceOf(holder)).toString(), previousBalance.sub(unwrappedAmount), "Holder balance doesn't match")
      assert.equal((await tokenWrapper.totalSupply()).toString(), previousSupply.sub(unwrappedAmount), "Total supply doesn't match")

      assert.equal((await erc20.balanceOf(holder)).toString(), 999999e18)
    })

    it('can not burn invalid amounts', async () => {
      await assertRevert(tokenWrapper.withdraw(0, { from: holder }), 'TW_WITHDRAW_AMOUNT_ZERO')
      await assertRevert(tokenWrapper.withdraw(1e30, { from: holder }), 'TW_INVALID_WITHDRAW_AMOUNT')
    })
  })

  describe('Wrapping a failing token', () => {
    let erc20

    beforeEach('initialize token wrapper with disablable token', async () => {
      erc20 = await ERC20Disablable.new({ from: holder }) // mints 1M e 18 tokens to sender
      await tokenWrapper.initialize(erc20.address, wrappedName, wrappedSymbol)
    })

    it('can not mint if transfer fails', async () => {
      // approve
      const amount = 1e18
      await erc20.approve(tokenWrapper.address, amount, { from: holder })

      // disable token and try to mint
      await erc20.disable(true)
      await assertRevert(tokenWrapper.deposit(amount, { from: holder }), 'TW_TOKEN_TRANSFER_FROM_FAILED')
    })

    it('can not burn if transfer fails', async () => {
      // mint
      const amount = 1e18
      await erc20.approve(tokenWrapper.address, amount, { from: holder })
      await tokenWrapper.deposit(amount, { from: holder })

      // disable token and try to burn
      await erc20.disable(true)
      await assertRevert(tokenWrapper.withdraw(amount, { from: holder }), 'TW_TOKEN_TRANSFER_FAILED')
    })
  })
})
