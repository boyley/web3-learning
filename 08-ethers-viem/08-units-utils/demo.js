/**
 * 08 · 单位换算工具（纯本地，无需网络/钱包）
 * -------------------------------------------------
 * 运行：node 08-units-utils/demo.js
 *
 * 以太坊内部一切金额都用最小单位 wei（整数）。
 *   1 ETH   = 10^18 wei
 *   1 gwei  = 10^9  wei（Gas 单价常用 gwei）
 * ethers v6 用【原生 BigInt】表示 wei，配套 4 个换算函数：
 *   parseEther / formatEther / parseUnits / formatUnits
 */

import { parseEther, formatEther, parseUnits, formatUnits } from "ethers";

console.log("=== ETH <-> wei ===");
// 字符串 ETH -> wei（BigInt）。永远用 parseEther，别手写一串 0！
const wei = parseEther("1.5");
console.log('parseEther("1.5")      =', wei.toString(), "wei"); // 1500000000000000000
// wei（BigInt）-> 可读字符串
console.log("formatEther(上面的值)  =", formatEther(wei), "ETH"); // 1.5

console.log("\n=== 任意精度 parseUnits / formatUnits ===");
// Gas 单价用 gwei（9 位小数）
const gasPrice = parseUnits("30", "gwei");
console.log('parseUnits("30","gwei")=', gasPrice.toString(), "wei"); // 30000000000
console.log("formatUnits(., gwei)   =", formatUnits(gasPrice, "gwei"), "gwei");

// USDC 是 6 位小数（decimals=6），不是 18！展示代币金额必须用它自己的 decimals
const usdc = parseUnits("12.34", 6);
console.log('\nparseUnits("12.34", 6) =', usdc.toString(), "（USDC 最小单位）"); // 12340000
console.log("formatUnits(., 6)      =", formatUnits(usdc, 6), "USDC");

console.log("\n=== BigInt 运算注意事项 ===");
const a = parseEther("1.0");
const b = parseEther("0.3");
console.log("1.0 + 0.3 ETH =", formatEther(a + b), "ETH"); // BigInt 直接相加，精确
// ⚠️ 不能和普通 number 混算：parseEther("1") + 1 会抛错，要写 + 1n
console.log("加 1 wei      =", formatEther(a + 1n), "ETH");

console.log("\n=== 精度陷阱：别用浮点 ===");
// 反例：JS 浮点会丢精度，绝不要 Number(formatEther(x)) 再算钱
console.log("0.1 + 0.2 in JS float =", 0.1 + 0.2, "（浮点误差！）");
console.log("→ 金额计算全程留在 wei/BigInt，只在【显示】时才 format。");
