import React, { useMemo } from 'react'
import { useConnectedAccount, useNetwork } from '@aragon/api-react'
import { Box, Distribution, GU, TokenBadge, useTheme } from '@aragon/ui'


const DISTRIBUTION_ITEMS_MAX = 7

function InfoBox() {
  const theme = useTheme()


  return (
    <React.Fragment>
      <Box heading="Token Info">
        <ul>
          {[
            [
              'Total supply',
              <strong>mock data</strong>,
            ],
            [
              'Transferable',
              <strong> no</strong>,
            ],
            [
              'Token',
              <strong> GOVT</strong>,
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
  )
}



export default InfoBox
