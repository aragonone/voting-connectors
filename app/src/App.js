import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import {
  Button,
  IconPlus,
  Header,
  Split,
  GU,
  textStyle,
  useLayout,
  useTheme,
  Tag,
  SyncIndicator,
} from '@aragon/ui'
import { AppLogicProvider, useAppLogic } from './app-logic'
import NoWrappedTokens from './screens/NoWrappedTokens'
import Holders from './screens/Holders'
import Panel from './components/ActionsPanel'
import InfoBox from './components/InfoBox'
import { IdentityProvider } from './components/IdentityManager/IdentityManager'

function App() {
  const { appState } = useAragonApi()
  const { holders, isSyncing, orgToken, wrappedToken } = appState
  const { actions, wrapTokensPanel, unwrapTokensPanel } = useAppLogic()
  const { layoutName } = useLayout()
  const theme = useTheme()

  const appStateReady = orgToken && wrappedToken
  const showHolders = appStateReady && holders && holders.length > 0

  return (
    <React.Fragment>
      {showHolders && <SyncIndicator visible={isSyncing} />}
      <Header
        primary={
          <div
            css={`
              display: flex;
              align-items: center;
              flex: 1 1 auto;
              width: 0;
            `}
          >
            <h1
              css={`
                ${textStyle(layoutName === 'small' ? 'title3' : 'title2')};
                flex: 0 1 auto;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                color: ${theme.content};
                margin-right: ${1 * GU}px;
              `}
            >
              Token Wrapper
            </h1>
            <div css="flex-shrink: 0">
              {wrappedToken && wrappedToken.symbol && (
                <Tag mode="identifier">{wrappedToken.symbol}</Tag>
              )}
            </div>
          </div>
        }
        secondary={
          showHolders && (
            <Button
              mode="strong"
              label="Wrap tokens"
              icon={<IconPlus />}
              onClick={wrapTokensPanel.requestOpen}
              display={layoutName === 'small' ? 'icon' : 'label'}
            />
          )
        }
      />
      <Split
        primary={
          showHolders ? (
            <Holders
              holders={holders}
              onUnwrapTokens={unwrapTokensPanel.requestOpen}
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
            <InfoBox orgToken={orgToken} wrappedToken={wrappedToken} />
          )
        }
      />

      {appStateReady && (
        <React.Fragment>
          <Panel
            panelState={wrapTokensPanel}
            onAction={actions.wrapTokens}
            orgToken={orgToken}
            wrappedToken={wrappedToken}
            action="Wrap"
            info={
              <React.Fragment>
                <p>
                  You can wrap {orgToken.symbol} into an ERC20-compliant token
                  that can be used within this organization for governance.
                </p>
                <p
                  css={`
                    margin-top: ${1 * GU}px;
                  `}
                >
                  1 {orgToken.symbol} = 1 {wrappedToken.symbol}.
                </p>
              </React.Fragment>
            }
          />
          <Panel
            panelState={unwrapTokensPanel}
            onAction={actions.unwrapTokens}
            orgToken={orgToken}
            wrappedToken={wrappedToken}
            action="Unwrap"
            info={
              'You can easily unwrap your wrapped tokens ' +
              `(${wrappedToken.symbol}) to recover your ${orgToken.symbol}.`
            }
          />
        </React.Fragment>
      )}
    </React.Fragment>
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
