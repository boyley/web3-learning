// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⚠️ 仅供学习、请勿用于攻击真实合约。本合约【故意】埋了多个漏洞，
 * 用来练习跑 Slither / Mythril 等静态分析工具，看它们能否报出来。
 * 请勿部署到主网。
 *
 * ============================================================
 *  审计工具练习靶场（Audit Tools Practice Target）
 * ============================================================
 *
 * 故意埋下的问题（跑工具时对照检查它是否命中）：
 *   [1] 重入：withdraw 先转账后清账（对应模块 01）
 *   [2] 访问控制缺失：setOwner 无权限校验（模块 02）
 *   [3] tx.origin 鉴权（模块 04）
 *   [4] 弱随机数：block.timestamp 做随机（模块 05）
 *   [5] 未检查的低级调用返回值（模块 09）
 *   [6] 使用了已弃用/危险的 selfdestruct
 */
contract PracticeTarget {
    address public owner;
    mapping(address => uint256) public balances;

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // [1] 重入漏洞：先外部调用，后更新状态
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "insufficient");
        (bool ok, ) = msg.sender.call{value: amount}(""); // 先转账
        balances[msg.sender] -= amount;                    // 后清账（Slither 会报 reentrancy）
        ok; // 故意不检查（顺带触发 [5]）
    }

    // [2] 访问控制缺失：任何人都能改 owner
    function setOwner(address newOwner) external {
        owner = newOwner;
    }

    // [3] tx.origin 鉴权（Slither: tx-origin 检测）
    function adminTransfer(address payable to, uint256 amount) external {
        require(tx.origin == owner, "not owner");
        (bool ok, ) = to.call{value: amount}("");
        ok; // [5] 又一处未检查返回值
    }

    // [4] 弱随机数：用区块时间戳
    function luckyDraw() external view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp))) % 100;
    }

    // [6] 危险的 selfdestruct（EIP-6780 后语义变化，且常被误用）
    function kill() external {
        selfdestruct(payable(msg.sender)); // 无权限保护，任何人可摧毁
    }
}
