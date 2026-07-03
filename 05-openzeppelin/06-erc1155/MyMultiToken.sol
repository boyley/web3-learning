// SPDX-License-Identifier: MIT
// 教学用途，未经审计，勿直接上主网。
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyMultiToken
 * @notice ERC1155「多代币」标准：一个合约同时管理多种代币，
 *         每种代币用一个 id 区分，既能表示同质化（如金币）也能表示非同质化（如唯一装备）。
 * @dev 相比「ERC20 一个合约一种币、ERC721 一个合约一类 NFT」，
 *      ERC1155 更省 gas，且支持一次批量转多种代币（游戏/道具场景常用）。
 */
contract MyMultiToken is ERC1155, Ownable {
    // 用常量给 id 起可读名字
    uint256 public constant GOLD = 0;   // 同质化：金币，可铸很多枚
    uint256 public constant SWORD = 1;  // 非同质化：唯一神剑，只铸 1 枚

    /**
     * @param initialOwner 初始所有者
     * @dev 构造函数传入 URI 模板，其中 {id} 是占位符，
     *      客户端查询某 id 元数据时会把 {id} 替换成 16 进制编号。
     */
    constructor(address initialOwner)
        ERC1155("https://game.example/api/item/{id}.json")
        Ownable(initialOwner)
    {}

    /// @notice 铸造单一种类代币。data 一般传空 ""。
    function mint(address to, uint256 id, uint256 amount, bytes memory data)
        public
        onlyOwner
    {
        _mint(to, id, amount, data);
    }

    /// @notice 批量铸造多种代币，一次交易搞定，省 gas。
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }

    // 说明：balanceOf(account, id)、balanceOfBatch、safeTransferFrom、
    // safeBatchTransferFrom、setApprovalForAll 等标准接口均由 ERC1155 提供。
}
