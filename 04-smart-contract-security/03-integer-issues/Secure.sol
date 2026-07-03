// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ✅ 修复版：整数安全。教学用途，未经审计，勿直接上主网。
 *
 * 修复要点：
 *   1. 使用 Solidity ≥ 0.8：算术默认带溢出检查，溢出/下溢自动 revert。
 *   2. 不要在有资金语义的地方滥用 unchecked。
 *   3. 补齐业务前置检查（余额是否足够），逻辑与语言保护双保险。
 *   4. 若用 0.8 之前的老版本，必须引入 SafeMath 库。
 */
contract SecureToken {
    mapping(address => uint256) public balanceOf;
    uint8 public counter;

    constructor() {
        balanceOf[msg.sender] = 100;
    }

    /**
     * ✅ 正常写法：不使用 unchecked。
     * 若 amount 超过余额，balanceOf[msg.sender] -= amount 会因下溢自动 revert；
     * 再加一道显式 require 让报错信息更清晰。
     */
    function transfer(address to, uint256 amount) external {
        require(to != address(0), "zero address");
        require(balanceOf[msg.sender] >= amount, "insufficient balance");
        balanceOf[msg.sender] -= amount; // 0.8 会自动检查下溢
        balanceOf[to] += amount;         // 0.8 会自动检查上溢
    }

    /// ✅ uint8 加法：溢出（>255）会自动 revert
    function increment(uint8 by) external {
        counter += by;
    }

    /**
     * ✅ 批量转账：乘法在 0.8 下溢出会自动 revert，
     * 因此 total 一定是真实总额，require 无法被绕过。
     */
    function batchTransfer(address[] calldata recipients, uint256 amount) external {
        uint256 total = recipients.length * amount; // 溢出会 revert
        require(balanceOf[msg.sender] >= total, "insufficient");
        balanceOf[msg.sender] -= total;
        for (uint256 i = 0; i < recipients.length; i++) {
            balanceOf[recipients[i]] += amount;
        }
    }

    /**
     * ℹ️ 什么时候可以安全地用 unchecked？
     * 只有当你能【数学证明】不可能溢出时，才用它省 gas。
     * 典型：for 循环里 i++（i 上界受数组长度限制，远小于 2^256）。
     */
    function safeLoopSum(uint256[] calldata arr) external pure returns (uint256 sum) {
        for (uint256 i = 0; i < arr.length; ) {
            sum += arr[i];            // sum 仍受默认检查保护
            unchecked { ++i; }         // i 不可能溢出，安全地省 gas
        }
    }
}
