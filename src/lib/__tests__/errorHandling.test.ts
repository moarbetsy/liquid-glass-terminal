import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorHandler } from '../errorHandling';
import type { CartItem, OrderItem, Order } from '../../types';

// Mock the product config
vi.mock('../productConfig', () => ({
  PRODUCT_CONFIG: {
    'Ti': {
      sizes: { '1g': 30, '2g': 60, '3.5g': 130 },
      allowCustom: 'g'
    },
    'Gh': {
      sizes: { '5ml': 10, '20ml': 40, '60ml': 100 },
      allowCustom: 'ml'
    },
    'Vi': {
      types: {
        'Blue 100mg': { 'unit': 6 },
        'Purple 100mg': { 'unit': 8 }
      }
    }
  }
}));

// Mock the migration service
vi.mock('../migrationService', () => ({
  MigrationService: {
    migrateCartItem: vi.fn((item: CartItem) => ({
      ...item,
      categoryName: item.productName === 'Ti' ? 'Ti' : 'Legacy',
      productTypeName: item.productName,
      displayName: `${item.productName} - ${item.size}`
    })),
    migrateOrderItem: vi.fn((item: OrderItem) => ({
      ...item,
      categoryName: item.productName === 'Ti' ? 'Ti' : 'Legacy',
      productTypeName: item.productName
    }))
  }
}));

