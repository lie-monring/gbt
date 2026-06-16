import type { GbtApi } from '../../electron/preload'

declare global {
  interface Window {
    gbt: GbtApi
  }
}

export {}
