/**
 * 09 · ABI 与 Interface 编解码（纯本地 + 一次只读调用）
 * -------------------------------------------------
 * 运行：node 09-abi-interface/demo.js
 *
 * Contract 帮你自动 ABI 编解码；但理解底层的 Interface 很重要：
 *   - encodeFunctionData  把"调用哪个方法+参数"编码成 calldata（0x...）
 *   - decodeFunctionResult 把返回的 bytes 解码回 JS 值
 *   - parseTransaction / parseLog 反解已有的 calldata / 日志
 * 这在自己拼交易、解析未知交易、读日志时非常有用。
 */

import { Interface, JsonRpcProvider, formatUnits } from "ethers";

const ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

const iface = new Interface(ABI);

console.log("=== 1) 把函数调用编码成 calldata ===");
// 前 4 字节是函数选择器（keccak256(签名) 的前 4 字节），其余是参数
const owner = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
const calldata = iface.encodeFunctionData("balanceOf", [owner]);
console.log("balanceOf calldata:", calldata);
console.log("函数选择器        :", calldata.slice(0, 10)); // 0x70a08231

console.log("\n=== 2) 解码函数返回值 ===");
// 假设节点返回了这段 bytes（32 字节的 uint256 = 1 ETH 的 wei）
const rawReturn =
  "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000";
const [balance] = iface.decodeFunctionResult("balanceOf", rawReturn);
console.log("解码得到余额:", formatUnits(balance, 18));

console.log("\n=== 3) 反解一段未知 calldata（如从区块浏览器拿到）===");
const someCalldata = iface.encodeFunctionData("transfer", [owner, 12345n]);
const parsed = iface.parseTransaction({ data: someCalldata });
console.log("方法名  :", parsed.name);        // transfer
console.log("参数    :", parsed.args.map(String)); // [to, amount]

console.log("\n=== 4) 解析一条日志（log -> 事件名+参数）===");
// 用 encodeEventLog 造一条 Transfer 日志再解回来，演示 parseLog
const fragment = iface.getEvent("Transfer");
const encoded = iface.encodeEventLog(fragment, [owner, owner, 500n]);
const log = iface.parseLog({ topics: encoded.topics, data: encoded.data });
console.log("事件名  :", log.name); // Transfer
console.log("from    :", log.args.from);
console.log("value   :", log.args.value.toString());

console.log("\n=== 5) 用手工 calldata 发一次真实 eth_call（只读）===");
(async () => {
  const provider = new JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"
  );
  const WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
  const data = iface.encodeFunctionData("balanceOf", [WETH]);
  // 绕过 Contract，直接用 provider.call + 手工 calldata
  const ret = await provider.call({ to: WETH, data });
  const [bal] = iface.decodeFunctionResult("balanceOf", ret);
  console.log("手工 eth_call 得到 WETH 自持余额:", formatUnits(bal, 18), "WETH");
})().catch((e) => console.error(e));
