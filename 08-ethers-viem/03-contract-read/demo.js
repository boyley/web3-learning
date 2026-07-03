/**
 * 03 · 读取合约 view 方法（只读，无需钱包）
 * -------------------------------------------------
 * 运行：node 03-contract-read/demo.js
 *
 * 用 ABI + 合约地址 + Provider 构造一个 Contract 实例，
 * 调用它的 view/pure 方法（不花 Gas、不上链）。
 * 示例合约：Sepolia 上的 WETH（Wrapped ETH），一个标准 ERC-20。
 */

import { JsonRpcProvider, Contract, formatUnits } from "ethers";

const RPC_URL =
  process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

// Sepolia WETH 合约地址（Uniswap 等广泛使用的测试网 WETH9）
const WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

// ABI 只需列出你要调用的方法（Human-Readable ABI，ethers 支持字符串数组写法）
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
];

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);

  // 只读合约：第三个参数传 Provider（若要写方法则要传 Signer，见模块 06）
  const weth = new Contract(WETH, ERC20_ABI, provider);

  // 调用 view 方法就像调用普通 async 函数
  const [name, symbol, decimals, totalSupply] = await Promise.all([
    weth.name(),
    weth.symbol(),
    weth.decimals(),
    weth.totalSupply(),
  ]);

  console.log("合约地址  :", WETH);
  console.log("名称      :", name);
  console.log("符号      :", symbol);
  console.log("精度      :", decimals);
  // decimals 是 BigInt，formatUnits 第二参可直接吃 BigInt
  console.log("总供应量  :", formatUnits(totalSupply, decimals), symbol);

  // 查询某地址持有的 WETH 余额
  const holder = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
  const bal = await weth.balanceOf(holder);
  console.log(`\n${holder} 的 WETH 余额:`, formatUnits(bal, decimals), symbol);
}

main().catch((err) => {
  console.error("出错了：", err);
  process.exit(1);
});
