import React from "react";
import { Button, GU, Info, Field, SidePanel, TextInput } from "@aragon/ui";

const initialState = {
  amount: ""
};

const WrapTokensPanel = React.memo(({ panelState, onWrapTokens }) => {
  return (
    <SidePanel
      title="Wrap tokens"
      opened={panelState.visible}
      onClose={panelState.requestClose}
      onTransitionEnd={panelState.onTransitionEnd}
    >
      <WrapTokensPanelContent onWrapTokens={onWrapTokens} panelOpened={panelState.didOpen} />
    </SidePanel>
  );
});

class WrapTokensPanelContent extends React.PureComponent {
  static defaultProps = {
    onWrapTokens: () => {}
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
    console.log("panel am", this.state.amount);
    this.props.onWrapTokens(this.state.amount)
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
              You can wrap any ERC20 tokens to generate a “Minime” voting token
              that you can use with this Aragon organization.
            </Info>
          </div>
          <Field label="Amount">
            <TextInput
              ref={amount => (this.amountInput = amount)}
              value={amount}
              onChange={this.handleAmountChange}
              required
              wide
            />
          </Field>

          <Button disabled={!amount} mode="strong" type="submit" wide>
            Wrap tokens
          </Button>
        </form>
      </div>
    );
  }
}

export default WrapTokensPanel;
