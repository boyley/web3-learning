// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⚠️ 仅供学习、请勿用于攻击真实合约。含已知漏洞，未经审计，勿上主网。
 *
 * ============================================================
 *  漏洞演示：抢跑 / 抢先交易（Front-Running / MEV）
 * ============================================================
 *
 * 场景：一个"提交答案领奖"的合约。第一个提交正确答案（原文）的人拿走奖池。
 *
 * 问题：交易在被打包前会先进入公开的内存池（mempool）。
 * 攻击者（或 MEV 机器人）盯着 mempool，一旦看到别人提交了正确答案（明文），
 * 就【复制这个答案】、【出更高 gas 费】抢先被矿工打包，把奖金抢走。
 *
 * 这类问题统称 MEV（Maximal Extractable Value）。常见形态：
 *   - 抢跑（front-running）：复制别人的盈利交易抢先执行。
 *   - 夹子攻击（sandwich）：在受害者的 DEX 兑换前后各插一笔，吃掉滑点。
 *   - 尾随（back-running）：紧跟某笔交易套利。
 */
contract VulnerableReward {
    bytes32 public answerHash; // 谜底的哈希（公开）
    address public owner;

    constructor(bytes32 _answerHash) payable {
        answerHash = _answerHash; // 部署时设定谜底哈希并注入奖池
        owner = msg.sender;
    }

    receive() external payable {}

    /**
     * ❌ 漏洞点：答案 answer 以【明文】作为交易参数提交。
     * 这笔交易在 mempool 里对所有人可见，
     * 抢跑者直接抄走 answer、抬高 gas，抢先拿奖。
     */
    function submit(string calldata answer) external {
        require(keccak256(abi.encodePacked(answer)) == answerHash, "wrong answer");
        payable(msg.sender).transfer(address(this).balance); // 先到先得
    }
}
