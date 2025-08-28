import type { ProductConfig, CartItem, OrderItem, Order } from '../types';
import { PRODUCT_CONFIG } from './productConfig';
import { MigrationService } from './migrationService';

/**
 * Error handling utilities for the product category hierarchy system
 */
export class ErrorHandler {
  /**
   * Validate that a product exists in the configuration
   */
  static validateCategory(categoryName: string): { isValid: boolean; error?: string } {
    // Since we now have a flat structure, we just validate that products exist
    if (!PRODUCT_CONFIG || Object.keys(PRODUCT_CONFIG).length === 0) {
      return { isValid: false, error: 'Product configuration not available' };
    }

    return { isValid: true };
  }

  /**
   * Validate that a product exists in the configuration
   */
  static validateProduct(categoryName: string, productName: string): { isValid: boolean; error?: string } {
    if (!productName) {
      return { isValid: false, error: 'Product name is required' };
    }

    // Handle products with types (e.g., "Cialis - 80mg" should validate against "Cialis")
    let actualProductName = productName;
    if (productName.includes(' - ')) {
      actualProductName = productName.split(' - ')[0];
    }
    
    if (!PRODUCT_CONFIG[actualProductName]) {
      return { isValid: false, error: `Product "${actualProductName}" not found` };
    }

    return { isValid: true };
  }

  /**
   * Validate that a size exists for a product
   */
  static validateSize(categoryName: string, productName: string, size: string, typeName?: string): { isValid: boolean; error?: string } {
    const productValidation = this.validateProduct(categoryName, productName);
    if (!productValidation.isValid) {
      return productValidation;
    }

    if (!size) {
      return { isValid: false, error: 'Size is required' };
    }

    // Handle products with types (e.g., "Cialis - 80mg" should validate against "Cialis")
    let actualProductName = productName;
    let actualTypeName = typeName;
    
    if (productName.includes(' - ')) {
      const parts = productName.split(' - ');
      actualProductName = parts[0];
      actualTypeName = parts[1]; // Use the type from the product name if not provided
    }

    const product = PRODUCT_CONFIG[actualProductName];
    
    // Check if product has types
    if (product.types) {
      if (!actualTypeName) {
        return { isValid: false, error: 'Type name is required for this product' };
      }
      
      if (!product.types[actualTypeName]) {
        return { isValid: false, error: `Type "${actualTypeName}" not found for product "${actualProductName}"` };
      }
      
      if (!product.types[actualTypeName][size]) {
        return { isValid: false, error: `Size "${size}" not available for type "${actualTypeName}"` };
      }
    } else if (product.sizes) {
      if (!product.sizes[size]) {
        return { isValid: false, error: `Size "${size}" not available for product "${actualProductName}"` };
      }
    } else {
      return { isValid: false, error: `No sizes configured for product "${actualProductName}"` };
    }

    return { isValid: true };
  }

