// ============================================================
// 01 · wagmi 全局配置详解（两种写法）
// ============================================================
// 本文件展示「不依赖 RainbowKit 的纯 wagmi 写法」和「用 RainbowKit 简化的写法」，
// 对照理解 createConfig 到底做了什么。实际项目二选一即可。

// ------------------------------------------------------------
// 写法 A：纯 wagmi createConfig（最原始，理解底层）
// ------------------------------------------------------------
import { createConfig, http } from 'wagmi'
import { sepolia, mainnet } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'

export const configPlain = createConfig({
  // chains：dApp 支持哪些链。教学统一用 Sepolia 测试网。
  chains: [sepolia, mainnet],
  // connectors：用户可用哪些方式连接钱包
  connectors: [
    injected(), // 浏览器注入式钱包（MetaMask 等），最常用
    walletConnect({ projectId }), // 扫码连接手机钱包
    coinbaseWallet({ appName: 'wagmi 学习 dApp' }),
  ],
  // transports：每条链用什么 RPC 端点与链通信。
  // http() 不传参会用 viem 内置的公共 RPC；生产环境建议换成
  // http('https://sepolia.infura.io/v3/你的key') 这类稳定节点。
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
})

// ------------------------------------------------------------
// 写法 B：RainbowKit getDefaultConfig（推荐，省去手写 connectors）
// ------------------------------------------------------------
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

export const config = getDefaultConfig({
  appName: 'wagmi + RainbowKit 学习 dApp',
  projectId,
  chains: [sepolia, mainnet],
  ssr: false, // Vite 纯客户端渲染
})

// 让 wagmi 相关 hook 的 TS 类型能推断出链信息
declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
