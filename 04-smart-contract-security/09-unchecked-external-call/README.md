# 09 · 未检查的低级外部调用返回值（Unchecked External Call）
> 低级调用 `call` / `send` 失败时**不会 revert，只返回 false**。不检查返回值，合约就会"以为转账成功"继续执行，导致账本与真实资金不一致、资金静默丢失。

> ⚠️ `Vulnerable.sol` **仅供学习、请勿用于攻击真实合约**。

## 📖 知识讲解

### 三种转账方式的失败语义
| 方式 | 失败时行为 | gas | 结论 |
| --- | --- | --- | --- |
| `addr.transfer(x)` | **自动 revert** | 固定 2300 | 会拦住失败，但 2300 gas 太少，可能误伤合约钱包 |
| `addr.send(x)` | **返回 `false`（不 revert）** | 固定 2300 | 必须手动检查返回值 |
| `addr.call{value:x}("")` | **返回 `(false, data)`（不 revert）** | 转发全部 gas（可指定） | **推荐**，但**必须** `require(success)` |

社区现行最佳实践：**用 `call` 转账 + 检查返回值 + 配合 CEI/ReentrancyGuard**（`transfer`/`send` 的固定 2300 gas 在多次以太坊硬分叉后已不可靠）。

### 漏洞后果
- **资金静默丢失**：`withdrawBad` 先扣账本，再 `call` 但不检查。对方拒收时转账失败、账本却减了，用户的钱"账减了、币没到"。
- **批量发放错乱**：`payoutBad` 里某个 `send` 失败被吞，合约以为全发成功，账目与实际不符。
- **业务逻辑被欺骗**：某些合约把"call 成功"当成前置条件，未检查会让后续逻辑基于错误前提执行。

## 🔄 未检查调用的问题流程图

```mermaid
flowchart TD
    A["用户 withdrawBad(1 ETH)"] --> B["balances 先减 1 ETH"]
    B --> C["call{"value:1"}('') 转账"]
    C --> D{"对方是拒收合约<br/>call 返回 false"}
    D --> E["❌ 返回值被忽略,继续执行"]
    E --> F["账本: 减了 1 ETH<br/>实际: 钱没转出去"]
    F --> G["用户资金凭空蒸发 💀"]

    H["Secure: require(ok)"] --> I["call 失败 → 整体 revert"]
    I --> J["账本回滚,资金一致 ✅"]

    style G fill:#ff9090
    style J fill:#c0ffc0
```

## 💻 代码说明
- `Vulnerable.sol`：`withdrawBad` 忽略 `call` 返回值；`payoutBad` 忽略 `send` 返回值。
- `Secure.sol`：所有外部调用都 `require(ok)`；批量发放改用 Pull Payment（`allocate` 记账 + `claim` 自取）；`safeExternalCall` 演示一般性调用也要检查。

## ▶️ 运行方式（Remix 复现）

1. 部署一个"拒收合约"：新建含 `receive() external payable { revert(); }` 的小合约并部署（模拟无法收款的地址）。
2. 部署 `VulnerableBank`，用拒收合约（或普通账户）`deposit()` 一些 ETH。
3. 从拒收合约触发 `withdrawBad`（或用普通账户理解流程）：说明 `call` 失败但返回值被忽略，`balances` 已被扣减而 ETH 未转出 —— 账实不符。
4. **验证修复**：`SecureBank.withdraw` 在同样情况下 `require(ok)` 失败会**整体 revert**，`balances` 不变，资金安全。

## ⚠️ 常见坑 / 安全提示
- **每个 `call` / `send` / `delegatecall` / `staticcall` 都要检查布尔返回值**，编译器对未使用返回值会给告警。
- 优先 `call{value:...}("")` 转账 + `require(success)`，而非 `transfer`/`send`。
- 与 ERC20 交互用 **OpenZeppelin `SafeERC20`**：很多老代币（如 USDT）转账不返回 bool 或失败返回 false，`safeTransfer` 会统一处理。
- 检查返回值后仍要防重入（结合模块 01）。

## 🔗 官方文档
- Solidity – 发送和接收以太、call 的返回值：https://docs.soliditylang.org/zh/latest/security-considerations.html
- SWC-104 Unchecked Call Return Value：https://swcregistry.io/docs/SWC-104
- OpenZeppelin SafeERC20：https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#SafeERC20
- Consensys – External Calls：https://consensysdiligence.github.io/smart-contract-best-practices/development-recommendations/general/external-calls/
