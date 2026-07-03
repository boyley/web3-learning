// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MyERC20 —— 手写最小 ERC-20 实现（教学用途）
 * @notice 本合约「从零手写」ERC-20 全部 6 个核心方法 + 2 个事件，
 *         目的是让你彻底看懂标准接口每一行在做什么。
 *
 *         ⚠️ 教学用途，未经审计，勿直接上主网。
 *         ✅ 生产环境请直接继承 OpenZeppelin 的 ERC20：
 *            import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
 *            contract MyToken is ERC20 { constructor() ERC20("MyToken","MTK"){ _mint(msg.sender, 1000e18); } }
 *
 * 对照官方标准：EIP-20  https://eips.ethereum.org/EIPS/eip-20
 */
contract MyERC20 {
    // ========= 元数据（EIP-20 中标记为 optional，但几乎所有代币都会实现）=========
    string public name;      // 代币全名，如 "My Token"
    string public symbol;    // 代币符号，如 "MTK"
    uint8  public decimals;  // 小数位数，通常为 18（1 个代币 = 10^18 个最小单位）

    // ========= 核心状态 =========
    // 总供应量。EIP-20: function totalSupply() public view returns (uint256)
    // 这里用 public 变量，Solidity 会自动生成同名 getter，等价于官方接口。
    uint256 public totalSupply;

    // 每个地址的余额。EIP-20: function balanceOf(address) public view returns (uint256)
    mapping(address => uint256) public balanceOf;

    // 授权额度：owner 允许 spender 花费多少。
    // EIP-20: function allowance(address _owner, address _spender) public view returns (uint256)
    // 注意嵌套 mapping 的读取顺序：allowance[owner][spender]
    mapping(address => mapping(address => uint256)) public allowance;

    // ========= 事件（EIP-20 强制要求，钱包/浏览器靠它索引转账记录）=========
    // 转账事件。铸造时 from = address(0)，销毁时 to = address(0)。
    event Transfer(address indexed from, address indexed to, uint256 value);
    // 授权事件。approve 成功时触发。
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @param _name    代币名
     * @param _symbol  代币符号
     * @param _initialSupply 初始供应量（以「代币」为单位，构造里会乘上 10^decimals）
     */
    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        decimals = 18;
        // 铸造初始供应量给部署者
        _mint(msg.sender, _initialSupply * 10 ** decimals);
    }

    // ============================================================
    //  transfer：调用者把自己的代币直接转给别人
    //  EIP-20: function transfer(address _to, uint256 _value) public returns (bool)
    // ============================================================
    function transfer(address _to, uint256 _value) public returns (bool) {
        _transfer(msg.sender, _to, _value);
        return true;
    }

    // ============================================================
    //  approve：授权 spender 可以从「我」的账户里花 _value 个代币
    //  EIP-20: function approve(address _spender, uint256 _value) public returns (bool)
    //  典型用途：授权 Uniswap/DEX 合约帮你转账（配合 transferFrom）。
    // ============================================================
    function approve(address _spender, uint256 _value) public returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    // ============================================================
    //  transferFrom：spender 代替 _from 把代币转给 _to（前提是 _from 事先 approve 过）
    //  EIP-20: function transferFrom(address _from, address _to, uint256 _value) public returns (bool)
    // ============================================================
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        uint256 allowed = allowance[_from][msg.sender];
        // 检查授权额度是否足够
        require(allowed >= _value, "ERC20: insufficient allowance");
        // 如果不是「无限授权」(type(uint256).max)，则扣减额度
        if (allowed != type(uint256).max) {
            allowance[_from][msg.sender] = allowed - _value;
        }
        _transfer(_from, _to, _value);
        return true;
    }

    // ========================= 内部工具函数 =========================

    /// @dev 真正执行余额变更的地方，被 transfer / transferFrom 复用
    function _transfer(address _from, address _to, uint256 _value) internal {
        require(_from != address(0), "ERC20: transfer from zero address");
        require(_to != address(0), "ERC20: transfer to zero address");
        require(balanceOf[_from] >= _value, "ERC20: transfer amount exceeds balance");

        // 0.8.x 内置溢出检查，减法/加法出问题会自动 revert，无需 SafeMath
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(_from, _to, _value);
    }

    /// @dev 铸造：凭空产生代币（from = 零地址），增加总供应
    function _mint(address _to, uint256 _value) internal {
        require(_to != address(0), "ERC20: mint to zero address");
        totalSupply += _value;
        balanceOf[_to] += _value;
        emit Transfer(address(0), _to, _value);
    }
}
