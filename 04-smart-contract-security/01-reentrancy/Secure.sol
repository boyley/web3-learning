// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ✅ 修复版本：重入攻击的两种标准防御。
 *
 * 教学用途，未经审计，勿直接上主网。
 *
 * 防御手段一：Checks-Effects-Interactions（检查-生效-交互）顺序
 *   —— 永远先更新自己的状态，再做外部调用。
 * 防御手段二：ReentrancyGuard 互斥锁（nonReentrant 修饰器）
 *   —— 进入函数上锁，退出解锁，重入时直接 revert。
 *
 * 生产环境请直接使用 OpenZeppelin 的 ReentrancyGuard，此处手写仅为讲清原理。
 */
contract SecureBank {
    mapping(address => uint256) public balances;

    // ---- 手写的重入锁（等价于 OpenZeppelin ReentrancyGuard）----
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

    modifier nonReentrant() {
        // 若已经处于"进入中"状态，说明发生了重入，直接拒绝
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED; // 上锁
        _;
        _status = _NOT_ENTERED; // 解锁
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * ✅ 正确的提款函数
     *
     * 双重保险：
     *   1. nonReentrant 修饰器：即使逻辑写错，重入也会被锁拦下。
     *   2. Checks-Effects-Interactions 顺序：
     *        Checks      —— 检查余额
     *        Effects     —— 【先】把余额清零（关键！）
     *        Interaction —— 【后】才转账
     *      这样即便攻击合约在回调里重入，balances 已经是 0，检查过不了。
     */
    function withdraw(uint256 amount) external nonReentrant {
        // 1) Checks
        require(balances[msg.sender] >= amount, "insufficient balance");

        // 2) Effects：先更新状态（重入时这里已经生效，攻击失效）
        balances[msg.sender] -= amount;

        // 3) Interaction：最后才做外部调用
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
    }
}
