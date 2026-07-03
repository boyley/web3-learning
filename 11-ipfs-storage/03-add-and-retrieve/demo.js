/**
 * 03 · 添加与获取文件（Add & Retrieve）
 * ------------------------------------------------------------------
 * 运行:  node demo.js
 * 依赖:  无（用 Node 18+ 内置的全局 fetch 与 crypto）
 *
 * 演示 IPFS 的两个基本动作:
 *   1) add    —— 把内容变成 CID（这里本地算出 CIDv1(raw)，与 ipfs add 一致）
 *   2) cat/get —— 只凭 CID，通过公共网关把内容取回来
 * ------------------------------------------------------------------
 */

const crypto = require('crypto');

const B32 = 'abcdefghijklmnopqrstuvwxyz234567';
function base32(bytes) {
  let bits = 0, value = 0, out = '';
  for (const b of bytes) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
/** 本地把小文件内容算成 CIDv1(raw)，等价于 ipfs add --cid-version=1 --raw-leaves */
function toCIDv1Raw(buf) {
  const digest = crypto.createHash('sha256').update(buf).digest();
  const bytes = Buffer.concat([Buffer.from([0x01, 0x55, 0x12, 0x20]), digest]);
  return 'b' + base32(bytes);
}

async function main() {
  // ── 动作一: add ──────────────────────────────────────────────
  const content = 'Hello from web3-learning · ' + new Date().toISOString() + '\n';
  const cid = toCIDv1Raw(Buffer.from(content, 'utf8'));
  console.log('【add】把内容加入 IPFS（本地算 CID，无需联网）');
  console.log('  内容 :', JSON.stringify(content));
  console.log('  CID  :', cid);
  console.log('  → 真实场景里，`ipfs add file` 会把文件存进本地节点并 pin，然后返回同样的 CID。');
  console.log('  → 现在全网任何持有该内容的节点，都能用这个 CID 提供它。\n');

  // ── 动作二: retrieve ─────────────────────────────────────────
  // 用一个官方文档常用的经典示例 CID 来演示“取回”（它被大量节点 pin，稳定可取）
  const demoCID = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/wiki/Vincent_van_Gogh.html';
  const gateways = [
    'https://ipfs.io/ipfs/',
    'https://dweb.link/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
  ];
  console.log('【retrieve】只凭 CID，通过公共网关取回内容（会依次尝试多个网关）');
  console.log('  目标 CID:', demoCID, '\n');

  for (const gw of gateways) {
    const url = gw + demoCID;
    process.stdout.write('  尝试 ' + gw + ' … ');
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) { console.log('HTTP ' + res.status + '，换下一个'); continue; }
      const text = await res.text();
      console.log('✅ 成功，取回 ' + text.length + ' 字节');
      console.log('  内容前 120 字:', text.replace(/\s+/g, ' ').slice(0, 120), '…');
      console.log('\n  ✔ 注意：我们全程没有指定“哪台服务器有这份文件”，只给了 CID。');
      return;
    } catch (e) {
      console.log('失败(' + (e.name === 'AbortError' ? '超时' : e.message) + ')，换下一个');
    }
  }
  console.log('\n  ⚠️ 所有网关都没取到（可能是网络/网关限速）。这说明：');
  console.log('     CID 保证“拿到的一定是对的”，但“拿不拿得到”取决于是否有节点在提供+网关是否可用。');
}

main();
