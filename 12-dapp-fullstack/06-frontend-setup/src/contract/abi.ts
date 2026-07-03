// 合约 ABI（Application Binary Interface）：前端与合约「对话」的接口说明书。
// wagmi/viem 靠它知道每个函数的名字、入参、返回值，从而正确编码调用数据、解码返回值。
//
// 来源：编译合约后在 Hardhat 工程的 artifacts/contracts/MyNFT.sol/MyNFT.json 里，
//       把 "abi" 字段整段拷出来即可。这里只保留前端真正用到的几个片段（精简版）。
// 用 `as const` 让 wagmi 在编译期就推断出每个函数的参数/返回类型（类型安全）。
export const MyNFTAbi = [
  // —— 写：公开铸造，入参 tokenURI，返回新 tokenId ——
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'uri', type: 'string' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // —— 读：某地址持有多少枚 ——
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // —— 读：按序号取某地址持有的第 index 枚的 tokenId（Enumerable 扩展）——
  {
    type: 'function',
    name: 'tokenOfOwnerByIndex',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // —— 读：某枚 NFT 的元数据地址（ipfs://...）——
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  // —— 读：已铸造总量 ——
  {
    type: 'function',
    name: 'totalMinted',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // —— 事件：铸造成功 ——
  {
    type: 'event',
    name: 'Minted',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'tokenURI', type: 'string', indexed: false },
    ],
  },
] as const
