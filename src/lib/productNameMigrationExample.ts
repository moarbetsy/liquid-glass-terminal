/**
 * Example usage of Product Name Mapping and Migration Utilities
 * 
 * This file demonstrates how to use the product name mapping configuration
 * and utilities for migrating data from old to new product names.
 */

import {
  convertOldToNewName,
  safeConvertOldToNewName,
  getPreferredProductName,
  batchConvertOldToNewNames,
  isValidProductName,
  getMappingStatistics
} from './productNameUtils';

/**
 * Example: Convert individual product names
 */
export const exampleIndividualConversion = () => {
  console.log('=== Individual Product Name Conversion ===');
  
  // Convert old names to new names
  try {
    console.log(`Tina -> ${convertOldToNewName('Tina')}`);
    console.log(`Glass Pipe -> ${convertOldToNewName('Glass Pipe')}`);
    console.log(`Shrooms -> ${convertOldToNewName('Shrooms')}`);
  } catch (error) {
    console.error('Conversion error:', error instanceof Error ? error.message : String(error));
  }
  
  // Safe conversion with fallback
  console.log(`Unknown Product -> ${safeConvertOldToNewName('Unknown Product', 'UNKNOWN')}`);
  console.log(`Invalid -> ${safeConvertOldToNewName('Invalid')}`); // Returns original name
};

/**
 * Example: Get preferred names (handles both old and new formats)
 */
export const examplePreferredNames = () => {
  console.log('\n=== Get Preferred Product Names ===');
  
  const testNames = ['Tina', 'Ti', 'Glass Pipe', 'Pi', 'Shrooms'];
  
  testNames.forEach(name => {
    try {
      const preferred = getPreferredProductName(name);
      console.log(`${name} -> ${preferred} (preferred)`);
    } catch (error) {
      console.log(`${name} -> ERROR: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
};

/**
 * Example: Batch conversion for migrating arrays of product names
 */
export const exampleBatchConversion = () => {
  console.log('\n=== Batch Product Name Conversion ===');
  
  const oldProductNames = [
    'Tina', 'GH', 'Viag', 'Cial', 'Speed', 'Ecsta', 'MD',
    'Weed', 'Hash', 'Ket', 'Coco', 'Shrooms', 'Poppers',
    'Glass Pipe', 'Torch Lighter', 'Bong', 'Invalid Product'
  ];
  
  const results = batchConvertOldToNewNames(oldProductNames);
  
  console.log('Conversion Results:');
  results.forEach(result => {
    if (result.success) {
      console.log(`✓ ${result.originalName} -> ${result.convertedName}`);
    } else {
      console.log(`✗ ${result.originalName} -> ERROR: ${result.error?.message}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\nSuccess Rate: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);
};

/**
 * Example: Validate product names
 */
export const exampleValidation = () => {
  console.log('\n=== Product Name Validation ===');
  
  const testNames = ['Tina', 'Ti', 'Glass Pipe', 'Pi', 'Invalid', '', null, undefined];
  
  testNames.forEach(name => {
    const isValid = isValidProductName(name as string);
    console.log(`"${name}" -> ${isValid ? 'VALID' : 'INVALID'}`);
  });
};

/**
 * Example: Migration statistics and debugging info
 */
export const exampleMappingStatistics = () => {
  console.log('\n=== Mapping Statistics ===');
  
  const stats = getMappingStatistics();
  
  console.log(`Total Mappings: ${stats.totalMappings}`);
  console.log(`Average Old Name Length: ${stats.averageOldNameLength.toFixed(1)} characters`);
  console.log(`Average New Name Length: ${stats.averageNewNameLength.toFixed(1)} characters`);
  console.log(`Longest Old Name: "${stats.longestOldName}" (${stats.longestOldName.length} chars)`);
  console.log(`Shortest Old Name: "${stats.shortestOldName}" (${stats.shortestOldName.length} chars)`);
  console.log(`Duplicate New Names: ${stats.duplicateNewNames.length > 0 ? stats.duplicateNewNames.join(', ') : 'None'}`);
  
  console.log('\nAll Mappings:');
  stats.oldNames.forEach((oldName, index) => {
    console.log(`  ${oldName} -> ${stats.newNames[index]}`);
  });
};

/**
 * Example: Simulated data migration
 */
export const exampleDataMigration = () => {
  console.log('\n=== Simulated Data Migration ===');
  
  // Simulate old product data
  const oldProducts = [
    { id: 1, name: 'Tina', price: 30, stock: 10 },
    { id: 2, name: 'Glass Pipe', price: 5, stock: 25 },
    { id: 3, name: 'Shrooms', price: 25, stock: 8 },
    { id: 4, name: 'Invalid Product', price: 0, stock: 0 }
  ];
  
  console.log('Original Products:');
  oldProducts.forEach(product => {
    console.log(`  ${product.name} (ID: ${product.id}, Price: $${product.price}, Stock: ${product.stock})`);
  });
  
  // Migrate product names
  const migratedProducts = oldProducts.map(product => {
    const newName = safeConvertOldToNewName(product.name, product.name);
    return {
      ...product,
      name: newName,
      originalName: product.name !== newName ? product.name : undefined
    };
  });
  
  console.log('\nMigrated Products:');
  migratedProducts.forEach(product => {
    const originalNote = product.originalName ? ` (was: ${product.originalName})` : '';
    console.log(`  ${product.name} (ID: ${product.id}, Price: $${product.price}, Stock: ${product.stock})${originalNote}`);
  });
};

/**
 * Run all examples
 */
export const runAllExamples = () => {
  console.log('Product Name Migration Utilities - Examples\n');
  
  exampleIndividualConversion();
  examplePreferredNames();
  exampleBatchConversion();
  exampleValidation();
  exampleMappingStatistics();
  exampleDataMigration();
  
  console.log('\n=== Examples Complete ===');
};

// Uncomment to run examples when this file is imported
// runAllExamples();