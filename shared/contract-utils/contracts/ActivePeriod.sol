/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 */

pragma solidity ^0.4.24;


/**
 * @title ActivePeriod
 * @notice Library for keeping track of activation periods based an arbitrary time unit (e.g. seconds
 *         or block numbers).
 * @dev Inspired by:
 *   - MiniMe token (https://github.com/aragon/minime/blob/master/contracts/MiniMeToken.sol)
 *   - Staking (https://github.com/aragon/staking/blob/master/contracts/Checkpointing.sol)
 */
library ActivePeriod {
    uint256 private constant MAX_UINT128 = uint256(uint128(-1));

    string private constant ERROR_TIME_TOO_BIG = "ACTIVEPERIOD_TIME_TOO_BIG";
    string private constant ERROR_BAD_START_TIME = "ACTIVEPERIOD_BAD_START_TIME";
    string private constant ERROR_NO_PERIODS = "ACTIVEPERIOD_NO_PERIODS";
    string private constant ERROR_LAST_NOT_ACTIVE = "ACTIVEPERIOD_LAST_NOT_ACTIVE";
    string private constant ERROR_BAD_STOP_TIME = "ACTIVEPERIOD_BAD_STOP_TIME";
    string private constant ERROR_INVALID_SEARCH = "ACTIVEPERIOD_INVALID_SEARCH";

    // Period of [enabledFromTime, disabledOnTime)
    struct Period {
        uint128 enabledFromTime;
        uint128 disabledOnTime;
    }

    struct History {
        Period[] history;
    }

    function startNextPeriodFrom(History storage _self, uint256 _enabledFromTime) internal {
        require(_enabledFromTime <= MAX_UINT128, ERROR_TIME_TOO_BIG);

        Period[] storage history = _self.history;
        if (history.length > 0) {
            // Make sure there's no currently activated period
            Period storage lastPeriod = history[history.length - 1];
            require(lastPeriod.disabledOnTime <= _enabledFromTime, ERROR_BAD_START_TIME);
        }

        _self.history.push(
            Period({
                enabledFromTime: uint128(_enabledFromTime),
                disabledOnTime: uint128(MAX_UINT128)
            })
        );
    }

    function stopCurrentPeriodAt(History storage _self, uint256 _disabledOnTime) internal {
        require(_disabledOnTime <= MAX_UINT128, ERROR_TIME_TOO_BIG);
        uint128 castedStopTime = uint128(_disabledOnTime);

        Period[] storage history = _self.history;
        require(history.length > 0, ERROR_NO_PERIODS);
        Period storage currentPeriod = history[history.length - 1];

        // Make sure there is a currently activated period to stop
        require(currentPeriod.disabledOnTime == MAX_UINT128, ERROR_LAST_NOT_ACTIVE);
        require(currentPeriod.enabledFromTime < castedStopTime, ERROR_BAD_STOP_TIME);

        currentPeriod.disabledOnTime = castedStopTime;
    }

    function isEnabledAt(History storage _self, uint256 _time) internal view returns (bool) {
        require(_time <= MAX_UINT128, ERROR_TIME_TOO_BIG);

        return _isEnabledAt(_self, _time);
    }

    function getPeriod(History storage _self, uint256 _index) internal view returns (Period storage) {
        return _self.history[_index];
    }

    function _isEnabledAt(History storage _self, uint256 _time) internal view returns (bool) {
        uint256 length = _self.history.length;

        // Short circuit if there's no periods yet
        // Note that this also allows us to avoid using SafeMath later, as we've established there
        // must be at least one period
        if (length == 0) {
            return false;
        }

        // Check last period
        uint256 lastIndex = length - 1;
        Period storage lastPeriod = _self.history[lastIndex];
        if (_inActivePeriod(lastPeriod, _time)) {
            return true;
        } else if (length == 1) {
            // No need to go any further; we've checked the only period
            return false;
        }

        // Check first period
        Period storage firstHistory = _self.history[0];
        if (_inActivePeriod(firstHistory, _time)) {
            return true;
        }

        // Do binary search
        // As we've already checked both ends, we don't need to check the last checkpoint again
        uint256 low = 0;
        uint256 high = lastIndex - 1;

        while (high > low) {
            uint256 mid = (high + low + 1) / 2; // average, ceil round
            Period storage midPoint = _self.history[mid];

            if (_inActivePeriod(midPoint, _time)) {
                return true;
            }

            if (_time >= midPoint.disabledOnTime) {
                low = mid;
            } else if (_time < midPoint.enabledFromTime) {
                // Note that we don't need SafeMath here because mid must always be greater than 0
                // from the while condition
                high = mid - 1;
            } else {
                revert(ERROR_INVALID_SEARCH);
            }
        }

        // No periods left to test
        return false;
    }

    function _inActivePeriod(Period storage _period, uint256 _time) private view returns (bool) {
        return _time >= _period.enabledFromTime && _time < _period.disabledOnTime;
    }
}
