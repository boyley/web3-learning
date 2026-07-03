// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Counter —— Foundry 脚手架自带的计数器（教学用途，未经审计）
contract Counter {
    uint256 public number;

    function setNumber(uint256 newNumber) public {
        number = newNumber;
    }

    function increment() public {
        number++;
    }
}
