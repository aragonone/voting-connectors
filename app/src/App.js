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
import { useAppLogic } from './app-logic'
import NoWrappedTokens from './screens/NoWrappedTokens'
import Holders from './screens/Holders'
import Panel from './components/ActionsPanel'
import InfoBox from './components/InfoBox'
import { IdentityProvider } from './components/IdentityManager/IdentityManager'

function App() {
  const { appState } = useAragonApi()
  const {
    holders,
    isSyncing,
    orgTokenAddress,
    orgTokenSymbol,
    wrappedTokenSymbol,
    wrappedTokenAddress,
  } = appState
  const { actions, wrapTokensPanel, unwrapTokensPanel } = useAppLogic()
  const { layoutName } = useLayout()
  const theme = useTheme()

  let totalSupply = 0
  if (holders && holders.length > 0) {
    totalSupply = holders
      .map(({ account, amount }) => parseFloat(amount))
      .reduce((a, b) => a + b, 0)
  }

  return (
    <IdentityProvider>
      <SyncIndicator visible={isSyncing} />
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
              {wrappedTokenSymbol && (
                <Tag mode="identifier">{wrappedTokenSymbol}</Tag>
              )}
            </div>
          </div>
        }
        secondary={
          Boolean(holders && holders.length > 0) && (
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
          holders && holders.length > 0 ? (
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
          <InfoBox
            orgTokenSymbol={orgTokenSymbol}
            totalSupply={totalSupply}
            orgTokenAddress={orgTokenAddress}
            wrappedTokenAddress={wrappedTokenAddress}
            wrappedTokenSymbol={wrappedTokenSymbol}
          />
        }
      />

      <Panel
        panelState={wrapTokensPanel}
        onAction={actions.wrapTokens}
        orgTokenSymbol={orgTokenSymbol}
        wrappedTokenSymbol={wrappedTokenSymbol}
        action="Wrap"
        info={
          <React.Fragment>
            <p>
              You can wrap {orgTokenSymbol} into an ERC20-compliant token that
              can be used within this organization for governance.
            </p>
            <p
              css={`
                margin-top: ${1 * GU}px;
              `}
            >
              1 {orgTokenSymbol} = 1 {wrappedTokenSymbol}.
            </p>
          </React.Fragment>
        }
      />
      <Panel
        panelState={unwrapTokensPanel}
        onAction={actions.unwrapTokens}
        orgTokenSymbol={orgTokenSymbol}
        wrappedTokenSymbol={wrappedTokenSymbol}
        action="Unwrap"
        info={
          'You can easily unwrap your wrapped tokens ' +
          `(${wrappedTokenSymbol}) to recover your ${orgTokenSymbol}.`
        }
      />
    </IdentityProvider>
  )
}

export default App
