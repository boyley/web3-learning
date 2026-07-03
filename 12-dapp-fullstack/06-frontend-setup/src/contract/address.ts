// 合约地址：填入你在模块 04 部署到 Sepolia 后得到的地址。
// 部署脚本运行成功时会在终端打印 "✅ MyNFT 已部署到: 0x...."，把它粘到这里。
//
// `as const` + `0x` 前缀让 TypeScript 把它推断成 viem 要求的 `0x${string}` 字面量类型。
export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' as const

// 本 dApp 运行在 Sepolia 测试网，chainId = 11155111
export const CHAIN_ID = 11155111
