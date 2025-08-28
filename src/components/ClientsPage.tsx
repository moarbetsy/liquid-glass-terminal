import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, Phone, MapPin, FileText, Users } from 'lucide-react';
import type { Client, Order } from '../types';

interface ClientsPageProps {
  clients: Client[];
  setClients: (clients: Client[] | ((prev: Client[]) => Client[])) => void;
  orders: Order[];
}

const ClientsPage: React.FC<ClientsPageProps> = ({ clients, setClients, orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClientOrders = (clientId: string) => {
    return orders.filter(order => order.clientId === clientId);
  };

  const getClientStats = (clientId: string) => {
    const clientOrders = getClientOrders(clientId);
    const totalSpent = clientOrders.reduce((sum, order) => sum + order.total, 0);
    return {
      orderCount: clientOrders.length,
      totalSpent,
      lastOrderDate: clientOrders.length > 0 
        ? new Date(Math.max(...clientOrders.map(o => new Date(o.date).getTime())))
        : null
    };
  };

  const deleteClient = (clientId: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      setClients(prev => prev.filter(client => client.id !== clientId));
    }
  };

  const ClientForm: React.FC<{ 
    client?: Client; 
    onSave: (client: Client) => void; 
    onCancel: () => void; 
  }> = ({ client, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      name: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      address: client?.address || '',
      notes: client?.notes || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name.trim()) return;

      const newClient: Client = {
        id: client?.id || `client-${Date.now()}`,
        displayId: client?.displayId || Math.max(...clients.map(c => c.displayId), 0) + 1,
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        orders: client?.orders || 0,
        totalSpent: client?.totalSpent || 0
      };

      onSave(newClient);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-md"
        >
          <h2 className="text-2xl font-bold text-white mb-6">
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50"
                placeholder="Client name"
                required
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50"
                placeholder="client@example.com"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50"
                placeholder="123 Main St, City"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 h-24 resize-none"
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
              >
                {client ? 'Update' : 'Add'} Client
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-semibold gradient-text mb-2">Clients</h1>
            <p className="text-white/50 text-sm">Manage your customer database</p>
          </div>
        </div>

        {/* Search and Add Button */}
        <div className="mb-8 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group bg-white/[0.08] text-white border border-white/[0.12]" style={{boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)'}}>
              <Search size={18} className="text-white" />
              <input
                type="text"
                placeholder="Search clients"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 font-medium text-sm"
              />
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="glass-button px-6 py-3.5 flex items-center gap-2 font-medium"
          >
            <Plus size={18} />
            Add Client
          </button>
        </div>

        {/* Clients List */}
        <div className="glass-panel overflow-hidden">
          {filteredClients.length > 0 ? (
            <div className="divide-y divide-white/[0.05]">
              {filteredClients.map((client, index) => {
                const stats = getClientStats(client.id);
                
                return (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="p-6 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-medium">{client.name}</h3>
                          <span className="px-2 py-1 rounded-full text-xs font-medium border bg-white/[0.05] text-white/60 border-white/10">
                            ID: {client.displayId}
                          </span>
                        </div>
                        
                        <div className="text-white/40 text-xs mb-2">
                          {client.phone && `Phone: ${client.phone}`}
                          {client.phone && client.address && ' • '}
                          {client.address && `Address: ${client.address}`}
                        </div>
                        
                        {client.notes && (
                          <div className="text-white/60 text-sm">
                            Notes: {client.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-white font-semibold">${stats.totalSpent.toFixed(2)}</div>
                          <div className="text-white/40 text-xs">{stats.orderCount} orders</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingClient(client)}
                            className="glass-button p-2"
                            title="Edit Client"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => deleteClient(client.id)}
                            className="glass-button p-2 text-white/60 hover:text-white"
                            title="Delete Client"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-white/20 mb-4">
                <Users size={48} className="mx-auto" />
              </div>
              <h3 className="text-white font-medium mb-2">No clients found</h3>
              <p className="text-white/40 text-sm mb-6">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Start by adding your first client'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="glass-button px-6 py-3 font-medium"
                >
                  Add First Client
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add Client Modal */}
        {showAddModal && (
          <ClientForm
            onSave={(client) => {
              setClients(prev => [...prev, client]);
              setShowAddModal(false);
            }}
            onCancel={() => setShowAddModal(false)}
          />
        )}

        {/* Edit Client Modal */}
        {editingClient && (
          <ClientForm
            client={editingClient}
            onSave={(updatedClient) => {
              setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
              setEditingClient(null);
            }}
            onCancel={() => setEditingClient(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ClientsPage;