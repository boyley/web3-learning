// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MetadataNFT —— 讲清 tokenURI 与元数据是怎么拼出来的（教学用途）
 * @notice 本合约聚焦「元数据」这一件事：NFT 长什么样、有哪些属性，
 *         链上只存一个指向 JSON 的 URL（tokenURI），图片和属性都在链下。
 *
 *         ⚠️ 教学用途，未经审计，勿上主网。
 * 对照：EIP-721 Metadata 扩展 https://eips.ethereum.org/EIPS/eip-721
 *      OpenSea 元数据标准 https://docs.opensea.io/docs/metadata-standards
 */
contract MetadataNFT {
    string public name;
    string public symbol;

    // 所有 tokenURI 共享的前缀（Base URI）。常指向 IPFS 目录，如 ipfs://<CID>/
    string private _baseTokenURI;

    mapping(uint256 => address) private _owners;
    uint256 private _nextTokenId;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor(string memory _name, string memory _symbol, string memory baseURI) {
        name = _name;
        symbol = _symbol;
        _baseTokenURI = baseURI; // 例如 "ipfs://bafy.../"
    }

    function mint(address to) external returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
        return tokenId;
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "token does not exist");
        return owner;
    }

    /**
     * tokenURI：ERC721Metadata 要求的方法。
     * 约定：返回一个 URL，GET 它能拿到符合规范的 JSON（见 metadata-example.json）。
     * 常见拼法 = baseURI + tokenId + ".json"，例如：
     *   ipfs://bafy.../0.json
     * 钱包/OpenSea 拿到这个 URL 后，解析 JSON 里的 image 字段去渲染图片。
     */
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_owners[tokenId] != address(0), "token does not exist");
        return string(abi.encodePacked(_baseTokenURI, _toString(tokenId), ".json"));
    }

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
