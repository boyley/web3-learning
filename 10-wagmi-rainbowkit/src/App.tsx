// ============================================================
// App：把各教学模块的示例组件拼装进来，方便一处运行、逐个体验
// ============================================================
// 学习方式：想跑哪个模块，就从对应模块目录把组件复制到 src/ 下，
// 然后在这里 import 并渲染。默认放了几个最常用的，其余已注释，按需打开。
import { ConnectButton } from '@rainbow-me/rainbowkit'

// 下面这些示例组件来自各模块目录（教学时把 .tsx 复制到 src/ 即可）。
// 为保证「npm run dev」开箱即能启动，这里只 import 已随脚手架附带的最小演示。
import { AccountPanel } from './examples/AccountPanel'

export default function App() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1>wagmi v2 + RainbowKit 学习 dApp</h1>
      <p style={{ color: '#666' }}>
        当前网络：Sepolia 测试网（请勿使用主网真实资产）
      </p>

      {/* RainbowKit 一行搞定「连接钱包」按钮，见 02 模块 */}
      <ConnectButton />

      <hr style={{ margin: '24px 0' }} />

      {/* 账户信息面板（useAccount + useBalance），见 03/04 模块 */}
      <AccountPanel />

      {/*
        其余模块示例：把对应 .tsx 复制到 src/examples/ 后，取消注释即可：
        <ReadContractDemo />        // 05
        <WriteContractDemo />       // 06
        <TxReceiptDemo />           // 07
        <SignMessageDemo />         // 08
        <SwitchChainDemo />         // 09
        <MintNftDapp />             // 10
      */}
    </div>
  )
}
