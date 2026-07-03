// ============================================================
// 09 · useSwitchChain —— 切换网络（链）
// ============================================================
// dApp 常要求用户在特定链上操作（如只支持 Sepolia）。当用户钱包在错误的链时，
// 用 useSwitchChain 请求钱包切换到目标链。
import { useAccount, useSwitchChain, useChainId } from 'wagmi'
import { sepolia, mainnet } from 'wagmi/chains'

export function SwitchChainDemo() {
  const { isConnected, chain } = useAccount()
  const currentChainId = useChainId() // 当前链 id（也可从 useAccount 的 chainId 拿）

  // useSwitchChain 返回：
  // - chains：config 里配置的所有可切换的链
  // - switchChain：触发切链（钱包会弹窗让用户确认切换/添加网络）
  // - isPending：切换中
  // - error：出错（用户拒绝、钱包没有该网络等）
  const { chains, switchChain, isPending, error } = useSwitchChain()

  if (!isConnected) return <p>请先连接钱包。</p>

  // 判断当前是否在期望的链（这里假设 dApp 要求 Sepolia）
  const isOnSepolia = currentChainId === sepolia.id

  return (
    <div>
      <h3>切换网络（useSwitchChain）</h3>
      <p>
        当前网络：{chain?.name ?? '未知'}（chainId: {currentChainId}）
      </p>

      {!isOnSepolia && (
        <p style={{ color: 'orange' }}>
          ⚠️ 本 dApp 需要在 Sepolia 测试网操作，请切换网络。
        </p>
      )}

      {/* 遍历 config 中配置的链，生成切换按钮 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {chains.map((c) => (
          <button
            key={c.id}
            onClick={() => switchChain({ chainId: c.id })}
            disabled={isPending || c.id === currentChainId}
          >
            {c.id === currentChainId ? `✓ ${c.name}（当前）` : `切到 ${c.name}`}
          </button>
        ))}
      </div>

      {/* 也可以直接一个按钮定向切到 Sepolia */}
      <button
        style={{ marginTop: 12 }}
        onClick={() => switchChain({ chainId: sepolia.id })}
        disabled={isPending || isOnSepolia}
      >
        {isPending ? '切换中…' : '一键切到 Sepolia'}
      </button>

      {error && (
        <p style={{ color: 'red' }}>
          切换失败：{(error as any).shortMessage ?? error.message}
        </p>
      )}
    </div>
  )
}
