// ============================================================================
// fork.test.js —— 在本地“主网分叉”上，直接读写真实的主网 DAI 合约
// 运行：npx hardhat test（需在工程根 .env 配好 MAINNET_RPC_URL）
//
// 分叉的威力：无需部署，就能在本地拿到主网上真实存在的合约与余额，
// 还能伪装成巨鲸账户来花它的钱——非常适合测试与主流协议的集成。
// ============================================================================
const { expect } = require("chai");
const { ethers } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

// 主网真实地址（以太坊主网）
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI 稳定币合约
const DAI_WHALE = "0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf"; // 某个持有大量 DAI 的地址（巨鲸）

// 只用到的最小 ERC-20 ABI 片段
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

describe("主网分叉：直接操作真实 DAI 合约", function () {
  // 分叉 + 拉主网数据较慢，放宽超时
  this.timeout(120000);

  it("能读取主网 DAI 的元数据", async function () {
    const dai = await ethers.getContractAt(ERC20_ABI, DAI);
    expect(await dai.symbol()).to.equal("DAI");
    expect(await dai.decimals()).to.equal(18n);
    console.log("主网 DAI 名称:", await dai.name());
  });

  it("能伪装成巨鲸账户，把真实 DAI 转出去", async function () {
    const dai = await ethers.getContractAt(ERC20_ABI, DAI);

    // 1) 给巨鲸地址充点 ETH 付 gas（本地分叉可凭空发）
    await helpers.setBalance(DAI_WHALE, ethers.parseEther("10"));

    // 2) 伪装成巨鲸账户（impersonate），拿到它的 signer
    await helpers.impersonateAccount(DAI_WHALE);
    const whale = await ethers.getSigner(DAI_WHALE);

    // 3) 准备一个接收账户
    const [receiver] = await ethers.getSigners();
    const before = await dai.balanceOf(receiver.address);

    // 4) 以巨鲸身份转 100 DAI 给 receiver
    const amount = ethers.parseUnits("100", 18);
    await dai.connect(whale).transfer(receiver.address, amount);

    const after = await dai.balanceOf(receiver.address);
    expect(after - before).to.equal(amount);
    console.log("receiver 收到 DAI:", ethers.formatUnits(after - before, 18));
  });
});
