// ============================================================================
// 运行这个测试时，合约里的 console.log 会直接打印到你的终端。
// 运行：npx hardhat test
// ============================================================================
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("ConsoleDemo（观察终端里的 console.log 输出）", function () {
  async function deployFixture() {
    const [owner, addr1] = await ethers.getSigners();
    const C = await ethers.getContractFactory("ConsoleDemo");
    const c = await C.deploy();
    return { c, owner, addr1 };
  }

  it("transfer 时合约会把调试信息打印到终端", async function () {
    const { c, owner, addr1 } = await loadFixture(deployFixture);

    // 这一步会触发合约里的多条 console.log，注意看终端输出
    await c.transfer(addr1.address, 300);

    expect(await c.balances(owner.address)).to.equal(700);
    expect(await c.balances(addr1.address)).to.equal(300);
  });
});
