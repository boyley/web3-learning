/**
 * 07 · IPNS 可变指针 —— 一个固定的名字，指向会变的 CID
 * ------------------------------------------------------------------
 * 运行:  node demo.js
 * 依赖:  无（Node 内置 crypto，生成真实 ed25519 密钥对）
 *
 * 内容寻址是不可变的：内容一变 CID 就变。可有些场景（网站、可升级资料）需要
 * “地址不变、内容能更新”。IPNS 用一对密钥生成一个【固定名字】，名字由公钥算出，
 * 你可以随时用私钥签名把它【重新指向】新的 CID —— 名字不变，目标可变。
 *
 * 本 demo 会生成真实的 ed25519 密钥，并按 libp2p 规范算出真正的 IPNS 名字
 * （CIDv1 · libp2p-key · base36，形如 k51q…）。
 * ------------------------------------------------------------------
 */

const crypto = require('crypto');

// base36 编码（IPNS 名字用 base36 CIDv1，多base前缀 'k'）
const B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
function base36(bytes) {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const digits = [0];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8; digits[j] = carry % 36; carry = (carry / 36) | 0;
    }
    while (carry) { digits.push(carry % 36); carry = (carry / 36) | 0; }
  }
  let out = '0'.repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i--) out += B36[digits[i]];
  return out;
}

// ① 生成 ed25519 密钥对（真实）
const { publicKey } = crypto.generateKeyPairSync('ed25519');
// 从 SPKI(DER) 里取出末尾 32 字节的原始公钥
const spki = publicKey.export({ type: 'spki', format: 'der' });
const rawPub = spki.subarray(spki.length - 32); // ed25519 原始公钥 32 字节

// ② 按 libp2p 规范拼出 IPNS 名字（= 公钥的 peer id，CIDv1/libp2p-key/base36）
//    PublicKey protobuf: 0x08 0x01(Type=Ed25519) 0x12 0x20 <32字节公钥>
const pubProto = Buffer.concat([Buffer.from([0x08, 0x01, 0x12, 0x20]), rawPub]); // 36 bytes
//    ed25519 公钥短，用 identity multihash: 0x00 <len=36> <pubProto>
const mh = Buffer.concat([Buffer.from([0x00, pubProto.length]), pubProto]);       // 38 bytes
//    CIDv1: 0x01 版本 + 0x72 libp2p-key 编解码器 + multihash
const cidBytes = Buffer.concat([Buffer.from([0x01, 0x72]), mh]);                  // 40 bytes
const ipnsName = 'k' + base36(cidBytes);

console.log('════════════════════════════════════════════════════════');
console.log('① 生成了一对 ed25519 密钥（私钥用于签名更新，务必保密）');
console.log('   原始公钥(hex):', rawPub.toString('hex'));
console.log('\n② 由公钥算出的【IPNS 名字】(CIDv1·libp2p-key·base36):');
console.log('   ', ipnsName);
console.log('   完整寻址: /ipns/' + ipnsName);
console.log('   这个名字【固定不变】，因为它就是公钥的哈希。');
console.log('════════════════════════════════════════════════════════\n');

// ③ 模拟“同一个名字，先后指向不同 CID”
const versions = [
  { day: 'v1（周一发布）', cid: 'bafybeih1oldpageeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeexample' },
  { day: 'v2（周三更新）', cid: 'bafybeih2newpageeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeexample' },
  { day: 'v3（周五又改）', cid: 'bafybeih3finalpageeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeexample' },
];
console.log('③ 用私钥签名，把同一个 IPNS 名字重新指向新 CID（发布 IPNS record）:');
for (const v of versions) {
  console.log('   ipns://' + ipnsName + '   ──指向──>   ' + v.cid + '   [' + v.day + ']');
}
console.log('\n   👉 分享出去的永远是同一个 ipns://' + ipnsName.slice(0, 12) + '… ');
console.log('      访问者每次解析都会拿到“当前最新”的 CID，无需换地址。');

console.log('\n   真实命令行等价操作（需本地 IPFS 节点）:');
console.log('     ipfs name publish /ipfs/<新CID>        # 用默认 key 把你的 IPNS 名指向新内容');
console.log('     ipfs name resolve /ipns/<你的IPNS名>   # 解析出当前指向的 CID');

console.log('\n📌 类比: IPNS 名 ≈ git 的 tag/分支（可移动），CID ≈ git 的 commit 哈希（固定快照）。');
