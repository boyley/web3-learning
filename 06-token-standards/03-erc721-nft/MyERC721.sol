// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MyERC721 —— 手写最小 ERC-721 NFT 实现（教学用途）
 * @notice 从零手写 ERC-721 核心接口，帮助理解「非同质化代币」是怎么用
 *         tokenId → owner 的映射来表达「每个都独一无二」的。
 *
 *         ⚠️ 教学用途，未经审计，勿上主网。
 *         ✅ 生产环境请继承 OpenZeppelin：
 *            import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
 *            contract MyNFT is ERC721 { constructor() ERC721("MyNFT","MNFT"){} }
 *
 * 对照官方标准：EIP-721 https://eips.ethereum.org/EIPS/eip-721
 */

/// @dev ERC-721 安全转账时，接收方若是合约必须实现此接口，否则转账 revert
interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

contract MyERC721 {
    // ========= 元数据（ERC721Metadata 扩展）=========
    string public name;   // 集合名，如 "My NFT Collection"
    string public symbol; // 集合符号，如 "MNFT"

    // ========= 核心状态 =========
    // tokenId → 拥有者地址。这是 NFT 的「产权登记簿」。
    mapping(uint256 => address) private _owners;
    // 拥有者 → 持有数量
    mapping(address => uint256) private _balances;
    // tokenId → 被授权可转移它的「单个」地址
    mapping(uint256 => address) private _tokenApprovals;
    // owner → operator → 是否被授权管理该 owner 的「全部」NFT
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    uint256 private _nextTokenId; // 自增 tokenId

    // ========= 事件（EIP-721 强制，注意 tokenId 是 indexed）=========
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    // ============================================================
    //  查询类
    // ============================================================

    /// balanceOf：某地址持有多少个 NFT。EIP-721: balanceOf(address) returns (uint256)
    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "ERC721: zero address");
        return _balances[owner];
    }

    /// ownerOf：某个 tokenId 的拥有者。EIP-721: ownerOf(uint256) returns (address)
    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ERC721: token does not exist");
        return owner;
    }

    /// tokenURI：返回该 NFT 元数据 JSON 的 URL（详见 04 模块）
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "ERC721: token does not exist");
        // 教学简化：返回 baseURI + tokenId。真实项目常指向 IPFS。
        return string(abi.encodePacked("https://example.com/nft/", _toString(tokenId), ".json"));
    }

    // ============================================================
    //  授权类
    // ============================================================

    /// approve：授权 to 可以转移「某一个」tokenId
    function approve(address to, uint256 tokenId) public {
        address owner = ownerOf(tokenId);
        require(to != owner, "ERC721: approve to owner");
        // 调用者必须是拥有者，或被拥有者设为全权 operator
        require(
            msg.sender == owner || isApprovedForAll(owner, msg.sender),
            "ERC721: not authorized"
        );
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    /// getApproved：查某个 tokenId 被授权给了谁
    function getApproved(uint256 tokenId) public view returns (address) {
        require(_owners[tokenId] != address(0), "ERC721: token does not exist");
        return _tokenApprovals[tokenId];
    }

    /// setApprovalForAll：把「我全部 NFT」的管理权授予/收回 operator（如 OpenSea 市场合约）
    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, "ERC721: self approval");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    /// isApprovedForAll：查 operator 是否被 owner 全权授权
    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    // ============================================================
    //  转账类
    // ============================================================

    /// transferFrom：转移 NFT（不检查接收方是否能收 NFT，可能把币转进「黑洞合约」）
    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: not authorized");
        _transfer(from, to, tokenId);
    }

    /// safeTransferFrom（带 data）：转账后，若 to 是合约会回调其 onERC721Received 确认能收，否则 revert
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: not authorized");
        _transfer(from, to, tokenId);
        _checkOnERC721Received(from, to, tokenId, data);
    }

    /// safeTransferFrom（无 data 重载）
    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        safeTransferFrom(from, to, tokenId, "");
    }

    // ============================================================
    //  铸造（NFT 的诞生）
    // ============================================================
    function mint(address to) public returns (uint256) {
        require(to != address(0), "ERC721: mint to zero");
        uint256 tokenId = _nextTokenId++;
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId); // from = 0 表示铸造
        return tokenId;
    }

    // ========================= 内部工具 =========================

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner ||
            getApproved(tokenId) == spender ||
            isApprovedForAll(owner, spender));
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "ERC721: from is not owner");
        require(to != address(0), "ERC721: transfer to zero");

        delete _tokenApprovals[tokenId]; // 转手后清除旧的单个授权
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    /// @dev 若 to 是合约，调用它的 onERC721Received，必须返回魔术值，否则 revert
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) internal {
        if (to.code.length > 0) {
            // to 是合约
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                require(
                    retval == IERC721Receiver.onERC721Received.selector,
                    "ERC721: receiver rejected"
                );
            } catch {
                revert("ERC721: transfer to non-receiver contract");
            }
        }
        // to 是普通地址（EOA），无需回调
    }

    /// @dev uint256 转字符串（用于拼 tokenURI）
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
