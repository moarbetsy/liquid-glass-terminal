import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  Target,
  Calendar,
  Award,
  BarChart3
} from 'lucide-react';
import type { Order, Client, Product } from '../types';

interface StatisticsPageProps {
  orders: Order[];
  clients: Client[];
  products: Product[];
}

const StatisticsPage: React.FC<StatisticsPageProps> = ({ orders, clients, products }) => {
  const stats = useMemo(() => {
    // Basic calculations
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const completedOrders = orders.filter(order => order.status === 'Completed');
    const completedRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    const pendingRevenue = totalRevenue - completedRevenue;
    
    // Stock value calculations
    const totalStockValue = products.reduce((sum, product) => {
      return sum + (product.price * product.stock);
    }, 0);
    
    const totalStockCost = products.reduce((sum, product) => {
      if (!product.cost) return sum;
      const costStr = product.cost.split('/')[0];
      const cost = parseFloat(costStr) || 0;
      return sum + (cost * product.stock);
    }, 0);
    
    const potentialProfit = totalStockValue - totalStockCost;
    
    // Product performance
    const productSales = new Map();
    orders.forEach(order => {
      order.items.forEach(item => {
        const current = productSales.get(item.productName) || { quantity: 0, revenue: 0, orders: 0 };
        productSales.set(item.productName, {
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + (item.price * item.quantity),
          orders: current.orders + 1
        });
      });
    });
    
    const bestSellingProducts = Array.from(productSales.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5);
    
    // Client performance
    const clientStats = clients
      .filter(client => client.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
    
    // Time-based analysis
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const last30DaysOrders = orders.filter(order => new Date(order.date) >= thirtyDaysAgo);
    const last7DaysOrders = orders.filter(order => new Date(order.date) >= sevenDaysAgo);
    
    const last30DaysRevenue = last30DaysOrders.reduce((sum, order) => sum + order.total, 0);
    const last7DaysRevenue = last7DaysOrders.reduce((sum, order) => sum + order.total, 0);
    
    // Average order value
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    
    // Stock status
    const outOfStockProducts = products.filter(p => p.stock === 0).length;
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 10).length;
    const wellStockedProducts = products.filter(p => p.stock >= 10).length;
    
    return {
      totalRevenue,
      completedRevenue,
      pendingRevenue,
      totalStockValue,
      totalStockCost,
      potentialProfit,
      bestSellingProducts,
      clientStats,
      last30DaysRevenue,
      last7DaysRevenue,
      last30DaysOrders,
      last7DaysOrders,
      avgOrderValue,
      outOfStockProducts,
      lowStockProducts,
      wellStockedProducts,
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      pendingOrders: orders.length - completedOrders.length,
      totalClients: clients.length,
      activeClients: clients.filter(c => c.totalSpent > 0).length,
      totalProducts: products.length
    };
  }, [orders, clients, products]);

  const revenueMetrics = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      subtitle: 'All time',
      icon: <DollarSign size={24} />
    },
    {
      title: 'Completed Revenue',
      value: `$${stats.completedRevenue.toFixed(2)}`,
      subtitle: `${stats.completedOrders} completed orders`,
      icon: <Target size={24} />
    },
    {
      title: 'Pending Revenue',
      value: `$${stats.pendingRevenue.toFixed(2)}`,
      subtitle: `${stats.pendingOrders} pending orders`,
      icon: <Calendar size={24} />
    },
    {
      title: 'Avg Order Value',
      value: `$${stats.avgOrderValue.toFixed(2)}`,
      subtitle: 'Per order',
      icon: <BarChart3 size={24} />
    }
  ];

  const stockMetrics = [
    {
      title: 'Stock Value',
      value: `$${stats.totalStockValue.toFixed(2)}`,
      subtitle: 'At selling price',
      icon: <Package size={24} />
    },
    {
      title: 'Stock Cost',
      value: `$${stats.totalStockCost.toFixed(2)}`,
      subtitle: 'At cost price',
      icon: <DollarSign size={24} />
    },
    {
      title: 'Potential Profit',
      value: `$${stats.potentialProfit.toFixed(2)}`,
      subtitle: 'If all stock sold',
      icon: <TrendingUp size={24} />
    },
    {
      title: 'Stock Status',
      value: `${stats.wellStockedProducts}/${stats.totalProducts}`,
      subtitle: `${stats.outOfStockProducts} out, ${stats.lowStockProducts} low`,
      icon: <Package size={24} />
    }
  ];

  const performanceMetrics = [
    {
      title: 'Last 7 Days',
      value: `$${stats.last7DaysRevenue.toFixed(2)}`,
      subtitle: `${stats.last7DaysOrders.length} orders`,
      icon: <Calendar size={24} />
    },
    {
      title: 'Last 30 Days',
      value: `$${stats.last30DaysRevenue.toFixed(2)}`,
      subtitle: `${stats.last30DaysOrders.length} orders`,
      icon: <Calendar size={24} />
    },
    {
      title: 'Daily Average',
      value: `$${(stats.last30DaysRevenue / 30).toFixed(2)}`,
      subtitle: 'Based on last 30 days',
      icon: <BarChart3 size={24} />
    }
  ];

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold gradient-text mb-2">Business Statistics</h1>
          <p className="text-white/50 text-sm">Comprehensive analytics and insights for your business</p>
        </div>

        {/* Revenue Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Revenue Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {revenueMetrics.map((metric, index) => (
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
        </div>

        {/* Stock & Inventory */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Stock & Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stockMetrics.map((metric, index) => (
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
        </div>

        {/* Recent Performance */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {performanceMetrics.map((metric, index) => (
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Best Selling Products */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Best Selling Products</h2>
            <div className="glass-panel p-6">
              {stats.bestSellingProducts.length > 0 ? (
                <div className="space-y-3">
                  {stats.bestSellingProducts.map(([productName, data], index) => (
                    <motion.div
                      key={productName}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/[0.06] border border-white/[0.08] rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{productName}</div>
                          <div className="text-white/40 text-xs">{data.quantity} units sold</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium text-sm">${data.revenue.toFixed(2)}</div>
                        <div className="text-white/40 text-xs">{data.orders} orders</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award size={32} className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/40 text-sm">No sales data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Clients */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Top Clients</h2>
            <div className="glass-panel p-6">
              {stats.clientStats.length > 0 ? (
                <div className="space-y-3">
                  {stats.clientStats.map((client, index) => (
                    <motion.div
                      key={client.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/[0.06] border border-white/[0.08] rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{client.name}</div>
                          <div className="text-white/40 text-xs">{client.orders} orders</div>
                        </div>
                      </div>
                      <div className="text-white font-medium text-sm">
                        ${client.totalSpent.toFixed(2)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users size={32} className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/40 text-sm">No client data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;