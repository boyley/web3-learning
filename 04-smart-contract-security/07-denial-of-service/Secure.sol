// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ✅ 修复版：用 Pull Payment（拉取支付）+ 分页处理消除 DoS。
 * 教学用途，未经审计，勿上主网。
 *
 * 核心原则：不要在一笔交易里"主动 push 给别人"（可能 revert 卡死全局），
 * 而是记账，让每个人【自己来 pull（withdraw）】自己的份额。
 * 一个人拒收，只影响他自己，不影响其他所有人。
 */

// -------- A. revert 型修复：Pull Payment 版 King --------
contract SecureKing {
    address public king;
    uint256 public prize;
    mapping(address => uint256) public pendingWithdrawals; // 应退款记账

    receive() external payable {
        require(msg.value > prize, "pay more than current king");

        // ✅ 不直接转给旧王，而是记账，让旧王自己来取。
        // 旧王即使是恶意合约拒收，也只是他自己取不到，不影响新王登基。
        if (king != address(0)) {
            pendingWithdrawals[king] += prize;
        }
        king = msg.sender;
        prize = msg.value;
    }

    /// ✅ 旧王主动来"拉取"自己的退款（Checks-Effects-Interactions）
    function withdraw() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "nothing to withdraw");
        pendingWithdrawals[msg.sender] = 0; // 先清零
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "withdraw failed");
    }
}

// -------- B. 无界循环型修复：记账 + 用户各自领取 --------
contract SecureDistributor {
    mapping(address => uint256) public shares; // 每人应得份额
    address public owner;

    constructor() { owner = msg.sender; }

    /**
     * ✅ 分配时只【记账】，不循环转账。O(1) 操作，永不 gas 超限。
     * （此处示范：owner 存入并指定某人的份额；真实场景按业务计算。）
     */
    function allocate(address user) external payable {
        require(msg.sender == owner, "only owner");
        shares[user] += msg.value;
    }

    /// ✅ 每个用户自己来领，一个人的失败不影响其他人
    function claim() external {
        uint256 amount = shares[msg.sender];
        require(amount > 0, "no share");
        shares[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "claim failed");
    }
}
