const { assertRevert } = require('@aragon/test-helpers/assertThrow')

const ActivePeriodWrapper = artifacts.require('ActivePeriodWrapper')

const ERROR_TIME_TOO_BIG = 'ACTIVEPERIOD_TIME_TOO_BIG'
const ERROR_BAD_START_TIME = 'ACTIVEPERIOD_BAD_START_TIME'
const ERROR_NO_PERIODS = 'ACTIVEPERIOD_NO_PERIODS'
const ERROR_LAST_NOT_ACTIVE = 'ACTIVEPERIOD_LAST_NOT_ACTIVE'
const ERROR_BAD_STOP_TIME = 'ACTIVEPERIOD_BAD_STOP_TIME'
const ERROR_INVALID_SEARCH = 'ACTIVEPERIOD_INVALID_SEARCH'

const MAX_UINT128 = new web3.BigNumber(2).pow(128).sub(new web3.BigNumber(1))

contract('ActivePeriod lib', ([_, root]) => {
  let activePeriodWrapper

  beforeEach('deploy lib wrapper', async () => {
    activePeriodWrapper = await ActivePeriodWrapper.new()
  })

  describe('start new period', () => {
    it('starts a new period', async () => {
      const enabledFromTime = 10

      assert.isFalse(await activePeriodWrapper.isEnabledAt(enabledFromTime))

      await activePeriodWrapper.startNewPeriodFrom(enabledFromTime)

      assert.isFalse(await activePeriodWrapper.isEnabledAt(enabledFromTime - 1))
      assert.isTrue(await activePeriodWrapper.isEnabledAt(enabledFromTime))
    })

    it('fails to start a new period if period is too big', async () => {
      const enabledFromTime = MAX_UINT128.add(new web3.BigNumber(1))
      await assertRevert(activePeriodWrapper.startNewPeriodFrom(enabledFromTime), ERROR_TIME_TOO_BIG)
    })

    it('fails to start a new period if there is a previous activated one', async () => {
      const firstEnabledFromTime = 0
      await activePeriodWrapper.startNewPeriodFrom(firstEnabledFromTime)

      const enabledFromTime = 1
      await assertRevert(activePeriodWrapper.startNewPeriodFrom(enabledFromTime), ERROR_BAD_START_TIME)
    })
  })
  describe('stop current period', () => {
    context('when there is not a period', () => {
      it('fails to stop current period if period is too big', async () => {
        const disabledOnTime = 1
        await assertRevert(activePeriodWrapper.stopCurrentPeriodAt(disabledOnTime), ERROR_NO_PERIODS)
      })
    })

    context('when there is a period', () => {
      const enabledFromTime = 10
      beforeEach('start new period', async () => {
        await activePeriodWrapper.startNewPeriodFrom(enabledFromTime)
      })

      context('when the last period is not active', () => {
        beforeEach('stop last period', async () => {
          const disabledOnTime = enabledFromTime + 1
          await activePeriodWrapper.stopCurrentPeriodAt(disabledOnTime)
        })

        it('fails to stop current period if it is not active', async () => {
          const disabledOnTime = enabledFromTime + 1
          await assertRevert(activePeriodWrapper.stopCurrentPeriodAt(disabledOnTime), ERROR_LAST_NOT_ACTIVE)
        })
      })

      context('when the last period is active', () => {
        it('stops current period', async () => {
          const disabledOnTime = enabledFromTime + 1

          assert.isTrue(await activePeriodWrapper.isEnabledAt(disabledOnTime))

          await activePeriodWrapper.stopCurrentPeriodAt(disabledOnTime)

          assert.isTrue(await activePeriodWrapper.isEnabledAt(enabledFromTime))
          assert.isFalse(await activePeriodWrapper.isEnabledAt(disabledOnTime))
        })

        it('fails to stop current period if period is too big', async () => {
          const disabledOnTime = MAX_UINT128.add(new web3.BigNumber(1))
          await assertRevert(activePeriodWrapper.stopCurrentPeriodAt(disabledOnTime), ERROR_TIME_TOO_BIG)
        })

        it('fails to stop current period if disabled time is equal to enabled time', async () => {
          const disabledOnTime = enabledFromTime
          await assertRevert(activePeriodWrapper.stopCurrentPeriodAt(disabledOnTime), ERROR_BAD_STOP_TIME)
        })

        it('fails to stop current period if disabled time is less than enabled time', async () => {
          const disabledOnTime = enabledFromTime - 1
          await assertRevert(activePeriodWrapper.stopCurrentPeriodAt(disabledOnTime), ERROR_BAD_STOP_TIME)
        })
      })
    })
  })
})
