import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import {
  Main,
  Button,
  IconPlus,
  Header,
  Split,
  GU,
  textStyle,
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
    wrappedTokenSymbol,
    erc20TokenSymbol,
    holders,
    isSyncing,
    orgTokenAddress,
    wrappedTokenAddress,
  } = appState
  const { actions, wrapTokensPanel, unwrapTokensPanel } = useAppLogic()
  const theme = useTheme()
  let totalSuply = 0
  if (holders && holders.length > 0) {
    totalSuply = holders
      .map(({ account, amount }) => parseFloat(amount))
      .reduce((a, b) => a + b, 0)
  }

  return (
    <IdentityProvider>
      <Main>
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
                  ${textStyle('title2')};
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
            holders && holders.length > 0 ? (
              <Button
                mode="strong"
                label="Wrap tokens"
                icon={<IconPlus />}
                onClick={wrapTokensPanel.requestOpen}
              />
            ) : (
              ''
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
              <NoWrappedTokens isSyncing={isSyncing} />
            )
          }
          secondary={
            <InfoBox
              erc20TokenSymbol={erc20TokenSymbol}
              totalSuply={totalSuply}
              orgTokenAddress={orgTokenAddress}
              wrappedTokenAddress={wrappedTokenAddress}
              wrappedTokenSymbol={wrappedTokenSymbol}
            />
          }
        />

        <Panel
          panelState={wrapTokensPanel}
          onAction={actions.wrapTokens}
          erc20TokenSymbol={erc20TokenSymbol}
          wrappedTokenSymbol={wrappedTokenSymbol}
          action="Wrap"
          info={
            'You can wrap ' +
            erc20TokenSymbol +
            ' into an ERC20-compliant token that you can use within this organization. 1 ' +
            erc20TokenSymbol +
            ' = 1 ' +
            wrappedTokenSymbol
          }
        />
        <Panel
          panelState={unwrapTokensPanel}
          onAction={actions.unwrapTokens}
          erc20TokenSymbol={erc20TokenSymbol}
          wrappedTokenSymbol={wrappedTokenSymbol}
          action="Unwrap"
          info={
            'You can easily unwrap your wrapped tokens (' +
            wrappedTokenSymbol +
            ') to recover your ' +
            erc20TokenSymbol
          }
        />
      </Main>
    </IdentityProvider>
  )
}

export default App
