/**
 * EIP-2612 permit 链下签名示例（ethers v6）—— 教学用途
 *
 * 场景：owner 想授权 spender 花自己的代币，但不想自己发一笔 approve 交易。
 * 于是 owner 在链下用私钥对一个 EIP-712 结构化数据「签名」，
 * 得到 (v, r, s)，交给 spender / 中继者，由后者调用合约 permit() 完成授权。
 *
 * 运行：npm i ethers  然后  node sign-permit.js
 * 注意：这里用随机测试私钥，仅演示签名过程，绝不要用真实私钥。
 */
import { Wallet, Contract, JsonRpcProvider } from "ethers";

async function main() {
  // ---- 仅演示：随机/占位测试私钥，切勿使用真实资产的私钥 ----
  const OWNER_PRIVATE_KEY =
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"; // Hardhat 默认测试账户
  const TOKEN_ADDRESS = "0xYourTokenAddress";
  const SPENDER = "0xSpenderContractAddress";

  const provider = new JsonRpcProvider("http://127.0.0.1:8545"); // 本地节点/测试网
  const owner = new Wallet(OWNER_PRIVATE_KEY, provider);

  const abi = [
    "function name() view returns (string)",
    "function nonces(address) view returns (uint256)",
  ];
  const token = new Contract(TOKEN_ADDRESS, abi, provider);

  const name = await token.name();
  const nonce = await token.nonces(owner.address);
  const chainId = (await provider.getNetwork()).chainId;

  const value = 100n * 10n ** 18n; // 授权 100 个
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 小时后过期

  // EIP-712 三要素：domain / types / message，与合约里的 typehash 必须完全对应
  const domain = {
    name,
    version: "1",
    chainId,
    verifyingContract: TOKEN_ADDRESS,
  };
  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };
  const message = {
    owner: owner.address,
    spender: SPENDER,
    value,
    nonce,
    deadline,
  };

  // 用私钥签署 EIP-712 结构化数据（钱包里就是弹出的那种「签名」而非「交易」）
  const signature = await owner.signTypedData(domain, types, message);

  // 拆成 v, r, s，供合约 permit(owner, spender, value, deadline, v, r, s) 使用
  const r = signature.slice(0, 66);
  const s = "0x" + signature.slice(66, 130);
  const v = parseInt(signature.slice(130, 132), 16);

  console.log("owner   :", owner.address);
  console.log("spender :", SPENDER);
  console.log("value   :", value.toString());
  console.log("deadline:", deadline);
  console.log("v,r,s   :", v, r, s);
  console.log("\n把以上参数交给 spender / 中继者，调用 token.permit(...) 即可完成授权。");
  console.log("整个过程 owner 只『签名』，没有发交易，也就没花 gas。");
}

main().catch(console.error);
