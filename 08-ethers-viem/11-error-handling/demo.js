/**
 * 11 · 错误处理 / revert 原因解析（只读，无需钱包）
 * -------------------------------------------------
 * 运行：node 11-error-handling/demo.js
 *
 * 交易/调用会因各种原因失败。ethers v6 把错误分门别类，带上有用字段：
 *   error.code        机器可读的错误码（CALL_EXCEPTION / INSUFFICIENT_FUNDS / ACTION_REJECTED …）
 *   error.shortMessage 人类可读简述
 *   error.reason      合约 revert 的原因字符串（require("xxx") 里的 xxx）
 *   error.info / .data 原始数据
 * 本 demo 故意触发一个 CALL_EXCEPTION 来演示如何解析。
 */

import { JsonRpcProvider, Contract } from "ethers";

const RPC_URL =
  process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);

  // ---- 案例 A：调用一个合约里【不存在】的方法 / 让其 revert ----
  // WETH.transfer 在余额不足时会 revert。用 staticCall 预演（不发交易）触发错误。
  const weth = new Contract(
    WETH,
    ["function transfer(address to, uint256 amount) returns (bool)"],
    provider
  );

  console.log("=== 案例 A：transfer 金额超余额，预期 revert ===");
  try {
    // staticCall：像 eth_call 一样"干跑"一次写方法，若会 revert 就在这抛错（不上链、不花钱）
    // 用一个零余额地址当发起者，转一个超大金额，必然失败
    await weth.transfer.staticCall(
      "0x000000000000000000000000000000000000dEaD",
      10n ** 30n,
      { from: "0x000000000000000000000000000000000000dEaD" }
    );
    console.log("（未触发错误，可能节点行为不同）");
  } catch (err) {
    console.log("捕获到错误：");
    console.log("  code         :", err.code);          // CALL_EXCEPTION
    console.log("  shortMessage :", err.shortMessage);  // execution reverted…
    console.log("  reason       :", err.reason);        // 合约给出的原因（若有）
  }

  // ---- 案例 B：地址写错 / 参数类型不对（本地就抛，属 INVALID_ARGUMENT）----
  console.log("\n=== 案例 B：非法地址参数 ===");
  try {
    await weth.transfer.staticCall("不是地址", 1n);
  } catch (err) {
    console.log("  code         :", err.code);          // INVALID_ARGUMENT
    console.log("  shortMessage :", err.shortMessage);
    console.log("  argument     :", err.argument, "=", err.value);
  }

  // ---- 案例 C：推荐的统一错误处理封装 ----
  console.log("\n=== 案例 C：可复用的错误翻译函数 ===");
  console.log(explainError({ code: "ACTION_REJECTED" }));
  console.log(explainError({ code: "INSUFFICIENT_FUNDS" }));
  console.log(explainError({ code: "CALL_EXCEPTION", reason: "ERC20: transfer amount exceeds balance" }));
}

// 把 ethers 错误码翻译成给用户看的中文提示
function explainError(err) {
  switch (err.code) {
    case "ACTION_REJECTED":
      return "→ 你在钱包里拒绝了这笔操作。";
    case "INSUFFICIENT_FUNDS":
      return "→ 余额不足以支付金额或 Gas，请先领测试币。";
    case "CALL_EXCEPTION":
      return `→ 合约执行失败：${err.reason || "未提供原因"}`;
    case "INVALID_ARGUMENT":
      return "→ 参数不合法（地址/金额格式错误）。";
    case "NETWORK_ERROR":
      return "→ 网络/RPC 异常，请重试或更换节点。";
    default:
      return `→ 未知错误（${err.code || "?"}）：${err.shortMessage || ""}`;
  }
}

main().catch((err) => {
  console.error("顶层出错：", err.shortMessage || err.message);
  process.exit(1);
});
