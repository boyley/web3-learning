// SPDX-License-Identifier: MIT
// 教学用途，未经审计，勿直接上主网。
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MySafeTransfer
 * @notice 演示 SafeERC20：安全地与「不规范的 ERC20 代币」打交道。
 * @dev 问题背景：ERC20 标准要求 transfer/approve 返回 bool，但历史上很多代币
 *      （如老版 USDT）要么不返回值、要么失败时不 revert 而返回 false。
 *      直接调用 token.transfer(...) 可能「悄悄失败」却被当成成功，酿成资损。
 *      SafeERC20 用 safeTransfer / safeTransferFrom 包装：
 *        - 兼容「不返回值」的代币；
 *        - 一旦返回 false 或调用失败，立即 revert，绝不静默失败。
 */
contract MySafeTransfer {
    // 给 IERC20 类型「附加」SafeERC20 的方法，之后可写 token.safeTransfer(...)
    using SafeERC20 for IERC20;

    /// @notice 从 from 把代币安全地拉进本合约（需 from 提前 approve 本合约）
    function pull(IERC20 token, address from, uint256 amount) external {
        token.safeTransferFrom(from, address(this), amount);
    }

    /// @notice 把本合约里的代币安全地转给 to
    function push(IERC20 token, address to, uint256 amount) external {
        token.safeTransfer(to, amount);
    }

    /// @notice 安全设置授权额度。forceApprove 能兼容「必须先清零再设新值」的代币（如 USDT）。
    function approveSpender(IERC20 token, address spender, uint256 amount) external {
        token.forceApprove(spender, amount);
    }
}
