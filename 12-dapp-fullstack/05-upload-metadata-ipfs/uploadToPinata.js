// 把 NFT 的「图片」和「元数据 JSON」上传到 IPFS（通过 Pinata 固定服务 Pinning Service）
// 运行： node uploadToPinata.js ./nft.png
//
// 为什么要 IPFS？
//   NFT 的图片/元数据如果存在中心化服务器，服务器一关，NFT 就变「白图」。
//   IPFS 用「内容寻址」：文件内容决定它的地址（CID），内容不变地址就不变，天然防篡改。
//   但 IPFS 节点不会永久保存别人的文件，需要「Pinning（固定）」服务保证长期在线，
//   Pinata 就是最常用的一家（免费额度足够学习）。
//
// 前提：Node 18+（自带 fetch / FormData / Blob），并在 .env 里配置 PINATA_JWT。

require("dotenv").config();
const fs = require("fs");
const path = require("path");

const PINATA_JWT = process.env.PINATA_JWT;
if (!PINATA_JWT) {
  console.error("❌ 缺少 PINATA_JWT，请先 cp .env.example .env 并填入你的 Pinata JWT");
  process.exit(1);
}

// 通用：把 CID 拼成一个可在浏览器直接打开的网关地址（用于人眼预览）
const gateway = (cid) => `https://gateway.pinata.cloud/ipfs/${cid}`;

// 1) 上传一个文件（图片）到 IPFS，返回其 CID
async function uploadFile(filePath) {
  const data = fs.readFileSync(filePath);
  const form = new FormData();
  // Blob 包裹二进制内容；第三个参数是文件名
  form.append("file", new Blob([data]), path.basename(filePath));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` }, // 注意：用 FormData 时不要手动设 Content-Type
    body: form,
  });
  if (!res.ok) throw new Error(`上传图片失败: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.IpfsHash; // 这就是图片的 CID
}

// 2) 上传一段 JSON（元数据）到 IPFS，返回其 CID
async function uploadJSON(obj) {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(obj),
  });
  if (!res.ok) throw new Error(`上传元数据失败: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.IpfsHash;
}

async function main() {
  const imagePath = process.argv[2] || "./nft.png";
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ 找不到图片文件: ${imagePath}（用法： node uploadToPinata.js ./你的图片.png）`);
    process.exit(1);
  }

  // 第一步：上传图片
  console.log("正在上传图片 ...");
  const imageCID = await uploadFile(imagePath);
  console.log("✅ 图片 CID:", imageCID);
  console.log("   预览:", gateway(imageCID));

  // 第二步：按 OpenSea 元数据标准（EIP-721 Metadata）拼 JSON，
  //         image 字段务必用 ipfs:// 协议地址（去中心化），而不是某个网关的 https 地址。
  const metadata = {
    name: "My First dApp NFT #0",
    description: "Web3 学习合集 · 12 · 一条龙 dApp 实战铸造的第一枚 NFT（教学用途）。",
    image: `ipfs://${imageCID}`,
    attributes: [
      { trait_type: "Level", value: "Beginner" },
      { trait_type: "Course", value: "Web3 Learning" },
      { trait_type: "Module", value: 12 },
    ],
  };

  // 第三步：上传元数据 JSON
  console.log("正在上传元数据 JSON ...");
  const metadataCID = await uploadJSON(metadata);
  console.log("✅ 元数据 CID:", metadataCID);
  console.log("   预览:", gateway(metadataCID));

  // 这就是要传给合约 mint(uri) 的 tokenURI！
  console.log("\n🎉 把下面这个 tokenURI 传给合约的 mint() 即可：");
  console.log(`   ipfs://${metadataCID}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
