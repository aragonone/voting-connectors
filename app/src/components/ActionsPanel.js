import React, { useCallback, useState } from 'react'
import {
  Button,
  GU,
  Info,
  Field,
  SidePanel,
  TextInput,
  useSidePanelFocusOnReady,
} from '@aragon/ui'

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
        <TextInput
          ref={tokenInputRef}
          value={amount}
          min={0}
          max={300}
          onChange={handleAmountChange}
          adornment={action === 'Wrap' ? orgTokenSymbol : wrappedTokenSymbol}
          adornmentPosition="end"
          adornmentSettings={{
            width: 55,
            padding: 8,
          }}
          required
          wide
        />
      </Field>
      <Field label={action === 'Wrap' ? 'Wrapped token amount' : 'Amount'}>
        <TextInput
          value={amount}
          onChange={handleAmountChange}
          adornment={action === 'Wrap' ? wrappedTokenSymbol : orgTokenSymbol}
          adornmentPosition="end"
          adornmentSettings={{
            width: 55,
            padding: 8,
          }}
          required
          wide
        />
      </Field>
      <Button disabled={!amount} mode="strong" type="submit" wide>
        {action + ' tokens'}
      </Button>
    </form>
  )
}
WrapTokensPanelContent.defaultProps = {
  onAction: () => {},
}

export default WrapTokensPanel
