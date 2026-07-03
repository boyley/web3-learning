// ============================================================
// 06 · useWriteContract —— 写合约 / 发交易（改状态，花 gas，需签名）
// ============================================================
// 写合约 = 调用会改变链上状态的函数（transfer、approve、mint...）。
// 这类操作要：钱包弹窗签名 → 广播交易 → 消耗 gas → 等待矿工打包上链。
// wagmi v2 的 hook 叫 useWriteContract（v1 里叫 useContractWrite）。
import { useAccount, useWriteContract, useSimulateContract } from 'wagmi'
import { parseUnits } from 'viem'

const erc20Abi = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const

const TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export function WriteContractDemo() {
  const { isConnected } = useAccount()

  // useWriteContract 返回：
  // - writeContract：触发写操作的函数（会弹钱包签名）
  // - data：交易哈希（发出后拿到，注意此时还没确认上链！）
  // - isPending：用户签名弹窗打开、等待用户确认的阶段
  // - error / isError：报错信息（如用户拒签、gas 不足）
  const {
    writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract()

  // 【最佳实践】写前先 simulate：本地模拟这笔交易能否成功。
  // 能提前发现 revert（如余额不足），避免用户白花 gas。
  const { data: simulateData } = useSimulateContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [
      '0x000000000000000000000000000000000000dEaD', // 收款地址（示例：黑洞地址）
      parseUnits('1', 18), // 转 1 个代币；parseUnits 把可读数字转成 bigint(wei)
    ],
    query: { enabled: isConnected },
  })

  function handleTransfer() {
    // 优先用 simulate 校验过的 request；拿不到时也可直接传参调用
    if (simulateData?.request) {
      writeContract(simulateData.request)
    } else {
      writeContract({
        address: TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: ['0x000000000000000000000000000000000000dEaD', parseUnits('1', 18)],
      })
    }
  }

  if (!isConnected) return <p>请先连接钱包。</p>

  return (
    <div>
      <h3>写合约（useWriteContract）</h3>
      <button onClick={handleTransfer} disabled={isPending}>
        {isPending ? '钱包确认中…' : '转 1 个代币到黑洞地址'}
      </button>

      {/* 发出后拿到交易哈希，但此时【还没确认】，需配合 07 的
          useWaitForTransactionReceipt 等待上链 */}
      {hash && <p>交易已发送，哈希：{hash}</p>}

      {error && (
        <p style={{ color: 'red' }}>
          出错：{(error as any).shortMessage ?? error.message}
        </p>
      )}
    </div>
  )
}
