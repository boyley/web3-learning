// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
// InterfacesAbstract —— 接口（interface）与抽象合约（abstract contract）
// 教学用途，未经审计，勿直接上主网。
// ============================================================
//
// 本文件聚焦以下知识点：
//   1. interface：只有函数「签名」、没有实现；不能有状态变量、构造函数；
//      函数默认且必须是 external；用来定义「契约/规范」。
//   2. abstract contract：可以有部分实现 + 部分未实现函数；
//      含未实现函数的合约必须标 abstract，不能被直接部署，只能被继承。
//   3. 二者区别与使用场景。
//   4. 通过接口与「外部已部署合约」交互（IERC20 思路）。
//
// ------------------------------------------------------------

// ============================================================
// 一、interface —— 纯契约，只有函数签名
// ============================================================
// interface 的硬性规则：
//   - 不能有任何函数实现（只有签名）；
//   - 不能声明状态变量、不能有构造函数；
//   - 所有函数隐式为 external（不用写、也不能写成 public/internal）；
//   - 可以声明 event、error、以及自 0.8 起可含常量类型定义（enum/struct）。
// 典型用途：定义一套「谁实现谁就必须遵守」的方法规范。
interface IShape {
    // 只写签名，不写函数体。实现方必须提供 area() 的具体实现。
    function area() external view returns (uint256);

    function name() external view returns (string memory);
}

// ============================================================
// 二、abstract contract —— 可含部分实现
// ============================================================
// 与 interface 不同，abstract contract 可以：
//   - 有状态变量、构造函数；
//   - 既有「已实现」的函数，也有「未实现」的函数（用 virtual 且无函数体）。
// 只要合约里存在「未实现的函数」，它就必须被标为 abstract，且不能被直接部署。
//
// 这里 Shape 抽象合约：
//   - 已实现 describe()（复用逻辑，子类共享）；
//   - 未实现 area()（各种形状算法不同，留给子类实现）。
abstract contract Shape is IShape {
    string internal shapeName;

    constructor(string memory _name) {
        shapeName = _name;
    }

    // 已实现：所有形状通用的逻辑，子类直接复用。
    function name() external view override returns (string memory) {
        return shapeName;
    }

    // 已实现：复用 area() 结果做个描述。注意它调用了尚未实现的 area()，
    // 具体面积由子类提供 —— 这就是「模板方法」式的抽象复用。
    function describe() external view returns (string memory) {
        // 这里不能直接 string 拼 uint，简单返回名字即可（面积用 area() 单独查看）。
        return shapeName;
    }

    // 未实现（virtual 且无函数体）：因此 Shape 必须是 abstract，不能部署。
    // 子类必须 override 提供实现。
    function area() external view virtual override returns (uint256);
}

// ============================================================
// 三、具体实现合约 —— 可被部署
// ============================================================
// Rectangle 继承抽象合约 Shape，实现了 area()，因此是「具体合约」，可以部署。
contract Rectangle is Shape {
    uint256 public width;
    uint256 public height;

    // 通过 Shape("Rectangle") 把名字传给抽象父合约的构造函数。
    constructor(uint256 _w, uint256 _h) Shape("Rectangle") {
        width = _w;
        height = _h;
    }

    // 实现抽象父类留下的 area()。实现了全部未实现函数，才能成为可部署的具体合约。
    function area() external view override returns (uint256) {
        return width * height;
    }
}

// Circle 同样继承 Shape 并实现 area()，演示「同一接口/抽象，多种实现」。
contract Circle is Shape {
    uint256 public radius;

    constructor(uint256 _r) Shape("Circle") {
        radius = _r;
    }

    function area() external view override returns (uint256) {
        // 用 314/100 近似 π，教学示意（Solidity 无浮点数）。
        return (radius * radius * 314) / 100;
    }
}

// ============================================================
// 四、通过接口与「外部合约」交互（IERC20 思路）
// ============================================================
// 只要知道对方合约的「地址」和它遵循的「接口」，就能把地址「包装」成接口类型来调用它，
// 而无需拥有对方的完整源码。这正是与 ERC20 代币等外部合约交互的通用套路。
//
// 下面定义一个精简版 IERC20 接口，并写一个通过它读取/转账的调用方。
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 amount) external returns (bool);
}

contract TokenReader {
    // 传入某个 ERC20 代币合约地址 token 与账户 account，读取其余额。
    // IERC20(token) 把地址「视作」一个实现了 IERC20 的合约来调用。
    function readBalance(address token, address account) external view returns (uint256) {
        return IERC20(token).balanceOf(account);
    }

    // 通过接口调用外部代币的 transfer。
    // ⚠️ 真实场景中，有些代币不返回 bool（早期不规范实现），
    //     生产环境建议用 OpenZeppelin 的 SafeERC20；此处仅教学演示接口调用姿势。
    function sendToken(address token, address to, uint256 amount) external returns (bool) {
        return IERC20(token).transfer(to, amount);
    }
}
