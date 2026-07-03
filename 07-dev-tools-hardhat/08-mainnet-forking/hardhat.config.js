// ============================================================================
// 08-mainnet-forking 配置：把主网某个区块的状态“分叉”到本地内存链。
// 本地链会按需向 MAINNET_RPC_URL 拉取真实主网数据，让你在本地操控主网合约。
// ============================================================================
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: __dirname + "/../.env" });

const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      forking: {
        url: MAINNET_RPC_URL, // 需要一个归档/全节点端点（Alchemy/Infura）
        // 固定分叉区块号：让测试可复现（不写则用最新块，结果会变）
        blockNumber: 19000000,
        // 没配 RPC 时禁用分叉，避免报错（本地演示用）
        enabled: !!MAINNET_RPC_URL,
      },
    },
  },
};
