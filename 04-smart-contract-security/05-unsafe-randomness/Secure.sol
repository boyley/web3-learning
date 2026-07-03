// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ✅ 修复版：安全随机数的两条正路。教学用途，未经审计，勿上主网。
 *
 * 链上没有真正安全的"本地随机数"。正确做法只有两类：
 *
 *  方案 A：Chainlink VRF（可验证随机函数）—— 生产首选
 *     由预言机网络在链下生成随机数 + 密码学证明，
 *     链上验证证明后再使用，谁也无法预测或篡改。
 *     （本文件用接口示意，真实使用需继承 VRFConsumerBaseV2Plus 并配置订阅。）
 *
 *  方案 B：Commit-Reveal（提交-揭示）—— 无预言机时的自建方案
 *     用户先提交 hash(秘密+盐)，若干区块后再揭示秘密，
 *     用多方揭示的秘密混合成随机数。下注时无人知道最终结果。
 *
 * 本合约给出 Commit-Reveal 的最小骨架，并附 VRF 的接口示意。
 */

// ---- 方案 A：Chainlink VRF 接口示意（仅示范，非完整实现）----
interface IVRFCoordinator {
    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId);
}

/**
 * ✅ 方案 B：Commit-Reveal 抽奖骨架
 */
contract SecureLotteryCommitReveal {
    struct Commitment {
        bytes32 commit;   // keccak256(secret, salt)
        uint256 blockNum; // 提交时的区块号
        bool revealed;
    }

    mapping(address => Commitment) public commitments;
    uint256 public constant REVEAL_DELAY = 5; // 至少等 5 个区块再揭示

    /// 第一步：提交承诺（此时谁都不知道秘密，无法预测）
    function commit(bytes32 hashed) external payable {
        require(msg.value == 0.01 ether, "ticket = 0.01 ETH");
        commitments[msg.sender] = Commitment(hashed, block.number, false);
    }

    /**
     * 第二步：若干区块后揭示。
     * 随机源 = 用户秘密 + 一个"提交时无法预知"的未来区块哈希，
     * 两者都不在攻击者的掌控之内。
     */
    function reveal(uint256 secret, bytes32 salt) external returns (uint256 rand) {
        Commitment storage c = commitments[msg.sender];
        require(!c.revealed, "already revealed");
        require(block.number > c.blockNum + REVEAL_DELAY, "reveal too early");
        require(
            keccak256(abi.encodePacked(secret, salt)) == c.commit,
            "commit mismatch"
        );
        c.revealed = true;

        // 混合：用户秘密 + 提交之后才产生的区块哈希（提交时不可知）
        bytes32 futureHash = blockhash(c.blockNum + REVEAL_DELAY);
        rand = uint256(keccak256(abi.encodePacked(secret, futureHash))) % 100;
        // ... 依 rand 结算奖池（略）
    }
}
