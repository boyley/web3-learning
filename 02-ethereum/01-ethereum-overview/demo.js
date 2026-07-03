// 01 · 以太坊是什么 —— 用最简 JS 模拟「分布式状态机」
// 核心心智模型：Y(S, T) = S'
//   给定旧状态 S 和一笔合法交易 T，产生唯一确定的新状态 S'。
// 本文件纯本地运行，不联网、不涉及任何私钥或真实资产，仅供理解概念。

// ---------------------------------------------------------------
// 1. 世界状态（World State）：一个「地址 -> 余额(wei)」的映射。
//    真实以太坊的状态还包含 nonce / 合约代码 / 合约存储，这里简化。
// ---------------------------------------------------------------
const genesisState = {
  "0xAlice": 100n, // 用 BigInt 表示余额，贴近以太坊用大整数(wei)的习惯
  "0xBob": 50n,
  "0xCarol": 0n,
};

// ---------------------------------------------------------------
// 2. 状态转换函数（State Transition Function）
//    输入：旧状态 state、一笔交易 tx
//    输出：新状态（返回一个「副本」，体现状态不可变、每步产生新快照）
//    若交易非法（余额不足等），抛出错误 —— 该状态转换被拒绝。
// ---------------------------------------------------------------
function applyTransaction(state, tx) {
  const { from, to, value } = tx;

  // 校验 1：发送方必须存在
  if (!(from in state)) {
    throw new Error(`非法交易：账户 ${from} 不存在`);
  }
  // 校验 2：余额必须足够（这一步就是「防双花」的核心）
  if (state[from] < value) {
    throw new Error(
      `非法交易：${from} 余额 ${state[from]} 不足以转出 ${value}`
    );
  }

  // 生成新状态（浅拷贝旧状态，再修改），体现「每笔交易推进出一个新状态快照」
  const newState = { ...state };
  newState[from] = newState[from] - value;
  newState[to] = (newState[to] ?? 0n) + value; // 收款方若不存在则新建
  return newState;
}

// 打印状态的小工具
function printState(label, state) {
  const line = Object.entries(state)
    .map(([addr, bal]) => `${addr}=${bal}`)
    .join("  ");
  console.log(`${label.padEnd(14)} | ${line}`);
}

// ---------------------------------------------------------------
// 3. 依次施加多笔交易，观察状态如何一步步演进（S0 -> S1 -> S2 ...）
// ---------------------------------------------------------------
console.log("=== 以太坊 = 分布式状态机 的最小模拟 ===\n");

let state = genesisState;
printState("创世状态 S0", state);

const txs = [
  { from: "0xAlice", to: "0xBob", value: 30n }, // 合法
  { from: "0xBob", to: "0xCarol", value: 60n }, // 合法（Bob 此时有 50+30=80）
  { from: "0xCarol", to: "0xAlice", value: 999n }, // 非法：余额不足，会被拒绝
];

txs.forEach((tx, i) => {
  try {
    state = applyTransaction(state, tx);
    printState(`状态 S${i + 1}`, state);
  } catch (err) {
    console.log(`状态 S${i + 1}      | ✗ ${err.message}（状态保持不变）`);
  }
});

console.log("\n要点：");
console.log("- 每笔合法交易都把系统从一个状态确定性地推进到下一个状态。");
console.log("- 非法交易被状态转换函数拒绝，状态不变 —— 这就是全网一致的基础。");
console.log("- 真实以太坊由 EVM 执行、由 PoS 共识确认，但心智模型就是 Y(S,T)=S'。");
