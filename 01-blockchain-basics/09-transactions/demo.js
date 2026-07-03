// 09 · 交易结构 / nonce / 如何被打包 demo —— 纯 Node，无需联网 / 钱包 / 第三方库
// 运行：node demo.js
//
// 目标（不联网、不签真交易，纯结构与规则演示）：
//   1) 一笔以太坊交易由哪些字段组成
//   2) nonce 是什么、为什么能防「重放」和保证顺序
//   3) 内存池(mempool)里矿工/验证者如何按 gas 价格挑选交易打包进区块

const crypto = require("crypto");
const H = (s) => crypto.createHash("sha256").update(s).digest("hex");

// ========== 1. 一笔交易的结构（以太坊 EIP-1559 类型）==========
const tx = {
  from: "0xAlice...",          // 发送方地址（实际由签名反推，不直接写在里面）
  to: "0xBob...",              // 接收方地址（若为空则是「创建合约」）
  nonce: 5,                    // 该发送方发出的第 6 笔交易(从0计) —— 防重放 & 定顺序
  value: "1.5 ETH",           // 转账金额
  maxFeePerGas: "30 gwei",    // 每单位 gas 最高愿付价（EIP-1559）
  maxPriorityFeePerGas: "2 gwei", // 给验证者的小费
  gasLimit: 21000,            // 本交易最多消耗多少 gas（普通转账固定 21000）
  data: "0x",                 // 附加数据：转账为空；调用合约则是编码后的函数调用
  chainId: 1,                 // 链 ID（1=主网, 11155111=Sepolia）防跨链重放
  // signature(v,r,s)：钱包用私钥对以上字段签名后附上，全网据此反推 from 并鉴权
};

console.log("========== 1. 一笔以太坊交易的结构 ==========");
console.log(JSON.stringify(tx, null, 2));
console.log("交易哈希(txHash, 唯一编号) ≈", "0x" + H(JSON.stringify(tx)).slice(0, 40), "...\n");

// ========== 2. nonce：每个账户一个自增计数器 ==========
console.log("========== 2. nonce 如何保证顺序 & 防重放 ==========");
console.log("规则：某账户的交易必须按 nonce = 0,1,2,3... 依次被打包，不能跳号、不能重复。");
console.log("  · 防重放：一笔 nonce=5 的交易被打包后，同 nonce 的副本会被直接拒绝(已用过)。");
console.log("  · 定顺序：nonce=6 必须等 nonce=5 上链后才能被打包(否则悬在内存池等待)。");
console.log("  · 加速/取消：用相同 nonce + 更高 gas 价重发，可替换掉还没上链的旧交易。\n");

// 模拟：一个账户连发 3 笔，乱序到达内存池，节点必须按 nonce 排序执行
const pending = [
  { nonce: 7, note: "第三笔" },
  { nonce: 5, note: "第一笔" },
  { nonce: 6, note: "第二笔" },
];
console.log("内存池收到(乱序)：", pending.map((t) => `nonce=${t.nonce}`).join(", "));
pending.sort((a, b) => a.nonce - b.nonce);
console.log("按 nonce 排序后执行：", pending.map((t) => `nonce=${t.nonce}(${t.note})`).join(" → "), "\n");

// ========== 3. 交易如何被打包：内存池 → 按 gas 价竞价 → 区块 ==========
console.log("========== 3. 打包：验证者优先选「出价高」的交易 ==========");
const mempool = [
  { id: "tx-A", tip: 5, gasLimit: 21000 },
  { id: "tx-B", tip: 2, gasLimit: 21000 },
  { id: "tx-C", tip: 9, gasLimit: 21000 },
  { id: "tx-D", tip: 1, gasLimit: 21000 },
  { id: "tx-E", tip: 7, gasLimit: 21000 },
];
const BLOCK_GAS_LIMIT = 60000; // 简化：一个区块最多容纳约 2~3 笔 21000 的转账
console.log("内存池中待打包交易(tip=给验证者的小费 gwei)：");
mempool.forEach((t) => console.log(`  ${t.id}: 小费 ${t.tip} gwei`));

// 验证者按小费从高到低选，直到塞满区块 gas 上限
const picked = [];
let used = 0;
for (const t of [...mempool].sort((a, b) => b.tip - a.tip)) {
  if (used + t.gasLimit <= BLOCK_GAS_LIMIT) {
    picked.push(t);
    used += t.gasLimit;
  }
}
console.log(`\n区块 gas 上限 ${BLOCK_GAS_LIMIT}，验证者优先打包高小费交易：`);
console.log("  被打包 →", picked.map((t) => `${t.id}(${t.tip})`).join(", "));
console.log("  留在内存池等下一个块 →", mempool.filter((t) => !picked.includes(t)).map((t) => t.id).join(", "));
console.log("\n👉 这解释了「网络拥堵时提高 gas 费能更快确认」的原因。");
console.log("   交易生命周期：签名 → 广播进内存池 → 被打包进区块 → 获得确认(后续区块越多越安全)。");
