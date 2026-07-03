// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ✅ 修复版：始终检查外部调用返回值。教学用途，未经审计，勿上主网。
 *
 * 修复要点：
 *   1. 用 call 转账后【必须】 require(success)。
 *   2. 若单个失败不该阻断全局（批量场景），改用 Pull Payment（记账让用户自取）。
 *   3. 与 ERC20 交互用 SafeERC20（有些代币转账失败也返回 false 甚至不返回值）。
 */
contract SecureBank {
    mapping(address => uint256) public balances;
    mapping(address => uint256) public credits; // 批量场景：记账让用户自取

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    /**
     * ✅ 检查 call 返回值：失败就整体 revert，账本与资金保持一致。
     * （遵循 Checks-Effects-Interactions：先减余额，再转账。）
     */
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "insufficient");
        balances[msg.sender] -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed"); // ✅ 必须检查
    }

    /**
     * ✅ 批量发放改为"记账 + 用户自取"（Pull Payment），
     * 避免某个地址失败拖垮整批，也不会静默吞掉失败。
     */
    function allocate(address user, uint256 amount) external payable {
        // 简化演示：调用者随款项一起标记某用户可领额度
        require(msg.value == amount, "value mismatch");
        credits[user] += amount;
    }

    function claim() external {
        uint256 amount = credits[msg.sender];
        require(amount > 0, "nothing to claim");
        credits[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "claim failed"); // ✅ 检查
    }

    /**
     * ✅ 与任意合约做一般性 call 时，同样必须检查 success，
     * 并可根据需要解析 returndata。
     */
    function safeExternalCall(address target, bytes calldata data)
        external
        returns (bytes memory)
    {
        (bool ok, bytes memory ret) = target.call(data);
        require(ok, "external call failed"); // ✅
        return ret;
    }
}
