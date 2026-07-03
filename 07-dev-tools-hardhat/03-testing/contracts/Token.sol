// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Token —— 一个极简的自定义代币（非标准 ERC-20，仅用于教学测试）
 * @notice 教学用途，未经审计，勿直接上主网。
 */
contract Token {
    string public name = "My Hardhat Token";
    string public symbol = "MHT";
    // 总量固定，部署时全部给到部署者（owner）
    uint256 public totalSupply = 1_000_000;
    address public owner;

    // 余额表：地址 => 数量
    mapping(address => uint256) balances;

    // 转账事件，测试里会用 emit 断言它被正确触发
    event Transfer(address indexed from, address indexed to, uint256 amount);

    constructor() {
        // 部署时，把全部代币记到部署者名下
        balances[msg.sender] = totalSupply;
        owner = msg.sender;
    }

    /// @notice 从调用者向 to 转 amount 个代币
    function transfer(address to, uint256 amount) external {
        // 余额不足则回滚，并带上自定义错误信息（测试里会断言这条信息）
        require(balances[msg.sender] >= amount, "Not enough tokens");

        balances[msg.sender] -= amount;
        balances[to] += amount;

        emit Transfer(msg.sender, to, amount);
    }

    /// @notice 查询某地址余额（view，免费读）
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}
