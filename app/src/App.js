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
  Tag
} from "@aragon/ui";
import styled from "styled-components";
import NoWrappedTokens from "./screens/NoWrappedTokens";
import Holders from "./screens/Holders";
import Panel from "./components/WrapTokensPanel";
import UnwrapPanel from "./components/UnwrapTokensPanel";
import { useAppLogic } from "./app-logic";

function App() {
  const { api, appState } = useAragonApi();
  const { wrappedTokenSymbol, holders, isSyncing } = appState;

  const { actions, wrapTokensPanel, unwrapTokensPanel } = useAppLogic();
  const theme = useTheme();
  return (
    <Main>
      {isSyncing && <Syncing />}
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
            unwrapTokens={unwrapTokensPanel.requestOpen}
          />
        </React.Fragment>
      ) : (
        <NoWrappedTokens isSyncing={isSyncing} />
      )}
      <Panel panelState={wrapTokensPanel} onWrapTokens={actions.wrapTokens} />
      <UnwrapPanel
        panelState={unwrapTokensPanel}
        onUnwrapTokens={actions.unwrapTokens}
      />
    </Main>
  );
}

const Syncing = styled.div.attrs({ children: "Syncing…" })`
  position: absolute;
  top: 15px;
  right: 20px;
`;

export default App;
