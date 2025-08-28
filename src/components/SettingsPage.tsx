import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Download, Upload, Trash2, RefreshCw } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const exportData = () => {
    const data = {
      clients: JSON.parse(localStorage.getItem('clients') || '[]'),
      products: JSON.parse(localStorage.getItem('products') || '[]'),
      orders: JSON.parse(localStorage.getItem('orders') || '[]'),
      cart: JSON.parse(localStorage.getItem('cart') || '[]'),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.clients) localStorage.setItem('clients', JSON.stringify(data.clients));
        if (data.products) localStorage.setItem('products', JSON.stringify(data.products));
        if (data.orders) localStorage.setItem('orders', JSON.stringify(data.orders));
        if (data.cart) localStorage.setItem('cart', JSON.stringify(data.cart));
        
        alert('Data imported successfully! Please refresh the page to see changes.');
      } catch (error) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    localStorage.removeItem('clients');
    localStorage.removeItem('products');
    localStorage.removeItem('orders');
    localStorage.removeItem('cart');
    setShowClearConfirm(false);
    alert('All data cleared! Please refresh the page.');
  };

  const getStorageSize = () => {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length;
      }
    }
    return (total / 1024).toFixed(2); // KB
  };

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-white/70">Manage your application settings and data</p>
        </div>

        <div className="space-y-8">
          {/* Data Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Settings size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Data Management</h2>
                <p className="text-white/70">Export, import, or clear your business data</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Data */}
              <div className="bg-white/5 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Download size={20} className="text-green-400" />
                  <h3 className="text-white font-semibold">Export Data</h3>
                </div>
                <p className="text-white/70 text-sm mb-4">
                  Download all your business data as a JSON file for backup or transfer.
                </p>
                <button
                  onClick={exportData}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors"
                >
                  Export All Data
                </button>
              </div>

              {/* Import Data */}
              <div className="bg-white/5 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Upload size={20} className="text-blue-400" />
                  <h3 className="text-white font-semibold">Import Data</h3>
                </div>
                <p className="text-white/70 text-sm mb-4">
                  Upload a previously exported JSON file to restore your data.
                </p>
                <label className="block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                  <div className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors cursor-pointer text-center">
                    Choose File to Import
                  </div>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Storage Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Storage Information</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {JSON.parse(localStorage.getItem('clients') || '[]').length}
                </div>
                <div className="text-white/60 text-sm">Clients</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {JSON.parse(localStorage.getItem('products') || '[]').length}
                </div>
                <div className="text-white/60 text-sm">Products</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {JSON.parse(localStorage.getItem('orders') || '[]').length}
                </div>
                <div className="text-white/60 text-sm">Orders</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {getStorageSize()} KB
                </div>
                <div className="text-white/60 text-sm">Storage Used</div>
              </div>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-600 rounded-xl">
                <Trash2 size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Danger Zone</h2>
                <p className="text-red-300">Irreversible actions that will permanently delete your data</p>
              </div>
            </div>

            <div className="bg-red-500/10 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-2">Clear All Data</h3>
              <p className="text-red-300 text-sm mb-4">
                This will permanently delete all clients, products, orders, and cart data. This action cannot be undone.
              </p>
              
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg transition-colors"
                >
                  Clear All Data
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-white font-semibold">Are you absolutely sure?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={clearAllData}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Yes, Delete Everything
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Application Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Application Information</h2>
            
            <div className="space-y-4 text-white/70">
              <div className="flex justify-between">
                <span>Version:</span>
                <span className="text-white">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Build:</span>
                <span className="text-white">Production</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="text-white">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;