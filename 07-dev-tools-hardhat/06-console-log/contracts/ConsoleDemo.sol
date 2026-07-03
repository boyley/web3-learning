// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// ★ 关键：从 hardhat 引入 console，就能在合约里像 JS 一样打印日志！
//   仅在 Hardhat Network 上生效，纯本地调试用，不影响真实部署逻辑。
import "hardhat/console.sol";

/**
 * @title ConsoleDemo —— 演示在 Solidity 里用 console.log 调试
 * @notice 教学用途，未经审计，勿上主网（上主网前务必删掉 console 引入）。
 */
contract ConsoleDemo {
    mapping(address => uint256) public balances;

    constructor() {
        // 部署时给自己发点初始额度
        balances[msg.sender] = 1000;
    }

    function transfer(address to, uint256 amount) external {
        // console.log 支持多种类型与占位符 %s / %d，超方便定位问题。
        // ★ 注意：Solidity 字符串字面量里若含【非 ASCII 字符（如中文）】，
        //   必须写成 unicode"..." 形式，否则编译器报 “Invalid character in string”。
        console.log(unicode"transfer 调用者:", msg.sender);
        console.log(unicode"转给:", to, unicode" 数量:", amount);
        console.log(unicode"转账前 - 我的余额:", balances[msg.sender]);

        require(balances[msg.sender] >= amount, "Not enough balance");

        balances[msg.sender] -= amount;
        balances[to] += amount;

        // 也可以用格式化占位符 %s
        console.log(unicode"转账后 - 我的余额: %s, 对方余额: %s", balances[msg.sender], balances[to]);
    }
}
