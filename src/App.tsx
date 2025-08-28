import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Users, 
  Box, 
  Home, 
  Settings,
  Terminal,
  BarChart3,
  LogOut
} from 'lucide-react';

import { useLocalStorage } from './hooks/useLocalStorage';
import type { Page, Order, Client, Product, CartItem } from './types';
import { initialClients, initialProducts, initialOrders } from './lib/data';
import { getBadgeValue } from './lib/badgeUtils';
import LoginPage from '../components/LoginPage';

// Import components
import OrderingTerminal from './components/OrderingTerminal';
import Dashboard from './components/Dashboard';
import OrdersPage from './components/OrdersPage';
import ClientsPage from './components/ClientsPage';
import ProductsPage from './components/ProductsPage';
import StatisticsPage from './components/StatisticsPage';
import SettingsPage from './components/SettingsPage';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('terminal');
  const [currentUser, setCurrentUser] = useLocalStorage<string | null>('currentUser', null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!currentUser);
  
  // Data management with localStorage
  const [clients, setClients] = useLocalStorage<Client[]>('clients', initialClients);
  const [products, setProducts] = useLocalStorage<Product[]>('products', initialProducts);
  const [orders, setOrders] = useLocalStorage<Order[]>('orders', initialOrders);
  const [cart, setCart] = useLocalStorage<CartItem[]>('cart', []);

  // Calculate badge value with memoization for performance
  const badgeValue = useMemo(() => {
    return getBadgeValue(orders);
  }, [orders]);

  // Authentication handlers
  const handleLoginSuccess = (username: string) => {
    setCurrentUser(username);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentPage('terminal');
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black">
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Navigation items
  const navItems = [
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, badge: badgeValue },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'products', label: 'Products', icon: Box },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'terminal':
        return (
          <OrderingTerminal 
            cart={cart}
            setCart={setCart}
            clients={clients}
            onCreateOrder={(order) => setOrders(prev => [...prev, order])}
          />
        );
      case 'dashboard':
        return (
          <Dashboard 
            orders={orders}
            clients={clients}
            products={products}
            onNavigate={setCurrentPage}
          />
        );
      case 'orders':
        return (
          <OrdersPage 
            orders={orders}
            setOrders={setOrders}
            clients={clients}
            products={products}
            onNavigate={setCurrentPage}
          />
        );
      case 'clients':
        return (
          <ClientsPage 
            clients={clients}
            setClients={setClients}
            orders={orders}
          />
        );
      case 'products':
        return (
          <ProductsPage 
            products={products}
            setProducts={setProducts}
          />
        );
      case 'statistics':
        return (
          <StatisticsPage 
            orders={orders}
            clients={clients}
            products={products}
          />
        );
      case 'settings':
        return <SettingsPage />;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-black electron-no-drag">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-72 glass-panel border-r">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] flex items-center justify-center text-white font-semibold apple-shadow">
                {currentUser?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold text-sm">{currentUser || 'User'}</div>
                <div className="text-white/40 text-xs">Business Manager</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id as Page)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-white/[0.08] text-white border border-white/[0.12] apple-shadow'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.04] hover:border-white/[0.06] border border-transparent'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-white/50 group-hover:text-white/70'} />
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span 
                        className="ml-auto bg-white/[0.1] text-white text-xs px-2 py-1 rounded-full border border-white/[0.1] backdrop-blur-xl transition-all duration-200"
                        aria-label={`${item.badge} uncompleted ${item.badge === 1 ? 'order' : 'orders'}`}
                        role="status"
                        aria-live="polite"
                      >
                        {item.badge}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-black">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="h-full overflow-auto"
              style={{ willChange: 'transform' }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;