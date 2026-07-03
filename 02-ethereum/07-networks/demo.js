// 07 · 以太坊网络 —— 用同一套 ethers 接口连接不同网络，读取 chainId 与区块高度
// 只读，不花钱。运行前在 02-ethereum 目录执行 `npm install`
// 运行： node demo.js

import { ethers } from "ethers";

// ---------------------------------------------------------------
// 离线对照表：各网络的 chainId（即使联网失败也能看清区别）。
// ---------------------------------------------------------------
const NETWORKS = [
  { name: "以太坊主网 Mainnet", chainId: 1, rpc: "https://ethereum-rpc.publicnode.com", real: "真实资产⚠️" },
  { name: "Sepolia 测试网", chainId: 11155111, rpc: "https://ethereum-sepolia-rpc.publicnode.com", real: "免费测试币" },
  { name: "Arbitrum Sepolia (L2)", chainId: 421614, rpc: "https://sepolia-rollup.arbitrum.io/rpc", real: "L2 测试网" },
];

function printTable() {
  console.log("=== 网络对照表（离线） ===");
  for (const n of NETWORKS) {
    console.log(`  ${n.name.padEnd(22)} chainId=${String(n.chainId).padEnd(9)} ${n.real}`);
  }
  console.log("");
}

async function probe(n) {
  const provider = new ethers.JsonRpcProvider(n.rpc);
  try {
    // getNetwork() 返回该 RPC 所连网络的 chainId 等身份信息
    const net = await provider.getNetwork();
    const height = await provider.getBlockNumber();
    const match = Number(net.chainId) === n.chainId ? "✓匹配" : "✗不匹配";
    console.log(`【${n.name}】`);
    console.log(`  实测 chainId = ${net.chainId} (${match})`);
    console.log(`  当前区块高度 = ${height}`);
  } catch (e) {
    console.log(`【${n.name}】连接失败（公共 RPC 超时/限流），跳过：${e.message}`);
  }
  console.log("");
}

async function main() {
  printTable();
  console.log("=== 逐个连接并读取实时信息 ===\n");
  for (const n of NETWORKS) {
    await probe(n);
  }
  console.log("要点：连不同网络只是换 RPC + chainId；本工程后续 demo 统一用 Sepolia。");
}

main().catch((err) => console.error("运行出错:", err.message));
