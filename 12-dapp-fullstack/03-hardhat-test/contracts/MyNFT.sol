// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ==============================================================
//  从 OpenZeppelin Contracts v5 引入四个「乐高积木」，组合出我们的 NFT
//  注意 v5 推荐的「命名导入」写法： import {合约名} from "路径";
// --------------------------------------------------------------
//  ERC721            —— NFT 的基础标准（EIP-721）：所有权、转账、授权
//  ERC721Enumerable  —— 可枚举扩展：让链上能「按序号列出某地址持有的全部 tokenId」
//                       （模块 09 前端「我的 NFT」列表就靠它）
//  ERC721URIStorage  —— 让每个 tokenId 单独存一条 tokenURI（指向 IPFS 元数据）
//  Ownable           —— 访问控制：给合约一个 owner，用 onlyOwner 保护管理函数
// ==============================================================
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyNFT —— 可公开铸造的 NFT 合约（教学用途）
 * @notice 本合约是「一条龙 dApp 实战」的链上核心：
 *         - 任何钱包都能调用 mint() 给自己铸造一枚 NFT；
 *         - 每枚 NFT 绑定一个 tokenURI（一般指向 IPFS 上的 JSON 元数据）；
 *         - 前端可通过 Enumerable 扩展列出「我拥有哪些 NFT」。
 *
 *         ⚠️ 教学用途，未经审计，仅部署到测试网（Sepolia），勿直接上主网。
 *
 * 对照官方文档：
 *   EIP-721                 https://eips.ethereum.org/EIPS/eip-721
 *   OpenZeppelin ERC721 v5  https://docs.openzeppelin.com/contracts/5.x/erc721
 *   合约向导（可视化生成）    https://wizard.openzeppelin.com/
 */
contract MyNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    // tokenId 自增计数器。第一枚 NFT 的 id = 0，之后 1、2、3……
    // v5 移除了官方 Counters 库，直接用一个 uint256 自增即可。
    uint256 private _nextTokenId;

    // 供应量上限：教学项目限量 1000 枚，避免无限铸造。
    uint256 public constant MAX_SUPPLY = 1000;

    // 铸造事件：铸造成功时抛出，方便前端 / 区块浏览器索引。
    // （ERC721 自身已有 Transfer 事件，这里额外抛一个更语义化的事件做演示。）
    event Minted(address indexed to, uint256 indexed tokenId, string tokenURI);

    /**
     * @param initialOwner 合约拥有者地址（v5 的 Ownable 构造函数强制要求显式传入，
     *                      不能再像 v4 那样默认取 msg.sender）。
     *                      部署脚本里一般传部署者自己的地址。
     */
    constructor(address initialOwner)
        ERC721("MyNFT", "MNFT") // NFT 集合名 + 符号
        Ownable(initialOwner)   // 设定合约 owner
    {}

    /**
     * @notice 公开铸造：任何人都能给「自己」铸造一枚 NFT。
     * @param uri 该枚 NFT 的元数据地址，通常是 "ipfs://<CID>/metadata.json"
     * @return tokenId 新铸造出来的 NFT 序号
     *
     * 教学要点：
     *  - 这里没有加 onlyOwner，所以是「公开铸造（public mint）」——前端任意钱包都能调。
     *  - 用 _safeMint 而不是 _mint：若接收方是合约，会检查它是否实现了
     *    onERC721Received，防止 NFT 被转进一个「不会处理 NFT 的黑洞合约」而永久锁死。
     *  - 先自增再使用（tokenId = _nextTokenId++）保证 id 唯一且从 0 开始。
     */
    function mint(string memory uri) public returns (uint256) {
        require(_nextTokenId < MAX_SUPPLY, "MyNFT: sold out"); // 供应量上限保护

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);   // 铸造并把所有权给调用者
        _setTokenURI(tokenId, uri);       // 绑定这枚 NFT 的元数据地址

        emit Minted(msg.sender, tokenId, uri);
        return tokenId;
    }

    /**
     * @notice 已铸造的总量（= 下一个待用 id）。前端可用它显示「已铸造 X / 1000」。
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    // ==========================================================
    //  以下是 Solidity「多继承」强制要求的 override（v5 写法）
    //  因为 ERC721 / ERC721Enumerable / ERC721URIStorage 对同名函数
    //  各有实现，编译器要求我们显式指明「用 super 串起来调用」。
    //  这几段是 OpenZeppelin 合约向导自动生成的标准模板，照抄即可。
    // ==========================================================

    // 每次余额/所有权变化（铸造、转账、销毁）都会走 _update；
    // Enumerable 靠它维护「持有列表」的索引。
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    // tokenURI 同时被 ERC721 与 URIStorage 定义，需指明用 URIStorage 的版本。
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    // supportsInterface（EIP-165）用于声明本合约实现了哪些接口，钱包/市场靠它识别。
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
