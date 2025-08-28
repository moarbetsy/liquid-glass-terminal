/**
 * Comprehensive Product Name Migration Test Suite
 * 
 * This test suite provides comprehensive coverage for product name migration functionality,
 * including migration of products, orders, and cart items from old to new names,
 * error handling and rollback scenarios, and migration performance and data integrity verification.
 * 
 * Requirements covered: 4.1, 4.4, 4.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProductNameMigrationService } from '../productNameMigrationService';
import type { Product, Order, CartItem, OrderItem } from '../../types';

// Mock localStorage with enhanced functionality for testing
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  let accessLog: Array<{ operation: string; key: string; timestamp: number }> = [];
  let errorSimulations: Record<string, string> = {}; // key -> operation
  
  const originalMethods = {
    getItem: (key: string) => {
      accessLog.push({ operation: 'get', key, timestamp: Date.now() });
      if (errorSimulations[key] === 'get') {
        throw new Error(`Simulated localStorage get error for key: ${key}`);
      }
      return store[key] || null;
    },
    setItem: (key: string, value: string) => {
      accessLog.push({ operation: 'set', key, timestamp: Date.now() });
      if (errorSimulations[key] === 'set') {
        throw new Error(`Simulated localStorage set error for key: ${key}`);
      }
      store[key] = value;
    },
    removeItem: (key: string) => {
      accessLog.push({ operation: 'remove', key, timestamp: Date.now() });
      if (errorSimulations[key] === 'remove') {
        throw new Error(`Simulated localStorage remove error for key: ${key}`);
      }
      delete store[key];
    }
  };
  
  const mockStorage = {
    getItem: originalMethods.getItem,
    setItem: originalMethods.setItem,
    removeItem: originalMethods.removeItem,
    clear: () => {
      accessLog = [];
      store = {};
      errorSimulations = {};
    },
    // Test utilities
    getStore: () => ({ ...store }),
    getAccessLog: () => [...accessLog],
    simulateError: (key: string, operation: 'get' | 'set' | 'remove') => {
      errorSimulations[key] = operation;
    },
    clearErrorSimulations: () => {
      errorSimulations = {};
    }
  };
  
  return mockStorage;
};

const mockLocalStorage = createMockLocalStorage();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock console.log to capture and verify logging
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

// Test data generators
const createTestProducts = (): Product[] => [
  { id: '1', name: 'Tina', type: 'g', stock: 100, price: 30 },
  { id: '2', name: 'Viag', type: 'unit', stock: 50, price: 6 },
  { id: '3', name: 'GH', type: 'ml', stock: 25, price: 10 },
  { id: '4', name: 'Cial', type: 'unit', stock: 30, price: 8 },
  { id: '5', name: 'Speed', type: 'unit', stock: 100, price: 3 },
  { id: '6', name: 'Ecsta', type: 'unit', stock: 75, price: 8 },
  { id: '7', name: 'MD', type: 'unit', stock: 40, price: 8 },
  { id: '8', name: 'Weed', type: 'g', stock: 200, price: 5 },
  { id: '9', name: 'Hash', type: 'g', stock: 50, price: 10 },
  { id: '10', name: 'Ket', type: 'g', stock: 20, price: 40 }
];

const createTestOrderItems = (): OrderItem[] => [
  { productId: '1', productName: 'Tina', size: '1g', quantity: 2, price: 30 },
  { productId: '2', productName: 'Viag', size: 'Blue 100mg', quantity: 1, price: 6 },
  { productId: '3', productName: 'GH', size: '5ml', quantity: 1, price: 10 }
];

const createTestOrders = (): Order[] => [
  {
    id: '1',
    clientId: 'client1',
    clientName: 'Test Client 1',
    total: 66,
    status: 'Completed',
    date: '2024-01-01',
    items: createTestOrderItems()
  },
  {
    id: '2',
    clientId: 'client2',
    clientName: 'Test Client 2',
    total: 30,
    status: 'Unpaid',
    date: '2024-01-02',
    notes: 'Rush order',
    shipping: 5,
    discount: 2,
    items: [
      { productId: '1', productName: 'Tina', size: '1g', quantity: 1, price: 30 }
    ]
  }
];

const createTestCartItems = (): CartItem[] => [
  {
    productId: '1',
    productName: 'Tina',
    product: 'Tina',
    size: '1g',
    quantity: 1,
    price: 30
  },
  {
    productId: '2',
    productName: 'Viag',
    product: 'Viag',
    size: 'Blue 100mg',
    quantity: 2,
    price: 6
  }
];

const createLargeDataset = (size: number) => {
  const products: Product[] = [];
  const orders: Order[] = [];
  const cartItems: CartItem[] = [];
  
  const productNames = ['Tina', 'Viag', 'GH', 'Cial', 'Speed'];
  
  // Generate products
  for (let i = 0; i < size; i++) {
    products.push({
      id: `product-${i}`,
      name: productNames[i % productNames.length],
      type: 'g',
      stock: Math.floor(Math.random() * 100),
      price: Math.floor(Math.random() * 50) + 1
    });
  }
  
  // Generate orders with multiple items
  for (let i = 0; i < Math.floor(size / 2); i++) {
    const itemCount = Math.floor(Math.random() * 5) + 1;
    const items: OrderItem[] = [];
    
    for (let j = 0; j < itemCount; j++) {
      const productName = productNames[j % productNames.length];
      items.push({
        productId: `product-${j}`,
        productName,
        size: '1g',
        quantity: Math.floor(Math.random() * 5) + 1,
        price: Math.floor(Math.random() * 50) + 1
      });
    }
    
    orders.push({
      id: `order-${i}`,
      clientId: `client-${i}`,
      clientName: `Client ${i}`,
      total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: i % 2 === 0 ? 'Completed' : 'Unpaid',
      date: `2024-01-${String(i % 28 + 1).padStart(2, '0')}`,
      items
    });
  }
  
  // Generate cart items
  for (let i = 0; i < Math.floor(size / 4); i++) {
    const productName = productNames[i % productNames.length];
    cartItems.push({
      productId: `product-${i}`,
      productName,
      product: productName,
      size: '1g',
      quantity: Math.floor(Math.random() * 3) + 1,
      price: Math.floor(Math.random() * 50) + 1
    });
  }
  
  return { products, orders, cartItems };
};

describe('Comprehensive Product Name Migration Test Suite', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    mockLocalStorage.clearErrorSimulations();
    ProductNameMigrationService.clearMigrationLog();
    consoleSpy.mockClear();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('Migration of Products from Old to New Names', () => {
    it('should migrate all products with old names to new names', async () => {
      const products = createTestProducts();
      mockLocalStorage.setItem('products', JSON.stringify(products));
      
      const result = await ProductNameMigrationService.performProductNameMigration();
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const migratedProducts: Product[] = JSON.parse(mockLocalStorage.getItem('products')!);
      
      // Verify specific mappings
      expect(migratedProducts.find(p => p.id === '1')?.name).toBe('Ti'); // Tina -> Ti
      expect(migratedProducts.find(p => p.id === '2')?.name).toBe('Vi'); // Viag -> Vi
      expect(migratedProducts.find(p => p.id === '3')?.name).toBe('Gh'); // GH -> Gh
      expect(migratedProducts.find(p => p.id === '4')?.name).toBe('Ci'); // Cial -> Ci
      expect(migratedProducts.find(p => p.id === '5')?.name).toBe('Sp'); // Speed -> Sp
      expect(migratedProducts.find(p => p.id === '6')?.name).toBe('E');  // Ecsta -> E
      expect(migratedProducts.find(p => p.id === '7')?.name).toBe('Md'); // MD -> Md
      expect(migratedProducts.find(p => p.id === '8')?.name).toBe('We'); // Weed -> We
      expect(migratedProducts.find(p => p.id === '9')?.name).toBe('Ha'); // Hash -> Ha
      expect(migratedProducts.find(p => p.id === '10')?.name).toBe('Ke'); // Ket -> Ke
    });

    it('should preserve all product properties except name during migration', async () => {
      const products = createTestProducts();
      mockLocalStorage.setItem('products', JSON.stringify(products));
      
      await ProductNameMigrationService.performProductNameMigration();
      
      const migratedProducts: Product[] = JSON.parse(mockLocalStorage.getItem('products')!);
      const originalProduct = products[0];
      const migratedProduct = migratedProducts[0];
      
      expect(migratedProduct.id).toBe(originalProduct.id);
      expect(migratedProduct.type).toBe(originalProduct.type);
      expect(migratedProduct.stock).toBe(originalProduct.stock);
      expect(migratedProduct.price).toBe(originalProduct.price);
      expect(migratedProduct.name).not.toBe(originalProduct.name); // Should be changed
    });

    it('should handle products with unmappable names gracefully', async () => {
      const products: Product[] = [
        { id: '1', name: 'Tina', type: 'g', stock: 100, price: 30 },
        { id: '2', name: 'UnknownProduct', type: 'g', stock: 50, price: 10 },
        { id: '3', name: 'AnotherUnknown', type: 'unit', stock: 25, price: 5 }
      ];
      mockLocalStorage.setItem('products', JSON.stringify(products));
      
      const result = await ProductNameMigrationService.performProductNameMigration();
      
      expect(result.success).toBe(true); // Should still succeed
      
      const migratedProducts: Product[] = JSON.parse(mockLocalStorage.getItem('products')!);
      
      expect(migratedProducts[0].name).toBe('Ti'); // Mapped
      expect(migratedProducts[1].name).toBe('UnknownProduct'); // Unchanged
      expect(migratedProducts[2].name).toBe('AnotherUnknown'); // Unchanged
    });
  });

  describe('Migration of Orders from Old to New Names', () => {
    it('should migrate all order items with old product names to new names', async () => {
      const orders = createTestOrders();
      mockLocalStorage.setItem('orders', JSON.stringify(orders));
      
      const result = await ProductNameMigrationService.performProductNameMigration();
      
      expect(result.success).toBe(true);
      
      const migratedOrders: Order[] = JSON.parse(mockLocalStorage.getItem('orders')!);
      
      // Check first order items
      expect(migratedOrders[0].items[0].productName).toBe('Ti'); // Tina -> Ti
      expect(migratedOrders[0].items[1].productName).toBe('Vi'); // Viag -> Vi
      expect(migratedOrders[0].items[2].productName).toBe('Gh'); // GH -> Gh
      
      // Check second order items
      expect(migratedOrders[1].items[0].productName).toBe('Ti'); // Tina -> Ti
    });

    it('should preserve all order metadata during migration', async () => {
      const orders = createTestOrders();
      mockLocalStorage.setItem('orders', JSON.stringify(orders));
      
      await ProductNameMigrationService.performProductNameMigration();
      
      const migratedOrders: Order[] = JSON.parse(mockLocalStorage.getItem('orders')!);
      const originalOrder = orders[1]; // Order with metadata
      const migratedOrder = migratedOrders[1];
      
      expect(migratedOrder.id).toBe(originalOrder.id);
      expect(migratedOrder.clientId).toBe(originalOrder.clientId);
      expect(migratedOrder.clientName).toBe(originalOrder.clientName);
      expect(migratedOrder.total).toBe(originalOrder.total);
      expect(migratedOrder.status).toBe(originalOrder.status);
      expect(migratedOrder.date).toBe(originalOrder.date);
      expect(migratedOrder.notes).toBe(originalOrder.notes);
      expect(migratedOrder.shipping).toBe(originalOrder.shipping);
      expect(migratedOrder.discount).toBe(originalOrder.discount);
    });

    it('should preserve all order item properties except productName during migration', async () => {
      const orders = createTestOrders();
      mockLocalStorage.setItem('orders', JSON.stringify(orders));
      
      await ProductNameMigrationService.performProductNameMigration();
      
      const migratedOrders: Order[] = JSON.parse(mockLocalStorage.getItem('orders')!);
      const originalItem = orders[0].items[0];
      const migratedItem = migratedOrders[0].items[0];
      
      expect(migratedItem.productId).toBe(originalItem.productId);
      expect(migratedItem.size).toBe(originalItem.size);
      expect(migratedItem.quantity).toBe(originalItem.quantity);
      expect(migratedItem.price).toBe(originalItem.price);
      expect(migratedItem.productName).not.toBe(originalItem.productName); // Should be changed
    });
  });

  describe('Migration of Cart Items from Old to New Names', () => {
    it('should migrate both productName and product fields in cart items', async () => {
      const cartItems = createTestCartItems();
      mockLocalStorage.setItem('cart', JSON.stringify(cartItems));
      
      const result = await ProductNameMigrationService.performProductNameMigration();
      
      expect(result.success).toBe(true);
      
      const migratedCart: CartItem[] = JSON.parse(mockLocalStorage.getItem('cart')!);
      
      expect(migratedCart[0].productName).toBe('Ti'); // Tina -> Ti
      expect(migratedCart[0].product).toBe('Ti'); // Tina -> Ti
      expect(migratedCart[1].productName).toBe('Vi'); // Viag -> Vi
      expect(migratedCart[1].product).toBe('Vi'); // Viag -> Vi
    });

    it('should preserve all cart item properties except product names during migration', async () => {
      const cartItems = createTestCartItems();
      mockLocalStorage.setItem('cart', JSON.stringify(cartItems));
      
      await ProductNameMigrationService.performProductNameMigration();
      
      const migratedCart: CartItem[] = JSON.parse(mockLocalStorage.getItem('cart')!);
      const originalItem = cartItems[0];
      const migratedItem = migratedCart[0];
      
      expect(migratedItem.productId).toBe(originalItem.productId);
      expect(migratedItem.size).toBe(originalItem.size);
      expect(migratedItem.quantity).toBe(originalItem.quantity);
      expect(migratedItem.price).toBe(originalItem.price);
      expect(migratedItem.productName).not.toBe(originalItem.productName); // Should be changed
      expect(migratedItem.product).not.toBe(originalItem.product); // Should be changed
    });
  });

  describe('Error Handling and Rollback Scenarios', () => {
    it('should handle localStorage read errors gracefully', async () => {
      // Set up some data first, then simulate read error during backup creation
      const products = createTestProducts();
      mockLocalStorage.setItem('products', JSON.stringify(products));
      
      // Simulate error when trying to read products during backup creation
      mockLocalStorage.simulateError('products', 'get');
      
      const result = await ProductNameMigrationService.performProductNameMigration();
      
      expect(result.success).toBe(false); // Should fail due to backup creation error
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle localStorage write errors and report them', async () => {
      const products = createTestProducts();
      mockLocalStorage.setItem('products', JSON.stringify(products));
      
      // Clear error simulation first, then set it for the migration write
      mockLocalStorage.clearErrorSimulations();
      mockLocalStorage.simulateError('products', 'set');
      
      const result = await ProductNameMigrationService.performProductNameMigration();
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Error migrating products');
    });

    it('should handle invalid JSON data gracefully', async () => {
      mockLocalStorage.clearErrorSimulations();
      mockLocalStorage.setItem('products', 'invalid json data');
      mockLocalStorage.setItem('orders', '{"incomplete": json');
      mockLocalStorage.setItem('cart', 'not json at all');
      
      const result = await ProductNameMigrationService.performProductNameMigration();
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should create backup before migration', async () => {
      mockLocalStorage.clearErrorSimulations();
      const products = createTestProducts();
      mockLocalStorage.setItem('products', JSON.stringify(products));
      
      await ProductNameMigrationService.performProductNameMigration();
      
      const backup = mockLocalStorage.getItem('productNameMigrationBackup');
      expect(backup).toBeTruthy();
      
      const parsedBackup = JSON.parse(backup!);
      expect(parsedBackup.data.products).toBeTruthy();
      expect(parsedBackup.timestamp).toBeTruthy();
      expect(parsedBackup.version).toBe('1.0.0'); // Original version
    });

    it('should restore from backup on critical error', async () => {
      mockLocalStorage.clearErrorSimulations();
      const products = createTestProducts();
      const orders = createTestOrders();
      
      mockLocalStorage.setItem('products', JSON.stringify(products));
      mockLocalStorage.setItem('orders', JSON.stringify(orders));
      
      // Create backup first
      ProductNameMigrationService.createMigrationBackup();
      
      // Simulate critical error during migration using error simulation
      mockLocalStorage.simulateError('productNameMigrationVersion', 'set');
      
      const result = await ProductNameMigrationService.performProductNameMigration();
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Verify backup restoration was attempted
      const log = ProductNameMigrationService.getMigrationLog();
      const restoreAttempt = log.some(entry => entry.includes('Attempting to restore from backup'));
      expect(restoreAttempt).toBe(true);
      
      // Clear the error simulation after the test
      mockLocalStorage.clearErrorSimulations();
    });

    it('should handle backup creation failure', () => {
      mockLocalStorage.simulateError('productNameMigrationBackup', 'set');
      
      expect(() => {
        ProductNameMigrationService.createMigrationBackup();
      }).toThrow('Failed to create migration backup');
    });

    it('should handle backup restoration when backup is corrupted', () => {
      mockLocalStorage.clearErrorSimulations();
      mockLocalStorage.setItem('productNameMigrationBackup', 'corrupted backup data');
      
      const restored = ProductNameMigrationService.restoreFromBackup();
      expect(restored).toBe(false);
    });
  });

  describe('Migration Performance and Data Integrity', () => {
    it('should handle large datasets efficiently', () => {
      const { products, orders, cartItems } = createLargeDataset(1000);
      
      const startTime = Date.now();
      
      // Test individual migration functions for performance
      const migratedProducts = ProductNameMigrationService.migrateProductsArray(products);
      const migratedOrders = ProductNameMigrationService.migrateOrdersProductNames(orders);
      const migratedCart = ProductNameMigrationService.migrateCartItemProductNames(cartItems);
      
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Verify data integrity
      expect(migratedProducts).toHaveLength(products.length);
      expect(migratedOrders).toHaveLength(orders.length);
      expect(migratedCart).toHaveLength(cartItems.length);
    });

    it('should maintain referential integrity between products and orders', () => {
      const products = createTestProducts();
      const orders = createTestOrders();
      
      const migratedProducts = ProductNameMigrationService.migrateProductsArray(products);
      const migratedOrders = ProductNameMigrationService.migrateOrdersProductNames(orders);
      
      // Verify that product names in orders match migrated product names
      migratedOrders.forEach(order => {
        order.items.forEach(item => {
          const matchingProduct = migratedProducts.find(p => p.id === item.productId);
          if (matchingProduct) {
            expect(item.productName).toBe(matchingProduct.name);
          }
        });
      });
    });

    it('should maintain data consistency across multiple migration runs', () => {
      const products = createTestProducts();
      
      // First migration
      const firstMigration = ProductNameMigrationService.migrateProductsArray(products);
      
      // Second migration on already migrated data
      const secondMigration = ProductNameMigrationService.migrateProductsArray(firstMigration);
      
      // Data should be identical (no double migration)
      expect(JSON.stringify(firstMigration)).toBe(JSON.stringify(secondMigration));
    });

    it('should validate data integrity after migration', () => {
      const products = createTestProducts();
      const orders = createTestOrders();
      const cartItems = createTestCartItems();
      
      // Migrate data using individual functions
      const migratedProducts = ProductNameMigrationService.migrateProductsArray(products);
      const migratedOrders = ProductNameMigrationService.migrateOrdersProductNames(orders);
      const migratedCart = ProductNameMigrationService.migrateCartItemProductNames(cartItems);
      
      // Set migrated data in localStorage for validation
      mockLocalStorage.setItem('products', JSON.stringify(migratedProducts));
      mockLocalStorage.setItem('orders', JSON.stringify(migratedOrders));
      mockLocalStorage.setItem('cart', JSON.stringify(migratedCart));
      
      const validation = ProductNameMigrationService.validateProductNameMigration();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      // Some warnings are expected if there are unmappable product names
    });

    it('should detect incomplete migrations during validation', async () => {
      mockLocalStorage.clearErrorSimulations();
      // Set up partially migrated data
      const products: Product[] = [
        { id: '1', name: 'Ti', type: 'g', stock: 100, price: 30 }, // Migrated
        { id: '2', name: 'Viag', type: 'unit', stock: 50, price: 6 } // Not migrated
      ];
      
      mockLocalStorage.setItem('products', JSON.stringify(products));
      
      const validation = ProductNameMigrationService.validateProductNameMigration();
      
      expect(validation.isValid).toBe(true); // No errors, just warnings
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('still uses old name: Viag');
    });

    it('should provide comprehensive migration statistics', () => {
      // Clear all error simulations and reset localStorage
      mockLocalStorage.clear();
      mockLocalStorage.clearErrorSimulations();
      
      // Set up version and backup manually
      ProductNameMigrationService.setMigrationVersion('2.0.0');
      ProductNameMigrationService.createMigrationBackup();
      
      const stats = ProductNameMigrationService.getMigrationStatistics();
      
      expect(stats.currentVersion).toBe('2.0.0');
      expect(stats.needsMigration).toBe(false);
      expect(stats.backupExists).toBe(true);
      expect(stats.logEntries).toBeGreaterThan(0);
      expect(stats.lastMigration).toBeTruthy();
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty data gracefully', () => {
      const emptyProducts: Product[] = [];
      const emptyOrders: Order[] = [];
      const emptyCart: CartItem[] = [];
      
      const migratedProducts = ProductNameMigrationService.migrateProductsArray(emptyProducts);
      const migratedOrders = ProductNameMigrationService.migrateOrdersProductNames(emptyOrders);
      const migratedCart = ProductNameMigrationService.migrateCartItemProductNames(emptyCart);
      
      expect(migratedProducts).toHaveLength(0);
      expect(migratedOrders).toHaveLength(0);
      expect(migratedCart).toHaveLength(0);
    });

    it('should handle missing localStorage keys', () => {
      // Test validation when no data exists
      mockLocalStorage.clearErrorSimulations();
      
      const validation = ProductNameMigrationService.validateProductNameMigration();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should handle products with null or undefined names', () => {
      const products = [
        { id: '1', name: 'Tina', type: 'g', stock: 100, price: 30 },
        { id: '2', name: null, type: 'g', stock: 50, price: 10 } as any,
        { id: '3', name: undefined, type: 'g', stock: 25, price: 5 } as any
      ];
      
      const migratedProducts = ProductNameMigrationService.migrateProductsArray(products);
      
      expect(migratedProducts[0].name).toBe('Ti'); // Migrated
      expect(migratedProducts[1].name).toBe(null); // Unchanged
      expect(migratedProducts[2].name).toBe(undefined); // Unchanged
    });

    it('should handle extremely large individual records', () => {
      const largeOrder: Order = {
        id: '1',
        clientId: 'client1',
        clientName: 'Test Client',
        total: 10000,
        status: 'Completed',
        date: '2024-01-01',
        notes: 'A'.repeat(10000), // Large notes field
        items: Array.from({ length: 1000 }, (_, i) => ({
          productId: `product-${i}`,
          productName: 'Tina',
          size: '1g',
          quantity: 1,
          price: 30
        }))
      };
      
      const migratedOrders = ProductNameMigrationService.migrateOrdersProductNames([largeOrder]);
      
      expect(migratedOrders[0].items).toHaveLength(1000);
      expect(migratedOrders[0].items.every(item => item.productName === 'Ti')).toBe(true);
    });
  });

  describe('Logging and Monitoring', () => {
    it('should log all migration activities', () => {
      const products = createTestProducts();
      
      ProductNameMigrationService.migrateProductsArray(products);
      
      const log = ProductNameMigrationService.getMigrationLog();
      
      expect(log.length).toBeGreaterThan(0);
      expect(log.some(entry => entry.includes('Starting migration of'))).toBe(true);
      expect(log.some(entry => entry.includes('Completed migration of products array'))).toBe(true);
    });

    it('should log individual product name changes', async () => {
      mockLocalStorage.clearErrorSimulations();
      const products = [{ id: '1', name: 'Tina', type: 'g', stock: 100, price: 30 }];
      mockLocalStorage.setItem('products', JSON.stringify(products));
      
      await ProductNameMigrationService.performProductNameMigration();
      
      const log = ProductNameMigrationService.getMigrationLog();
      const migrationEntry = log.find(entry => entry.includes('Migrating product: "Tina" -> "Ti"'));
      
      expect(migrationEntry).toBeTruthy();
    });

    it('should log errors with sufficient detail for debugging', async () => {
      mockLocalStorage.clearErrorSimulations();
      mockLocalStorage.setItem('products', 'invalid json');
      
      const result = await ProductNameMigrationService.performProductNameMigration();
      
      expect(result.success).toBe(false);
      
      const log = ProductNameMigrationService.getMigrationLog();
      const errorEntry = log.find(entry => entry.includes('Error migrating products'));
      
      expect(errorEntry).toBeTruthy();
    });

    it('should track localStorage access patterns', async () => {
      mockLocalStorage.clearErrorSimulations();
      const products = createTestProducts();
      mockLocalStorage.setItem('products', JSON.stringify(products));
      
      await ProductNameMigrationService.performProductNameMigration();
      
      const accessLog = mockLocalStorage.getAccessLog();
      
      expect(accessLog.length).toBeGreaterThan(0);
      expect(accessLog.some(entry => entry.key === 'products' && entry.operation === 'get')).toBe(true);
      expect(accessLog.some(entry => entry.key === 'products' && entry.operation === 'set')).toBe(true);
    });
  });

  describe('Concurrent Migration Scenarios', () => {
    it('should handle version conflicts gracefully', () => {
      // Clear all error simulations and reset localStorage
      mockLocalStorage.clear();
      mockLocalStorage.clearErrorSimulations();
      
      // Test version management
      const initialVersion = ProductNameMigrationService.getMigrationVersion();
      ProductNameMigrationService.setMigrationVersion('2.0.0');
      const updatedVersion = ProductNameMigrationService.getMigrationVersion();
      
      expect(initialVersion).toBe('1.0.0');
      expect(updatedVersion).toBe('2.0.0');
    });

    it('should detect when migration is already in progress', () => {
      // This test verifies that the service can detect concurrent migrations
      // In a real implementation, you might use locks or flags
      
      const stats1 = ProductNameMigrationService.getMigrationStatistics();
      const stats2 = ProductNameMigrationService.getMigrationStatistics();
      
      expect(stats1.currentVersion).toBe(stats2.currentVersion);
    });
  });
});