/**
 * 04 · Signer / Wallet（Node 版，演示"随机钱包"概念，无需真实资产）
 * -------------------------------------------------
 * 运行：node 04-signer-wallet/demo.js
 *
 * 浏览器里 Signer 来自 MetaMask（见 index.html），私钥永远在钱包里。
 * Node 里没有 MetaMask，用 Wallet 从私钥创建 Signer。
 * 本 demo 只【随机生成】一个测试钱包做签名演示，绝不涉及真实资产。
 */

import { Wallet, JsonRpcProvider, verifyMessage } from "ethers";

async function main() {
  // 1) 随机生成一个全新钱包（教学用，切勿存真实资产）
  const wallet = Wallet.createRandom();
  console.log("=== 随机生成的测试钱包（勿存真钱）===");
  console.log("地址   :", wallet.address);
  console.log("助记词 :", wallet.mnemonic.phrase);
  // ⚠️ 真实项目里私钥/助记词绝不能打印或提交，这里仅为教学展示

  // 2) 把钱包接到一个 Provider 上，它就成了能读能签的完整 Signer
  const provider = new JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"
  );
  const signer = wallet.connect(provider);
  const balance = await provider.getBalance(signer.address);
  console.log("Sepolia 余额:", balance.toString(), "wei（新钱包当然是 0）");

  // 3) 用私钥签名一条消息（链下、免费），再验证签名者
  const message = "hello ethers v6";
  const signature = await signer.signMessage(message);
  const recovered = verifyMessage(message, signature);
  console.log("\n签名     :", signature);
  console.log("恢复地址 :", recovered);
  console.log("验证通过 :", recovered === wallet.address);
}

main().catch((err) => {
  console.error("出错了：", err);
  process.exit(1);
});
