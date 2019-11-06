import React from "react";
import { useAragonApi, useConnectedAccount } from "@aragon/api-react";
import {
  Main,
  Button,
  IconPlus,
  Header,
  GU,
  textStyle,
  useTheme,
  Tag,
  SyncIndicator
} from "@aragon/ui";
import styled from "styled-components";
import NoWrappedTokens from "./screens/NoWrappedTokens";
import Holders from "./screens/Holders";
import Panel from "./components/WrapTokensPanel";
import { useAppLogic } from "./app-logic";

function App() {
  const { api, appState } = useAragonApi();
  const { wrappedTokenSymbol, holders, isSyncing } = appState;

  const { actions, wrapTokensPanel, unwrapTokensPanel } = useAppLogic();
  const theme = useTheme();
  return (
    <Main>
      <SyncIndicator visible={isSyncing} />
      {holders && holders.length > 0 ? (
        <React.Fragment>
          <Header
            primary={
              <div
                css={`
                  display: flex;
                  align-items: center;
                `}
              >
                <h1
                  css={`
                    ${textStyle("title2")};
                    color: ${theme.content};
                    margin-right: ${1 * GU}px;
                  `}
                >
                  Token wrapper
                </h1>
                <Tag mode="identifier">{wrappedTokenSymbol}</Tag>
              </div>
            }
            secondary={
              <Button
                mode="strong"
                label="Wrap tokens"
                icon={<IconPlus />}
                display="label"
                onClick={wrapTokensPanel.requestOpen}
              />
            }
          />
          <Holders
            holders={holders}
            onUnwrapTokens={unwrapTokensPanel.requestOpen}
          />
        </React.Fragment>
      ) : (
        <NoWrappedTokens isSyncing={isSyncing} />
      )}
      <Panel
        panelState={wrapTokensPanel}
        onAction={actions.wrapTokens}
        action="Wrap"
        info="You can wrap any ERC20 tokens to generate a “Minime” voting token that you can use with this Aragon organization."
      />
      <Panel
        panelState={unwrapTokensPanel}
        onAction={actions.unwrapTokens}
        action="Unwrap"
        info="You can easily unwrap your wrapped tokens (WANT) to recover your ANT."
      />
    </Main>
  );
}

export default App;
