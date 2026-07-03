// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ERC20Permit —— 手写 EIP-2612 permit「签名授权」实现（教学用途）
 * @notice 传统 approve 需要用户先发一笔链上交易（花 gas）才能授权。
 *         EIP-2612 让用户改为「链下签一个名」，把签名 (v,r,s) 交给别人/合约，
 *         由后者调用 permit() 一次性完成授权，用户自己无需先发 approve 交易。
 *         这就是很多 DApp「一步授权+操作」的底层原理。
 *
 *         ⚠️ 教学用途，未经审计，勿上主网。
 *         ✅ 生产用 OpenZeppelin：
 *            import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
 *
 * 对照官方标准：EIP-2612 https://eips.ethereum.org/EIPS/eip-2612
 *              EIP-712  https://eips.ethereum.org/EIPS/eip-712
 */
contract ERC20Permit {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // EIP-2612: 每个 owner 一个自增 nonce，用于防止签名被重放
    mapping(address => uint256) public nonces;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // ===== EIP-712 / EIP-2612 类型哈希（字符串必须与标准逐字节一致）=====
    bytes32 public constant PERMIT_TYPEHASH =
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 private constant EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    // 缓存构造时的链 id 与域分隔符，用于检测分叉后重算
    uint256 private immutable _CACHED_CHAIN_ID;
    bytes32 private immutable _CACHED_DOMAIN_SEPARATOR;

    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        _CACHED_CHAIN_ID = block.chainid;
        _CACHED_DOMAIN_SEPARATOR = _buildDomainSeparator();
        _mint(msg.sender, _initialSupply * 1e18);
    }

    // ===== 标准 ERC-20 部分（简化）=====
    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "insufficient allowance");
        if (allowed != type(uint256).max) allowance[from][msg.sender] = allowed - value;
        _transfer(from, to, value);
        return true;
    }

    // ============================================================
    //  DOMAIN_SEPARATOR：EIP-712 域分隔符
    //  把「合约名/版本/链id/合约地址」绑进签名，防止跨链、跨合约重放。
    // ============================================================
    function DOMAIN_SEPARATOR() public view returns (bytes32) {
        // 若链 id 变了（如硬分叉），重新计算，防止旧签名在新链复用
        if (block.chainid == _CACHED_CHAIN_ID) return _CACHED_DOMAIN_SEPARATOR;
        return _buildDomainSeparator();
    }

    function _buildDomainSeparator() private view returns (bytes32) {
        return keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes(name)),
                keccak256(bytes("1")),      // version = "1"
                block.chainid,
                address(this)
            )
        );
    }

    // ============================================================
    //  permit：核心！用 owner 的链下签名完成授权，无需 owner 先发交易
    //  EIP-2612: permit(owner, spender, value, deadline, v, r, s)
    // ============================================================
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        // 1) 签名必须在有效期内
        require(block.timestamp <= deadline, "ERC2612: permit expired");

        // 2) 按 EIP-712 重建被签署的「结构化哈希」，其中 nonce 用当前值并自增
        bytes32 structHash = keccak256(
            abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline)
        );

        // 3) 拼成最终摘要：0x1901 ‖ domainSeparator ‖ structHash
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR(), structHash)
        );

        // 4) 用 ecrecover 从签名恢复签名者地址，必须等于 owner
        address recovered = ecrecover(digest, v, r, s);
        require(recovered != address(0) && recovered == owner, "ERC2612: invalid signature");

        // 5) 校验通过 → 完成授权（等价于 owner 亲自 approve）
        _approve(owner, spender, value);
    }

    // ===== 内部 =====
    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "transfer to zero");
        require(balanceOf[from] >= value, "insufficient balance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }

    function _approve(address owner, address spender, uint256 value) internal {
        allowance[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    function _mint(address to, uint256 value) internal {
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }
}
