import React from "react";
import { Button, GU, Info, Field, SidePanel, TextInput } from "@aragon/ui";

const initialState = {
  amount: ""
};

const UnwrapTokensPanel = React.memo(({ panelState, onUnwrapTokens }) => {
  return (
    <SidePanel
      title="Wrap tokens"
      opened={panelState.visible}
      onClose={panelState.requestClose}
      onTransitionEnd={panelState.onTransitionEnd}
    >
      <UnwrapTokensPanelContent
        onUnwrapTokens={onUnwrapTokens}
        panelOpened={panelState.didOpen}
      />
    </SidePanel>
  );
});

class UnwrapTokensPanelContent extends React.PureComponent {
  static defaultProps = {
    onUnwrapTokens: () => {}
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
    this.props.onUnwrapTokens(this.state.amount);
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
            <Info>bla bla</Info>
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
            Unwrap tokens
          </Button>
        </form>
      </div>
    );
  }
}

export default UnwrapTokensPanel;
