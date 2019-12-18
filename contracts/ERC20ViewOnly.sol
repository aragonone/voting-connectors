/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 */

pragma solidity 0.4.24;

import "@aragon/os/contracts/lib/token/ERC20.sol";


/**
 * @title ERC20ViewOnly
 * @notice Abstract ERC20 interface that is "view-only" by disallowing transfers and allowances. Implementations must track account balances via another mechanism.
 * @dev Implemented functions at this level **NEVER** revert
 */
contract ERC20ViewOnly is ERC20 {
    function approve(address, uint256) public returns (bool) {
        // !!! review(@izqui): i would definitely revert either here or at the TW level
        return false;
    }

    function transfer(address, uint256) public returns (bool) {
        // !!! review(@izqui): i would definitely revert either here or at the TW level
        return false;
    }

    function transferFrom(address, address, uint256) public returns (bool) {
        // !!! review(@izqui): i would definitely revert either here or at the TW level
        return false;
    }

    function allowance(address, address) public view returns (uint256) {
        return 0;
    }
}
