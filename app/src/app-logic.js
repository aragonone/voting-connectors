import { useCallback } from 'react'
import { useApi, useAppState, useCurrentApp } from '@aragon/api-react'
import usePanelState from './hooks/usePanelState'

function noop() {}

// Unwrap tokens action
export function useUnwrapTokensAction(onDone = noop) {
  const api = useApi()
  return useCallback(
    amount => {
      // Don't care about response
      api.unlock(amount).toPromise()
      onDone()
    },
    [api, onDone]
  )
}

// Wrap tokens action
export function useWrapTokensAction(onDone = noop) {
  const api = useApi()
  const { wrappedTokenAddress } = useAppState()
  const currentApp = useCurrentApp()
  return useCallback(
    amount => {
      if (!currentApp) {
        return
      }

      // Set pre-transaction parameters for approving original token
      const intentParams = {
        token: {
          address: wrappedTokenAddress,
          value: amount,
          spender: currentApp.appAddress,
        },
      }

      // Don't care about response
      api.lock(amount, intentParams).toPromise()
      onDone()
    },
    [api, currentApp, wrappedTokenAddress, onDone]
  )
}

// Handles the main logic of the app.
export function useAppLogic() {
  const wrapTokensPanel = usePanelState()
  const unwrapTokensPanel = usePanelState()

  const actions = {
    wrapTokens: useWrapTokensAction(wrapTokensPanel.requestClose),
    unwrapTokens: useUnwrapTokensAction(unwrapTokensPanel.requestClose),
  }

  return {
    actions,
    wrapTokensPanel: wrapTokensPanel,
    unwrapTokensPanel: unwrapTokensPanel,
  }
}
