# 00 · Web3 学习教程与资源清单（Learning Resources & Roadmap）

> 从 0 到「能独立写、测、部署智能合约」的**教程地图**。本仓库各工程（01~12）是**概念+代码索引**，本文是配套的**外部权威教程清单 + 学习顺序 + 避坑**。标注了 🇨🇳中文友好度，所列均免费或有免费版。

---

## 🗺️ 一、先搞清楚学什么（四层能力）

```
① 区块链概念   → 区块/交易/共识/钱包/Gas          理解"为什么"      → 本仓库 01-02
② Solidity 语言 → 智能合约编程语言                 核心技能          → 本仓库 03
③ 开发框架工具  → Foundry / Hardhat + 部署测试     工程化            → 本仓库 07
④ 应用 & 安全   → DeFi/NFT(代币标准) + 合约安全审计  进阶 / 就业       → 本仓库 04/06
⑤ 前端 dApp     → ethers/viem + 钱包 + wagmi        全栈打通          → 本仓库 08-12
```

> 用法：**本仓库当"目录/索引"**（概念讲解 + 可运行 demo），下面的外部教程当"实操大课"，两者对照学效率最高。

---

## 📚 二、核心教程清单（按学习顺序）

| 阶段 | 教程 | 语言 | 说明 |
|---|---|:--:|---|
| **入门概念** | [ethereum.org/developers](https://ethereum.org/zh/developers/) | 🇨🇳中文 | 官方开发者门户，概念最权威、免费 |
| **Solidity 入门** ⭐ | **WTF Academy** — [wtf.academy](https://wtf.academy) | 🇨🇳中文 | 首推。中文 Solidity 101，一节一个小合约，最适合中文起步 |
| **游戏化练手** | [CryptoZombies](https://cryptozombies.io/zh) | 🇨🇳中文 | 边玩边写 Solidity，零基础友好 |
| **系统大课** ⭐ | **Patrick Collins** freeCodeCamp（32h）/ [Cyfrin Updraft](https://updraft.cyfrin.io) | 🇬🇧英文 | 全网最经典 Solidity + Foundry 全栈课，免费 |
| **动手闯关** | [Speedrun Ethereum](https://speedrunethereum.com)（scaffold-eth） | 🇬🇧英文 | 一个个真实 dApp 挑战，练工程能力 |
| **官方文档** | [Solidity 文档](https://docs.soliditylang.org/zh/) · [Foundry Book](https://book.getfoundry.sh) · [Hardhat](https://hardhat.org) | 🇨🇳/🇬🇧 | 边学边查；合约库用 [OpenZeppelin](https://docs.openzeppelin.com/contracts) |
| **中文社区** | **登链社区** — [learnblockchain.cn](https://learnblockchain.cn) | 🇨🇳中文 | 中文最大区块链开发社区，翻译 + 问答 + 教程 |
| **安全闯关** ⭐ | [Ethernaut](https://ethernaut.openzeppelin.com) · [Damn Vulnerable DeFi](https://www.damnvulnerabledefi.xyz) | 🇬🇧英文 | 进阶必做，合约安全靠打关卡学最快 |
| **前端连链** | [ethers.js](https://docs.ethers.org) · [viem](https://viem.sh) · [wagmi](https://wagmi.sh) · [RainbowKit](https://rainbowkit.com) | 🇬🇧英文 | dApp 前端交互，见本仓库 08/10 |
| **进阶/审计** | [RareSkills](https://rareskills.io) · [secureum](https://secureum.xyz) | 🇬🇧英文 | 深入 EVM、Gas 优化、审计方向 |

---

## 🎯 三、推荐学习路线（含时间节奏）

| 周期 | 做什么 | 配套本仓库 |
|---|---|---|
| **第 1 周** | ethereum.org 过概念 + CryptoZombies 找感觉，搞懂钱包 / Gas / 交易 | `01`、`02` |
| **第 2–4 周** | **WTF Academy 全套**（中文），把 Solidity 语法 + ERC20/ERC721 吃透 | `03`、`06` |
| **第 2 月** | Patrick Collins 大课，重点学 **Foundry**（写测试、部署到 Sepolia 测试网） | `07` |
| **第 3 月** | Speedrun Ethereum 做几个 dApp + Ethernaut / DVD 刷合约安全 | `04`、`12` |
| **第 4 月** | 前端连链（ethers/viem + wagmi + 钱包），打通全栈 dApp | `08`~`12` |

### 后端/有编程基础的同学优势
- 合约的"状态 + 事务原子性 + Gas≈性能优化"思维，与后端经验高度相通。
- **Foundry 用代码写测试/部署**（类似单元测试 + CI），比纯前端出身上手快。
- 短板通常是**前端 dApp 交互**（ethers/viem/wagmi），可放到最后集中补。

---

## ⚠️ 四、避坑清单

- ✅ **只在测试网练手**（Sepolia），用水龙头领测试币；**永远别把主网私钥 / 助记词写进代码或提交到 Git**。
- ✅ 认准 **Foundry**（当前主流）+ 了解 Hardhat；老的 Truffle 可跳过。
- ⚠️ 别一上来啃 EIP / 黄皮书，先跑通"**写 → 测 → 部署**"闭环再深入原理。
- ⚠️ 教程**中英搭配**：中文打基础（WTF + 登链）、英文进阶（Patrick + Ethernaut），只等中文资源会滞后。
- ⚠️ 合约一旦部署**不可改**（除非用可升级代理），上主网前务必测试 + 审计。

---

## ✅ 五、自查清单（学到什么程度算入门）

- [ ] 能解释：区块 / 交易 / Gas / 钱包私钥 / 公链 vs 测试网
- [ ] 能用 Solidity 写并在 Remix 部署一个 ERC-20 代币
- [ ] 能用 **Foundry** 写测试、部署合约到 Sepolia 测试网
- [ ] 能说出至少 3 个合约漏洞（重入 / 权限 / 溢出）及防御
- [ ] 能用 ethers/viem + 钱包，让前端页面调用你的合约

---

> 权威入口：[ethereum.org](https://ethereum.org/zh/developers/) · 中文首选：[WTF Academy](https://wtf.academy) + [登链社区](https://learnblockchain.cn)。学完概念后从本仓库 [`03-solidity`](03-solidity) 开始动手。
