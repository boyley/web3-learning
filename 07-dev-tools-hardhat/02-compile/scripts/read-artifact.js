// ============================================================================
// read-artifact.js —— 演示如何读取编译产物（artifact），打印 ABI 与字节码长度。
// 运行：npx hardhat run scripts/read-artifact.js
// （必须先 npx hardhat compile 生成 artifacts/）
// ============================================================================
const hre = require("hardhat"); // hre = Hardhat Runtime Environment，脚本里的万能入口

async function main() {
  // hre.artifacts.readArtifact 按合约名读取编译产物
  const artifact = await hre.artifacts.readArtifact("Box");

  console.log("合约名称:", artifact.contractName);
  console.log("ABI 条目数:", artifact.abi.length);
  console.log("---- ABI（合约的“接口说明书”，前端/ethers 靠它调用合约）----");
  // 只打印函数与事件的名字，方便阅读
  for (const item of artifact.abi) {
    console.log(`  [${item.type}] ${item.name ?? ""}`);
  }

  console.log("---- 字节码 bytecode（部署到链上的机器码）----");
  console.log("  长度(字符):", artifact.bytecode.length);
  console.log("  前 40 字符:", artifact.bytecode.slice(0, 40), "...");
}

// 标准的错误处理模板：捕获异常并以非 0 退出码结束。
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
