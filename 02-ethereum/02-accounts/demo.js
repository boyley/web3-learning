// 02 · 账户模型 —— 用 ethers v6 读取真实链上账户，区分 EOA 与合约账户
// 只读操作：不发交易、不花钱、不需要你自己的私钥。
//
// 运行前：在 02-ethereum 目录执行 `npm install`
// 运行：  node demo.js

import { ethers } from "ethers";

// ---------------------------------------------------------------
// 公共 Sepolia 测试网 RPC（只读）。若超时可换下面任意一个备选。
// ---------------------------------------------------------------
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
// 备选：
//   https://sepolia.drpc.org
//   https://rpc.sepolia.org
//   https://1rpc.io/sepolia

const provider = new ethers.JsonRpcProvider(RPC_URL);

// ---------------------------------------------------------------
// 1) 本地生成一个随机 EOA，演示「私钥 -> 地址」的推导。
//    ⚠️ 仅用于演示地址结构，绝不要向它转入任何资产。
// ---------------------------------------------------------------
function demoAddressDerivation() {
  const wallet = ethers.Wallet.createRandom();
  console.log("【1】本地生成随机 EOA（仅演示，勿使用）");
  console.log("  私钥(演示用，用完即弃):", wallet.privateKey);
  console.log("  公钥:", wallet.publicKey);
  console.log("  地址:", wallet.address, "（公钥 Keccak-256 的后 20 字节）");
  console.log("");
}

// ---------------------------------------------------------------
// 2) 读取某地址的账户状态字段：balance / nonce，并判断是否为合约。
// ---------------------------------------------------------------
async function inspectAccount(label, address) {
  const balance = await provider.getBalance(address); // 返回 wei (BigInt)
  const nonce = await provider.getTransactionCount(address); // 已发交易数
  const code = await provider.getCode(address); // "0x" 表示无代码 = EOA

  const isContract = code !== "0x";
  console.log(`【${label}】${address}`);
  console.log("  balance:", ethers.formatEther(balance), "ETH", `(${balance} wei)`);
  console.log("  nonce  :", nonce);
  console.log("  类型   :", isContract ? "合约账户（有代码）" : "外部账户 EOA（无代码）");
  if (isContract) {
    console.log("  代码长度:", (code.length - 2) / 2, "字节");
  }
  console.log("");
}

async function main() {
  demoAddressDerivation();

  console.log("=== 读取 Sepolia 测试网上的真实账户 ===\n");

  // 一个普通 EOA（Vitalik 的公开地址，主网/测试网通用格式；在 Sepolia 上通常无代码）
  await inspectAccount("EOA 示例", "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");

  // 一个合约地址：Sepolia 上的 WETH 合约（会返回一大串字节码）
  await inspectAccount("合约示例(WETH)", "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14");

  console.log("对比结论：EOA 的 getCode 返回 '0x'（空），合约账户返回字节码。");
}

main().catch((err) => {
  console.error("运行出错（多为公共 RPC 超时，可重试或更换 RPC_URL）:", err.message);
});
