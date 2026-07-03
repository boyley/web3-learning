// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MyERC1155 —— 手写最小 ERC-1155 多代币标准实现（教学用途）
 * @notice ERC-1155 让「一个合约」同时管理多种代币：既能有同质化的（如金币 id=1，1000 个），
 *         也能有非同质化的（如稀有装备 id=2，仅 1 个）。还支持「批量转账」一次转多种。
 *         非常适合游戏道具、半同质化门票等。
 *
 *         ⚠️ 教学用途，未经审计，勿上主网。
 *         ✅ 生产用 OpenZeppelin：
 *            import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
 *
 * 对照官方标准：EIP-1155 https://eips.ethereum.org/EIPS/eip-1155
 */

interface IERC1155Receiver {
    function onERC1155Received(
        address operator, address from, uint256 id, uint256 value, bytes calldata data
    ) external returns (bytes4);
    function onERC1155BatchReceived(
        address operator, address from, uint256[] calldata ids, uint256[] calldata values, bytes calldata data
    ) external returns (bytes4);
}

contract MyERC1155 {
    // 关键数据结构：balances[id][account] = 该 account 持有 id 号代币多少个
    // 对比：ERC-20 只有一维 balanceOf[account]；ERC-1155 多了一维「id」。
    mapping(uint256 => mapping(address => uint256)) private _balances;

    // owner => operator => 是否全权授权（ERC-1155 只有全权授权，没有「单个授权」）
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // 所有 id 共用的元数据 URI 模板，内含 {id} 占位符（EIP-1155 约定）
    string private _uri;

    // ========= 事件（EIP-1155 强制）=========
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
    event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event URI(string value, uint256 indexed id);

    constructor(string memory uri_) {
        _uri = uri_; // 例如 "https://game.com/api/item/{id}.json"
    }

    // ========= 查询 =========

    /// 单个余额：某地址持有某 id 多少个
    function balanceOf(address account, uint256 id) public view returns (uint256) {
        require(account != address(0), "ERC1155: zero address");
        return _balances[id][account];
    }

    /// 批量余额：一次查多组 (account, id)。两个数组长度必须相等。
    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids)
        public view returns (uint256[] memory)
    {
        require(accounts.length == ids.length, "ERC1155: length mismatch");
        uint256[] memory batch = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; i++) {
            batch[i] = _balances[ids[i]][accounts[i]];
        }
        return batch;
    }

    /// 元数据 URI：注意 ERC-1155 用同一个模板，客户端把 {id} 替换成 64 位十六进制 tokenId
    function uri(uint256) public view returns (string memory) {
        return _uri;
    }

    // ========= 授权（只有 setApprovalForAll，没有单个授权）=========
    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, "ERC1155: self approval");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    // ========= 转账 =========

    /// 单种转账
    function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes memory data) public {
        require(from == msg.sender || isApprovedForAll(from, msg.sender), "ERC1155: not authorized");
        require(to != address(0), "ERC1155: transfer to zero");
        require(_balances[id][from] >= value, "ERC1155: insufficient balance");

        _balances[id][from] -= value;
        _balances[id][to] += value;

        emit TransferSingle(msg.sender, from, to, id, value);
        _doSafeTransferAcceptanceCheck(msg.sender, from, to, id, value, data);
    }

    /// 批量转账：一次把多种 id、多种数量转给同一个 to，只需一笔交易，省 gas。
    function safeBatchTransferFrom(
        address from, address to, uint256[] memory ids, uint256[] memory values, bytes memory data
    ) public {
        require(from == msg.sender || isApprovedForAll(from, msg.sender), "ERC1155: not authorized");
        require(to != address(0), "ERC1155: transfer to zero");
        require(ids.length == values.length, "ERC1155: length mismatch");

        for (uint256 i = 0; i < ids.length; i++) {
            require(_balances[ids[i]][from] >= values[i], "ERC1155: insufficient balance");
            _balances[ids[i]][from] -= values[i];
            _balances[ids[i]][to] += values[i];
        }

        emit TransferBatch(msg.sender, from, to, ids, values);
        _doSafeBatchTransferAcceptanceCheck(msg.sender, from, to, ids, values, data);
    }

    // ========= 铸造（教学用，无权限控制）=========
    function mint(address to, uint256 id, uint256 value) public {
        require(to != address(0), "ERC1155: mint to zero");
        _balances[id][to] += value;
        emit TransferSingle(msg.sender, address(0), to, id, value);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory values) public {
        require(ids.length == values.length, "ERC1155: length mismatch");
        for (uint256 i = 0; i < ids.length; i++) {
            _balances[ids[i]][to] += values[i];
        }
        emit TransferBatch(msg.sender, address(0), to, ids, values);
    }

    // ========= 接收方校验（对合约地址）=========
    function _doSafeTransferAcceptanceCheck(
        address operator, address from, address to, uint256 id, uint256 value, bytes memory data
    ) private {
        if (to.code.length > 0) {
            try IERC1155Receiver(to).onERC1155Received(operator, from, id, value, data) returns (bytes4 resp) {
                require(resp == IERC1155Receiver.onERC1155Received.selector, "ERC1155: receiver rejected");
            } catch {
                revert("ERC1155: non-receiver contract");
            }
        }
    }

    function _doSafeBatchTransferAcceptanceCheck(
        address operator, address from, address to, uint256[] memory ids, uint256[] memory values, bytes memory data
    ) private {
        if (to.code.length > 0) {
            try IERC1155Receiver(to).onERC1155BatchReceived(operator, from, ids, values, data) returns (bytes4 resp) {
                require(resp == IERC1155Receiver.onERC1155BatchReceived.selector, "ERC1155: receiver rejected");
            } catch {
                revert("ERC1155: non-receiver contract");
            }
        }
    }
}
