/**
 * 12 · viem 入门（现代替代方案，只读，无需钱包）
 * -------------------------------------------------
 * 运行：node 12-viem-modern/demo.js
 * 依赖：npm install（package.json 已含 viem）
 *
 * viem 是比 ethers 更新的以太坊库，TypeScript 优先、体积小、类型强。
 * 核心概念对照 ethers：
 *   ethers.JsonRpcProvider  ≈  viem createPublicClient({ transport: http() })
 *   ethers.BrowserProvider  ≈  viem createWalletClient({ transport: custom(window.ethereum) })
 *   contract.method()(读)   ≈  publicClient.readContract({...})
 *   contract.method()(写)   ≈  walletClient.writeContract({...})
 *   ethers.parseEther        ≈  viem parseEther（用法几乎一样）
 */

import { createPublicClient, http, formatEther, parseAbi } from "viem";
import { sepolia } from "viem/chains";

const WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

// parseAbi：把人类可读 ABI 字符串数组转成 viem 需要的 ABI 对象
const wethAbi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
]);

async function main() {
  // 1) 创建只读客户端（对标 ethers 的 JsonRpcProvider）
  const client = createPublicClient({
    chain: sepolia, // 内置链信息，自带默认 RPC，也可用 http("你的URL")
    transport: http(process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"),
  });

  // 2) 读区块高度（方法是动作 action，直接挂在 client 上）
  const blockNumber = await client.getBlockNumber();
  console.log("最新区块高度:", blockNumber.toString());

  // 3) 读合约：不 new 合约实例，而是一次性传 address+abi+functionName
  const name = await client.readContract({
    address: WETH,
    abi: wethAbi,
    functionName: "name",
  });
  const symbol = await client.readContract({
    address: WETH,
    abi: wethAbi,
    functionName: "symbol",
  });
  const totalSupply = await client.readContract({
    address: WETH,
    abi: wethAbi,
    functionName: "totalSupply",
  });

  console.log("合约名称    :", name);
  console.log("符号        :", symbol);
  // viem 的 formatEther 用法与 ethers 基本一致（都吃 BigInt）
  console.log("总供应量    :", formatEther(totalSupply), symbol);

  console.log("\n对照小结：");
  console.log("  ethers: new Contract(addr, abi, provider).name()");
  console.log("  viem  : client.readContract({ address, abi, functionName: 'name' })");
}

main().catch((err) => {
  console.error("出错了：", err);
  process.exit(1);
});
