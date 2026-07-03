// 06 · 非对称加密 / 公私钥 demo —— 纯 Node，无需联网 / 钱包 / 第三方库
// 运行：node demo.js
//
// 目标：用 Node 内置 crypto 生成一对密钥，演示非对称密码学的两大用途
//   A) 加密通信：别人用你的「公钥」加密，只有你的「私钥」能解密
//   B) 数字签名：你用「私钥」签名，任何人用你的「公钥」验签（详见模块 07）
// 区块链主要用途是 (B) 签名；这里两者都演示，帮助建立公私钥的整体认知。

const crypto = require("crypto");

console.log("========== 1. 生成一对密钥（公钥 + 私钥）==========");
// 教学用 RSA 便于直接做「加密/解密」演示；
// 注意：比特币/以太坊实际用的是椭圆曲线 secp256k1（更短、更适合签名），见下方说明。
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});
console.log("公钥(public key)  —— 可以公开给任何人，用来加密给你/验证你的签名");
console.log(publicKey.split("\n").slice(0, 2).join("\n"), "...(略)\n");
console.log("私钥(private key) —— 必须严格保密！掌握它 = 拥有这个身份/这笔钱");
console.log(privateKey.split("\n").slice(0, 2).join("\n"), "...(略)\n");

console.log("========== 2. 用途A：加密通信（公钥加密 → 私钥解密）==========");
const message = "只给你看的秘密：明天老地方见";
// 别人拿你「公开」的公钥加密
const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(message, "utf8"));
console.log("明文        :", message);
console.log("公钥加密后  :", encrypted.toString("base64").slice(0, 48), "...(密文)");
// 只有你用「私钥」才能解开
const decrypted = crypto.privateDecrypt(privateKey, encrypted);
console.log("私钥解密后  :", decrypted.toString("utf8"));
console.log("→ 公钥加密的东西，只有对应私钥能解。这解决了「不安全信道上安全传密」的难题。\n");

console.log("========== 3. 用途B：数字签名（私钥签名 → 公钥验签）==========");
const doc = "我(Alice)同意向 Bob 转账 10 币";
// 用私钥对文档签名（证明「这是私钥持有者认可的」）
const signature = crypto.sign("sha256", Buffer.from(doc), privateKey);
console.log("文档        :", doc);
console.log("私钥签名    :", signature.toString("base64").slice(0, 48), "...(签名)");
// 任何人用公钥验证签名是否有效、文档是否被改
const ok = crypto.verify("sha256", Buffer.from(doc), publicKey, signature);
console.log("公钥验签    :", ok, "✅ 签名有效，且文档一字未改");
// 篡改文档后再验，立刻失败
const okTampered = crypto.verify("sha256", Buffer.from(doc + "0"), publicKey, signature);
console.log("篡改后验签  :", okTampered, "❌ 文档被改 → 验签失败\n");

console.log("========== 关键直觉 ==========");
console.log("  公钥 : 可公开，像「银行账号」/「验证图章的模板」");
console.log("  私钥 : 须保密，像「取款密码」/「你手里独一无二的印章」");
console.log("  谁掌握私钥，谁就能动这个身份的资产 —— 所以私钥丢了/被盗 = 钱没了。");
console.log("");
console.log("📌 区块链现实：比特币/以太坊用椭圆曲线 secp256k1（不是 RSA）。");
console.log("   它主要用于「数字签名」(模块07)，且公钥可从签名反推(ecrecover)，");
console.log("   钱包地址由公钥哈希而来(模块08)。原理与本 demo 的「私钥签、公钥验」完全一致。");
