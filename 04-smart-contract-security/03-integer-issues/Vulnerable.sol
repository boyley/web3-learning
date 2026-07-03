// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⚠️ 仅供学习、请勿用于攻击真实合约。含已知漏洞，未经审计，勿上主网。
 *
 * ============================================================
 *  漏洞演示：整数溢出 / 下溢 与 unchecked 风险
 * ============================================================
 *
 * 背景：
 *   - Solidity 0.8.0 起，算术运算【默认带溢出检查】，溢出会自动 revert。
 *   - 但 0.8.0【之前】（如 0.6/0.7）默认不检查，溢出会"回绕"。
 *   - 0.8.0 之后仍可用 `unchecked { }` 显式关闭检查（为省 gas），
 *     一旦在 unchecked 块里算错，漏洞就回来了。
 *
 * 本文件用 unchecked 块【模拟】0.8 之前的溢出/下溢行为，方便演示。
 */
contract VulnerableToken {
    mapping(address => uint256) public balanceOf;
    uint8 public counter; // uint8 最大值 255，很容易溢出，用于演示

    constructor() {
        balanceOf[msg.sender] = 100;
    }

    /**
     * ❌ 下溢漏洞（Underflow）
     *
     * 若 balanceOf[msg.sender] = 0，转账 1 个：
     *   0 - 1 在 unchecked 下会回绕成 2^256 - 1（天文数字），
     *   攻击者凭空获得几乎无限的代币。
     *
     * 这里故意漏掉了 "require(balanceOf[msg.sender] >= amount)" 的检查，
     * 并用 unchecked 关闭了 0.8 的自动保护，重现经典的 batchOverflow / 下溢盗币。
     */
    function transfer(address to, uint256 amount) external {
        unchecked {
            balanceOf[msg.sender] -= amount; // 可能下溢成超大数
            balanceOf[to] += amount;
        }
    }

    /**
     * ❌ 上溢漏洞（Overflow）
     * counter 是 uint8，加到 256 会回绕成 0。
     */
    function increment(uint8 by) external {
        unchecked {
            counter += by; // 255 + 1 => 0
        }
    }

    /**
     * ❌ 乘法溢出（经典 batchOverflow，2018 年多个代币被无限增发）
     * numRecipients * amount 若溢出成一个很小的数，
     * require 检查（余额是否足够）就能被绕过。
     */
    function batchTransfer(address[] calldata recipients, uint256 amount) external {
        uint256 total;
        unchecked {
            total = recipients.length * amount; // ⚠️ 可能溢出成极小值
        }
        require(balanceOf[msg.sender] >= total, "insufficient"); // 被绕过
        unchecked {
            balanceOf[msg.sender] -= total;
            for (uint256 i = 0; i < recipients.length; i++) {
                balanceOf[recipients[i]] += amount; // 每人却拿到完整 amount
            }
        }
    }
}
