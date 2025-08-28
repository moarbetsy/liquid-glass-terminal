import type { Product, CartItem, OrderItem, Order } from '../types';
import { MigrationService } from './migrationService';

export const calculatePrice = (product: Product, quantity: number): number => {
    if (!product.suggestedPrice) {
        return 0;
    }

    const quantities = (product.referenceQuantity || '').split('/').map(s => s.trim());
    const prices = product.suggestedPrice.split('/').map(p => parseFloat(p.trim()));

    if (prices.length === 0) {
      return 0;
    }

    const numericQuantities = quantities.map(q => parseFloat(q.replace(/[^0-9.]/g, '')));

    // 1. Check for exact tier match
    let exactMatchIndex = -1;
    for (let i = 0; i < numericQuantities.length; i++) {
        if (quantity === numericQuantities[i]) {
            exactMatchIndex = i;
            break;
        }
    }
    if (exactMatchIndex !== -1 && prices[exactMatchIndex] !== undefined) {
        return prices[exactMatchIndex];
    }

    // 2. If no exact match, calculate based on smallest unit price
    if (product.type !== 'unit') {
      let smallestUnit = Infinity;
      let basePricePerUnit = 0;

      for (let i = 0; i < numericQuantities.length; i++) {
          const unit = numericQuantities[i];
          if (unit > 0 && unit < smallestUnit) {
              smallestUnit = unit;
              basePricePerUnit = prices[i] / unit;
          }
      }

      if (basePricePerUnit > 0 && isFinite(basePricePerUnit)) {
          return parseFloat((quantity * basePricePerUnit).toFixed(2));
      }
    }
    
    // 3. Fallback for single-price items or units
    if (prices.length === 1) {
        return quantity * prices[0];
    }

    return 0; // Default if price cannot be determined
};

export const calculateCost = (product: Product, quantity: number): number => {
    if (!product.cost) {
        return 0;
    }

    const quantities = (product.referenceQuantity || '').split('/').map(s => s.trim());
    const costs = product.cost.split('/').map(p => parseFloat(p.trim()));

    if (costs.length === 0) {
      return 0;
    }

    const numericQuantities = quantities.map(q => parseFloat(q.replace(/[^0-9.]/g, '')));

    // 1. Check for exact tier match
    let exactMatchIndex = -1;
    for (let i = 0; i < numericQuantities.length; i++) {
        if (quantity === numericQuantities[i]) {
            exactMatchIndex = i;
            break;
        }
    }
    if (exactMatchIndex !== -1 && costs[exactMatchIndex] !== undefined) {
        return costs[exactMatchIndex];
    }

    // 2. If no exact match, calculate based on smallest unit cost
    if (product.type !== 'unit') {
      let smallestUnit = Infinity;
      let baseCostPerUnit = 0;

      for (let i = 0; i < numericQuantities.length; i++) {
          const unit = numericQuantities[i];
          if (unit > 0 && unit < smallestUnit) {
              smallestUnit = unit;
              baseCostPerUnit = costs[i] / unit;
          }
      }

      if (baseCostPerUnit > 0 && isFinite(baseCostPerUnit)) {
          return parseFloat((quantity * baseCostPerUnit).toFixed(2));
      }
    }
    
    // 3. Fallback for single-cost items or units
    if (costs.length === 1) {
        return quantity * costs[0];
    }

    return 0; // Default if cost cannot be determined
};

// Migration utility functions

/**
 * Migrate cart items from localStorage to new hierarchical format
 */
export const migrateStoredCartItems = (): CartItem[] => {
    try {
        const storedCart = localStorage.getItem('cart');
        if (!storedCart) return [];

        const cartItems: CartItem[] = JSON.parse(storedCart);
        const migratedItems = MigrationService.migrateCartItems(cartItems);
        
        // Save migrated items back to localStorage
        localStorage.setItem('cart', JSON.stringify(migratedItems));
        
        return migratedItems;
    } catch (error) {
        console.error('Error migrating stored cart items:', error);
        return [];
    }
};

/**
 * Migrate orders from localStorage to new hierarchical format
 */
export const migrateStoredOrders = (): Order[] => {
    try {
        const storedOrders = localStorage.getItem('orders');
        if (!storedOrders) return [];

        const orders: Order[] = JSON.parse(storedOrders);
        const migratedOrders = MigrationService.migrateOrders(orders);
        
        // Save migrated orders back to localStorage
        localStorage.setItem('orders', JSON.stringify(migratedOrders));
        
        return migratedOrders;
    } catch (error) {
        console.error('Error migrating stored orders:', error);
        return [];
    }
};

