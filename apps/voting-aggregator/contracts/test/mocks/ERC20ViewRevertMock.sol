pragma solidity 0.4.24;

import "@aragon/os/contracts/lib/token/ERC20.sol";


contract ERC20ViewRevertMock is ERC20 {
    bool revertsOnBalance;
    bool revertsOnSupply;

    constructor (bool _revertsOnBalance, bool _revertsOnSupply) public {
        revertsOnBalance = _revertsOnBalance;
        revertsOnSupply = _revertsOnSupply;
    }

    function transfer(address, uint256) public returns (bool success) {
        return false;
    }

    function transferFrom(address, address, uint256) public returns (bool success) {
        return false;
    }

    function approve(address, uint256) public returns (bool success) {
        return false;
    }

    function allowance(address, address) public view returns (uint256 remaining) {
        return 0;
    }

    function balanceOf(address) public view returns (uint256 balance) {
        if (revertsOnBalance) {
            revert("BALANCE_OF_REVERT");
        }
        return 0;
    }

    function totalSupply() public view returns (uint256 ts) {
        if (revertsOnSupply) {
            revert("TOTAL_SUPPLY_REVERT");
        }
        return 0;
    }
}
