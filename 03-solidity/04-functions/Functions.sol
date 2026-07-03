// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// Functions —— 函数（定义 / 参数 / 返回值 / view / pure）
// 教学用途，未经审计，勿直接上主网。
// ============================================================
//
// 本合约演示：
//   1. 函数定义：入参、返回值
//   2. 多返回值 + 命名返回值 + 解构接收
//   3. 状态可变性修饰：view（读状态不改）、pure（不读不改）、以及会改状态的普通函数
//   4. 函数可见性 public / external / internal / private 之间如何交互
//
contract Functions {
    // 一个状态变量，供下面的函数「读 / 写」以对比 view / pure / 普通函数。
    uint256 public total;

    // ============ 1) 基本函数：有参数、有返回值 ============
    // 入参 a、b；返回它们的和。
    // pure：既不读也不写任何状态变量，只对入参做纯计算。
    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;   // 0.8 起溢出会自动 revert
    }

    // ============ 2) 会「改状态」的普通函数 ============
    // 没有 view / pure 修饰 → 表示它可以修改状态。
    // 调用它是一笔交易（transaction），会上链、花 gas。
    function increase(uint256 _by) public {
        total += _by;   // 写状态：total 被修改
    }

    // ============ 3) view：读状态但不改 ============
    // view 承诺「不修改状态」，但允许「读取」状态变量。
    // 只读调用（call）不上链、不花 gas。
    function getTotalPlus(uint256 _extra) public view returns (uint256) {
        return total + _extra;  // 读了 total，但没有改它
    }

    // ============ 4) pure：既不读也不改 ============
    // pure 承诺「既不读也不写状态」，只用入参和局部变量做计算。
    // 若在 pure 里写了 total 或读了 total，编译器会报错。
    function multiply(uint256 a, uint256 b) public pure returns (uint256) {
        return a * b;
    }

    // ============ 5) 多返回值 + 命名返回值 ============
    // returns 里可声明多个返回值，并且可以给它们「命名」。
    // 命名返回值相当于预先声明的局部变量，赋值后可以直接 return; （省略具体值）。
    function divmod(uint256 a, uint256 b)
        public
        pure
        returns (uint256 quotient, uint256 remainder)  // 命名返回值
    {
        quotient  = a / b;   // 直接给命名返回值赋值
        remainder = a % b;
        // 这里可以写 return (quotient, remainder); 也可以直接 return;
        return (quotient, remainder);
    }

    // ============ 6) 解构接收多返回值 ============
    // 调用返回多个值的函数时，用 (x, y) = f(...) 解构；
    // 不需要的返回值可以用「空位」跳过：( , y) = f(...)
    function onlyRemainder(uint256 a, uint256 b) public pure returns (uint256) {
        (, uint256 r) = divmod(a, b);  // 跳过 quotient，只取 remainder
        return r;
    }

    // ============ 7) 函数可见性交互 ============
    // internal 函数：本合约 + 子合约可调用，外部不可见。常作为可复用逻辑。
    function _square(uint256 x) internal pure returns (uint256) {
        return x * x;
    }

    // private 函数：仅本合约内部可调用。
    function _addOne(uint256 x) private pure returns (uint256) {
        return x + 1;
    }

    // public 函数：内部可自由调用 internal / private 函数。
    function squarePlusOne(uint256 x) public pure returns (uint256) {
        return _addOne(_square(x));  // 先 internal 再 private，均合法
    }

    // external 函数：只能被外部调用；处理 calldata 参数通常更省 gas。
    // 若本合约内部想调它，必须写 this.externalDouble(...)（走一次外部调用，较贵）。
    function externalDouble(uint256 x) external pure returns (uint256) {
        return x * 2;
    }
}
