// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Box —— 部署到 Sepolia 并在 Etherscan 验证源码（教学用途，未经审计）
contract Box {
    uint256 private _value;
    event ValueChanged(uint256 newValue);

    constructor(uint256 initialValue) {
        _value = initialValue;
    }

    function store(uint256 newValue) public {
        _value = newValue;
        emit ValueChanged(newValue);
    }

    function retrieve() public view returns (uint256) {
        return _value;
    }
}
