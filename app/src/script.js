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

const reducer = async (state, data) => {
  const {
    event,
    returnValues
  } = data
  // console.log(`data`, data)

  let nextState = { ...state }
  const { token, erc20, account } = nextState

  switch (event) {
    case 'TokensLocked':
      nextState = {
        ...nextState,
        tokenBalance: await getTokenBalance(token, account),
        erc20Balance: await getTokenBalance(erc20, account)
      }
      break
    case 'TokensUnlocked':
      nextState = {
        ...nextState,
        tokenBalance: await getTokenBalance(token, account),
        erc20Balance: await getTokenBalance(erc20, account)
      }
      break
    case events.ACCOUNTS_TRIGGER:
      const newAccount = returnValues.account
      nextState = {
        ...nextState,
        account: newAccount,
        tokenBalance: await getTokenBalance(token, newAccount),
        erc20Balance: await getTokenBalance(erc20, newAccount)
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

async function getTokenBalance(token, account) {
  console.log(`READING BALANCES 123...`)
  console.log(`account`, account)
  const tokenContract = app.external(token, TokenAbi)
  const balance = await tokenContract.balanceOf(account).toPromise()
  return balance
}
