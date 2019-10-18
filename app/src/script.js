import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

const TokenBalanceOfABI = require('./abi/token-balanceOf.json')
const TokenSymbolABI = require('./abi/token-symbol.json')

const app = new Aragon()

const initialState = async () => {
  const orgTokenAddress = await getOrgTokenAddress()
  const wrappedTokenAddress = await getWrappedTokenAddress()
  const wrappedTokenSymbol = await getTokenSymbol(wrappedTokenAddress)

  return {
    orgTokenAddress,
    wrappedTokenAddress,
    wrappedTokenSymbol,
    wrappedTokenBalance: 0,
    orgTokenBalance: 0,
    activeAccount: undefined
  }
}

const reducer = async (state, { event, returnValues }) => {
  let nextState = { ...state }
  const { orgTokenAddress, wrappedTokenAddress, activeAccount } = state

  switch (event) {
    case 'TokensLocked':
      nextState = {
        ...state,
        orgTokenBalance: await getTokenBalance(orgTokenAddress,activeAccount),
        wrappedTokenBalance: await getTokenBalance(wrappedTokenAddress, activeAccount)
      }
      break
    case 'TokensUnlocked':
      nextState = {
        ...state,
        orgTokenBalance: await getTokenBalance(orgTokenAddress, account),
        wrappedTokenBalance: await getTokenBalance(wrappedTokenAddress, account)
      }
      break
    case events.ACCOUNTS_TRIGGER:
      const newAccount = returnValues.account
      nextState = {
        ...state,
        activeAccount: newAccount,
        orgTokenBalance: await getTokenBalance(orgTokenAddress, newAccount),
        wrappedTokenBalance: await getTokenBalance(wrappedTokenAddress, newAccount)
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

async function getOrgTokenAddress() {
  return app.call('token').toPromise()
}

async function getWrappedTokenAddress() {
  return app.call('erc20').toPromise()
}

async function getTokenBalance(tokenAddress, account) {
  const tokenContract = app.external(tokenAddress, TokenBalanceOfABI)
  return tokenContract.balanceOf(account).toPromise()
}

async function getTokenSymbol(tokenAddress) {
  const tokenContract = app.external(tokenAddress, TokenSymbolABI)
  return tokenContract.symbol().toPromise()
}
