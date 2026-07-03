// 09 · JSON-RPC —— 用「裸 JSON-RPC」和「ethers 封装」两种方式读链上数据
// 只读，不花钱。需要 Node 18+（内置 fetch）。
// 运行前：在 02-ethereum 目录执行 `npm install`
// 运行：  node demo.js

import { ethers } from "ethers";

const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

// ---------------------------------------------------------------
// 1) 裸 JSON-RPC：手动 POST 一个 JSON body，手动解析 hex。
// ---------------------------------------------------------------
async function rawCall(method, params = []) {
  const body = { jsonrpc: "2.0", method, params, id: 1 };
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json.error) throw new Error(`${method}: ${json.error.message}`);
  return json.result; // 通常是 "0x..." 的十六进制字符串
}

async function demoRawRpc() {
  console.log("=== 方式一：裸 JSON-RPC（看清底层 hex） ===");

  const blockHex = await rawCall("eth_blockNumber");
  console.log("eth_blockNumber ->", blockHex, "=", parseInt(blockHex, 16), "(十进制区块高度)");

  const chainHex = await rawCall("eth_chainId");
  console.log("eth_chainId     ->", chainHex, "=", parseInt(chainHex, 16), "(Sepolia 应为 11155111)");

  const addr = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  const balHex = await rawCall("eth_getBalance", [addr, "latest"]);
  console.log("eth_getBalance  ->", balHex);
  console.log("  换算 ->", ethers.formatEther(BigInt(balHex)), "ETH（hex 的 wei 需手动换算）");
  console.log("");
}

// ---------------------------------------------------------------
// 2) ethers 封装：同样的查询，一行搞定，自动解析。
// ---------------------------------------------------------------
async function demoEthers() {
  console.log("=== 方式二：ethers v6 封装（屏蔽 hex 细节） ===");
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  console.log("getBlockNumber() ->", await provider.getBlockNumber());
  const net = await provider.getNetwork();
  console.log("getNetwork()     -> chainId =", net.chainId.toString());
  const bal = await provider.getBalance("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
  console.log("getBalance()     ->", ethers.formatEther(bal), "ETH（已自动换算）");
  console.log("");

  // 3) eth_call 只读调用合约：读 Sepolia WETH 的 symbol / decimals
  console.log("=== eth_call 只读调用合约（读 ERC-20 元信息） ===");
  const WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // Sepolia WETH
  const erc20Abi = [
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
  ];
  const token = new ethers.Contract(WETH, erc20Abi, provider);
  const symbol = await token.symbol(); //   底层就是一次 eth_call
  const decimals = await token.decimals();
  console.log(`合约 ${WETH}`);
  console.log("  symbol   =", symbol, "（底层是 eth_call，不花钱、不上链）");
  console.log("  decimals =", decimals.toString());
}

async function main() {
  try {
    await demoRawRpc();
  } catch (e) {
    console.log("裸 RPC 调用失败（公共节点超时），跳过：", e.message, "\n");
  }
  try {
    await demoEthers();
  } catch (e) {
    console.log("ethers 调用失败（公共节点超时），可重试：", e.message);
  }
}

main().catch((err) => console.error("运行出错:", err.message));
