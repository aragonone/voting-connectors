import BN from 'bn.js'

function transformTokenData(tokenData) {
  const { decimals, totalSupply } = tokenData
  return {
    ...tokenData,
    decimals: new BN(decimals),
    numDecimals: parseInt(decimals, 10),
    totalSupply: new BN(totalSupply),
  }
}

function appStateReducer(state) {
  if (state === null) {
    return { syncing: true }
  }

  const { holders, orgToken, wrappedToken } = state

  return {
    ...state,
    holders:
      holders &&
      holders
        .map(holder => ({ ...holder, balance: new BN(holder.balance) }))
        .sort((a, b) => b.balance.cmp(a.balance)),
    orgToken: orgToken && transformTokenData(orgToken),
    wrappedToken: wrappedToken && transformTokenData(wrappedToken),
  }
}

export default appStateReducer
