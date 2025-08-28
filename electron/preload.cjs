const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  login: (password) => ipcRenderer.send("login-attempt", password),
  onLoginFailed: (callback) =>
    ipcRenderer.on("login-failed", (event, message) => callback(message)),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});