/**
 * 05 · Pinning 固定服务 —— 把内容上传并长期 pin 到 IPFS
 * ------------------------------------------------------------------
 * 运行:
 *   node demo.js            # 干跑：只打印将要发送的请求（不需要 key，安全）
 *   PINATA_JWT=你的JWT node demo.js   # 真上传（自行到 pinata.cloud 申请 JWT）
 *
 * 依赖: 无（用 Node 18+ 内置的 fetch / FormData / Blob）
 *
 * ⚠️ 安全: 绝不要把真实 JWT / API Key 写进代码或提交到仓库！
 *          用环境变量 / .env（并 gitignore）。JWT 是机密，泄露=别人能用你的额度。
 * ------------------------------------------------------------------
 */

// ── Pinata v3 上传（官方当前推荐的 REST 端点）─────────────────────
// 端点:   POST https://uploads.pinata.cloud/v3/files
// 认证:   Authorization: Bearer <PINATA_JWT>
// 返回:   { data: { id, cid, ... } }，cid 即内容的 CID
const PINATA_UPLOAD_URL = 'https://uploads.pinata.cloud/v3/files';

async function uploadToPinata(jwt, filename, content) {
  const form = new FormData();
  // 用 Blob 构造一个内存文件；真实项目可用 fs 读文件再包成 Blob
  form.append('file', new Blob([content], { type: 'text/plain' }), filename);
  form.append('network', 'public'); // public=可被公共网关读取；也可选 private

  const res = await fetch(PINATA_UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + jwt }, // 注意：FormData 的 Content-Type 让 fetch 自动带 boundary
    body: form,
  });
  if (!res.ok) throw new Error('Pinata 返回 HTTP ' + res.status + ': ' + (await res.text()));
  return res.json();
}

async function main() {
  const filename = 'hello-web3.txt';
  const content = 'Hello from web3-learning 05-pinning · ' + new Date().toISOString() + '\n';
  const jwt = process.env.PINATA_JWT;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('要上传并 pin 的内容:', JSON.stringify(content));
  console.log('目标端点          :', PINATA_UPLOAD_URL);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (!jwt) {
    // 干跑模式：不需要 key，打印等价的 curl，方便你理解 / 自行替换
    console.log('ℹ️  未检测到 PINATA_JWT，进入【干跑模式】(不真正上传)。');
    console.log('   到 https://app.pinata.cloud 申请 JWT 后，这样真上传:\n');
    console.log('   PINATA_JWT=<你的JWT> node demo.js\n');
    console.log('   等价的 curl:');
    console.log('   curl -X POST ' + PINATA_UPLOAD_URL + ' \\');
    console.log('        -H "Authorization: Bearer $PINATA_JWT" \\');
    console.log('        -F "network=public" \\');
    console.log('        -F "file=@./' + filename + '"\n');
    console.log('   成功后返回形如: { "data": { "cid": "bafkrei...", "id": "..." } }');
    console.log('   之后就能用任意网关读取: https://ipfs.io/ipfs/<cid>');
    return;
  }

  console.log('🔑 检测到 PINATA_JWT，开始真实上传…\n');
  try {
    const out = await uploadToPinata(jwt, filename, content);
    const cid = out?.data?.cid;
    console.log('✅ 上传并 pin 成功!');
    console.log('   完整返回:', JSON.stringify(out, null, 2));
    if (cid) {
      console.log('\n   CID  :', cid);
      console.log('   读取 : https://ipfs.io/ipfs/' + cid);
      console.log('   或专属网关: https://gateway.pinata.cloud/ipfs/' + cid);
    }
  } catch (e) {
    console.error('❌ 上传失败:', e.message);
  }
}

main();

/* ──────────────────────────────────────────────────────────────────
 * 参考: 其它主流 pinning / 上传服务（API 会演进，用前请对照各自官方文档）
 *
 * 1) Pinata 官方 SDK（比手写 fetch 更省事）:
 *      npm i pinata
 *      import { PinataSDK } from "pinata";
 *      const pinata = new PinataSDK({ pinataJwt: process.env.PINATA_JWT });
 *      const file = new File(["hello"], "hello.txt", { type: "text/plain" });
 *      const { cid } = await pinata.upload.public.file(file);
 *
 * 2) Storacha（原 web3.storage / nft.storage 的后继，w3up 协议，走 UCAN 授权）:
 *      npm i @web3-storage/w3up-client
 *      import { create } from '@web3-storage/w3up-client';
 *      const client = await create();
 *      // 首次需 client.login('you@example.com') 并创建/选择 space
 *      const cid = await client.uploadFile(new Blob(["hello"]));
 *   注: 老的 nft.storage “Classic” 上传 API 已进入维护/受限状态，新项目走 Storacha。
 * ────────────────────────────────────────────────────────────────── */
