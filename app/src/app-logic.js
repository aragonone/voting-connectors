import React, { useCallback } from 'react'
import { useAragonApi } from "@aragon/api-react";

function noop() {}


// Unwrap tokens action
export function useUnwrapTokensAction(onDone = noop) {
  const { api, appState } = useAragonApi();
  return useCallback(
    amount => {
      api.unlock(1000).toPromise()
    },
    [api]
  )
}



// Handles the main logic of the app.
export function useAppLogic() {

  const actions = {
    unwrapTokens: useUnwrapTokensAction(),
  }

  return {
    actions,
  }
}
