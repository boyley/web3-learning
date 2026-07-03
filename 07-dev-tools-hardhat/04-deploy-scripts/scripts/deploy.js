// ============================================================================
// deploy.js —— 用 ethers v6 部署合约的标准脚本
// 运行：
//   npx hardhat run scripts/deploy.js                     # 部署到临时内存链（跑完即销毁）
//   npx hardhat run scripts/deploy.js --network localhost # 部署到已启动的本地节点
// ============================================================================
const hre = require("hardhat");

async function main() {
  // 1) 拿到部署者账户（当前网络的第一个 signer），打印地址与余额
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", hre.ethers.formatEther(balance), "ETH");

  // 2) 拿到合约工厂，并传入构造参数进行部署
  const initialValue = 42;
  const Box = await hre.ethers.getContractFactory("Box");
  const box = await Box.deploy(initialValue); // 发出部署交易

  // 3) 等待部署交易被打包确认
  await box.waitForDeployment();

  // 4) ethers v6：用 getAddress() / box.target 取合约地址
  const address = await box.getAddress();
  console.log("Box 已部署到:", address);

  // 5) 立刻调用一次验证
  console.log("初始 retrieve():", (await box.retrieve()).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
