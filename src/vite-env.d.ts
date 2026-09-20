/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_MOCK?: string
  readonly VITE_JEV_MODEL?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
