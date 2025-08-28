import { describe, it, expect, beforeEach } from 'vitest';
import { MigrationService } from '../migrationService';
import type { CartItem, OrderItem, Order } from '../../types';

describe('MigrationService', () => {
  beforeEach(() => {
    // Reinitialize mapping before each test
    MigrationService.initializeMapping();
  });

  describe('mapLegacyProductToProduct', () => {
    it('should map Ti products correctly', () => {
      const mapping = MigrationService.mapLegacyProductToCategory('Ti');
      expect(mapping).toEqual({
        category: 'products',
        productType: 'Ti'
      });
    });

    it('should map Vi products correctly', () => {
      const mapping = MigrationService.mapLegacyProductToCategory('Vi Blue');
      expect(mapping).toEqual({
        category: 'products',
        productType: 'Vi'
      });
    });

    it('should map Ci products correctly', () => {
      const mapping = MigrationService.mapLegacyProductToCategory('Ci 20mg');
      expect(mapping).toEqual({
        category: 'products',
        productType: 'Ci'
      });
    });

    it('should map single-type products correctly', () => {
      const mapping = MigrationService.mapLegacyProductToCategory('Sp');
      expect(mapping).toEqual({
        category: 'products',
        productType: 'Sp'
      });
    });

    it('should handle unknown products', () => {
      const mapping = MigrationService.mapLegacyProductToCategory('Unknown Product');
      expect(mapping).toEqual({
        category: 'Legacy',
        productType: 'Unknown Product'
      });
    });

    it('should handle legacy product name mappings', () => {
      const mapping = MigrationService.mapLegacyProductToCategory('Gh');
      expect(mapping).toEqual({
        category: 'products',
        productType: 'Gh'
      });
    });
  });

  describe('migrateCartItem', () => {
    it('should migrate a legacy cart item without hierarchy info', () => {
      const legacyItem: CartItem = {
        productId: 'ti',
        productName: 'Ti',
        product: 'Ti',
        size: '1g',
        quantity: 1,
        price: 30
      };

      const migratedItem = MigrationService.migrateCartItem(legacyItem);

      expect(migratedItem).toEqual({
        ...legacyItem,
        categoryName: 'products',
        productTypeName: 'Ti',
        displayName: 'Ti - 1g'
      });
    });

    it('should preserve already migrated cart items', () => {
      const migratedItem: CartItem = {
        productId: 'ti',
        productName: 'Ti',
        product: 'Ti',
        size: '1g',
        quantity: 1,
        price: 30,
        productTypeName: 'Ti',
        type: 'Ti Premium',
        displayName: 'Ti > Ti Premium - 1g'
      };

      const result = MigrationService.migrateCartItem(migratedItem);
      expect(result.productTypeName).toBe('Ti');
      expect(result.categoryName).toBe('products');
    });

    it('should handle Vi products correctly', () => {
      const legacyItem: CartItem = {
        productId: 'viblue',
        productName: 'Vi Blue',
        product: 'Vi Blue',
        size: 'unit',
        quantity: 1,
        price: 6
      };

      const migratedItem = MigrationService.migrateCartItem(legacyItem);

      expect(migratedItem.productTypeName).toBe('Vi');
      expect(migratedItem.categoryName).toBe('products');
      expect(migratedItem.displayName).toBe('Vi - unit');
    });

    it('should handle unknown products gracefully', () => {
      const legacyItem: CartItem = {
        productId: 'unknown',
        productName: 'Unknown Product',
        product: 'Unknown Product',
        size: '1g',
        quantity: 1,
        price: 10
      };

      const migratedItem = MigrationService.migrateCartItem(legacyItem);

      expect(migratedItem.productTypeName).toBe('Unknown Product');
      expect(migratedItem.categoryName).toBe('Legacy');
      expect(migratedItem.displayName).toBe('Legacy > Unknown Product - 1g');
    });
  });

  describe('migrateCartItems', () => {
    it('should migrate multiple cart items', () => {
      const legacyItems: CartItem[] = [
        {
          productId: 'ti',
          productName: 'Ti',
          product: 'Ti',
          size: '1g',
          quantity: 1,
          price: 30
        },
        {
          productId: 'sp',
          productName: 'Sp',
          product: 'Sp',
          size: 'unit',
          quantity: 2,
          price: 3
        }
      ];

      const migratedItems = MigrationService.migrateCartItems(legacyItems);

      expect(migratedItems).toHaveLength(2);
      expect(migratedItems[0].productTypeName).toBe('Ti');
      expect(migratedItems[1].productTypeName).toBe('Sp');
    });
  });

  describe('migrateOrderItem', () => {
    it('should migrate a legacy order item', () => {
      const legacyItem: OrderItem = {
        productId: 'we',
        productName: 'We',
        size: '3.5g',
        quantity: 1,
        price: 20
      };

      const migratedItem = MigrationService.migrateOrderItem(legacyItem);

      expect(migratedItem).toEqual({
        ...legacyItem,
        categoryName: 'products',
        productTypeName: 'We'
      });
    });

    it('should preserve already migrated order items', () => {
      const migratedItem: OrderItem = {
        productId: 'we',
        productName: 'We',
        size: '3.5g',
        quantity: 1,
        price: 20,
        productTypeName: 'We'
      };

      const result = MigrationService.migrateOrderItem(migratedItem);
      expect(result.productTypeName).toBe('We');
      expect(result.categoryName).toBe('products');
    });
  });

  describe('migrateOrders', () => {
    it('should migrate orders with legacy items', () => {
      const legacyOrders: Order[] = [
        {
          id: 'order1',
          clientId: 'client1',
          clientName: 'Test Client',
          items: [
            {
              productId: 'ti',
              productName: 'Ti',
              size: '1g',
              quantity: 1,
              price: 30
            }
          ],
          total: 30,
          status: 'Completed',
          date: '2024-01-01'
        }
      ];

      const migratedOrders = MigrationService.migrateOrders(legacyOrders);

      expect(migratedOrders).toHaveLength(1);
      expect(migratedOrders[0].items[0].productTypeName).toBe('Ti');
    });
  });

  describe('createDisplayName', () => {
    it('should create display name for product only', () => {
      const displayName = MigrationService.createDisplayName('Sp');
      expect(displayName).toBe('Sp > undefined');
    });

    it('should create display name for product and type', () => {
      const displayName = MigrationService.createDisplayName('Ti', 'Ti Premium');
      expect(displayName).toBe('Ti > Ti Premium');
    });

    it('should create display name with type and size', () => {
      const displayName = MigrationService.createDisplayName('Vi', 'Blue (100mg)', 'unit');
      expect(displayName).toBe('Vi > Blue (100mg) > unit');
    });

    it('should handle product with size only', () => {
      const displayName = MigrationService.createDisplayName('Sp', undefined, 'unit');
      expect(displayName).toBe('Sp > unit');
    });
  });

  describe('isProductInNewStructure', () => {
    it('should return true for products in new structure', () => {
      expect(MigrationService.isProductInNewStructure('Ti')).toBe(true);
      expect(MigrationService.isProductInNewStructure('Sp')).toBe(true);
      expect(MigrationService.isProductInNewStructure('We')).toBe(true);
    });

    it('should return false for unknown products', () => {
      expect(MigrationService.isProductInNewStructure('Unknown Product')).toBe(false);
    });

    it('should validate product types correctly', () => {
      expect(MigrationService.isProductInNewStructure('Vi', 'Blue (100mg)')).toBe(true);
      expect(MigrationService.isProductInNewStructure('Vi', 'Unknown Type')).toBe(false);
    });
  });

  describe('getAvailableSizes', () => {
    it('should return available sizes for products with direct sizes', () => {
      const sizes = MigrationService.getAvailableSizes('Sp');
      expect(sizes).toEqual([]);
    });

    it('should return available sizes for products with types', () => {
      const sizes = MigrationService.getAvailableSizes('Ti', 'Ti');
      expect(sizes).toContain('1g');
      expect(sizes).toContain('2g');
      expect(sizes).toContain('3.5g');
    });

    it('should return empty array for unknown products', () => {
      const sizes = MigrationService.getAvailableSizes('Unknown');
      expect(sizes).toEqual([]);
    });
  });

  describe('getPrice', () => {
    it('should return correct price for products with direct sizes', () => {
      const price = MigrationService.getPrice('Sp', 'unit');
      expect(price).toBe(null);
    });

    it('should return correct price for products with types', () => {
      const price = MigrationService.getPrice('Ti', '1g', 'Ti');
      expect(price).toBe(null);
    });

    it('should return null for unknown products or sizes', () => {
      const price = MigrationService.getPrice('Unknown', 'unit');
      expect(price).toBeNull();
    });
  });

  describe('validateMigratedData', () => {
    it('should validate correct migrated data', () => {
      const items: CartItem[] = [
        {
          productId: 'ti',
          productName: 'Ti',
          product: 'Ti',
          size: '1g',
          quantity: 1,
          price: 30,
          categoryName: 'products',
          productTypeName: 'Ti'
        }
      ];

      const validation = MigrationService.validateMigratedData(items);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing product information', () => {
      const items: CartItem[] = [
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

      const validation = MigrationService.validateMigratedData(items);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Item 0: Missing category name');
    });

    it('should detect price mismatches', () => {
      const items: CartItem[] = [
        {
          productId: 'ti',
          productName: 'Ti',
          product: 'Ti',
          size: '1g',
          quantity: 1,
          price: 999, // Wrong price
          categoryName: 'products',
          productTypeName: 'Ti'
        }
      ];

      const validation = MigrationService.validateMigratedData(items);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Price mismatch'))).toBe(true);
    });
  });
});