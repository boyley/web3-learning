// ============================================================
// 03 · useAccount —— 读取钱包连接状态与地址
// ============================================================
// useAccount 是最常用的 hook，返回当前连接的账户信息。
// 它是「响应式」的：用户连接/断开/切换账户时，组件会自动重新渲染。
import { useAccount, useDisconnect } from 'wagmi'

export function AccountInfo() {
  const {
    address, // 当前账户地址，如 0xAbc...；未连接时为 undefined
    isConnected, // 是否已连接（布尔值），最常用来做条件渲染
    isConnecting, // 是否正在连接中（可用于 loading 态）
    isReconnecting, // 刷新页面后自动重连中
    chain, // 当前所在链对象（含 id、name），未连接或链不支持时可能为 undefined
    chainId, // 当前链 id（数字）
    connector, // 当前使用的连接器（MetaMask / WalletConnect...）
    status, // 连接状态机：'connected' | 'connecting' | 'reconnecting' | 'disconnected'
  } = useAccount()

  const { disconnect } = useDisconnect() // 主动断开连接

  // 用 status / isConnected 做条件渲染是最佳实践
  if (isConnecting || isReconnecting) {
    return <p>连接中…</p>
  }

  if (!isConnected) {
    return <p>未连接钱包，请先点击连接按钮。</p>
  }

  return (
    <div>
      <h3>账户信息</h3>
      <ul>
        <li>地址：{address}</li>
        <li>链：{chain?.name ?? '（不支持的链）'}（chainId: {chainId}）</li>
        <li>连接器：{connector?.name}</li>
        <li>状态：{status}</li>
      </ul>
      <button onClick={() => disconnect()}>断开连接</button>
    </div>
  )
}
