/**
 * 01 · Provider 连接（只读，无需钱包）
 * -------------------------------------------------
 * 运行：node 01-provider-connect/demo.js
 * 依赖：先在 08-ethers-viem 目录执行 `npm install`
 *
 * 本 demo 演示 ethers v6 中最基础的 Provider：
 *   JsonRpcProvider —— 通过一个 RPC 节点 URL 连接区块链（只读）。
 * Provider 是"读区块链的通道"，不含任何私钥，无法签名/发交易。
 */

import { JsonRpcProvider } from "ethers";

// 公共 Sepolia 测试网 RPC（无需 API Key）。可换成 .env 里的 SEPOLIA_RPC_URL。
const RPC_URL =
  process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

async function main() {
  // 1) 用 RPC URL 创建一个只读 Provider
  const provider = new JsonRpcProvider(RPC_URL);

  // 2) 读取网络信息：chainId / 网络名（Sepolia 的 chainId = 11155111）
  const network = await provider.getNetwork();
  console.log("网络名称   :", network.name);
  console.log("chainId    :", network.chainId.toString());

  // 3) 读取当前最新区块高度（证明我们真的连上了链）
  const blockNumber = await provider.getBlockNumber();
  console.log("最新区块高度:", blockNumber);

  // 4) 读取当前 Gas 价格信息（EIP-1559）
  const feeData = await provider.getFeeData();
  console.log("gasPrice   :", feeData.gasPrice?.toString(), "wei");
}

main().catch((err) => {
  console.error("出错了：", err);
  process.exit(1);
});
