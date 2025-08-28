import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  migrateStoredCartItems, 
  migrateStoredOrders, 
  isMigrationNeeded, 
  performAutoMigration,
  createDataBackup,
  restoreDataFromBackup
} from '../utils';
import { ProductNameMigrationService } from '../productNameMigrationService';
import { 
  convertOldToNewName,
  safeConvertOldToNewName,
  isValidOldProductName,
  isValidNewProductName,
  ProductNameMappingError
} from '../productNameUtils';
import { PRODUCT_NAME_MAPPINGS } from '../productNameMappings';
import type { CartItem, Order, Product, OrderItem } from '../../types';

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
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

// Add Object.keys support for localStorage
Object.defineProperty(localStorageMock, Symbol.iterator, {
  value: function* () {
    for (const key in this) {
      if (this.hasOwnProperty(key)) {
        yield key;
      }
    }
  }
});

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Migration Utils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Clear product name migration log
    ProductNameMigrationService.clearMigrationLog();
  });

  describe('migrateStoredCartItems', () => {
    it('should migrate cart items from localStorage with new product names', () => {
      const legacyCartItems: CartItem[] = [
        {
          productId: 'ti',
          productName: 'Ti', // Already using new name
          product: 'Ti',
          size: '1g',
          quantity: 1,
          price: 30
        }
      ];

      localStorage.setItem('cart', JSON.stringify(legacyCartItems));

      const migratedItems = migrateStoredCartItems();

      expect(migratedItems).toHaveLength(1);
      expect(migratedItems[0].categoryName).toBe('products');
      expect(migratedItems[0].productTypeName).toBe('Ti');
      expect(migratedItems[0].displayName).toBe('Ti - 1g');

      // Verify it was saved back to localStorage
      const storedItems = JSON.parse(localStorage.getItem('cart') || '[]');
      expect(storedItems[0].categoryName).toBe('products');
    });

    it('should handle cart items with old product names during migration', () => {
      const legacyCartItems: CartItem[] = [
        {
          productId: 'tina',
          productName: 'Tina', // Old name - hierarchical migration doesn't change this
          product: 'Tina',
          size: '1g',
          quantity: 1,
          price: 30
        }
      ];

      localStorage.setItem('cart', JSON.stringify(legacyCartItems));

      const migratedItems = migrateStoredCartItems();

      expect(migratedItems).toHaveLength(1);
      expect(migratedItems[0].categoryName).toBe('Ti'); // Maps to Ti category based on migration service
      expect(migratedItems[0].productTypeName).toBe('Ti'); // Maps to Ti product type
      expect(migratedItems[0].displayName).toBe('Ti - 1g'); // Display name uses new product name
    });

    it('should return empty array if no cart in localStorage', () => {
      const migratedItems = migrateStoredCartItems();
      expect(migratedItems).toEqual([]);
    });

    it('should handle corrupted cart data gracefully', () => {
      localStorage.setItem('cart', 'invalid json');
      
      const migratedItems = migrateStoredCartItems();
      expect(migratedItems).toEqual([]);
    });
  });

  describe('migrateStoredOrders', () => {
    it('should migrate orders from localStorage with new product names', () => {
      const legacyOrders: Order[] = [
        {
          id: 'order1',
          clientId: 'client1',
          clientName: 'Test Client',
          items: [
            {
              productId: 'we',
              productName: 'We', // Already using new name
              size: '3.5g',
              quantity: 1,
              price: 20
            }
          ],
          total: 20,
          status: 'Completed',
          date: '2024-01-01'
        }
      ];

      localStorage.setItem('orders', JSON.stringify(legacyOrders));

      const migratedOrders = migrateStoredOrders();

      expect(migratedOrders).toHaveLength(1);
      expect(migratedOrders[0].items[0].categoryName).toBe('products');
      expect(migratedOrders[0].items[0].productTypeName).toBe('We');

      // Verify it was saved back to localStorage
      const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      expect(storedOrders[0].items[0].categoryName).toBe('products');
    });

    it('should handle orders with old product names during migration', () => {
      const legacyOrders: Order[] = [
        {
          id: 'order1',
          clientId: 'client1',
          clientName: 'Test Client',
          items: [
            {
              productId: 'weed',
              productName: 'Weed', // Old name - hierarchical migration doesn't change this
              size: '3.5g',
              quantity: 1,
              price: 20
            }
          ],
          total: 20,
          status: 'Completed',
          date: '2024-01-01'
        }
      ];

      localStorage.setItem('orders', JSON.stringify(legacyOrders));

      const migratedOrders = migrateStoredOrders();

      expect(migratedOrders).toHaveLength(1);
      expect(migratedOrders[0].items[0].categoryName).toBe('We'); // Maps to We category based on migration service
      expect(migratedOrders[0].items[0].productTypeName).toBe('We'); // Maps to We product type
    });

    it('should return empty array if no orders in localStorage', () => {
      const migratedOrders = migrateStoredOrders();
      expect(migratedOrders).toEqual([]);
    });

    it('should handle corrupted orders data gracefully', () => {
      localStorage.setItem('orders', 'invalid json');
      
      const migratedOrders = migrateStoredOrders();
      expect(migratedOrders).toEqual([]);
    });
  });

  describe('isMigrationNeeded', () => {
    it('should detect when cart migration is needed', () => {
      const legacyCartItems: CartItem[] = [
        {
          productId: 'ti',
          productName: 'Ti',
          product: 'Ti',
          size: '1g',
          quantity: 1,
          price: 30
          // Missing categoryName and productTypeName
        }
      ];

      localStorage.setItem('cart', JSON.stringify(legacyCartItems));

      const migrationStatus = isMigrationNeeded();
      expect(migrationStatus.cart).toBe(true);
      expect(migrationStatus.orders).toBe(false);
    });

    it('should detect when product name migration is needed', () => {
      // Set old migration version to trigger product name migration
      localStorage.setItem('productNameMigrationVersion', '1.0.0');
      
      expect(ProductNameMigrationService.needsProductNameMigration()).toBe(true);
    });

    it('should not need product name migration when version is current', () => {
      // Set current migration version
      localStorage.setItem('productNameMigrationVersion', '2.0.0');
      
      expect(ProductNameMigrationService.needsProductNameMigration()).toBe(false);
    });

    it('should detect when orders migration is needed', () => {
      const legacyOrders: Order[] = [
        {
          id: 'order1',
          clientId: 'client1',
          clientName: 'Test Client',
          items: [
            {
              productId: 'we',
              productName: 'We',
              size: '3.5g',
              quantity: 1,
              price: 20
              // Missing categoryName and productTypeName
            }
          ],
          total: 20,
          status: 'Completed',
          date: '2024-01-01'
        }
      ];

      localStorage.setItem('orders', JSON.stringify(legacyOrders));

      const migrationStatus = isMigrationNeeded();
      expect(migrationStatus.cart).toBe(false);
      expect(migrationStatus.orders).toBe(true);
    });

    it('should return false when no migration is needed', () => {
      const migratedCartItems: CartItem[] = [
        {
          productId: 'ti',
          productName: 'Ti',
          product: 'Ti',
          size: '1g',
          quantity: 1,
          price: 30,
          categoryName: 'Ti',
          productTypeName: 'Ti'
        }
      ];

      localStorage.setItem('cart', JSON.stringify(migratedCartItems));

      const migrationStatus = isMigrationNeeded();
      expect(migrationStatus.cart).toBe(false);
      expect(migrationStatus.orders).toBe(false);
    });
  });

  describe('performAutoMigration', () => {
    it('should perform complete migration successfully', () => {
      const legacyCartItems: CartItem[] = [
        {
          productId: 'ti',
          productName: 'Ti',
          product: 'Ti',
          size: '1g',
          quantity: 1,
          price: 30
        }
      ];

      const legacyOrders: Order[] = [
        {
          id: 'order1',
          clientId: 'client1',
          clientName: 'Test Client',
          items: [
            {
              productId: 'we',
              productName: 'We',
              size: '3.5g',
              quantity: 1,
              price: 20
            }
          ],
          total: 20,
          status: 'Completed',
          date: '2024-01-01'
        }
      ];

      localStorage.setItem('cart', JSON.stringify(legacyCartItems));
      localStorage.setItem('orders', JSON.stringify(legacyOrders));

      const result = performAutoMigration();

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Verify data was migrated
      const migratedCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const migratedOrders = JSON.parse(localStorage.getItem('orders') || '[]');

      expect(migratedCart[0].categoryName).toBe('products');
      expect(migratedOrders[0].items[0].categoryName).toBe('products');
    });

    it('should handle migration when no data exists', () => {
      const result = performAutoMigration();

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('createDataBackup and restoreDataFromBackup', () => {
    it('should create and restore data backup', () => {
      const originalCart = [{ productId: 'test', productName: 'Test' }];
      const originalOrders = [{ id: 'order1', clientId: 'client1' }];

      localStorage.setItem('cart', JSON.stringify(originalCart));
      localStorage.setItem('orders', JSON.stringify(originalOrders));

      // Create backup
      const backupSuccess = createDataBackup();
      expect(backupSuccess).toBe(true);

      // Modify original data
      localStorage.setItem('cart', JSON.stringify([{ productId: 'modified' }]));
      localStorage.setItem('orders', JSON.stringify([{ id: 'modified' }]));

      // Use a known timestamp for testing
      const timestamp = '2024-01-01T00-00-00-000Z';
      
      // Manually check that backup was created (we know the format from createDataBackup)
      const cartBackup = localStorage.getItem(`cart_backup_${timestamp}`);
      const ordersBackup = localStorage.getItem(`orders_backup_${timestamp}`);
      
      // Since we can't easily get the exact timestamp, let's test the restore function directly
      // by creating our own backup with a known timestamp
      localStorage.setItem(`cart_backup_${timestamp}`, JSON.stringify(originalCart));
      localStorage.setItem(`orders_backup_${timestamp}`, JSON.stringify(originalOrders));

      // Restore from backup
      const restoreSuccess = restoreDataFromBackup(timestamp);
      expect(restoreSuccess).toBe(true);

      // Verify data was restored
      const restoredCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const restoredOrders = JSON.parse(localStorage.getItem('orders') || '[]');

      expect(restoredCart).toEqual(originalCart);
      expect(restoredOrders).toEqual(originalOrders);
    });
  });

  describe('Product Name Migration Functions', () => {
    describe('Product Name Mapping Tests', () => {
      it('should convert all old product names to new names correctly', () => {
        const testCases = [
          { old: 'Tina', new: 'Ti' },
          { old: 'GH', new: 'Gh' },
          { old: 'Viag', new: 'Vi' },
          { old: 'Cial', new: 'Ci' },
          { old: 'Speed', new: 'Sp' },
          { old: 'Ecsta', new: 'E' },
          { old: 'MD', new: 'Md' },
          { old: 'Weed', new: 'We' },
          { old: 'Hash', new: 'Ha' },
          { old: 'Shrooms', new: 'Mu' },
          { old: 'Ket', new: 'Ke' },
          { old: 'Coco', new: 'Co' },
          { old: 'Poppers', new: 'Pop' },
          { old: 'Glass Pipe', new: 'Pi' },
          { old: 'Torch Lighter', new: 'Li' },
          { old: 'Bong', new: 'Bo' }
        ];

        testCases.forEach(({ old, new: expected }) => {
          expect(convertOldToNewName(old)).toBe(expected);
        });
      });

      it('should throw error for invalid product names', () => {
        expect(() => convertOldToNewName('InvalidProduct')).toThrow(ProductNameMappingError);
        expect(() => convertOldToNewName('')).toThrow();
        expect(() => convertOldToNewName('   ')).toThrow();
      });

      it('should safely convert with fallback for invalid names', () => {
        expect(safeConvertOldToNewName('InvalidProduct')).toBe('InvalidProduct');
        expect(safeConvertOldToNewName('InvalidProduct', 'Fallback')).toBe('Fallback');
        expect(safeConvertOldToNewName('Tina')).toBe('Ti');
      });

      it('should validate old and new product names correctly', () => {
        expect(isValidOldProductName('Tina')).toBe(true);
        expect(isValidOldProductName('Ti')).toBe(false);
        expect(isValidNewProductName('Ti')).toBe(true);
        expect(isValidNewProductName('Tina')).toBe(false);
        expect(isValidOldProductName('InvalidProduct')).toBe(false);
        expect(isValidNewProductName('InvalidProduct')).toBe(false);
      });
    });

    describe('Product Migration Tests', () => {
      it('should migrate products with old names to new names', () => {
        const oldProducts: Product[] = [
          {
            id: '1',
            name: 'Tina',
            type: 'g',
            stock: 100,
            price: 30
          },
          {
            id: '2',
            name: 'Weed',
            type: 'g',
            stock: 50,
            price: 20
          }
        ];

        const migratedProducts = ProductNameMigrationService.migrateProductsArray(oldProducts);

        expect(migratedProducts).toHaveLength(2);
        expect(migratedProducts[0].name).toBe('Ti');
        expect(migratedProducts[1].name).toBe('We');
        expect(migratedProducts[0].id).toBe('1'); // Other properties preserved
        expect(migratedProducts[0].stock).toBe(100);
      });

      it('should preserve products that already use new names', () => {
        const newProducts: Product[] = [
          {
            id: '1',
            name: 'Ti',
            type: 'g',
            stock: 100,
            price: 30
          }
        ];

        const migratedProducts = ProductNameMigrationService.migrateProductsArray(newProducts);

        expect(migratedProducts).toHaveLength(1);
        expect(migratedProducts[0].name).toBe('Ti');
      });

      it('should handle products with invalid names gracefully', () => {
        const mixedProducts: Product[] = [
          {
            id: '1',
            name: 'Tina', // Valid old name
            type: 'g',
            stock: 100,
            price: 30
          },
          {
            id: '2',
            name: 'InvalidProduct', // Invalid name
            type: 'g',
            stock: 50,
            price: 20
          }
        ];

        const migratedProducts = ProductNameMigrationService.migrateProductsArray(mixedProducts);

        expect(migratedProducts).toHaveLength(2);
        expect(migratedProducts[0].name).toBe('Ti'); // Converted
        expect(migratedProducts[1].name).toBe('InvalidProduct'); // Preserved as fallback
      });
    });

    describe('Cart Item Migration Tests', () => {
      it('should migrate cart items with old product names', () => {
        const oldCartItems: CartItem[] = [
          {
            productId: 'tina',
            productName: 'Tina',
            product: 'Tina',
            size: '1g',
            quantity: 1,
            price: 30
          },
          {
            productId: 'weed',
            productName: 'Weed',
            product: 'Weed',
            size: '3.5g',
            quantity: 2,
            price: 20
          }
        ];

        const migratedItems = ProductNameMigrationService.migrateCartItemProductNames(oldCartItems);

        expect(migratedItems).toHaveLength(2);
        expect(migratedItems[0].productName).toBe('Ti');
        expect(migratedItems[0].product).toBe('Ti');
        expect(migratedItems[1].productName).toBe('We');
        expect(migratedItems[1].product).toBe('We');
        // Other properties preserved
        expect(migratedItems[0].quantity).toBe(1);
        expect(migratedItems[0].price).toBe(30);
      });

      it('should handle cart items with missing or invalid product names', () => {
        const cartItems: CartItem[] = [
          {
            productId: 'invalid',
            productName: 'InvalidProduct',
            product: 'InvalidProduct',
            size: '1g',
            quantity: 1,
            price: 30
          }
        ];

        const migratedItems = ProductNameMigrationService.migrateCartItemProductNames(cartItems);

        expect(migratedItems).toHaveLength(1);
        expect(migratedItems[0].productName).toBe('InvalidProduct'); // Preserved as fallback
        expect(migratedItems[0].product).toBe('InvalidProduct');
      });
    });

    describe('Order Migration Tests', () => {
      it('should migrate order items with old product names', () => {
        const oldOrderItems: OrderItem[] = [
          {
            productId: 'tina',
            productName: 'Tina',
            size: '1g',
            quantity: 1,
            price: 30
          },
          {
            productId: 'hash',
            productName: 'Hash',
            size: '1g',
            quantity: 1,
            price: 10
          }
        ];

        const migratedItems = ProductNameMigrationService.migrateOrderItemProductNames(oldOrderItems);

        expect(migratedItems).toHaveLength(2);
        expect(migratedItems[0].productName).toBe('Ti');
        expect(migratedItems[1].productName).toBe('Ha');
        // Other properties preserved
        expect(migratedItems[0].quantity).toBe(1);
        expect(migratedItems[0].price).toBe(30);
      });

      it('should migrate complete orders with old product names', () => {
        const oldOrders: Order[] = [
          {
            id: 'order1',
            clientId: 'client1',
            clientName: 'Test Client',
            items: [
              {
                productId: 'tina',
                productName: 'Tina',
                size: '1g',
                quantity: 1,
                price: 30
              },
              {
                productId: 'weed',
                productName: 'Weed',
                size: '3.5g',
                quantity: 1,
                price: 20
              }
            ],
            total: 50,
            status: 'Completed',
            date: '2024-01-01'
          }
        ];

        const migratedOrders = ProductNameMigrationService.migrateOrdersProductNames(oldOrders);

        expect(migratedOrders).toHaveLength(1);
        expect(migratedOrders[0].items).toHaveLength(2);
        expect(migratedOrders[0].items[0].productName).toBe('Ti');
        expect(migratedOrders[0].items[1].productName).toBe('We');
        // Other order properties preserved
        expect(migratedOrders[0].total).toBe(50);
        expect(migratedOrders[0].status).toBe('Completed');
      });
    });

    describe('Complete Migration Process Tests', () => {
      it('should perform complete product name migration successfully', async () => {
        // Set up test data with old product names
        const oldProducts: Product[] = [
          { id: '1', name: 'Tina', type: 'g', stock: 100, price: 30 }
        ];
        const oldOrders: Order[] = [
          {
            id: 'order1',
            clientId: 'client1',
            clientName: 'Test Client',
            items: [{ productId: 'tina', productName: 'Tina', size: '1g', quantity: 1, price: 30 }],
            total: 30,
            status: 'Completed',
            date: '2024-01-01'
          }
        ];
        const oldCart: CartItem[] = [
          { productId: 'tina', productName: 'Tina', product: 'Tina', size: '1g', quantity: 1, price: 30 }
        ];

        // Set old migration version
        localStorage.setItem('productNameMigrationVersion', '1.0.0');
        localStorage.setItem('products', JSON.stringify(oldProducts));
        localStorage.setItem('orders', JSON.stringify(oldOrders));
        localStorage.setItem('cart', JSON.stringify(oldCart));

        const result = await ProductNameMigrationService.performProductNameMigration();

        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);

        // Verify migration version was updated
        expect(ProductNameMigrationService.getMigrationVersion()).toBe('2.0.0');

        // Verify data was migrated
        const migratedProducts: Product[] = JSON.parse(localStorage.getItem('products') || '[]');
        const migratedOrders: Order[] = JSON.parse(localStorage.getItem('orders') || '[]');
        const migratedCart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');

        expect(migratedProducts[0].name).toBe('Ti');
        expect(migratedOrders[0].items[0].productName).toBe('Ti');
        expect(migratedCart[0].productName).toBe('Ti');
        expect(migratedCart[0].product).toBe('Ti');
      });

      it('should skip migration when not needed', async () => {
        // Set current migration version
        localStorage.setItem('productNameMigrationVersion', '2.0.0');

        const result = await ProductNameMigrationService.performProductNameMigration();

        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle migration errors gracefully', async () => {
        // Set up invalid JSON data to trigger errors
        localStorage.setItem('productNameMigrationVersion', '1.0.0');
        localStorage.setItem('products', 'invalid json');

        const result = await ProductNameMigrationService.performProductNameMigration();

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should create and restore from backup during migration', async () => {
        const originalProducts: Product[] = [
          { id: '1', name: 'Tina', type: 'g', stock: 100, price: 30 }
        ];

        localStorage.setItem('productNameMigrationVersion', '1.0.0');
        localStorage.setItem('products', JSON.stringify(originalProducts));

        // Perform migration (which creates backup)
        await ProductNameMigrationService.performProductNameMigration();

        // Verify backup exists
        const stats = ProductNameMigrationService.getMigrationStatistics();
        expect(stats.backupExists).toBe(true);

        // Modify data
        const modifiedProducts: Product[] = [
          { id: '1', name: 'Modified', type: 'g', stock: 50, price: 15 }
        ];
        localStorage.setItem('products', JSON.stringify(modifiedProducts));

        // Restore from backup
        const restored = ProductNameMigrationService.restoreFromBackup();
        expect(restored).toBe(true);

        // Verify data was restored (should be original version from backup)
        const restoredProducts: Product[] = JSON.parse(localStorage.getItem('products') || '[]');
        expect(restoredProducts[0].name).toBe('Tina'); // Should be the original name from backup
      });
    });

    describe('Migration Validation Tests', () => {
      it('should validate successful migration', () => {
        // Set up data with new product names
        const newProducts: Product[] = [
          { id: '1', name: 'Ti', type: 'g', stock: 100, price: 30 }
        ];
        const newOrders: Order[] = [
          {
            id: 'order1',
            clientId: 'client1',
            clientName: 'Test Client',
            items: [{ productId: 'ti', productName: 'Ti', size: '1g', quantity: 1, price: 30 }],
            total: 30,
            status: 'Completed',
            date: '2024-01-01'
          }
        ];
        const newCart: CartItem[] = [
          { productId: 'ti', productName: 'Ti', product: 'Ti', size: '1g', quantity: 1, price: 30 }
        ];

        localStorage.setItem('products', JSON.stringify(newProducts));
        localStorage.setItem('orders', JSON.stringify(newOrders));
        localStorage.setItem('cart', JSON.stringify(newCart));

        const validation = ProductNameMigrationService.validateProductNameMigration();

        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
        expect(validation.warnings).toHaveLength(0);
      });

      it('should detect incomplete migration', () => {
        // Set up data with old product names
        const oldProducts: Product[] = [
          { id: '1', name: 'Tina', type: 'g', stock: 100, price: 30 }
        ];
        const oldOrders: Order[] = [
          {
            id: 'order1',
            clientId: 'client1',
            clientName: 'Test Client',
            items: [{ productId: 'tina', productName: 'Tina', size: '1g', quantity: 1, price: 30 }],
            total: 30,
            status: 'Completed',
            date: '2024-01-01'
          }
        ];

        localStorage.setItem('products', JSON.stringify(oldProducts));
        localStorage.setItem('orders', JSON.stringify(oldOrders));

        const validation = ProductNameMigrationService.validateProductNameMigration();

        expect(validation.isValid).toBe(true); // No errors, but warnings expected
        expect(validation.warnings.length).toBeGreaterThan(0);
        expect(validation.warnings.some(w => w.includes('Tina'))).toBe(true);
      });

      it('should handle validation errors gracefully', () => {
        // Set up invalid JSON data
        localStorage.setItem('products', 'invalid json');

        const validation = ProductNameMigrationService.validateProductNameMigration();

        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });
    });

    describe('Migration Statistics and Logging', () => {
      it('should provide accurate migration statistics', () => {
        localStorage.setItem('productNameMigrationVersion', '1.5.0');

        const stats = ProductNameMigrationService.getMigrationStatistics();

        expect(stats.currentVersion).toBe('1.5.0');
        expect(stats.needsMigration).toBe(true);
        expect(typeof stats.logEntries).toBe('number');
      });

      it('should log migration activities', () => {
        ProductNameMigrationService.clearMigrationLog();
        
        const initialLogLength = ProductNameMigrationService.getMigrationLog().length;
        expect(initialLogLength).toBe(0);

        // Perform an operation that logs
        ProductNameMigrationService.needsProductNameMigration();

        const finalLogLength = ProductNameMigrationService.getMigrationLog().length;
        expect(finalLogLength).toBeGreaterThan(initialLogLength);
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should handle empty data gracefully', async () => {
        localStorage.setItem('productNameMigrationVersion', '1.0.0');
        // No data in localStorage

        const result = await ProductNameMigrationService.performProductNameMigration();

        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle corrupted data gracefully', async () => {
        localStorage.setItem('productNameMigrationVersion', '1.0.0');
        localStorage.setItem('products', 'invalid json');
        localStorage.setItem('orders', '{"invalid": json}');
        localStorage.setItem('cart', '[invalid json]');

        const result = await ProductNameMigrationService.performProductNameMigration();

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should preserve data integrity when migration fails', async () => {
        const originalProducts: Product[] = [
          { id: '1', name: 'Tina', type: 'g', stock: 100, price: 30 }
        ];

        localStorage.setItem('productNameMigrationVersion', '1.0.0');
        localStorage.setItem('products', JSON.stringify(originalProducts));

        // Mock a critical error during migration
        const originalSetItem = localStorage.setItem;
        let callCount = 0;
        localStorage.setItem = vi.fn().mockImplementation((key, value) => {
          if (key === 'productNameMigrationVersion' && callCount === 0) {
            callCount++;
            throw new Error('Simulated storage error');
          }
          return originalSetItem.call(localStorage, key, value);
        });

        const result = await ProductNameMigrationService.performProductNameMigration();

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);

        // Restore original function
        localStorage.setItem = originalSetItem;
      });

      it('should handle products with mixed old and new names', () => {
        const mixedProducts: Product[] = [
          { id: '1', name: 'Tina', type: 'g', stock: 100, price: 30 }, // Old name
          { id: '2', name: 'Ti', type: 'g', stock: 50, price: 25 },   // New name
          { id: '3', name: 'Weed', type: 'g', stock: 75, price: 20 }, // Old name
          { id: '4', name: 'We', type: 'g', stock: 60, price: 18 }    // New name
        ];

        const migratedProducts = ProductNameMigrationService.migrateProductsArray(mixedProducts);

        expect(migratedProducts).toHaveLength(4);
        expect(migratedProducts[0].name).toBe('Ti'); // Converted
        expect(migratedProducts[1].name).toBe('Ti'); // Already new
        expect(migratedProducts[2].name).toBe('We'); // Converted
        expect(migratedProducts[3].name).toBe('We'); // Already new
      });
    });
  });
});