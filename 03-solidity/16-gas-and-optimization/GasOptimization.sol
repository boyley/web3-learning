// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GasOptimization gas 消耗与优化技巧演示
 * @notice 教学用途，未经审计，勿直接上主网。
 * @dev gas 是 EVM 执行每个操作的「计价单位」，最终手续费 = gasUsed × gasPrice。
 *      写链上状态（SSTORE）最贵，读状态（SLOAD）次之，纯内存/计算便宜。
 *      本文件用「未优化 vs 优化」两个合约对照，覆盖常见优化技巧：
 *        1. 变量打包（packing）：多个小变量塞进同一个 32 字节 storage slot。
 *        2. calldata 代替 memory 做 external 入参。
 *        3. custom error 代替 require 字符串（省部署与调用 gas）。
 *        4. constant / immutable 代替普通状态变量（不占 storage）。
 *        5. 把 storage 缓存到 memory，循环里避免重复 SLOAD。
 *        6. 短路求值、减少 SSTORE 次数、unchecked 省溢出检查。
 */

/*//////////////////////////////////////////////////////////////
                        未优化版本（反面教材）
//////////////////////////////////////////////////////////////*/
contract GasUnoptimized {
    // ❌ 三个变量各占一个 slot：uint256 塞满一整槽，后面小变量无法与它打包
    uint256 public a; // slot 0
    uint8 public smallB; // slot 1（本可与其它小变量打包，却被大变量隔开）
    uint256 public c; // slot 2
    uint8 public smallD; // slot 3

    // ❌ require 带长字符串：字符串要占用部署字节码和运行内存
    function setA(uint256 v) external {
        require(v != 0, "value must not be zero and this string costs gas");
        a = v;
    }

    // ❌ 循环里反复读 storage（每次 items.length 和 total 都触发 SLOAD/SSTORE）
    uint256[] public items;
    uint256 public total;

    function sumAll() external {
        for (uint256 i = 0; i < items.length; i++) {
            // items.length 每轮 SLOAD；total 每轮 SLOAD+SSTORE
            total += items[i];
        }
    }

    function pushItem(uint256 v) external {
        items.push(v);
    }

    // ❌ 用 memory 接收大数组入参（会把 calldata 拷进内存）
    function sumInput(uint256[] memory data) external pure returns (uint256 s) {
        for (uint256 i = 0; i < data.length; i++) {
            s += data[i];
        }
    }
}

/*//////////////////////////////////////////////////////////////
                          优化版本
//////////////////////////////////////////////////////////////*/
contract GasOptimized {
    // ✅ 变量打包：把小变量排在一起，编译器把它们塞进同一个 32 字节 slot
    //    uint128 + uint64 + uint64 = 256 bit = 1 slot（原本要 3 个 slot）
    uint128 public a; // ┐
    uint64 public smallB; // ├─ slot 0（三者共用一个槽）
    uint64 public smallD; // ┘
    uint256 public c; // slot 1

    // ✅ constant / immutable 不占 storage：
    //    constant 编译进字节码；immutable 部署时写入字节码，读取无 SLOAD
    uint256 public constant MAX_SUPPLY = 1_000_000; // 编译期常量
    address public immutable owner; // 部署时确定，之后只读

    // ✅ custom error 代替 require 字符串：更省部署与调用 gas
    error ValueIsZero();

    uint256[] public items;
    uint256 public total;

    constructor() {
        owner = msg.sender; // immutable 仅能在构造函数赋值一次
    }

    // ✅ custom error + 短路：条件不满足才 revert，不携带字符串
    function setA(uint128 v) external {
        if (v == 0) revert ValueIsZero();
        a = v;
    }

    function pushItem(uint256 v) external {
        items.push(v);
    }

    // ✅ 关键优化：把 storage 缓存到 memory，循环内只操作局部变量，
    //    结束后一次性写回；length 也缓存，避免每轮 SLOAD。
    function sumAll() external {
        uint256[] memory cached = items; // 一次性把数组读进内存
        uint256 len = cached.length; // 缓存长度
        uint256 sum = 0; // 局部累加器（在栈上，几乎免费）
        for (uint256 i = 0; i < len;) {
            sum += cached[i];
            // ✅ i 受 len 约束不会溢出，用 unchecked + ++i 省掉每轮溢出检查
            unchecked {
                ++i;
            }
        }
        total = sum; // 只在最后写一次 storage（1 次 SSTORE）
    }

    // ✅ calldata 代替 memory：external 只读入参不拷贝，最省
    function sumInput(uint256[] calldata data) external pure returns (uint256 s) {
        uint256 len = data.length; // 缓存长度
        for (uint256 i = 0; i < len; i++) {
            s += data[i];
        }
    }

    // ✅ unchecked 递增：在确定不溢出的循环里省掉每次 +1 的溢出检查
    function countUnchecked(uint256 n) external pure returns (uint256 x) {
        for (uint256 i = 0; i < n;) {
            x += i;
            unchecked {
                ++i; // 省 gas 的循环递增写法
            }
        }
    }
}
