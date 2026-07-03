// 03 · 区块结构 & 链式链接 demo —— 纯 Node，无需联网 / 钱包 / 第三方库
// 运行：node demo.js
//
// 目标：手写一条「迷你区块链」，理解
//   1) 一个区块里有哪些字段（index / timestamp / data / prevHash / hash / nonce）
//   2) 区块如何靠 prevHash 首尾相连
//   3) 篡改中间任意一个区块，为什么整条链后面全部失效

const crypto = require("crypto");

// —— 一个区块 ——
class Block {
  constructor(index, data, prevHash) {
    this.index = index;               // 区块高度（第几个）
    this.timestamp = "2026-01-01";    // 出块时间（写死便于复现，真实链是 Unix 时间戳）
    this.data = data;                 // 区块承载的数据（这里放交易文本，真实链放交易列表/默克尔根）
    this.prevHash = prevHash;         // 上一个区块的哈希 —— 这是「链」的关键！
    this.nonce = 0;                   // 随机数，供挖矿(模块05)调整哈希用，这里保留字段
    this.hash = this.computeHash();   // 本区块自身的哈希 = 对上面所有字段求 SHA-256
  }

  // 区块哈希 = SHA256(index + timestamp + data + prevHash + nonce)
  computeHash() {
    return crypto
      .createHash("sha256")
      .update(this.index + this.timestamp + JSON.stringify(this.data) + this.prevHash + this.nonce)
      .digest("hex");
  }
}

// —— 一条链 ——
class Blockchain {
  constructor() {
    // 创世块：整条链的第一个区块，prevHash 约定为全 0（它没有前驱）
    this.chain = [new Block(0, "创世块 Genesis", "0".repeat(64))];
  }

  latest() {
    return this.chain[this.chain.length - 1];
  }

  // 新区块的 prevHash 必须等于当前链尾区块的 hash —— 这样才「接得上」
  addBlock(data) {
    const prev = this.latest();
    this.chain.push(new Block(prev.index + 1, data, prev.hash));
  }

  // 校验整条链：① 每个区块的哈希要能重算得出 ② 每个区块的 prevHash 要等于上一区块的真实哈希
  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const cur = this.chain[i];
      const prev = this.chain[i - 1];
      if (cur.hash !== cur.computeHash()) {
        return { ok: false, reason: `区块 #${i} 内容被改，自身哈希对不上` };
      }
      if (cur.prevHash !== prev.hash) {
        return { ok: false, reason: `区块 #${i} 的 prevHash 与区块 #${i - 1} 的真实哈希不符，链断裂` };
      }
    }
    return { ok: true };
  }
}

function printChain(bc) {
  for (const b of bc.chain) {
    console.log(`  #${b.index}  data=${JSON.stringify(b.data)}`);
    console.log(`       prevHash: ${b.prevHash.slice(0, 24)}...`);
    console.log(`       hash    : ${b.hash.slice(0, 24)}...`);
  }
}

// ========== 演示 ==========
const bc = new Blockchain();
bc.addBlock("Alice → Bob : 10");
bc.addBlock("Bob → Carol : 4");
bc.addBlock("Carol → Dave : 1");

console.log("========== 1. 一条正常的链 ==========");
printChain(bc);
console.log("校验结果：", bc.isValid(), "\n");

console.log("========== 2. 篡改中间区块 #1 的数据 ==========");
bc.chain[1].data = "Alice → 攻击者 : 9999"; // 偷偷改钱
console.log("攻击者把 #1 的转账金额改大了，但没有（也无法轻易）重算后续所有哈希");
console.log("校验结果：", bc.isValid());
console.log("→ 结论：区块 #1 一改，它的哈希就变了，而 #2 里存的还是旧哈希，链在 #2 处断裂。");
console.log("  要想圆谎，攻击者必须重算 #1、#2、#3 的全部哈希，并在 PoW/PoS 下战胜全网算力/权益，");
console.log("  这正是区块链「不可篡改」的根源（详见模块 05 共识）。\n");

console.log("========== 3. 就算重算被篡改块的哈希，链依旧断 ==========");
bc.chain[1].hash = bc.chain[1].computeHash(); // 攻击者补算 #1 自己的哈希
console.log("即使攻击者补算了 #1 的哈希，#2.prevHash 仍指向旧值：");
console.log("校验结果：", bc.isValid());
console.log("→ 必须连锁重算 #2、#3……牵一发而动全身，这就是「链式」结构的防篡改威力。");
