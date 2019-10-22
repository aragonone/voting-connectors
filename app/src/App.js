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
import BN from "bn.js";
import NoWrappedTokens from "./screens/NoWrappedTokens";
import Holders from "./screens/Holders";

function App() {
  const { api, appState } = useAragonApi();
  const {
    token,
    erc20,
    tokenBalance,
    erc20Balance,
    account,
    isSyncing
  } = appState;

  // TODO: Read this from an input component
  const amount = "10000000";

  const theme = useTheme();
  return (
    <Main>
      {isSyncing && <Syncing />}
      {tokenBalance && tokenBalance > 0 ? (
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
                <Tag mode="identifier">GOVT</Tag>
              </div>
            }
            secondary={
              <Button
                mode="strong"
                label="Wrap tokens"
                icon={<IconPlus />}
                display="label"
                onClick={async () => {
                  const app = (await api.currentApp().toPromise()).appAddress;
                  const intentParams = {
                    token: { address: erc20, value: amount, spender: app }
                  };
                  await api.lock(amount, intentParams).toPromise();
                }}
              />
            }
          />
          <Holders holders={[
            { account: useConnectedAccount(), balance: tokenBalance },
          ]} unwrapToken={console.log("wrap")} />
          <Button
            mode="secondary"
            onClick={async () => await api.unlock(amount).toPromise()}
          >
            Unlock tokens
          </Button>
        </React.Fragment>
      ) : (
        <NoWrappedTokens isSyncing={isSyncing} />
      )}
    </Main>
  );
}
const Syncing = styled.div.attrs({ children: "Syncing…" })`
  position: absolute;
  top: 15px;
  right: 20px;
`;

export default App;
