pragma solidity ^0.4.24;

import "../../Checkpointing.sol";


contract CheckpointingWrapper {
    using Checkpointing for Checkpointing.History;

    Checkpointing.History history;

    function addCheckpoint(uint256 _time, uint256 _value) external {
        history.addCheckpoint(_time, _value);
    }

    function getValueAt(uint256 _time) external view returns (uint256) {
        return history.getValueAt(_time);
    }

    function lastUpdated() external view returns (uint256) {
        return history.lastUpdated();
    }

    function latestValue() external view returns (uint256) {
        return history.latestValue();
    }

    function getHistorySize() external view returns (uint256) {
        return history.history.length;
    }
}
