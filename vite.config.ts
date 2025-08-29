import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // Use different base paths for different environments
  const base = process.env.GITHUB_PAGES === 'true' 
    ? '/liquid-glass-terminal/' // Repository name for moarbetsy
    : './' // For Electron

  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: false // Don't auto-open browser when running with Electron
    },
    base,
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    }
  }
})