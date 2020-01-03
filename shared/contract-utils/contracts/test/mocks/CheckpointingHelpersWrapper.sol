pragma solidity ^0.4.24;

import "../../CheckpointingHelpers.sol";


contract CheckpointingHelpersWrapper {
    using CheckpointingHelpers for uint256;

    function convertUint64(uint256 _a) external pure returns (uint64) {
        return _a.toUint64();
    }

    function convertUint192(uint256 _a) external pure returns (uint192) {
        return _a.toUint192();
    }
}