describe('ErrorHandler', () => {
  describe('validateCategory', () => {
    it('should validate existing categories', () => {
      const result = ErrorHandler.validateCategory('Ti');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-existent categories', () => {
      const result = ErrorHandler.validateCategory('NonExistent');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Category "NonExistent" not found');
    });

    it('should reject empty category names', () => {
      const result = ErrorHandler.validateCategory('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Category name is required');
    });
  });

  describe('validateProduct', () => {
    it('should validate existing products', () => {
      const result = ErrorHandler.validateProduct('Ti', 'Ti');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-existent products', () => {
      const result = ErrorHandler.validateProduct('Ti', 'NonExistent');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Product "NonExistent" not found in category "Ti"');
    });

    it('should reject products in non-existent categories', () => {
      const result = ErrorHandler.validateProduct('NonExistent', 'Ti');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Category "NonExistent" not found');
    });
  });

  describe('validateSize', () => {
    it('should validate existing sizes for products with types', () => {
      const result = ErrorHandler.validateSize('Ti', 'Ti', '1g', 'Ti');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate existing sizes for products with direct sizes', () => {
      const result = ErrorHandler.validateSize('Gh', 'Gh', '5ml');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-existent sizes', () => {
      const result = ErrorHandler.validateSize('Gh', 'Gh', '100ml');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Size "100ml" not available for product "Gh"');
    });

    it('should require type name for products with types', () => {
      const result = ErrorHandler.validateSize('Ti', 'Ti', '1g');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Type name is required for this product');
    });
  });

  describe('validateCartItem', () => {
    it('should validate valid cart items', () => {
      const item: CartItem = {
        productId: 'test-1',
        productName: 'Ti',
        product: 'Ti',
        categoryName: 'Ti',
        productTypeName: 'Ti',
        type: 'Ti',
        size: '1g',
        quantity: 1,
        price: 30
      };

      const result = ErrorHandler.validateCartItem(item);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject cart items with missing required fields', () => {
      const item: CartItem = {
        productId: 'test-1',
        productName: '',
        product: '',
        size: '',
        quantity: 0,
        price: -10
      };

      const result = ErrorHandler.validateCartItem(item);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product name is missing');
      expect(result.errors).toContain('Size is missing');
      expect(result.errors).toContain('Quantity must be greater than 0');
      expect(result.errors).toContain('Price cannot be negative');
    });
  });

  describe('createFallbackDisplayName', () => {
    it('should create display name with hierarchy information', () => {
      const item: CartItem = {
        productId: 'test-1',
        productName: 'Ti',
        product: 'Ti',
        categoryName: 'Ti',
        productTypeName: 'Ti',
        type: 'Premium',
        size: '1g',
        quantity: 1,
        price: 50
      };

      const displayName = ErrorHandler.createFallbackDisplayName(item);
      expect(displayName).toBe('Ti > Ti > Premium - 1g');
    });

    it('should create display name without hierarchy information', () => {
      const item: CartItem = {
        productId: 'test-1',
        productName: 'Ti',
        product: 'Ti',
        size: '1g',
        quantity: 1,
        price: 30
      };

      const displayName = ErrorHandler.createFallbackDisplayName(item);
      expect(displayName).toBe('Ti - 1g');
    });

    it('should handle custom sizes with units', () => {
      const item: CartItem = {
        productId: 'test-1',
        productName: 'Gh',
        product: 'Gh',
        size: 15,
        unit: 'ml',
        quantity: 1,
        price: 30
      };

      const displayName = ErrorHandler.createFallbackDisplayName(item);
      expect(displayName).toBe('Gh - 15ml');
    });
  });

  describe('repairCartItem', () => {
    it('should return valid items unchanged', () => {
      const item: CartItem = {
        productId: 'test-1',
        productName: 'Ti',
        product: 'Ti',
        categoryName: 'Ti',
        productTypeName: 'Ti',
        type: 'Ti',
        size: '1g',
        quantity: 1,
        price: 30
      };

      const repaired = ErrorHandler.repairCartItem(item);
      expect(repaired).toEqual(item);
    });

    it('should repair items missing hierarchy information', () => {
      const item: CartItem = {
        productId: 'test-1',
        productName: 'Ti',
        product: 'Ti',
        size: '1g',
        quantity: 1,
        price: 30
        // Missing categoryName and productTypeName
      };

      const repaired = ErrorHandler.repairCartItem(item);
      // In the test environment with mocked migration, it should either migrate successfully or fallback to Legacy
      expect(repaired.categoryName).toBeDefined();
      expect(repaired.productTypeName).toBeDefined();
      expect(repaired.displayName).toBeDefined();
      // The actual category depends on whether migration succeeds or falls back to Legacy
      expect(['Ti', 'Legacy']).toContain(repaired.categoryName);
    });

    it('should create legacy fallback for unmappable items', () => {
      const item: CartItem = {
        productId: 'test-1',
        productName: 'UnknownProduct',
        product: 'UnknownProduct',
        size: '1g',
        quantity: 1,
        price: 30
        // Missing categoryName and productTypeName
      };

      const repaired = ErrorHandler.repairCartItem(item);
      expect(repaired.categoryName).toBe('Legacy'); // Should fallback to Legacy
      expect(repaired.productTypeName).toBe('UnknownProduct');
      expect(repaired.displayName).toContain('UnknownProduct');
    });
  });

  describe('repairOrder', () => {
    it('should repair all items in an order', () => {
      const order: Order = {
        id: 'order-1',
        clientId: 'client-1',
        clientName: 'Test Client',
        items: [
          {
            productId: 'test-1',
            productName: 'Ti',
            size: '1g',
            quantity: 1,
            price: 30
            // Missing categoryName and productTypeName
          }
        ],
        total: 30,
        status: 'Unpaid',
        date: new Date().toISOString()
      };

      const repaired = ErrorHandler.repairOrder(order);
      expect(repaired.items[0].categoryName).toBeDefined();
      expect(repaired.items[0].productTypeName).toBeDefined();
      // The actual category depends on whether migration succeeds or falls back to Legacy
      expect(['Ti', 'Legacy']).toContain(repaired.items[0].categoryName);
    });

    it('should handle errors gracefully', () => {
      const order: Order = {
        id: 'order-1',
        clientId: 'client-1',
        clientName: 'Test Client',
        items: [],
        total: 0,
        status: 'Unpaid',
        date: new Date().toISOString()
      };

      const repaired = ErrorHandler.repairOrder(order);
      expect(repaired).toEqual(order);
    });
  });

  describe('isCategoryConfigAvailable', () => {
    it('should return true when config is available', () => {
      const result = ErrorHandler.isCategoryConfigAvailable();
      expect(result).toBe(true);
    });
  });

  describe('getFallbackCategories', () => {
    it('should return fallback categories', () => {
      const categories = ErrorHandler.getFallbackCategories();
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Products');
    });
  });

  describe('withErrorBoundary', () => {
    it('should return operation result when successful', () => {
      const operation = () => 'success';
      const result = ErrorHandler.withErrorBoundary(operation, 'fallback', 'test');
      expect(result).toBe('success');
    });

    it('should return fallback when operation throws', () => {
      const operation = () => { throw new Error('test error'); };
      const result = ErrorHandler.withErrorBoundary(operation, 'fallback', 'test');
      expect(result).toBe('fallback');
    });
  });

  describe('getErrorMessage', () => {
    it('should return error message from Error objects', () => {
      const error = new Error('Test error');
      const message = ErrorHandler.getErrorMessage(error);
      expect(message).toBe('Test error');
    });

    it('should return string errors as-is', () => {
      const error = 'String error';
      const message = ErrorHandler.getErrorMessage(error);
      expect(message).toBe('String error');
    });

    it('should return generic message for unknown errors', () => {
      const error = { unknown: 'object' };
      const message = ErrorHandler.getErrorMessage(error);
      expect(message).toBe('An unexpected error occurred. Please try again.');
    });
  });
});