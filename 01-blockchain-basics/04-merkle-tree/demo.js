// 04 · 默克尔树（Merkle Tree）demo —— 纯 Node，无需联网 / 钱包 / 第三方库
// 运行：node demo.js
//
// 目标：
//   1) 用一批交易两两哈希、逐层汇聚，构建出唯一的「默克尔根」
//   2) 生成某笔交易的「默克尔证明(Merkle Proof)」
//   3) 只凭「这笔交易 + 一条很短的证明路径 + 默克尔根」即可验证它确实在这批交易里，
//      无需下载全部交易 —— 这正是轻节点(SPV)能省资源验证的原理

const crypto = require("crypto");

const H = (s) => crypto.createHash("sha256").update(s).digest("hex");

// 构建默克尔树：返回每一层的哈希数组，layers[0] 是叶子，最后一层是根
function buildTree(leaves) {
  let layer = leaves.map(H); // 第 0 层：对每笔交易求哈希得到叶子
  const layers = [layer];
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      // 若本层节点数为奇数，最后一个与自己配对（比特币的做法）
      const right = layer[i + 1] ?? layer[i];
      next.push(H(left + right)); // 父 = H(左 + 右)
    }
    layers.push(next);
    layer = next;
  }
  return layers; // layers[layers.length-1][0] 就是默克尔根
}

const merkleRoot = (layers) => layers[layers.length - 1][0];

// 为第 index 笔交易生成默克尔证明：沿途每一层，记录「兄弟节点哈希」和它在左还是右
function getProof(layers, index) {
  const proof = [];
  let idx = index;
  for (let level = 0; level < layers.length - 1; level++) {
    const layer = layers[level];
    const isRightNode = idx % 2 === 1;              // 当前节点是右孩子吗
    const siblingIdx = isRightNode ? idx - 1 : idx + 1;
    const sibling = layer[siblingIdx] ?? layer[idx]; // 奇数末尾时兄弟是自己
    proof.push({ hash: sibling, position: isRightNode ? "left" : "right" });
    idx = Math.floor(idx / 2);                       // 上升到父节点
  }
  return proof;
}

// 用证明验证：从叶子出发，按证明逐层往上算，最后看是否等于默克尔根
function verifyProof(tx, proof, root) {
  let hash = H(tx); // 叶子
  for (const step of proof) {
    hash = step.position === "left"
      ? H(step.hash + hash)  // 兄弟在左，我在右
      : H(hash + step.hash); // 兄弟在右，我在左
  }
  return hash === root;
}

// ========== 演示 ==========
const txs = ["Alice→Bob:10", "Bob→Carol:4", "Carol→Dave:1", "Dave→Eve:7"];

console.log("========== 1. 构建默克尔树 ==========");
const layers = buildTree(txs);
layers.forEach((layer, i) => {
  const name = i === 0 ? "叶子层(交易哈希)" : i === layers.length - 1 ? "根" : `第${i}层`;
  console.log(`  ${name.padEnd(14)}: ${layer.map(h => h.slice(0, 10) + "..").join("  ")}`);
});
const root = merkleRoot(layers);
console.log("\n  默克尔根 (Merkle Root):", root);
console.log("  → 区块头只需存这 32 字节，就代表了全部", txs.length, "笔交易的指纹。\n");

console.log("========== 2. 为「Carol→Dave:1」(第2笔, index=2) 生成证明 ==========");
const proof = getProof(layers, 2);
console.log("  证明路径(仅需", proof.length, "个兄弟哈希，而非全部交易)：");
proof.forEach((p, i) => console.log(`    步骤${i + 1}: 兄弟在${p.position}, hash=${p.hash.slice(0, 16)}..`));
console.log("  验证结果：", verifyProof("Carol→Dave:1", proof, root), "✅ 该交易确实在区块中\n");

console.log("========== 3. 篡改检测：伪造一笔不存在的交易 ==========");
console.log("  用同一条证明验证伪造交易「Carol→攻击者:9999」：");
console.log("  验证结果：", verifyProof("Carol→攻击者:9999", proof, root), "❌ 算出的根对不上，伪造被拒绝");
console.log("\n👉 轻节点(手机钱包)无需存全部交易，只要有默克尔根 + 一条短证明，");
console.log("   就能确认「我的这笔交易被打包进了区块」—— 这就是 SPV 简单支付验证。");
