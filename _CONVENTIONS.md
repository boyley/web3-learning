# Web3 学习合集 · 统一规范（所有工程 / 所有 sub-agent 必须遵守）

> 本文件是所有工程、所有模块的**唯一风格标准**。任何 agent 生成内容前先读本文件。风格对齐姊妹项目 `../frontend-learning`。

## 一、总目录结构

```
web3-learning/
├── README.md                      ← 总览 + 学习路线图
├── _CONVENTIONS.md                ← 本文件
├── 01-blockchain-basics/          ← 工程：一个知识模块一个工程目录
│   ├── README.md                  ← 工程级 README（模块索引表 + 学习路线 Mermaid 图）
│   ├── 01-what-is-blockchain/     ← 模块：一个知识点一个模块
│   │   ├── README.md              ← 模块 README（讲解 + Mermaid 图 + 运行方式）
│   │   └── demo.js / demo.sol / index.html …
│   └── …
└── 02-… ~ 12-…
```

## 二、命名

- 工程目录：`NN-栈名`（两位数字 + kebab-case）。
- 模块目录：`NN-knowledge-point`（两位数字 + kebab-case），编号体现官方推荐学习顺序、由易到难。

## 三、每个模块必须包含

1. **一个尽量可运行/可验证的 demo**（聚焦一个知识点）。
2. **模块 README.md**，固定结构：
   ```
   # NN · 知识点中文名（English Name）
   > 一句话说明这个知识点是什么、解决什么问题。

   ## 📖 知识讲解
   ## 🔄 流程图 / 原理图        （至少 1 个 Mermaid 图）
   ## 💻 代码说明
   ## ▶️ 运行方式
   ## ⚠️ 常见坑 / 安全提示
   ## 🔗 官方文档
   ```
3. 代码内**详细中文注释**。

## 四、流程图（重点）

- 用 **Mermaid**。每模块至少 1 个图。
- 交易上链、区块结构、默克尔树、共识、Gas、EVM 执行、钱包连接握手（EIP-1193）、签名验证、合约调用时序、重入攻击、代币转账流程等**必须配图**（flowchart / sequenceDiagram / stateDiagram / graph 按内容选）。

## 五、运行方式（Web3 特有：CDN/免安装 + 脚手架 结合）

- **区块链原理模块**（哈希、默克尔树、签名等）：用**纯 JS demo**（浏览器打开 `index.html` 或 `node demo.js`），借助 `crypto`/`ethers` 演示概念，免链免钱包。
- **Solidity 合约模块**：`.sol` 源码 + **优先用 Remix 在线 IDE**（https://remix.ethereum.org ，浏览器免安装编译/部署/调用）。README 写清"复制到 Remix → 编译 → 部署到 Remix VM → 调用"的步骤。进阶再用 Hardhat。
- **开发框架模块**（Hardhat/Foundry）：给出完整最小工程 + `npm install` / `npx hardhat` 命令。
- **前端交互模块**（ethers/viem）：CDN `<script>` 或 Node 脚本；连链用**公共测试网 Sepolia** 或本地 Hardhat 节点。
- **React dApp 模块**（wagmi/RainbowKit）：Vite 脚手架，写清 `npm install && npm run dev`。

## 六、安全底线（强制，写进相关模块的「安全提示」）

- **只用测试网**（Sepolia 等）+ 水龙头测试币；**绝不使用主网真实资产**。
- **绝不在代码/仓库里出现真实私钥、助记词、API Key**；示例用占位符或 `.env`（并 gitignore）。
- 涉及签名/授权（approve）的 demo，必须说明风险（钓鱼签名、无限授权）。
- 合约示例默认标注"教学用途，未经审计，勿直接上主网"。

## 七、内容语言

- 讲解、注释、README 一律**中文**；标识符、API、合约关键字用英文。
- 必须**对照官方/权威文档**整理（README 末尾附官方链接），确保不遗漏、不过时（Solidity 用近版本 ^0.8.x；ethers 用 v6；wagmi 用 v2）。

## 八、质量底线

- demo 真实、能在指定环境（Remix / Node / 浏览器 / testnet）跑通或可复现。
- 宁少而精；一个模块讲透一个点。
- 工程级 README 要有完整模块索引表 + 学习路线 Mermaid 图。
