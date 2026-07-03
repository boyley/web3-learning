// 05 · EVM —— 一个带 Gas 计量的极简「栈式虚拟机」模拟器
// 纯本地运行，不联网、无依赖。演示 EVM「压栈—弹栈—计费」的核心机制。
// 运行： node demo.js

// ---------------------------------------------------------------
// 1) 每个 opcode 的 Gas 价目（模拟真实 EVM，数值做了简化）。
// ---------------------------------------------------------------
const GAS = {
  PUSH: 3, // 把一个值压入栈
  ADD: 3, //  弹出两个数，相加，压回
  MUL: 5, //  弹出两个数，相乘，压回
  SSTORE: 20000, // 写存储（真实 EVM 里很贵，这里用来演示 out of gas）
};

// ---------------------------------------------------------------
// 2) 极简 EVM：给定「字节码」（opcode 序列）和 gasLimit，逐条执行。
// ---------------------------------------------------------------
function runEVM(bytecode, gasLimit) {
  const stack = []; // EVM 的栈（真实为 1024 槽、每槽 256bit）
  let gasUsed = 0;

  console.log(`\n开始执行（gasLimit=${gasLimit}）`);
  for (const instr of bytecode) {
    const [op, arg] = instr;
    const cost = GAS[op];

    // 计费：先检查是否超限，超了就 out of gas -> 回滚
    if (gasUsed + cost > gasLimit) {
      console.log(`  ✗ ${op} 需 ${cost} gas，但剩余不足 -> OUT OF GAS，整笔回滚！`);
      console.log(`    （已消耗 ${gasUsed} gas 不退还，状态复原）`);
      return { ok: false, gasUsed, result: undefined };
    }
    gasUsed += cost;

    // 执行 opcode
    switch (op) {
      case "PUSH":
        stack.push(arg);
        break;
      case "ADD": {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a + b);
        break;
      }
      case "MUL": {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(a * b);
        break;
      }
      case "SSTORE":
        // 演示用：假装把栈顶写入存储
        stack.pop();
        break;
      default:
        throw new Error("未知 opcode: " + op);
    }

    const shown = op === "PUSH" ? `${op} ${arg}` : op;
    console.log(`  ${shown.padEnd(8)} | 花 ${String(cost).padStart(5)} gas | 累计 ${String(gasUsed).padStart(6)} | 栈: [${stack.join(", ")}]`);
  }

  console.log(`  ✓ 执行完成，结果 = ${stack[stack.length - 1]}，共消耗 ${gasUsed} gas`);
  return { ok: true, gasUsed, result: stack[stack.length - 1] };
}

// ---------------------------------------------------------------
// 3) 示例：计算 (3 + 5) * 2 = 16
//    对应 opcode： PUSH 3, PUSH 5, ADD, PUSH 2, MUL
// ---------------------------------------------------------------
console.log("=== EVM 栈机模拟：计算 (3 + 5) * 2 ===");
const program = [
  ["PUSH", 3n],
  ["PUSH", 5n],
  ["ADD"], //        栈: [3,5] -> [8]
  ["PUSH", 2n],
  ["MUL"], //        栈: [8,2] -> [16]
];
runEVM(program, 1000); // gas 充足，正常算出 16

// ---------------------------------------------------------------
// 4) 演示 out of gas：加一条昂贵的 SSTORE，但 gasLimit 给很小。
// ---------------------------------------------------------------
console.log("\n=== 演示 OUT OF GAS（gasLimit 太小） ===");
const expensive = [
  ["PUSH", 42n],
  ["SSTORE"], // 需 20000 gas，但下面只给 100
];
runEVM(expensive, 100);

console.log("\n要点：每条 opcode 都计费；写存储(SSTORE)极贵；gas 不够则整笔回滚且不退 gas。");
