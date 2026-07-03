// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⚠️ 仅供学习、请勿用于攻击真实合约。含已知漏洞，未经审计，勿上主网。
 *
 * ============================================================
 *  漏洞演示：权限缺失 / 访问控制失效（Access Control）
 * ============================================================
 *
 * 一个简单的金库合约。owner 本应是唯一能提取全部资金、
 * 转移所有权、以及自毁的人。但下面几个"关键函数"忘了加权限校验，
 * 任何人都能调用 —— 这类漏洞极其常见（Parity 多签、无数被盗合约）。
 */
contract VulnerableVault {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

    /**
     * ❌ 漏洞点 1：本应只有 owner 能改所有权，却没有任何检查。
     * 任何人调用它就能把自己设为 owner，从而夺取整个合约。
     */
    function setOwner(address newOwner) external {
        owner = newOwner; // 谁都能改！
    }

    /**
     * ❌ 漏洞点 2：提走全部资金的函数没有 onlyOwner。
     * 任何人都能把金库里的 ETH 全部转给自己。
     */
    function withdrawAll() external {
        payable(msg.sender).transfer(address(this).balance);
    }

    /**
     * ❌ 漏洞点 3：初始化函数可被重复调用（未加"只初始化一次"保护）。
     * 在可升级/代理合约里，这等价于"任何人都能重新夺取 owner"。
     */
    function initialize(address _owner) external {
        owner = _owner;
    }
}
