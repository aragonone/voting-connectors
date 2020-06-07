const { BN } = require('web3-utils')

const { assertRevert } = require('@aragon/contract-test-helpers/assertThrow')

const CheckpointingWrapper = artifacts.require('CheckpointingWrapper')

const bn = x => new BN(x)
const bigExp = (x, y) => bn(x).mul(bn(10).pow(bn(y)))

contract('Checkpointing', () => {
  let checkpointing

  const generateRandomTest = size => {
    const rand = () => parseInt(10000 * Math.random())

    let values = []
    let expects = []

    for (let i = 0; i < size; i++) {
      const prev = values[i - 1] || { t: 0, v: 0 }
      const t = 1 + prev.t + rand()
      const v = rand()
      values.push({ t, v })

      expects.push({ t: t - 1, v: prev.v })
      expects.push({ t, v })
    }

    return {
      values,
      expects,
      size,
    }
  }

  const tests = [
    {
      description: 'odd number of checkpoints',
      values: [{ t: 1, v: 2 }, { t: 3, v: 5 }, { t: 5, v: 3 }],
      expects: [{ t: 0, v: 0 }, { t: 1, v: 2 }, { t: 2, v: 2 }, { t: 3, v: 5 }, { t: 4, v: 5 }, { t: 5, v: 3 }, { t: 1000, v: 3 }],
      size: 3
    },
    {
      description: 'even number of checkpoints',
      values: [{ t: 1, v: 2 }, { t: 3, v: 5 }, { t: 5, v: 3 }, { t: 1000, v: 4 }],
      expects: [{ t: 0, v: 0 }, { t: 1, v: 2 }, { t: 2, v: 2 }, { t: 3, v: 5 }, { t: 4, v: 5 }, { t: 5, v: 3 }, { t: 999, v: 3 }, { t: 1000, v: 4 }],
      size: 4
    },
    {
      description: 'change existing checkpoint',
      values: [{ t: 1, v: 2 }, { t: 3, v: 5 }, { t: 3, v: 6}, { t: 5, v: 3 }],
      expects: [{ t: 0, v: 0 }, { t: 1, v: 2 }, { t: 2, v: 2 }, { t: 3, v: 6 }, { t: 4, v: 6 }, { t: 5, v: 3 }, { t: 1000, v: 3 }],
      size: 3
    },
    {
      description: 'random test small',
      ...generateRandomTest(10),
    },
    {
      description: 'random test big',
      ...generateRandomTest(50),
    },
  ]

  beforeEach(async () => {
    checkpointing = await CheckpointingWrapper.new()
  })

  describe('checkpointing supports:', () => {
    tests.forEach(({ description, values, expects, size }) => {
      it(description, async () => {
        assert.equal(await checkpointing.lastUpdated(), 0, 'last updated should be 0')

        // add values sequentially
        await values.reduce(
          (prev, { v, t }) => prev.then(() => checkpointing.addCheckpoint(t, v)),
          Promise.resolve()
        )

        await expects.reduce(
          async (prev, { t, v }) =>
            prev.then(async () => {
              assert.equal((await checkpointing.getValueAt(t)).toString(), v, 'expected value should match checkpoint')
            }),
          Promise.resolve()
        )

        assert.equal(await checkpointing.getHistorySize(), size, 'size should match')
        assert.equal(await checkpointing.lastUpdated(), values.slice(-1)[0].t, 'last updated should be correct')
      })
    })
  })

  it('fails if inserting value at past time', async () => {
    const time = 5
    const value = 2

    await checkpointing.addCheckpoint(time, value)

    await assertRevert(checkpointing.addCheckpoint(time - 1, value))
  })
})
