/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 */

pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/IForwarder.sol";
import "@aragon/os/contracts/common/SafeERC20.sol";
import "@aragon/os/contracts/lib/token/ERC20.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";
import "@aragon/apps-shared-minime/contracts/ITokenController.sol";


/**
 * @title TokenWrapper
 * @dev Based on https://github.com/MyBitFoundation/MyBit-DAO.tech/blob/master/apps/MyTokens/contracts/MyTokens.sol
 */
contract TokenWrapper is ITokenController, IForwarder, AragonApp {
    using SafeERC20 for ERC20;

    string private constant ERROR_CAN_NOT_FORWARD = "TW_CAN_NOT_FORWARD";
    string private constant ERROR_CALLER_NOT_TOKEN = "TW_CALLER_NOT_TOKEN";
    string private constant ERROR_DEPOSIT_AMOUNT_ZERO = "TW_DEPOSIT_AMOUNT_ZERO";
    string private constant ERROR_WITHDRAW_AMOUNT_ZERO = "TW_WITHDRAW_AMOUNT_ZERO";
    string private constant ERROR_INVALID_WITHDRAW_AMOUNT = "TW_INVALID_WITHDRAW_AMOUNT";
    string private constant ERROR_INVALID_TOKEN_CONTROLLER = "TW_INVALID_TOKEN_CONTROLLER";
    string private constant ERROR_TOKEN_BURN_FAILED = "TW_TOKEN_BURN_FAILED";
    string private constant ERROR_TOKEN_MINT_FAILED = "TW_TOKEN_MINT_FAILED";
    string private constant ERROR_ERC20_TRANSFER_FAILED = "TW_ERC20_TRANSFER_FAILED";
    string private constant ERROR_ERC20_TRANSFER_FROM_FAILED = "TW_ERC20_TRANSFER_FROM_FAILED";

    ERC20 public erc20;
    MiniMeToken public token;

    event Deposit(address indexed entity, uint256 amount);
    event Withdrawal(address indexed entity, uint256 amount);

    modifier onlyToken() {
        require(msg.sender == address(token), ERROR_CALLER_NOT_TOKEN);
        _;
    }

    /**
     * @notice Initialize a new MiniMe token that will be convertible from an ERC20 token
     * @param _token The MiniMeToken controlled by this app
     * @param _erc20 The ERC20 token that is deposited in order to receive MiniMe tokens
     */
    function initialize(MiniMeToken _token, ERC20 _erc20) external {
        initialized();
        require(_token.controller() == address(this), ERROR_INVALID_TOKEN_CONTROLLER);

        token = _token;
        erc20 = _erc20;
        token.enableTransfers(false);
    }

    /**
     * @notice Wrap `@tokenAmount(self.erc20(): address, _amount)`
     */
    function deposit(uint256 _amount) external {
        require(_amount > 0, ERROR_DEPOSIT_AMOUNT_ZERO);

        // Fetch erc20 tokens and mint minime tokens
        require(erc20.safeTransferFrom(msg.sender, address(this), _amount), ERROR_ERC20_TRANSFER_FROM_FAILED);
        require(token.generateTokens(msg.sender, _amount), ERROR_TOKEN_MINT_FAILED);

        emit Deposit(msg.sender, _amount);
    }

    /**
     * @notice Unwrap `@tokenAmount(self.erc20(): address, _amount)`
     */
    function withdraw(uint256 _amount) external {
        require(_amount > 0, ERROR_WITHDRAW_AMOUNT_ZERO);
        require(_amount <= ERC20(token).staticBalanceOf(msg.sender), ERROR_INVALID_WITHDRAW_AMOUNT);

        // Burn minime tokens and return erc20 tokens
        require(token.destroyTokens(msg.sender, _amount), ERROR_TOKEN_BURN_FAILED);
        require(erc20.safeTransfer(msg.sender, _amount), ERROR_ERC20_TRANSFER_FAILED);

        emit Withdrawal(msg.sender, _amount);
    }

    // ITokenController fns
    // `onTransfer()`, `onApprove()`, and `proxyPayment()` are callbacks from the MiniMe token
    // contract and are only meant to be called through the managed MiniMe token that gets assigned
    // during initialization.

    /*
    * @dev Notifies the controller about a token transfer allowing the controller to react if desired
    * @return Always false to deny transfers
    */
    function onTransfer(address, address, uint256) external onlyToken returns (bool) {
        return false;
    }

    /**
     * @dev Notifies the controller about an approval allowing the controller to react if desired
     * @return Always false to deny approvals
     */
    function onApprove(address, address, uint256) external onlyToken returns (bool) {
        return false;
    }

    /**
     * @dev Notifies the controller when the token contract receives ETH allowing the controller to react if desired
     * @return Always false to deny sent ETH
     */
    function proxyPayment(address) external payable onlyToken returns (bool) {
        return false;
    }

    // Forwarding fns

    function isForwarder() public pure returns (bool) {
        return true;
    }

    /**
     * @notice Execute desired action as a token holder
     * @dev IForwarder interface conformance. Forwards any token holder action.
     * @param _evmScript Script being executed
     */
    function forward(bytes _evmScript) public {
        require(canForward(msg.sender, _evmScript), ERROR_CAN_NOT_FORWARD);
        bytes memory input = new bytes(0);

        // Add both known tokens to the blacklist to disallow a token holder from interacting with
        // either token on this contract's behalf.
        // Note that this contract is the controller of at least the attached MiniMe token.
        address[] memory blacklist = new address[](2);
        blacklist[0] = address(token);
        blacklist[1] = address(erc20);

        runScript(_evmScript, input, blacklist);
    }

    function canForward(address _sender, bytes) public view returns (bool) {
        return hasInitialized() && ERC20(token).staticBalanceOf(_sender) > 0;
    }
}
