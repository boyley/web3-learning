// ============================================================
// 05 · useReadContract —— 读取智能合约（view/pure，免 gas）
// ============================================================
// 读合约 = 调用合约里 view/pure 函数，只查数据不改状态，不花 gas、不用签名。
// wagmi v2 的 hook 叫 useReadContract（v1 里叫 useContractRead，注意区别）。
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'

// ABI：只需要放你要调用的那几个函数即可（这里放 ERC-20 常用的只读函数）。
// as const 很重要：让 TS 能从 ABI 推断出参数与返回值类型，获得完整类型提示。
const erc20Abi = [
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const

// 替换为 Sepolia 上你要读取的 ERC-20 合约地址
const TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export function ReadContractDemo() {
  const { address } = useAccount()

  // 单次读取：读代币名称
  const { data: name, isLoading } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'name',
  })

  // 带参数读取：读当前账户的代币余额
  const { data: rawBalance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: {
      // 只有连接后才发请求，避免用零地址无意义查询
      enabled: Boolean(address),
    },
  })

  // 批量读取：一次性把 symbol + decimals 都读回来（减少请求数）
  const { data: batch } = useReadContracts({
    contracts: [
      { address: TOKEN_ADDRESS, abi: erc20Abi, functionName: 'symbol' },
      { address: TOKEN_ADDRESS, abi: erc20Abi, functionName: 'decimals' },
    ],
  })
  const symbol = batch?.[0]?.result as string | undefined
  const decimals = batch?.[1]?.result as number | undefined

  if (isLoading) return <p>读取合约中…</p>

  return (
    <div>
      <h3>读合约（useReadContract）</h3>
      <p>代币名称：{name ?? '-'}</p>
      <p>符号：{symbol ?? '-'}</p>
      <p>精度：{decimals ?? '-'}</p>
      <p>
        我的余额：
        {rawBalance !== undefined && decimals !== undefined
          ? `${formatUnits(rawBalance as bigint, decimals)} ${symbol ?? ''}`
          : '（连接后显示）'}
      </p>
    </div>
  )
}
