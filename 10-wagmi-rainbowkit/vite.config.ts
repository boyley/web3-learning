import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置：启用 React 插件（JSX/Fast Refresh）
// wagmi/viem 依赖浏览器的 BigInt、crypto 等能力，现代浏览器均已支持，无需额外 polyfill
export default defineConfig({
  plugins: [react()],
})
