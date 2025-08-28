/**
 * Product Name Migration Service
 * 
 * Handles migration of product names from old format to new 2-letter abbreviations.
 * This is separate from the main MigrationService to avoid conflicts with existing functionality.
 */

import type { Product, Order, CartItem } from '../types';
import { 
  safeConvertOldToNewName,
  isValidOldProductName
} from './productNameUtils';

export class ProductNameMigrationService {
  // Migration version tracking
  private static readonly CURRENT_MIGRATION_VERSION = '2.0.0';
  private static readonly PRODUCT_NAME_MIGRATION_VERSION = '2.0.0';
  
  // Migration logging
  private static migrationLog: string[] = [];
  private static migrationBackup: any = null;

  /**
   * Get current migration version from localStorage
   */
  static getMigrationVersion(): string {
    try {
      return localStorage.getItem('productNameMigrationVersion') || '1.0.0';
    } catch (error) {
      this.logMigration(`Error reading migration version: ${error}`);
      return '1.0.0';
    }
  }

  /**
   * Set migration version in localStorage
   */
  static setMigrationVersion(version: string): void {
    try {
      localStorage.setItem('productNameMigrationVersion', version);
      this.logMigration(`Migration version updated to: ${version}`);
    } catch (error) {
      this.logMigration(`Error setting migration version: ${error}`);
      throw new Error(`Failed to set migration version: ${error}`);
    }
  }

  /**
   * Check if product name migration is needed
   */
  static needsProductNameMigration(): boolean {
    const currentVersion = this.getMigrationVersion();
    const needsMigration = this.compareVersions(currentVersion, this.PRODUCT_NAME_MIGRATION_VERSION) < 0;
    this.logMigration(`Migration check: current=${currentVersion}, target=${this.PRODUCT_NAME_MIGRATION_VERSION}, needs=${needsMigration}`);
    return needsMigration;
  }

