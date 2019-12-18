/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 */

pragma solidity 0.4.24;


/**
 * @title Checkpoint
 * @notice Checkpoint library for keep track of historical values based on block numbers.
 * @dev Inspired by:
 *   - MiniMe token
 */
library Checkpoint {
    // review(@izqui): why not prefix error with 'CHECKPOINTING'?
    string private constant ERROR_UINT128_NUMBER_TOO_BIG = "UINT128_NUMBER_TOO_BIG";

    uint256 internal constant MAX_UINT128 = uint256(uint128(-1));

    // Checkpoint data struct for keeping track of values at particular block numbers
    struct Data {
        // `fromBlock` is the block number that the value was generated from
        uint128 fromBlock; // review(@izqui): consider renaming to 'time' as we do in Aragon Court, as there's no reason why this lib can only work with block numbers
        // `value` is the value at a specific block number
        uint128 value;
    }

    // review(@izqui): consider renaming 'now' to 'time' or 'block' as it is quite weird that 'now' could totally be a value in the past or the future
    // as this library has no notion of what time it is
    function updateValueAtNow(Data[] storage _self, uint256 _value, uint256 _now) internal {
        uint256 checkpointsLength = _self.length;
        uint128 castedValue = _toUint128(_value);

        if (checkpointsLength == 0 || _now > _self[checkpointsLength - 1].fromBlock) {
            _self.push(Data({ fromBlock: _toUint128(_now), value: castedValue }));
        } else {
            Data storage oldCheckPoint = _self[checkpointsLength - 1];
            oldCheckPoint.value = castedValue;
        }
    }

    // review(@izqui): not reviewing, assuming it was copied from other implementations we use
    function getValueAt(Data[] storage _self, uint256 _blockNumber) internal view returns (uint256) {
        uint256 checkpointsLength = _self.length;

        // Short circuit if there's no checkpoints yet
        // Note that this also lets us avoid using SafeMath later on, as we've established that
        // there must be at least one checkpoint
        if (checkpointsLength == 0) {
            return 0;
        }

        // Check last checkpoint
        uint256 lastCheckpointIndex = checkpointsLength - 1;
        Data storage lastCheckpoint = _self[lastCheckpointIndex];
        if (_blockNumber >= lastCheckpoint.fromBlock) {
            return uint256(lastCheckpoint.value);
        }

        // Check first checkpoint (if not already checked with the above check on last)
        if (checkpointsLength == 1 || _blockNumber < _self[0].fromBlock) {
            return 0;
        }

        // Do binary search
        // As we've already checked both ends, we don't need to check the last checkpoint again
        uint256 min = 0;
        uint256 max = checkpointsLength - 2;
        while (max > min) {
            uint256 mid = (max + min + 1) / 2;
            if (_blockNumber >= _self[mid].fromBlock) {
                min = mid;
            } else {
                // Note that we don't need SafeMath here because mid must always be greater than 0
                // from the while condition
                max = mid - 1;
            }
        }
        return uint256(_self[min].value);
    }

    // review(@izqui): consider renaming to 'safeToUint128' as it otherwise could look like the language's default casting
    function _toUint128(uint256 _a) private pure returns (uint128) {
        require(_a <= MAX_UINT128, ERROR_UINT128_NUMBER_TOO_BIG);
        return uint128(_a);
    }
}
