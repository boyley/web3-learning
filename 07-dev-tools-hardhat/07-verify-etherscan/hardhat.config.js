// ============================================================================
// 07-verify-etherscan 配置：连 Sepolia 测试网 + 配置 Etherscan 验证。
// 私钥、RPC、API Key 全部从 .env 读取，绝不硬编码！
// ============================================================================
require("@nomicfoundation/hardhat-toolbox");
// 加载 .env（本工程把 .env 放在工程根目录；也可放本模块目录）
require("dotenv").config({ path: __dirname + "/../.env" });

// 从环境变量取值，未配置时给安全的占位默认，避免脚本直接崩
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      // accounts 是私钥数组；只有在 .env 配了私钥时才传，避免空串报错
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111, // Sepolia 的 chainId
    },
  },
  // hardhat-verify 插件读这里的 key 去 Etherscan 提交源码验证
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};
