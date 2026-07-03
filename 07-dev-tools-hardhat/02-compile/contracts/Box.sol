// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Box —— 一个最小的“存/取一个数字”合约
 * @notice 教学用途，未经审计，勿直接上主网。
 * 用它来观察编译产物（artifacts）里的 ABI 与字节码。
 */
contract Box {
    uint256 private _value; // 私有状态变量，存链上

    // 事件：值变化时触发。ABI 里会体现为一个 event 条目。
    event ValueChanged(uint256 newValue);

    /// @notice 写入一个新值（改状态 → 需要发交易、消耗 gas）
    function store(uint256 newValue) public {
        _value = newValue;
        emit ValueChanged(newValue);
    }

    /// @notice 读取当前值（view，不改状态 → 免费的 call，不上链）
    function retrieve() public view returns (uint256) {
        return _value;
    }
}
