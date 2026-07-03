// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GlobalVariables 全局变量演示
 * @notice 教学用途，未经审计，勿直接上主网。
 * @dev 本合约集中演示 Solidity 里常用的「全局变量 / 特殊变量」：
 *      它们不是你声明的变量，而是 EVM 在执行交易时自动注入的「上下文」，
 *      分别来自「交易(transaction)」和「区块(block)」两个层面。
 *
 *      交易上下文（每次调用都不同）：
 *        - msg.sender  : 本次调用的直接发起者（可能是 EOA，也可能是合约）
 *        - msg.value   : 本次调用随交易发送的 ETH 数量（单位 wei），仅 payable 函数可收
 *        - msg.data    : 本次调用的完整 calldata（函数选择器 + 编码后的参数）
 *        - msg.sig     : calldata 前 4 字节，即函数选择器
 *        - tx.origin   : 整条调用链最初的 EOA 发起者（⚠️ 不要用于鉴权）
 *        - tx.gasprice : 本次交易的 gas 价格
 *
 *      区块上下文（同一区块内相同）：
 *        - block.timestamp : 出块时间戳（秒，Unix time）
 *        - block.number    : 当前区块高度
 *        - block.chainid   : 当前链 ID（主网=1，Sepolia=11155111）
 *        - block.coinbase  : 当前区块矿工/验证者地址
 *        - block.basefee   : 当前区块基础手续费（EIP-1559）
 *
 *      其它：
 *        - gasleft()               : 当前调用还剩多少 gas
 *        - address(this).balance   : 本合约自身的 ETH 余额（wei）
 */
contract GlobalVariables {
    /// @notice 部署时把「谁部署的、在哪条链、什么时间」记下来，方便对比后续调用
    address public immutable deployer;
    uint256 public immutable deployChainId;
    uint256 public immutable deployTimestamp;

    constructor() {
        // 部署也是一次交易：这里的 msg.sender 就是部署者
        deployer = msg.sender;
        deployChainId = block.chainid;
        deployTimestamp = block.timestamp;
    }

    /**
     * @notice 一次性把常用的「交易 + 区块」全局变量读出来。
     * @dev 用 `payable` 是为了让你能在 Remix 的 Value 输入框填 ETH，
     *      从而观察到 msg.value 非 0（普通非 payable 函数无法接收 ETH）。
     * @return sender     msg.sender：本次调用的直接调用者
     * @return origin     tx.origin：调用链最初的 EOA（⚠️ 勿用于鉴权）
     * @return value      msg.value：随本次调用发送的 wei
     * @return timestamp  block.timestamp：出块时间戳（秒）
     * @return blockNo    block.number：当前区块高度
     * @return chainId    block.chainid：当前链 ID
     * @return remainGas  gasleft()：读取此刻剩余 gas
     * @return selfBal    address(this).balance：合约自身余额（wei）
     */
    function readAll()
        external
        payable
        returns (
            address sender,
            address origin,
            uint256 value,
            uint256 timestamp,
            uint256 blockNo,
            uint256 chainId,
            uint256 remainGas,
            uint256 selfBal
        )
    {
        sender = msg.sender; // 直接调用者
        origin = tx.origin; // 最初 EOA 发起者
        value = msg.value; // 本次带来的 ETH（wei）
        timestamp = block.timestamp; // 出块时间
        blockNo = block.number; // 区块高度
        chainId = block.chainid; // 链 ID
        remainGas = gasleft(); // 剩余 gas
        selfBal = address(this).balance; // 合约余额（若 value>0，已包含本次转入）
    }

    /**
     * @notice 单独读取本次调用的原始 calldata 与函数选择器。
     * @dev msg.data 是完整 calldata；msg.sig 是它的前 4 字节（函数选择器）。
     *      给它传个参数，就能看到 msg.data 里编码进去的参数值。
     */
    function readCalldata(uint256 /* anyNumber */ )
        external
        pure
        returns (bytes memory rawData, bytes4 selector)
    {
        rawData = msg.data; // 完整 calldata：selector(4字节) + 参数(32字节)
        selector = msg.sig; // 函数选择器（calldata 前 4 字节）
    }

    /**
     * @notice ⚠️ 反面教材：演示为什么 tx.origin 不能用于鉴权。
     * @dev 如果这里用 `require(tx.origin == owner)` 做权限判断，
     *      当 owner 被诱导去调用一个恶意合约、再由恶意合约转调本函数时，
     *      tx.origin 仍是 owner，鉴权会被绕过（钓鱼攻击）。
     *      正确做法：用 msg.sender 做鉴权。此函数只演示两者差异，不做真实鉴权。
     */
    function senderVsOrigin() external view returns (address sender, address origin, bool isDirectEOA) {
        sender = msg.sender;
        origin = tx.origin;
        // 若二者相等，说明是 EOA 直接调用（中间没有经过其它合约）
        isDirectEOA = (sender == origin);
    }

    /// @notice 允许合约直接收 ETH，方便观察 address(this).balance 变化
    receive() external payable {}
}
