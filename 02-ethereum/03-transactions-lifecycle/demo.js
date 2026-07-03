// 03 · 交易生命周期 —— 用 ethers v6 只读地剖析一笔真实交易
// 不发送任何交易，纯读取，安全无风险。
//
// 运行前：在 02-ethereum 目录执行 `npm install`
// 运行：  node demo.js

import { ethers } from "ethers";

const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const provider = new ethers.JsonRpcProvider(RPC_URL);

// ---------------------------------------------------------------
// 离线示例：一笔 EIP-1559 交易的字段长什么样（带中文注释）。
// 即使不联网，也能对照理解每个字段的含义。
// ---------------------------------------------------------------
const SAMPLE_TX = {
  type: 2, //            交易类型：2 = EIP-1559（当前标准）
  nonce: 42, //          发送方第 43 笔交易（从 0 数）
  to: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // 接收方；为空则是部署合约
  value: "1000000000000000", // 转账金额，单位 wei（此处 0.001 ETH）
  gasLimit: 21000, //    Gas 上限（纯转账固定 21000）
  maxFeePerGas: "30000000000", //         每单位 Gas 最高总价 30 gwei
  maxPriorityFeePerGas: "1500000000", //  给验证者的小费 1.5 gwei
  chainId: 11155111, //  Sepolia 链 ID（防跨链重放）
  // 签名三件套（由私钥对以上内容签名得到，证明发送者身份）
  // v/r/s 或聚合成 signature，这里省略具体值
};

function printSampleTx() {
  console.log("【离线示例】一笔 EIP-1559 交易的结构：");
  for (const [k, v] of Object.entries(SAMPLE_TX)) {
    console.log(`  ${k.padEnd(22)} = ${v}`);
  }
  console.log("");
}

// ---------------------------------------------------------------
// 读取一笔真实历史交易的完整字段 + 收据。
// ---------------------------------------------------------------
async function inspectRealTx(txHash) {
  console.log("=== 读取真实交易", txHash, "===");
  const tx = await provider.getTransaction(txHash);
  if (!tx) {
    console.log("未找到该交易（可能已过期或该 RPC 未保存），跳过。\n");
    return;
  }

  console.log("交易字段（生命周期第 1~2 步：构造 + 签名后的样子）：");
  console.log("  from        :", tx.from);
  console.log("  to          :", tx.to);
  console.log("  nonce       :", tx.nonce);
  console.log("  value       :", ethers.formatEther(tx.value ?? 0n), "ETH");
  console.log("  gasLimit    :", tx.gasLimit?.toString());
  console.log("  maxFeePerGas:", tx.maxFeePerGas ? ethers.formatUnits(tx.maxFeePerGas, "gwei") + " gwei" : "-");
  console.log("  type        :", tx.type, tx.type === 2 ? "(EIP-1559)" : "");
  console.log("  blockNumber :", tx.blockNumber ?? "(仍在 mempool，尚未打包)");

  // 收据 = 交易已被打包执行后的结果（生命周期第 5 步之后）
  const receipt = await provider.getTransactionReceipt(txHash);
  if (receipt) {
    console.log("\n收据（生命周期第 5 步：已被打包并执行）：");
    console.log("  status      :", receipt.status === 1 ? "1 成功" : "0 失败/回滚");
    console.log("  区块号      :", receipt.blockNumber);
    console.log("  实际 gasUsed:", receipt.gasUsed.toString());
    console.log("  日志条数    :", receipt.logs.length);
  }
  console.log("");
}

async function main() {
  printSampleTx();

  // 演示：查询某地址「下一笔该用的 nonce」
  const addr = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  try {
    const nextNonce = await provider.getTransactionCount(addr, "pending");
    console.log(`【nonce】地址 ${addr}\n  下一笔交易应使用 nonce = ${nextNonce}\n`);
  } catch (e) {
    console.log("查询 nonce 失败（RPC 超时），跳过。\n");
  }

  // 读取一笔真实交易（取当前区块里的第一笔，保证存在）
  try {
    const block = await provider.getBlock("latest");
    if (block && block.transactions.length > 0) {
      await inspectRealTx(block.transactions[0]);
    } else {
      console.log("最新区块暂无交易，可稍后重试。");
    }
  } catch (e) {
    console.log("联网读取失败（公共 RPC 超时），但上面的离线示例已足够理解结构：", e.message);
  }
}

main().catch((err) => console.error("运行出错:", err.message));
