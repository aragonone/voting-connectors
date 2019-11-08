import React from "react";
import { Button, GU, Info, Field, SidePanel, TextInput } from "@aragon/ui";

const initialState = {
  amount: ""
};

const WrapTokensPanel = React.memo(({ panelState, onAction, action, info, erc20TokenSymbol, wrappedTokenSymbol}) => {

  return (
    <SidePanel
      title={action + " tokens"}
      opened={panelState.visible}
      onClose={panelState.requestClose}
      onTransitionEnd={panelState.onTransitionEnd}
    >
      <WrapTokensPanelContent
        onAction={onAction}
        action={action}
        info={info}
        erc20TokenSymbol={erc20TokenSymbol}
        wrappedTokenSymbol={wrappedTokenSymbol}
        panelOpened={panelState.didOpen}
      />
    </SidePanel>
  );
});

class WrapTokensPanelContent extends React.PureComponent {
  static defaultProps = {
    onAction: () => {}
  };
  state = {
    ...initialState
  };
  componentWillReceiveProps({ panelOpened }) {
    if (panelOpened && !this.props.panelOpened) {
      // setTimeout is needed as a small hack to wait until the input's on
      // screen until we call focus
      this.amountInput && setTimeout(() => this.amountInput.focus(), 0);
    } else if (!panelOpened && this.props.panelOpened) {
      // Finished closing the panel, so reset its state
      this.setState({ ...initialState });
    }
  }
  handleAmountChange = event => {
    this.setState({ amount: event.target.value });
  };

  handleSubmit = event => {
    event.preventDefault();
    this.props.onAction(this.state.amount);
  };
  render() {
    const { amount } = this.state;

    return (
      <div>
        <form
          css={`
            margin-top: ${3 * GU}px;
          `}
          onSubmit={this.handleSubmit}
        >
          <div
            css={`
              margin-bottom: ${3 * GU}px;
            `}
          >
            <Info>
              {this.props.info}
            </Info>
          </div>
          <Field label={this.props.action == 'Wrap' ? "Amount" : "Wrapped token amount"} >
            <TextInput
              ref={amount => (this.amountInput = amount)}
              value={amount}
              min={0}
              max={300}
              onChange={this.handleAmountChange}
              adornment={this.props.action == 'Wrap' ? this.props.erc20TokenSymbol : this.props.wrappedTokenSymbol}
              adornmentPosition="end"
              adornmentSettings={{
                width: 55,
                padding: 8,
              }}
              required
              wide
            />
          </Field>
          <Field label={this.props.action == 'Wrap' ? "Wrapped token amount" : "Amount"} >
            <TextInput
              ref={amount => (this.amountInput = amount)}
              value={amount}
              onChange={this.handleAmountChange}
              adornment={this.props.action == 'Wrap' ? this.props.wrappedTokenSymbol : this.props.erc20TokenSymbol}
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
            {this.props.action + " tokens"}
          </Button>
        </form>
      </div>
    );
  }
}


export default WrapTokensPanel;
