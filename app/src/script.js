import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

const app = new Aragon()

const initialState = async () => {
  return {
    token: await getToken(),
    erc20: await getERC20()
  }
}

const reducer = async (state, { event }) => {
  let nextState = { ...state }

  switch (event) {
    // case 'Increment':
    //   nextState = { ...nextState, count: await getValue() }
    //   break
    // case 'Decrement':
    //   nextState = { ...nextState, count: await getValue() }
    //   break
    case events.SYNC_STATUS_SYNCING:
      nextState = { ...nextState, isSyncing: true }
      break
    case events.SYNC_STATUS_SYNCED:
      nextState = { ...nextState, isSyncing: false }
      break
  }

  return nextState
}

app.store(reducer, { init: initialState })

async function getToken() {
  return await app.call('token').toPromise()
}

async function getERC20() {
  return await app.call('erc20').toPromise()
}
