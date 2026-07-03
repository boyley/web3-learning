// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// ★ Foundry 最大的特色：用 Solidity 本身写测试（不是 JS）！
//   forge-std 提供 Test 基类、断言（assertEq 等）、作弊码 vm.*。
import {Test, console} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";

contract CounterTest is Test {
    Counter public counter;

    // setUp 相当于每个测试前的初始化（类似 Hardhat 的 beforeEach）
    function setUp() public {
        counter = new Counter();
        counter.setNumber(0);
    }

    // 函数名以 test 开头 = 一个测试用例
    function test_Increment() public {
        counter.increment();
        assertEq(counter.number(), 1); // 断言相等
    }

    // 以 testFuzz 开头 = 模糊测试：Foundry 会自动喂大量随机入参！
    // 这是 Foundry 相对 Hardhat 的杀手锏之一。
    function testFuzz_SetNumber(uint256 x) public {
        counter.setNumber(x);
        assertEq(counter.number(), x);
    }
}
