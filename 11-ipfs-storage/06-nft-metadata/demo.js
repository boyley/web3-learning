/**
 * 06 · NFT 元数据存 IPFS —— 生成 metadata、算 CID、拼 tokenURI
 * ------------------------------------------------------------------
 * 运行:  node demo.js
 * 依赖:  无（Node 内置 crypto）
 *
 * 演示 NFT 的“图片 + 元数据 + tokenURI”三层如何用 IPFS 串起来:
 *   ① 图片 → CID(imageCID)，元数据里的 image 字段写 ipfs://imageCID
 *   ② 元数据 JSON → CID(metaCID)
 *   ③ 合约里 tokenURI(tokenId) 返回 ipfs://metaCID
 * 这样图片和元数据都不可篡改、去中心化，链上只存一个短地址。
 * ------------------------------------------------------------------
 */

const crypto = require('crypto');

const B32 = 'abcdefghijklmnopqrstuvwxyz234567';
function base32(bytes) {
  let bits = 0, value = 0, out = '';
  for (const b of bytes) { value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
/** 小文件内容 → CIDv1(raw)，等价 ipfs add --cid-version=1 --raw-leaves */
function toCID(buf) {
  const d = crypto.createHash('sha256').update(buf).digest();
  return 'b' + base32(Buffer.concat([Buffer.from([0x01, 0x55, 0x12, 0x20]), d]));
}

// ── ① 假设图片已上传，得到 imageCID（真实项目里是把 png 上传到 Pinata/Storacha）──
const fakeImageBytes = Buffer.from('«这里代表一张 PNG 的字节，仅演示»');
const imageCID = toCID(fakeImageBytes);
const imageURI = 'ipfs://' + imageCID;

// ── ② 构造 ERC-721 元数据 JSON（OpenSea/ERC-721 Metadata 标准）──
const metadata = {
  name: 'Web3 Learning Badge #1',
  description: '完成《Web3 学习合集 · 11-IPFS 去中心化存储》的纪念徽章。',
  // 关键: image 用 ipfs:// 而不是某个网关的 https 地址，避免网关下线后图裂
  image: imageURI,
  external_url: 'https://docs.ipfs.tech/',
  attributes: [
    { trait_type: 'Module', value: 'IPFS Storage' },
    { trait_type: 'Level', value: 'Beginner' },
    { display_type: 'number', trait_type: 'Year', value: 2026 },
  ],
};

// JSON 要稳定序列化，内容一变 CID 就变
const metaJSON = JSON.stringify(metadata, null, 2);
const metaBytes = Buffer.from(metaJSON, 'utf8');
const metaCID = toCID(metaBytes);
const tokenURI = 'ipfs://' + metaCID;

// ── 输出 ──────────────────────────────────────────────────────────
console.log('════════════════════════════════════════════════════════');
console.log('① 图片（image）:');
console.log('   imageCID :', imageCID);
console.log('   写入元数据的 image 字段 =', imageURI);
console.log('\n② 元数据 JSON（tokenURI 指向的内容）:');
console.log(metaJSON);
console.log('\n   metaCID  :', metaCID);
console.log('\n③ 合约 tokenURI(tokenId) 应返回:');
console.log('   ', tokenURI);
console.log('════════════════════════════════════════════════════════');

console.log('\n📎 前端/市场展示时，把 ipfs:// 拼成网关 URL 读取:');
console.log('   元数据: https://ipfs.io/ipfs/' + metaCID);
console.log('   图片  : https://ipfs.io/ipfs/' + imageCID);

console.log('\n🧩 对应的 Solidity（教学示意，OpenZeppelin ERC721）:');
console.log(`
  // 每个 tokenId 的元数据地址存成 ipfs://<metaCID>
  function tokenURI(uint256 tokenId) public view override returns (string memory) {
      _requireOwned(tokenId);
      return string.concat("ipfs://", _cids[tokenId]); // 只存短 CID，省 gas
  }
`);
console.log('⚠️ image 字段务必用 ipfs://，不要写死某个网关 https 地址，否则网关下线=图永久裂。');
