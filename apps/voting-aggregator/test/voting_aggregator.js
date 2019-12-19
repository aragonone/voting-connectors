const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const { getEventArgument } = require('@aragon/test-helpers/events')
const { assertAmountOfEvents } = require('@aragon/test-helpers/assertEvent')(web3)
const getBlockNumber = require('@aragon/test-helpers/blockNumber')(web3)

const { deployDao } = require('./helpers/deploy.js')(artifacts)

const VotingAggregator = artifacts.require('VotingAggregator')
const Token = artifacts.require('TokenMock')
const Staking = artifacts.require('StakingMock')

const ERROR_ALREADY_INITIALIZED = 'INIT_ALREADY_INITIALIZED'
const ERROR_AUTH_FAILED = 'APP_AUTH_FAILED'
const ERROR_NO_POWER_SOURCE = 'VA_NO_POWER_SOURCE'
const ERROR_POWER_SOURCE_NOT_CONTRACT = 'VA_POWER_SOURCE_NOT_CONTRACT'
const ERROR_ZERO_WEIGHT = 'VA_ZERO_WEIGHT'
const ERROR_SAME_WEIGHT = 'VA_SAME_WEIGHT'
const ERROR_CAN_NOT_FORWARD = 'VA_CAN_NOT_FORWARD'
const ERROR_SOURCE_CALL_FAILED = 'VA_SOURCE_CALL_FAILED'
const ERROR_INVALID_CALL_OR_SELECTOR = 'VA_INVALID_CALL_OR_SELECTOR'

