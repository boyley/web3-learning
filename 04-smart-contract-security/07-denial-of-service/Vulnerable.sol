// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⚠️ 仅供学习、请勿用于攻击真实合约。含已知漏洞，未经审计，勿上主网。
 *
 * ============================================================
 *  漏洞演示：拒绝服务（Denial of Service, DoS）
 * ============================================================
 *
 * 演示两类经典 DoS：
 *   A. revert 型 DoS —— "push 支付"依赖对方能收款，
 *      一个恶意参与者拒收，就卡死所有人的流程。
 *   B. 无界循环 / gas 耗尽型 DoS —— 遍历一个可无限增长的数组，
 *      数组太大时循环耗尽区块 gas 上限，函数永远无法执行成功。
 */

// -------- A. revert 型 DoS：King of the Hill 游戏 --------
contract VulnerableKing {
    address public king;
    uint256 public prize;

    receive() external payable {
        require(msg.value > prize, "pay more than current king");

        // ❌ 漏洞点：用 push 方式把钱退还给上一个 king。
        // 如果上一个 king 是一个"拒绝收款"的恶意合约（receive 里 revert），
        // 这一行会一直失败，导致【没有人能再成为新 king】，游戏被永久卡死。
        if (king != address(0)) {
            payable(king).transfer(prize); // 退款给旧王
        }
        king = msg.sender;
        prize = msg.value;
    }
}

// -------- B. 无界循环型 DoS：给所有人平分奖励 --------
contract VulnerableDistributor {
    address[] public participants; // 可被无限灌入地址

    function join() external {
        participants.push(msg.sender); // 谁都能加入，甚至刷很多地址
    }

    /**
     * ❌ 漏洞点：一次性遍历整个 participants 数组转账。
     * 当参与者足够多（攻击者可用脚本灌入成千上万地址），
     * 循环消耗的 gas 超过区块 gas 上限，这个函数【永远无法成功执行】，
     * 资金被锁死。
     */
    function distribute() external payable {
        uint256 share = msg.value / participants.length;
        for (uint256 i = 0; i < participants.length; i++) {
            payable(participants[i]).transfer(share); // 无界循环 + push 支付
        }
    }
}
