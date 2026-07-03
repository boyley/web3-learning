# 07 · 函数修饰器（Modifiers）
> modifier 把「函数执行前/后的公共检查与逻辑」抽出来复用，最经典的用途是 `onlyOwner` 权限控制。

## 📖 知识讲解

### 语法与 `_;` 占位符
```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Not owner"); // 前置逻辑
    _;                                         // 被修饰函数的函数体在此处「插入」执行
    // 这里还能写后置逻辑（可选）
}
```
- `_;` 是占位符，代表**被修饰函数的函数体**。执行流程：先跑 `_;` 之前的代码 → 到 `_;` 跳去执行函数体 → 回来跑 `_;` 之后的代码。
- 一个 modifier 里可以没有 `_;`（则函数体永不执行）或有多个（少见）。

### 权限控制 onlyOwner
- 用 `require(msg.sender == owner)` 限制只有 owner 能调用。`msg.sender` 是**直接调用者**。
- 生产中常直接用 OpenZeppelin 的 `Ownable` / `AccessControl`，原理与此一致。

### 带参数的 modifier
- modifier 可以像函数一样带参数：`modifier onlyManagerOr(address who) { ... }`，在函数上写 `... onlyManagerOr(allowed)`。

### 多个 modifier 叠加的顺序
- 写在函数签名上的多个 modifier **从左到右**依次「包裹」进入：
  `funcName() modA modB` → `modA` 前置 → `modB` 前置 → 函数体 → `modB` 后置 → `modA` 后置（像洋葱一层层包）。

### 前置 / 后置逻辑与重入锁
- `_;` 之前 = 前置（常做检查）；`_;` 之后 = 后置（常做收尾）。
- **重入锁 nonReentrant**：前置置锁 → 执行函数体 → 后置解锁；若函数体中的外部调用又重新进入本函数，会因锁已置而 revert。

## 🔄 流程图 / 原理图

函数调用经过 modifier 的执行顺序（以 `adminOnlyWhenActive() onlyOwner whenNotPaused` 为例）：

```mermaid
sequenceDiagram
    participant Caller as 调用者
    participant M1 as onlyOwner
    participant M2 as whenNotPaused
    participant Body as 函数体

    Caller->>M1: 调用 adminOnlyWhenActive()
    Note over M1: 前置: require(msg.sender==owner)
    M1->>M2: 到达 _; 进入下一个 modifier
    Note over M2: 前置: require(!paused)
    M2->>Body: 到达 _; 执行函数体
    Note over Body: counter += 1
    Body-->>M2: 函数体结束
    Note over M2: 后置逻辑(本例无)
    M2-->>M1: 回到外层 modifier
    Note over M1: 后置逻辑(本例无)
    M1-->>Caller: 交易完成
```

> 洋葱模型：最左的 modifier 在最外层，最先做前置、最后做后置。

## 💻 代码说明
- `onlyOwner`：经典权限 modifier，`transferOwnership` 用它保护。
- `onlyManagerOr(address)`：带参数 modifier，`managedAction` 演示。
- `whenNotPaused`（纯前置）与 `logAfter`（纯后置，`_;` 后 `counter += 100`）分别演示前置/后置。
- `adminOnlyWhenActive() onlyOwner whenNotPaused`：多 modifier 叠加，体会从左到右顺序。
- `nonReentrant` + `safeAction`：重入锁思路（前置上锁 `_locked=2`、后置解锁 `_locked=1`）。

## ▶️ 运行方式
1. 打开 https://remix.ethereum.org 。
2. File Explorer 新建 `Modifiers.sol`，粘贴本目录合约源码。
3. Solidity Compiler 选 0.8.x 编译。
4. Deploy & Run Transactions 里 Environment 选 **Remix VM (Cancun)**，Deploy 部署（部署账户即 owner）。
5. 调用观察：
   - 用部署账户调 `pause()` 成功；切换到 Remix 上方 Account 下拉的另一个账户再调 `pause()`，会因 `onlyOwner` 而 revert（"Not owner"）。
   - `doWithAfterLog()` 调用后看 `counter`：函数体 +1、modifier 后置 +100，共 +101，验证「后置逻辑」。
   - 先 `pause()` 再调 `doWhenActive()` 会 revert（"paused"），`unpause()` 后恢复。

## ⚠️ 常见坑 / 安全提示
- **绝不要用 `tx.origin` 做鉴权**：`tx.origin` 是最初发起交易的外部账户，攻击者可诱导你调用它的恶意合约、由该合约转调你的合约，此时 `tx.origin == 你`，鉴权被绕过（钓鱼攻击）。鉴权一律用 `msg.sender`。
- **忘写 `_;`**：modifier 里漏掉 `_;`，被修饰函数的函数体永远不会执行。
- **多 modifier 顺序有语义**：先鉴权还是先解锁/收费，顺序不同结果不同；把安全检查放在最外层（最左）。
- 转移所有权要校验 `newOwner != address(0)`，否则可能把合约「锁死」为无主。
- 重入锁只是思路演示；真实项目请用经过审计的 OpenZeppelin `ReentrancyGuard`，并遵循「检查-生效-交互（Checks-Effects-Interactions）」模式。

## 🔗 官方文档
- 函数修饰器：https://docs.soliditylang.org/zh/latest/contracts.html#function-modifiers
- 全局变量 msg.sender / tx.origin：https://docs.soliditylang.org/zh/latest/units-and-global-variables.html#block-and-transaction-properties
