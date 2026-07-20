# 02 · 值类型（Value Types）
> 掌握 Solidity 最基础的一批「按值拷贝」类型：bool、整型、address、定长字节，以及它们的默认值、取值范围与类型转换。

## 📖 知识讲解

**什么是值类型？** 值类型（value types）在赋值、传参时会**完整拷贝一份数据**，两个变量互不影响。与之相对的是引用类型（`string`、动态 `bytes`、数组、`mapping`、`struct`），后者传递的是「位置引用」。本模块只讲值类型。

常用值类型：

| 类型 | 说明 | 默认值 | 取值范围（举例） |
|------|------|--------|------------------|
| `bool` | 布尔 | `false` | `true` / `false` |
| `uint8` | 8 位无符号整数 | `0` | `0 ~ 255`（`2^8-1`） |
| `uint256`（= `uint`） | 256 位无符号整数 | `0` | `0 ~ 2^256-1` |
| `int8` | 8 位有符号整数 | `0` | `-128 ~ 127` |
| `int256`（= `int`） | 256 位有符号整数 | `0` | `-2^255 ~ 2^255-1` |
| `address` | 20 字节以太坊地址 | `0x000...000` | 40 个十六进制字符 |
| `address payable` | 可支付地址 | `0x000...000` | 同上，额外有转账能力 |
| `bytes1` | 1 字节定长字节 | `0x00` | 单字节 |
| `bytes32` | 32 字节定长字节 | 全 `0` | 正好装一个哈希 |

要点：

- **整型位宽以 8 为步长**：`uint8, uint16, ..., uint256`；`int` 同理。`uint`/`int` 分别是 `uint256`/`int256` 的别名。
- **无符号 vs 有符号**：`uint` 只能表示 `0` 和正数；`int` 可表示负数。从 `0.8.0` 起，算术默认带溢出检查，超范围会 `revert`（而不是像旧版那样静默回绕）。
- **`address` 与 `address payable`**：
  - `address`：普通地址，只保存 20 字节数据。
  - `address payable`：在 `address` 基础上多了 `.transfer()` / `.send()` 等转账方法，用于「要给它打 ETH」的场景。
  - 转换：`payable(addr)` 把 `address` 变成 `address payable`；反向可直接隐式当作 `address` 用。
  - 常用成员：`addr.balance` 返回该地址的 ETH 余额（单位 **wei**，类型 `uint256`）。
- **`bytesN` 定长字节**：`bytes1 ~ bytes32`，长度固定，属于值类型，比动态 `bytes`/`string` 更省 gas；`bytes32` 常用来存 `keccak256` 哈希。
- **类型转换**：不同数值类型之间需**显式**转换。大位宽转小位宽会**截断高位**（如 `uint8(256) == 0`）；无符号与有符号互转要注意补码解释。

## 🔄 流程图 / 原理图

值类型分类归纳：

```mermaid
graph TD
    V[值类型 Value Types]
    V --> B["bool<br/>true / false"]
    V --> N[整型 Integer]
    V --> A[address]
    V --> BY[定长字节 bytesN]
    V --> E[enum 枚举]

    N --> U["uint8 / uint16 / ... / uint256<br/>无符号, 默认 0"]
    N --> I["int8 / int16 / ... / int256<br/>有符号, 可负"]

    A --> A1["address<br/>普通地址"]
    A --> A2["address payable<br/>可转账 .transfer/.send"]
    A1-.->|""payable(addr)""| A2

    BY --> BY1["bytes1 ... bytes32<br/>定长, 省 gas"]
```

## 💻 代码说明

- **bool**：`flagDefault`（未赋值 → `false`）、`flagTrue = true`。
- **uint**：`smallNumber` 用 `uint8` 存最大值 `255`；`bigNumber` 用 `uint256`；`zeroDefault` 演示默认 `0`。
- **int**：`signedNumber = -42` 演示负数。
- **address**：`someAddress`（普通）、`payableAddress`（`payable(...)` 转出的可支付地址）、`zeroAddress`（默认零地址）。函数 `getBalance(address)` 演示内置成员 `.balance`。
- **bytesN**：`oneByte = 0xAB`（`bytes1`）、`wordHash = keccak256(...)`（`bytes32` 哈希）、`zeroBytes32`（默认全 0）。
- **类型转换**：`downcast(uint256)` 返回 `uint8`，演示高位截断（`256 → 0`）；`toPayable(address)` 演示 `payable(...)` 转换。
- 所有状态变量都是 `public`，部署后可直接点自动 getter 查看值；两个转换函数是 `pure`（既不读也不改状态），`getBalance` 是 `view`（只读）。

## ▶️ 运行方式

1. 打开 Remix：<https://remix.ethereum.org>
2. 在 **File Explorer** 新建 `ValueTypes.sol`，粘贴本模块合约源码。
3. 打开 **Solidity Compiler**，版本选 `0.8.x`，点击 **Compile ValueTypes.sol**。
4. 打开 **Deploy & Run Transactions**，**Environment** 选 **Remix VM**，点击 **Deploy**。
5. 在 **Deployed Contracts** 里逐个点蓝色 getter（`flagTrue`、`smallNumber`、`signedNumber`、`oneByte`、`wordHash` 等）观察各类型的值与默认值。
6. 调用函数验证：
   - `getBalance`：从页面上方 **Account** 复制一个账户地址粘进去，查它的余额（Remix VM 账户默认有 100 ETH，返回值是 wei）。
   - `downcast`：输入 `256` → 返回 `0`；输入 `257` → 返回 `1`，直观感受截断。
   - `toPayable`：输入任意地址，返回同一地址（类型变为 payable）。

## ⚠️ 常见坑 / 安全提示

- **位宽截断丢数据**：`uint8(x)` 只保留低 8 位，`256` 会变 `0`。缩小位宽前务必确认数值不会超范围。
- **误以为 0.8 会静默回绕**：从 `0.8.0` 起，普通算术溢出会 `revert`；如需旧的回绕行为要显式写 `unchecked { ... }`（一般不建议）。
- **`address` 不能直接转账**：想 `.transfer()` 必须先是 `address payable`，用 `payable(addr)` 转换。
- **`.balance` 单位是 wei**：`1 ether == 10^18 wei`，别把 wei 当成「个」来读。
- **零地址 `address(0)` 要小心**：很多逻辑（如转账、设置 owner）应显式拒绝零地址，否则可能造成资产/权限永久丢失。
- **安全提示**：本合约仅供教学，未经审计；只在 Remix VM / 测试网练习，绝不上主网、绝不使用真实资产与私钥。

## 🔗 官方文档

- 类型总览（中文）：<https://docs.soliditylang.org/zh/latest/types.html>
- 值类型详解：<https://docs.soliditylang.org/zh/latest/types.html#value-types>
- address 类型与成员：<https://docs.soliditylang.org/zh/latest/types.html#address>
- 定长字节数组 bytesN：<https://docs.soliditylang.org/zh/latest/types.html#fixed-size-byte-arrays>
- 以太与 wei 单位：<https://docs.soliditylang.org/zh/latest/units-and-global-variables.html#ether-units>
