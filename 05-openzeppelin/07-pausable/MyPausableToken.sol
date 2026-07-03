// SPDX-License-Identifier: MIT
// 教学用途，未经审计，勿直接上主网。
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyPausableToken
 * @notice 演示「可暂停」机制：出现漏洞/被攻击时，管理员能一键冻结转账，止损。
 * @dev v5 中 Pausable 已从 security/ 移动到 utils/；
 *      ERC20Pausable 内部就继承了 Pausable，暂停时所有转账（含 mint/burn）都会 revert。
 */
contract MyPausableToken is ERC20, ERC20Pausable, Ownable {
    constructor(address initialOwner)
        ERC20("PausableToken", "PST")
        Ownable(initialOwner)
    {
        _mint(initialOwner, 1000 * 10 ** decimals());
    }

    /// @notice 暂停：之后任何转账都会失败。_pause() 来自 Pausable。
    function pause() public onlyOwner {
        _pause();
    }

    /// @notice 恢复：解除暂停。
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev 多继承冲突解决：ERC20 和 ERC20Pausable 都定义了 _update，
     *      必须显式重写并用 override(ERC20, ERC20Pausable) 标注，
     *      再用 super._update 串联调用链（Pausable 的暂停检查就在这条链里生效）。
     *      —— 这是 v5「钩子统一到 _update」后的标准写法。
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
