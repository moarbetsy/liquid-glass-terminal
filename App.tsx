import React, { useEffect, useState, useMemo, useRef, type ReactNode, useCallback } from 'react';
import {
  ShoppingCart, Users, Box, Plus, Home, Search,
  Package, ReceiptText, CheckCircle, History, LogOut, Settings, DollarSign, Trash2, TrendingUp, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useLocalStorage } from './hooks/useLocalStorage';
import type { Page, Order, Client, Product, OrderItem, Expense, LogEntry, Metric } from './types';
import { initialClients, initialProducts, initialOrders, initialExpenses, initialLogs } from './lib/data';
import { calculateCost } from './lib/utils';
import { CreateOrderModal, CreateClientModal, CreateProductModal, AddStockModal, EditClientModal, EditOrderModal, EditProductModal, ClientOrdersModal, EditExpenseModal, LogDetailsModal, SessionTimeoutModal, MetricDetailsModal, type ChartData } from './components/modals';
import { NavItem, MobileNavItem, GlassCard, MetricCard } from './components/common';
import LoginPage from './components/LoginPage';

const Sidebar: React.FC<{ page: Page; setPage: (page: Page) => void; ordersCount: number; currentUser: string; }> = ({ page, setPage, ordersCount, currentUser }) => (
  <aside className="col-span-3 lg:col-span-2 hidden md:block glass-wrap">
    <div className="sticky top-6 space-y-6">
      <div className="p-4 glass">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center text-white text-lg font-semibold">{currentUser.charAt(0).toUpperCase()}</div>
              <div>
                <div className="text-sm font-semibold text-primary">{currentUser}</div>
                <div className="text-xs text-muted">Biz Manager</div>
              </div>
            </div>
            <button onClick={() => setPage('settings')} className={`p-2 rounded-full transition-colors text-muted hover:text-primary ${page === 'settings' || ['products', 'expenses', 'log', 'pricing'].includes(page) ? 'bg-white/10 text-primary' : 'hover:bg-white/10'}`} aria-label="Settings">
              <Settings size={20} />
            </button>
        </div>
        <nav aria-label="Main navigation" className="mt-6 grid gap-1">
          <NavItem icon={<Home size={16} />} label="Homepage" active={page === 'dashboard'} onClick={() => setPage('dashboard')} />
          <NavItem icon={<ShoppingCart size={16} />} label="Orders" active={page === 'orders'} onClick={() => setPage('orders')} badge={ordersCount} />
          <NavItem icon={<Users size={16} />} label="Clients" active={page === 'clients'} onClick={() => setPage('clients')} />
        </nav>
      </div>
    </div>
  </aside>
);

const DashboardActionCard: React.FC<{
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="glass-wrap group"
  >
    <div className="glass p-6 text-left h-full flex flex-col transition-all duration-300 border border-transparent group-hover:border-[var(--glass-border-hover)] group-hover:bg-[var(--glass-bg-hover)]">
        <div className="bg-white/5 p-3 rounded-lg w-fit text-primary mb-4 transition-colors group-hover:bg-indigo-500/10 group-hover:text-indigo-400">
            {icon}
        </div>
        <h3 className="font-bold text-lg text-primary">{title}</h3>
        <p className="text-sm text-muted mt-1 flex-grow">{description}</p>
        <div className="text-sm font-bold text-indigo-400 mt-4 self-start transition-transform group-hover:translate-x-1">
            Proceed &rarr;
        </div>
    </div>
  </button>
);


const DashboardPage: React.FC<{
  metrics: Metric[];
  onNewOrder: () => void;
  onMetricClick: (title: string) => void;
}> = ({ metrics, onNewOrder, onMetricClick }) => (
  <div className="space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-5xl font-bold text-primary tracking-tight">Dashboard</h1>
       <button onClick={onNewOrder} className="gloss-btn px-5 py-3 text-base">
         <Plus size={20} /> New Order
       </button>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {metrics.map((metric, index) => {
        const clickableMetrics = ['Total Revenue', 'Net Profit', 'Inventory Value'];
        return (
          <MetricCard 
              key={index} 
              metric={metric} 
              onClick={clickableMetrics.includes(metric.title) ? () => onMetricClick(metric.title) : undefined}
          />
        )
      })}
    </div>
  </div>
);

