// ============================================================================
// Token.test.js —— 用 Mocha（describe/it）+ Chai（expect）+ ethers v6 写单元测试
// 运行：npx hardhat test
//
// 关键概念：
//   - loadFixture：只在第一次真正部署合约，之后每个测试用【快照回滚】秒级还原状态，
//     既保证测试互相隔离、又非常快。来自 @nomicfoundation/hardhat-network-helpers。
//   - hardhat-chai-matchers 提供 .revertedWith / .emit / .changeTokenBalances 等断言。
// ============================================================================

const { expect } = require("chai");
const { ethers } = require("hardhat");
// loadFixture：test 里复用“已部署好的干净环境”的推荐方式
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Token 合约", function () {
  // ---- fixture：描述“部署一份全新 Token”的过程，只写一次，处处复用 ----
  async function deployTokenFixture() {
    // getSigners 返回内置本地链的测试账户；第一个默认为部署者
    const [owner, addr1, addr2] = await ethers.getSigners();

    // 部署合约（ethers v6 写法）
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy();

    // fixture 返回的东西，会被每个 it 拿到
    return { token, owner, addr1, addr2 };
  }

  describe("部署", function () {
    it("应把全部代币分配给部署者", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(ownerBalance);
    });

    it("应正确设置 owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  describe("转账", function () {
    it("应能在账户之间转账", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);

      // owner 给 addr1 转 50
      await token.transfer(addr1.address, 50);
      expect(await token.balanceOf(addr1.address)).to.equal(50);
    });

    it("余额变化断言：changeTokenBalances 帮你算差值", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);
      // 一句断言同时校验 owner -100、addr1 +100
      await expect(
        token.transfer(addr1.address, 100)
      ).to.changeTokenBalances(token, [owner, addr1], [-100, 100]);
    });

    it("应触发 Transfer 事件且参数正确", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);
      await expect(token.transfer(addr1.address, 7))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr1.address, 7);
    });

    it("余额不足时应 revert 并带指定错误信息", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);
      // addr1 初始为 0，转账必然失败
      await expect(
        token.connect(addr1).transfer(addr1.address, 1)
      ).to.be.revertedWith("Not enough tokens");
    });
  });
});
