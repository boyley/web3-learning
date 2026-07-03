// 05 · 共识机制 · 工作量证明(PoW)挖矿 demo —— 纯 Node，无需联网 / 钱包 / 第三方库
// 运行：node demo.js
//
// 目标：
//   1) 亲手「挖矿」：不断改 nonce，直到区块哈希满足「前 N 位是 0」的难度要求
//   2) 感受难度每 +1，所需尝试次数约 ×16，算力/时间指数上升
//   3) 理解 PoW 为何让篡改历史「重挖成本极高」，以及与 PoS 的对比

const crypto = require("crypto");

const H = (s) => crypto.createHash("sha256").update(s).digest("hex");

// 挖矿：给定区块数据和难度(要求哈希以 difficulty 个 0 开头)，找出满足条件的 nonce
function mine(blockData, difficulty) {
  const target = "0".repeat(difficulty); // 目标前缀，越长越难
  let nonce = 0;
  const start = Date.now();
  while (true) {
    const hash = H(blockData + nonce);    // 只有 nonce 在变
    if (hash.startsWith(target)) {        // 找到一个「幸运」的 nonce
      return { nonce, hash, tries: nonce + 1, ms: Date.now() - start };
    }
    nonce++;
  }
}

console.log("========== 工作量证明(PoW)：挖矿就是暴力试出一个好哈希 ==========\n");
const blockData = "区块#100 | 交易默克尔根:abc123 | prevHash:def456 | ";

for (let difficulty = 1; difficulty <= 5; difficulty++) {
  const r = mine(blockData, difficulty);
  console.log(`难度 ${difficulty}（哈希需以 ${difficulty} 个 0 开头）:`);
  console.log(`  找到 nonce = ${r.nonce}`);
  console.log(`  区块哈希   = ${r.hash}`);
  console.log(`  共尝试     = ${r.tries.toLocaleString()} 次, 耗时 ${r.ms} ms`);
  console.log("");
}

console.log("👉 观察：难度每 +1，平均尝试次数约 ×16（因为每一位 hex 有 16 种可能）。");
console.log("   真实比特币难度会让全网每约 10 分钟才出一个块。\n");

console.log("========== 验证极快，作弊极贵：这就是 PoW 的非对称性 ==========");
const r = mine(blockData, 4);
console.log("矿工挖了很久才找到 nonce =", r.nonce);
console.log("但任何人验证只需算 1 次哈希：", H(blockData + r.nonce).startsWith("0000"));
console.log("→ 想篡改历史区块，就得把该块及其后所有块全部重新挖出来，");
console.log("  还要比诚实全网算力更快追上 —— 需掌握全网 >50% 算力(51%攻击)，成本天文数字。\n");

console.log("========== PoW vs PoS 一句话对比 ==========");
console.log("  PoW(工作量证明)：拼算力/电力，谁先算出合格哈希谁出块（比特币）。");
console.log("  PoS(权益证明)  ：拼质押的币，按质押被随机选中出块，作恶会被罚没(slashing)。");
console.log("  以太坊已于 2022 年 The Merge 从 PoW 切换到 PoS，能耗降低约 99.95%。");
