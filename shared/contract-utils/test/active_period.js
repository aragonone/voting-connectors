const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const { getRandomInt } = require('./helpers/math')

const ActivePeriodWrapper = artifacts.require('ActivePeriodWrapper')

const ERROR_TIME_TOO_BIG = 'ACTIVEPERIOD_TIME_TOO_BIG'
const ERROR_LAST_PERIOD_ACTIVE = 'ACTIVEPERIOD_LAST_PERIOD_ACTIVE'
const ERROR_NO_PERIODS = 'ACTIVEPERIOD_NO_PERIODS'
const ERROR_LAST_NOT_ACTIVE = 'ACTIVEPERIOD_LAST_NOT_ACTIVE'
const ERROR_BAD_STOP_TIME = 'ACTIVEPERIOD_BAD_STOP_TIME'
const ERROR_INVALID_SEARCH = 'ACTIVEPERIOD_INVALID_SEARCH'

const MAX_UINT64 = new web3.BigNumber(2).pow(64).sub(new web3.BigNumber(1))
const NO_END_TIME = MAX_UINT64

contract('ActivePeriod lib', ([_, root]) => {
  let activePeriodWrapper

  async function assertPeriod({ from, to, shouldBeActive }) {
    // Arbitrarily large time into the future
    if (!to) { to = 1e9 }
    const assertFn = shouldBeActive ? assert.isTrue : assert.isFalse

    // Check ends
    assertFn(
      await activePeriodWrapper.isEnabledAt(from),
      `Start time is not valid (expected to be ${shouldBeActive ? 'active' : 'not active'})`
    )
    assertFn(
      await activePeriodWrapper.isEnabledAt(to),
      `End time is not valid (expected to be ${shouldBeActive ? 'active' : 'not active'})`
    )

    // Randomly check inside
    for (let checkNum = 0; checkNum < 10; ++checkNum) {
      assertFn(await activePeriodWrapper.isEnabledAt(getRandomInt(from, to)))
    }
  }

  async function assertPeriodTimes(periodIndex, expectedEnabledFrom, expectedDisabledOn) {
    const [enabledFrom, disabledOn] = await activePeriodWrapper.getPeriod(periodIndex)
    assert.equal(enabledFrom.toString(), expectedEnabledFrom.toString(), 'Start time of period is not correct')
    assert.equal(disabledOn.toString(), expectedDisabledOn.toString(), 'End time of period is not correct')
  }

  beforeEach('deploy lib wrapper', async () => {
    activePeriodWrapper = await ActivePeriodWrapper.new()
  })

  describe('start new period', () => {
    it('fails to start a new period if from date is too big', async () => {
      const start = MAX_UINT64.add(new web3.BigNumber(1))
      await assertRevert(activePeriodWrapper.startNextPeriodFrom(start), ERROR_TIME_TOO_BIG)
    })

    context('when there is not a period', () => {
      it('starts a new period', async () => {
        const start = 100
        // Should not be enabled yet
        await assertPeriod({ shouldBeActive: false, from: 0, to: start })

        await activePeriodWrapper.startNextPeriodFrom(start)
        await assertPeriodTimes(0, start, NO_END_TIME)
        await assertPeriod({ shouldBeActive: true, from: start })

        // Previous time should still be disabled
        await assertPeriod({ shouldBeActive: false, from: 0, to: start - 1 })
      })
    })

    context('when there is only one existing period', () => {
      const firstStart = 100

      beforeEach(async () => {
        // Set up first period for [100, Infinity)
        await activePeriodWrapper.startNextPeriodFrom(firstStart)
      })

      context('when the only existing period has an end time', () => {
        const firstEnd = 200

        beforeEach(async () => {
          // Finalize first period for [100, 200)
          await activePeriodWrapper.stopCurrentPeriodAt(firstEnd)
        })

        it('starts a new period using a date past the only period', async () => {
          const nextStart = firstEnd + 100
          await activePeriodWrapper.startNextPeriodFrom(nextStart)
          await assertPeriodTimes(1, nextStart, NO_END_TIME)
          await assertPeriod({ shouldBeActive: true, from: nextStart })

          // Time between first period and next period should be disabled
          await assertPeriod({ shouldBeActive: false, from: firstEnd, to: nextStart - 1 })
        })

        it("fails to start a new period using a date in the only period's active period", async () => {
          await assertRevert(activePeriodWrapper.startNextPeriodFrom(firstEnd - 1), ERROR_LAST_PERIOD_ACTIVE)
        })
      })

      context('when the only existing period does not have an end time', () => {
        it('fails to start a new period before the existing period', async () => {
          await assertRevert(activePeriodWrapper.startNextPeriodFrom(firstStart - 1), ERROR_LAST_PERIOD_ACTIVE)
        })

        it('fails to start a new period after the existing period', async () => {
          await assertRevert(activePeriodWrapper.startNextPeriodFrom(firstStart + 1), ERROR_LAST_PERIOD_ACTIVE)
        })
      })
    })

    context('when there are multiple periods', () => {
      // Tuples of [from, to]
      const periods = [[100, 200], [300, 400], [500]]
      const initialLastPeriodIndex = periods.length - 1
      const lastStart = periods[initialLastPeriodIndex]

      beforeEach(async () => {
        // Set up periods
        for (const [from, to] of periods) {
          await activePeriodWrapper.startNextPeriodFrom(from)
          if (to) {
            await activePeriodWrapper.stopCurrentPeriodAt(to)
          }
        }
      })

      it('fails to start a new period using a date in between a previous period', async () => {
        await assertRevert(activePeriodWrapper.startNextPeriodFrom(periods[0][1] + 1), ERROR_LAST_PERIOD_ACTIVE)
        await assertRevert(activePeriodWrapper.startNextPeriodFrom(periods[1][1] + 1), ERROR_LAST_PERIOD_ACTIVE)
      })

      it("fails to start a new period using a date in a previous period's active period", async () => {
        await assertRevert(activePeriodWrapper.startNextPeriodFrom(periods[0][1] - 1), ERROR_LAST_PERIOD_ACTIVE)
        await assertRevert(activePeriodWrapper.startNextPeriodFrom(periods[1][1] - 1), ERROR_LAST_PERIOD_ACTIVE)
      })

      context('when the last period has an end time', () => {
        const lastEnd = lastStart + 100

        beforeEach(async () => {
          // Finalize last period
          await activePeriodWrapper.stopCurrentPeriodAt(lastEnd)
        })

        it('starts a new period using a date past last period', async () => {
          const nextStart = lastEnd + 100
          await activePeriodWrapper.startNextPeriodFrom(nextStart)
          await assertPeriodTimes(initialLastPeriodIndex + 1, nextStart, NO_END_TIME)
          await assertPeriod({ shouldBeActive: true, from: nextStart })

          // Time between first period and next period should be disabled
          await assertPeriod({ shouldBeActive: false, from: lastEnd, to: nextStart - 1 })
        })

        it("fails to start a new period using a date in the last period's active period", async () => {
          await assertRevert(activePeriodWrapper.startNextPeriodFrom(lastEnd - 1), ERROR_LAST_PERIOD_ACTIVE)
        })
      })

      context('when the last period does not have an end time', () => {
        it('fails to start a new period before the last period', async () => {
          await assertRevert(activePeriodWrapper.startNextPeriodFrom(lastStart - 1), ERROR_LAST_PERIOD_ACTIVE)
        })

        it('fails to start a new period after the last period', async () => {
          await assertRevert(activePeriodWrapper.startNextPeriodFrom(lastStart + 1), ERROR_LAST_PERIOD_ACTIVE)
        })
      })
    })
  })

  describe('stop current period', () => {
    context('when there is not a period', () => {
      it('fails to stop current period', async () => {
        const end = 1
        await assertRevert(activePeriodWrapper.stopCurrentPeriodAt(end), ERROR_NO_PERIODS)
      })
    })

    context('when there is an existing period', () => {
      const start = 100

      beforeEach(async () => {
        // Set up first period for [100, Infinity)
        await activePeriodWrapper.startNextPeriodFrom(start)
      })

      it('fails to stop current period if period is too big', async () => {
        const end = MAX_UINT64.add(new web3.BigNumber(1))
        await assertRevert(activePeriodWrapper.stopCurrentPeriodAt(end), ERROR_TIME_TOO_BIG)
      })

      context('when the period does not have an end time', () => {
        it('stops current period', async () => {
          const end = start + 100

          // Initially, period should be continually active
          await assertPeriod({ shouldBeActive: true, from: start })

          await activePeriodWrapper.stopCurrentPeriodAt(end)
          await assertPeriodTimes(0, start, end)
          // Period should now be disabled into the future
          await assertPeriod({ shouldBeActive: false, from: end + 1 })

          // Period should now only be active until the end date
          await assertPeriod({ shouldBeActive: true, from: start, to: end - 1 })
        })

        it('fails to stop current period if end time is equal to start time', async () => {
          const end = start
          await assertRevert(activePeriodWrapper.stopCurrentPeriodAt(end), ERROR_BAD_STOP_TIME)
        })

        it('fails to stop current period if disabled time is less than enabled time', async () => {
          const end = start - 1
          await assertRevert(activePeriodWrapper.stopCurrentPeriodAt(end), ERROR_BAD_STOP_TIME)
        })
      })

      context('when the period already has an end time', () => {
        const end = 200

        beforeEach(async () => {
          // Finalize first period for [100, 200)
          await activePeriodWrapper.stopCurrentPeriodAt(end)
        })

        it('fails to stop period with already existing end time', async () => {
          await assertRevert(activePeriodWrapper.stopCurrentPeriodAt(end - 1), ERROR_LAST_NOT_ACTIVE)
          await assertRevert(activePeriodWrapper.stopCurrentPeriodAt(end), ERROR_LAST_NOT_ACTIVE)
          await assertRevert(activePeriodWrapper.stopCurrentPeriodAt(end + 1), ERROR_LAST_NOT_ACTIVE)
        })
      })
    })
  })

  // TODO: test isEnabledAt()
})
