import React from "react";
import { Button, GU, Info, Field, SidePanel, TextInput } from "@aragon/ui";

const initialState = {
  amount: ""
};

const WrapTokensPanel = React.memo(({ panelState, onAction, action, info }) => {
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
            {this.props.action + " tokens"}
          </Button>
        </form>
      </div>
    );
  }
}

export default WrapTokensPanel;
