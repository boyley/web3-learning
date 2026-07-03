// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PayableEther 收发以太演示
 * @notice 教学用途，未经审计，勿直接上主网。
 * @dev 本合约演示 Solidity 里「收 ETH / 存 ETH / 取 ETH」的完整套路：
 *      1. payable 函数：函数带 `payable` 才能在被调用时接收 msg.value。
 *      2. receive() external payable：当有人「纯转账」（calldata 为空）时触发。
 *      3. fallback() external payable：当调用了不存在的函数、
 *         或转账但没有 receive() 时触发。
 *      4. 提款：用 `call{value: amount}("")` 而不是 transfer/send。
 *      5. 重入防护 + Checks-Effects-Interactions（先改状态，再转账）。
 *
 *      ── receive vs fallback 触发规则速记 ──
 *        收到调用
 *          ├─ msg.data 为空？
 *          │     ├─ 是 → 有 receive()? → 走 receive() : 走 fallback()
 *          │     └─ 否 → 走匹配的函数；匹配不到 → 走 fallback()
 */
contract PayableEther {
    /// @notice 记录每个地址存进来的余额（内部账本）
    mapping(address => uint256) public balances;

    /// @notice 简单的重入锁（true 表示正在执行敏感逻辑，禁止重入）
    bool private locked;

    /// @notice 事件：便于在 Remix 日志里观察资金流向
    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event ReceiveCalled(address indexed from, uint256 amount);
    event FallbackCalled(address indexed from, uint256 amount, bytes data);

    /// @notice 防重入修饰器：进入时上锁，退出时解锁
    modifier nonReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }

    /**
     * @notice 存款：显式调用的 payable 函数。
     * @dev 调用时在 Remix 的 Value 框填 ETH，msg.value 即为存入金额。
     *      把金额记进内部账本 balances，方便之后按地址提款。
     */
    function deposit() external payable {
        require(msg.value > 0, "deposit: zero value");
        balances[msg.sender] += msg.value; // 记账
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice 提款：把调用者之前存入的 ETH 取走。
     * @dev 严格遵守 Checks-Effects-Interactions：
     *      1. Checks   —— 校验余额充足；
     *      2. Effects  —— 先把账本清零（改状态）；
     *      3. Interactions —— 最后才真正转账。
     *      转账用 call{value:}("")，并检查返回值 ok；配合 nonReentrant。
     */
    function withdraw(uint256 amount) external nonReentrant {
        // 1. Checks：先校验
        require(balances[msg.sender] >= amount, "withdraw: insufficient balance");

        // 2. Effects：先改状态，再转账（防重入的关键顺序）
        balances[msg.sender] -= amount;

        // 3. Interactions：用 call 转账，转发全部剩余 gas，并检查是否成功
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "withdraw: ETH transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    /// @notice 查询本合约当前持有的 ETH 总额（wei）
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice 查询某地址在内部账本里的余额（wei）
    function balanceOf(address who) external view returns (uint256) {
        return balances[who];
    }

    /**
     * @notice receive：当有人「纯转账」到本合约（calldata 为空）时自动触发。
     * @dev 必须是 external + payable，且没有参数、没有返回值、没有 function 关键字。
     *      这里把纯转账也计入存款账本，语义上等价于 deposit()。
     */
    receive() external payable {
        balances[msg.sender] += msg.value;
        emit ReceiveCalled(msg.sender, msg.value);
    }

    /**
     * @notice fallback：当调用了不存在的函数、或转账但合约没有 receive() 时触发。
     * @dev 加了 payable 才能在 fallback 里接收 ETH。
     *      这里同样把可能带来的 msg.value 计入账本，并记录原始 calldata。
     */
    fallback() external payable {
        if (msg.value > 0) {
            balances[msg.sender] += msg.value;
        }
        emit FallbackCalled(msg.sender, msg.value, msg.data);
    }
}
