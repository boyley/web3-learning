// SPDX-License-Identifier: MIT
// 教学用途，未经审计，勿直接上主网。
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MyVault
 * @notice 一个可存取 ETH 的简单金库，演示如何用 ReentrancyGuard 防「重入攻击」。
 * @dev 重入攻击：withdraw 用 call 给外部地址转账时，会把控制权交给对方；
 *      若此时余额还没清零，恶意合约的 receive() 就能反复回调 withdraw，把金库掏空。
 *      两道防线：
 *        1) nonReentrant 修饰器（来自 ReentrancyGuard）——加一把锁，函数执行期间禁止再次进入。
 *        2) Checks-Effects-Interactions 顺序——先改状态（清零），最后才转账。
 */
contract MyVault is ReentrancyGuard {
    mapping(address => uint256) private _balances;

    /// @notice 存入 ETH
    function deposit() external payable {
        _balances[msg.sender] += msg.value;
    }

    /// @notice 提走自己全部余额。nonReentrant 保证同一时刻只能进入一次。
    function withdraw() external nonReentrant {
        uint256 amount = _balances[msg.sender];
        require(amount > 0, "no balance");

        // Effects：先清零（即使没有锁，这一步也能挡住大部分重入）
        _balances[msg.sender] = 0;

        // Interactions：最后才与外部交互
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
}
