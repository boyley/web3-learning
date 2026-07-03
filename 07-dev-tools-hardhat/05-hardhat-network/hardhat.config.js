require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    // 内置的 hardhat 内存链，可自定义参数（这些都有合理默认值，此处仅演示）
    hardhat: {
      chainId: 31337, // Hardhat 默认链 ID
      // 自动挖矿：每来一笔交易就立刻出块（默认开启）。
      // 想模拟真实网络的“定时出块”，可改成 interval 模式：
      // mining: { auto: false, interval: 3000 }, // 每 3 秒出一个块
      // accounts: { count: 20, accountsBalance: "10000000000000000000000" }, // 20 个账户各 10000 ETH
    },
  },
};
