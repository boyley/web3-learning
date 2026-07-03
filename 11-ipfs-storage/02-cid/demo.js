/**
 * 02 · CID 内容标识符 —— 亲手算出一个真实的 CID
 * ------------------------------------------------------------------
 * 运行:  node demo.js
 * 依赖:  无（只用 Node 内置的 crypto，零 npm 安装）
 *
 * 本 demo 会对一段内容，一步步拼出 CIDv1(raw) —— 这个结果与
 *   ipfs add --cid-version=1 --raw-leaves ...
 * 以及 Pinata 公共上传返回的 CID（bafkrei... 开头）对小文件是【逐字节一致】的。
 * 也就是说，这不是模拟，是真的能对上官方工具的结果。
 * ------------------------------------------------------------------
 */

const crypto = require('crypto');

// ── 编码表 ────────────────────────────────────────────────────────
// base32（RFC4648，小写，无填充）—— CIDv1 默认用它，多base前缀是 'b'
const B32 = 'abcdefghijklmnopqrstuvwxyz234567';
// base58btc —— CIDv0 用它，多base前缀省略（历史原因），结果以 Qm 开头
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** 把字节数组按 base32(RFC4648, 无填充, 小写) 编码 */
function base32(bytes) {
  let bits = 0, value = 0, out = '';
  for (const b of bytes) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

/** 把字节数组按 base58btc 编码（CIDv0 用） */
function base58(bytes) {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const digits = [0];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry) { digits.push(carry % 58); carry = (carry / 58) | 0; }
  }
  let out = '1'.repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i--) out += B58[digits[i]];
  return out;
}

// ── 主流程 ────────────────────────────────────────────────────────
const content = process.argv.slice(2).join(' ') || 'Hello, IPFS!\n';
const data = Buffer.from(content, 'utf8');

console.log('════════════════════════════════════════════════════════');
console.log('内容(content):', JSON.stringify(content));
console.log('字节数(bytes):', data.length);
console.log('════════════════════════════════════════════════════════\n');

// 第 1 步：对内容算 SHA-256（这是“内容 → 指纹”的核心）
const digest = crypto.createHash('sha256').update(data).digest();
console.log('① SHA-256 摘要 (32 bytes):');
console.log('   ', digest.toString('hex'), '\n');

// 第 2 步：包成 multihash = [哈希函数码 0x12=sha2-256][摘要长度 0x20=32][摘要]
//   multihash 让 CID 自带“我用的是哪种哈希”，未来换算法也不冲突。
const multihash = Buffer.concat([Buffer.from([0x12, 0x20]), digest]);
console.log('② multihash = 0x12(sha2-256) + 0x20(len=32) + 摘要:');
console.log('   ', multihash.toString('hex'), '\n');

// 第 3 步：拼 CIDv1 字节 = [版本 0x01][多编解码器][multihash]
//   0x55 = raw（裸字节，用于小文件叶子块，Pinata 公共上传就是它）
//   0x70 = dag-pb（UnixFS 打包，ipfs 默认包装大文件/目录时用）
const cidv1RawBytes = Buffer.concat([Buffer.from([0x01, 0x55]), multihash]);
// 第 4 步：多base编码：base32 + 前缀 'b'
const cidv1 = 'b' + base32(cidv1RawBytes);

// CIDv0：就是 base58(multihash)，没有版本/编码字节，固定 dag-pb，以 Qm 开头
const cidv0 = base58(multihash);

console.log('③ 组装结果:');
console.log('   CIDv1 (raw, base32) :', cidv1);
console.log('       └─ 结构 = base32( 0x01 版本 | 0x55 raw | multihash )');
console.log('       └─ 与  ipfs add --cid-version=1 --raw-leaves  对小文件逐字节一致 ✅');
console.log('       └─ 与  Pinata 公共上传返回的 bafkrei... 一致 ✅\n');

console.log('   CIDv0 (base58)       :', cidv0);
console.log('       └─ 结构 = base58( multihash )，无版本字节，固定 dag-pb，Qm 开头');
console.log('       └─ 注意: CIDv0 只用于 dag-pb，所以它并不代表上面这段 raw 内容，');
console.log('              这里只是演示【同一个 multihash 换 base58 编码】的样子。\n');

console.log('👉 想验证? 安装 IPFS 后执行:');
console.log('   printf %s ' + JSON.stringify(content) + " | ipfs add --cid-version=1 --raw-leaves -Q");
console.log('   （或把这段内容用 Pinata 公共上传，对比返回的 cid 字段）\n');

// 演示“改一个字节，CID 完全不同”
const data2 = Buffer.from(content + ' ', 'utf8'); // 只多一个空格
const cid2 = 'b' + base32(Buffer.concat([Buffer.from([0x01, 0x55]),
  Buffer.from([0x12, 0x20]), crypto.createHash('sha256').update(data2).digest()]));
console.log('════════════════════════════════════════════════════════');
console.log('内容加一个空格后的 CIDv1:', cid2);
console.log('对比原 CIDv1            :', cidv1);
console.log('→ 内容变一点，CID 天翻地覆，这就是“内容寻址 + 自校验”的根基。');
console.log('════════════════════════════════════════════════════════');
