# Project Structure

## Root Level
- `src/` - Main application source code
- `components/` - Legacy component files (use src/components instead)
- `hooks/` - Legacy hooks (use src/hooks instead)
- `lib/` - Legacy utilities (use src/lib instead)
- `dist/` - Build output directory
- `node_modules/` - Dependencies
- `.kiro/` - Kiro IDE configuration and steering rules
- `.vscode/` - VS Code configuration

## Source Directory (`src/`)
```
src/
├── App.tsx              # Main application component with routing
├── main.tsx             # Application entry point
├── index.css            # Global styles
├── types.ts             # TypeScript type definitions
├── components/          # React components
│   ├── Dashboard.tsx
│   ├── OrderingTerminal.tsx
│   ├── OrdersPage.tsx
│   ├── ClientsPage.tsx
│   ├── ProductsPage.tsx
│   └── SettingsPage.tsx
├── hooks/               # Custom React hooks
│   └── useLocalStorage.ts
└── lib/                 # Utilities and data
    ├── data.ts          # Initial data and mock data
    └── productConfig.ts # Product configuration
```

## Architecture Patterns

### Component Structure
- **Page Components**: Full-page components (Dashboard, OrdersPage, etc.)
- **Functional Components**: Use React.FC type annotation
- **Props Interfaces**: Define TypeScript interfaces for all component props
- **Motion Components**: Use framer-motion for animations

### State Management
- **Local State**: useState for component-specific state
- **Persistent State**: useLocalStorage hook for data that needs persistence
- **Prop Drilling**: Pass state down through component hierarchy
- **No Global State**: All state managed at App.tsx level

### File Naming
- **Components**: PascalCase (e.g., `OrderingTerminal.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useLocalStorage.ts`)
- **Types**: Defined in `types.ts` with PascalCase interfaces
- **Utilities**: camelCase (e.g., `data.ts`)

### Import Patterns
- **Relative imports** for local files
- **Type imports** using `import type` syntax
- **Named imports** preferred over default imports for utilities
- **Lucide icons** imported individually

### Styling Conventions
- **Tailwind classes** for all styling
- **Glassmorphism effects**: `bg-white/10 backdrop-blur-xl border border-white/20`
- **Responsive design**: Mobile-first approach with responsive classes
- **Color scheme**: Dark theme with purple/blue gradients
- **Animations**: Framer Motion for page transitions and interactions