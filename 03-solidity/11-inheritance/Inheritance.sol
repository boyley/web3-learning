// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// Inheritance —— 继承 / override / super
// 教学用途，未经审计，勿直接上主网。
// ============================================================
//
// 本文件聚焦以下知识点：
//   1. is 关键字：合约继承（子合约获得父合约的状态变量与函数）
//   2. virtual / override：父函数标 virtual 才能被覆盖，子函数覆盖时标 override
//   3. super：在子合约里调用「继承链上一层」的同名函数
//   4. 向父合约构造函数传参（两种写法）
//   5. 多重继承与 C3 线性化（super 的解析顺序、override(A, B) 的写法）
//
// 示例主线：Animal（动物基类）→ Dog（狗，继承并覆盖 Animal 的方法）。
//
// ------------------------------------------------------------

// ============================================================
// 基类 Animal
// ============================================================
contract Animal {
    string public species; // 物种名，由构造函数初始化

    // 父合约构造函数：带参数。子合约继承时必须把这个参数「喂」给它。
    constructor(string memory _species) {
        species = _species;
    }

    // virtual：声明「本函数允许被子合约覆盖（override）」。
    // 不加 virtual 的函数，子合约无法 override。
    function sound() public pure virtual returns (string memory) {
        return "some generic animal sound";
    }

    // 另一个可被覆盖的函数，用来演示 super（子类覆盖后仍想复用父类逻辑）。
    function describe() public view virtual returns (string memory) {
        return string.concat("I am a ", species);
    }
}

// ============================================================
// 子类 Dog：is Animal
// ============================================================
// is Animal 表示 Dog 继承 Animal，自动拥有 species、sound、describe。
//
// 【向父构造函数传参】有两种等价写法，本例用「在继承列表里传」：
//     contract Dog is Animal("Dog") { ... }         // 写法 A：继承处直接传常量
//   或
//     constructor() Animal("Dog") { ... }           // 写法 B：构造函数修饰符处传
//   写法 B 更灵活（能把子类构造参数转发给父类），这里演示写法 B。
contract Dog is Animal {
    string public name; // 狗的名字（子类新增状态）

    // 子类构造函数：接收 _name，并通过 Animal("Dog") 把 "Dog" 传给父构造函数。
    // 部署 Dog 时，会「先执行父 Animal 的 constructor，再执行 Dog 的 constructor」。
    constructor(string memory _name) Animal("Dog") {
        name = _name;
    }

    // override：覆盖父类的 sound()。父类该函数必须是 virtual，否则不能覆盖。
    function sound() public pure override returns (string memory) {
        return "Woof!";
    }

    // 用 super 复用父类逻辑：先拿到父类 describe() 的结果，再拼接补充。
    // super.describe() 会沿着「继承链的上一层」找同名函数（这里是 Animal.describe）。
    function describe() public view override returns (string memory) {
        return string.concat(super.describe(), ", my name is ", name);
    }
}

// ============================================================
// 多重继承与 C3 线性化
// ============================================================
// 下面演示「一个合约继承多个父合约」时，super 的调用顺序如何确定。
//
// Solidity 用 C3 线性化（C3 linearization）来确定继承的「线性顺序（MRO）」。
// 规则记忆点：
//   - 在 is 列表里，「越靠右 = 越接近基类（base）」「越靠左 = 越派生（derived）」。
//   - super 会按「线性化顺序」从当前合约往「更基类」的方向逐个调用。
//   - 若多个父合约都定义了同名 virtual 函数，子类 override 时要写 override(A, B) 列出它们。

contract Base {
    // 用事件记录调用轨迹，便于在 Remix 里观察 super 的传导顺序。
    event Log(string who);

    function foo() public virtual {
        emit Log("Base.foo");
    }
}

contract Left is Base {
    function foo() public virtual override {
        emit Log("Left.foo");
        super.foo(); // 继续沿线性化顺序向基类方向调用
    }
}

contract Right is Base {
    function foo() public virtual override {
        emit Log("Right.foo");
        super.foo();
    }
}

// Combined 同时继承 Left 和 Right（二者又都继承 Base）。
// 因为 foo 在 Left、Right 都被覆盖，这里 override(Left, Right) 要显式列出。
//
// C3 线性化顺序（从派生到基类）：Combined -> Right -> Left -> Base
//   （is Left, Right 中，Right 更靠右=更接近基类，故在链上比 Left 更「后」，
//    但 super 从 Combined.foo 出发时，会先到 Right 再到 Left 再到 Base。）
// 调用 Combined.foo() 时，Log 事件的顺序为：
//   Combined.foo -> Right.foo -> Left.foo -> Base.foo
contract Combined is Left, Right {
    function foo() public override(Left, Right) {
        emit Log("Combined.foo");
        super.foo(); // 触发 C3 线性化链式调用
    }
}
