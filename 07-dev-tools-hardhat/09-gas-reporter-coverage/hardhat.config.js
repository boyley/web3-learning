// ============================================================================
// 09 配置：开启 gas 报告（hardhat-gas-reporter，toolbox 内置）。
// 覆盖率（solidity-coverage）无需额外配置，直接 npx hardhat coverage 即可。
// ============================================================================
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: __dirname + "/../.env" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  gasReporter: {
    // 用环境变量 REPORT_GAS 控制开关：默认关闭，避免每次测试都跑报告
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",          // 折算法币单位
    // 提供 CoinMarketCap key 后，可把 gas 折算成美元（可选）
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || undefined,
    // token: "ETH",          // 也可算成其它链的原生币价（如 MATIC）
    outputFile: undefined,     // 也可输出到文件，如 "gas-report.txt"
  },
};
