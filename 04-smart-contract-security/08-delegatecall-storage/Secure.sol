// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ✅ 修复版：安全的代理存储布局。教学用途，未经审计，勿上主网。
 *
 * 修复要点：
 *   1. 代理与逻辑合约【存储布局必须严格一致】，或采用
 *      "非结构化存储（unstructured storage）"把关键变量放到固定伪随机槽位，
 *      避开逻辑合约的普通变量槽 —— 这正是 EIP-1967 代理标准的做法。
 *   2. 逻辑合约不要在 slot 0/1 放会被业务函数写到的变量去撞代理的 owner/impl。
 *   3. 生产环境直接用 OpenZeppelin 的透明代理 / UUPS，别手写。
 *
 * 本文件用 EIP-1967 风格的固定槽位存放 owner 与 implementation 来演示修复。
 */
contract SecureProxy {
    // EIP-1967 规定的实现地址槽：keccak256("eip1967.proxy.implementation") - 1
    bytes32 private constant _IMPL_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    // 自定义的 admin 槽（同样用远离普通变量的固定伪随机槽位）
    bytes32 private constant _ADMIN_SLOT =
        0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

    constructor(address impl) {
        _setAddress(_ADMIN_SLOT, msg.sender);
        _setAddress(_IMPL_SLOT, impl);
    }

    function _getAddress(bytes32 slot) internal view returns (address a) {
        assembly { a := sload(slot) }
    }
    function _setAddress(bytes32 slot, address a) internal {
        assembly { sstore(slot, a) }
    }

    function admin() external view returns (address) { return _getAddress(_ADMIN_SLOT); }
    function implementation() external view returns (address) { return _getAddress(_IMPL_SLOT); }

    /// 只有 admin 能升级实现（受保护）
    function upgradeTo(address newImpl) external {
        require(msg.sender == _getAddress(_ADMIN_SLOT), "not admin");
        _setAddress(_IMPL_SLOT, newImpl);
    }

    /**
     * ✅ 因为 admin/impl 存在【固定伪随机槽】里，
     * 逻辑合约里普通变量（占 slot 0、1、2…）无论怎么写，
     * 都不可能撞到这些槽，owner 不会被逻辑函数意外覆盖。
     */
    fallback() external payable {
        address impl = _getAddress(_IMPL_SLOT);
        assembly {
            calldatacopy(0, 0, calldatasize())
            let ok := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch ok
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
    receive() external payable {}
}

/**
 * 与 SecureProxy 搭配的逻辑合约示例：它的普通变量从 slot 0 开始，
 * 但绝不会碰到 admin/impl 的固定伪随机槽，因此安全。
 */
contract LogicV1 {
    uint256 public value; // slot 0，安全，不撞代理关键槽

    function setValue(uint256 v) external {
        value = v;
    }
}
