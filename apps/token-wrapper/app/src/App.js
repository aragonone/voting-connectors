import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Split, SyncIndicator, GU } from '@aragon/ui'
import { AppLogicProvider, useAppLogic } from './app-logic'
import NoWrappedTokens from './screens/NoWrappedTokens'
import Holders from './screens/Holders'
import Panel from './components/ActionsPanel'
import AppHeader from './components/AppHeader'
import InfoBox from './components/InfoBox'
import { IdentityProvider } from './components/IdentityManager/IdentityManager'

function App() {
  const { appState, guiStyle } = useAragonApi()
  const { actions, wrapTokensPanel, unwrapTokensPanel } = useAppLogic()

  const { holders, isSyncing, outsideToken, wrappedToken } = appState
  const { appearance } = guiStyle

  const appStateReady = outsideToken && wrappedToken
  const showHolders = appStateReady && holders && holders.length > 0

  return (
    <Main theme={appearance}>
      {showHolders && <SyncIndicator visible={isSyncing} />}
      <AppHeader
        onWrapHolder={showHolders ? wrapTokensPanel.requestOpen : null}
        tokenSymbol={wrappedToken && wrappedToken.symbol}
      />
      <Split
        primary={
          showHolders ? (
            <Holders
              holders={holders}
              onUnwrapTokens={unwrapTokensPanel.requestOpen}
              wrappedToken={wrappedToken}
            />
          ) : (
            <NoWrappedTokens
              isSyncing={isSyncing}
              onWrapTokens={wrapTokensPanel.requestOpen}
            />
          )
        }
        secondary={
          appStateReady && (
            <InfoBox outsideToken={outsideToken} wrappedToken={wrappedToken} />
          )
        }
      />

      {appStateReady && (
        <React.Fragment>
          <Panel
            panelState={wrapTokensPanel}
            onAction={actions.wrapTokens}
            outsideToken={outsideToken}
            wrappedToken={wrappedToken}
            action="Wrap"
            info={
              <React.Fragment>
                <p>
                  Wrap {outsideToken.symbol} into an ERC20-compliant token used
                  for governance within this organization.
                </p>
                <p
                  css={`
                    margin-top: ${1 * GU}px;
                  `}
                >
                  1 {outsideToken.symbol} = 1 {wrappedToken.symbol}.
                </p>
              </React.Fragment>
            }
          />
          <Panel
            panelState={unwrapTokensPanel}
            onAction={actions.unwrapTokens}
            outsideToken={outsideToken}
            wrappedToken={wrappedToken}
            action="Unwrap"
            info={`Recover your ${outsideToken.symbol} by unwrapping your ${wrappedToken.symbol}.`}
          />
        </React.Fragment>
      )}
    </Main>
  )
}

export default function TokenWrapper() {
  return (
    <AppLogicProvider>
      <IdentityProvider>
        <App />
      </IdentityProvider>
    </AppLogicProvider>
  )
}
