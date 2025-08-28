import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Package, Minus } from 'lucide-react';
import type { Product } from '../types';
import { PRODUCT_CONFIG } from '../lib/productConfig';


interface ProductsPageProps {
  products: Product[];
  setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void;
}

interface ProductItem {
  productName: string;
  typeName?: string;
  sizes: { [size: string]: number };
  allowCustom?: string;
  stock: number;
}

const ProductsPage: React.FC<ProductsPageProps> = ({ products, setProducts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Helper function to get display name - now just returns the abbreviated code
  const getProductDisplayInfo = (productName: string) => {
    return {
      displayName: productName,
      originalName: productName,
      hasOriginalName: false // Never show original names
    };
  };

  // Convert PRODUCT_CONFIG to flat list of products for management, merging with existing product stock data
  const getProducts = (): ProductItem[] => {
    const productItems: ProductItem[] = [];

    Object.entries(PRODUCT_CONFIG).forEach(([productName, productData]) => {
      if (productData.sizes) {
        // Find existing product data for stock information
        const existingProduct = products.find(p => p.name === productName);

        productItems.push({
          productName,
          sizes: productData.sizes,
          allowCustom: productData.allowCustom,
          stock: existingProduct?.stock || 0
        });
      }
    });

    return productItems;
  };

  const productItems = getProducts();

  const filteredProducts = productItems.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    
    return (
      product.productName.toLowerCase().includes(searchLower) ||
      (product.typeName && product.typeName.toLowerCase().includes(searchLower))
    );
  });



  const getStockStatus = (stock: number) => {
    if (stock === 0) return { status: 'out', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (stock < 10) return { status: 'low', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { status: 'good', color: 'text-green-400', bg: 'bg-green-500/20' };
  };

  const updateStock = (productItem: ProductItem, newStock: number, cost?: number) => {
    const updatedStock = Math.max(0, newStock);

    setProducts(prevProducts => {
      // Find existing product or create new one
      const existingIndex = prevProducts.findIndex(p => p.name === productItem.productName);

      if (existingIndex >= 0) {
        // Update existing product with weighted average cost calculation
        const updated = [...prevProducts];
        const existingProduct = updated[existingIndex];
        const currentStock = existingProduct.stock;
        const currentCost = existingProduct.cost ? parseFloat(existingProduct.cost) : 0;
        
        let newAverageCost = currentCost;
        
        // Calculate weighted average cost when adding stock
        if (cost !== undefined && updatedStock > currentStock) {
          const addedQuantity = updatedStock - currentStock;
          const totalValue = (currentStock * currentCost) + (addedQuantity * cost);
          const totalQuantity = updatedStock;
          newAverageCost = totalQuantity > 0 ? totalValue / totalQuantity : cost;
        }
        
        updated[existingIndex] = { 
          ...existingProduct, 
          stock: updatedStock,
          cost: cost !== undefined ? newAverageCost.toString() : existingProduct.cost
        };
        return updated;
      } else {
        // Create new product entry
        const newProduct: Product = {
          id: `product-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          name: productItem.productName,
          type: productItem.allowCustom === 'g' ? 'g' : productItem.allowCustom === 'ml' ? 'ml' : 'unit',
          stock: updatedStock,
          price: Math.min(...Object.values(productItem.sizes)), // Use minimum price as base price
          cost: cost !== undefined ? cost.toString() : undefined
        };
        return [...prevProducts, newProduct];
      }
    });
  };

  const ProductRow: React.FC<{ product: ProductItem; index: number }> = ({ product, index }) => {
    // Get current stock from products state
    const currentProduct = products.find(p => p.name === product.productName);
    const currentStock = currentProduct?.stock || 0;
    const stockStatus = getStockStatus(currentStock);
    const productInfo = getProductDisplayInfo(product.productName);
    const displayName = product.typeName ? `${productInfo.displayName} - ${product.typeName}` : productInfo.displayName;
    // Get the price per unit based on the product's unit type
    const getPricePerUnit = () => {
      if (product.allowCustom) {
        // For products with custom units (g, ml), find the 1 unit price
        const baseUnitKey = `1${product.allowCustom}`;
        if (product.sizes[baseUnitKey]) {
          return product.sizes[baseUnitKey].toFixed(2);
        }

        // If no 1g/1ml option, calculate from the smallest available size
        const smallestSizeEntry = Object.entries(product.sizes).reduce((smallest, [size, price]) => {
          const numericSize = parseFloat(size.replace(/[^\d.]/g, ''));
          if (!isNaN(numericSize) && numericSize > 0) {
            if (!smallest || numericSize < smallest.numericSize) {
              return { size, price, numericSize };
            }
          }
          return smallest;
        }, null as any);

        if (smallestSizeEntry) {
          const pricePerUnit = smallestSizeEntry.price / smallestSizeEntry.numericSize;
          return pricePerUnit.toFixed(2);
        }

        return '0.00';
      }

      // For unit-based products, return the unit price
      const prices = Object.values(product.sizes) as number[];
      return Math.min(...prices).toFixed(2);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="p-6 hover:bg-white/[0.02] transition-colors border-l-4 border-l-transparent hover:border-l-blue-500/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <h4 className="text-white font-medium">{displayName}</h4>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${stockStatus.bg} ${stockStatus.color} border-opacity-20`}>
                {currentStock} in stock
              </span>
            </div>




          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-white font-semibold">
                ${getPricePerUnit()}
              </div>
              <div className="text-white/40 text-xs">
                {product.allowCustom ? `Price/${product.allowCustom}` : 'Price/unit'}
              </div>
              {currentProduct?.cost && (
                <div className="text-white/60 text-xs mt-1">
                  Cost: ${parseFloat(currentProduct.cost).toFixed(2)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateStock(product, currentStock - 1)}
                  className="glass-button p-2 text-white/60 hover:text-white"
                  disabled={currentStock === 0}
                  title="Decrease Stock"
                >
                  <Minus size={14} />
                </button>
                <span className={`font-medium px-3 py-1 rounded-lg ${stockStatus.bg} ${stockStatus.color} text-sm`}>
                  {currentStock}
                </span>
                <button
                  onClick={() => setEditingProduct(product)}
                  className="glass-button p-2 text-white/60 hover:text-white"
                  title="Add Stock (with cost tracking)"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                onClick={() => setEditingProduct(product)}
                className="glass-button p-2"
                title="Edit Product"
              >
                <Edit size={14} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Enhanced Stock Edit Modal with cost tracking
  const StockEditModal: React.FC<{
    product: ProductItem;
    onSave: (stock: number, cost?: number) => void;
    onCancel: () => void;
  }> = ({ product, onSave, onCancel }) => {
    const currentProduct = products.find(p => p.name === product.productName);
    const [stock, setStock] = useState(currentProduct?.stock || 0);
    const [cost, setCost] = useState('');
    const [isAddingStock, setIsAddingStock] = useState(false);

    const unitDisplay = product.allowCustom || 'units';
    const currentStock = currentProduct?.stock || 0;
    const previousCost = currentProduct?.cost ? parseFloat(currentProduct.cost) : null;
    const isFirstTimeStock = !currentProduct || currentProduct.stock === 0;
    const stockDifference = stock - currentStock;

    // Auto-suggest previous cost when adding stock
    React.useEffect(() => {
      if (stockDifference > 0 && previousCost && !cost) {
        setCost(previousCost.toString());
      }
    }, [stockDifference, previousCost, cost]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validate cost input for stock additions
      if (stockDifference > 0) {
        if (!cost || parseFloat(cost) <= 0) {
          alert('Cost per unit is required when adding stock');
          return;
        }
      }

      const costValue = cost ? parseFloat(cost) : undefined;
      onSave(stock, costValue);
    };

    const handleStockChange = (newStock: number) => {
      setStock(newStock);
      const difference = newStock - currentStock;
      setIsAddingStock(difference > 0);
      
      // Clear cost if reducing stock
      if (difference <= 0) {
        setCost('');
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-md"
        >
          <h2 className="text-2xl font-bold text-white mb-6">
            Update Stock: {product.productName}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <div className="text-white/70 text-sm mb-2">Current Stock</div>
              <div className="text-3xl font-bold text-white mb-2">
                {currentStock} {unitDisplay}
              </div>
              {previousCost && (
                <div className="text-white/50 text-sm">
                  Last cost: ${previousCost.toFixed(2)}/{unitDisplay}
                </div>
              )}
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">
                New Stock Amount ({unitDisplay})
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => handleStockChange(parseInt(e.target.value) || 0)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 text-center text-xl"
                placeholder="0"
                min="0"
                autoFocus
              />
              {stockDifference !== 0 && (
                <div className={`text-center mt-2 text-sm ${stockDifference > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stockDifference > 0 ? '+' : ''}{stockDifference} {unitDisplay}
                </div>
              )}
            </div>

            {/* Cost input - shown when adding stock */}
            {isAddingStock && (
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Cost per {unitDisplay} *
                  {previousCost && (
                    <span className="text-white/50 ml-2">
                      (Previous: ${previousCost.toFixed(2)})
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-8 pr-4 py-3 text-white placeholder-white/50"
                    placeholder="0.00"
                    min="0"
                    required={isAddingStock}
                  />
                </div>
                <div className="text-white/50 text-xs mt-2">
                  {isFirstTimeStock ? 'Cost is required for first stock addition' : 'Leave empty to use previous cost'}
                </div>
                {cost && stockDifference > 0 && (
                  <div className="text-white/70 text-sm mt-2 p-2 bg-white/5 rounded">
                    <div>Total cost: ${(parseFloat(cost) * stockDifference).toFixed(2)} for {stockDifference} {unitDisplay}</div>
                    {previousCost && previousCost !== parseFloat(cost) && (
                      <div className="mt-1 text-white/50">
                        New avg cost: ${(() => {
                          const currentValue = currentStock * previousCost;
                          const addedValue = stockDifference * parseFloat(cost);
                          const totalValue = currentValue + addedValue;
                          const totalQuantity = stock;
                          return (totalValue / totalQuantity).toFixed(2);
                        })()}/{unitDisplay}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
                Update Stock
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  };

  // Full Product Form for adding new products
  const ProductForm: React.FC<{
    product?: ProductItem;
    onSave: (product: ProductItem) => void;
    onCancel: () => void;
  }> = ({ product, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      productName: product?.productName || '',
      typeName: product?.typeName || '',
      sizes: product?.sizes || { 'unit': 0 },
      allowCustom: product?.allowCustom || '',
      stock: product?.stock || 0
    });

    const [newSizeName, setNewSizeName] = useState('');
    const [newSizePrice, setNewSizePrice] = useState(0);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = formData.productName.trim();
      
      if (!trimmedName) return;
      
      // Validate 2-letter abbreviation format
      if (trimmedName.length !== 2) {
        alert('Product name must be exactly 2 letters following the naming convention');
        return;
      }

      const newProduct: ProductItem = {
        productName: trimmedName,
        typeName: formData.typeName.trim() || undefined,
        sizes: formData.sizes,
        allowCustom: formData.allowCustom.trim() || undefined,
        stock: formData.stock
      };

      onSave(newProduct);
    };

    const addSize = () => {
      if (newSizeName.trim() && newSizePrice > 0) {
        setFormData(prev => ({
          ...prev,
          sizes: { ...prev.sizes, [newSizeName.trim()]: newSizePrice }
        }));
        setNewSizeName('');
        setNewSizePrice(0);
      }
    };

    const removeSize = (sizeName: string) => {
      setFormData(prev => {
        const newSizes = { ...prev.sizes };
        delete newSizes[sizeName];
        return { ...prev, sizes: newSizes };
      });
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto"
        >
          <h2 className="text-2xl font-bold text-white mb-6">
            Add New Product
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">Product Name *</label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50"
                placeholder="2-letter abbreviation (e.g., Ti, Vi, Co)"
                maxLength={2}
                required
              />
              <div className="text-white/50 text-xs mt-1">
                Use 2-letter abbreviations following the naming convention
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Product Type</label>
                <input
                  type="text"
                  value={formData.typeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, typeName: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50"
                  placeholder="e.g., Premium, Regular (optional)"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Custom Unit (optional)</label>
              <input
                type="text"
                value={formData.allowCustom}
                onChange={(e) => setFormData(prev => ({ ...prev, allowCustom: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50"
                placeholder="g, ml, unit"
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Sizes and Prices</label>
              <div className="space-y-2 mb-4">
                {Object.entries(formData.sizes).map(([size, price]) => (
                  <div key={size} className="flex items-center gap-2 bg-white/5 p-3 rounded-lg">
                    <span className="text-white flex-1">{size}: ${price}</span>
                    <button
                      type="button"
                      onClick={() => removeSize(size)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Remove size"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50"
                  placeholder="Size (e.g., 1g, 5ml, unit)"
                />
                <input
                  type="number"
                  step="0.01"
                  value={newSizePrice}
                  onChange={(e) => setNewSizePrice(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50"
                  placeholder="Price"
                  min="0"
                />
                <button
                  type="button"
                  onClick={addSize}
                  className="glass-button px-4 py-2"
                  title="Add size"
                >
                  <Plus size={16} />
                </button>
              </div>
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
                Add Product
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
            <h1 className="text-3xl font-semibold gradient-text mb-2">Products</h1>
            <p className="text-white/50 text-sm">Manage your product inventory and pricing</p>
          </div>
        </div>

        {/* Search and Add Button */}
        <div className="mb-8 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group bg-white/[0.08] text-white border border-white/[0.12]" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)' }}>
              <Search size={18} className="text-white" />
              <input
                type="text"
                placeholder="Search products"
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
            Add Product
          </button>
        </div>

        {/* Products List */}
        <div className="glass-panel overflow-hidden">
          {filteredProducts.length > 0 ? (
            <div className="divide-y divide-white/[0.05]">
              {filteredProducts.map((product, index) => (
                <ProductRow
                  key={`${product.productName}-${product.typeName || 'default'}`}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-white/20 mb-4">
                <Package size={48} className="mx-auto" />
              </div>
              <h3 className="text-white font-medium mb-2">No products found</h3>
              <p className="text-white/40 text-sm mb-6">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Products are loaded from the product configuration'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="glass-button px-6 py-3 font-medium"
                >
                  Add New Product
                </button>
              )}
            </div>
          )}
        </div>



        {/* Add Product Modal */}
        {showAddModal && (
          <ProductForm
            onSave={(product) => {
              // In a real implementation, this would update the PRODUCT_CONFIG
              // For now, we'll just close the modal
              console.log('New product to add:', product);
              setShowAddModal(false);
            }}
            onCancel={() => setShowAddModal(false)}
          />
        )}

        {/* Edit Product Stock Modal */}
        {editingProduct && (
          <StockEditModal
            product={editingProduct}
            onSave={(newStock, cost) => {
              updateStock(editingProduct, newStock, cost);
              setEditingProduct(null);
            }}
            onCancel={() => setEditingProduct(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ProductsPage;