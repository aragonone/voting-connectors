import React, { useCallback, useMemo, useState } from 'react'
import { useAragonApi, useConnectedAccount } from "@aragon/api-react";
import usePanelState from './hooks/usePanelState'

function noop() {}

// Unwrap tokens action
export function useUnwrapTokensAction(onDone = noop) {
  const { api, appState } = useAragonApi();
  return useCallback(
    amount => {
      api.unlock(10).toPromise();
    },
    [api]
  );
}

// Wrap tokens action
export function useWrapTokensAction(onDone = noop) {
  const { api, appState } = useAragonApi();
  return useCallback(
    async amount => {
      const app = (await api.currentApp().toPromise()).appAddress;
      const address = appState.wrappedTokenAddress;
      const intentParams = {
        token: {
          address: address,
          value: amount,
          spender: app
        }
      };
      await api.lock(amount, intentParams).toPromise();
    },
    [api, appState]
  );
}

// Handles the main logic of the app.
export function useAppLogic() {
  const wrapTokensPanel = usePanelState()
  const actions = {
    unwrapTokens: useUnwrapTokensAction(wrapTokensPanel.requestClose),
    wrapTokens: useWrapTokensAction()
  };

  return {
    actions,
    wrapTokensPanel: useMemo(() => wrapTokensPanel, [wrapTokensPanel]),
  };
}