const OrdersPage: React.FC<{ orders: Order[]; clients: Client[]; products: Product[]; searchQuery: string; onOrderClick: (order: Order) => void; onMarkAsPaid: (orderId: string) => void; }> = ({ orders, clients, products, searchQuery, onOrderClick, onMarkAsPaid }) => {
    const filteredOrders = useMemo(() => orders.filter(order =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (clients.find(c => c.id === order.clientId)?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [orders, clients, searchQuery]);

    const getStatusClass = (order: Order) => {
        const balance = order.total - (order.amountPaid || 0);
        if (order.status === 'Completed' || balance <= 0) return 'status-completed';
        if (order.status === 'Unpaid') {
            return (order.amountPaid && order.amountPaid > 0) ? 'status-unpaid' : 'status-unpaid-zero';
        }
        return `status-${order.status.toLowerCase()}`;
    };

    return (
        <GlassCard title="Orders">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                    <tr className="text-xs text-muted border-b border-white/10">
                        <th className="p-3">Order ID</th><th className="p-3">Client</th><th className="p-3">Products</th><th className="p-3">Total</th><th className="p-3">Balance</th><th className="p-3">Status</th><th className="p-3 text-center">Paid</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredOrders.map(o => {
                        const balance = o.total - (o.amountPaid || 0);
                        return (
                            <tr key={o.id} onClick={() => onOrderClick(o)} className="border-b border-white/5 text-sm hover:bg-white/5 cursor-pointer transition-colors">
                                <td className="p-3 font-mono text-primary">{o.id}</td>
                                <td className="p-3 text-primary">{clients.find(c => c.id === o.clientId)?.name}</td>
                                <td className="p-3 text-muted text-xs">
                                    {o.items.map(item => {
                                        const product = products.find(p => p.id === item.productId);
                                        return <div key={item.productId}>{item.quantity} x {product?.name || 'Unknown'}</div>
                                    })}
                                </td>
                                <td className="p-3 text-primary font-semibold">${o.total.toFixed(2)}</td>
                                <td className={`p-3 font-semibold ${balance > 0 ? 'text-orange-400' : balance < 0 ? 'text-green-400' : 'text-primary'}`}>
                                    {balance < 0 ? `-$${Math.abs(balance).toFixed(2)}` : `$${balance.toFixed(2)}`}
                                </td>
                                <td className="p-3"><span className={`status-badge ${getStatusClass(o)}`}>{balance <= 0 ? 'Completed' : o.status}</span></td>
                                <td className="p-3 text-center">
                                    {balance > 0 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onMarkAsPaid(o.id); }}
                                            className="p-2 rounded-full hover:bg-green-500/20 text-green-400 transition-colors"
                                            aria-label="Mark as paid"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
};

const ClientsPage: React.FC<{ 
    clients: Client[]; 
    orders: Order[]; 
    searchQuery: string; 
    onClientClick: (client: Client) => void;
    onViewOrders: (client: Client) => void;
    sortedClients: any[];
}> = ({ clients, orders, searchQuery, onClientClick, onViewOrders, sortedClients }) => {
    
    const filteredClients = useMemo(() => sortedClients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        `#${client.displayId}`.includes(searchQuery)
    ), [sortedClients, searchQuery]);
    
    return (
        <GlassCard title="Clients">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs text-muted border-b border-white/10">
                            <th className="p-3">#ID</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Orders</th>
                            <th className="p-3">Spent</th>
                            <th className="p-3">Balance</th>
                             <th className="p-3 text-center">History</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClients.map(c => (
                            <tr key={c.id} onClick={() => onClientClick(c)} className="border-b border-white/5 text-sm hover:bg-white/5 cursor-pointer transition-colors">
                                <td className="p-3 text-muted">#{c.displayId}</td>
                                <td className="p-3">
                                    <div className="font-semibold text-primary">{c.name}</div>
                                </td>
                                <td className="p-3 text-primary">{c.orders}</td>
                                <td className="p-3 text-primary font-medium">${c.totalSpent.toLocaleString()}</td>
                                <td className={`p-3 font-medium ${c.balance > 0 ? 'text-orange-400' : c.balance < 0 ? 'text-green-400' : 'text-primary'}`}>
                                    {c.balance !== 0 ? (c.balance < 0 ? `-$${Math.abs(c.balance).toFixed(2)}` : `$${c.balance.toFixed(2)}`) : '-'}
                                </td>
                                <td className="p-3 text-center">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); onViewOrders(c); }} 
                                      className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted"
                                      aria-label="View client orders"
                                    >
                                        <ShoppingCart size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
};

const ProductsPage: React.FC<{ products: Product[]; searchQuery: string; onProductClick: (product: Product) => void; }> = ({ products, searchQuery, onProductClick }) => {
    const filteredProducts = useMemo(() => products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.type.toLowerCase().includes(searchQuery.toLowerCase())
    ), [products, searchQuery]);

    return (
        <GlassCard title="Products">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                    <tr className="text-xs text-muted border-b border-white/10">
                        <th className="p-3">Product</th>
                        <th className="p-3">Stock</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredProducts.map(p => (
                        <tr key={p.id} onClick={() => onProductClick(p)} className="border-b border-white/5 text-sm hover:bg-white/5 cursor-pointer transition-colors">
                            <td className="p-3 font-semibold text-primary">{p.name}</td>
                            <td className="p-3">
                                <span className={`font-medium ${p.stock > 10 ? 'text-green-400' : p.stock >= 0 ? 'text-orange-400' : 'text-red-500'}`}>
                                    {p.stock}{p.type !== 'unit' ? ` ${p.type}` : ''}
                                </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
};

const ExpensesPage: React.FC<{ expenses: Expense[]; searchQuery: string; onExpenseClick: (expense: Expense) => void; }> = ({ expenses, searchQuery, onExpenseClick }) => {
    const filteredExpenses = useMemo(() => expenses.filter(expense =>
        expense.description.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [expenses, searchQuery]);
    
    const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);

    return (
        <GlassCard title="All Expenses">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs text-muted border-b border-white/10">
                            <th className="p-3">Date</th>
                            <th className="p-3">Description</th>
                            <th className="p-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.map(e => (
                            <tr key={e.id} onClick={() => onExpenseClick(e)} className="border-b border-white/5 text-sm hover:bg-white/5 cursor-pointer transition-colors">
                                <td className="p-3 text-muted">{e.date}</td>
                                <td className="p-3 text-primary">{e.description}</td>
                                <td className="p-3 text-right font-medium text-red-400">-${e.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold">
                            <td className="p-3" colSpan={2}>Total</td>
                            <td className="p-3 text-right">-${totalExpenses.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </GlassCard>
    );
};

const LogPage: React.FC<{ logs: LogEntry[]; onLogClick: (log: LogEntry) => void; }> = ({ logs, onLogClick }) => (
    <GlassCard title="Activity Log">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-xs text-muted border-b border-white/10">
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">User</th>
                        <th className="p-3">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log.id} onClick={() => onLogClick(log)} className="border-b border-white/5 text-sm hover:bg-white/5 cursor-pointer transition-colors">
                            <td className="p-3 text-muted font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="p-3 text-primary">{log.user}</td>
                            <td className="p-3 text-primary font-medium">{log.action}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </GlassCard>
);

const PricingPage: React.FC<{
  products: Product[];
  onSave: (product: Product) => void;
  onBack: () => void;
}> = ({ products, onSave, onBack }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [tiers, setTiers] = useState<{ quantity: string; price: string; cost: string }[]>([]);

  useEffect(() => {
    if (selectedProductId) {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        const quantities = (product.referenceQuantity || '').split('/').map(s => s.trim());
        const prices = (product.suggestedPrice || '').split('/').map(s => s.trim());
        const costs = (product.cost || '').split('/').map(s => s.trim());
        
        const maxLen = Math.max(quantities.length, prices.length, costs.length);
        
        const newTiers = Array.from({ length: maxLen }, (_, i) => ({
          quantity: quantities[i] || '',
          price: prices[i] || '',
          cost: costs[i] || '',
        })).filter(t => t.quantity || t.price || t.cost);
        
        setTiers(newTiers.length > 0 ? newTiers : [{quantity: '', price: '', cost: ''}]);
      }
    } else {
      setTiers([]);
    }
  }, [selectedProductId, products]);

  const handleTierChange = (index: number, field: 'quantity' | 'price' | 'cost', value: string) => {
    const newTiers = [...tiers];
    newTiers[index][field] = value;
    setTiers(newTiers);
  };

  const addTier = () => {
    setTiers([...tiers, { quantity: '', price: '', cost: '' }]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const validTiers = tiers.filter(t => t.quantity.trim() !== '' || t.price.trim() !== '' || t.cost.trim() !== '');

    const updatedProduct: Product = {
      ...product,
      referenceQuantity: validTiers.map(t => t.quantity.trim()).join('/'),
      suggestedPrice: validTiers.map(t => t.price.trim()).join('/'),
      cost: validTiers.map(t => t.cost.trim()).join('/'),
    };
    onSave(updatedProduct);
    alert('Pricing updated successfully!');
  };
  
  const FormRow = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col gap-2">{children}</div>;
  const Label = ({ children, htmlFor }: { children: React.ReactNode, htmlFor?: string }) => <label htmlFor={htmlFor} className="text-sm font-medium text-muted">{children}</label>;
  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />;
  const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none" />;

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-primary">Manage Product Pricing</h2>
        <button onClick={onBack} className="text-sm font-medium text-muted px-3 py-1 rounded-lg hover:bg-white/10 transition-colors">
          &larr; Back to Settings
        </button>
      </div>

      <div className="max-w-md mb-6">
        <FormRow>
          <Label htmlFor="product-select">Select a Product</Label>
          <Select id="product-select" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
            <option value="">-- Choose a product --</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </FormRow>
      </div>

      {selectedProductId && (
        <div>
          <div className="space-y-3">
            {tiers.map((tier, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  <Label htmlFor={`qty-${index}`}>Quantity (e.g., 1g)</Label>
                  <Input id={`qty-${index}`} type="text" value={tier.quantity} onChange={e => handleTierChange(index, 'quantity', e.target.value)} placeholder="1g, 3.5g, etc." />
                </div>
                <div className="col-span-3">
                  <Label htmlFor={`price-${index}`}>Price ($)</Label>
                  <Input id={`price-${index}`} type="number" step="0.01" value={tier.price} onChange={e => handleTierChange(index, 'price', e.target.value)} placeholder="0.00" />
                </div>
                <div className="col-span-3">
                  <Label htmlFor={`cost-${index}`}>Cost ($)</Label>
                  <Input id={`cost-${index}`} type="number" step="0.01" value={tier.cost} onChange={e => handleTierChange(index, 'cost', e.target.value)} placeholder="0.00"/>
                </div>
                <div className="col-span-2">
                  <button onClick={() => removeTier(index)} className="w-full h-[46px] flex items-center justify-center bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20" aria-label="Remove tier">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <button onClick={addTier} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted">
                <Plus size={16} /> Add Tier
              </button>
              <button onClick={handleSave} className="w-full gloss-btn">
                Save Changes
              </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

const SettingsPage: React.FC<{
  setPage: (page: Page) => void;
  onLogout: () => void;
  onAddProduct: () => void;
  onAddStocks: () => void;
  onAddClient: () => void;
}> = ({ setPage, onLogout, onAddProduct, onAddStocks, onAddClient }) => (
  <GlassCard title="Settings">
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-primary mb-4">Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <DashboardActionCard 
            icon={<Box size={22} />}
            title="Manage Products"
            description="View and edit your product inventory."
            onClick={() => setPage('products')}
          />
           <DashboardActionCard 
            icon={<DollarSign size={22} />}
            title="Manage Pricing"
            description="Set and adjust pricing tiers for all products."
            onClick={() => setPage('pricing')}
          />
           <DashboardActionCard 
            icon={<ReceiptText size={22} />}
            title="Manage Expenses"
            description="Track and manage all business expenses."
            onClick={() => setPage('expenses')}
          />
           <DashboardActionCard 
            icon={<History size={22} />}
            title="Activity Log"
            description="Review all system and user activity."
            onClick={() => setPage('log')}
          />
        </div>
      </div>
    
      <div>
        <h3 className="text-lg font-semibold text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardActionCard 
            icon={<Package size={22} />}
            title="Add Stock"
            description="Increase stock levels for existing products."
            onClick={onAddStocks}
          />
          <DashboardActionCard 
            icon={<Box size={22} />}
            title="Add New Product"
            description="Create a new item in your inventory."
            onClick={onAddProduct}
          />
          <DashboardActionCard 
            icon={<Users size={22} />}
            title="Add Client"
            description="Onboard a new client to the system."
            onClick={onAddClient}
          />
        </div>
      </div>
      
      <div className="pt-6 border-t border-white/10">
        <h3 className="text-lg font-semibold text-primary mb-4">Account</h3>
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 w-full max-w-xs text-sm p-2 rounded-lg transition-all hover:bg-glass/60 text-muted"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-primary">
              <LogOut size={16} />
          </div>
          <div className="flex-1 text-left font-medium text-primary">Log Out</div>
        </button>
      </div>
    </div>
  </GlassCard>
);

export default function AppleStyleDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  const [page, setPage] = useState<Page>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingClientOrders, setViewingClientOrders] = useState<Client | null>(null);
  const [viewingLog, setViewingLog] = useState<LogEntry | null>(null);
  const [viewingMetric, setViewingMetric] = useState<string | null>(null);

  const [orders, setOrders] = useLocalStorage<Order[]>('dashboard-orders', initialOrders);
  const [clients, setClients] = useLocalStorage<Client[]>('dashboard-clients', initialClients);
  const [products, setProducts] = useLocalStorage<Product[]>('dashboard-products', initialProducts);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('dashboard-expenses', initialExpenses);
  const [logs, setLogs] = useLocalStorage<LogEntry[]>('dashboard-logs', initialLogs);
  
  const backgroundRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<number | undefined>(undefined);
  const warningTimerRef = useRef<number | undefined>(undefined);

  const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
  const WARNING_DURATION_MS = 2 * 60 * 1000;   // 2 minutes before timeout

  const clearInactivityTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('lg-dashboard-user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    clearInactivityTimers();
    setShowTimeoutWarning(false);
  }, [clearInactivityTimers]);

  const startInactivityTimers = useCallback(() => {
    clearInactivityTimers();
    warningTimerRef.current = window.setTimeout(() => {
      setShowTimeoutWarning(true);
    }, INACTIVITY_TIMEOUT_MS - WARNING_DURATION_MS);
    
    inactivityTimerRef.current = window.setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearInactivityTimers, handleLogout]);

  const handleExtendSession = useCallback(() => {
    setShowTimeoutWarning(false);
    startInactivityTimers();
  }, [startInactivityTimers]);

  useEffect(() => {
    const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    
    if (isAuthenticated) {
      startInactivityTimers();
      activityEvents.forEach(event => {
        window.addEventListener(event, startInactivityTimers);
      });
    }

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, startInactivityTimers);
      });
      clearInactivityTimers();
    };
  }, [isAuthenticated, startInactivityTimers, clearInactivityTimers]);


  useEffect(() => {
    const loggedInUser = sessionStorage.getItem('lg-dashboard-user');
    if (loggedInUser) {
        setIsAuthenticated(true);
        setCurrentUser(loggedInUser);
    }
  }, []);

  const handleLoginSuccess = (username: string) => {
    sessionStorage.setItem('lg-dashboard-user', username);
    setIsAuthenticated(true);
    setCurrentUser(username);
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      window.requestAnimationFrame(() => {
        if (backgroundRef.current) {
          const { clientX, clientY } = event;
          const x = -(clientX - window.innerWidth / 2) / 40;
          const y = -(clientY - window.innerHeight / 2) / 40;
          backgroundRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  const addLog = (action: string, details: Record<string, any>) => {
    const newLogEntry: LogEntry = {
        id: `log-${new Date().getTime()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        user: currentUser || 'System',
        action,
        details,
    };
    setLogs(prev => [newLogEntry, ...prev]);
  };

  const getNextOrderId = (currentOrders: Order[]): string => {
      if (currentOrders.length === 0) {
          return '#0001';
      }
      const maxId = Math.max(...currentOrders.map(o => parseInt(o.id.replace('#', ''), 10)));
      const nextIdNumber = isFinite(maxId) ? maxId + 1 : 1;
      return `#${String(nextIdNumber).padStart(4, '0')}`;
  };

  const handleCreateOrder = (orderData: {clientId: string, items: OrderItem[], shipping: number, discount: number, amountPaid: number, date: string}) => {
    const itemsTotal = orderData.items.reduce((sum, item) => sum + item.price, 0);
    const total = itemsTotal + (orderData.shipping || 0) - (orderData.discount || 0);
    
    let status: 'Draft' | 'Unpaid' | 'Completed' = 'Unpaid';
    if (orderData.amountPaid > 0) {
        if (orderData.amountPaid >= total) {
            status = 'Completed';
        } else {
            status = 'Unpaid';
        }
    }

    const newOrder: Order = {
      id: getNextOrderId(orders),
      clientId: orderData.clientId,
      items: orderData.items,
      shipping: orderData.shipping || 0,
      discount: orderData.discount || 0,
      amountPaid: orderData.amountPaid || 0,
      total: total,
      status: status,
      date: orderData.date,
      notes: '',
    };

    setOrders(prev => [newOrder, ...prev]);
    addLog('Created Order', { orderId: newOrder.id, client: clients.find(c => c.id === newOrder.clientId)?.name, total: newOrder.total });
    
    newOrder.items.forEach(item => {
        setProducts(prevProducts => prevProducts.map(p => 
            p.id === item.productId ? {...p, stock: p.stock - item.quantity} : p
        ));
    });

    setClients(prevClients => prevClients.map(c => 
        c.id === newOrder.clientId ? {...c, orders: c.orders + 1, totalSpent: c.totalSpent + total} : c
    ));

    setShowCreateOrder(false);
  };

  const handleUpdateOrder = (originalOrder: Order, updatedData: Omit<Order, 'id'>) => {
    const stockAdjustments = new Map<string, number>();

    originalOrder.items.forEach(item => {
        stockAdjustments.set(item.productId, (stockAdjustments.get(item.productId) || 0) + item.quantity);
    });

    updatedData.items.forEach(item => {
        stockAdjustments.set(item.productId, (stockAdjustments.get(item.productId) || 0) - item.quantity);
    });
    
    setProducts(prevProducts => {
        const newProducts = [...prevProducts];
        stockAdjustments.forEach((change, productId) => {
            const productIndex = newProducts.findIndex(p => p.id === productId);
            if (productIndex > -1) {
                newProducts[productIndex] = {
                    ...newProducts[productIndex],
                    stock: newProducts[productIndex].stock + change
                };
            }
        });
        return newProducts;
    });

    setClients(prevClients => {
        const newClients = [...prevClients];
        
        const oldClientIndex = newClients.findIndex(c => c.id === originalOrder.clientId);
        const newClientIndex = newClients.findIndex(c => c.id === updatedData.clientId);

        if (originalOrder.clientId === updatedData.clientId) {
            if (oldClientIndex > -1) {
                const spentDifference = updatedData.total - originalOrder.total;
                newClients[oldClientIndex] = {
                    ...newClients[oldClientIndex],
                    totalSpent: newClients[oldClientIndex].totalSpent + spentDifference,
                };
            }
        } else {
            if (oldClientIndex > -1) {
                newClients[oldClientIndex] = {
                    ...newClients[oldClientIndex],
                    orders: newClients[oldClientIndex].orders - 1,
                    totalSpent: newClients[oldClientIndex].totalSpent - originalOrder.total,
                };
            }
            if (newClientIndex > -1) {
                newClients[newClientIndex] = {
                    ...newClients[newClientIndex],
                    orders: newClients[newClientIndex].orders + 1,
                    totalSpent: newClients[newClientIndex].totalSpent + updatedData.total,
                };
            }
        }
        return newClients;
    });

    setOrders(prevOrders => prevOrders.map(o => 
        o.id === originalOrder.id ? { ...o, ...updatedData } : o
    ));
    addLog('Updated Order', { orderId: originalOrder.id, client: clients.find(c => c.id === updatedData.clientId)?.name, changes: { ...updatedData } });

    setEditingOrder(null);
  };
  
  const handleMarkOrderAsPaid = (orderId: string) => {
    setOrders(prevOrders => prevOrders.map(o => {
        if (o.id === orderId) {
            return {
                ...o,
                amountPaid: o.total,
                status: 'Completed'
            };
        }
        return o;
    }));
    addLog('Marked Order as Paid', { orderId });
  };

  const handleAddClient = (newClientData: Omit<Client, 'id' | 'orders' | 'totalSpent' | 'displayId'>) => {
    const newDisplayId = Math.max(0, ...clients.map(c => c.displayId)) + 1;
    const newClient: Client = {
      id: `c${clients.length + 1}-${new Date().getTime()}`,
      displayId: newDisplayId,
      name: newClientData.name,
      email: newClientData.email || '',
      phone: newClientData.phone || '',
      address: newClientData.address || '',
      notes: newClientData.notes || '',
      orders: 0,
      totalSpent: 0,
    };
    setClients(prev => [newClient, ...prev]);
    addLog('Added Client', { clientId: newClient.id, name: newClient.name });
    setShowCreateClient(false);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prevClients => prevClients.map(c => c.id === updatedClient.id ? updatedClient : c));
    addLog('Updated Client', { clientId: updatedClient.id, name: updatedClient.name, changes: { ...updatedClient } });
    setEditingClient(null);
  };

  const handleAddProduct = (newProductData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...newProductData,
      id: `p${products.length + 1}-${new Date().getTime()}`,
    };
    setProducts(prev => [newProduct, ...prev]);
    addLog('Added Product', { productId: newProduct.id, name: newProduct.name });
    setShowCreateProduct(false);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prevProducts => prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    addLog('Updated Product', { productId: updatedProduct.id, name: updatedProduct.name, changes: { ...updatedProduct } });
    setEditingProduct(null);
  };

  const handleAddStock = (productId: string, amount: number, purchaseCost: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    setProducts(prevProducts => prevProducts.map(p => 
        p.id === productId ? {...p, stock: p.stock + amount } : p
    ));
    addLog('Added Stock', { productId, productName: product.name, amount, cost: purchaseCost });
    
    if (purchaseCost > 0) {
      const newExpense: Expense = {
        id: `exp-${new Date().getTime()}-${Math.random()}`,
        date: new Date().toISOString().split('T')[0],
        description: `Stock for ${product.name} (+${amount})`,
        amount: purchaseCost,
      };
      setExpenses(prev => [newExpense, ...prev]);
    }

    setShowAddStock(false);
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    addLog('Updated Expense', { expenseId: updatedExpense.id, description: updatedExpense.description, changes: { ...updatedExpense } });
    setEditingExpense(null);
  };

  const sortedClientsWithData = useMemo(() => {
    return clients
        .map(client => {
            const clientOrders = orders.filter(o => o.clientId === client.id);
            const balance = clientOrders.reduce((sum, order) => sum + (order.total - (order.amountPaid || 0)), 0);
            
            const lastOrderDate = clientOrders.length > 0
                ? [...clientOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
                : null;

            return { ...client, balance, lastOrderDate };
        })
        .sort((a, b) => {
            if (a.lastOrderDate && b.lastOrderDate) {
                return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
            }
            if (a.lastOrderDate) return -1;
            if (b.lastOrderDate) return 1;
            return a.displayId - b.displayId;
        });
  }, [clients, orders]);

  const sortedProducts = useMemo(() => {
    const lastUsedMap = new Map<string, string>();
    const sortedOrders = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const order of sortedOrders) {
        for (const item of order.items) {
            if (!lastUsedMap.has(item.productId)) {
                lastUsedMap.set(item.productId, order.date);
            }
        }
    }

    return [...products].sort((a, b) => {
        const lastUsedA = lastUsedMap.get(a.id);
        const lastUsedB = lastUsedMap.get(b.id);

        if (lastUsedA && lastUsedB) {
            const dateDiff = new Date(lastUsedB).getTime() - new Date(lastUsedA).getTime();
            if (dateDiff !== 0) return dateDiff;
        }
        if (lastUsedA) return -1;
        if (lastUsedB) return 1;

        return b.stock - a.stock;
    });
  }, [products, orders]);
  
  const clientOrdersForModal = useMemo(() => {
    if (!viewingClientOrders) return [];
    return orders.filter(o => o.clientId === viewingClientOrders.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, viewingClientOrders]);

  const dashboardMetrics = useMemo<Metric[]>(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    const totalCogs = orders.reduce((orderSum, order) => {
        const orderCost = order.items.reduce((itemSum, item) => {
            const product = products.find(p => p.id === item.productId);
            return itemSum + (product ? calculateCost(product, item.quantity) : 0);
        }, 0);
        return orderSum + orderCost;
    }, 0);
    
    const totalGrossProfit = totalRevenue - totalCogs;
    const totalExpensesAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalNetProfit = totalGrossProfit - totalExpensesAmount;

    const totalInventoryCost = products.reduce((sum, product) => {
        if (product.stock <= 0) return sum;
        return sum + calculateCost(product, product.stock);
    }, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = orders.filter(order => new Date(order.date) >= thirtyDaysAgo);
    const revenueLast30Days = recentOrders.reduce((sum, order) => sum + order.total, 0);

    return [
        {
            title: 'Total Revenue',
            value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            subtitle: 'All-time gross revenue',
            icon: <TrendingUp size={36} />,
            color: 'green',
        },
        {
            title: 'Net Profit',
            value: `$${totalNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            subtitle: 'After costs & expenses',
            icon: <DollarSign size={36} />,
            color: 'blue',
        },
        {
            title: '30-Day Revenue',
            value: `$${revenueLast30Days.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            subtitle: 'Revenue in the last month',
            icon: <Calendar size={36} />,
            color: 'purple',
        },
        {
            title: 'Inventory Value',
            value: `$${totalInventoryCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            subtitle: 'Total cost of stock on hand',
            icon: <Package size={36} />,
            color: 'orange',
        },
    ];
  }, [orders, products, expenses]);

  const chartData = useMemo<ChartData | null>(() => {
      if (!viewingMetric) return null;

      const now = new Date();
      const monthlyData: { [key: string]: { revenue: number, cogs: number, expenses: number } } = {};
      
      for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = date.toLocaleString('default', { month: 'short', year: '2-digit' }).replace(' ', "'");
          monthlyData[key] = { revenue: 0, cogs: 0, expenses: 0 };
      }

      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      orders.forEach(order => {
          const orderDate = new Date(order.date);
          if (orderDate >= twelveMonthsAgo) {
              const key = orderDate.toLocaleString('default', { month: 'short', year: '2-digit' }).replace(' ', "'");
              if (monthlyData[key]) {
                  monthlyData[key].revenue += order.total;
                  monthlyData[key].cogs += order.items.reduce((sum, item) => {
                      const product = products.find(p => p.id === item.productId);
                      return sum + (product ? calculateCost(product, item.quantity) : 0);
                  }, 0);
              }
          }
      });
      
      expenses.forEach(expense => {
          const expenseDate = new Date(expense.date);
           if (expenseDate >= twelveMonthsAgo) {
              const key = expenseDate.toLocaleString('default', { month: 'short', year: '2-digit' }).replace(' ', "'");
              if (monthlyData[key]) {
                  monthlyData[key].expenses += expense.amount;
              }
          }
      });

      if (viewingMetric === 'Total Revenue') {
          return {
              title: 'Monthly Revenue (Last 12 Months)',
              data: Object.entries(monthlyData).map(([label, { revenue }]) => ({ label, value: parseFloat(revenue.toFixed(2)) })),
          };
      }

      if (viewingMetric === 'Net Profit') {
          return {
              title: 'Monthly Net Profit (Last 12 Months)',
              data: Object.entries(monthlyData).map(([label, { revenue, cogs, expenses }]) => ({ 
                  label, 
                  value: parseFloat((revenue - cogs - expenses).toFixed(2))
              })),
          };
      }

      if (viewingMetric === 'Inventory Value') {
          const inventoryValues = products
              .map(p => ({
                  label: p.name,
                  value: calculateCost(p, p.stock)
              }))
              .filter(p => p.value > 0)
              .sort((a, b) => b.value - a.value)
              .slice(0, 10);
          
          return {
              title: 'Inventory Value by Product (Top 10)',
              data: inventoryValues,
          };
      }

      return null;
  }, [viewingMetric, orders, products, expenses]);


  useEffect(() => {
    document.documentElement.className = 'dark';
    document.documentElement.style.colorScheme = 'dark';
  }, []);

  const anyModalOpen = showCreateOrder || showCreateClient || showCreateProduct || showAddStock || !!editingClient || !!editingOrder || !!editingProduct || !!viewingClientOrders || !!editingExpense || !!viewingLog || !!viewingMetric;
  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anyModalOpen]);

  const renderPage = () => {
    switch (page) {
      case 'orders': return <OrdersPage orders={orders} clients={clients} products={products} searchQuery={searchQuery} onOrderClick={setEditingOrder} onMarkAsPaid={handleMarkOrderAsPaid} />;
      case 'clients': return <ClientsPage clients={clients} orders={orders} searchQuery={searchQuery} onClientClick={setEditingClient} onViewOrders={setViewingClientOrders} sortedClients={sortedClientsWithData} />;
      case 'products': return <ProductsPage products={sortedProducts} searchQuery={searchQuery} onProductClick={setEditingProduct} />;
      case 'expenses': return <ExpensesPage expenses={expenses} searchQuery={searchQuery} onExpenseClick={setEditingExpense} />;
      case 'log': return <LogPage logs={logs} onLogClick={setViewingLog} />;
      case 'pricing': return <PricingPage products={sortedProducts} onSave={handleUpdateProduct} onBack={() => setPage('settings')} />;
      case 'settings': return <SettingsPage 
          setPage={setPage} 
          onLogout={handleLogout}
          onAddProduct={() => setShowCreateProduct(true)}
          onAddStocks={() => setShowAddStock(true)}
          onAddClient={() => setShowCreateClient(true)}
        />;
      case 'dashboard':
      default:
        return <DashboardPage 
          metrics={dashboardMetrics}
          onNewOrder={() => setShowCreateOrder(true)}
          onMetricClick={setViewingMetric}
        />;
    }
  };

  return (
    <div className="min-h-screen font-sans antialiased relative overflow-hidden bg-[var(--bg)] text-primary">
      <style>{`
        :root { 
          --text-primary: rgba(255,255,255,0.98); --text-muted: rgba(255,255,255,0.65);
          --glass-bg: rgba(22, 22, 29, 0.5);
          --glass-border: rgba(255,255,255,0.08);
          --card-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          --accent: 88, 114, 255;
          --bg: #050509;
          --glass-bg-hover: rgba(30,30,35,0.6);
          --glass-border-hover: rgba(88, 114, 255, 0.4);
        }
        html { 
          font-size: 17px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        .text-primary{ color: var(--text-primary); } .text-muted{ color: var(--text-muted); }
        .liquid-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; transition: transform 0.2s ease-out; }
        .blob { position: absolute; filter: blur(64px) saturate(120%); mix-blend-mode: screen; transform-origin: center; opacity: 0.8; }
        .blob--a { width: 540px; height: 540px; left: -10%; top: -15%; background: radial-gradient(circle at 30% 30%, rgba(var(--accent),0.3), rgba(88, 210, 250,0.05)); }
        .blob--b { width: 420px; height: 420px; right: -8%; top: 5%; background: radial-gradient(circle at 65% 35%, rgba(255,140,180,0.2), rgba(255,140,180,0.02)); }
        .blob--c { width: 700px; height: 700px; left: 10%; bottom: -30%; background: radial-gradient(circle at 40% 70%, rgba(120,100,255,0.15), rgba(120,200,255,0.01)); }
        @keyframes floatA { 0%,100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-20px) scale(1.03) } }
        @keyframes floatB { 0%,100% { transform: translateY(0) scale(1) } 50% { transform: translateY(15px) scale(0.98) } }
        .blob--a { animation: floatA 12s ease-in-out infinite; }
        .blob--b { animation: floatB 14s ease-in-out infinite; }
        .blob--c { animation: floatA 16s ease-in-out infinite; }
        .glass-wrap { position: relative; overflow: visible; }
        .glass {
          border-radius: 22px;
          border: 1px solid transparent;
          background: var(--glass-bg);
          box-shadow: var(--card-shadow);
          backdrop-filter: blur(20px) saturate(140%);
          position: relative;
        }
        .glass::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.01) 50%, transparent);
          mix-blend-mode: overlay;
          -webkit-mask-image: radial-gradient(ellipse 100% 50% at 50% 0%, black 70%, transparent 100%);
          mask-image: radial-gradient(ellipse 100% 50% at 50% 0%, black 70%, transparent 100%);
        }
        .glass::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.03));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .glass-inner-glow { display: none; }
        .gloss-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 18px; border-radius: 12px; border: 1px solid rgba(var(--accent),0.14); background: linear-gradient(180deg, rgba(var(--accent),0.96), rgba(var(--accent),0.84)); box-shadow: 0 10px 30px rgba(var(--accent),0.16); color: white; transition: all 0.2s ease; font-weight: 500;}
        .gloss-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(var(--accent),0.25); }
        .gloss-btn:active { transform: translateY(0); }
        .gloss-btn.mobile-fab {
            width: 52px;
            height: 52px;
            padding: 0;
            border-radius: 9999px;
            transform: translateY(-12px);
            box-shadow: 0 8px 25px rgba(var(--accent), 0.3);
        }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 500; text-transform: capitalize; }
        .status-draft { background-color: rgba(107, 114, 128, 0.1); color: rgb(156, 163, 175); }
        .status-unpaid { background-color: rgba(251, 191, 36, 0.1); color: rgb(252, 211, 77); }
        .status-unpaid-zero { background-color: rgba(239, 68, 68, 0.1); color: rgb(248, 113, 113); }
        .status-completed { background-color: rgba(34, 197, 94, 0.1); color: rgb(74, 222, 128); }
        @media (max-width: 768px){ .blob{ filter: blur(36px) } .blob--c{ display:none } }
      `}</style>

      <div ref={backgroundRef} className="liquid-bg" aria-hidden><div className="blob blob--a" /><div className="blob blob--b" /><div className="blob blob--c" /></div>

      {!isAuthenticated || !currentUser ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          <div className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-6 pb-24 md:pb-6">
            <div className="grid grid-cols-12 gap-6">
              <Sidebar page={page} setPage={setPage} ordersCount={orders.filter(o => o.status === 'Draft' || o.status === 'Unpaid').length} currentUser={currentUser} />
              
              <main className="col-span-12 md:col-span-9 lg:col-span-10">
                <header className="mb-6">
                    {['orders', 'clients', 'products', 'expenses'].includes(page) && (
                      <div className="relative glass">
                          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                          <input 
                              type="text" 
                              placeholder="Search..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-transparent border-none rounded-lg pl-11 pr-4 py-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          />
                      </div>
                    )}
                </header>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={page}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderPage()}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
          </div>
          
          <div className="fixed bottom-4 left-4 right-4 md:hidden z-20">
            <div className="bg-glass/80 backdrop-blur-lg border border-white/10 rounded-2xl p-2 flex justify-around items-center shadow-2xl">
              <MobileNavItem onClick={() => setPage('dashboard')} icon={<Home size={22} />} active={page === 'dashboard'} />
              <MobileNavItem onClick={() => setPage('orders')} icon={<ShoppingCart size={22} />} active={page === 'orders'} />
              <button 
                onClick={() => setShowCreateOrder(true)} 
                className="gloss-btn mobile-fab"
                aria-label="Create New Order"
              >
                <Plus size={24} />
              </button>
              <MobileNavItem onClick={() => setPage('clients')} icon={<Users size={22} />} active={page === 'clients'} />
              <MobileNavItem onClick={() => setPage('settings')} icon={<Settings size={22} />} active={page === 'settings' || ['products', 'expenses', 'log', 'pricing'].includes(page)} />
            </div>
          </div>

          <CreateOrderModal isOpen={showCreateOrder} onClose={() => setShowCreateOrder(false)} clients={sortedClientsWithData} products={sortedProducts} onCreate={handleCreateOrder} />
          <CreateClientModal isOpen={showCreateClient} onClose={() => setShowCreateClient(false)} onAdd={handleAddClient} />
          <CreateProductModal isOpen={showCreateProduct} onClose={() => setShowCreateProduct(false)} onAdd={handleAddProduct} />
          <AddStockModal isOpen={showAddStock} onClose={() => setShowAddStock(false)} products={sortedProducts} onAddStock={handleAddStock} />
          <EditClientModal isOpen={!!editingClient} onClose={() => setEditingClient(null)} client={editingClient} onSave={handleUpdateClient} />
          <EditOrderModal isOpen={!!editingOrder} onClose={() => setEditingOrder(null)} order={editingOrder} clients={sortedClientsWithData} products={sortedProducts} onSave={handleUpdateOrder} />
          <EditProductModal isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} product={editingProduct} onSave={handleUpdateProduct} />
          <ClientOrdersModal isOpen={!!viewingClientOrders} onClose={() => setViewingClientOrders(null)} client={viewingClientOrders} orders={clientOrdersForModal} products={products} />
          <EditExpenseModal isOpen={!!editingExpense} onClose={() => setEditingExpense(null)} expense={editingExpense} onSave={handleUpdateExpense} />
          <LogDetailsModal isOpen={!!viewingLog} onClose={() => setViewingLog(null)} logEntry={viewingLog} />
          <MetricDetailsModal 
            isOpen={!!viewingMetric} 
            onClose={() => setViewingMetric(null)} 
            chartData={chartData} 
          />
          <SessionTimeoutModal 
            isOpen={showTimeoutWarning}
            onClose={handleLogout}
            onExtendSession={handleExtendSession}
            timeoutDuration={WARNING_DURATION_MS / 1000}
          />
        </>
      )}
    </div>
  );
}