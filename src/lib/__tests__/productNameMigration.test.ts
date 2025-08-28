/**
 * Tests for Product Name Migration functionality in ProductNameMigrationService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProductNameMigrationService } from '../productNameMigrationService';
import type { Product, Order, CartItem } from '../../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock console.log to avoid noise in tests
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('ProductNameMigrationService', () => {
  beforeEach(() => {
    localStorageMock.clear();
    ProductNameMigrationService.clearMigrationLog();
    consoleSpy.mockClear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Version Management', () => {
    it('should get default migration version when none exists', () => {
      const version = ProductNameMigrationService.getMigrationVersion();
      expect(version).toBe('1.0.0');
    });

    it('should set and get migration version', () => {
      ProductNameMigrationService.setMigrationVersion('2.0.0');
      const version = ProductNameMigrationService.getMigrationVersion();
      expect(version).toBe('2.0.0');
    });

    it('should compare versions correctly', () => {
      expect(ProductNameMigrationService.compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(ProductNameMigrationService.compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(ProductNameMigrationService.compareVersions('2.0.0', '2.0.0')).toBe(0);
      expect(ProductNameMigrationService.compareVersions('1.5.0', '1.4.9')).toBe(1);
    });

    it('should detect when product name migration is needed', () => {
      // Default version is 1.0.0, should need migration to 2.0.0
      expect(ProductNameMigrationService.needsProductNameMigration()).toBe(true);
      
      // After setting to 2.0.0, should not need migration
      ProductNameMigrationService.setMigrationVersion('2.0.0');
      expect(ProductNameMigrationService.needsProductNameMigration()).toBe(false);
    });
  });

  describe('Backup and Restore', () => {
    it('should create migration backup', () => {
      const testData = {
        products: JSON.stringify([{ id: '1', name: 'Tina' }]),
        orders: JSON.stringify([{ id: '1', items: [] }])
      };
      
      localStorageMock.setItem('products', testData.products);
      localStorageMock.setItem('orders', testData.orders);
      
      ProductNameMigrationService.createMigrationBackup();
      
      const backup = localStorageMock.getItem('productNameMigrationBackup');
      expect(backup).toBeTruthy();
      
      const parsedBackup = JSON.parse(backup!);
      expect(parsedBackup.data.products).toBe(testData.products);
      expect(parsedBackup.data.orders).toBe(testData.orders);
      expect(parsedBackup.timestamp).toBeTruthy();
    });

    it('should restore from backup', () => {
      const originalData = {
        products: JSON.stringify([{ id: '1', name: 'Tina' }]),
        orders: JSON.stringify([{ id: '1', items: [] }])
      };
      
      // Set original data and create backup
      localStorageMock.setItem('products', originalData.products);
      localStorageMock.setItem('orders', originalData.orders);
      ProductNameMigrationService.setMigrationVersion('1.0.0');
      ProductNameMigrationService.createMigrationBackup();
      
      // Modify data
      localStorageMock.setItem('products', JSON.stringify([{ id: '1', name: 'Ti' }]));
      ProductNameMigrationService.setMigrationVersion('2.0.0');
      
      // Restore
      const restored = ProductNameMigrationService.restoreFromBackup();
      expect(restored).toBe(true);
      
      // Check restoration
      expect(localStorageMock.getItem('products')).toBe(originalData.products);
      expect(ProductNameMigrationService.getMigrationVersion()).toBe('1.0.0');
    });

    it('should handle restore when no backup exists', () => {
      const restored = ProductNameMigrationService.restoreFromBackup();
      expect(restored).toBe(false);
    });
  });

  describe('Product Migration', () => {
    it('should migrate single product name', () => {
      const product: Product = {
        id: '1',
        name: 'Tina',
        type: 'g',
        stock: 100,
        price: 30
      };
      
      const migrated = ProductNameMigrationService.migrateProductNames(product);
      expect(migrated.name).toBe('Ti');
      expect(migrated.id).toBe('1');
      expect(migrated.stock).toBe(100);
    });

    it('should handle product with unmappable name', () => {
      const product: Product = {
        id: '1',
        name: 'UnknownProduct',
        type: 'g',
        stock: 100,
        price: 30
      };
      
      const migrated = ProductNameMigrationService.migrateProductNames(product);
      expect(migrated.name).toBe('UnknownProduct'); // Should remain unchanged
    });

    it('should migrate products array', () => {
      const products: Product[] = [
        { id: '1', name: 'Tina', type: 'g', stock: 100, price: 30 },
        { id: '2', name: 'Viag', type: 'unit', stock: 50, price: 6 },
        { id: '3', name: 'UnknownProduct', type: 'g', stock: 10, price: 5 }
      ];
      
      const migrated = ProductNameMigrationService.migrateProductsArray(products);
      expect(migrated).toHaveLength(3);
      expect(migrated[0].name).toBe('Ti');
      expect(migrated[1].name).toBe('Vi');
      expect(migrated[2].name).toBe('UnknownProduct'); // Unchanged
    });
  });

  describe('Cart Item Migration', () => {
    it('should migrate cart item product names', () => {
      const cartItems: CartItem[] = [
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
      
      const migrated = ProductNameMigrationService.migrateCartItemProductNames(cartItems);
      expect(migrated).toHaveLength(2);
      expect(migrated[0].productName).toBe('Ti');
      expect(migrated[0].product).toBe('Ti');
      expect(migrated[1].productName).toBe('Vi');
      expect(migrated[1].product).toBe('Vi');
    });

    it('should handle cart items with unmappable names', () => {
      const cartItems: CartItem[] = [
        {
          productId: '1',
          productName: 'UnknownProduct',
          product: 'UnknownProduct',
          size: '1g',
          quantity: 1,
          price: 30
        }
      ];
      
      const migrated = ProductNameMigrationService.migrateCartItemProductNames(cartItems);
      expect(migrated[0].productName).toBe('UnknownProduct');
      expect(migrated[0].product).toBe('UnknownProduct');
    });
  });

  describe('Order Migration', () => {
    it('should migrate order item product names', () => {
      const orders: Order[] = [
        {
          id: '1',
          clientId: 'client1',
          clientName: 'Test Client',
          total: 60,
          status: 'Completed',
          date: '2024-01-01',
          items: [
            {
              productId: '1',
              productName: 'Tina',
              size: '1g',
              quantity: 1,
              price: 30
            },
            {
              productId: '2',
              productName: 'Viag',
              size: 'Blue 100mg',
              quantity: 1,
              price: 6
            }
          ]
        }
      ];
      
      const migrated = ProductNameMigrationService.migrateOrdersProductNames(orders);
      expect(migrated).toHaveLength(1);
      expect(migrated[0].items).toHaveLength(2);
      expect(migrated[0].items[0].productName).toBe('Ti');
      expect(migrated[0].items[1].productName).toBe('Vi');
    });

    it('should preserve order metadata during migration', () => {
      const orders: Order[] = [
        {
          id: '1',
          clientId: 'client1',
          clientName: 'Test Client',
          total: 30,
          status: 'Unpaid',
          date: '2024-01-01',
          notes: 'Test order',
          shipping: 5,
          discount: 2,
          items: [
            {
              productId: '1',
              productName: 'Tina',
              size: '1g',
              quantity: 1,
              price: 30
            }
          ]
        }
      ];
      
      const migrated = ProductNameMigrationService.migrateOrdersProductNames(orders);
      const order = migrated[0];
      expect(order.id).toBe('1');
      expect(order.clientId).toBe('client1');
      expect(order.clientName).toBe('Test Client');
      expect(order.total).toBe(30);
      expect(order.status).toBe('Unpaid');
      expect(order.notes).toBe('Test order');
      expect(order.shipping).toBe(5);
      expect(order.discount).toBe(2);
    });
  });

  describe('Complete Migration Process', () => {
    it('should perform complete migration successfully', async () => {
      // Set up test data
      const products: Product[] = [
        { id: '1', name: 'Tina', type: 'g', stock: 100, price: 30 }
      ];
      const orders: Order[] = [
        {
          id: '1',
          clientId: 'client1',
          clientName: 'Test Client',
          total: 30,
          status: 'Completed',
          date: '2024-01-01',
          items: [
            { productId: '1', productName: 'Tina', size: '1g', quantity: 1, price: 30 }
          ]
        }
      ];
      const cart: CartItem[] = [
        { productId: '1', productName: 'Tina', product: 'Tina', size: '1g', quantity: 1, price: 30 }
      ];
      
      localStorageMock.setItem('products', JSON.stringify(products));
      localStorageMock.setItem('orders', JSON.stringify(orders));
      localStorageMock.setItem('cart', JSON.stringify(cart));
      
      // Perform migration
      const result = await ProductNameMigrationService.performProductNameMigration();
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      // Check migrated data
      const migratedProducts: Product[] = JSON.parse(localStorageMock.getItem('products')!);
      const migratedOrders: Order[] = JSON.parse(localStorageMock.getItem('orders')!);
      const migratedCart: CartItem[] = JSON.parse(localStorageMock.getItem('cart')!);
      
      expect(migratedProducts[0].name).toBe('Ti');
      expect(migratedOrders[0].items[0].productName).toBe('Ti');
      expect(migratedCart[0].productName).toBe('Ti');
      expect(migratedCart[0].product).toBe('Ti');
      
      // Check version updated
      expect(ProductNameMigrationService.getMigrationVersion()).toBe('2.0.0');
    });

    it('should skip migration if not needed', async () => {
      ProductNameMigrationService.setMigrationVersion('2.0.0');
      
      const result = await ProductNameMigrationService.performProductNameMigration();
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle migration errors gracefully', async () => {
      // Set up invalid JSON data to cause parsing error
      localStorageMock.setItem('products', 'invalid json');
      
      const result = await ProductNameMigrationService.performProductNameMigration();
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Migration Validation', () => {
    it('should validate successful migration', () => {
      // Set up migrated data
      const products: Product[] = [
        { id: '1', name: 'Ti', type: 'g', stock: 100, price: 30 }
      ];
      const orders: Order[] = [
        {
          id: '1',
          clientId: 'client1',
          clientName: 'Test Client',
          total: 30,
          status: 'Completed',
          date: '2024-01-01',
          items: [
            { productId: '1', productName: 'Ti', size: '1g', quantity: 1, price: 30 }
          ]
        }
      ];
      
      localStorageMock.setItem('products', JSON.stringify(products));
      localStorageMock.setItem('orders', JSON.stringify(orders));
      
      const validation = ProductNameMigrationService.validateProductNameMigration();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(0);
    });

    it('should detect incomplete migration', () => {
      // Set up data with old names
      const products: Product[] = [
        { id: '1', name: 'Tina', type: 'g', stock: 100, price: 30 }
      ];
      
      localStorageMock.setItem('products', JSON.stringify(products));
      
      const validation = ProductNameMigrationService.validateProductNameMigration();
      
      expect(validation.isValid).toBe(true); // No errors, just warnings
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('still uses old name: Tina');
    });
  });

  describe('Migration Statistics', () => {
    it('should provide migration statistics', () => {
      ProductNameMigrationService.setMigrationVersion('1.5.0');
      ProductNameMigrationService.createMigrationBackup();
      
      const stats = ProductNameMigrationService.getMigrationStatistics();
      
      expect(stats.currentVersion).toBe('1.5.0');
      expect(stats.needsMigration).toBe(true);
      expect(stats.backupExists).toBe(true);
      expect(stats.logEntries).toBeGreaterThan(0);
      expect(stats.lastMigration).toBeTruthy();
    });
  });

  describe('Logging', () => {
    it('should log migration activities', () => {
      ProductNameMigrationService.logMigration('Test log entry');
      
      const log = ProductNameMigrationService.getMigrationLog();
      expect(log.length).toBeGreaterThan(0);
      expect(log[log.length - 1]).toContain('Test log entry');
    });

    it('should clear migration log', () => {
      ProductNameMigrationService.logMigration('Test entry');
      expect(ProductNameMigrationService.getMigrationLog().length).toBeGreaterThan(0);
      
      ProductNameMigrationService.clearMigrationLog();
      expect(ProductNameMigrationService.getMigrationLog()).toHaveLength(0);
    });
  });
});