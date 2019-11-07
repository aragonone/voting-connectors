import React from "react";
import { Button, EmptyStateCard, GU, LoadingRing } from "@aragon/ui";
import { useAragonApi } from "@aragon/api-react";
import emptyStateImg from "../assets/empty-state.svg";
import styled from "styled-components";
import { useAppLogic } from "../app-logic";
import Panel from "../components/WrapTokensPanel";

const NoWrappedTokens = React.memo(function NoWrappedTokens({ isSyncing }) {
  const { api, appState } = useAragonApi();
  const {
    orgTokenAddress,
    wrappedTokenAddress,
    orgTokenBalance,
    wrappedTokenBalance
  } = appState;
  const { actions, wrapTokensPanel } = useAppLogic();

  return (
    <Box>
      <EmptyStateCard
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
            "No tokens here!"
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
        action="Wrap"
        info="You can wrap any ERC20 tokens to generate a “Minime” voting token that you can use with this Aragon organization."
      />
    </Box>
  );
});

const Box = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

export default NoWrappedTokens;
