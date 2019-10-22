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

function App() {
  const { api, appState } = useAragonApi();
  const {
    orgTokenAddress,
    wrappedTokenAddress,
    wrappedTokenSymbol,
    holders,
    isSyncing
  } = appState;

  const amount = "10000000";

  return (
    <Main>
      <div>
        <p>Wrapped token symbol: {wrappedTokenSymbol}</p>
        {holders && holders.length > 0 ? (
          <ul> {
            holders.map(holder => <li>holder: {holder.account}, bal: {holder.amount}</li>)
          } </ul>
        ) : ( <p>No holders</p> )}
      </div>
      <div>
        <Button
          onClick={async () => {
            const app = (await api.currentApp().toPromise()).appAddress;
            const intentParams = {
              token: { address: wrappedTokenAddress, value: amount, spender: app }
            };
            await api.lock(amount, intentParams).toPromise();
          }}
        >
          Lock tokens
        </Button>
        <Button
          mode="secondary"
          onClick={async () => await api.unlock(amount).toPromise()}
        >
          Unlock tokens
        </Button>
      </div>
    </Main>
  )
}

// function App() {
//   const { api, appState } = useAragonApi();
//   const {
//     orgTokenAddress,
//     wrappedTokenAddress,
//     wrappedTokenSymbol,
//     orgTokenBalance,
//     wrappedTokenBalance,
//     isSyncing
//   } = appState;

//   // TODO: Read this from an input component
//   const amount = "10000000";

//   const theme = useTheme();
//   return (
//     <Main>
//       <div>
//         <p>Wrapped token symbol: {wrappedTokenSymbol}</p>
//       </div>
//       {isSyncing && <Syncing />}
//       {orgTokenBalance && orgTokenBalance > 0 ? (
//         <React.Fragment>
//           <Header
//             primary={
//               <div
//                 css={`
//                   display: flex;
//                   align-items: center;
//                 `}
//               >
//                 <h1
//                   css={`
//                     ${textStyle("title2")};
//                     color: ${theme.content};
//                     margin-right: ${1 * GU}px;
//                   `}
//                 >
//                   Token wrapper
//                 </h1>
//                 <Tag mode="identifier">GOVT</Tag>
//               </div>
//             }
//             secondary={
//               <Button
//                 mode="strong"
//                 label="Wrap tokens"
//                 icon={<IconPlus />}
//                 display="label"
//                 onClick={async () => {
//                   const app = (await api.currentApp().toPromise()).appAddress;
//                   const intentParams = {
//                     token: { address: wrappedTokenAddress, value: amount, spender: app }
//                   };
//                   await api.lock(amount, intentParams).toPromise();
//                 }}
//               />
//             }
//           />
//           <Holders holders={[
//             { account: useConnectedAccount(), balance: orgTokenBalance },
//           ]} />
//           <Button
//             mode="secondary"
//             onClick={async () => await api.unlock(amount).toPromise()}
//           >
//             Unlock tokens
//           </Button>
//         </React.Fragment>
//       ) : (
//         <NoWrappedTokens isSyncing={isSyncing} />
//       )}
//     </Main>
//   );
// }

const Syncing = styled.div.attrs({ children: "Syncing…" })`
  position: absolute;
  top: 15px;
  right: 20px;
`;

export default App;
