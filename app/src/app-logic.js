import { useCallback, useMemo } from 'react'
import { useAragonApi } from '@aragon/api-react'
import usePanelState from './hooks/usePanelState'

function noop() {}

// Unwrap tokens action
export function useUnwrapTokensAction(onDone = noop) {
  const { api } = useAragonApi()
  return useCallback(
    async amount => {
      await api.unlock(amount).toPromise()
      onDone()
    },
    [api, onDone]
  )
}

// Wrap tokens action
export function useWrapTokensAction(onDone = noop) {
  const { api, appState } = useAragonApi()
  return useCallback(
    async amount => {
      const app = (await api.currentApp().toPromise()).appAddress
      const address = appState.wrappedTokenAddress
      const intentParams = {
        token: {
          address: address,
          value: amount,
          spender: app,
        },
      }
      await api.lock(amount, intentParams).toPromise()
      onDone()
    },
    [api, appState, onDone]
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
