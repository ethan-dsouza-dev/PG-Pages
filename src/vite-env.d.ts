/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" gates the PG Page behind sign-in. See src/config/flags.ts. */
  readonly VITE_AUTH_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
