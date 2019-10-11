import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

const TokenAbi = require('./abi/minimeToken.json')

const app = new Aragon()

const initialState = async () => {
  const token = await getToken()
  const erc20 = await getERC20()
  const tokenBalance = await getTokenBalance(token)
  const erc20Balance = await getERC20Balance(erc20)

  return {
    token,
    erc20,
    erc20Balance,
    tokenBalance,
  }
}

const reducer = async (state, { event }) => {
  let nextState = { ...state }

  // const tokenBalance = await getTokenBalance(token)
  // const erc20Balance = await getERC20Balance(erc20)

  switch (event) {
    case 'TokensLocked':
      nextState = {
        ...nextState,
        // erc20Balance,
        // tokenBalance
      }
      break
    case 'TokensUnlocked':
      nextState = {
        ...nextState,
        // erc20Balance,
        // tokenBalance
      }
      break
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

async function getTokenBalance(token) {
  const tokenContract = api.external(token, TokenAbi)
  await tokenContract.balanceOf(tokenContract).toPromise()
}

async function getERC20Balance(erc20) {
  const erc20Contract = api.external(erc20, TokenAbi)
  await erc20Contract.balanceOf(erc20Contract).toPromise()
}
