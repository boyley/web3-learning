// ============================================================================
// 跑测试时若开启 REPORT_GAS，会在结尾打印每个函数的 gas 消耗表。
// 注意：本测试【故意】不测 burn()，好让 coverage 报告显示它未被覆盖。
// ============================================================================
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Token（gas 报告 + 覆盖率演示）", function () {
  async function deployFixture() {
    const [owner, addr1] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy();
    return { token, owner, addr1 };
  }

  it("部署后 owner 持有全部代币", async function () {
    const { token, owner } = await loadFixture(deployFixture);
    expect(await token.balances(owner.address)).to.equal(1_000_000);
  });

  it("transfer 正常工作（这一步会被计入 gas 报告）", async function () {
    const { token, owner, addr1 } = await loadFixture(deployFixture);
    await token.transfer(addr1.address, 1000);
    expect(await token.balances(addr1.address)).to.equal(1000);
  });

  it("余额不足时 transfer 回滚", async function () {
    const { token, addr1 } = await loadFixture(deployFixture);
    await expect(
      token.connect(addr1).transfer(addr1.address, 1)
    ).to.be.revertedWith("Not enough tokens");
  });

  // 注意：没有测试 burn() —— 运行 npx hardhat coverage 时它会显示为“未覆盖”。
});
