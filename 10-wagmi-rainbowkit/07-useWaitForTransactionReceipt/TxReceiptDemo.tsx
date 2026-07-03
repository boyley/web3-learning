// ============================================================
// 07 · useWaitForTransactionReceipt —— 等待交易确认
// ============================================================
// 发出交易只是拿到「哈希」，交易还在内存池排队。要等矿工打包进区块才算「确认」。
// useWaitForTransactionReceipt 传入哈希，帮你轮询直到交易上链，返回收据（receipt）。
// 这是做「转账中…」loading 态、成功/失败提示的关键。
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { useSendTransaction } from 'wagmi'

export function TxReceiptDemo() {
  const { isConnected } = useAccount()

  // 这里用最简单的「发送原生币转账」来演示交易生命周期
  const { sendTransaction, data: hash, isPending, error } = useSendTransaction()

  // 传入 hash 后，这个 hook 会自动轮询交易状态：
  // - isLoading：交易已广播、正在等待被打包确认（真正的「上链中」loading）
  // - isSuccess：已确认且成功
  // - data：交易收据（含区块号、gasUsed、status 等）
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash, // useWriteContract/useSendTransaction 返回的哈希
    // 可选：confirmations 要等多少个区块确认（默认 1）
    // confirmations: 2,
  })

  function handleSend() {
    sendTransaction({
      to: '0x000000000000000000000000000000000000dEaD', // 黑洞地址（示例）
      value: parseEther('0.0001'), // 转 0.0001 测试 ETH；parseEther 转成 wei
    })
  }

  if (!isConnected) return <p>请先连接钱包。</p>

  return (
    <div>
      <h3>等待交易确认（useWaitForTransactionReceipt）</h3>

      <button onClick={handleSend} disabled={isPending || isConfirming}>
        {isPending
          ? '钱包确认中…' /* 用户还没在钱包点确认 */
          : isConfirming
            ? '上链确认中…' /* 已广播，等打包 */
            : '发送 0.0001 测试 ETH'}
      </button>

      {/* 交易生命周期的完整反馈 */}
      {hash && <p>交易哈希：{hash}</p>}
      {isConfirming && <p>⏳ 交易已广播，正在等待区块确认…</p>}
      {isConfirmed && (
        <p style={{ color: 'green' }}>
          ✅ 交易已确认！区块号：{receipt?.blockNumber?.toString()}， 状态：
          {receipt?.status}
        </p>
      )}
      {error && (
        <p style={{ color: 'red' }}>
          ❌ 出错：{(error as any).shortMessage ?? error.message}
        </p>
      )}
    </div>
  )
}
