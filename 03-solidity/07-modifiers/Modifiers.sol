// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Modifiers 函数修饰器教学合约
 * @notice 教学用途，未经审计，勿直接上主网。
 * @dev 本合约聚焦 modifier（函数修饰器）。
 *      直接复制到 https://remix.ethereum.org 即可编译并部署到 Remix VM 调用。
 *
 * 本模块要点：
 *  1. modifier 语法与 `_;` 占位符（函数体在这里被「插入」执行）；
 *  2. onlyOwner 权限控制（最经典用途）；
 *  3. 带参数的 modifier；
 *  4. 多个 modifier 叠加的执行顺序（从左到右）；
 *  5. modifier 中的前置 / 后置逻辑，以及重入锁（nonReentrant）思路。
 */
contract Modifiers {
    address public owner;         // 合约拥有者
    bool public paused;           // 暂停开关
    uint256 public counter;       // 演示用计数器
    mapping(address => bool) public managers; // 白名单管理员

    // 部署者成为初始 owner。构造函数只在部署时执行一次。
    constructor() {
        owner = msg.sender;
    }

    // ============================================================
    // 一、最经典：onlyOwner 权限控制
    // ============================================================

    /**
     * @dev modifier 定义。函数被它修饰时：
     *      - 先执行 `_;` 之前的代码（前置检查）；
     *      - 遇到 `_;` 占位符，就「跳进去」执行被修饰函数的函数体；
     *      - 函数体执行完，再回来执行 `_;` 之后的代码（后置逻辑，若有）。
     */
    modifier onlyOwner() {
        // 用 msg.sender 做鉴权（谁直接调用了本合约）。
        // ⚠️ 绝不要用 tx.origin 鉴权（见文末安全提示）。
        require(msg.sender == owner, "Not owner");
        _; // 占位符：被修饰函数的函数体在此处执行
    }

    /// @notice 只有 owner 能转移所有权
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero address");
        owner = newOwner;
    }

    // ============================================================
    // 二、带参数的 modifier
    // ============================================================

    /// @dev modifier 可以接收参数，像函数一样在括号里传入。
    modifier onlyManagerOr(address who) {
        require(
            managers[msg.sender] || msg.sender == who,
            "not manager nor allowed"
        );
        _;
    }

    /// @notice 增删管理员（仅 owner）
    function setManager(address who, bool ok) external onlyOwner {
        managers[who] = ok;
    }

    /// @notice 演示带参数 modifier：管理员或指定地址可调用
    function managedAction(address allowed) external onlyManagerOr(allowed) {
        counter += 1;
    }

    // ============================================================
    // 三、前置 + 后置逻辑（`_;` 前后都能写）
    // ============================================================

    /// @dev whenNotPaused：前置检查合约未暂停；此处只演示前置逻辑。
    modifier whenNotPaused() {
        require(!paused, "paused");
        _;
    }

    /// @dev 演示「后置逻辑」：`_;` 之后的代码在函数体执行完后运行。
    modifier logAfter() {
        _;               // 先执行函数体
        counter += 100;  // 函数体跑完后，这段后置逻辑才执行
    }

    function pause() external onlyOwner { paused = true; }
    function unpause() external onlyOwner { paused = false; }

    /// @notice 演示前置逻辑：暂停时不可调用
    function doWhenActive() external whenNotPaused {
        counter += 1;
    }

    /// @notice 演示后置逻辑：调用后 counter 会 +1(函数体) 再 +100(modifier 后置)
    function doWithAfterLog() external logAfter {
        counter += 1;
    }

    // ============================================================
    // 四、多个 modifier 叠加：执行顺序 = 从左到右
    // ============================================================

    /**
     * @notice 同时叠加 onlyOwner + whenNotPaused。
     * @dev 执行顺序为「从左到右」进入：
     *      onlyOwner 前置检查 → whenNotPaused 前置检查 → 函数体 → whenNotPaused 后置 → onlyOwner 后置。
     *      本例两个 modifier 都只有前置检查，所以效果是：先查 owner，再查未暂停，最后执行函数体。
     */
    function adminOnlyWhenActive() external onlyOwner whenNotPaused {
        counter += 1;
    }

    // ============================================================
    // 五、重入锁（nonReentrant）思路：前置置锁 + 后置解锁
    // ============================================================

    // 用一个状态位表示「函数正在执行中」。
    uint256 private _locked = 1; // 1=未锁，2=已锁（用非零->非零省 gas）

    /**
     * @dev 重入锁：进入函数时上锁，`_;` 执行函数体，退出时解锁。
     *      若函数体中途外部调用又「重新进入」本函数，会因 _locked==2 而 revert。
     */
    modifier nonReentrant() {
        require(_locked == 1, "reentrant call");
        _locked = 2; // 前置：上锁
        _;           // 执行函数体（可能包含外部调用）
        _locked = 1; // 后置：解锁
    }

    /// @notice 演示 nonReentrant 修饰的函数（教学骨架，未做真实转账）
    function safeAction() external nonReentrant {
        counter += 1;
        // 真实场景中，这里若向外部地址转账/回调，重入锁可防止被反复重入。
    }
}
