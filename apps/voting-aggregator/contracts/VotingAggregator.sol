/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 */

pragma solidity 0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/IForwarder.sol";
import "@aragon/os/contracts/common/IsContract.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";
import "@aragon/os/contracts/lib/token/ERC20.sol";

import "@aragonone/voting-connectors-contract-utils/contracts/ERC20ViewOnly.sol";
import "@aragonone/voting-connectors-contract-utils/contracts/interfaces/IERC20WithCheckpointing.sol";
import "@aragonone/voting-connectors-contract-utils/contracts/StaticInvoke.sol";

import "./interfaces/IERC900History.sol";


/**
 * @title VotingAggregator
 * @notice Voting power aggregator across many sources that provides a "view-only" checkpointed ERC20 implementation
 */
contract VotingAggregator is IERC20WithCheckpointing, IForwarder, IsContract, ERC20ViewOnly, AragonApp {
    using SafeMath for uint256;
    using StaticInvoke for address;

    // TODO: just use keccak hashes
    bytes32 public constant ADD_POWER_SOURCE_ROLE = keccak256("ADD_POWER_SOURCE_ROLE");
    bytes32 public constant MANAGE_POWER_SOURCE_ROLE = keccak256("MANAGE_POWER_SOURCE_ROLE");
    bytes32 public constant MANAGE_WEIGHTS_ROLE = keccak256("MANAGE_WEIGHTS_ROLE");

    uint128 internal constant MAX_UINT128 = uint128(-1);

    string private constant ERROR_NO_POWER_SOURCE = "VA_NO_POWER_SOURCE";
    string private constant ERROR_POWER_SOURCE_NOT_CONTRACT = "VA_POWER_SOURCE_NOT_CONTRACT";
    string private constant ERROR_SOURCE_NOT_ENABLED = "VA_POWER_SOURCE_NOT_ENABLED";
    string private constant ERROR_SOURCE_NOT_DISABLED = "VA_POWER_SOURCE_NOT_DISABLED";
    string private constant ERROR_CAN_NOT_FORWARD = "VA_CAN_NOT_FORWARD";
    string private constant ERROR_SOURCE_CALL_FAILED = "VA_SOURCE_CALL_FAILED";
    string private constant ERROR_INVALID_SOURCE_ACTIVE_HISTORY = "VA_INVALID_SOURCE_ACTIVE_HISTORY";
    string private constant ERROR_INVALID_CALL_OR_SELECTOR = "VA_INVALID_CALL_OR_SELECTOR";

    enum PowerSourceType {
        ERC20WithCheckpointing,
        ERC900
    }

    enum CallType {
        BalanceOfAt,
        TotalSupplyAt
    }

    // Range of [enabledFromBlock, disabledOnBlock)
    struct ActiveRange {
        uint128 enabledFromBlock;
        uint128 disabledOnBlock;
    }

    struct PowerSource {
        address addr;
        PowerSourceType sourceType;
        uint256 weight;
        ActiveRange[] activationHistory;
    }

    string public name;
    string public symbol;
    uint8 public decimals;

    mapping (uint256 => PowerSource) internal powerSources;
    uint256 public powerSourcesLength;

    event AddPowerSource(uint256 indexed sourceId, address indexed sourceAddress, PowerSourceType sourceType, uint256 weight);
    event ChangePowerSourceWeight(uint256 indexed sourceId, uint256 newWeight);
    event DisablePowerSource(uint256 indexed sourceId);
    event EnablePowerSource(uint256 indexed sourceId);

    modifier sourceExists(uint256 _sourceId) {
        require(_sourceId <= powerSourcesLength, ERROR_NO_POWER_SOURCE);
        _;
    }

    /**
     * @notice Create a new voting power aggregator
     * @param _name The aggregator's display name
     * @param _symbol The aggregator's display symbol
     * @param _decimals The aggregator's display decimal units
     */
    function initialize(string _name, string _symbol, uint8 _decimals) external onlyInit {
        initialized();

        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    /**
     * @notice Add a new power source (`_sourceAddr`) with `_weight` weight
     * @param _sourceAddr Address of the power source
     * @param _sourceType Interface type of the power source
     * @param _weight Weight to assign to the source
     * @return Id of added power source
     */
    function addPowerSource(address _sourceAddr, PowerSourceType _sourceType, uint256 _weight)
        external
        authP(ADD_POWER_SOURCE_ROLE, arr(_sourceAddr, _weight))
        returns (uint256)
    {
        require(isContract(_sourceAddr), ERROR_POWER_SOURCE_NOT_CONTRACT);

        uint256 newSourceId = powerSourcesLength++;

        powerSources[newSourceId] = PowerSource({
            addr: _sourceAddr,
            sourceType: _sourceType,
            weight: _weight
        });

        // Start activation history with [current block, max block)
        source.activationHistory.push(
            ActiveRange({
                enabledFromBlock: uint128(getBlockNumber64()),
                disabledOnBlock: MAX_UINT128
            )
        );

        emit AddPowerSource(newSourceId, _sourceAddr, _sourceType, _weight);

        return newSourceId;
    }

    /**
     * @notice Change weight of power source #`_sourceId` to `_weight`
     * @param _sourceId Power source id
     * @param _weight New weight to assign
     */
    function changeSourceWeight(uint256 _sourceId, uint256 _weight)
        external
        authP(MANAGE_WEIGHTS_ROLE, arr(_weight, powerSources[_sourceId].weight))
        sourceExists(_sourceId)
    {
        powerSources[_sourceId].weight = _weight;
        emit ChangePowerSourceWeight(_sourceId, _weight);
    }

    /**
     * @notice Disable power source #`_sourceId`
     * @param _sourceId Power source id
     */
    function disableSource(uint256 _sourceId)
        external
        authP(MANAGE_POWER_SOURCE_ROLE, arr(uint256(0)))
        sourceExists(_sourceId)
    {
        PowerSource storage source = powerSources[_sourceId];
        require(_sourceEnabledAt(source, getBlockNumber()), ERROR_SOURCE_NOT_ENABLED);

        ActiveRange[] storage activationHistory = source.activationHistory;
        ActiveRange storage currentActiveRange = activationHistory[activationHistory.length];
        currentActiveRange.disabledOnBlock = uint128(getBlockNumber64());

        emit DisablePowerSource(_sourceId);
    }

    /**
     * @notice Enable power source #`_sourceId`
     * @param _sourceId Power source id
     */
    function enableSource(uint256 _sourceId)
        external
        sourceExists(_sourceId)
        authP(MANAGE_POWER_SOURCE_ROLE, arr(uint256(1)))
    {
        PowerSource storage source = powerSources[_sourceId];
        require(!_sourceEnabledAt(source, getBlockNumber()), ERROR_SOURCE_NOT_DISABLED);

        source.activationHistory.push(
            ActiveRange({
                enabledFromBlock: uint128(getBlockNumber64()),
                disabledOnBlock: MAX_UINT128
            })
        );

        emit EnablePowerSource(_sourceId);
    }

    // ERC20 fns - note that this token is a non-transferrable "view-only" implementation.
    // Users should only be changing balances by changing their balances in the underlying tokens.
    // These functions do **NOT** revert if the app is uninitialized to stay compatible with normal ERC20s.

    function balanceOf(address _owner) public view returns (uint256) {
        return balanceOfAt(_owner, getBlockNumber());
    }

    function totalSupply() public view returns (uint256) {
        return totalSupplyAt(getBlockNumber());
    }

    // Checkpointed fns
    // These functions do **NOT** revert if the app is uninitialized to stay compatible with normal ERC20s.

    function balanceOfAt(address _owner, uint256 _blockNumber) public view returns (uint256) {
        return _aggregate(CallType.BalanceOfAt, abi.encode(_owner, _blockNumber));
    }

    function totalSupplyAt(uint256 _blockNumber) public view returns (uint256) {
        return _aggregate(CallType.TotalSupplyAt, abi.encode(_blockNumber));
    }

    // Forwarding fns

    /**
    * @notice Tells whether the VotingAggregator app is a forwarder or not
    * @dev IForwarder interface conformance
    * @return Always true
    */
    function isForwarder() public pure returns (bool) {
        return true;
    }

    /**
     * @notice Execute desired action if you have voting power
     * @dev IForwarder interface conformance
     * @param _evmScript Script being executed
     */
    function forward(bytes _evmScript) public {
        require(canForward(msg.sender, _evmScript), ERROR_CAN_NOT_FORWARD);
        bytes memory input = new bytes(0);

        // No blacklist needed as this contract should not hold any tokens from its sources
        runScript(_evmScript, input, new address[](0));
    }

    /**
    * @notice Tells whether `_sender` can forward actions or not
    * @dev IForwarder interface conformance
    * @param _sender Address of the account intending to forward an action
    * @return True if the given address can forward actions, false otherwise
    */
    function canForward(address _sender, bytes) public view returns (bool) {
        return hasInitialized() && balanceOf(_sender) > 0;
    }

    // Getter fns

    /**
     * @dev Return information about a power source
     * @param _sourceId Power source id
     * @return Power source address
     * @return Power source type
     * @return Power source weight
     * @return Number of activation history points
     */
    function getPowerSource(uint256 _sourceId)
        public
        view
        sourceExists(_sourceId)
        returns (
            address sourceAddress,
            PowerSourceType sourceType,
            uint256 weight,
            uint256 historyLength
        )
    {
        PowerSource storage source = powerSources[_sourceId];

        sourceAddress = source.addr;
        sourceType = source.sourceType;
        weight = source.weight;
        historyLength = source.activationHistory.length;
    }

    /**
     * @dev Return information about a power source's activation history
     * @param _sourceId Power source id
     * @param _rangeIndex Index of activation history
     * @return Start block of activation range
     * @return End block of activation range
     */
    function getPowerSourceHistoryRange(uint256 _sourceId, uint256 _rangeIndex)
        public
        view
        sourceExists(_sourceId)
        returns (
            uint128 enabledFromBlock,
            uint128 disabledOnBlock
        )
    {
        ActiveRange storage range = powerSources[_sourceId].activationHistory[_rangeIndex];

        enabledFromBlock = range.enabledFromBlock;
        disabledOnBlock = range.disabledOnBlock;
    }

    // Internal fns

    function _aggregate(CallType _callType, bytes memory _paramdata) internal view returns (uint256) {
        uint256 aggregate = 0;

        for (uint256 i = 0; i < powerSourcesLength; i++) {
            PowerSource storage source = powerSources[i];

            bytes memory invokeData = abi.encodePacked(_selectorFor(_callType, source.sourceType), _paramdata);
            (bool success, uint256 value) = source.addr.staticInvoke(invokeData);
            require(success, ERROR_SOURCE_CALL_FAILED);

            aggregate = aggregate.add(source.weight.mul(value));
        }

        return aggregate;
    }

    function _inActiveRange(ActiveRange storage _range, uint256 _blockNumber) internal view returns (bool) {
        return _blockNumber >= _range.enabledFromBlock && _blockNumber < _range.disabledOnBlock;
    }

    function _sourceEnabledAt(PowerSource storage _source, uint256 _blockNumber) internal view returns (bool) {
        ActiveRange[] storage history = _source.activationHistory;
        uint256 historyLength = history.length;

        // This should never happen, but we should return false anyhow
        // Note that this also allows us to avoid using SafeMath later, as we've established there
        // must be at least one history range
        if (historyLength == 0) {
            return false;
        }

        // Check last history range
        uint256 lastHistoryIndex = historyLength - 1;
        ActiveRange storage lastHistory = history[lastHistoryIndex];
        if (_inActiveRange(lastHistory, _blockNumber)) {
            return true;
        } else if (historyLength == 1) {
            // No need to go any further; we've checked the only history range
            return false;
        }

        // Check first history range
        ActiveRange storage firstHistory = history[0];
        if (_inActiveRange(firstHistory, _blockNumber)) {
            return true;
        }

        // Do binary search
        // As we've already checked both ends, we don't need to check the last checkpoint again
        uint256 min = 0;
        uint256 max = historyLength - 2;
        while (max > min) {
            uint256 mid = (max + min + 1) / 2;
            ActiveRange storage midPoint = history[mid];
            if (_inActiveRange(midPoint, _blockNumber)) {
                // This range includes the given block number
                return true;
            }

            if (_blockNumber >= midPoint.disabledOnBlock) {
                min = mid;
            } else if (_blockNumber < midPoint.enabledFromBlock) {
                // Note that we don't need SafeMath here because mid must always be greater than 0
                // from the while condition
                max = mid - 1;
            } else {
                revert(ERROR_INVALID_SOURCE_ACTIVE_HISTORY);
            }
        }

        // No ranges left to test
        return false;
    }

    function _selectorFor(CallType _callType, PowerSourceType _sourceType) internal pure returns (bytes4) {
        if (_sourceType == PowerSourceType.ERC20WithCheckpointing) {
            if (_callType == CallType.BalanceOfAt) {
                return IERC20WithCheckpointing(0).balanceOfAt.selector;
            }
            if (_callType == CallType.TotalSupplyAt) {
                return IERC20WithCheckpointing(0).totalSupplyAt.selector;
            }
        }

        if (_sourceType == PowerSourceType.ERC900) {
            if (_callType == CallType.BalanceOfAt) {
                return IERC900History(0).totalStakedForAt.selector;
            }
            if (_callType == CallType.TotalSupplyAt) {
                return IERC900History(0).totalStakedAt.selector;
            }
        }

        revert(ERROR_INVALID_CALL_OR_SELECTOR);
    }
}
