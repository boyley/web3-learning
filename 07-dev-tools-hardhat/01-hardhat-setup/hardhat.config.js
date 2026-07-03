// ============================================================================
// Hardhat 配置文件（CommonJS 格式，Hardhat 2.x 的默认写法）
// 这是每个 Hardhat 工程的“大脑”：编译器版本、网络、插件、任务都在这里配置。
// 运行任何 npx hardhat 命令时，Hardhat 会读取【当前目录】下的这个文件。
// ============================================================================

// 引入 hardhat-toolbox：一次性装好 ethers v6、chai 匹配器、network-helpers、
// gas-reporter、solidity-coverage、hardhat-verify 等常用插件。
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // Solidity 编译器版本。用近版本 0.8.x（本合集统一用 0.8.28）。
  solidity: "0.8.28",

  // networks 省略时，Hardhat 默认使用内置的 "hardhat" 内存链（见 05 模块）。
  // 需要连测试网时才在这里加 networks，见 07 模块。
};
