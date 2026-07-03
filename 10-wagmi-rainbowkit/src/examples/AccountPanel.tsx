// 随脚手架附带的最小示例：连接后展示地址、所在链与原生币余额
// 综合了 useAccount（03）与 useBalance（04）两个 hook
import { useAccount, useBalance } from 'wagmi'

export function AccountPanel() {
  const { address, isConnected, chain } = useAccount()
  const { data: balance } = useBalance({ address })

  if (!isConnected) {
    return <p>尚未连接钱包，点上方按钮连接（建议用 MetaMask + Sepolia）。</p>
  }

  return (
    <div>
      <p>地址：{address}</p>
      <p>网络：{chain?.name ?? '未知'}（chainId: {chain?.id}）</p>
      <p>
        余额：
        {balance
          ? `${Number(balance.formatted).toFixed(4)} ${balance.symbol}`
          : '加载中…'}
      </p>
    </div>
  )
}
