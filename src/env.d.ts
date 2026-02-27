/// <reference types="vite/client" />

import { IpcApi } from './types/ipc'

declare global {
  interface Window {
    api: IpcApi
  }
}
