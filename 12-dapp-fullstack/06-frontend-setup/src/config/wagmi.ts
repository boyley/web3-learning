// wagmi + RainbowKit 全局配置：告诉前端「连哪条链、用哪些钱包、走哪个 RPC」。
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'
import { http } from 'wagmi'

// WalletConnect 的 projectId：从 https://cloud.reown.com （原 WalletConnect Cloud）免费申请。
// 手机钱包扫码连接（WalletConnect 协议）需要它。桌面插件钱包（MetaMask）即使占位也能连。
const WALLETCONNECT_PROJECT_ID = 'YOUR_WALLETCONNECT_PROJECT_ID'

// getDefaultConfig 是 RainbowKit 的「一把梭」配置：自动帮你接入 MetaMask、
// Coinbase Wallet、WalletConnect 等主流钱包，并生成 wagmi 需要的 config。
export const config = getDefaultConfig({
  appName: 'NFT 铸造 dApp（Web3 学习合集 12）',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [sepolia], // 本 dApp 只支持 Sepolia 测试网
  transports: {
    // 每条链指定一个 RPC 传输方式。http() 不传参会用 viem 内置的公共节点，
    // 学习够用；生产建议换成自己的 Alchemy/Infura 地址以获得更高稳定性。
    [sepolia.id]: http(),
  },
  ssr: false, // 纯前端 SPA（非服务端渲染）
})
