import React, { useCallback } from "react";
import { useAragonApi, useConnectedAccount } from "@aragon/api-react";

function noop() {}

// Unwrap tokens action
export function useUnwrapTokensAction(onDone = noop) {
  const { api, appState } = useAragonApi();
  return useCallback(
    amount => {
      api.unlock(1000).toPromise();
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
          value: 100,
          spender: app
        }
      };
      await api.lock(100, intentParams).toPromise();
    },
    [api, appState]
  );
}

// Handles the main logic of the app.
export function useAppLogic() {
  const actions = {
    unwrapTokens: useUnwrapTokensAction(),
    wrapTokens: useWrapTokensAction()
  };

  return {
    actions
  };
}
