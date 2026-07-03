// SPDX-License-Identifier: MIT
// 教学用途，未经审计，勿直接上主网。
//
// 这份合约是 OpenZeppelin Contracts Wizard（https://wizard.openzeppelin.com/）
// 勾选 ERC20 + Mintable + Burnable + Ownable 后自动生成的典型产物，
// 用来演示「Wizard 一键出码」到底长什么样。
pragma solidity ^0.8.20;

// 从 npm 包 @openzeppelin/contracts 直接 import（Remix 支持 npm import，无需本地安装）
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WizardToken
 * @notice 由 Contracts Wizard 生成：一个可增发（Mintable）、可销毁（Burnable）、
 *         带所有权（Ownable）的标准 ERC20 代币。
 * @dev 继承顺序体现「组合式（mixin）」思想：多个能力通过多继承拼装到一起。
 */
contract WizardToken is ERC20, ERC20Burnable, Ownable {
    /**
     * @param initialOwner 初始所有者地址。
     *        注意 v5 的 Ownable 构造函数强制要求显式传入 owner（不再默认 msg.sender）。
     */
    constructor(address initialOwner)
        ERC20("WizardToken", "WZT") // 代币名称、符号
        Ownable(initialOwner)       // v5 新签名：Ownable(initialOwner)
    {
        // 给初始所有者铸造 1000 枚（含 18 位小数）
        _mint(initialOwner, 1000 * 10 ** decimals());
    }

    /// @notice 只有 owner 能增发新代币。onlyOwner 来自 Ownable。
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    // 说明：burn() / burnFrom() 由 ERC20Burnable 提供，任何持币人都可销毁自己的代币。
}
