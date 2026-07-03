// ============================================================
// 02 · RainbowKit 连接钱包按钮
// ============================================================
// RainbowKit 的 <ConnectButton /> 一行代码即可提供完整的连接体验：
// 钱包选择弹窗、连接后显示地址/头像/余额、切链下拉、断开连接……全都内置。
import { ConnectButton } from '@rainbow-me/rainbowkit'

// ------------------------------------------------------------
// 用法 1：最简单，直接放一个默认按钮
// ------------------------------------------------------------
export function ConnectButtonDemo() {
  return (
    <div>
      <h3>默认连接按钮</h3>
      <ConnectButton />

      <h3 style={{ marginTop: 24 }}>自定义显示项</h3>
      {/* 可通过 props 控制显示内容：
          - accountStatus：连接后显示 头像+地址 / 只地址 / 只头像
          - chainStatus：是否显示当前链名/图标
          - showBalance：是否显示余额
          - label：未连接时按钮文字 */}
      <ConnectButton
        label="连接钱包"
        accountStatus="address"
        chainStatus="icon"
        showBalance={false}
      />
    </div>
  )
}

// ------------------------------------------------------------
// 用法 2：ConnectButton.Custom —— 完全自定义外观（进阶）
// ------------------------------------------------------------
// 当默认按钮不满足设计需求时，用 render props 自己画 UI，
// RainbowKit 只提供状态与打开弹窗的方法。
export function CustomConnectButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
        // mounted 为 false 时（SSR/首帧）先不渲染，避免水合不一致
        const connected = mounted && account && chain
        return (
          <div>
            {!connected ? (
              <button onClick={openConnectModal}>👉 点我连接钱包</button>
            ) : (
              <button onClick={openAccountModal}>
                已连接：{account.displayName}
              </button>
            )}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
