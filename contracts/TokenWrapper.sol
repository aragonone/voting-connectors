/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 */

pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/IForwarder.sol";
import "@aragon/os/contracts/lib/token/ERC20.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";
import "@aragon/apps-shared-minime/contracts/ITokenController.sol";


/**
 * @title TokenWrapper
 * @dev Based on https://github.com/MyBitFoundation/MyBit-DAO.tech/blob/master/apps/MyTokens/contracts/MyTokens.sol
 */
contract TokenWrapper is ITokenController, IForwarder, AragonApp {
    using SafeMath for uint256;

    string private constant ERROR_CAN_NOT_FORWARD = "TW_CAN_NOT_FORWARD";
    string private constant ERROR_CALLER_NOT_TOKEN = "TW_CALLER_NOT_TOKEN";
    string private constant ERROR_LOCK_AMOUNT_ZERO = "TW_LOCK_AMOUNT_ZERO";
    string private constant ERROR_UNLOCK_AMOUNT_ZERO = "TW_UNLOCK_AMOUNT_ZERO";
    string private constant ERROR_INVALID_UNLOCK_AMOUNT = "TW_INVALID_UNLOCK_AMOUNT";
    string private constant ERROR_INVALID_TOKEN_CONTROLLER = "TW_INVALID_TOKEN_CONTROLLER";
    string private constant ERROR_TOKEN_BURN_FAILED = "TW_TOKEN_BURN_FAILED";
    string private constant ERROR_TOKEN_MINT_FAILED = "TW_TOKEN_MINT_FAILED";
    string private constant ERROR_ERC20_TRANSFER_FAILED = "TW_ERC20_TRANSFER_FAILED";
    string private constant ERROR_ERC20_TRANSFER_FROM_FAILED = "TW_ERC20_TRANSFER_FROM_FAILED";

    ERC20 public erc20;
    MiniMeToken public token;
    mapping(address => uint256) internal lockedAmount;

    event TokensLocked(address entity, uint256 amount);
    event TokensUnlocked(address entity, uint256 amount);

    modifier onlyToken() {
        require(msg.sender == address(token), ERROR_CALLER_NOT_TOKEN);
        _;
    }

    /**
     * @notice Initialize a new MiniMe token that will be the controller of an ERC20 token
     * @param _token The MiniMe token that is used in the DAO
     * @param _erc20 The ERC20 token that is locked in order to receive MiniMe tokens
     */
    function initialize(MiniMeToken _token, ERC20 _erc20) external {
        initialized();
        require(_token.controller() == address(this), ERROR_INVALID_TOKEN_CONTROLLER);

        token = _token;
        erc20 = _erc20;
        token.enableTransfers(false);
    }

    /**
     * @notice Lock `_amount` tokens
     */
    function lock(uint256 _amount) external {
        require(_amount > 0, ERROR_LOCK_AMOUNT_ZERO);

        lockedAmount[msg.sender] = lockedAmount[msg.sender].add(_amount);
        emit TokensLocked(msg.sender, _amount);

        require(erc20.transferFrom(msg.sender, address(this), _amount), ERROR_ERC20_TRANSFER_FROM_FAILED);
        require(token.generateTokens(msg.sender, _amount), ERROR_TOKEN_MINT_FAILED);
    }

    /**
     * @notice Unlock `_amount` tokens
     */
    function unlock(uint256 _amount) external {
        require(_amount > 0, ERROR_UNLOCK_AMOUNT_ZERO);
        require(_amount <= lockedAmount[msg.sender], ERROR_INVALID_UNLOCK_AMOUNT);

        lockedAmount[msg.sender] = lockedAmount[msg.sender].sub(_amount);
        emit TokensUnlocked(msg.sender, _amount);

        require(token.destroyTokens(msg.sender, _amount), ERROR_TOKEN_BURN_FAILED);
        require(erc20.transfer(msg.sender, _amount), ERROR_ERC20_TRANSFER_FAILED);
    }

    /*
    * @dev Notifies the controller about a token transfer allowing the controller to react if desired
    * @return False aways
    */
    function onTransfer(address, address, uint256) external onlyToken returns (bool) {
        return false;
    }

    /**
     * @dev Notifies the controller about an approval allowing the controller to react if desired
     * @return False always
     */
    function onApprove(address, address, uint256) external onlyToken returns (bool) {
        return false;
    }

    /**
     * @dev Notifies the controller when the token contract receives ETH allowing the controller to react if desired
     * @return False always
     */
    function proxyPayment(address) external payable onlyToken returns (bool) {
        return false;
    }

    /**
     * @notice Execute desired action as a token holder
     * @dev IForwarder interface conformance. Forwards any token holder action.
     * @param _evmScript Script being executed
     */
    function forward(bytes _evmScript) public {
        require(canForward(msg.sender, _evmScript), ERROR_CAN_NOT_FORWARD);
        bytes memory input = new bytes(0);

        // Add the managed token to the blacklist to disallow a token holder from executing actions
        // on the token controller's (this contract) behalf
        address[] memory blacklist = new address[](2);
        blacklist[0] = address(token);
        blacklist[1] = address(erc20);

        runScript(_evmScript, input, blacklist);
    }

    function isForwarder() public pure returns (bool) {
        return true;
    }

    function canForward(address _sender, bytes) public view returns (bool) {
        return hasInitialized() && token.balanceOf(_sender) > 0;
    }

    function getLockedAmount(address _account) public view returns (uint256) {
        return lockedAmount[_account];
    }
}
