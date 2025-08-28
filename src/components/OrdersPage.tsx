import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, Edit, Trash2, Plus, Minus, X, AlertTriangle } from 'lucide-react';
import type { Order, Client, Product, OrderItem } from '../types';
import { ErrorHandler } from '../lib/errorHandling';

interface OrdersPageProps {
  orders: Order[];
  setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void;
  clients: Client[];
  products: Product[];
  onNavigate?: (page: string) => void;
}

const OrdersPage: React.FC<OrdersPageProps> = ({ orders, setOrders, clients, products, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Unpaid' | 'Completed'>('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editFormData, setEditFormData] = useState<{
    clientId: string;
    clientName: string;
    items: OrderItem[];
    notes: string;
    shipping: number;
    discount: number;
    amountPaid: number;
  }>({
    clientId: '',
    clientName: '',
    items: [],
    notes: '',
    shipping: 0,
    discount: 0,
    amountPaid: 0
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [repairedOrders, setRepairedOrders] = useState<Order[]>([]);
  const [showLegacyWarning, setShowLegacyWarning] = useState(false);

  // Repair orders on component mount and when orders change
  useEffect(() => {
    try {
      const repaired = orders.map(order => ErrorHandler.repairOrder(order));
      setRepairedOrders(repaired);
      
      // Check if any orders needed repair
      const hasLegacyOrders = repaired.some(order => 
        order.items.some(item => item.categoryName === 'Legacy')
      );
      setShowLegacyWarning(hasLegacyOrders);
    } catch (error) {
      ErrorHandler.logError('OrdersPage.useEffect', error);
      setRepairedOrders(orders);
    }
  }, [orders]);

  const filteredOrders = repairedOrders.filter(order => {
    const matchesSearch = order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const markOrderAsPaid = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { 
        ...order, 
        status: 'Completed',
        amountPaid: order.total
      } : order
    ));
  };

  const deleteOrder = (orderId: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      setOrders(prev => prev.filter(order => order.id !== orderId));
    }
  };

  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, ...updates } : order
    ));
  };

  const handleEditOrder = (order: Order) => {
    try {
      // Repair the order before editing
      const repairedOrder = ErrorHandler.repairOrder(order);
      setEditingOrder(repairedOrder);
      setEditFormData({
        clientId: repairedOrder.clientId,
        clientName: repairedOrder.clientName,
        items: [...repairedOrder.items],
        notes: repairedOrder.notes || '',
        shipping: repairedOrder.shipping || 0,
        discount: repairedOrder.discount || 0,
        amountPaid: repairedOrder.amountPaid || 0
      });
    } catch (error) {
      ErrorHandler.logError('handleEditOrder', error, { orderId: order.id });
      // Fallback to original order if repair fails
      setEditingOrder(order);
      setEditFormData({
        clientId: order.clientId,
        clientName: order.clientName,
        items: [...order.items],
        notes: order.notes || '',
        shipping: order.shipping || 0,
        discount: order.discount || 0,
        amountPaid: order.amountPaid || 0
      });
    }
  };

  const updateEditFormData = (field: string, value: any) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...editFormData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate price if quantity changes
    if (field === 'quantity') {
      const pricePerUnit = updatedItems[index].price / (updatedItems[index].quantity || 1);
      updatedItems[index].price = pricePerUnit * value;
    }
    
    setEditFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const removeOrderItem = (index: number) => {
    const updatedItems = editFormData.items.filter((_, i) => i !== index);
    setEditFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const calculateOrderTotal = () => {
    const itemsTotal = editFormData.items.reduce((sum, item) => sum + item.price, 0);
    return itemsTotal + editFormData.shipping - editFormData.discount;
  };

  const saveOrderEdit = () => {
    if (!editingOrder) return;
    
    try {
      // Validate order items before saving
      const itemValidation = editFormData.items.map((item, index) => ({
        index,
        validation: ErrorHandler.validateOrderItem(item)
      })).filter(result => !result.validation.isValid);

      if (itemValidation.length > 0) {
        const errorMessages = itemValidation.map(result => 
          `Item ${result.index + 1}: ${result.validation.errors.join(', ')}`
        ).join('\n');
        alert(`Please fix the following errors:\n${errorMessages}`);
        return;
      }

      const total = calculateOrderTotal();
      const newStatus = editFormData.amountPaid >= total ? 'Completed' : 'Unpaid';
      
      updateOrder(editingOrder.id, {
        clientId: editFormData.clientId,
        clientName: editFormData.clientName,
        items: editFormData.items,
        total,
        notes: editFormData.notes,
        shipping: editFormData.shipping,
        discount: editFormData.discount,
        amountPaid: editFormData.amountPaid,
        status: newStatus
      });
      
      setEditingOrder(null);
    } catch (error) {
      ErrorHandler.logError('saveOrderEdit', error, { orderId: editingOrder.id });
      alert('Failed to save order changes. Please try again.');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/[0.1] text-green-400 border-green-500/20';
      case 'Unpaid': return 'bg-yellow-500/[0.1] text-yellow-400 border-yellow-500/20';
      default: return 'bg-white/[0.05] text-white/60 border-white/10';
    }
  };

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-semibold gradient-text mb-2">Orders</h1>
            <p className="text-white/50 text-sm">Manage and track all customer orders</p>
          </div>
        </div>

        {/* Legacy Warning */}
        {showLegacyWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-yellow-400 font-medium text-sm">Legacy Orders Detected</div>
                <div className="text-white/80 text-sm">
                  Some orders contain products that don't match the current category structure. 
                  They are marked as "Legacy" and displayed with limited information.
                </div>
              </div>
              <button
                onClick={() => setShowLegacyWarning(false)}
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Search, Filters and New Order Button */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <div className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group bg-white/[0.08] text-white border border-white/[0.12]" style={{boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)'}}>
              <Search size={18} className="text-white" />
              <input
                type="text"
                placeholder="Search orders"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 font-medium text-sm"
              />
            </div>
          </div>
          
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="glass-input pl-10 pr-8 appearance-none min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <button
            onClick={() => onNavigate?.('terminal')}
            className="glass-button px-6 py-3.5 flex items-center gap-2 font-medium"
          >
            <Plus size={18} />
            New Order
          </button>
        </div>

        {/* Orders List */}
        <div className="glass-panel overflow-hidden">
          {filteredOrders.length > 0 ? (
            <div className="divide-y divide-white/[0.05]">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="p-6 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-medium">{order.clientName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="text-white/40 text-xs mb-2">
                        Order #{order.id.slice(-8)} • {new Date(order.date).toLocaleDateString()} • {order.items.length} items
                      </div>
                      
                      <div className="text-white/60 text-sm">
                        {order.items.slice(0, 3).map((item, i) => {
                          const displayName = ErrorHandler.withErrorBoundary(
                            () => {
                              if (item.categoryName && item.productTypeName) {
                                if (item.categoryName === 'Legacy') {
                                  return `${item.productName} (Legacy)`;
                                }
                                return `${item.categoryName} > ${item.productTypeName}`;
                              }
                              return item.productName;
                            },
                            item.productName,
                            'OrdersPage.displayName'
                          );

                          return (
                            <span key={i} className={item.categoryName === 'Legacy' ? 'text-yellow-400/80' : ''}>
                              {displayName}
                              {item.type && item.type !== item.productName && ` (${item.type})`}
                              {i < Math.min(order.items.length, 3) - 1 && ', '}
                            </span>
                          );
                        })}
                        {order.items.length > 3 && (
                          <span className="text-white/40"> +{order.items.length - 3} more</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-white font-semibold">${order.total.toFixed(2)}</div>
                        {order.amountPaid && order.amountPaid < order.total && (
                          <div className="text-yellow-400 text-xs">
                            Paid: ${order.amountPaid.toFixed(2)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="glass-button p-2"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="glass-button p-2"
                          title="Edit Order"
                        >
                          <Edit size={14} />
                        </button>
                        
                        {order.status === 'Unpaid' && (
                          <button
                            onClick={() => markOrderAsPaid(order.id)}
                            className="glass-button px-3 py-2 text-xs font-medium bg-green-500/[0.1] text-green-400 border-green-500/20 hover:bg-green-500/[0.15]"
                            title="Mark as Paid"
                          >
                            Mark as Paid
                          </button>
                        )}

                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="glass-button p-2 text-white/60 hover:text-white"
                          title="Delete Order"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-white/20 mb-4">
                <Plus size={48} className="mx-auto" />
              </div>
              <h3 className="text-white font-medium mb-2">No orders found</h3>
              <p className="text-white/40 text-sm mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start by creating your first order in the terminal'
                }
              </p>
            </div>
          )}
        </div>

        {/* Edit Order Modal */}
        {editingOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ease: [0.25, 0.46, 0.45, 0.94] }}
              className="glass-panel p-6 w-full max-w-4xl max-h-[90vh] overflow-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Edit Order</h2>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="text-white/60 hover:text-white transition-colors text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Client Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/40 text-xs mb-2 block">Client</label>
                    <select
                      value={editFormData.clientId}
                      onChange={(e) => {
                        const selectedClient = clients.find(c => c.id === e.target.value);
                        updateEditFormData('clientId', e.target.value);
                        updateEditFormData('clientName', selectedClient?.name || '');
                      }}
                      className="glass-input w-full"
                    >
                      <option value="">Select Client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs mb-2 block">Order Date</label>
                    <div className="text-white text-sm py-2">{new Date(editingOrder.date).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <label className="text-white/40 text-xs mb-3 block">Order Items</label>
                  <div className="space-y-3">
                    {editFormData.items.map((item, index) => (
                      <div key={index} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-white/40 text-xs">Category</label>
                              <input
                                type="text"
                                value={item.categoryName || ''}
                                onChange={(e) => updateOrderItem(index, 'categoryName', e.target.value)}
                                className="glass-input w-full text-sm"
                                placeholder="Product category"
                              />
                            </div>
                            <div>
                              <label className="text-white/40 text-xs">Product Type</label>
                              <input
                                type="text"
                                value={item.productTypeName || ''}
                                onChange={(e) => updateOrderItem(index, 'productTypeName', e.target.value)}
                                className="glass-input w-full text-sm"
                                placeholder="Product type"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-3">
                              <label className="text-white/40 text-xs">Product Name</label>
                              <input
                                type="text"
                                value={item.productName}
                                onChange={(e) => updateOrderItem(index, 'productName', e.target.value)}
                                className="glass-input w-full text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-white/40 text-xs">Type</label>
                              <input
                                type="text"
                                value={item.type || ''}
                                onChange={(e) => updateOrderItem(index, 'type', e.target.value)}
                                className="glass-input w-full text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-white/40 text-xs">Size</label>
                              <input
                                type="text"
                                value={item.size.toString()}
                                onChange={(e) => updateOrderItem(index, 'size', e.target.value)}
                                className="glass-input w-full text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-white/40 text-xs">Quantity</label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="glass-input w-full text-sm"
                                min="1"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-white/40 text-xs">Price</label>
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => updateOrderItem(index, 'price', parseFloat(e.target.value) || 0)}
                                className="glass-input w-full text-sm"
                                step="0.01"
                                min="0"
                              />
                            </div>
                            <div className="col-span-1 flex justify-center">
                            <button
                              onClick={() => removeOrderItem(index)}
                              className="glass-button p-2 text-white/60 hover:text-white"
                              title="Remove Item"
                            >
                              <X size={14} />
                            </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-white/40 text-xs mb-2 block">Shipping</label>
                    <input
                      type="number"
                      value={editFormData.shipping}
                      onChange={(e) => updateEditFormData('shipping', parseFloat(e.target.value) || 0)}
                      className="glass-input w-full"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs mb-2 block">Discount</label>
                    <input
                      type="number"
                      value={editFormData.discount}
                      onChange={(e) => updateEditFormData('discount', parseFloat(e.target.value) || 0)}
                      className="glass-input w-full"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs mb-2 block">Amount Paid</label>
                    <input
                      type="number"
                      value={editFormData.amountPaid}
                      onChange={(e) => updateEditFormData('amountPaid', parseFloat(e.target.value) || 0)}
                      className="glass-input w-full"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-white/40 text-xs mb-2 block">Notes</label>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => updateEditFormData('notes', e.target.value)}
                    className="glass-input w-full h-20 resize-none"
                    placeholder="Order notes..."
                  />
                </div>

                {/* Order Total */}
                <div className="border-t border-white/[0.08] pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold text-white">
                    <span>New Total:</span>
                    <span>${calculateOrderTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-white/70 mt-1">
                    <span>Balance Due:</span>
                    <span className={calculateOrderTotal() - editFormData.amountPaid <= 0 ? 'text-green-400' : 'text-yellow-400'}>
                      ${Math.max(0, calculateOrderTotal() - editFormData.amountPaid).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingOrder(null)}
                    className="flex-1 glass-button py-3 px-4 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveOrderEdit}
                    className="flex-1 glass-button py-3 px-4 font-medium bg-white/[0.08] border-white/[0.15]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ease: [0.25, 0.46, 0.45, 0.94] }}
              className="glass-panel p-6 w-full max-w-2xl max-h-[80vh] overflow-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-white/60 hover:text-white transition-colors text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/40 text-xs">Client</label>
                    <div className="text-white font-medium">{selectedOrder.clientName}</div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs">Status</label>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs">Order Date</label>
                    <div className="text-white text-sm">{new Date(selectedOrder.date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs">Order ID</label>
                    <div className="text-white font-mono text-xs">{selectedOrder.id}</div>
                  </div>
                </div>

                <div>
                  <label className="text-white/40 text-xs mb-3 block">Items</label>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => {
                      const isLegacy = item.categoryName === 'Legacy';
                      const displayName = ErrorHandler.withErrorBoundary(
                        () => ErrorHandler.createFallbackDisplayName(item),
                        item.productName,
                        'OrderDetails.displayName'
                      );

                      return (
                        <div key={index} className={`bg-white/[0.02] rounded-xl p-4 flex justify-between items-center border ${
                          isLegacy ? 'border-yellow-500/20' : 'border-white/[0.04]'
                        }`}>
                          <div>
                            <div className={`font-medium text-sm flex items-center gap-2 ${
                              isLegacy ? 'text-yellow-400' : 'text-white'
                            }`}>
                              {item.categoryName && item.productTypeName 
                                ? `${item.categoryName} > ${item.productTypeName}`
                                : item.productName}
                              {isLegacy && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                                  Legacy
                                </span>
                              )}
                            </div>
                            <div className="text-white/40 text-xs">
                              {item.type && item.type !== item.productName && `${item.type} - `}
                              {typeof item.size === 'string' ? item.size : `${item.size}${item.unit} (Custom)`}
                              {' × ' + item.quantity}
                            </div>
                            {isLegacy && (
                              <div className="text-yellow-400/60 text-xs mt-1">
                                This item uses the legacy product structure
                              </div>
                            )}
                          </div>
                          <div className="text-white font-medium text-sm">${item.price.toFixed(2)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-white/[0.08] pt-4 space-y-2">
                  <div className="flex justify-between items-center text-lg font-semibold text-white">
                    <span>Total:</span>
                    <span>${selectedOrder.total.toFixed(2)}</span>
                  </div>
                  {selectedOrder.amountPaid !== undefined && selectedOrder.amountPaid > 0 && (
                    <>
                      <div className="flex justify-between items-center text-sm text-white/70">
                        <span>Amount Paid:</span>
                        <span>${selectedOrder.amountPaid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className={selectedOrder.amountPaid >= selectedOrder.total ? 'text-green-400' : 'text-yellow-400'}>
                          {selectedOrder.amountPaid >= selectedOrder.total ? 'Fully Paid' : 'Balance Due:'}
                        </span>
                        {selectedOrder.amountPaid < selectedOrder.total && (
                          <span className="text-yellow-400">${(selectedOrder.total - selectedOrder.amountPaid).toFixed(2)}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {selectedOrder.notes && (
                  <div>
                    <label className="text-white/40 text-xs mb-2 block">Notes</label>
                    <div className="bg-white/[0.02] rounded-xl p-4 text-white text-sm border border-white/[0.04]">{selectedOrder.notes}</div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;