// 04 · Gas 与手续费 —— 本地按 EIP-1559 公式算费 + 联网读取当前费率
// 运行前：在 02-ethereum 目录执行 `npm install`
// 运行：  node demo.js

import { ethers } from "ethers";

const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const provider = new ethers.JsonRpcProvider(RPC_URL);

// ---------------------------------------------------------------
// 第一部分：纯本地，按 EIP-1559 公式拆解一笔手续费的去向。
//   实付单价 = baseFee + priorityFee
//   手续费   = gasUsed × 实付单价
//   其中 baseFee 部分被销毁，priorityFee 部分给验证者，maxFee 多余部分退还。
// ---------------------------------------------------------------
function calcFeeLocally({ gasUsed, baseFeeGwei, priorityFeeGwei, maxFeeGwei }) {
  const gwei = (n) => ethers.parseUnits(String(n), "gwei"); // gwei -> wei(BigInt)

  const baseFee = gwei(baseFeeGwei);
  const priority = gwei(priorityFeeGwei);
  const maxFee = gwei(maxFeeGwei);

  // 实付单价 = min(maxFee, baseFee + priorityFee)
  const wanted = baseFee + priority;
  const actualPerGas = wanted < maxFee ? wanted : maxFee;

  const totalFee = BigInt(gasUsed) * actualPerGas; // wei
  const burned = BigInt(gasUsed) * baseFee; // 被销毁
  const toValidator = totalFee - burned; // 给验证者（= gasUsed × 实际小费）
  const refunded = BigInt(gasUsed) * (maxFee - actualPerGas); // 退还给用户

  console.log("【本地计算 · EIP-1559 手续费拆解】");
  console.log(`  gasUsed        = ${gasUsed}`);
  console.log(`  baseFee        = ${baseFeeGwei} gwei（协议定价，将被销毁）`);
  console.log(`  priorityFee    = ${priorityFeeGwei} gwei（小费，给验证者）`);
  console.log(`  实付单价       = ${ethers.formatUnits(actualPerGas, "gwei")} gwei`);
  console.log(`  ── 手续费合计  = ${ethers.formatEther(totalFee)} ETH`);
  console.log(`     🔥 销毁     = ${ethers.formatEther(burned)} ETH`);
  console.log(`     给验证者    = ${ethers.formatEther(toValidator)} ETH`);
  console.log(`     退还用户    = ${ethers.formatEther(refunded)} ETH`);
  console.log("");
}

// ---------------------------------------------------------------
// 第二部分：联网读取 Sepolia 当前费率，估算一笔纯转账(21000 gas)的费用。
// ---------------------------------------------------------------
async function estimateFromLiveNetwork() {
  console.log("=== 读取 Sepolia 当前实时费率 ===");
  const fee = await provider.getFeeData();
  const block = await provider.getBlock("latest");
  const baseFee = block?.baseFeePerGas ?? 0n;

  console.log("  当前 baseFee        :", ethers.formatUnits(baseFee, "gwei"), "gwei");
  console.log("  建议 maxFeePerGas   :", fee.maxFeePerGas ? ethers.formatUnits(fee.maxFeePerGas, "gwei") + " gwei" : "-");
  console.log("  建议 priorityFee    :", fee.maxPriorityFeePerGas ? ethers.formatUnits(fee.maxPriorityFeePerGas, "gwei") + " gwei" : "-");

  // 估算纯转账费用：gasUsed 固定 21000，单价用 baseFee + 建议小费
  const priority = fee.maxPriorityFeePerGas ?? ethers.parseUnits("1", "gwei");
  const perGas = baseFee + priority;
  const est = 21000n * perGas;
  console.log("  → 估算一笔纯转账(21000 gas)手续费 ≈", ethers.formatEther(est), "ETH");
  console.log("");
}

async function main() {
  // 用官方文档同款示例数据验证公式
  calcFeeLocally({ gasUsed: 21000, baseFeeGwei: 10, priorityFeeGwei: 2, maxFeeGwei: 30 });

  try {
    await estimateFromLiveNetwork();
  } catch (e) {
    console.log("联网读取失败（公共 RPC 超时），本地公式部分已足够理解：", e.message);
  }
}

main().catch((err) => console.error("运行出错:", err.message));
