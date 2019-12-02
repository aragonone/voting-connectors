import React from 'react'
import { Box, GU, TokenBadge, useTheme, textStyle } from '@aragon/ui'
import wrap from '../assets/wrap.svg'

function InfoBox({
  orgTokenAddress,
  orgTokenSymbol,
  totalSupply,
  wrappedTokenAddress,
  wrappedTokenSymbol,
}) {
  const theme = useTheme()

  return (
    <React.Fragment>
      <Box heading="Wrapped Token">
        <h2
          css={`
            ${textStyle('title4')};
            display: flex;
            justify-content: space-between;
          `}
        >
          <span>{orgTokenSymbol}</span>
          <span>
            <img src={wrap} />
          </span>
          <span>{wrappedTokenSymbol}</span>
        </h2>
        <p>
          You can wrap {orgTokenSymbol} into a token that can be used within{' '}
          this Aragon organization for governance. You can unwrap it at any time{' '}
          to return your original {orgTokenSymbol} tokens.
        </p>
        <p
          css={`
            margin-top: ${1 * GU}px;
          `}
        >
          1 {orgTokenSymbol} = 1 {wrappedTokenSymbol}
        </p>
      </Box>
      <Box heading="Token Info">
        <ul>
          {[
            ['Wrapped supply', totalSupply],
            ['Transferable', <span css={'text-transform: uppercase'}>no</span>],
            [
              'Token',
              <TokenBadge
                address={wrappedTokenAddress}
                symbol={wrappedTokenSymbol}
              />,
            ],
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
  )
}

export default InfoBox
