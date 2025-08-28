/**
 * Example usage of the Migration Service
 * 
 * This file demonstrates how to use the migration utilities to convert
 * legacy cart items and orders to the new hierarchical structure.
 */

import { MigrationService } from './migrationService';
import { 
  performAutoMigration, 
  isMigrationNeeded, 
  createDataBackup,
  migrateStoredCartItems,
  migrateStoredOrders
} from './utils';
import type { CartItem, Order } from '../types';

// Example legacy cart items (without hierarchy information)
const legacyCartItems: CartItem[] = [
  {
    productId: 'tina',
    productName: 'Tina',
    product: 'Tina',
    size: '1g',
    quantity: 1,
    price: 30
  },
  {
    productId: 'vblue',
    productName: 'V Blue',
    product: 'V Blue',
    size: 'unit',
    quantity: 2,
    price: 6
  },
  {
    productId: 'weed',
    productName: 'Weed',
    product: 'Weed',
    size: '3.5g',
    quantity: 1,
    price: 20
  }
];

// Example legacy orders (without hierarchy information)
const legacyOrders: Order[] = [
  {
    id: 'order1',
    clientId: 'client1',
    clientName: 'John Doe',
    items: [
      {
        productId: 'speed',
        productName: 'Speed',
        size: 'unit',
        quantity: 3,
        price: 3
      },
      {
        productId: 'cial20mg',
        productName: 'Cial 20mg',
        size: 'unit',
        quantity: 1,
        price: 8
      }
    ],
    total: 17,
    status: 'Completed',
    date: '2024-01-15'
  }
];

/**
 * Example 1: Manual migration of cart items
 */
export function exampleManualCartMigration() {
  console.log('=== Manual Cart Migration Example ===');
  
  // Migrate individual cart items
  const migratedItems = MigrationService.migrateCartItems(legacyCartItems);
  
  console.log('Original cart items:', legacyCartItems);
  console.log('Migrated cart items:', migratedItems);
  
  // Show the enhanced information
  migratedItems.forEach((item, index) => {
    console.log(`Item ${index + 1}:`);
    console.log(`  Category: ${item.categoryName}`);
    console.log(`  Product Type: ${item.productTypeName}`);
    console.log(`  Type: ${item.type || 'N/A'}`);
    console.log(`  Display Name: ${item.displayName}`);
    console.log('');
  });
}

/**
 * Example 2: Manual migration of orders
 */
export function exampleManualOrderMigration() {
  console.log('=== Manual Order Migration Example ===');
  
  // Migrate orders
  const migratedOrders = MigrationService.migrateOrders(legacyOrders);
  
  console.log('Original orders:', legacyOrders);
  console.log('Migrated orders:', migratedOrders);
  
  // Show the enhanced information
  migratedOrders.forEach((order, orderIndex) => {
    console.log(`Order ${orderIndex + 1} (${order.id}):`);
    order.items.forEach((item, itemIndex) => {
      console.log(`  Item ${itemIndex + 1}:`);
      console.log(`    Category: ${item.categoryName}`);
      console.log(`    Product Type: ${item.productTypeName}`);
      console.log(`    Type: ${item.type || 'N/A'}`);
    });
    console.log('');
  });
}

/**
 * Example 3: Product mapping demonstration
 */
export function exampleProductMapping() {
  console.log('=== Product Mapping Example ===');
  
  const testProducts = [
    'Tina',
    'V Blue', 
    'Cial 20mg',
    'Speed',
    'Unknown Product'
  ];
  
  testProducts.forEach(productName => {
    const mapping = MigrationService.mapLegacyProductToCategory(productName);
    console.log(`"${productName}" maps to:`, mapping);
  });
}

/**
 * Example 4: Validation of migrated data
 */
export function exampleDataValidation() {
  console.log('=== Data Validation Example ===');
  
  // Migrate some items
  const migratedItems = MigrationService.migrateCartItems(legacyCartItems);
  
  // Validate the migrated data
  const validation = MigrationService.validateMigratedData(migratedItems);
  
  console.log('Validation result:', validation);
  
  if (!validation.isValid) {
    console.log('Validation errors:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
  } else {
    console.log('All migrated data is valid!');
  }
}

/**
 * Example 5: Automatic migration with localStorage
 */
export function exampleAutoMigration() {
  console.log('=== Automatic Migration Example ===');
  
  // Check if migration is needed
  const migrationStatus = isMigrationNeeded();
  console.log('Migration status:', migrationStatus);
  
  if (migrationStatus.cart || migrationStatus.orders) {
    console.log('Migration needed, creating backup...');
    
    // Create backup before migration
    const backupSuccess = createDataBackup();
    console.log('Backup created:', backupSuccess);
    
    // Perform automatic migration
    const migrationResult = performAutoMigration();
    console.log('Migration result:', migrationResult);
    
    if (migrationResult.success) {
      console.log('Migration completed successfully!');
    } else {
      console.log('Migration failed with errors:', migrationResult.errors);
    }
  } else {
    console.log('No migration needed - data is already in the new format');
  }
}

/**
 * Example 6: Working with the new category structure
 */
export function exampleCategoryStructure() {
  console.log('=== Category Structure Example ===');
  
  // Get available sizes for different products
  const tinaRegularSizes = MigrationService.getAvailableSizes('Tina', 'Tina', 'Tina');
  const tinaPremiumSizes = MigrationService.getAvailableSizes('Tina', 'Tina', 'Tina Premium');
  const speedSizes = MigrationService.getAvailableSizes('Speed', 'Speed');
  
  console.log('Tina (regular) available sizes:', tinaRegularSizes);
  console.log('Tina Premium available sizes:', tinaPremiumSizes);
  console.log('Speed available sizes:', speedSizes);
  
  // Get prices for specific configurations
  const tinaPrice = MigrationService.getPrice('Tina', 'Tina', '1g', 'Tina');
  const tinaPremiumPrice = MigrationService.getPrice('Tina', 'Tina', '1g', 'Tina Premium');
  const speedPrice = MigrationService.getPrice('Speed', 'Speed', 'unit');
  
  console.log('Tina 1g price:', tinaPrice);
  console.log('Tina Premium 1g price:', tinaPremiumPrice);
  console.log('Speed unit price:', speedPrice);
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('Running Migration Service Examples...\n');
  
  exampleManualCartMigration();
  exampleManualOrderMigration();
  exampleProductMapping();
  exampleDataValidation();
  exampleCategoryStructure();
  
  // Note: exampleAutoMigration() is not run here as it modifies localStorage
  console.log('Examples completed! Run exampleAutoMigration() separately to test localStorage migration.');
}

// Uncomment the line below to run examples when this file is imported
// runAllExamples();