// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Box —— 存/取一个数字（教学用途，未经审计，勿上主网）
contract Box {
    uint256 private _value;
    event ValueChanged(uint256 newValue);

    // 构造函数带参数：部署时需要传入初始值，演示“带构造参数的部署”
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
