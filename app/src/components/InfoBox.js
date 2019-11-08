import React, { useMemo } from "react";
import { useConnectedAccount, useNetwork } from "@aragon/api-react";
import { Box, Distribution, GU, TokenBadge, useTheme, textStyle } from "@aragon/ui";
import wrap from '../assets/wrap.svg'

function InfoBox({
  erc20TokenSymbol,
  wrappedTokenSymbol,
  totalSuply,
  wrappedTokenAddress,
  orgTokenAddress
}) {
  const theme = useTheme();

  return (
    <React.Fragment>
      <Box heading="Wrapped Token">
        <h2
          css={`
            ${textStyle("title4")};
            display: flex;
            justify-content: space-between;
          `}
        >
          <span>{erc20TokenSymbol}</span>
          <span><img src={wrap}/></span>
          <span>{wrappedTokenSymbol}</span>
        </h2>
        <p>
          You can wrap {erc20TokenSymbol} so you can use it within this Aragon
          organization. You can unwrap it to get back your {erc20TokenSymbol}{" "}
          tokens it at time.
        </p>
        <br />
        <p>
          1 {erc20TokenSymbol} = 1 {wrappedTokenSymbol}
        </p>
      </Box>
      <Box heading="Token Info">
        <ul>
          {[
            ["Total supply", <strong>{totalSuply}</strong>],
            ["Transferable", <strong> no</strong>],
            [
              "Token",
              <TokenBadge
                address={wrappedTokenAddress}
                symbol={wrappedTokenSymbol}
              />
            ]
          ].map(([label, content], index) => (
            <li
              key={index}
              css={`
                display: flex;
                justify-content: space-between;
                list-style: none;
                color: ${theme.surfaceContent};

                & + & {
                  margin-top: ${2 * GU}px;
                }

                > span:nth-child(1) {
                  color: ${theme.surfaceContentSecondary};
                }
                > span:nth-child(2) {
                  // “:” is here for accessibility reasons, we can hide it
                  opacity: 0;
                  width: 10px;
                }
                > span:nth-child(3) {
                  flex-shrink: 1;
                }
                > strong {
                  text-transform: uppercase;
                }
              `}
            >
              <span>{label}</span>
              <span>:</span>
              {content}
            </li>
          ))}
        </ul>
      </Box>
    </React.Fragment>
  );
}

export default InfoBox;
