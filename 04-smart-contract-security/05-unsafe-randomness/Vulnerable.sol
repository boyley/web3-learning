// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⚠️ 仅供学习、请勿用于攻击真实合约。含已知漏洞，未经审计，勿上主网。
 *
 * ============================================================
 *  漏洞演示：不安全的链上随机数（Insecure Randomness）
 * ============================================================
 *
 * 一个"猜数字赢彩池"的游戏：猜中链上"随机数"就赢走全部奖池。
 *
 * 致命误区：用 block.timestamp / block.prevrandao / blockhash /
 * block.number / msg.sender 等【链上公开数据】做随机数。
 * 这些值对矿工/验证者、以及【同一区块内】的攻击者都是【已知或可预测】的：
 * 攻击者可以在自己的合约里用【完全相同的公式】先算出结果，
 * 只有算出必胜时才下注 —— 100% 稳赢。
 */
contract VulnerableLottery {
    constructor() payable {} // 部署时注入奖池

    receive() external payable {}

    /**
     * ❌ 漏洞点：伪随机数完全由链上公开变量决定。
     * 同一笔交易/同一区块内，任何人都能用同样的公式复现它。
     */
    function _badRandom() private view returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,   // ⚠️ 可被矿工小幅操纵、且对同区块交易已知
                    block.prevrandao,  // ⚠️ 同区块内对所有交易是同一个已知值
                    blockhash(block.number - 1), // ⚠️ 公开可查
                    msg.sender         // ⚠️ 攻击者自己知道
                )
            )
        ) % 100; // 0~99
    }

    /**
     * 猜中 _badRandom() 的结果就赢走整个奖池。
     * 因为攻击者能预先算出同样的值，稳赢。
     */
    function guess(uint256 number) external payable {
        require(msg.value == 0.01 ether, "ticket = 0.01 ETH");
        if (number == _badRandom()) {
            payable(msg.sender).transfer(address(this).balance);
        }
    }
}
