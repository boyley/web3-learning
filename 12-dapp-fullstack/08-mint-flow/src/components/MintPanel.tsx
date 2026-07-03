// 铸造面板：输入一个 tokenURI（模块 05 上传得到的 ipfs://... 元数据地址）→ 点击铸造
// → 发交易 → 等待上链确认 → 反馈成功/失败。
//
// 核心是 wagmi v2 的两个 hook 配合，完整覆盖交易的三个阶段：
//   useWriteContract          —— 发起写交易（弹出钱包让用户签名）
//   useWaitForTransactionReceipt —— 拿到交易 hash 后，等待它被区块确认
import { useState } from 'react'
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from 'wagmi'
import { MyNFTAbi } from '../contract/abi'
import { CONTRACT_ADDRESS } from '../contract/address'

export function MintPanel() {
  // 受控输入框：默认填一个示例 ipfs 地址，实际请换成你自己上传的
  const [uri, setUri] = useState('ipfs://YOUR_METADATA_CID')

  // 读：已铸造总量（演示 useReadContract；铸造成功后可刷新）
  const { data: totalMinted, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MyNFTAbi,
    functionName: 'totalMinted',
  })

  // 写：发起铸造交易
  //   writeContract —— 触发交易（会弹钱包）
  //   hash          —— 交易发出后拿到的哈希（此刻还没上链！）
  //   isPending     —— 用户正在钱包里确认/交易正在发送
  //   error         —— 发送阶段的错误（如用户拒绝签名）
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  // 等待回执：把上一步的 hash 传进来，监听它是否被打包
  //   isLoading  —— 交易已发出、正在等区块确认（此处重命名为 isConfirming）
  //   isSuccess  —— 已被确认，铸造真正完成（此处重命名为 isConfirmed）
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash })

  // 点击铸造：调用合约的 mint(uri)
  function handleMint() {
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: MyNFTAbi,
        functionName: 'mint',
        args: [uri], // 对应 Solidity mint(string uri)
      },
      {
        // 交易「发送成功」后的回调（注意：此时还没上链确认）
        onSuccess: () => setTimeout(() => refetch(), 1500),
      },
    )
  }

  const busy = isPending || isConfirming

  return (
    <section style={{ border: '1px solid #eee', borderRadius: 12, padding: 16, marginTop: 16 }}>
      <h2>① 铸造一枚 NFT</h2>
      <p style={{ color: '#666', fontSize: 14 }}>
        已铸造：{totalMinted?.toString() ?? '...'} / 1000
      </p>

      <input
        value={uri}
        onChange={(e) => setUri(e.target.value)}
        placeholder="ipfs://<你的元数据 CID>"
        style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
      />

      <button onClick={handleMint} disabled={busy} style={{ marginTop: 12, padding: '8px 16px' }}>
        {isPending ? '请在钱包中确认…' : isConfirming ? '上链确认中…' : '🚀 铸造 Mint'}
      </button>

      {/* 交易生命周期的实时反馈 */}
      {hash && (
        <p style={{ fontSize: 13, wordBreak: 'break-all' }}>
          交易哈希：
          <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer">
            {hash}
          </a>
        </p>
      )}
      {isConfirming && <p>⏳ 交易已提交，等待区块确认…</p>}
      {isConfirmed && <p style={{ color: 'green' }}>✅ 铸造成功！可在下方「我的 NFT」查看。</p>}
      {error && <p style={{ color: 'red' }}>❌ {(error as any).shortMessage || error.message}</p>}
    </section>
  )
}