contract('VotingAggregator', ([_, root, unprivileged, eoa, user1, user2]) => {
  const ERC20WithCheckpointing = 0
  const ERC900 = 1

  let votingAggregator

  beforeEach('deploy dao with voting aggregator', async () => {
    const { dao, acl } = await deployDao(root)

    const votingAggregatorBase = await VotingAggregator.new()
    const { logs } = await dao.newAppInstance('0x1234', votingAggregatorBase.address, '0x', false, { from: root })
    votingAggregator = VotingAggregator.at(logs.find(l => l.event === 'NewAppProxy').args.proxy)
    await acl.createPermission(root, votingAggregator.address, await votingAggregator.ADD_POWER_SOURCE_ROLE(), root, { from: root })
    await acl.createPermission(root, votingAggregator.address, await votingAggregator.MANAGE_POWER_SOURCE_ROLE(), root, { from: root })
    await acl.createPermission(root, votingAggregator.address, await votingAggregator.MANAGE_WEIGHTS_ROLE(), root, { from: root })
  })

  describe('initialize', () => {
    const name = 'Voting Aggregator'
    const symbol = 'VA'
    const decimals = 18

    it('initializes app', async () => {
      await votingAggregator.initialize(name, symbol, decimals)
      assert.equal(await votingAggregator.name(), name, 'name mismatch')
      assert.equal(await votingAggregator.symbol(), symbol, 'symbol mismatch')
      assert.equal((await votingAggregator.decimals()).toString(), decimals, 'decimals mismatch')
    })

    it('cannot init twice', async () => {
      await votingAggregator.initialize(name, symbol, decimals)
      await assertRevert(votingAggregator.initialize(name, symbol, decimals), ERROR_ALREADY_INITIALIZED)
    })
  })

  describe('App is initialized', () => {
    let token

    beforeEach('init voting aggregator and deploy token', async () => {
      const name = 'Voting Aggregator'
      const symbol = 'VA'
      const decimals = 18

      await votingAggregator.initialize(name, symbol, decimals)
      token = await Token.new() // mints 1M e 18 tokens to sender
    })

    describe('Add power source', () => {
      it('fails to add power source if it is not contract', async () => {
        const weight = 1
        await assertRevert(votingAggregator.addPowerSource(eoa, ERC20WithCheckpointing, weight, { from: root }), ERROR_POWER_SOURCE_NOT_CONTRACT)
      })

      it('fails to add power source if weight is zero', async () => {
        const weight = 0
        await assertRevert(votingAggregator.addPowerSource(token.address, ERC20WithCheckpointing, weight, { from: root }), ERROR_ZERO_WEIGHT)
      })

      it('fails to add power source if does not have permission', async () => {
        const weight = 1
        await assertRevert(votingAggregator.addPowerSource(token.address, ERC20WithCheckpointing, weight, { from: unprivileged }), ERROR_AUTH_FAILED)
      })

      it('adds power source', async () => {
        const weight = 1
        const type = ERC20WithCheckpointing
        const powerSourcesLength = await votingAggregator.powerSourcesLength()
        const receipt = await votingAggregator.addPowerSource(token.address, type, weight, { from: root })
        assertAmountOfEvents(receipt, 'AddPowerSource')
        assert.equal(
          (powerSourcesLength.add(new web3.BigNumber(1))).toString(),
          (await votingAggregator.powerSourcesLength()).toString(),
          'power sources length not incremented'
        )
        const powerSource = await votingAggregator.getPowerSource(powerSourcesLength)
        assert.equal(powerSource[0], token.address, 'source address mismatch')
        assert.equal(powerSource[1], type, 'source type mismatch')
        assert.equal(powerSource[2].toString(), weight, 'weight mismatch')
        assert.equal(powerSource[3].toString(), 1, 'history length mismatch')
      })
    })

    describe('Change source weight', () => {
      const weight = 1
      let sourceId

      beforeEach('add power source', async () => {
        const type = ERC20WithCheckpointing
        const receipt = await votingAggregator.addPowerSource(token.address, type, weight, { from: root })
        sourceId = getEventArgument(receipt, 'AddPowerSource', 'sourceId')
      })

      it('fails to change power source weight if does not have permission', async () => {
        await assertRevert(votingAggregator.changeSourceWeight(sourceId, weight, { from: unprivileged }), ERROR_AUTH_FAILED)
      })

      it('fails to change power source weight if source does not exist', async () => {
        await assertRevert(votingAggregator.changeSourceWeight(sourceId.add(new web3.BigNumber(1)), weight, { from: root }), ERROR_NO_POWER_SOURCE)
      })

      it('fails to change power source weight if weight is the same', async () => {
        await assertRevert(votingAggregator.changeSourceWeight(sourceId, weight, { from: root }), ERROR_SAME_WEIGHT)
      })

      it('changes power source weight', async () => {
        const receipt = await votingAggregator.changeSourceWeight(sourceId, weight + 1, { from: root })
        assertAmountOfEvents(receipt, 'ChangePowerSourceWeight')
      })
    })

    describe('Disable source', () => {
      let sourceId

      beforeEach('add power source', async () => {
        const type = ERC20WithCheckpointing
        const weight = 1
        const receipt = await votingAggregator.addPowerSource(token.address, type, weight, { from: root })
        sourceId = getEventArgument(receipt, 'AddPowerSource', 'sourceId')
      })

      it('fails to disable power source if does not have permission', async () => {
        await assertRevert(votingAggregator.disableSource(sourceId, { from: unprivileged }), ERROR_AUTH_FAILED)
      })

      it('fails to disable power source if source does not exist', async () => {
        await assertRevert(votingAggregator.disableSource(sourceId.add(new web3.BigNumber(1)), { from: root }), ERROR_NO_POWER_SOURCE)
      })

      it('disables power source', async () => {
        const receipt = await votingAggregator.disableSource(sourceId, { from: root })
        assertAmountOfEvents(receipt, 'DisablePowerSource')
      })
    })

    describe('Enable source', () => {
      let sourceId

      beforeEach('add and disable power source', async () => {
        const type = ERC20WithCheckpointing
        const weight = 1
        const receipt = await votingAggregator.addPowerSource(token.address, type, weight, { from: root })
        sourceId = getEventArgument(receipt, 'AddPowerSource', 'sourceId')
        await votingAggregator.disableSource(sourceId, { from: root })
      })

      it('fails to enable power source if does not have permission', async () => {
        await assertRevert(votingAggregator.enableSource(sourceId, { from: unprivileged }), ERROR_AUTH_FAILED)
      })

      it('fails to enable power source if source does not exist', async () => {
        await assertRevert(votingAggregator.enableSource(sourceId.add(new web3.BigNumber(1)), { from: root }), ERROR_NO_POWER_SOURCE)
      })

      it('enables power source', async () => {
        const receipt = await votingAggregator.enableSource(sourceId, { from: root })
        assertAmountOfEvents(receipt, 'EnablePowerSource')
      })
    })

    describe('Aggregation', () => {
      let staking

      const users = [
        { address: user1, amount: new web3.BigNumber(1e18)},
        { address: user2, amount: new web3.BigNumber(2e18)}
      ]
      const checkpoints = [1, 2, 3].map(c => new web3.BigNumber(c))

      const addBalances = async (blockNumber) => {
        Promise.all(users.map(
          user => checkpoints.map(
            checkpoint => [
              token.addBalanceAt(user.address, blockNumber.add(checkpoint), user.amount.mul(checkpoint)),
              staking.stakeForAt(user.address, blockNumber.add(checkpoint), user.amount.mul(checkpoint).mul(new web3.BigNumber(2)))
            ]
          )
        ).reduce((acc, val) => acc.concat(val), []))
      }

      beforeEach('deploy stake, add sources', async () => {
        // deploy staking
        staking = await Staking.new()

        // add sources
        const tokenWeight = 1
        const stakingWeight = 3
        await votingAggregator.addPowerSource(token.address, ERC20WithCheckpointing, tokenWeight, { from: root })
        await votingAggregator.addPowerSource(staking.address, ERC900, stakingWeight, { from: root })

      })

      context('When all sources are enabled', () => {
        let blockNumber

        beforeEach('add balances', async () => {
          blockNumber = new web3.BigNumber(await getBlockNumber())
          await addBalances(blockNumber)
        })

        it('user aggregations match', async () => {
          for (const user of users) {
            for (const checkpointOffset of checkpoints) {
              const checkpoint = blockNumber.add(checkpointOffset)
              assert.equal(
                (await votingAggregator.balanceOfAt(user.address, checkpoint)).toString(),
                user.amount.mul(checkpointOffset).mul(new web3.BigNumber(7)).toString(),
                `balance doesn't match for user ${user.address} and checkpoint ${checkpoint}`
              )
            }
          }
        })

        it('total aggregations match', async () => {
          for (const checkpointOffset of checkpoints) {
            const checkpoint = blockNumber.add(checkpointOffset)
            assert.equal(
              (await votingAggregator.totalSupplyAt(checkpoint)).toString(),
              users.reduce(
                (acc, user) => acc.add(user.amount.mul(checkpointOffset).mul(new web3.BigNumber(7)).toString()),
                new web3.BigNumber(0)
              ).toString(),
              `total supply doesn't match at checkpoint ${checkpoint}`
            )
          }
        })
      })

      context('When some sources are disabled', () => {
        let blockNumber

        beforeEach('add balances', async () => {
          await votingAggregator.disableSource(1, { from: root })

          blockNumber = new web3.BigNumber(await getBlockNumber())

          await addBalances(blockNumber)
        })

        it('user aggregations match', async () => {
          for (const user of users) {
            for (const checkpointOffset of checkpoints) {
              const checkpoint = blockNumber.add(checkpointOffset)
              assert.equal(
                (await votingAggregator.balanceOfAt(user.address, checkpoint)).toString(),
                user.amount.mul(checkpointOffset).toString(),
                `balance doesn't match for user ${user.address} and checkpoint ${checkpoint}`
              )
            }
          }
        })

        it('total aggregations match', async () => {
          for (const checkpointOffset of checkpoints) {
            const checkpoint = blockNumber.add(checkpointOffset)
            assert.equal(
              (await votingAggregator.totalSupplyAt(checkpoint)).toString(),
              users.reduce(
                (acc, user) => acc.add(user.amount.mul(checkpointOffset).toString()),
                new web3.BigNumber(0)
              ).toString(),
              `total supply doesn't match at checkpoint ${checkpoint}`
            )
          }
        })
      })
    })
  })
})
