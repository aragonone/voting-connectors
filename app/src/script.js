import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'
import BN from "bn.js";

const TokenBalanceOfABI = require('./abi/token-balanceOf.json')
const TokenSymbolABI = require('./abi/token-symbol.json')

const app = new Aragon()

const initialState = async () => {
  const orgTokenAddress = await getOrgTokenAddress()
  const wrappedTokenAddress = await getWrappedTokenAddress()
  const wrappedTokenSymbol = await getTokenSymbol(wrappedTokenAddress)
  const erc20TokenSymbol = await getTokenSymbol(orgTokenAddress)

  return {
    orgTokenAddress,
    wrappedTokenAddress,
    wrappedTokenSymbol,
    erc20TokenSymbol,
    holders: []
  }
}

const updateHoldersArrayFromLockEvent = async (event, data, state) => {
  const { entity: account, amount } = data
  const { holders } = state

  // Identify holder idx from account address.
  let idx
  if (holders.length === 0) {
    idx = -1
  } else {
    const accounts = holders.map(holder => holder.account)
    idx = accounts.indexOf(account)
  }

  // Push the holder into the array.
  if (idx === -1) { // New holder
    holders.push({ account, amount })
  } else { // Update existing holder balance
    const holder = holders[idx]
    const currAmount = new BN(holder.amount)
    const deltaAmount = new BN(amount)
    if(event === 'TokensLocked') {
      holder.amount = currAmount.add(deltaAmount).toString()
    } else if(event === 'TokensUnlocked') {
      holder.amount = currAmount.sub(deltaAmount).toString()
    }
    holders[idx] = holder
  }

  return { ...state, holders }
}

const reducer = async (state, { event, returnValues }) => {
  let nextState = { ...state }
  const { orgTokenAddress, wrappedTokenAddress } = state

  switch (event) {
    case 'TokensLocked':
    case 'TokensUnlocked':
      nextState = await updateHoldersArrayFromLockEvent(event, returnValues, state)
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
