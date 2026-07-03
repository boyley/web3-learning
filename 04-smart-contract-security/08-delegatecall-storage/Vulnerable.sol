// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⚠️ 仅供学习、请勿用于攻击真实合约。含已知漏洞，未经审计，勿上主网。
 *
 * ============================================================
 *  漏洞演示：delegatecall 存储冲突 / 代理风险
 * ============================================================
 *
 * delegatecall 的语义：
 *   A.delegatecall(B) 会【借用 B 的代码，但操作 A 的存储、A 的 msg.sender、A 的余额】。
 *   也就是"用别人的逻辑，改自己的家"。代理（Proxy）模式正是靠它实现可升级。
 *
 * 危险来源：存储是按【槽位 slot 序号】对齐的，不是按变量名。
 *   如果 Proxy 和被调用的 Library/Logic 的存储布局【顺序不一致】，
 *   Library 里对"第 1 个变量"的写入，会落到 Proxy 的"第 1 个槽位"上，
 *   哪怕它们变量名/含义完全不同 —— 造成存储冲突，改乱关键变量（如 owner）。
 *
 * 这正是 2017 年 Parity 多签钱包被永久冻结约 51 万 ETH 的核心机理之一。
 */

/**
 * 一个"逻辑库"合约。它以为自己的第 0 号存储槽是 lib（无关紧要）。
 */
contract Lib {
    address public lib; // slot 0（在 Lib 自己看来）

    // 本意：设置某个库地址。但通过 delegatecall 调用时，
    // 它写的是【调用方的 slot 0】。
    function setLib(address _lib) external {
        lib = _lib; // 写入 delegatecall 调用方的 slot 0
    }
}

/**
 * ❌ 有漏洞的代理合约。
 * 它的 slot 0 是 owner（关键权限变量），
 * 但 fallback 里把所有调用 delegatecall 给 Lib。
 *
 * 攻击者调用 setLib(攻击者地址) →
 *   Lib.setLib 通过 delegatecall 写入本合约 slot 0 →
 *   本合约的 owner 被改成攻击者！
 */
contract VulnerableProxy {
    address public owner; // slot 0 ⚠️ 与 Lib.lib 撞在同一个槽
    address public libAddress; // slot 1

    constructor(address _lib) {
        owner = msg.sender;
        libAddress = _lib;
    }

    // 把未知调用 delegatecall 给逻辑库（简化版代理）
    fallback() external payable {
        (bool ok, ) = libAddress.delegatecall(msg.data);
        require(ok, "delegatecall failed");
    }

    // 只有 owner 能执行的"敏感操作"（演示：一旦 owner 被夺，这里就沦陷）
    function onlyOwnerAction() external view returns (string memory) {
        require(msg.sender == owner, "not owner");
        return "sensitive action executed";
    }
}
