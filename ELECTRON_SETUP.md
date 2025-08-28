# Electron Desktop App Setup

## Overview
Your Liquid Glass Terminal now supports both web and desktop modes with password protection when running as an Electron app.

## Installation

First, install the new dependencies:
```bash
npm install
```

## Development

### Web Development (Original)
```bash
npm run dev
```
This starts the Vite development server at http://localhost:5173

### Electron Development
```bash
npm run electron:dev
```
This starts both the Vite dev server and Electron app with hot reload.

### Electron Only (Production Build)
```bash
npm run electron
```
This runs Electron with the built version of your app.

## Building for Distribution

### Build Web Version
```bash
npm run build
```

### Build Desktop App
```bash
npm run electron:build
```
This creates distributable files in the `dist-electron` folder:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` file  
- **Linux**: `.AppImage` file

### Quick Distribution Build
```bash
npm run dist
```
Builds and packages without publishing.

## Password Configuration

The default password is set in `electron/config.js`:
```javascript
defaultPassword: "liquidglass2025"
```

**Important**: Change this password before distribution!

For production, consider implementing proper password hashing using bcrypt or similar.

## File Structure

```
electron/
├── main.js          # Main Electron process
├── preload.js       # Secure IPC bridge
├── login.html       # Password login screen
├── config.js        # App configuration
└── dev-runner.js    # Development helper
```

## Security Features

- **Context Isolation**: Renderer process is isolated from Node.js
- **Preload Script**: Secure communication between processes
- **No Remote Module**: Prevents direct Node.js access from renderer
- **Password Protection**: Login screen before app access
- **Frame Security**: Custom title bar prevents external manipulation

## Customization

### Window Settings
Edit `electron/config.js` to modify:
- Window dimensions
- Development settings
- App metadata

### Login Screen
Modify `electron/login.html` to customize:
- Styling and branding
- Login form behavior
- Error messages

### Main Process
Edit `electron/main.js` for:
- Window management
- Security policies
- IPC handlers

## Troubleshooting

### Port Conflicts
If port 5173 is in use, update both:
- `vite.config.ts` server port
- `electron/config.js` dev port

### Build Issues
Ensure all dependencies are installed:
```bash
npm install
```

### Permission Issues
On macOS, you may need to allow the app in Security & Privacy settings.

## Distribution

1. Build the app: `npm run electron:build`
2. Find distributables in `dist-electron/`
3. Upload to your private GitHub repository
4. Share the download links with authorized users

The password protection ensures only users with the correct password can access your business terminal.