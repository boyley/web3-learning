// ============================================================
// 04 · useBalance —— 查询账户余额
// ============================================================
// useBalance 查询某地址在当前链上的余额。默认查原生币（Sepolia 上是测试 ETH），
// 也可传 token 参数查 ERC-20 代币余额。
import { useAccount, useBalance } from 'wagmi'
import { formatUnits } from 'viem'

export function BalanceCard() {
  const { address, isConnected } = useAccount()

  // 查原生币（ETH）余额
  const {
    data: ethBalance, // { value: bigint, decimals, symbol, formatted } | undefined
    isLoading, // 是否加载中
    isError, // 是否出错
    refetch, // 手动刷新
  } = useBalance({
    address, // 要查谁；address 为 undefined 时 wagmi 自动不发请求
  })

  // 查某个 ERC-20 代币余额：传入 token 合约地址即可
  const { data: tokenBalance } = useBalance({
    address,
    // 示例：Sepolia 上的某个测试 ERC-20 代币地址（请替换为你自己的）
    token: '0x0000000000000000000000000000000000000000',
    query: {
      // 只有连接后且填了真实 token 地址才启用查询
      enabled: isConnected,
    },
  })

  if (!isConnected) return <p>请先连接钱包。</p>
  if (isLoading) return <p>余额加载中…</p>
  if (isError) return <p>余额查询失败，请刷新重试。</p>

  return (
    <div>
      <h3>余额</h3>
      {/* data.formatted 已经是「人类可读」的字符串（自动按 decimals 换算）
          data.value 是原始 bigint（wei 单位），需要精确计算时用它 */}
      <p>
        原生币：{ethBalance?.formatted} {ethBalance?.symbol}
      </p>

      {/* 也可以自己用 viem 的 formatUnits 把 bigint 转成可读字符串 */}
      <p>
        原生币（手动换算）：
        {ethBalance
          ? formatUnits(ethBalance.value, ethBalance.decimals)
          : '-'}{' '}
        {ethBalance?.symbol}
      </p>

      <p>
        ERC-20 代币：{tokenBalance?.formatted ?? '（未配置 token 地址）'}{' '}
        {tokenBalance?.symbol}
      </p>

      <button onClick={() => refetch()}>刷新余额</button>
    </div>
  )
}
