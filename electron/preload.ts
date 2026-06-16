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

  /** Close the app window */
  closeWindow: (): Promise<void> => ipcRenderer.invoke('window:close'),

  /** Minimize the app window */
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window:minimize'),

  /** Get the folder path passed via command line (for right-click menu) */
  getStartupPath: (): Promise<string | null> => ipcRenderer.invoke('app:startupPath'),
}

contextBridge.exposeInMainWorld('gbt', api)

export type GbtApi = typeof api
