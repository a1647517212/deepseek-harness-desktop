/**
 * Sandboxed preload: the only bridge between the renderer and the main
 * process. Sandboxed preloads run as CommonJS, so this file intentionally
 * uses require instead of ESM imports.
 */

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktop', Object.freeze({
  getInfo: () => ipcRenderer.invoke('desktop:get-info'),
  restartHarness: () => ipcRenderer.invoke('desktop:restart-harness'),
  quit: () => ipcRenderer.invoke('desktop:quit'),
}))
