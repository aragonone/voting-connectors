import React, { useCallback } from 'react'
import { useAragonApi } from "@aragon/api-react";

export function useUnwrapTokens() {
  const api = useAragonApi()
  console.log("a", api);
  return useCallback(
    amount => {
      if (api) {
        //await api.unlock(amount).toPromise()
      }
    },
    [api]
  )
}
