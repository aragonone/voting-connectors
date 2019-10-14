import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

const TokenAbi = require('./abi/minimeToken.json')
const app = new Aragon()

const initialState = async () => {
  const token = await getToken()
  const erc20 = await getERC20()
  const tokenBalance = 0
  const erc20Balance = 0

  return {
    token,
    erc20,
    erc20Balance,
    tokenBalance,
  }
}

const reducer = async (state, { event, returnValues }) => {
  let nextState
  const { token, erc20, account } = state

  switch (event) {
    case 'TokensLocked':
      nextState = {
        ...state,
        tokenBalance: await getTokenBalance(token, account),
        erc20Balance: await getTokenBalance(erc20, account)
      }
      break
    case 'TokensUnlocked':
      nextState = {
        ...state,
        tokenBalance: await getTokenBalance(token, account),
        erc20Balance: await getTokenBalance(erc20, account)
      }
      break
    case events.ACCOUNTS_TRIGGER:
      const newAccount = returnValues.account
      nextState = {
        ...state,
        account: newAccount,
        tokenBalance: await getTokenBalance(token, newAccount),
        erc20Balance: await getTokenBalance(erc20, newAccount)
      }
      break
    case events.SYNC_STATUS_SYNCING:
      nextState = { ...state, isSyncing: true }
      break
    case events.SYNC_STATUS_SYNCED:
      nextState = { ...state, isSyncing: false }
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

async function getTokenBalance(token, account) {
  const tokenContract = app.external(token, TokenAbi)
  return await tokenContract.balanceOf(account).toPromise()
}
