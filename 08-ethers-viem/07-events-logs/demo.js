/**
 * 07 · 事件与日志（只读，无需钱包）
 * -------------------------------------------------
 * 运行：node 07-events-logs/demo.js
 *
 * 合约通过 emit Event 把"发生了什么"写进交易日志（logs）。
 * 前端有两种用法：
 *   1) queryFilter —— 查询【历史】事件（本 demo 主要演示）
 *   2) contract.on —— 【实时监听】新事件（脚本结尾演示，需 WebSocket/轮询）
 * 示例：查 Sepolia WETH 最近的 Transfer 事件。
 */

import { JsonRpcProvider, Contract, formatEther } from "ethers";

// 注意：查事件用的 eth_getLogs 有些免费公共节点会限制（要 archive token）。
// 这里默认用支持 getLogs 的公共节点 drpc.org；不行就换成自己的 Infura/Alchemy。
const RPC_URL = process.env.SEPOLIA_RPC_URL || "https://sepolia.drpc.org";
const WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

// 事件也写在 ABI 里；indexed 参数可用于按值过滤
const ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);
  const weth = new Contract(WETH, ABI, provider);

  const latest = await provider.getBlockNumber();
  const fromBlock = latest - 500; // 只查最近 500 个区块，避免公共 RPC 超限

  console.log(`查询区块 ${fromBlock} ~ ${latest} 内的 WETH Transfer 事件…\n`);

  // 1) queryFilter：查历史事件。filters.Transfer() 不传参 = 匹配所有 Transfer
  const filter = weth.filters.Transfer();
  const events = await weth.queryFilter(filter, fromBlock, latest);

  console.log(`共找到 ${events.length} 条 Transfer，展示前 5 条：`);
  for (const ev of events.slice(0, 5)) {
    // ev.args 是解码后的参数（from/to/value），带名字可直接取
    const { from, to, value } = ev.args;
    console.log(
      `  区块 ${ev.blockNumber} | ${from.slice(0, 8)}… → ${to.slice(0, 8)}… | ${formatEther(value)} WETH`
    );
  }

  // 2) 带 indexed 过滤：只看"转给某地址"的 Transfer
  //    filters.Transfer(from, to) —— 传 null 表示该位不限
  const someAddr = events[0]?.args?.to;
  if (someAddr) {
    const filtered = weth.filters.Transfer(null, someAddr);
    const hits = await weth.queryFilter(filtered, fromBlock, latest);
    console.log(`\n其中转账【给 ${someAddr.slice(0, 10)}…】的有 ${hits.length} 条`);
  }

  // 3) 实时监听（演示写法）：新事件到来时回调。10 秒后自动退出。
  console.log("\n开始实时监听 Transfer（10 秒后退出）…");
  weth.on("Transfer", (from, to, value, event) => {
    console.log(`  [实时] 区块${event.log.blockNumber}: ${formatEther(value)} WETH`);
  });
  setTimeout(() => {
    weth.removeAllListeners(); // 记得移除监听，避免泄漏
    console.log("监听结束。");
    process.exit(0);
  }, 10000);
}

main().catch((err) => {
  console.error("出错了：", err);
  process.exit(1);
});
