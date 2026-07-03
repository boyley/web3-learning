// ============================================================
// 10 · 综合实战 —— 连钱包 → mint NFT 完整小页面
// ============================================================
// 本组件把前面所有知识点串起来，做一个最小可用的 NFT 铸造 dApp：
//   连接钱包(02) → 读连接状态(03) → 校验链(09) → 读合约数据(05)
//   → 写合约 mint(06) → 等待确认(07) → 成功后刷新
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'
import { parseEther } from 'viem'

// ---- 合约信息（教学示例，请替换成你自己在 Sepolia 部署的 NFT 合约）----
// 假设是一个简单的 ERC-721：有 mint() 付费铸造、totalSupply()、balanceOf()
const NFT_ADDRESS = '0x0000000000000000000000000000000000000000' as const

const nftAbi = [
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'payable', // 付费铸造
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const

const MINT_PRICE = '0.001' // 每个 NFT 铸造价（测试 ETH）

export function MintNftDapp() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const onSepolia = chainId === sepolia.id

  // —— 读：已铸造总量 & 我持有的数量（05 useReadContract）——
  const { data: totalSupply, refetch: refetchTotal } = useReadContract({
    address: NFT_ADDRESS,
    abi: nftAbi,
    functionName: 'totalSupply',
    query: { enabled: onSepolia },
  })
  const { data: myBalance, refetch: refetchMine } = useReadContract({
    address: NFT_ADDRESS,
    abi: nftAbi,
    functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: onSepolia && Boolean(address) },
  })

  // —— 写：调用 mint（06 useWriteContract）——
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  // —— 等待确认（07 useWaitForTransactionReceipt）——
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash })

  // 确认成功后刷新读数据（让「总量/我的持有」更新）
  if (isConfirmed) {
    refetchTotal()
    refetchMine()
  }

  function handleMint() {
    writeContract({
      address: NFT_ADDRESS,
      abi: nftAbi,
      functionName: 'mint',
      value: parseEther(MINT_PRICE), // payable：随交易附带 mint 费用
    })
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 20 }}>
      <h2>🎨 NFT 铸造 dApp（综合实战）</h2>

      {/* 第一步：连接钱包（02） */}
      <ConnectButton />

      {/* 未连接：提示 */}
      {!isConnected && <p style={{ marginTop: 16 }}>请先连接钱包开始铸造。</p>}

      {/* 已连接但链不对：引导切链（09） */}
      {isConnected && !onSepolia && (
        <div style={{ marginTop: 16 }}>
          <p style={{ color: 'orange' }}>⚠️ 请切换到 Sepolia 测试网。</p>
          <button onClick={() => switchChain({ chainId: sepolia.id })}>
            切到 Sepolia
          </button>
        </div>
      )}

      {/* 连接且在正确链：展示数据 + 铸造按钮 */}
      {isConnected && onSepolia && (
        <div style={{ marginTop: 16 }}>
          <p>已铸造总量：{totalSupply?.toString() ?? '…'}</p>
          <p>我持有：{myBalance?.toString() ?? '0'} 个</p>
          <p>单价：{MINT_PRICE} ETH（测试币）</p>

          <button
            onClick={handleMint}
            disabled={isPending || isConfirming}
            style={{ padding: '10px 20px', fontSize: 16 }}
          >
            {isPending
              ? '钱包确认中…'
              : isConfirming
                ? '铸造上链中…'
                : '🚀 铸造一个 NFT'}
          </button>

          {/* 交易生命周期反馈 */}
          {hash && <p style={{ wordBreak: 'break-all' }}>交易哈希：{hash}</p>}
          {isConfirming && <p>⏳ 交易已广播，等待确认…</p>}
          {isConfirmed && <p style={{ color: 'green' }}>✅ 铸造成功！</p>}
          {error && (
            <p style={{ color: 'red' }}>
              ❌ {(error as any).shortMessage ?? error.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
