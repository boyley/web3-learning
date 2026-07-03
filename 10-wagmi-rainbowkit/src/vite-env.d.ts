/// <reference types="vite/client" />

// 为 import.meta.env 提供类型提示
interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
