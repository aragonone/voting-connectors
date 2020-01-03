const { assertRevert } = require('@aragon/test-helpers/assertThrow')

contract('Checkpointing Helpers test', () => {
  let checkpointingHelpersMock

  before(async () => {
    checkpointingHelpersMock = await artifacts.require('CheckpointingHelpersWrapper').new()
  })

  it('converts from uint256 to uint64', async () => {
    const a = 1234
    assert.equal((await checkpointingHelpersMock.convertUint64(a)).toString(), a, 'values should match')
  })

  it('fails converting from uint256 to uint64 if too big', async () => {
    const a = new web3.BigNumber(2).pow(64)
    await assertRevert(checkpointingHelpersMock.convertUint64(a))
  })

  it('converts from uint256 to uint192', async () => {
    const a = 1234
    assert.equal((await checkpointingHelpersMock.convertUint192(a)).toString(), a, 'values should match')
  })

  it('fails converting from uint256 to uint192 if too big', async () => {
    const a = new web3.BigNumber(2).pow(192)
    await assertRevert(checkpointingHelpersMock.convertUint192(a))
  })
})
