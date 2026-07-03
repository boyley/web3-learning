// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WETH —— Wrapped ETH（包装以太币）最小实现（教学用途）
 * @notice 原生 ETH 不是 ERC-20 代币，没有 approve/transferFrom 那套接口，
 *         很多 DeFi 合约（Uniswap 等）只认 ERC-20，处理原生 ETH 很麻烦。
 *         WETH 就是把 ETH「包装」成 1:1 兑换的 ERC-20：
 *           - deposit() / 直接转 ETH 进来  → 铸造等量 WETH（存 ETH 换凭证）
 *           - withdraw(amount)             → 销毁 WETH 取回等量 ETH（凭证换 ETH）
 *         合约里永远锁着与 WETH 总量等值的 ETH，保证随时可 1:1 赎回。
 *
 *         本实现对照主网经典的 WETH9 逻辑（darcy）。
 *         ⚠️ 教学用途，未经审计，勿上主网。生产直接用主网已部署的官方 WETH。
 */
contract WETH {
    string public name = "Wrapped Ether";
    string public symbol = "WETH";
    uint8 public decimals = 18;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // 标准 ERC-20 事件
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    // WETH 特有事件
    event Deposit(address indexed dst, uint256 value);   // 存 ETH → 得 WETH
    event Withdrawal(address indexed src, uint256 value); // 销 WETH → 取 ETH

    /// receive：直接给合约转 ETH（如钱包直接发送）也会自动 deposit
    receive() external payable {
        deposit();
    }

    /**
     * deposit：存入 ETH，铸造等量 WETH 给自己。
     * msg.value 是随交易发送的 ETH 数量（wei）。因为 WETH 与 ETH 都是 18 位小数，1:1 对应。
     */
    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;
        emit Transfer(address(0), msg.sender, msg.value); // 铸造：from = 0
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * withdraw：销毁自己 wad 个 WETH，把等量 ETH 退还给自己。
     */
    function withdraw(uint256 wad) public {
        require(balanceOf[msg.sender] >= wad, "WETH: insufficient balance");
        balanceOf[msg.sender] -= wad;
        emit Transfer(msg.sender, address(0), wad); // 销毁：to = 0
        emit Withdrawal(msg.sender, wad);
        // 把 ETH 转回用户。用 call 以兼容各种接收方。
        (bool ok, ) = payable(msg.sender).call{value: wad}("");
        require(ok, "WETH: ETH transfer failed");
    }

    /// 合约当前锁定的 ETH 总量 = WETH 总供应量（不变量）
    function totalSupply() public view returns (uint256) {
        return address(this).balance;
    }

    // ===== 标准 ERC-20 接口，让 WETH 能被任何 DeFi 合约当普通代币用 =====

    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) public returns (bool) {
        return transferFrom(msg.sender, to, value);
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "WETH: insufficient balance");

        // 若不是本人转账，需检查并扣减授权额度
        if (from != msg.sender && allowance[from][msg.sender] != type(uint256).max) {
            require(allowance[from][msg.sender] >= value, "WETH: insufficient allowance");
            allowance[from][msg.sender] -= value;
        }

        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }
}
