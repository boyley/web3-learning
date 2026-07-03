// ============================================================================
// deploy.js —— 部署 Box 到 Sepolia，并打印“下一步验证命令”
// 运行：npx hardhat run scripts/deploy.js --network sepolia
// 前置：在工程根 .env 配好 SEPOLIA_RPC_URL / PRIVATE_KEY，且账户有 Sepolia 测试币
// ============================================================================
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("部署账户:", deployer.address);
  const bal = await hre.ethers.provider.getBalance(deployer.address);
  console.log("余额:", hre.ethers.formatEther(bal), "ETH（需要少量 Sepolia 测试币）");

  const initialValue = 42;
  const Box = await hre.ethers.getContractFactory("Box");
  const box = await Box.deploy(initialValue);
  await box.waitForDeployment();

  const address = await box.getAddress();
  console.log("\n✅ Box 已部署到:", address);

  // 打印现成的验证命令。注意：构造参数要原样传给 verify！
  console.log("\n下一步，验证源码：");
  console.log(`npx hardhat verify --network sepolia ${address} ${initialValue}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
