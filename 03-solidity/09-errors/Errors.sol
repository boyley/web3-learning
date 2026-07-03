// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// Errors —— Solidity 的错误处理（require / revert / assert / custom error）
// 教学用途，未经审计，勿直接上主网。
// ============================================================
//
// 本文件聚焦「一笔交易失败时如何回滚，以及三种错误机制的区别」：
//   1. require(cond, "msg")         —— 校验输入 / 前置条件，失败则回滚并退还剩余 gas
//   2. revert("msg")                —— 主动回滚，可写在任意位置（如复杂 if 分支里）
//   3. revert CustomError(args)     —— 自定义错误，比字符串更省 gas、可带参数
//   4. assert(cond)                 —— 检查「内部不变量」，失败触发 Panic（不该发生的 bug）
//   5. error 关键字定义 custom error —— 现代推荐写法
//
// 【核心心智模型】
//   Solidity 的交易是「全有或全无（all-or-nothing）」的：
//   一旦在执行途中回滚（revert），本次交易对链上状态做过的所有修改
//   都会被「整体撤销」，就像这笔交易从未发生过一样。
//   区别只在于：用哪种机制触发回滚、以及 gas 如何处理、抛出的错误类型是什么。
//
// 【三者区别一句话总结】
//   - require / revert：面向「外部输入 / 业务条件」的校验，失败会退还剩余 gas，
//     抛出的是 Error(string) 或你的 custom error，属于「可预期的失败」。
//   - assert：面向「代码内部不变量」的自检（例如「这里余额绝不可能为负」）。
//     assert 失败会抛出 Panic(uint256) 错误码，代表「代码里有 bug」，
//     正常逻辑下永远不该触发。0.8.0 起 assert 同样退还剩余 gas
//     （早期版本 assert 会吃光所有 gas，注意别看到过时资料）。
//
// ------------------------------------------------------------

// 【custom error 定义】用 error 关键字，可放在合约外部（文件级）或合约内部。
//   - 相比 require 里的长字符串，custom error 在字节码里只保留一个 4 字节选择器，
//     部署和触发都更省 gas，还能携带结构化参数便于前端解析。
error Unauthorized(address caller);          // 携带「是谁触发的」，便于排查
error InsufficientBalance(uint256 available, uint256 required); // 携带余额对比
error AmountZero();                          // 无参数的简单错误

