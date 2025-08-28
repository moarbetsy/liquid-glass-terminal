const { spawn } = require('child_process');
const { app } = require('electron');

// Set development environment
process.env.NODE_ENV = 'development';

// Start Electron
const electronProcess = spawn('electron', ['.'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

electronProcess.on('close', () => {
  process.exit();
});