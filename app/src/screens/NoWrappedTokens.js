import React from 'react'
import { Button, EmptyStateCard, GU, LoadingRing } from '@aragon/ui'
import { useAragonApi } from '@aragon/api-react'
import { useAppLogic } from '../app-logic'
import Panel from '../components/ActionsPanel'
import emptyStateImg from '../assets/empty-state.png'

const NoWrappedTokens = React.memo(function NoWrappedTokens({ isSyncing }) {
  const { appState } = useAragonApi()
  const { erc20TokenSymbol, wrappedTokenSymbol } = appState
  const { actions, wrapTokensPanel } = useAppLogic()

  return (
    <React.Fragment>
      <EmptyStateCard
        css={`
          width: 100%;
          height: 600px;
          max-height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        `}
        text={
          isSyncing ? (
            <div
              css={`
                display: grid;
                align-items: center;
                justify-content: center;
                grid-template-columns: auto auto;
                grid-gap: ${1 * GU}px;
              `}
            >
              <LoadingRing />
              <span>Syncing…</span>
            </div>
          ) : (
            <div
              css={`
                margin: ${3 * GU}px 0;
              `}
            >
              No tokens here!
            </div>
          )
        }
        action={
          <Button wide mode="strong" onClick={wrapTokensPanel.requestOpen}>
            Wrap token
          </Button>
        }
        illustration={
          <img
            css={`
              margin: auto;
              height: 170px;
            `}
            src={emptyStateImg}
            alt="No tokens here"
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
    </React.Fragment>
  )
})

export default NoWrappedTokens
