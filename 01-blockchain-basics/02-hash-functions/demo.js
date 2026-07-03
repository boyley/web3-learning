// 02 · 哈希函数（SHA-256）demo —— 纯 Node，无需联网 / 钱包 / 第三方库
// 运行：node demo.js
//
// 目标：直观感受密码学哈希的三大性质
//   1) 确定性：同样输入永远得到同样输出
//   2) 雪崩效应：输入改一个字节（甚至一个 bit），输出面目全非
//   3) 定长 & 单向：任意长度输入 → 固定 256 位输出；无法从输出反推输入

const crypto = require("crypto");

// 计算 SHA-256，返回 64 位十六进制字符串（256 bit = 32 字节 = 64 个 hex 字符）
function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// 统计两个等长 hex 字符串「有多少个 bit 不同」（汉明距离），用来量化雪崩效应
function bitDiff(hexA, hexB) {
  let diff = 0;
  for (let i = 0; i < hexA.length; i++) {
    // 每个 hex 字符是 4 个 bit，异或后数一下有几个 1
    const x = parseInt(hexA[i], 16) ^ parseInt(hexB[i], 16);
    diff += (x.toString(2).match(/1/g) || []).length;
  }
  return diff;
}

console.log("========== 1. 确定性：同样输入 → 同样输出 ==========");
console.log('SHA256("hello") =', sha256("hello"));
console.log('SHA256("hello") =', sha256("hello"), "  ← 再算一次，完全相同\n");

console.log("========== 2. 定长输出：输入长度不影响输出长度 ==========");
for (const s of ["a", "区块链", "The quick brown fox jumps over the lazy dog"]) {
  const h = sha256(s);
  console.log(`输入长度 ${String(Buffer.byteLength(s)).padStart(3)} 字节 → 输出 ${h.length} 个 hex 字符 (${h.length * 4} bit)`);
}
console.log();

console.log("========== 3. 雪崩效应：改一个字节，输出全变 ==========");
const original = "Alice 给 Bob 转账 100 元";
const tampered = "Alice 给 Bob 转账 900 元"; // 只把 1 改成 9
const h1 = sha256(original);
const h2 = sha256(tampered);
console.log("原文  :", original);
console.log("哈希  :", h1);
console.log("篡改  :", tampered, "  ← 只改了一个数字");
console.log("哈希  :", h2);
const diff = bitDiff(h1, h2);
console.log(`\n两个哈希共 256 bit，其中有 ${diff} bit 不同 —— 约 ${(diff / 256 * 100).toFixed(1)}%（理想雪崩≈50%）`);
console.log("结论：任何微小改动都会让指纹面目全非，因此哈希能当「防伪指纹」。\n");

console.log("========== 4. 单向性：给你哈希，猜不出原文 ==========");
const secret = "口令是-" + crypto.randomInt(1000, 9999);
console.log("某人公布了哈希：", sha256(secret));
console.log("你能反推出原文吗？不能 —— 只能逐个尝试(暴力破解)，这正是区块链安全的基石。");
console.log("（本例原文其实是：", secret, "，但仅凭哈希你无法计算得到它）\n");

console.log("👉 哈希是区块链的「原子操作」：区块链接(模块03)、默克尔树(模块04)、");
console.log("   工作量证明挖矿(模块05)、地址生成(模块08) 全都建立在它之上。");
