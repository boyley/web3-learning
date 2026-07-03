// SPDX-License-Identifier: MIT
// 教学用途，未经审计，勿直接上主网。
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyNFT
 * @notice 继承 ERC721 发行非同质化代币（NFT）。每个 tokenId 独一无二。
 * @dev 使用 ERC721URIStorage 扩展，可为每个 tokenId 单独设置 metadata 链接（tokenURI）。
 *      ERC721 没有 decimals（不可分割）。
 */
contract MyNFT is ERC721URIStorage, Ownable {
    // 自增的下一个 tokenId（比手动传入更安全，避免撞号）
    uint256 private _nextTokenId;

    constructor(address initialOwner)
        ERC721("MyNFT", "MNFT") // NFT 集合名称、符号
        Ownable(initialOwner)
    {}

    /**
     * @notice 铸造一枚 NFT 给指定地址。
     * @param to  接收者
     * @param uri 该 NFT 的 metadata JSON 链接（通常指向 IPFS，如 ipfs://.../1.json）
     * @return tokenId 新铸造的编号
     * @dev 用 _safeMint 而非 _mint：会检查接收方合约是否实现 onERC721Received，
     *      防止 NFT 被转进不会处理它的合约而永久锁死。
     */
    function safeMint(address to, string memory uri)
        public
        onlyOwner
        returns (uint256)
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }

    // 说明：v5 中 ERC721URIStorage 已正确重写 tokenURI() 与 supportsInterface()，
    // 与 Ownable 组合时无函数签名冲突，无需额外 override。
}
