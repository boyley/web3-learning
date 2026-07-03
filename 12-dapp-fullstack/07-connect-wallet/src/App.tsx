// 应用根组件：负责「三层 Provider 包裹 + 顶部连接钱包按钮 + 主体内容」。
//
// 三层 Provider 的作用（顺序不能乱，从外到内）：
//   1. WagmiProvider     —— 提供链/钱包/合约状态（所有 useAccount/useReadContract 等 hook 的地基）
//   2. QueryClientProvider —— wagmi v2 底层用 TanStack Query 管理异步请求缓存
//   3. RainbowKitProvider  —— 提供漂亮的「连接钱包」弹窗 UI
import '@rainbow-me/rainbowkit/styles.css' // RainbowKit 自带样式，必须引入
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

import { config } from './config/wagmi'
import { MintPanel } from './components/MintPanel' // 模块 08
import { MyNFTs } from './components/MyNFTs'       // 模块 09

// React Query 客户端（一个应用一个实例即可）
const queryClient = new QueryClient()

// 主体内容：根据「是否已连钱包」决定显示什么
function Main() {
  const { isConnected } = useAccount() // wagmi hook：读取当前连接状态

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24, fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>🎨 NFT 铸造 dApp</h1>
        {/* RainbowKit 的一体化按钮：未连显示「Connect Wallet」，已连显示地址/余额/切链 */}
        <ConnectButton />
      </header>

      {isConnected ? (
        <>
          <MintPanel />
          <MyNFTs />
        </>
      ) : (
        <p style={{ color: '#666' }}>👆 请先连接钱包（需切换到 Sepolia 测试网）后开始铸造。</p>
      )}
    </main>
  )
}

// 导出根组件，供 main.tsx 挂载
export function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Main />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
