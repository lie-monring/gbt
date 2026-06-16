# GBT — Git Branch Tree

A minimalist Git GUI that puts your branch tree front and center. Built with Electron + React + TypeScript.

![dark](https://img.shields.io/badge/theme-dark-0f1117) ![platform](https://img.shields.io/badge/platform-Windows-blue) ![license](https://img.shields.io/badge/license-MIT-green)

## Why?

Most Git GUIs bury the branch graph behind menus and panels. GBT makes it the hero — open a repo and you immediately see your full branch structure, beautifully rendered. Click to explore, commit, and navigate history with minimal friction.

## Features

- **Interactive branch tree** — Full commit graph as an SVG canvas. Pan, zoom, hover for details.
- **Minimal interface** — Top bar, branch tree, bottom bar with 2 buttons. That's it.
- **Click to explore** — Click any commit → slide-in detail panel with diff stats. Double-click → checkout.
- **Drag-free simplicity** — Click branch labels to switch branches. Right-click for options.
- **Built-in commit panel** — Stage files, write message, commit. Slides away when done.
- **Bilingual** — English / 中文 toggle in the top bar.
- **Real Git** — Uses the git CLI under the hood. All your normal git workflow works.

## Install

### Download (Windows)

Go to [Releases](https://github.com/YOUR_USERNAME/gbt/releases) and download `GBT.exe`.

### Or run from source

```bash
git clone https://github.com/YOUR_USERNAME/gbt.git
cd gbt
npm install
npm run dev
```

> Requires Git installed and in your PATH.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Desktop | Electron 35 |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS 3 |
| State | Zustand 5 |
| Git | simple-git |
| i18n | react-i18next |
| Build | Vite 6 + electron-builder |

## Project Structure

```
gbt/
├── electron/          # Electron main process + preload
│   └── git/           # Git type definitions
├── src/
│   ├── components/
│   │   ├── graph/     # Branch tree SVG rendering
│   │   ├── panels/    # Slide-in panels (commit, detail, history)
│   │   └── layout/    # TopBar, BottomBar
│   ├── hooks/         # Git operation hooks
│   ├── stores/        # Zustand state stores
│   ├── lib/
│   │   ├── graph/     # Layout algorithm
│   │   └── i18n/      # Translations
│   └── styles/
└── resources/         # App icons
```

## License

MIT
