// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⚠️ 仅供学习、请勿用于攻击真实合约。本合约含有已知漏洞，未经审计，禁止上主网。
 *
 * ============================================================
 *  漏洞演示：重入攻击（Reentrancy）—— 有漏洞版本
 * ============================================================
 *
 * 这是一个最简单的"银行"合约：用户可以存款、查询余额、提款。
 * 漏洞出在 withdraw()：它在【更新余额之前】就把 ETH 转给了调用者。
 *
 * 攻击原理：
 *   当 withdraw 用 call 把 ETH 打给一个"合约地址"时，会触发该合约的
 *   receive()/fallback() 回调。恶意合约在回调里【再次调用 withdraw】，
 *   此时本合约的 balances[attacker] 还没被清零，检查依然通过，
 *   于是可以递归地把整个合约的 ETH 全部提走。
 *
 * 这就是历史上著名的 The DAO 事件（2016 年，损失约 360 万 ETH，
 * 直接导致以太坊硬分叉出 ETH / ETC）的核心成因。
 */
contract VulnerableBank {
    // 记录每个地址的存款余额
    mapping(address => uint256) public balances;

    /// 存款：把 msg.value 记到调用者名下
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    /// 查询本合约总余额（用于观察被掏空的过程）
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * ❌ 有漏洞的提款函数
     *
     * 执行顺序（错误）：
     *   1. Checks   —— 检查余额是否足够          ✅ 有做
     *   2. Interaction —— 先把钱转出去（外部调用）  ⚠️ 危险：触发回调
     *   3. Effects  —— 最后才把余额清零           ❌ 太晚了
     *
     * 因为"交互"发生在"更新状态"之前，攻击者能在回调里重入本函数，
     * 此时第 1 步的检查用的仍是【尚未清零】的旧余额，检查会一直通过。
     */
    function withdraw(uint256 amount) external {
        // 1) Checks：检查
        require(balances[msg.sender] >= amount, "insufficient balance");

        // 2) Interaction：外部调用（⚠️ 漏洞点！这里会回调到攻击合约）
        //    call 会把剩余 gas 全部转发，足以让攻击合约继续执行 withdraw
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");

        // 3) Effects：更新状态（❌ 太晚：重入发生在这一行执行之前）
        balances[msg.sender] -= amount;
    }
}
