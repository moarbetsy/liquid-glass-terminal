// Configuration for the Electron app
module.exports = {
  // Default password - change this for production
  defaultPassword: "liquidglass2025",
  
  // App settings
  app: {
    name: "Liquid Glass Terminal",
    version: "1.0.0",
    description: "Secure Business Management Terminal"
  },
  
  // Window settings
  windows: {
    login: {
      width: 450,
      height: 350,
      resizable: false
    },
    main: {
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800
    }
  },
  
  // Development settings
  dev: {
    port: 5173,
    openDevTools: true
  }
};