  /**
   * Validate cart item data integrity
   */
  static validateCartItem(item: CartItem): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!item.productName) errors.push('Product name is missing');
    if (!item.size) errors.push('Size is missing');
    if (item.quantity <= 0) errors.push('Quantity must be greater than 0');
    if (item.price < 0) errors.push('Price cannot be negative');

    // Check if hierarchy information is missing
    if (!item.categoryName) errors.push('Category name is missing');
    if (!item.productTypeName) errors.push('Product type name is missing');

    // If hierarchy information is present, validate it
    if (item.categoryName && item.productTypeName) {
      const categoryValidation = this.validateCategory(item.categoryName);
      if (!categoryValidation.isValid) {
        errors.push(`Invalid category: ${categoryValidation.error}`);
      } else {
        const productValidation = this.validateProduct(item.categoryName, item.productTypeName);
        if (!productValidation.isValid) {
          errors.push(`Invalid product: ${productValidation.error}`);
        } else {
          const sizeValidation = this.validateSize(item.categoryName, item.productTypeName, String(item.size), item.type);
          if (!sizeValidation.isValid) {
            errors.push(`Invalid size: ${sizeValidation.error}`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate order item data integrity
   */
  static validateOrderItem(item: OrderItem): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!item.productName) errors.push('Product name is missing');
    if (!item.size) errors.push('Size is missing');
    if (item.quantity <= 0) errors.push('Quantity must be greater than 0');
    if (item.price < 0) errors.push('Price cannot be negative');

    // Check if hierarchy information is missing
    if (!item.categoryName) errors.push('Category name is missing');
    if (!item.productTypeName) errors.push('Product type name is missing');

    // If hierarchy information is present, validate it
    if (item.categoryName && item.productTypeName) {
      const categoryValidation = this.validateCategory(item.categoryName);
      if (!categoryValidation.isValid) {
        errors.push(`Invalid category: ${categoryValidation.error}`);
      } else {
        const productValidation = this.validateProduct(item.categoryName, item.productTypeName);
        if (!productValidation.isValid) {
          errors.push(`Invalid product: ${productValidation.error}`);
        } else {
          const sizeValidation = this.validateSize(item.categoryName, item.productTypeName, String(item.size), item.type);
          if (!sizeValidation.isValid) {
            errors.push(`Invalid size: ${sizeValidation.error}`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a fallback display name for legacy items
   */
  static createFallbackDisplayName(item: CartItem | OrderItem): string {
    // Try to use hierarchy information if available
    if (item.categoryName && item.productTypeName) {
      let displayName = `${item.categoryName} > ${item.productTypeName}`;
      
      if (item.type && item.type !== item.productTypeName) {
        displayName += ` > ${item.type}`;
      }
      
      displayName += ` - ${item.size}`;
      return displayName;
    }

    // Fallback to legacy format
    let displayName = item.productName;
    
    if (item.type && item.type !== item.productName) {
      displayName += ` (${item.type})`;
    }
    
    displayName += ` - ${item.size}`;
    
    if (item.unit) {
      displayName = displayName.replace(String(item.size), `${item.size}${item.unit}`);
    }
    
    return displayName;
  }

  /**
   * Attempt to repair a cart item by migrating it to the new structure
   */
  static repairCartItem(item: CartItem): CartItem {
    try {
      // If item already has valid hierarchy information, return as-is
      const validation = this.validateCartItem(item);
      if (validation.isValid) {
        return item;
      }

      // Attempt migration
      const migratedItem = MigrationService.migrateCartItem(item);
      
      // Validate migrated item
      const migratedValidation = this.validateCartItem(migratedItem);
      if (migratedValidation.isValid) {
        return migratedItem;
      }

      // If migration failed, create a safe fallback
      return {
        ...item,
        categoryName: 'Legacy',
        productTypeName: item.productName,
        displayName: this.createFallbackDisplayName({
          ...item,
          categoryName: 'Legacy',
          productTypeName: item.productName
        })
      };
    } catch (error) {
      console.warn('Failed to repair cart item:', error);
      
      // Return item with fallback values
      const fallbackItem = {
        ...item,
        categoryName: 'Legacy',
        productTypeName: item.productName
      };
      
      return {
        ...fallbackItem,
        displayName: this.createFallbackDisplayName(fallbackItem)
      };
    }
  }

  /**
   * Attempt to repair an order item by migrating it to the new structure
   */
  static repairOrderItem(item: OrderItem): OrderItem {
    try {
      // If item already has valid hierarchy information, return as-is
      const validation = this.validateOrderItem(item);
      if (validation.isValid) {
        return item;
      }

      // Attempt migration
      const migratedItem = MigrationService.migrateOrderItem(item);
      
      // Validate migrated item
      const migratedValidation = this.validateOrderItem(migratedItem);
      if (migratedValidation.isValid) {
        return migratedItem;
      }

      // If migration failed, create a safe fallback
      return {
        ...item,
        categoryName: 'Legacy',
        productTypeName: item.productName
      };
    } catch (error) {
      console.warn('Failed to repair order item:', error);
      
      // Return item with fallback values
      return {
        ...item,
        categoryName: 'Legacy',
        productTypeName: item.productName
      };
    }
  }

  /**
   * Repair an entire order by fixing all its items
   */
  static repairOrder(order: Order): Order {
    try {
      return {
        ...order,
        items: order.items.map(item => this.repairOrderItem(item))
      };
    } catch (error) {
      console.warn('Failed to repair order:', error);
      return order;
    }
  }

  /**
   * Check if category configuration is available and valid
   */
  static isCategoryConfigAvailable(): boolean {
    try {
      return PRODUCT_CONFIG && Object.keys(PRODUCT_CONFIG).length > 0;
    } catch (error) {
      console.error('Product configuration is not available:', error);
      return false;
    }
  }

  /**
   * Get a safe fallback category list when configuration is unavailable
   */
  static getFallbackCategories(): Array<{ id: string; name: string; products: any[] }> {
    return [
      {
        id: 'legacy',
        name: 'Products',
        products: []
      }
    ];
  }

  /**
   * Handle errors gracefully with user-friendly messages
   */
  static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Log errors for debugging while providing user-friendly feedback
   */
  static logError(context: string, error: unknown, additionalData?: any): void {
    console.error(`[${context}]`, error, additionalData);
  }

  /**
   * Create a safe error boundary for component rendering
   */
  static withErrorBoundary<T>(
    operation: () => T,
    fallback: T,
    context: string
  ): T {
    try {
      return operation();
    } catch (error) {
      this.logError(context, error);
      return fallback;
    }
  }
}