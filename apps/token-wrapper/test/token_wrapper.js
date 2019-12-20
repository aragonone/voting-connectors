const { assertRevert } = require('@aragon/test-helpers/assertThrow')

const { deployDao } = require('./helpers/deploy.js')(artifacts)

const ERC20 = artifacts.require('ERC20Sample')
const TokenWrapper = artifacts.require('TokenWrapper')

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

contract('TokenWrapper', ([_, root, holder, someone]) => {
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
    assert.equal(await tokenWrapper.outsideToken(), erc20.address)
  })

  it('can mint tokens', async () => {
    await erc20.approve(tokenWrapper.address, 2e18, { from: holder })
    await tokenWrapper.deposit(2e18, { from: holder })

    assert.isTrue(await tokenWrapper.canForward(holder, '0x'))
    assert.equal((await erc20.balanceOf(holder)).toString(), 999998e18)
  })

  it('can not mint invalid amounts', async () => {
    await assertRevert(tokenWrapper.deposit(0, { from: holder }), 'TW_DEPOSIT_AMOUNT_ZERO')
    await assertRevert(tokenWrapper.deposit(1e30, { from: holder }), 'TW_TOKEN_TRANSFER_FROM_FAILED')
  })

  it('can burn tokens', async () => {
    await tokenWrapper.withdraw(1e18, { from: holder })

    assert.equal((await erc20.balanceOf(holder)).toString(), 999999e18)
  })

  it('can not burn invalid amounts', async () => {
    await assertRevert(tokenWrapper.withdraw(0, { from: holder }), 'TW_WITHDRAW_AMOUNT_ZERO')
    await assertRevert(tokenWrapper.withdraw(1e30, { from: holder }), 'TW_INVALID_WITHDRAW_AMOUNT')
  })
})
