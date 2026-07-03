/**
 * 10 · ENS 域名解析（只读，无需钱包）
 * -------------------------------------------------
 * 运行：node 10-ens/demo.js
 *
 * ENS（Ethereum Name Service）把人类可读的域名（vitalik.eth）映射到地址。
 * ⚠️ ENS 主注册表在【主网】上，所以本 demo 连主网【只读】节点（不花钱、不发交易）。
 *   - resolveName(name)    域名 -> 地址（正向解析）
 *   - lookupAddress(addr)  地址 -> 主域名（反向解析）
 *   - getResolver + getText 读取头像/文本记录
 */

import { JsonRpcProvider } from "ethers";

// ENS 在主网，用主网公共只读 RPC（无 Key）
const MAINNET_RPC =
  process.env.MAINNET_RPC_URL || "https://ethereum-rpc.publicnode.com";

async function main() {
  const provider = new JsonRpcProvider(MAINNET_RPC);

  // 1) 正向解析：域名 -> 地址
  const name = "vitalik.eth";
  const address = await provider.resolveName(name);
  console.log(`resolveName("${name}") =>`, address);

  // 2) 反向解析：地址 -> 主域名（该地址需在 ENS 设置了 primary name 才有）
  if (address) {
    const primary = await provider.lookupAddress(address);
    console.log(`lookupAddress("${address.slice(0, 10)}…") =>`, primary);
  }

  // 3) 读取文本记录（如 avatar / twitter / url）
  const resolver = await provider.getResolver(name);
  if (resolver) {
    const avatar = await resolver.getText("avatar");
    const url = await resolver.getText("url");
    console.log("avatar 记录 :", avatar || "(未设置)");
    console.log("url 记录    :", url || "(未设置)");
  }

  // 4) 实用点：ethers 很多方法可直接吃 ENS 名（内部自动解析）
  const balance = await provider.getBalance(name); // 直接传域名
  console.log(`\n${name} 的 ETH 余额:`, balance.toString(), "wei");
}

main().catch((err) => {
  console.error("出错了：", err);
  process.exit(1);
});
