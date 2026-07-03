// SPDX-License-Identifier: MIT
// 教学用途，未经审计，勿直接上主网。
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyToken
 * @notice 继承 OpenZeppelin ERC20 快速发行一个同质化代币（可增发、可销毁）。
 * @dev ERC20 的转账、余额、授权（approve/transferFrom）等标准逻辑全部由 OZ 实现，
 *      你只需在构造函数里设定名称/符号/初始供应量即可。
 */
contract MyToken is ERC20, ERC20Burnable, Ownable {
    /**
     * @param initialOwner 初始所有者，同时接收初始供应量。
     */
    constructor(address initialOwner)
        ERC20("MyToken", "MTK") // 名称、符号；decimals 默认 18
        Ownable(initialOwner)
    {
        // 初始供应量 100 万枚（注意 * 10**decimals()，因为链上都用最小单位整数计算）
        _mint(initialOwner, 1_000_000 * 10 ** decimals());
    }

    /// @notice 只有 owner 能增发。若想固定总量，删掉本函数即可。
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // 提示：decimals 只影响「显示」，链上一切计算都是整数。
    // 想改成 6 位小数（像 USDC），可重写：
    //   function decimals() public pure override returns (uint8) { return 6; }
}
