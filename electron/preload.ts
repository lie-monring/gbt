import { contextBridge, ipcRenderer } from 'electron'

export interface GitResult {
  success: boolean
  data?: string
  error?: string
}

const api = {
  /** Open native folder picker dialog, returns selected path or null */
  openFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFolder'),

  /** Check if a file or directory exists */
  fileExists: (filePath: string): Promise<boolean> => ipcRenderer.invoke('fs:fileExists', filePath),

  /** Execute a raw git command via simple-git */
  gitRaw: (repoPath: string, args: string[]): Promise<GitResult> =>
    ipcRenderer.invoke('git:execute', repoPath, args),
}

contextBridge.exposeInMainWorld('gbt', api)

export type GbtApi = typeof api
