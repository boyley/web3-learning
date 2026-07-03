// ============================================================
// wagmi + RainbowKit 全局配置（整个 dApp 只需一份）
// ============================================================
// getDefaultConfig 是 RainbowKit 对 wagmi createConfig 的封装：
// 它会自动帮你注册一批主流钱包连接器（MetaMask / Rainbow / Coinbase /
// WalletConnect 等），省去手动配置 connectors 的繁琐。
// 如果你不用 RainbowKit，也可以直接用 wagmi 的 createConfig（见 01 模块说明）。
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia, mainnet } from 'wagmi/chains'

// projectId：WalletConnect / Reown 的项目 ID，用于 WalletConnect 协议扫码连接。
// 从 https://cloud.reown.com 免费申请，填到 .env.local 的 VITE_WALLETCONNECT_PROJECT_ID。
// 这里用占位符兜底，未申请时 MetaMask 等注入式钱包仍可用，只是扫码连接会失效。
const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'

export const config = getDefaultConfig({
  appName: 'wagmi + RainbowKit 学习 dApp', // 会显示在钱包授权弹窗里
  projectId,
  // chains：本 dApp 支持的链。教学一律用测试网 Sepolia，绝不碰主网真实资产。
  // 把 mainnet 也放进来只是为了演示「切链」，实际操作请始终停留在 Sepolia。
  chains: [sepolia, mainnet],
  // ssr：Vite 是纯客户端渲染（CSR），设为 false；如果用 Next.js SSR 才设 true。
  ssr: false,
})

// 让 wagmi 的 TypeScript 类型（如 useConfig 返回值）能推断出我们注册的链
declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
