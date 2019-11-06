import React, { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import BN from "bn.js";
import LocalIdentityBadge from "../components/LocalIdentityBadge/LocalIdentityBadge";
import { useIdentity } from "../components/IdentityManager/IdentityManager";
import InfoBox from "../components/InfoBox";
import {
  ContextMenu,
  ContextMenuItem,
  DataView,
  IconLabel,
  IconRemove,
  Split,
  GU,
  useLayout,
  useTheme,
  IdentityBadge
} from "@aragon/ui";
import { useAragonApi } from "@aragon/api-react";
import { addressesEqual } from "../web3-utils";
import { useConnectedAccount } from "@aragon/api-react";
import You from "../components/You";

function Holders({ holders, onUnwrapTokens }) {
  const { layoutName } = useLayout();
  const compact = layoutName === "small";
  const connectedAccount = useConnectedAccount();
  const { appState } = useAragonApi();
  const { wrappedTokenSymbol } = appState;

  return (
    <Split
      primary={
        <DataView
          fields={["Holder", "Wrapped tokens balance"]}
          entries={holders}
          renderEntry={({ account, amount }) => {
            const isCurrentUser = addressesEqual(account, connectedAccount);
            return [
              <div>
                <LocalIdentityBadge
                  entity={account}
                  connectedAccount={isCurrentUser}
                />
                {isCurrentUser && <You />}
              </div>,
              <div>{amount} {wrappedTokenSymbol}</div>
            ];
          }}
          renderEntryActions={({ account, amount }) => {
            return [
              <EntryActions onUnwrapTokens={onUnwrapTokens} address={account} />
            ];
          }}


        />
      }
      secondary={<InfoBox />}
    />
  );
}

Holders.propTypes = {
  holders: PropTypes.array
};

Holders.defaultProps = {
  holders: []
};

function EntryActions({ onUnwrapTokens, address }) {
  const theme = useTheme();
  const connectedAccount = useConnectedAccount();
  const [label, showLocalIdentityModal] = useIdentity(address);

  const isCurrentUser = addressesEqual(address, connectedAccount);
  const editLabel = useCallback(() => showLocalIdentityModal(address), [
    address,
    showLocalIdentityModal
  ]);

  const actions = [
    ...(isCurrentUser ? [[onUnwrapTokens, IconRemove, 'Unwrap tokens']] : []),
    [editLabel, IconLabel, `${label ? 'Edit' : 'Add'} custom label`]
  ];
  return (
    <ContextMenu>
      {actions.map(([onClick, Icon, label], index) => (
        <ContextMenuItem onClick={onClick} key={index}>
          <span
            css={`
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${theme.surfaceContentSecondary};
            `}
          >
            <Icon />
          </span>
          <span
            css={`
              margin-left: ${1 * GU}px;
            `}
          >
            {label}
          </span>
        </ContextMenuItem>
      ))}
    </ContextMenu>
  );
}

export default Holders;
