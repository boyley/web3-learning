// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ✅ 修复版：用 msg.sender 做身份校验。教学用途，未经审计，勿上主网。
 *
 * 核心修复：把 tx.origin 换成 msg.sender。
 * 这样"直接调用者"必须本人就是 owner；
 * 如果中间夹了一个恶意合约，msg.sender 会是那个合约，检查失败。
 */
contract SecureWallet {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

    modifier onlyOwner() {
        // ✅ 用 msg.sender：谁"直接"调用我，就必须是 owner
        require(msg.sender == owner, "not owner");
        _;
    }

    function transfer(address payable to, uint256 amount) external onlyOwner {
        to.transfer(amount);
    }
}
