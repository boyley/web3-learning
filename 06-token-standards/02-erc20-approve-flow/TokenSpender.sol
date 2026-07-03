// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title approve + transferFrom 授权模型演示（教学用途）
 * @notice 本文件展示「授权模型」的两方：
 *         1) 一个极简 ERC-20（省注释版，完整版见 01 模块）；
 *         2) 一个 Spender（模拟 DEX / 质押池），它靠 transferFrom 主动「拉取」用户的币。
 *
 *         核心要理解：ERC-20 的 transfer 无法让合约「感知」到有人给它转了币，
 *         所以标准做法是——用户先 approve 授权，合约再 transferFrom 拉取。
 *
 *         ⚠️ 教学用途，未经审计，勿上主网。
 * 对照：EIP-20 https://eips.ethereum.org/EIPS/eip-20
 */

// ---- 极简 ERC-20（仅保留授权流程相关部分）----
contract MiniToken {
    string public name = "Mini Token";
    string public symbol = "MINI";
    uint8  public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        totalSupply = 1000 * 1e18;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "insufficient allowance"); // 授权不足直接失败
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - value;    // 扣减额度（无限授权则不扣）
        }
        require(balanceOf[from] >= value, "insufficient balance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }
}

// ---- Spender：模拟一个需要「拉取」用户代币的业务合约（如质押池）----
interface IERC20Minimal {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract StakingPool {
    IERC20Minimal public token;
    mapping(address => uint256) public staked; // 记录每个用户质押了多少

    constructor(address _token) {
        token = IERC20Minimal(_token);
    }

    /**
     * 用户质押：合约用 transferFrom 从用户账户「拉」走 amount 个币到本合约。
     * 前提：用户必须先在 token 合约上 approve(本合约地址, ≥amount)。
     * 如果没授权，这一步会因为 allowance 不足而 revert。
     */
    function stake(uint256 amount) external {
        // msg.sender = 用户；address(this) = 本质押合约
        bool ok = token.transferFrom(msg.sender, address(this), amount);
        require(ok, "transferFrom failed");
        staked[msg.sender] += amount;
    }
}
