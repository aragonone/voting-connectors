import 'core-js/stable'
import 'regenerator-runtime/runtime'

import Aragon, { events } from '@aragon/api'
import { addressesEqual } from './web3-utils'
import tokenBalanceOfABI from './abi/token-balanceOf.json'
import tokenDecimalsABI from './abi/token-decimals.json'
import tokenNameABI from './abi/token-name.json'
import tokenSymbolABI from './abi/token-symbol.json'
import tokenTotalSupplyABI from './abi/token-totalSupply.json'

const tokenAbi = [].concat(
  tokenBalanceOfABI,
  tokenDecimalsABI,
  tokenNameABI,
  tokenSymbolABI,
  tokenTotalSupplyABI
)
const tokenContracts = new Map() // Addr -> External contract

const app = new Aragon()

app.store(
  async (state, event) => {
    const { event: eventName } = event

    switch (eventName) {
      case events.SYNC_STATUS_SYNCING:
        return { ...state, isSyncing: true }
      case events.SYNC_STATUS_SYNCED:
        return { ...state, isSyncing: false }
      case 'Deposit':
      case 'Withdrawal':
        return updateHolder(state, event)
      default:
        return state
    }
  },
  { init: initState }
)

async function initState(cachedState) {
  const initializedState = {
    settings: {},
    ...cachedState,
  }

  // App settings
  const { settings } = initializedState
  if (!settings.outsideTokenAddress) {
    settings.outsideTokenAddress = await getOutsideTokenAddress()
  }
  if (!settings.wrappedTokenAddress) {
    settings.wrappedTokenAddress = await getWrappedTokenAddress()
  }

  // Token contracts
  const outsideTokenContract = app.external(
    settings.outsideTokenAddress,
    tokenAbi
  )
  tokenContracts.set(settings.outsideTokenAddress, outsideTokenContract)

  const wrappedTokenContract = app.external(
    settings.wrappedTokenAddress,
    tokenAbi
  )
  tokenContracts.set(settings.wrappedTokenAddress, wrappedTokenContract)

  // Token data
  initializedState.outsideToken = {
    address: settings.outsideTokenAddress,
    ...(await getTokenData(outsideTokenContract)),
  }
  initializedState.wrappedToken = {
    address: settings.wrappedTokenAddress,
    ...(await getTokenData(wrappedTokenContract)),
  }

  app.identify(`${initializedState.wrappedToken.symbol}`)

  return initializedState
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

async function getOutsideTokenAddress() {
  return app.call('erc20').toPromise()
}

async function getWrappedTokenAddress() {
  return app.call('token').toPromise()
}

async function getTokenData(tokenContract) {
  const [decimals, name, symbol, totalSupply] = await Promise.all([
    // Decimals, name, and symbol are optional
    tokenContract
      .decimals()
      .toPromise()
      .catch(_ => '0'),
    tokenContract
      .name()
      .toPromise()
      .catch(_ => ''),
    tokenContract
      .symbol()
      .toPromise()
      .catch(_ => ''),

    tokenContract.totalSupply().toPromise(),
  ])

  return {
    decimals,
    name,
    symbol,
    totalSupply,
  }
}

async function updateHolder(state, event) {
  const { holders = [], wrappedToken, settings } = state
  const { entity: account } = event.returnValues

  const holderIndex = holders.findIndex(holder =>
    addressesEqual(holder.address, account)
  )

  const wrappedTokenContract = tokenContracts.get(settings.wrappedTokenAddress)
  const currentBalance = await wrappedTokenContract
    .balanceOf(account)
    .toPromise()

  let nextHolders = Array.from(holders)
  if (holderIndex === -1) {
    // New holder
    nextHolders.push({ address: account, balance: currentBalance })
  } else {
    nextHolders[holderIndex].balance = currentBalance
  }
  // Filter out any addresses that now have no balance
  nextHolders = nextHolders.filter(({ balance }) => balance !== '0')

  const nextWrappedToken = {
    ...wrappedToken,
    totalSupply: await wrappedTokenContract.totalSupply().toPromise(),
  }

  return { ...state, holders: nextHolders, wrappedToken: nextWrappedToken }
}
