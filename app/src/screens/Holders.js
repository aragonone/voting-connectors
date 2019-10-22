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

function Holders({ holders, unwrapToken}) {
  const { layoutName } = useLayout();
  const compact = layoutName === "small";

  return (
    <Split
      primary={
        <DataView
          fields={["Holder", "Wrapped tokens balance"]}
          entries={holders}
          renderEntry={({ account, amount }) => {
            return [<IdentityBadge entity={account} />, <div>{amount}</div>];
          }}
          renderEntryActions={() => <EntryActions unwrapToken={unwrapToken}/>}
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



function EntryActions({unwrapToken}) {
  const theme = useTheme();
  const logAction = action => () => console.log(action);
  const actions = [
    [unwrapToken, IconRemove, "Unwrap tokens"],
    [logAction("edit"), IconLabel, "Edit label"]
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
