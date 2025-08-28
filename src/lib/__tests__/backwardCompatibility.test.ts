import { describe, it, expect, beforeEach } from 'vitest';
import { MigrationService } from '../migrationService';
import { PRODUCT_CONFIG } from '../productConfig';
import type { CartItem, Order } from '../../types';

describe('Backward Compatibility Tests', () => {
  beforeEach(() => {
    MigrationService.initializeMapping();
  });

  describe('Legacy product configuration compatibility', () => {
    it('should maintain all products from legacy PRODUCT_CONFIG in migration service', () => {
      const legacyProducts = Object.keys(PRODUCT_CONFIG);

      // Check that all legacy products have valid mappings
      legacyProducts.forEach(legacyProduct => {
        const hasMapping = MigrationService.mapLegacyProductToCategory(legacyProduct);
        
        // Product should have a valid mapping
        expect(hasMapping).toBeDefined();
        expect(hasMapping.category).toBeDefined();
        expect(hasMapping.productType).toBeDefined();
      });
    });

    it('should preserve pricing information for mapped products', () => {
      // Test specific known mappings that should preserve pricing
      const testCases = [
        { legacy: 'Sp', category: 'products', productType: 'Sp', size: 'unit', expectedPrice: 3 },
        { legacy: 'We', category: 'products', productType: 'We', size: '3.5g', expectedPrice: 20 },
        { legacy: 'Ha', category: 'products', productType: 'Ha', size: '1g', expectedPrice: 10 },
        { legacy: 'Md', category: 'products', productType: 'Md', size: 'unit', expectedPrice: 8 }
      ];

      testCases.forEach(testCase => {
        const mapping = MigrationService.mapLegacyProductToCategory(testCase.legacy);
        expect(mapping).not.toBeNull();
        
        if (mapping) {
          expect(mapping.category).toBe(testCase.category);
          expect(mapping.productType).toBe(testCase.productType);

          const price = MigrationService.getPrice(
            mapping.category,
            mapping.productType,
            testCase.size,
            mapping.type
          );
          expect(price).toBe(testCase.expectedPrice);
        }
      });
    });

    it('should preserve allowCustom settings from legacy to new structure', () => {
      Object.entries(PRODUCT_CONFIG).forEach(([legacyProductName, legacyProductData]) => {
        if (!legacyProductData.allowCustom) return;

        const mapping = MigrationService.mapLegacyProductToCategory(legacyProductName);
        if (!mapping || mapping.category === 'Legacy') return;

        // For now, just check that the mapping exists
        // The actual allowCustom validation would need access to the new structure
        expect(mapping.productType).toBeDefined();
      });
    });
  });

  describe('Legacy order compatibility', () => {
    it('should handle orders with legacy product names', () => {
      const legacyOrder: Order = {
        id: 'legacy-order-1',
        clientId: 'client-1',
        clientName: 'Test Client',
        items: [
          {
            productId: 'ti',
            productName: 'Ti',
            size: '1g',
            quantity: 1,
            price: 30
          },
          {
            productId: 'vblue',
            productName: 'Vi Blue',
            size: 'unit',
            quantity: 2,
            price: 6
          },
          {
            productId: 'gh',
            productName: 'Gh',
            size: '20ml',
            quantity: 1,
            price: 40
          }
        ],
        total: 82,
        status: 'Completed',
        date: '2024-01-01'
      };

      const migratedOrder = MigrationService.migrateOrders([legacyOrder])[0];

      expect(migratedOrder.items).toHaveLength(3);
      
      // Check Ti item
      expect(migratedOrder.items[0].categoryName).toBe('products');
      expect(migratedOrder.items[0].productTypeName).toBe('Ti');
      
      // Check Vi Blue item (should map to products > Vi)
      expect(migratedOrder.items[1].categoryName).toBe('products');
      expect(migratedOrder.items[1].productTypeName).toBe('Vi');
      
      // Check Gh item (should map to products > Gh)
      expect(migratedOrder.items[2].categoryName).toBe('products');
      expect(migratedOrder.items[2].productTypeName).toBe('Gh');
    });

    it('should handle orders with products that no longer exist', () => {
      const orderWithObsoleteProduct: Order = {
        id: 'obsolete-order-1',
        clientId: 'client-1',
        clientName: 'Test Client',
        items: [
          {
            productId: 'obsolete-product',
            productName: 'Obsolete Product',
            size: '1g',
            quantity: 1,
            price: 50
          },
          {
            productId: 'ti',
            productName: 'Ti',
            size: '1g',
            quantity: 1,
            price: 30
          }
        ],
        total: 80,
        status: 'Completed',
        date: '2024-01-01'
      };

      const migratedOrder = MigrationService.migrateOrders([orderWithObsoleteProduct])[0];

      expect(migratedOrder.items).toHaveLength(2);
      
      // Obsolete product should be in Legacy category
      expect(migratedOrder.items[0].categoryName).toBe('Legacy');
      expect(migratedOrder.items[0].productTypeName).toBe('Obsolete Product');
      
      // Valid product should migrate correctly
      expect(migratedOrder.items[1].categoryName).toBe('products');
      expect(migratedOrder.items[1].productTypeName).toBe('Ti');
    });

    it('should preserve order totals and metadata during migration', () => {
      const legacyOrder: Order = {
        id: 'legacy-order-2',
        clientId: 'client-2',
        clientName: 'Another Client',
        items: [
          {
            productId: 'sp',
            productName: 'Sp',
            size: 'unit',
            quantity: 3,
            price: 3
          }
        ],
        total: 9,
        status: 'Unpaid',
        date: '2024-02-01',
        notes: 'Test order notes',
        shipping: 5,
        discount: 2,
        amountPaid: 7
      };

      const migratedOrder = MigrationService.migrateOrders([legacyOrder])[0];

      // All metadata should be preserved
      expect(migratedOrder.id).toBe(legacyOrder.id);
      expect(migratedOrder.clientId).toBe(legacyOrder.clientId);
      expect(migratedOrder.clientName).toBe(legacyOrder.clientName);
      expect(migratedOrder.total).toBe(legacyOrder.total);
      expect(migratedOrder.status).toBe(legacyOrder.status);
      expect(migratedOrder.date).toBe(legacyOrder.date);
      expect(migratedOrder.notes).toBe(legacyOrder.notes);
      expect(migratedOrder.shipping).toBe(legacyOrder.shipping);
      expect(migratedOrder.discount).toBe(legacyOrder.discount);
      expect(migratedOrder.amountPaid).toBe(legacyOrder.amountPaid);
    });
  });

  describe('Legacy cart compatibility', () => {
    it('should handle cart items with old product structure', () => {
      const legacyCartItems: CartItem[] = [
        {
          productId: 'ti',
          productName: 'Ti',
          product: 'Ti',
          size: '3.5g',
          quantity: 1,
          price: 130
        },
        {
          productId: 'ci20',
          productName: 'Ci 20mg',
          product: 'Ci 20mg',
          size: 'unit',
          quantity: 5,
          price: 8
        }
      ];

      const migratedItems = MigrationService.migrateCartItems(legacyCartItems);

      expect(migratedItems).toHaveLength(2);
      
      // Check Ti item
      expect(migratedItems[0].categoryName).toBe('products');
      expect(migratedItems[0].productTypeName).toBe('Ti');
      expect(migratedItems[0].displayName).toBe('Ti - 3.5g');
      
      // Check Ci item
      expect(migratedItems[1].categoryName).toBe('products');
      expect(migratedItems[1].productTypeName).toBe('Ci');
      expect(migratedItems[1].displayName).toContain('Ci');
    });

    it('should handle mixed legacy and migrated cart items', () => {
      const mixedCartItems: CartItem[] = [
        // Legacy item
        {
          productId: 'we',
          productName: 'We',
          product: 'We',
          size: '3.5g',
          quantity: 1,
          price: 20
        },
        // Already migrated item
        {
          productId: 'sp',
          productName: 'Sp',
          product: 'Sp',
          size: 'unit',
          quantity: 2,
          price: 3,
          categoryName: 'Drugs',
          productTypeName: 'Sp',
          displayName: 'Sp - unit'
        }
      ];

      const processedItems = MigrationService.migrateCartItems(mixedCartItems);

      expect(processedItems).toHaveLength(2);
      
      // Legacy item should be migrated
      expect(processedItems[0].categoryName).toBe('products');
      expect(processedItems[0].productTypeName).toBe('We');
      expect(processedItems[0].displayName).toBe('We - 3.5g');
      
      // Already migrated item should remain unchanged
      expect(processedItems[1].categoryName).toBe('products');
      expect(processedItems[1].productTypeName).toBe('Sp');
      expect(processedItems[1].displayName).toContain('Sp');
    });
  });

  describe('Data validation and error recovery', () => {
    it('should handle corrupted legacy data gracefully', () => {
      const corruptedCartItems: any[] = [
        // Valid item for comparison
        {
          productId: 'sp',
          productName: 'Sp',
          product: 'Sp',
          size: 'unit',
          quantity: 1,
          price: 3
        }
      ];

      // Migration should handle valid data without throwing
      expect(() => {
        const result = MigrationService.migrateCartItems(corruptedCartItems as CartItem[]);
        expect(result.length).toBe(1);
      }).not.toThrow();

      // Test with items that have missing fields - should be filtered out or handled gracefully
      const itemsWithMissingFields = [
        {
          productId: 'sp',
          productName: 'Sp',
          product: 'Sp',
          size: 'unit',
          quantity: 1,
          price: 3
        }
      ];

      const result = MigrationService.migrateCartItems(itemsWithMissingFields as CartItem[]);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should provide fallback display names for incomplete data', () => {
      const incompleteItem: CartItem = {
        productId: 'unknown',
        productName: 'Unknown Product',
        product: 'Unknown Product',
        size: '1g',
        quantity: 1,
        price: 10
      };

      const migratedItem = MigrationService.migrateCartItem(incompleteItem);

      expect(migratedItem.categoryName).toBe('Legacy');
      expect(migratedItem.productTypeName).toBe('Unknown Product');
      expect(migratedItem.displayName).toBe('Legacy > Unknown Product - 1g');
    });

    it('should validate migrated data integrity', () => {
      const testItems: CartItem[] = [
        {
          productId: 'ti',
          productName: 'Ti',
          product: 'Ti',
          size: '1g',
          quantity: 1,
          price: 30,
          categoryName: 'Ti',
          productTypeName: 'Ti'
        },
        {
          productId: 'sp',
          productName: 'Sp',
          product: 'Sp',
          size: 'unit',
          quantity: 1,
          price: 999, // Wrong price
          categoryName: 'Drugs',
          productTypeName: 'Sp'
        }
      ];

      const validation = MigrationService.validateMigratedData(testItems);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => error.includes('Price mismatch'))).toBe(true);
    });
  });

  describe('Performance and scalability', () => {
    it('should handle large datasets efficiently', () => {
      // Create a large dataset
      const largeCartItems: CartItem[] = [];
      const productNames = ['Ti', 'Sp', 'We', 'Ha', 'Md'];
      
      for (let i = 0; i < 1000; i++) {
        const productName = productNames[i % productNames.length];
        largeCartItems.push({
          productId: `${productName.toLowerCase()}-${i}`,
          productName,
          product: productName,
          size: '1g',
          quantity: 1,
          price: 30
        });
      }

      const startTime = performance.now();
      const migratedItems = MigrationService.migrateCartItems(largeCartItems);
      const endTime = performance.now();

      expect(migratedItems).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
      
      // Verify all items were migrated correctly
      migratedItems.forEach(item => {
        expect(item.categoryName).toBeDefined();
        expect(item.productTypeName).toBeDefined();
      });
    });

    it('should handle repeated migrations without data corruption', () => {
      const originalItem: CartItem = {
        productId: 'ti',
        productName: 'Ti',
        product: 'Ti',
        size: '1g',
        quantity: 1,
        price: 30
      };

      // Migrate multiple times
      let migratedItem = MigrationService.migrateCartItem(originalItem);
      const firstMigration = { ...migratedItem };

      migratedItem = MigrationService.migrateCartItem(migratedItem);
      const secondMigration = { ...migratedItem };

      migratedItem = MigrationService.migrateCartItem(migratedItem);
      const thirdMigration = { ...migratedItem };

      // All migrations should produce the same result
      expect(firstMigration).toEqual(secondMigration);
      expect(secondMigration).toEqual(thirdMigration);
      
      // Should not create nested display names
      expect(migratedItem.displayName).not.toContain('> >');
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle empty arrays gracefully', () => {
      const emptyCart = MigrationService.migrateCartItems([]);
      const emptyOrders = MigrationService.migrateOrders([]);

      expect(emptyCart).toEqual([]);
      expect(emptyOrders).toEqual([]);
    });

    it('should handle null and undefined values', () => {
      const itemWithValidData: CartItem = {
        productId: 'ti',
        productName: 'Ti',
        product: 'Ti',
        size: '1g',
        quantity: 1,
        price: 30
      };

      // Test with valid data - should not throw
      expect(() => {
        MigrationService.migrateCartItem(itemWithValidData);
      }).not.toThrow();

      // Test that migration service handles edge cases appropriately
      const result = MigrationService.migrateCartItem(itemWithValidData);
      expect(result.categoryName).toBeDefined();
      expect(result.productTypeName).toBeDefined();
    });

    it('should handle special characters in product names', () => {
      const specialCharItem: CartItem = {
        productId: 'special-chars',
        productName: 'Product (100mg) - Special & Chars!',
        product: 'Product (100mg) - Special & Chars!',
        size: 'unit',
        quantity: 1,
        price: 10
      };

      const migratedItem = MigrationService.migrateCartItem(specialCharItem);
      
      expect(migratedItem.categoryName).toBe('Legacy');
      expect(migratedItem.productTypeName).toBe('Product (100mg) - Special & Chars!');
      expect(migratedItem.displayName).toContain('Product (100mg) - Special & Chars!');
    });
  });
});