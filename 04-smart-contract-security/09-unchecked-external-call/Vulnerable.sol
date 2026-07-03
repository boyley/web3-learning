// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⚠️ 仅供学习、请勿用于攻击真实合约。含已知漏洞，未经审计，勿上主网。
 *
 * ============================================================
 *  漏洞演示：未检查的低级外部调用返回值（Unchecked Call Return）
 * ============================================================
 *
 * 关键背景：低级调用 call / send 在失败时【不会 revert】，
 * 而是【返回 false】。如果你不检查这个返回值，
 * 合约会"以为转账成功了"继续往下走，导致账本与实际资金不一致。
 *
 * 对比：
 *   - address.transfer(x)  失败会自动 revert（但只给 2300 gas，另有问题）
 *   - address.send(x)      失败返回 false（不 revert）—— 必须检查
 *   - address.call{value:x}("")  失败返回 (false, data)（不 revert）—— 必须检查
 */
contract VulnerableBank {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    /**
     * ❌ 漏洞点 1：用 send 但不检查返回值。
     * 若对方是拒收合约，send 返回 false，转账没发生，
     * 但下面照样把余额清零 —— 用户的钱凭空消失（账本减了，钱没出去）。
     */
    function withdrawBad(uint256 amount) external {
        require(balances[msg.sender] >= amount, "insufficient");
        balances[msg.sender] -= amount;
        msg.sender.call{value: amount}(""); // ❌ 返回值被完全忽略
    }

    /**
     * ❌ 漏洞点 2：批量给一组地址发钱，用 send 且不检查。
     * 中间某个地址转账失败被静默吞掉，
     * 合约却当作全部成功，造成资金/账目错乱。
     */
    function payoutBad(address payable[] calldata to, uint256 each) external {
        for (uint256 i = 0; i < to.length; i++) {
            to[i].send(each); // ❌ 返回值没检查，失败被无视
        }
    }
}
