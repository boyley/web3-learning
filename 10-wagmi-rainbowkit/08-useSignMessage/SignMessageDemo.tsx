// ============================================================
// 08 · useSignMessage —— 消息签名（登录 / 身份验证）
// ============================================================
// 签名 = 用私钥对一段消息生成签名，任何人可用公钥/地址验证「这条消息确实由该地址持有者签发」。
// 关键：签名【不上链、不花 gas、不动资产】，常用于「用钱包登录」(Sign-In with Ethereum)。
import { useAccount, useSignMessage } from 'wagmi'
import { useState } from 'react'
import { verifyMessage } from 'viem'

export function SignMessageDemo() {
  const { address, isConnected } = useAccount()
  const [verified, setVerified] = useState<boolean | null>(null)

  // useSignMessage 返回：
  // - signMessage / signMessageAsync：触发钱包签名弹窗
  // - data：签名结果（0x 开头的一长串十六进制）
  // - isPending：等待用户在钱包确认
  // - error：出错（如用户拒签）
  const {
    signMessageAsync,
    data: signature,
    isPending,
    error,
  } = useSignMessage()

  // 要签名的消息（真实登录场景应含随机 nonce + 域名 + 时间戳，防重放）
  const message = `欢迎登录 wagmi 学习 dApp！\n地址：${address}\n时间：${new Date().toISOString()}`

  async function handleSign() {
    setVerified(null)
    // 用 async 版本便于拿到返回值后立刻做验证
    const sig = await signMessageAsync({ message })

    // 前端演示验签：用 viem 的 verifyMessage 校验「这个签名是否由 address 对该 message 签出」
    // 真实项目应把 message + signature 发给后端验签，再签发 session/JWT。
    const ok = await verifyMessage({
      address: address!,
      message,
      signature: sig,
    })
    setVerified(ok)
  }

  if (!isConnected) return <p>请先连接钱包。</p>

  return (
    <div>
      <h3>消息签名（useSignMessage）</h3>
      <pre style={{ background: '#f5f5f5', padding: 8, whiteSpace: 'pre-wrap' }}>
        {message}
      </pre>

      <button onClick={handleSign} disabled={isPending}>
        {isPending ? '钱包签名中…' : '用钱包签名登录'}
      </button>

      {signature && (
        <p style={{ wordBreak: 'break-all' }}>签名结果：{signature}</p>
      )}
      {verified === true && <p style={{ color: 'green' }}>✅ 验签通过，身份确认</p>}
      {verified === false && <p style={{ color: 'red' }}>❌ 验签失败</p>}
      {error && (
        <p style={{ color: 'red' }}>
          出错：{(error as any).shortMessage ?? error.message}
        </p>
      )}
    </div>
  )
}
