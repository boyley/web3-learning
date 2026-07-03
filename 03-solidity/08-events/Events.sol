// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Events 事件与日志教学合约
 * @notice 教学用途，未经审计，勿直接上主网。
 * @dev 本合约聚焦 event（事件）与 log（日志）。
 *      直接复制到 https://remix.ethereum.org 即可编译并部署到 Remix VM 调用。
 *
 * 本模块要点：
 *  1. event 定义与 emit 触发；
 *  2. indexed（最多 3 个）——被索引的参数进 topics，可被前端按条件过滤；
 *     未索引的参数进 data 区；
 *  3. 事件用于「前端监听 / 链下索引（The Graph）」，合约自己无法读取事件；
 *  4. 日志比 storage 便宜很多，适合记录「发生了什么」。
 */
contract Events {
    mapping(address => uint256) public balances;

    // ============================================================
    // 一、event 定义
    // ============================================================

    /**
     * @dev 经典 ERC20 风格转账事件。
     *      indexed 参数（from、to）会进入日志的 topics，前端可按地址过滤；
     *      非 indexed 参数（value）进入 data 区，只能读出、不能高效过滤。
     *      规则：一个事件最多 3 个 indexed 参数（因为 topic0 已被事件签名占用，共 4 个 topic）。
     */
    event Transfer(
        address indexed from,  // topic1：可过滤
        address indexed to,    // topic2：可过滤
        uint256 value          // data：不可过滤，只读值
    );

    /// @dev 演示 3 个 indexed 的上限（再多一个 indexed 就会编译报错）
    event Action(
        address indexed who,
        uint256 indexed actionId,
        bytes32 indexed tag,
        string note            // 第 4 个参数只能不 indexed（进 data 区）
    );

    /// @dev 匿名事件：没有 topic0（事件签名），4 个 topic 全部可用于 indexed，
    ///      但前端无法按「事件名」过滤，较少用。仅作认知，不展开。
    event AnonLog(address indexed who, uint256 amount) anonymous;

    // ============================================================
    // 二、emit 触发事件
    // ============================================================

    /// @notice 铸造余额并触发 Transfer 事件（from 为零地址，表示 mint）
    function mint(address to, uint256 amount) external {
        balances[to] += amount;
        // emit 关键字触发事件，写入交易 receipt 的 logs。
        emit Transfer(address(0), to, amount);
    }

    /// @notice 转账并触发 Transfer 事件
    function transfer(address to, uint256 amount) external {
        require(balances[msg.sender] >= amount, "insufficient");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount); // 记录「谁转给谁多少」
    }

    /// @notice 演示带 3 个 indexed + 1 个 string 的事件
    function doAction(uint256 actionId, bytes32 tag, string calldata note) external {
        emit Action(msg.sender, actionId, tag, note);
    }

    /// @notice 演示匿名事件
    function anonLog(uint256 amount) external {
        emit AnonLog(msg.sender, amount);
    }

    // ============================================================
    // 三、关键认知：合约无法读取事件
    // ============================================================

    /**
     * @dev 事件/日志是「只写」的：写进交易 receipt 供链下读取，
     *      EVM 里没有任何指令能让合约把日志读回来。
     *      所以事件不能当存储用；需要合约内读取的数据，仍要存进 storage。
     *
     *      成本直觉：日志（LOG opcode）远比 SSTORE 便宜，
     *      因此「只给链下看」的信息优先用事件，而非写 storage。
     */
    function whyEvents() external pure returns (string memory) {
        return "logs are write-only for off-chain readers; contracts cannot read events";
    }
}
