// Hardhat 配置文件（CommonJS）。运行 `npx hardhat` 时会自动读取本文件。
// 说明：本教学项目采用「稳定成熟」的 Hardhat 2 + hardhat-toolbox（内置 ethers v6 +
// chai + mocha + hardhat-verify），文档最全、示例最多，最适合初学者。
// 注：Hardhat 3 已发布（默认改用 viem + node:test + Ignition），思路一致，见 README 说明。

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // 从 .env 读取私钥 / RPC / API Key（.env 已被 .gitignore）

// 从环境变量读取敏感信息，绝不硬编码到代码里！
// 缺省值仅为占位，保证在只跑本地测试（不连测试网）时也不会报错。
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // 编译器版本要 ≥ 合约里的 pragma（0.8.24）
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }, // 优化器：降低部署与调用 Gas
    },
  },
  networks: {
    // 本地内存链，跑测试用（无需配置任何密钥）
    hardhat: {},
    // Sepolia 测试网（模块 04 部署时使用）
    sepolia: {
      url: SEPOLIA_RPC_URL,
      // 只有配置了私钥才加入账户，避免空字符串导致启动报错
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  // 合约验证（模块 04）：把源码开源到 Etherscan
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};