/**
 * Check if migration is needed for stored data
 */
export const isMigrationNeeded = (): { cart: boolean; orders: boolean } => {
    const cartNeedsMigration = checkCartMigrationNeeded();
    const ordersNeedMigration = checkOrdersMigrationNeeded();
    
    return {
        cart: cartNeedsMigration,
        orders: ordersNeedMigration
    };
};

/**
 * Check if cart items need migration
 */
const checkCartMigrationNeeded = (): boolean => {
    try {
        const storedCart = localStorage.getItem('cart');
        if (!storedCart) return false;

        const cartItems: CartItem[] = JSON.parse(storedCart);
        return cartItems.some(item => !item.categoryName || !item.productTypeName);
    } catch (error) {
        console.error('Error checking cart migration status:', error);
        return false;
    }
};

/**
 * Check if orders need migration
 */
const checkOrdersMigrationNeeded = (): boolean => {
    try {
        const storedOrders = localStorage.getItem('orders');
        if (!storedOrders) return false;

        const orders: Order[] = JSON.parse(storedOrders);
        return orders.some(order => 
            order.items.some(item => !item.categoryName || !item.productTypeName)
        );
    } catch (error) {
        console.error('Error checking orders migration status:', error);
        return false;
    }
};

/**
 * Perform automatic migration of all stored data
 */
export const performAutoMigration = (): { success: boolean; errors: string[] } => {
    const errors: string[] = [];
    let success = true;

    try {
        // Migrate cart items
        const migrationStatus = isMigrationNeeded();
        
        if (migrationStatus.cart) {
            console.log('Migrating cart items...');
            migrateStoredCartItems();
        }
        
        if (migrationStatus.orders) {
            console.log('Migrating orders...');
            migrateStoredOrders();
        }

        // Validate migrated data
        const validationResult = validateAllStoredData();
        if (!validationResult.isValid) {
            errors.push(...validationResult.errors);
            success = false;
        }

        if (success) {
            console.log('Migration completed successfully');
        }
    } catch (error) {
        console.error('Error during auto migration:', error);
        errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        success = false;
    }

    return { success, errors };
};

/**
 * Validate all stored data after migration
 */
export const validateAllStoredData = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    try {
        // Validate cart items
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            const cartItems: CartItem[] = JSON.parse(storedCart);
            const cartValidation = MigrationService.validateMigratedData(cartItems);
            if (!cartValidation.isValid) {
                errors.push(...cartValidation.errors.map(err => `Cart: ${err}`));
            }
        }

        // Validate orders
        const storedOrders = localStorage.getItem('orders');
        if (storedOrders) {
            const orders: Order[] = JSON.parse(storedOrders);
            orders.forEach((order, orderIndex) => {
                const orderValidation = MigrationService.validateMigratedData(order.items);
                if (!orderValidation.isValid) {
                    errors.push(...orderValidation.errors.map(err => `Order ${orderIndex}: ${err}`));
                }
            });
        }
    } catch (error) {
        console.error('Error validating stored data:', error);
        errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Create a backup of current data before migration
 */
export const createDataBackup = (): boolean => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Backup cart
        const cart = localStorage.getItem('cart');
        if (cart) {
            localStorage.setItem(`cart_backup_${timestamp}`, cart);
        }
        
        // Backup orders
        const orders = localStorage.getItem('orders');
        if (orders) {
            localStorage.setItem(`orders_backup_${timestamp}`, orders);
        }
        
        console.log(`Data backup created with timestamp: ${timestamp}`);
        return true;
    } catch (error) {
        console.error('Error creating data backup:', error);
        return false;
    }
};

/**
 * Restore data from a backup
 */
export const restoreDataFromBackup = (timestamp: string): boolean => {
    try {
        // Restore cart
        const cartBackup = localStorage.getItem(`cart_backup_${timestamp}`);
        if (cartBackup) {
            localStorage.setItem('cart', cartBackup);
        }
        
        // Restore orders
        const ordersBackup = localStorage.getItem(`orders_backup_${timestamp}`);
        if (ordersBackup) {
            localStorage.setItem('orders', ordersBackup);
        }
        
        console.log(`Data restored from backup: ${timestamp}`);
        return true;
    } catch (error) {
        console.error('Error restoring data from backup:', error);
        return false;
    }
};