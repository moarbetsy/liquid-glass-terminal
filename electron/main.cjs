const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const config = require("./config.cjs");
const isDev = process.env.NODE_ENV === "development";

let loginWindow;
let appWindow;

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: config.windows.login.width,
    height: config.windows.login.height,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
    resizable: config.windows.login.resizable,
    frame: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#000000',
    show: false,
  });

  loginWindow.loadFile(path.join(__dirname, "login.html"));
  
  loginWindow.once('ready-to-show', () => {
    loginWindow.show();
  });

  loginWindow.on('closed', () => {
    loginWindow = null;
  });
}

function createAppWindow() {
  appWindow = new BrowserWindow({
    width: config.windows.main.width,
    height: config.windows.main.height,
    minWidth: config.windows.main.minWidth,
    minHeight: config.windows.main.minHeight,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      backgroundThrottling: false,
      // Critical memory optimizations
      partition: 'persist:main',
      enableWebSQL: false,
      v8CacheOptions: 'bypassHeatCheck',
      // Aggressive memory reduction
      offscreen: false,
      disableBlinkFeatures: 'Auxclick',
      enableBlinkFeatures: '',
      // Tile memory management
      additionalArguments: [
        '--max-tiles-for-interest-area=64',
        '--max-unused-resource-memory-usage-percentage=25',
        '--decoded-image-working-set-budget-mb=32',
        '--tile-manager-low-mem-policy-cutoff-mb=64'
      ]
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#000000',
    show: false,
    paintWhenInitiallyHidden: false,
    // Memory management
    useContentSize: true,
    enableLargerThanScreen: false,
  });

  // Load the app
  if (isDev) {
    appWindow.loadURL(`http://localhost:${config.dev.port}`);
    if (config.dev.openDevTools) {
      appWindow.webContents.openDevTools();
    }
  } else {
    appWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Prevent flashing by waiting for content to load
  appWindow.webContents.once('did-finish-load', () => {
    // Small delay to ensure everything is rendered
    setTimeout(() => {
      appWindow.show();
      if (loginWindow) {
        loginWindow.close();
      }
    }, 100);
  });

  // Fallback in case did-finish-load doesn't fire
  appWindow.once('ready-to-show', () => {
    if (!appWindow.isVisible()) {
      appWindow.show();
      if (loginWindow) {
        loginWindow.close();
      }
    }
  });

  appWindow.on('closed', () => {
    appWindow = null;
  });

  // Critical memory and performance optimizations
  appWindow.webContents.on('dom-ready', () => {
    // Inject optimized CSS for Electron
    const fs = require('fs');
    const optimizedCSS = fs.readFileSync(path.join(__dirname, '../src/electron-optimized.css'), 'utf8');
    appWindow.webContents.insertCSS(optimizedCSS);
    
    // Inject aggressive memory management script
    appWindow.webContents.executeJavaScript(`
      // Aggressive memory management
      (function() {
        // Force immediate cleanup of unused DOM nodes
        const observer = new MutationObserver(() => {
          // Throttled cleanup
          if (!window._cleanupTimeout) {
            window._cleanupTimeout = setTimeout(() => {
              // Force garbage collection if available
              if (window.gc) {
                window.gc();
              }
              window._cleanupTimeout = null;
            }, 1000);
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // Disable expensive CSS features
        const style = document.createElement('style');
        style.textContent = \`
          * {
            will-change: auto !important;
            transform: none !important;
            filter: none !important;
            backdrop-filter: none !important;
          }
        \`;
        document.head.appendChild(style);
        
        // Monitor memory usage
        setInterval(() => {
          if (performance.memory) {
            const used = performance.memory.usedJSHeapSize;
            const limit = performance.memory.jsHeapSizeLimit;
            const percentage = (used / limit) * 100;
            
            if (percentage > 70) {
              console.warn('High memory usage:', Math.round(percentage) + '%');
              if (window.gc) {
                window.gc();
              }
            }
          }
        }, 5000);
      })();
    `);
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
  });

  // Memory management
  appWindow.webContents.on('did-finish-load', () => {
    // Disable GPU acceleration for memory-intensive operations
    appWindow.webContents.executeJavaScript(`
      // Disable expensive visual effects
      document.documentElement.style.setProperty('--disable-animations', 'true');
      
      // Force immediate garbage collection
      if (window.gc) {
        window.gc();
      }
      
      // Optimize rendering
      document.body.style.willChange = 'auto';
    `);
  });

  // Aggressive memory monitoring and cleanup
  setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    
    // Lower threshold for more aggressive cleanup
    if (memoryUsage.heapUsed > 200 * 1024 * 1024) { // 200MB threshold
      console.warn('Memory usage:', heapUsedMB + 'MB - forcing cleanup');
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      // Clear renderer caches
      appWindow.webContents.executeJavaScript(`
        // Clear any cached data
        if (window.gc) window.gc();
        
        // Force DOM cleanup
        const unusedElements = document.querySelectorAll('[data-cleanup="true"]');
        unusedElements.forEach(el => el.remove());
        
        // Clear image caches
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          if (!img.getBoundingClientRect().height) {
            img.src = '';
          }
        });
      `);
    }
  }, 10000); // Check every 10 seconds
}

// Aggressive memory optimization flags
app.commandLine.appendSwitch('--max-old-space-size', '1024');
app.commandLine.appendSwitch('--js-flags', '--max-old-space-size=1024 --optimize-for-size --gc-interval=100');
app.commandLine.appendSwitch('--disable-renderer-backgrounding');
app.commandLine.appendSwitch('--disable-background-timer-throttling');
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('--disable-features', 'TranslateUI,VizDisplayCompositor');
app.commandLine.appendSwitch('--disable-ipc-flooding-protection');

// Critical tile memory management
app.commandLine.appendSwitch('--max-tiles-for-interest-area', '64');
app.commandLine.appendSwitch('--max-unused-resource-memory-usage-percentage', '25');
app.commandLine.appendSwitch('--memory-pressure-off', '16');
app.commandLine.appendSwitch('--max-decoded-image-size-mb', '32');

// GPU and rendering optimizations
app.commandLine.appendSwitch('--disable-gpu-sandbox');
app.commandLine.appendSwitch('--disable-software-rasterizer');
app.commandLine.appendSwitch('--disable-gpu-memory-buffer-compositor-resources');
app.commandLine.appendSwitch('--disable-gpu-memory-buffer-video-frames');
app.commandLine.appendSwitch('--num-raster-threads', '2');
app.commandLine.appendSwitch('--enable-gpu-memory-buffer-compositor-resources', 'false');

// Compositor memory limits
app.commandLine.appendSwitch('--force-gpu-mem-available-mb', '256');
app.commandLine.appendSwitch('--force-gpu-mem-discardable-limit-mb', '32');

app.whenReady().then(() => {
  createLoginWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLoginWindow();
    }
  });
});

// Handle login attempts
ipcMain.on("login-attempt", (event, password) => {
  // 🔐 In production, use proper password hashing (bcrypt, etc.)
  // For now, using simple password check from config
  if (password === config.defaultPassword) {
    createAppWindow();
  } else {
    event.reply("login-failed", "❌ Invalid password. Please try again.");
  }
});

// Handle app quit
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});