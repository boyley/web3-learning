// 06 · 区块与世界状态 —— 用 ethers v6 只读地读取真实区块，验证链式结构
// 运行前：在 02-ethereum 目录执行 `npm install`
// 运行：  node demo.js

import { ethers } from "ethers";

const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const provider = new ethers.JsonRpcProvider(RPC_URL);

function printBlock(label, b) {
  console.log(`【${label}】区块 #${b.number}`);
  console.log("  hash        :", b.hash);
  console.log("  parentHash  :", b.parentHash, "（指向上一个区块）");
  console.log("  时间戳      :", new Date(b.timestamp * 1000).toISOString());
  console.log("  交易数量    :", b.transactions.length, "笔");
  console.log("  gasUsed/Limit:", b.gasUsed?.toString(), "/", b.gasLimit?.toString());
  if (b.baseFeePerGas != null) {
    console.log("  baseFeePerGas:", ethers.formatUnits(b.baseFeePerGas, "gwei"), "gwei");
  }
  if (b.stateRoot) {
    console.log("  stateRoot   :", b.stateRoot, "（执行完本区块后的世界状态指纹）");
  }
  console.log("");
}

async function main() {
  console.log("=== 读取 Sepolia 最新区块并验证链式结构 ===\n");

  // 1) 读最新区块
  const latest = await provider.getBlock("latest");
  printBlock("最新", latest);

  // 2) 读上一个区块
  const prev = await provider.getBlock(latest.number - 1);
  printBlock("上一个", prev);

  // 3) 亲眼验证：最新区块的 parentHash 是否 == 上一个区块的 hash
  const linked = latest.parentHash === prev.hash;
  console.log("验证链式结构：");
  console.log("  最新.parentHash =", latest.parentHash);
  console.log("  上一个.hash     =", prev.hash);
  console.log(linked
    ? "  ✓ 相等！区块正是通过 parentHash 一环扣一环连成链的。"
    : "  ✗ 不相等（异常，通常因两次读取跨越了新区块，可重试）。");
}

main().catch((err) =>
  console.error("运行出错（多为公共 RPC 超时，可重试）:", err.message)
);
