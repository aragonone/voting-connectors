import React, { useCallback } from 'react'
import {
  AragonApi,
  useApi,
  useAppState,
  useCurrentApp,
} from '@aragon/api-react'
import appStateReducer from './app-state-reducer'
import usePanelState from './hooks/usePanelState'

function noop() {}

// Unwrap tokens action
export function useUnwrapTokensAction(onDone = noop) {
  const api = useApi()
  return useCallback(
    amount => {
      // Don't care about response
      api.withdraw(amount).toPromise()
      onDone()
    },
    [api, onDone]
  )
}

// Wrap tokens action
export function useWrapTokensAction(onDone = noop) {
  const api = useApi()
  const { outsideToken } = useAppState()
  const currentApp = useCurrentApp()
  return useCallback(
    amount => {
      if (!currentApp || !outsideToken) {
        return
      }

      // Set pre-transaction parameters for approving original token
      const intentParams = {
        token: {
          address: outsideToken.address,
          value: amount,
          spender: currentApp.appAddress,
        },
      }

      // Don't care about response
      api.deposit(amount, intentParams).toPromise()
      onDone()
    },
    [api, currentApp, outsideToken, onDone]
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

export function AppLogicProvider({ children }) {
  return <AragonApi reducer={appStateReducer}>{children}</AragonApi>
}
