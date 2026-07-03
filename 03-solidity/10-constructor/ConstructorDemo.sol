// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// ConstructorDemo —— 构造函数（constructor）
// 教学用途，未经审计，勿直接上主网。
// ============================================================
//
// 本文件聚焦以下知识点：
//   1. constructor 只在「部署」时执行一次，用于初始化合约状态
//   2. 经典用法：owner = msg.sender（把部署者设为合约拥有者）
//   3. 带参数的构造函数（Remix 部署时如何填入参数）
//   4. immutable 变量：在构造时赋值、之后不可改，比普通状态变量更省 gas
//   5. constant 与 immutable 的区别
//   6. 构造函数「不可被再次调用」——部署后它就不再存在于运行时字节码里
//
// 【核心心智模型】
//   部署一个合约本身也是一笔「交易」。这笔交易携带的是「创建字节码
//   （creation bytecode）」，EVM 执行它时会：
//     ① 运行 constructor 里的初始化逻辑（写入初始状态变量、给 immutable 赋值）；
//     ② 把「运行时字节码（runtime bytecode）」返回并存到链上这个新地址。
//   constructor 的代码只属于「创建阶段」，不会进入运行时字节码，
//   所以部署完成后你在合约里再也找不到、也无法二次调用 constructor。
//
// ------------------------------------------------------------

contract ConstructorDemo {
    // -------------------- 普通状态变量 --------------------
    // owner：合约拥有者。经典做法是在 constructor 里设为 msg.sender，
    // 即「谁部署，谁就是 owner」。它存在 storage 中，之后可以被改（若你写了改的函数）。
    address public owner;

    // name：合约的名字，构造时由部署者传入的参数决定。
    string public name;

    // -------------------- immutable 变量 --------------------
    // immutable：只能在「声明处」或「构造函数里」赋值一次，部署后永远不可修改。
    //   - 它的值在部署时被直接「烧」进运行时字节码，读取时不走 storage，因此更省 gas。
    //   - 适合存放「部署时确定、之后永不改变」的值，例如创建者、代币精度、初始时间戳等。
    address public immutable deployer;   // 记录部署者（与 owner 区别：owner 可改，deployer 不可改）
    uint256 public immutable createdAt;  // 记录部署时的区块时间戳

    // -------------------- constant 变量 --------------------
    // constant：编译期就必须确定的常量（不能依赖部署时才知道的值，如 msg.sender）。
    //   - 与 immutable 的区别：constant 在「写代码时」就固定；
    //     immutable 允许「部署时」才确定（可以用 msg.sender、block.timestamp 等）。
    uint256 public constant VERSION = 1;

    // ============================================================
    // 构造函数：带参数
    // ============================================================
    // constructor(...) 用 constructor 关键字声明（旧语法是与合约同名的函数，已废弃）。
    //   - 部署时执行一次，用于初始化。
    //   - 这里接收一个 _name 参数：在 Remix 部署时，Deploy 按钮旁会出现输入框，
    //     让你填入这个字符串（例如填 "MyContract"）。
    //   - 构造函数可以是 payable（部署时顺便收 ETH），本例不收款，故不加 payable。
    constructor(string memory _name) {
        // 谁部署谁是 owner —— 权限控制的最常见初始化。
        owner = msg.sender;

        // 用部署时传入的参数初始化 name。
        name = _name;

        // 给 immutable 变量赋值（只能赋一次）：
        deployer = msg.sender;       // 部署者地址，之后永不可改
        createdAt = block.timestamp; // 部署那一刻的时间戳，之后永不可改
    }

    // ============================================================
    // 演示：普通状态变量可改，immutable 不可改
    // ============================================================
    // owner 是普通状态变量，可以写函数把它转让给别人。
    function transferOwnership(address newOwner) public {
        require(msg.sender == owner, "only owner");
        require(newOwner != address(0), "zero address");
        owner = newOwner;
    }

    // ❌ 下面这个函数如果解注释会「编译报错」，因为 immutable 部署后不可再赋值：
    // function changeDeployer(address a) public {
    //     deployer = a; // Error: Cannot write to immutable here.
    // }

    // 一个只读函数，方便一次性观察各变量的值。
    function info()
        public
        view
        returns (
            address owner_,
            address deployer_,
            string memory name_,
            uint256 createdAt_,
            uint256 version_
        )
    {
        return (owner, deployer, name, createdAt, VERSION);
    }
}
