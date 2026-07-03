// SPDX-License-Identifier: MIT
// ↑ 每个 .sol 文件第一行都应声明许可证标识符，否则编译器会告警。
pragma solidity ^0.8.28; // 指定兼容的编译器版本，与 hardhat.config.js 保持一致。

/**
 * @title Lock —— Hardhat 官方脚手架自带的“定时锁仓”示例合约
 * @notice 教学用途，未经审计，勿直接上主网。
 *
 * 作用：部署时存入一笔 ETH，并设定一个解锁时间戳；
 *       只有到达解锁时间后，且只有部署者（owner）才能把 ETH 取走。
 */
contract Lock {
    // 解锁时间（Unix 时间戳，秒）。public 会自动生成同名 getter。
    uint256 public unlockTime;
    // owner 用 payable 修饰，表示这个地址可以接收 ETH。
    address payable public owner;

    // 事件：取款时触发，方便前端 / 测试监听。indexed 便于按参数过滤。
    event Withdrawal(uint256 amount, uint256 when);

    /**
     * @param _unlockTime 解锁时间戳
     * 构造函数用 payable 修饰，才能在部署时随交易附带 ETH（msg.value）。
     */
    constructor(uint256 _unlockTime) payable {
        // require：条件不满足则回滚整笔交易并返回错误信息。
        require(
            block.timestamp < _unlockTime,
            "Unlock time should be in the future"
        );
        unlockTime = _unlockTime;
        owner = payable(msg.sender); // 把部署者记为 owner。
    }

    /// @notice 到期后由 owner 取走全部余额。
    function withdraw() public {
        // 两个前置检查：时间到了、调用者是 owner。
        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        require(msg.sender == owner, "You aren't the owner");

        emit Withdrawal(address(this).balance, block.timestamp);

        // 把合约全部余额转给 owner。
        owner.transfer(address(this).balance);
    }
}
