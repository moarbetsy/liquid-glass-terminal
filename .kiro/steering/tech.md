# Technology Stack

## Frontend Framework
- **React 19** with TypeScript for type safety
- **Vite** as build tool for fast development and building
- **ES Modules** (type: "module" in package.json)

## Styling & UI
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for smooth animations and transitions
- **Lucide React** for consistent iconography
- **Glassmorphism design** with backdrop-blur effects and transparency

## State Management
- **React hooks** (useState, useEffect)
- **Custom useLocalStorage hook** for persistent state
- **LocalStorage** for client-side data persistence

## Key Dependencies
```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "lucide-react": "^0.540.0",
  "framer-motion": "^12.23.12",
  "tailwindcss": "^3.4.0"
}
```

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Installation
```bash
npm install          # Install dependencies
```

## Build Configuration
- **Vite config**: `vite.config.ts`
- **TypeScript config**: `tsconfig.json` and `tsconfig.node.json`
- **Tailwind config**: `tailwind.config.js`
- **PostCSS config**: `postcss.config.js`

## Browser Support
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+