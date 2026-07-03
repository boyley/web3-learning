// SPDX-License-Identifier: MIT
// 教学用途，未经审计，勿直接上主网。
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MyAccessControl
 * @notice 演示基于角色的访问控制（RBAC）。
 *         Ownable 只有「一个」管理员；AccessControl 允许「多种角色 + 多个成员」，
 *         比如 MINTER_ROLE 可以有很多铸币者，BURNER_ROLE 可以有很多销毁者。
 */
contract MyAccessControl is AccessControl {
    // 角色用 bytes32 常量表示，惯例是 keccak256("角色名")
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    uint256 public totalMinted;
    uint256 public totalBurned;

    /**
     * @param admin 超级管理员。授予 DEFAULT_ADMIN_ROLE，
     *              该角色是所有角色的「管理员角色」，能 grantRole / revokeRole 任何角色。
     */
    constructor(address admin) {
        // DEFAULT_ADMIN_ROLE 是 AccessControl 内置常量（值为 bytes32(0)）
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        // 也可以顺手把 admin 设为初始 minter
        _grantRole(MINTER_ROLE, admin);
    }

    /// @notice 只有持有 MINTER_ROLE 的地址能调用。onlyRole 来自 AccessControl。
    function mint(uint256 amount) public onlyRole(MINTER_ROLE) {
        totalMinted += amount;
    }

    /// @notice 只有持有 BURNER_ROLE 的地址能调用。
    function burn(uint256 amount) public onlyRole(BURNER_ROLE) {
        totalBurned += amount;
    }

    // AccessControl 已内置以下能力（默认由 DEFAULT_ADMIN_ROLE 调用）：
    //   grantRole(role, account)   → 授予角色
    //   revokeRole(role, account)  → 撤销角色
    //   renounceRole(role, self)   → 自己放弃某角色
    //   hasRole(role, account)     → 查询是否拥有角色
    //   getRoleAdmin(role)         → 查询某角色的管理员角色
}
