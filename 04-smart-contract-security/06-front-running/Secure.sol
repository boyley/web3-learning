// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ✅ 修复版：用 Commit-Reveal（提交-揭示）抵御抢跑。
 * 教学用途，未经审计，勿上主网。
 *
 * 思路：把"秘密"和"提交时刻"分开。
 *   1. Commit：用户先提交 keccak256(answer, msg.sender, salt) 的哈希。
 *      —— mempool 里只看得到哈希，抢跑者抄不到真正的答案，
 *         而且哈希绑定了 msg.sender，别人抄了也没用。
 *   2. Reveal：过了绑定窗口后，用户揭示明文答案与 salt。
 *      —— 此时排名由"谁先 commit"决定，抢跑失去意义。
 *
 * 其他缓解手段（见 README）：
 *   - 对价格类操作设置 minAmountOut / deadline（滑点保护）抵御夹子攻击。
 *   - 走私有内存池 / 交易顺序保护（如 Flashbots Protect）。
 */
contract SecureReward {
    bytes32 public answerHash;
    address public owner;
    bool public solved;

    struct Commit {
        bytes32 hash;
        uint256 blockNum;
    }
    mapping(address => Commit) public commits;
    uint256 public constant REVEAL_DELAY = 3; // commit 后至少等 3 个区块

    constructor(bytes32 _answerHash) payable {
        answerHash = _answerHash;
        owner = msg.sender;
    }

    receive() external payable {}

    /**
     * 第一步：提交承诺。哈希里绑定了 msg.sender，
     * 即使抢跑者从 mempool 抄走这个哈希原样提交，
     * 揭示时 msg.sender 对不上，也无法领奖。
     */
    function commit(bytes32 commitHash) external {
        commits[msg.sender] = Commit(commitHash, block.number);
    }

    /**
     * 第二步：揭示明文答案。
     * 校验：① 达到揭示延迟；② 承诺哈希匹配（含 msg.sender、salt）；
     *       ③ 答案本身正确。
     */
    function reveal(string calldata answer, bytes32 salt) external {
        require(!solved, "already solved");
        Commit memory c = commits[msg.sender];
        require(c.hash != bytes32(0), "no commit");
        require(block.number >= c.blockNum + REVEAL_DELAY, "reveal too early");

        // 承诺必须由本人在 commit 阶段生成（绑定 msg.sender + salt）
        require(
            keccak256(abi.encodePacked(answer, msg.sender, salt)) == c.hash,
            "commit mismatch"
        );
        // 答案本身要对
        require(keccak256(abi.encodePacked(answer)) == answerHash, "wrong answer");

        solved = true;
        payable(msg.sender).transfer(address(this).balance);
    }

    /// 辅助：链下计算承诺哈希用（前端可调用 view 版本，或纯链下算）
    function computeCommit(
        string calldata answer,
        address sender,
        bytes32 salt
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(answer, sender, salt));
    }
}