  /**
   * Compare version strings (returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2)
   */
  static compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }
    
    return 0;
  }

  /**
   * Create backup of current data before migration
   */
  static createMigrationBackup(): void {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        version: this.getMigrationVersion(),
        data: {
          products: localStorage.getItem('products'),
          orders: localStorage.getItem('orders'),
          cart: localStorage.getItem('cart'),
          clients: localStorage.getItem('clients')
        }
      };
      
      this.migrationBackup = backup;
      localStorage.setItem('productNameMigrationBackup', JSON.stringify(backup));
      this.logMigration(`Migration backup created at ${backup.timestamp}`);
    } catch (error) {
      this.logMigration(`Error creating migration backup: ${error}`);
      throw new Error(`Failed to create migration backup: ${error}`);
    }
  }

  /**
   * Restore from migration backup
   */
  static restoreFromBackup(): boolean {
    try {
      const backupData = localStorage.getItem('productNameMigrationBackup');
      if (!backupData) {
        this.logMigration('No backup found for restoration');
        return false;
      }

      const backup = JSON.parse(backupData);
      
      // Restore data
      if (backup.data.products) localStorage.setItem('products', backup.data.products);
      if (backup.data.orders) localStorage.setItem('orders', backup.data.orders);
      if (backup.data.cart) localStorage.setItem('cart', backup.data.cart);
      if (backup.data.clients) localStorage.setItem('clients', backup.data.clients);
      
      // Restore version
      this.setMigrationVersion(backup.version);
      
      this.logMigration(`Successfully restored from backup created at ${backup.timestamp}`);
      return true;
    } catch (error) {
      this.logMigration(`Error restoring from backup: ${error}`);
      return false;
    }
  }

  /**
   * Log migration activities
   */
  static logMigration(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.migrationLog.push(logEntry);
    console.log(`ProductNameMigration: ${logEntry}`);
  }

  /**
   * Get migration log
   */
  static getMigrationLog(): string[] {
    return [...this.migrationLog];
  }

  /**
   * Clear migration log
   */
  static clearMigrationLog(): void {
    this.migrationLog = [];
  }

  /**
   * Migrate product names in a single product
   */
  static migrateProductNames(product: Product): Product {
    try {
      const oldName = product.name;
      const newName = safeConvertOldToNewName(oldName, oldName);
      
      if (newName !== oldName) {
        this.logMigration(`Migrating product: "${oldName}" -> "${newName}"`);
      }
      
      return {
        ...product,
        name: newName
      };
    } catch (error) {
      this.logMigration(`Error migrating product ${product.name}: ${error}`);
      return product; // Return original on error
    }
  }

  /**
   * Migrate product names in products array
   */
  static migrateProductsArray(products: Product[]): Product[] {
    this.logMigration(`Starting migration of ${products.length} products`);
    
    const migratedProducts = products.map(product => this.migrateProductNames(product));
    
    this.logMigration(`Completed migration of products array`);
    return migratedProducts;
  }

  /**
   * Migrate product names in cart items
   */
  static migrateCartItemProductNames(items: CartItem[]): CartItem[] {
    this.logMigration(`Starting migration of ${items.length} cart items`);
    
    const migratedItems = items.map(item => {
      try {
        const oldProductName = item.productName;
        const oldProduct = item.product;
        
        const newProductName = safeConvertOldToNewName(oldProductName, oldProductName);
        const newProduct = safeConvertOldToNewName(oldProduct, oldProduct);
        
        if (newProductName !== oldProductName || newProduct !== oldProduct) {
          this.logMigration(`Migrating cart item: "${oldProductName}" -> "${newProductName}", product: "${oldProduct}" -> "${newProduct}"`);
        }
        
        return {
          ...item,
          productName: newProductName,
          product: newProduct
        };
      } catch (error) {
        this.logMigration(`Error migrating cart item ${item.productName}: ${error}`);
        return item; // Return original on error
      }
    });
    
    this.logMigration(`Completed migration of cart items`);
    return migratedItems;
  }

  /**
   * Migrate product names in order items
   */
  static migrateOrderItemProductNames(items: OrderItem[]): OrderItem[] {
    this.logMigration(`Starting migration of ${items.length} order items`);
    
    const migratedItems = items.map(item => {
      try {
        const oldProductName = item.productName;
        const newProductName = safeConvertOldToNewName(oldProductName, oldProductName);
        
        if (newProductName !== oldProductName) {
          this.logMigration(`Migrating order item: "${oldProductName}" -> "${newProductName}"`);
        }
        
        return {
          ...item,
          productName: newProductName
        };
      } catch (error) {
        this.logMigration(`Error migrating order item ${item.productName}: ${error}`);
        return item; // Return original on error
      }
    });
    
    this.logMigration(`Completed migration of order items`);
    return migratedItems;
  }

  /**
   * Migrate product names in orders
   */
  static migrateOrdersProductNames(orders: Order[]): Order[] {
    this.logMigration(`Starting migration of ${orders.length} orders`);
    
    const migratedOrders = orders.map(order => ({
      ...order,
      items: this.migrateOrderItemProductNames(order.items)
    }));
    
    this.logMigration(`Completed migration of orders`);
    return migratedOrders;
  }

  /**
   * Perform complete product name migration
   */
  static async performProductNameMigration(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      this.logMigration('Starting complete product name migration');
      
      // Check if migration is needed
      if (!this.needsProductNameMigration()) {
        this.logMigration('Product name migration not needed');
        return { success: true, errors: [] };
      }
      
      // Create backup
      this.createMigrationBackup();
      
      // Migrate products
      try {
        const productsData = localStorage.getItem('products');
        if (productsData) {
          const products: Product[] = JSON.parse(productsData);
          const migratedProducts = this.migrateProductsArray(products);
          localStorage.setItem('products', JSON.stringify(migratedProducts));
          this.logMigration('Products migration completed');
        }
      } catch (error) {
        const errorMsg = `Error migrating products: ${error}`;
        errors.push(errorMsg);
        this.logMigration(errorMsg);
      }
      
      // Migrate orders
      try {
        const ordersData = localStorage.getItem('orders');
        if (ordersData) {
          const orders: Order[] = JSON.parse(ordersData);
          const migratedOrders = this.migrateOrdersProductNames(orders);
          localStorage.setItem('orders', JSON.stringify(migratedOrders));
          this.logMigration('Orders migration completed');
        }
      } catch (error) {
        const errorMsg = `Error migrating orders: ${error}`;
        errors.push(errorMsg);
        this.logMigration(errorMsg);
      }
      
      // Migrate cart
      try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
          const cart: CartItem[] = JSON.parse(cartData);
          const migratedCart = this.migrateCartItemProductNames(cart);
          localStorage.setItem('cart', JSON.stringify(migratedCart));
          this.logMigration('Cart migration completed');
        }
      } catch (error) {
        const errorMsg = `Error migrating cart: ${error}`;
        errors.push(errorMsg);
        this.logMigration(errorMsg);
      }
      
      // Update migration version if no critical errors
      if (errors.length === 0) {
        this.setMigrationVersion(this.PRODUCT_NAME_MIGRATION_VERSION);
        this.logMigration('Product name migration completed successfully');
        return { success: true, errors: [] };
      } else {
        this.logMigration(`Product name migration completed with ${errors.length} errors`);
        return { success: false, errors };
      }
      
    } catch (error) {
      const errorMsg = `Critical error during product name migration: ${error}`;
      errors.push(errorMsg);
      this.logMigration(errorMsg);
      
      // Attempt to restore from backup on critical error
      this.logMigration('Attempting to restore from backup due to critical error');
      const restored = this.restoreFromBackup();
      if (restored) {
        this.logMigration('Successfully restored from backup');
      } else {
        this.logMigration('Failed to restore from backup');
      }
      
      return { success: false, errors };
    }
  }

  /**
   * Validate product name migration results
   */
  static validateProductNameMigration(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      this.logMigration('Starting product name migration validation');
      
      // Validate products
      const productsData = localStorage.getItem('products');
      if (productsData) {
        const products: Product[] = JSON.parse(productsData);
        products.forEach((product, index) => {
          if (isValidOldProductName(product.name)) {
            warnings.push(`Product ${index} still uses old name: ${product.name}`);
          }
        });
      }
      
      // Validate orders
      const ordersData = localStorage.getItem('orders');
      if (ordersData) {
        const orders: Order[] = JSON.parse(ordersData);
        orders.forEach((order, orderIndex) => {
          order.items.forEach((item, itemIndex) => {
            if (isValidOldProductName(item.productName)) {
              warnings.push(`Order ${orderIndex}, item ${itemIndex} still uses old product name: ${item.productName}`);
            }
          });
        });
      }
      
      // Validate cart
      const cartData = localStorage.getItem('cart');
      if (cartData) {
        const cart: CartItem[] = JSON.parse(cartData);
        cart.forEach((item, index) => {
          if (isValidOldProductName(item.productName)) {
            warnings.push(`Cart item ${index} still uses old product name: ${item.productName}`);
          }
          if (isValidOldProductName(item.product)) {
            warnings.push(`Cart item ${index} still uses old product field: ${item.product}`);
          }
        });
      }
      
      this.logMigration(`Validation completed: ${errors.length} errors, ${warnings.length} warnings`);
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
      
    } catch (error) {
      const errorMsg = `Error during validation: ${error}`;
      errors.push(errorMsg);
      this.logMigration(errorMsg);
      
      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Get migration statistics
   */
  static getMigrationStatistics(): {
    currentVersion: string;
    needsMigration: boolean;
    backupExists: boolean;
    logEntries: number;
    lastMigration?: string;
  } {
    const backupData = localStorage.getItem('productNameMigrationBackup');
    let lastMigration: string | undefined;
    
    if (backupData) {
      try {
        const backup = JSON.parse(backupData);
        lastMigration = backup.timestamp;
      } catch (error) {
        this.logMigration(`Error parsing backup data: ${error}`);
      }
    }
    
    return {
      currentVersion: this.getMigrationVersion(),
      needsMigration: this.needsProductNameMigration(),
      backupExists: !!backupData,
      logEntries: this.migrationLog.length,
      lastMigration
    };
  }
}