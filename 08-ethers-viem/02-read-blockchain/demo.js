/**
 * 02 · 读取区块链数据（只读，无需钱包）
 * -------------------------------------------------
 * 运行：node 02-read-blockchain/demo.js
 *
 * 演示 Provider 最常用的"读"方法：
 *   - getBalance   查地址 ETH 余额（返回 wei，BigInt）
 *   - getBlock     查区块信息
 *   - getTransaction / getTransactionReceipt 查交易
 *   - getTransactionCount  查 nonce
 */

import { JsonRpcProvider, formatEther } from "ethers";

const RPC_URL =
  process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

// 一个 Sepolia 上有余额的公开地址（Sepolia 水龙头发币账户之一），仅用于演示读取。
const SAMPLE_ADDRESS = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);

  // 1) 查余额：返回 wei（BigInt），用 formatEther 转成人类可读的 ETH
  const balanceWei = await provider.getBalance(SAMPLE_ADDRESS);
  console.log("地址        :", SAMPLE_ADDRESS);
  console.log("余额(wei)   :", balanceWei.toString());
  console.log("余额(ETH)   :", formatEther(balanceWei));

  // 2) 查账户 nonce（已发出的交易数量），发交易时要用
  const nonce = await provider.getTransactionCount(SAMPLE_ADDRESS);
  console.log("nonce       :", nonce);

  // 3) 查最新区块（不带交易明细）
  const latest = await provider.getBlockNumber();
  const block = await provider.getBlock(latest);
  console.log("\n--- 最新区块", latest, "---");
  console.log("区块哈希    :", block.hash);
  console.log("出块时间    :", new Date(block.timestamp * 1000).toLocaleString());
  console.log("矿工/提议者 :", block.miner);
  console.log("交易数量    :", block.transactions.length);

  // 4) 若该区块有交易，取第一笔交易详情 + 回执
  if (block.transactions.length > 0) {
    const txHash = block.transactions[0];
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    console.log("\n--- 区块首笔交易 ---");
    console.log("txHash      :", txHash);
    console.log("from -> to  :", tx.from, "->", tx.to);
    console.log("金额(ETH)   :", formatEther(tx.value));
    console.log("状态        :", receipt.status === 1 ? "成功" : "失败");
    console.log("实际 gasUsed:", receipt.gasUsed.toString());
  }
}

main().catch((err) => {
  console.error("出错了：", err);
  process.exit(1);
});
