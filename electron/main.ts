import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

function findGit(): string {
  // 1. Try PATH via `where git` (Windows) or `which git` (Unix)
  try {
    const cmd = process.platform === 'win32' ? 'where git' : 'which git'
    const result = execSync(cmd, { encoding: 'utf-8' }).trim()
    const resolved = result.split('\r\n')[0].split('\n')[0].trim()
    if (resolved && fs.existsSync(resolved)) return resolved
  } catch { /* not in PATH, fall through */ }

  // 2. Check common install locations
  const candidates = [
    'C:\\Program Files\\Git\\cmd\\git.exe',
    'C:\\Program Files\\Git\\bin\\git.exe',
    'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Git', 'cmd', 'git.exe'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }

  // 3. Last resort: hope `git` is on PATH
  return 'git'
}
const GIT_BINARY = findGit()

// Store folder path passed via command line (for right-click context menu)
let startupFolder: string | null = null
const cliArg = process.argv.find((a) => !a.startsWith('-') && a !== process.argv[0] && a !== process.execPath && !a.includes('electron'))
if (cliArg && fs.existsSync(cliArg)) {
  startupFolder = cliArg
}

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'GBT — Git Branch Tree',
    titleBarStyle: 'hidden',
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

// ── IPC Handlers ──────────────────────────────────────────

ipcMain.handle('dialog:openFolder', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Open Git Repository',
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('fs:fileExists', async (_event, filePath: string) => {
  try {
    await fs.promises.access(filePath)
    return true
  } catch {
    return false
  }
})

ipcMain.handle('git:execute', async (_event, repoPath: string, args: string[]) => {
  const { simpleGit } = await import('simple-git')
  const git = simpleGit({ baseDir: repoPath, binary: GIT_BINARY })
  // We forward raw git commands through simple-git's raw method
  try {
    const result = await git.raw(args)
    return { success: true, data: result }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
})

ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('app:startupPath', () => {
  return startupFolder
})

// ── App Lifecycle ──────────────────────────────────────────

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
