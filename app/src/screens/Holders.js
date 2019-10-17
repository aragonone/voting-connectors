import React, { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import BN from "bn.js";

import {
  ContextMenu,
  ContextMenuItem,
  DataView,
  IconAdd,
  IconLabel,
  IconRemove,
  Split,
  GU,
  useLayout,
  useTheme,
  IdentityBadge,
} from "@aragon/ui";
import InfoBox from "../components/InfoBox";

function Holders({ holders }) {
  const { layoutName } = useLayout();
  const compact = layoutName === "small";

  return (
    <Split
      primary={
        <DataView
          fields={['Holder', 'Wrapped tokens balance']}
          entries={holders}
          renderEntry={({ account, balance }) => {
            return [<IdentityBadge entity={account} />, <div>{balance}</div>]
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

function Amount({ children }) {
  const theme = useTheme()
  return (
    <div
      css={`
        color: ${theme.success};
      `}
    >
      {children}
    </div>
  )
}

export default Holders;
