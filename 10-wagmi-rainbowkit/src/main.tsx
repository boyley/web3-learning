// ============================================================
// 应用入口：搭好三层 Provider（这是所有 wagmi hooks 能工作的前提）
// ============================================================
// 嵌套顺序【固定】，不能乱：
//   WagmiProvider          ← 提供链/账户/连接器上下文
//     └ QueryClientProvider ← wagmi v2 用 TanStack Query 做数据缓存，必须包在里面
//         └ RainbowKitProvider ← 提供 ConnectButton 等 UI 组件的主题与上下文
// 任何 useAccount / useReadContract 等 hook 都必须在这三层之内调用。
import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'

// RainbowKit 自带样式必须引入，否则连接弹窗没有样式
import '@rainbow-me/rainbowkit/styles.css'

import { config } from './wagmi'
import App from './App'

// TanStack Query 客户端：wagmi 用它缓存链上读取结果、去重请求、自动刷新
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
