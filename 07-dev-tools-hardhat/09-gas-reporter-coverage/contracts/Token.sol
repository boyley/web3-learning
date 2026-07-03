// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Token —— 极简代币（教学用途，未经审计），用于观察 gas 与覆盖率
contract Token {
    string public name = "Gas Demo Token";
    uint256 public totalSupply = 1_000_000;
    mapping(address => uint256) public balances;

    event Transfer(address indexed from, address indexed to, uint256 amount);

    constructor() {
        balances[msg.sender] = totalSupply;
    }

    function transfer(address to, uint256 amount) external {
        require(balances[msg.sender] >= amount, "Not enough tokens");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
    }

    // 故意留一个测试没覆盖的函数，用来演示“覆盖率报告会标红未测代码”
    function burn(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Not enough to burn");
        balances[msg.sender] -= amount;
        totalSupply -= amount;
    }
}
