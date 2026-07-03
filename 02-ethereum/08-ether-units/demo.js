// 08 · 以太币单位换算 —— wei / gwei / ether 互转（ethers v6，纯本地）
// 运行前：npm install（在 02-ethereum 目录），或单独 `npm i ethers`
// 运行：  node demo.js

import { ethers } from "ethers";

// ---------------------------------------------------------------
// 1) 三个必记换算点
// ---------------------------------------------------------------
console.log("=== 单位换算基准 ===");
console.log("1 ether =", ethers.parseEther("1").toString(), "wei   (10^18)");
console.log("1 gwei  =", ethers.parseUnits("1", "gwei").toString(), "wei            (10^9)");
console.log("1 ether =", ethers.formatUnits(ethers.parseEther("1"), "gwei"), "gwei         (10^9)");
console.log("");

// ---------------------------------------------------------------
// 2) parse（人输入 -> wei） / format（wei -> 展示）四件套
// ---------------------------------------------------------------
console.log("=== parse / format 互转 ===");
const weiFromEther = ethers.parseEther("1.5"); // "1.5" ether -> wei
console.log('parseEther("1.5")            =', weiFromEther.toString(), "wei");
console.log("formatEther(上面)             =", ethers.formatEther(weiFromEther), "ether");

const weiFromGwei = ethers.parseUnits("20", "gwei"); // 20 gwei -> wei（典型 Gas 价）
console.log('parseUnits("20","gwei")      =', weiFromGwei.toString(), "wei");
console.log('formatUnits(上面,"gwei")      =', ethers.formatUnits(weiFromGwei, "gwei"), "gwei");
console.log("");

// ---------------------------------------------------------------
// 3) 用 wei(BigInt) 做精确运算：算一笔转账 + 手续费的总支出
// ---------------------------------------------------------------
console.log("=== 用 BigInt(wei) 精确运算 ===");
const amount = ethers.parseEther("0.25"); // 转账 0.25 ETH
const gasUsed = 21000n; // 纯转账 Gas 用量
const gasPrice = ethers.parseUnits("15", "gwei"); // 15 gwei/gas
const fee = gasUsed * gasPrice; // 手续费(wei)，整数相乘，零误差
const total = amount + fee; // 总支出(wei)

console.log("转账金额 :", ethers.formatEther(amount), "ETH");
console.log("手续费   :", ethers.formatEther(fee), "ETH", `(21000 × 15 gwei)`);
console.log("总支出   :", ethers.formatEther(total), "ETH");
console.log("");

// ---------------------------------------------------------------
// 4) 反面教材：浮点数为什么不能用来算钱
// ---------------------------------------------------------------
console.log("=== 为什么必须用 wei/BigInt（浮点误差演示） ===");
console.log("JS 浮点: 0.1 + 0.2 =", 0.1 + 0.2, "  ← 不是 0.3！算钱会出错");
const a = ethers.parseEther("0.1");
const b = ethers.parseEther("0.2");
console.log("wei 整数: 0.1 + 0.2 =", ethers.formatEther(a + b), "ETH  ← 精确", );
