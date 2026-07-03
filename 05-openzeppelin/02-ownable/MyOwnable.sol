// SPDX-License-Identifier: MIT
// 教学用途，未经审计，勿直接上主网。
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyOwnable
 * @notice 演示 OpenZeppelin v5 的 Ownable：给合约加一个「唯一管理员（owner）」。
 * @dev v5 与 v4 的关键区别：
 *      - v4：constructor 无参，owner 默认等于部署者 msg.sender。
 *      - v5：constructor 必须显式传 initialOwner（Ownable(initialOwner)），
 *        更安全、更明确，方便由工厂合约/多签部署时指定真正的 owner。
 */
contract MyOwnable is Ownable {
    // 一个只有 owner 能修改的状态变量，用来演示权限控制
    uint256 public secretNumber;

    /**
     * @param initialOwner 初始所有者。想让部署者当 owner 就传 msg.sender。
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice onlyOwner 修饰器：非 owner 调用会 revert（OwnableUnauthorizedAccount 错误）
    function setSecret(uint256 newValue) public onlyOwner {
        secretNumber = newValue;
    }

    // Ownable 已内置以下能力，无需自己写：
    //   owner()                         → 查询当前 owner
    //   transferOwnership(newOwner)     → 转移所有权（onlyOwner）
    //   renounceOwnership()             → 放弃所有权（owner 变成 address(0)，权限永久锁死，慎用！）
}