contract Errors {
    // 合约拥有者：部署者。用于演示权限校验类错误。
    address public owner;

    // 一个简单的「账本」，演示转账时的余额校验与不变量。
    mapping(address => uint256) public balanceOf;

    // 记录所有账户余额之和，作为「内部不变量」演示 assert：
    // 任何时刻 totalSupply 都应等于所有 balanceOf 之和。
    uint256 public totalSupply;

    constructor() {
        owner = msg.sender;
    }

    // ============================================================
    // 一、require —— 校验输入 / 前置条件（最常用）
    // ============================================================
    // require(条件, "错误信息")：
    //   - 条件为 true  → 继续执行；
    //   - 条件为 false → 立即回滚，抛出 Error(string)，并退还剩余 gas。
    // 典型用途：校验函数入参、校验调用者身份、校验时间/状态等。
    function deposit(uint256 amount) public {
        // 入参校验：金额必须大于 0。失败会把这句话作为 revert reason 返回。
        require(amount > 0, "deposit: amount must be > 0");

        balanceOf[msg.sender] += amount;
        totalSupply += amount;
    }

    // ============================================================
    // 二、revert("msg") —— 主动回滚（适合复杂条件分支）
    // ============================================================
    // 当校验逻辑比较复杂、用 require 一行写不下时，
    // 常用 if (...) { revert("..."); } 的写法，可读性更好。
    function withdraw(uint256 amount) public {
        // 复杂条件分支下，用 if + revert 比 require 更清晰。
        if (amount == 0) {
            revert("withdraw: amount is zero");
        }
        if (balanceOf[msg.sender] < amount) {
            revert("withdraw: insufficient balance");
        }

        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
    }

    // ============================================================
    // 三、revert CustomError(args) —— 自定义错误（省 gas，带参数）
    // ============================================================
    // 推荐写法：if (!条件) revert CustomError(参数);
    // 这种「if + revert customError」的写法从 0.8.4 起就支持，
    // 兼容 ^0.8.20，是当前最通用、最安全的自定义错误用法。
    function withdrawWithCustomError(uint256 amount) public {
        // 金额为 0 → 抛出无参 custom error
        if (amount == 0) {
            revert AmountZero();
        }
        // 余额不足 → 抛出带参 custom error，前端可读到 available / required 两个值
        uint256 bal = balanceOf[msg.sender];
        if (bal < amount) {
            revert InsufficientBalance({available: bal, required: amount});
        }

        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
    }

    // 只有 owner 能调用的示例：演示用 custom error 做权限校验。
    function onlyOwnerAction() public view returns (string memory) {
        // 常见坑：权限判断不要用 tx.origin，应该用 msg.sender（见下方安全提示）。
        if (msg.sender != owner) {
            revert Unauthorized(msg.sender);
        }
        return "you are the owner";
    }

    // ------------------------------------------------------------
    // 【关于 require(bool, CustomError()) 这个重载】
    //   从 Solidity 0.8.26 起，require 新增了一个重载，
    //   可以直接写：require(cond, CustomError(args));
    //   即「条件不满足时抛出 custom error」，写起来比 if+revert 更简洁。
    //
    //   ⚠️ 注意：本模块 pragma 用 ^0.8.20，为保证在较低版本也能编译，
    //   下面示范的是「兼容写法」（if (!cond) revert CustomError();）。
    //   如果你的编译器 >= 0.8.26，才可以把它替换成：
    //       require(amount > 0, AmountZero());
    //   在 0.8.20 上写 require(bool, CustomError()) 会编译报错。
    // ------------------------------------------------------------
    function requireWithCustomError_compatible(uint256 amount) public pure {
        // 0.8.20 兼容写法（推荐，任何 0.8.4+ 都能用）：
        if (amount == 0) revert AmountZero();

        // 若编译器 >= 0.8.26，可改用更简洁的重载（此处注释掉以兼容 0.8.20）：
        // require(amount > 0, AmountZero());
    }

    // ============================================================
    // 四、assert —— 检查「内部不变量」（触发 Panic）
    // ============================================================
    // assert 用来断言「按照代码逻辑，这里绝对应该成立」的不变量。
    // 一旦 assert 失败，说明代码本身有 bug，会抛出 Panic(uint256) 错误码
    // （例如 0x01 表示 assert 失败），而不是普通的 Error(string)。
    //
    // 正确用法：校验事后不变量。这里我们断言：
    //   任意时刻 totalSupply 必须等于（本演示中）调用者自己的余额假设之外的全局账。
    // 为便于演示，这里断言一个「永远成立」的不变量：totalSupply >= balanceOf[msg.sender]，
    // 因为 totalSupply 是所有账户余额之和，必然 >= 任一单账户余额。
    function checkInvariant() public view returns (bool) {
        // 这个不变量在正常逻辑下永远成立；若某天因 bug 不成立，assert 会 Panic。
        assert(totalSupply >= balanceOf[msg.sender]);
        return true;
    }

    // 演示：能「人为」触发 Panic 的经典场景 —— 除以 0（不是 assert 但同属 Panic 家族）。
    // 0.8.x 会把「除零」自动转成 Panic(0x12)。此函数仅用于观察 Panic 错误类型。
    function triggerDivByZeroPanic(uint256 a, uint256 b) public pure returns (uint256) {
        // 当 b == 0 时，EVM 触发 Panic(0x12)（除以零），交易回滚。
        return a / b;
    }
}
