// ============================================================================
// network-demo.js —— 玩转内置 Hardhat Network：查看账户、手动挖矿、时间旅行、改余额
// 运行：npx hardhat run scripts/network-demo.js
//
// 这些“作弊能力”只有本地开发链才有，真实网络做不到——正是本地测试的威力。
// 来自 @nomicfoundation/hardhat-network-helpers。
// ============================================================================
const hre = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  const { ethers } = hre;

  // ---- 1) 内置测试账户：默认 20 个，每个预充 10000 ETH，私钥公开（仅本地）----
  const signers = await ethers.getSigners();
  console.log("内置账户数量:", signers.length);
  console.log("账户[0]:", signers[0].address);
  const bal0 = await ethers.provider.getBalance(signers[0].address);
  console.log("账户[0]余额:", ethers.formatEther(bal0), "ETH");

  // ---- 2) 查看当前区块高度 ----
  console.log("\n当前区块高度:", await ethers.provider.getBlockNumber());

  // ---- 3) 手动挖矿：凭空推进区块（真实链做不到）----
  await helpers.mine(5); // 一次挖 5 个空块
  console.log("挖 5 个块后高度:", await ethers.provider.getBlockNumber());

  // ---- 4) 时间旅行：把链上时间往后拨（测试“锁仓到期/质押解锁”等）----
  const before = (await ethers.provider.getBlock("latest")).timestamp;
  await helpers.time.increase(7 * 24 * 60 * 60); // 快进 7 天
  const after = (await ethers.provider.getBlock("latest")).timestamp;
  console.log("\n时间快进前:", before, "→ 快进 7 天后:", after);

  // ---- 5) 修改任意账户余额（凭空发钱，方便造测试场景）----
  const target = signers[1].address;
  await helpers.setBalance(target, ethers.parseEther("999999"));
  const newBal = await ethers.provider.getBalance(target);
  console.log("\n已把账户[1]余额改为:", ethers.formatEther(newBal), "ETH");

  // ---- 6) 伪装成任意地址发交易（impersonate，测试主网合约时超有用，见 08）----
  const whale = "0x000000000000000000000000000000000000dEaD";
  await helpers.impersonateAccount(whale);
  console.log("\n已可伪装成地址:", whale);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
