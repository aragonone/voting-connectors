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
      case 'TokensLocked':
      case 'TokensUnlocked':
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
  if (!settings.orgTokenAddress) {
    settings.orgTokenAddress = await getOrgTokenAddress()
  }
  if (!settings.wrappedTokenAddress) {
    settings.wrappedTokenAddress = await getWrappedTokenAddress()
  }

  // Token contracts
  const orgTokenContract = app.external(settings.orgTokenAddress, tokenAbi)
  tokenContracts.set(settings.orgTokenAddress, orgTokenContract)

  const wrappedTokenContract = app.external(
    settings.wrappedTokenAddress,
    tokenAbi
  )
  tokenContracts.set(settings.wrappedTokenAddress, wrappedTokenContract)

  // Token data
  initializedState.orgToken = {
    address: settings.orgTokenAddress,
    ...(await getTokenData(orgTokenContract)),
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

async function getOrgTokenAddress() {
  return app.call('token').toPromise()
}

async function getWrappedTokenAddress() {
  return app.call('erc20').toPromise()
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
  const { holders = [], orgToken, settings } = state
  const { entity: account } = event.returnValues

  const holderIndex = holders.findIndex(holder =>
    addressesEqual(holder.address, account)
  )

  const orgTokenContract = tokenContracts.get(settings.orgTokenAddress)
  const currentBalance = await orgTokenContract.balanceOf(account).toPromise()

  const nextHolders = Array.from(holders)
  if (holderIndex === -1) {
    // New holder
    nextHolders.push({ address: account, balance: currentBalance })
  } else {
    nextHolders[holderIndex].balance = currentBalance
  }

  const nextOrgToken = {
    ...orgToken,
    totalSupply: await orgTokenContract.totalSupply().toPromise(),
  }

  return { ...state, holders: nextHolders, orgToken: nextOrgToken }
}
