// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ✅ 修复版：正确的访问控制。教学用途，未经审计，勿直接上主网。
 *
 * 修复要点：
 *   1. 关键函数加 onlyOwner 修饰器。
 *   2. initialize 用 initialized 标志，保证"只能初始化一次"。
 *   3. 转移所有权用两步法（提名 + 接受），避免误转到无法控制的地址。
 *
 * 生产环境推荐直接继承 OpenZeppelin 的 Ownable / Ownable2Step / AccessControl。
 */
contract SecureVault {
    address public owner;
    address public pendingOwner; // 两步转移：待接受的新 owner
    bool private initialized;

    event OwnershipTransferStarted(address indexed from, address indexed to);
    event OwnershipTransferred(address indexed from, address indexed to);

    // ✅ 权限修饰器：只有 owner 能过
    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        initialized = true; // 普通合约在构造函数里就完成初始化
    }

    receive() external payable {}

    /// ✅ 只能初始化一次（用于代理/可升级场景，普通部署可不用）
    function initialize(address _owner) external {
        require(!initialized, "already initialized");
        require(_owner != address(0), "zero address");
        initialized = true;
        owner = _owner;
    }

    /// ✅ 两步转移所有权 —— 第一步：现任 owner 提名
    function transferOwnership(address newOwner) external onlyOwner {
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// ✅ 两步转移所有权 —— 第二步：新 owner 主动接受（防止转错地址）
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    /// ✅ 提款受 onlyOwner 保护
    function withdrawAll() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
