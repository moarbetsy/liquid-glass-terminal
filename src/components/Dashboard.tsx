import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Users, 
  Box, 
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowRight
} from 'lucide-react';
import type { Order, Client, Product, Page } from '../types';

interface DashboardProps {
  orders: Order[];
  clients: Client[];
  products: Product[];
  onNavigate: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, clients, products, onNavigate }) => {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const completedOrders = orders.filter(order => order.status === 'Completed').length;
  const pendingOrders = orders.filter(order => order.status !== 'Completed').length;
  const totalProducts = products.reduce((sum, product) => sum + product.stock, 0);

  const metrics = [
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      subtitle: 'All time',
      icon: <DollarSign size={24} />,
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Total Orders',
      value: orders.length.toString(),
      subtitle: `${completedOrders} completed`,
      icon: <ShoppingCart size={24} />,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'Active Clients',
      value: clients.length.toString(),
      subtitle: 'Registered clients',
      icon: <Users size={24} />,
      color: 'from-purple-500 to-violet-600'
    },
    {
      title: 'Products in Stock',
      value: totalProducts.toString(),
      subtitle: `${products.length} product types`,
      icon: <Box size={24} />,
      color: 'from-orange-500 to-red-600'
    }
  ];

  const quickActions = [
    {
      title: 'New Order',
      description: 'Create a new order in the terminal',
      icon: <ShoppingCart size={24} />,
      action: () => onNavigate('terminal'),
      color: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'Manage Orders',
      description: 'View and manage all orders',
      icon: <Calendar size={24} />,
      action: () => onNavigate('orders'),
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Client Management',
      description: 'Add or edit client information',
      icon: <Users size={24} />,
      action: () => onNavigate('clients'),
      color: 'from-purple-500 to-violet-600'
    },
    {
      title: 'Product Inventory',
      description: 'Manage product stock and pricing',
      icon: <Box size={24} />,
      action: () => onNavigate('products'),
      color: 'from-orange-500 to-red-600'
    }
  ];

  const recentOrders = orders.slice(-5).reverse();

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold gradient-text mb-2">Dashboard</h1>
          <p className="text-white/50 text-sm">Welcome back! Here's what's happening with your business.</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="glass-panel p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/70">
                  {metric.icon}
                </div>
                <TrendingUp size={16} className="text-white/30" />
              </div>
              <div className="text-2xl font-semibold text-white mb-1">{metric.value}</div>
              <div className="text-white/40 text-xs">{metric.subtitle}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.title}
                  onClick={action.action}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="w-full glass-card p-5 text-left group"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/70">
                        {action.icon}
                      </div>
                      <div>
                        <h3 className="text-white font-medium text-sm">{action.title}</h3>
                        <p className="text-white/40 text-xs">{action.description}</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-white/30 group-hover:text-white/60 transition-colors" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Recent Orders</h2>
            <div className="glass-panel p-6">
              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]"
                    >
                      <div>
                        <div className="text-white font-medium text-sm">{order.clientName}</div>
                        <div className="text-white/40 text-xs">
                          {new Date(order.date).toLocaleDateString()} • {order.items.length} items
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium text-sm">${order.total.toFixed(2)}</div>
                        <div className={`text-xs px-2 py-1 rounded-full border ${
                          order.status === 'Completed' 
                            ? 'bg-green-500/[0.1] text-green-400 border-green-500/20' 
                            : order.status === 'Unpaid'
                            ? 'bg-yellow-500/[0.1] text-yellow-400 border-yellow-500/20'
                            : 'bg-blue-500/[0.1] text-blue-400 border-blue-500/20'
                        }`}>
                          {order.status}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart size={32} className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/40 text-sm mb-4">No orders yet</p>
                  <button
                    onClick={() => onNavigate('terminal')}
                    className="glass-button px-4 py-2 text-sm font-medium"
                  >
                    Create First Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;