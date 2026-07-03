// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⚠️ 仅供学习、请勿用于攻击真实合约。含已知漏洞，未经审计，勿上主网。
 *
 * ============================================================
 *  漏洞演示：tx.origin 钓鱼（Phishing with tx.origin）
 * ============================================================
 *
 * 关键区别：
 *   - tx.origin  = 发起整条交易的最初 EOA（外部账户），调用链再长也不变。
 *   - msg.sender = 当前这次调用的【直接】调用者，可能是合约。
 *
 * 用 tx.origin 做身份校验的隐患：
 *   owner 被诱导去调用一个恶意合约的普通函数（比如领空投），
 *   恶意合约在内部转手调用本金库的 transfer()。
 *   此时对本金库来说：
 *       msg.sender = 恶意合约（不是 owner）
 *       tx.origin  = owner（因为交易是 owner 发起的）
 *   于是 require(tx.origin == owner) 竟然通过了 —— 资金被盗。
 */
contract VulnerableWallet {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

    /**
     * ❌ 漏洞点：用 tx.origin 校验身份。
     * 只要"最初发起交易的人"是 owner 就放行，
     * 完全不管中间是不是经过了恶意合约。
     */
    function transfer(address payable to, uint256 amount) external {
        require(tx.origin == owner, "not owner"); // ⚠️ 危险
        to.transfer(amount);
    }
}
