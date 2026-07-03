// 前端入口：把 <App/> 挂到 index.html 的 #root 上。
// 真正把 wagmi / RainbowKit / React Query 三个 Provider 包起来的逻辑，见模块 07 的 App.tsx。
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
