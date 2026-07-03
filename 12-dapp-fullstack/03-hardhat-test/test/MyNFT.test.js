// MyNFT 合约单元测试（Hardhat + Mocha + Chai + ethers v6）
// 运行： npx hardhat test
//
// 测试的意义：合约一旦部署上链就不可改，任何 bug 都可能造成资金/资产损失。
// 因此「部署前把每个函数、每个边界、每个权限都测一遍」是智能合约开发的铁律。

const { expect } = require("chai");
const { ethers } = require("hardhat");
// loadFixture：只执行一次部署，后续每个测试都从这个快照「秒回滚」，又快又干净。
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("MyNFT", function () {
  // 部署夹具：返回合约实例与几个测试账户
  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();
    const MyNFT = await ethers.getContractFactory("MyNFT");
    // 构造函数需要 initialOwner（OZ v5 Ownable 的要求）
    const nft = await MyNFT.deploy(owner.address);
    await nft.waitForDeployment();
    return { nft, owner, alice, bob };
  }

  const TOKEN_URI = "ipfs://bafkreiexampleexampleexampleexample/0.json";

  describe("部署", function () {
    it("集合名与符号正确", async function () {
      const { nft } = await loadFixture(deployFixture);
      expect(await nft.name()).to.equal("MyNFT");
      expect(await nft.symbol()).to.equal("MNFT");
    });

    it("owner 被设置为部署者", async function () {
      const { nft, owner } = await loadFixture(deployFixture);
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("初始总铸造量为 0", async function () {
      const { nft } = await loadFixture(deployFixture);
      expect(await nft.totalMinted()).to.equal(0n);
    });
  });

  describe("铸造 mint()", function () {
    it("任何人都能给自己铸造，余额与所有权正确", async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      // 用 alice 的身份调用（connect 切换 msg.sender）
      await nft.connect(alice).mint(TOKEN_URI);

      expect(await nft.balanceOf(alice.address)).to.equal(1n);
      expect(await nft.ownerOf(0)).to.equal(alice.address); // 第一枚 tokenId = 0
      expect(await nft.totalMinted()).to.equal(1n);
    });

    it("tokenURI 被正确绑定", async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      await nft.connect(alice).mint(TOKEN_URI);
      expect(await nft.tokenURI(0)).to.equal(TOKEN_URI);
    });

    it("tokenId 从 0 开始自增", async function () {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.connect(alice).mint(TOKEN_URI);
      await nft.connect(bob).mint(TOKEN_URI);
      expect(await nft.ownerOf(0)).to.equal(alice.address);
      expect(await nft.ownerOf(1)).to.equal(bob.address);
    });

    it("铸造时抛出 Minted 事件，参数正确", async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      await expect(nft.connect(alice).mint(TOKEN_URI))
        .to.emit(nft, "Minted")
        .withArgs(alice.address, 0, TOKEN_URI);
    });

    it("铸造同时抛出标准 Transfer 事件（from = 零地址）", async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      await expect(nft.connect(alice).mint(TOKEN_URI))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.ZeroAddress, alice.address, 0);
    });
  });

  describe("可枚举 Enumerable（模块 09「我的 NFT」列表的基础）", function () {
    it("能按序号列出某地址持有的全部 tokenId", async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      await nft.connect(alice).mint(TOKEN_URI);
      await nft.connect(alice).mint(TOKEN_URI);

      const balance = await nft.balanceOf(alice.address);
      const ids = [];
      for (let i = 0n; i < balance; i++) {
        ids.push(await nft.tokenOfOwnerByIndex(alice.address, i));
      }
      expect(ids).to.deep.equal([0n, 1n]);
    });
  });

  describe("接口声明 supportsInterface（EIP-165）", function () {
    it("声明支持 ERC721 与 ERC721Metadata", async function () {
      const { nft } = await loadFixture(deployFixture);
      expect(await nft.supportsInterface("0x80ac58cd")).to.equal(true); // ERC721
      expect(await nft.supportsInterface("0x5b5e139f")).to.equal(true); // ERC721Metadata
      expect(await nft.supportsInterface("0x780e9d63")).to.equal(true); // ERC721Enumerable
    });
  });

  describe("转账", function () {
    it("持有者可把 NFT 转给别人", async function () {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.connect(alice).mint(TOKEN_URI);
      await nft.connect(alice).transferFrom(alice.address, bob.address, 0);
      expect(await nft.ownerOf(0)).to.equal(bob.address);
    });

    it("非持有者且未授权者转账会 revert", async function () {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.connect(alice).mint(TOKEN_URI);
      // bob 未获授权，尝试转走 alice 的 NFT 应失败
      await expect(
        nft.connect(bob).transferFrom(alice.address, bob.address, 0)
      ).to.be.reverted;
    });
  });
});
