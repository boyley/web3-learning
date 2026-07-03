// ============================================================================
// 02-compile 的 Hardhat 配置。重点演示 solidity 编译器的细化配置。
// ============================================================================
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    // settings 里可以细调编译器。optimizer 会优化字节码、降低部署与调用 gas。
    settings: {
      optimizer: {
        enabled: true, // 开启优化器
        runs: 200,     // 200 = 兼顾“部署成本”和“调用成本”的常用折中值
      },
      // evmVersion: "cancun", // 需要指定 EVM 版本时打开（默认跟随编译器）
    },
  },
};
