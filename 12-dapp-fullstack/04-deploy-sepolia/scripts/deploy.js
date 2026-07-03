// 部署脚本：把 MyNFT 合约发布到 Sepolia 测试网
// 运行： npx hardhat run scripts/deploy.js --network sepolia
//
// 前提：已在 .env 里配置 SEPOLIA_RPC_URL、PRIVATE_KEY，且该私钥地址里有 Sepolia 测试 ETH。
//
// 把本文件放到「模块 03 的 Hardhat 工程」的 scripts/ 目录下即可（03 与 04 共用一个工程）。

const { ethers, network, run } = require("hardhat");

async function main() {
  // 取部署者（.env 里 PRIVATE_KEY 对应的账户）
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("======================================");
  console.log("部署网络:", network.name);
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", ethers.formatEther(balance), "ETH");
  console.log("======================================");

  // 1) 拿到合约工厂
  const MyNFT = await ethers.getContractFactory("MyNFT");

  // 2) 发起部署交易。构造函数需要 initialOwner —— 这里传部署者自己。
  console.log("正在部署 MyNFT ...");
  const nft = await MyNFT.deploy(deployer.address);

  // 3) 等待部署交易被打包上链
  await nft.waitForDeployment();
  const address = await nft.getAddress();
  console.log("✅ MyNFT 已部署到:", address);

  // 4)（可选）自动做 Etherscan 合约验证。
  //    本地网络不验证；测试网需要等几个区块确认后再验证，否则 Etherscan 还索引不到。
  if (network.name === "sepolia" && process.env.ETHERSCAN_API_KEY) {
    console.log("等待 5 个区块确认后再验证 ...");
    await nft.deploymentTransaction().wait(5);

    try {
      await run("verify:verify", {
        address: address,
        constructorArguments: [deployer.address], // 必须与部署时一致，否则验证失败
      });
      console.log("✅ 源码已在 Etherscan 验证并开源");
    } catch (e) {
      console.warn("验证失败（可能已验证过）:", e.message);
    }
  }

  console.log("\n下一步：把下面这行填进前端的合约地址配置（模块 06）：");
  console.log(`  export const CONTRACT_ADDRESS = "${address}";`);
  console.log("并到 https://sepolia.etherscan.io/address/" + address + " 查看你的合约。");
}

// 推荐的错误处理写法：捕获异常并以非 0 退出码结束，方便 CI 识别失败
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
