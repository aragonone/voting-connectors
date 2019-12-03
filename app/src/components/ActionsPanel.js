import React, { useCallback, useState } from 'react'
import {
  Button,
  GU,
  Info,
  Field,
  SidePanel,
  TextInput,
  useSidePanelFocusOnReady,
  useTheme,
} from '@aragon/ui'
import wrap from '../assets/wrap.svg'

const WrapTokensPanel = React.memo(
  ({
    panelState,
    onAction,
    action,
    info,
    orgTokenSymbol,
    wrappedTokenSymbol,
  }) => {
    return (
      <SidePanel
        title={action + ' tokens'}
        opened={panelState.visible}
        onClose={panelState.requestClose}
      >
        <WrapTokensPanelContent
          action={action}
          orgTokenSymbol={orgTokenSymbol}
          info={info}
          onAction={onAction}
          wrappedTokenSymbol={wrappedTokenSymbol}
        />
      </SidePanel>
    )
  }
)

function WrapTokensPanelContent({
  action,
  orgTokenSymbol,
  info,
  onAction,
  wrappedTokenSymbol,
}) {
  const theme = useTheme()

  const [amount, setAmount] = useState('')
  const tokenInputRef = useSidePanelFocusOnReady()

  const handleAmountChange = useCallback(event => {
    setAmount(event.target.value)
  }, [])
  const handleSubmit = useCallback(
    event => {
      event.preventDefault()
      onAction(amount)
    },
    [amount, onAction]
  )

  return (
    <form
      css={`
        margin-top: ${3 * GU}px;
      `}
      onSubmit={handleSubmit}
    >
      <div
        css={`
          margin-bottom: ${3 * GU}px;
        `}
      >
        <Info>{info}</Info>
      </div>
      <Field label={action === 'Wrap' ? 'Amount' : 'Wrapped token amount'}>
        <div css="display: flex">
          <TextInput
            ref={tokenInputRef}
            type="number"
            value={amount}
            min={0}
            max={300}
            onChange={handleAmountChange}
            adornment={action === 'Wrap' ? orgTokenSymbol : wrappedTokenSymbol}
            adornmentPosition="end"
            adornmentSettings={{
              width: 60,
              padding: 8,
            }}
            required
            wide
            css={`
              &::-webkit-inner-spin-button,
              &::-webkit-outer-spin-button {
                -webkit-appearance: none;
              }
            `}
          />
          <div
            css={`
              display: flex;
              flex-shrink: 0;
              align-items: center;
            `}
          >
            <img
              src={wrap}
              css={`
                margin: 0 ${2 * GU}px;
              `}
            />
            <span
              css={`
                color: ${theme.surfaceContentSecondary};
                margin-right: ${0.5 * GU}px;
                min-width: ${6 * GU}px;
                max-width: ${12 * GU}px;
                overflow: hidden;
                text-overflow: ellipsis;
                text-align: right;
              `}
            >
              {amount || 0}
            </span>
            <span
              css={`
                color: ${theme.surfaceContentSecondary};
              `}
            >
              {action === 'Wrap' ? wrappedTokenSymbol : orgTokenSymbol}
            </span>
          </div>
        </div>
      </Field>
      <Button disabled={!amount} mode="strong" type="submit" wide>
        {action} tokens
      </Button>
    </form>
  )
}
WrapTokensPanelContent.defaultProps = {
  onAction: () => {},
}

export default WrapTokensPanel
