const { assertRevert } = require('@aragon/test-helpers/assertThrow')

const ACL = artifacts.require('ACL')
const Kernel = artifacts.require('Kernel')
const ERC20 = artifacts.require('ERC20Sample')
const MiniMeToken = artifacts.require('MiniMeToken')
const TokenWrapper = artifacts.require('TokenWrapper')

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

contract('TokenWrapper', ([_, root, holder, someone]) => {
  let dao, acl, tokenWrapper, erc20, token

  before('deploy dao with token wrapper', async () => {
    dao = await Kernel.new(false)
    const aclBase = await ACL.new()
    await dao.initialize(aclBase.address, root)
    acl = ACL.at(await dao.acl())
    await acl.createPermission(root, dao.address, await dao.APP_MANAGER_ROLE(), root, { from: root })

    const tokenWrapperBase = await TokenWrapper.new()
    const { logs } = await dao.newAppInstance('0x1234', tokenWrapperBase.address, '0x', false, { from: root })
    tokenWrapper = TokenWrapper.at(logs.find(l => l.event === 'NewAppProxy').args.proxy)

    erc20 = await ERC20.new({ from: holder }) // mints 1M e 18 tokens to sender
    token = await MiniMeToken.new(ZERO_ADDRESS, ZERO_ADDRESS, 0, 'Token', 18, 'TWR', false, { from: root })
    await token.changeController(tokenWrapper.address, { from: root })
    await tokenWrapper.initialize(token.address, erc20.address)
  })

  it('has an erc20 and a minime token', async () => {
    assert.isTrue(await tokenWrapper.isForwarder())
    assert.equal(await tokenWrapper.erc20(), erc20.address)
    assert.equal(await tokenWrapper.token(), token.address)
  })

  it('can mint tokens', async () => {
    await erc20.approve(tokenWrapper.address, 2e18, { from: holder })
    await tokenWrapper.deposit(2e18, { from: holder })

    assert.isTrue(await tokenWrapper.canForward(holder, '0x'))
    assert.equal((await token.balanceOf(holder)).toString(), 2e18)
    assert.equal((await erc20.balanceOf(holder)).toString(), 999998e18)
  })

  it('can not mint invalid amounts', async () => {
    await assertRevert(tokenWrapper.deposit(0, { from: holder }), 'TW_DEPOSIT_AMOUNT_ZERO')
    await assertRevert(tokenWrapper.deposit(1e30, { from: holder }), 'TW_ERC20_TRANSFER_FROM_FAILED')
  })

  it('can burn tokens', async () => {
    await tokenWrapper.withdraw(1e18, { from: holder })

    assert.equal((await token.balanceOf(holder)).toString(), 1e18)
    assert.equal((await erc20.balanceOf(holder)).toString(), 999999e18)
  })

  it('can not burn invalid amounts', async () => {
    await assertRevert(tokenWrapper.withdraw(0, { from: holder }), 'TW_WITHDRAW_AMOUNT_ZERO')
    await assertRevert(tokenWrapper.withdraw(1e30, { from: holder }), 'TW_INVALID_WITHDRAW_AMOUNT')
  })

  it('does not allow to transfer tokens', async () => {
    await assertRevert(token.transfer(someone, 1e16, { from: holder }))
  })

  it('does not allow to approve tokens', async () => {
    await assertRevert(token.approve(someone, 1e16, { from: holder }))
  })
})
