/**
 * Product Name Conversion and Validation Utilities
 * 
 * Provides functions for converting between old and new product names,
 * validating product names, and handling edge cases with comprehensive error handling.
 */

import { 
  PRODUCT_NAME_MAPPINGS, 
  REVERSE_PRODUCT_NAME_MAPPINGS,
  getOldProductNames,
  getNewProductNames
} from './productNameMappings';

/**
 * Error types for product name operations
 */
export class ProductNameError extends Error {
  constructor(message: string, public readonly productName: string) {
    super(message);
    this.name = 'ProductNameError';
  }
}

export class ProductNameMappingError extends ProductNameError {
  constructor(productName: string) {
    super(`No mapping found for product name: ${productName}`, productName);
    this.name = 'ProductNameMappingError';
  }
}

export class ProductNameValidationError extends ProductNameError {
  constructor(productName: string, reason: string) {
    super(`Invalid product name "${productName}": ${reason}`, productName);
    this.name = 'ProductNameValidationError';
  }
}

/**
 * Convert old product name to new 2-letter abbreviation
 * @param oldName - The old product name to convert
 * @returns The new 2-letter abbreviation
 * @throws ProductNameMappingError if no mapping exists
 */
export const convertOldToNewName = (oldName: string): string => {
  if (!oldName || typeof oldName !== 'string') {
    throw new ProductNameValidationError(oldName, 'Product name must be a non-empty string');
  }

  const trimmedName = oldName.trim();
  if (!trimmedName) {
    throw new ProductNameValidationError(oldName, 'Product name cannot be empty or whitespace only');
  }

  const newName = PRODUCT_NAME_MAPPINGS[trimmedName];
  if (!newName) {
    throw new ProductNameMappingError(trimmedName);
  }

  return newName;
};

/**
 * Convert new product name back to old name (for backward compatibility)
 * @param newName - The new product name to convert
 * @returns The old product name
 * @throws ProductNameMappingError if no reverse mapping exists
 */
export const convertNewToOldName = (newName: string): string => {
  if (!newName || typeof newName !== 'string') {
    throw new ProductNameValidationError(newName, 'Product name must be a non-empty string');
  }

  const trimmedName = newName.trim();
  if (!trimmedName) {
    throw new ProductNameValidationError(newName, 'Product name cannot be empty or whitespace only');
  }

  const oldName = REVERSE_PRODUCT_NAME_MAPPINGS[trimmedName];
  if (!oldName) {
    throw new ProductNameMappingError(trimmedName);
  }

  return oldName;
};

/**
 * Safely convert old product name to new name with fallback
 * @param oldName - The old product name to convert
 * @param fallback - Optional fallback value if conversion fails
 * @returns The new product name or fallback value
 */
export const safeConvertOldToNewName = (oldName: string, fallback?: string): string => {
  try {
    return convertOldToNewName(oldName);
  } catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }
    // Return original name as fallback if no explicit fallback provided
    return oldName;
  }
};

/**
 * Safely convert new product name to old name with fallback
 * @param newName - The new product name to convert
 * @param fallback - Optional fallback value if conversion fails
 * @returns The old product name or fallback value
 */
export const safeConvertNewToOldName = (newName: string, fallback?: string): string => {
  try {
    return convertNewToOldName(newName);
  } catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }
    // Return original name as fallback if no explicit fallback provided
    return newName;
  }
};

/**
 * Check if a product name is a valid old product name
 * @param productName - The product name to validate
 * @returns True if the name is a valid old product name
 */
export const isValidOldProductName = (productName: string): boolean => {
  if (!productName || typeof productName !== 'string') {
    return false;
  }
  return getOldProductNames().includes(productName.trim());
};

/**
 * Check if a product name is a valid new product name
 * @param productName - The product name to validate
 * @returns True if the name is a valid new product name
 */
export const isValidNewProductName = (productName: string): boolean => {
  if (!productName || typeof productName !== 'string') {
    return false;
  }
  return getNewProductNames().includes(productName.trim());
};

/**
 * Check if a product name exists in either old or new format
 * @param productName - The product name to validate
 * @returns True if the name exists in either format
 */
export const isValidProductName = (productName: string): boolean => {
  return isValidOldProductName(productName) || isValidNewProductName(productName);
};

/**
 * Validate and normalize a product name
 * @param productName - The product name to validate and normalize
 * @returns The normalized product name
 * @throws ProductNameValidationError if the name is invalid
 */
export const validateAndNormalizeProductName = (productName: string): string => {
  if (!productName || typeof productName !== 'string') {
    throw new ProductNameValidationError(productName, 'Product name must be a non-empty string');
  }

  const trimmedName = productName.trim();
  if (!trimmedName) {
    throw new ProductNameValidationError(productName, 'Product name cannot be empty or whitespace only');
  }

  if (!isValidProductName(trimmedName)) {
    throw new ProductNameValidationError(trimmedName, 'Product name is not recognized in old or new format');
  }

  return trimmedName;
};

/**
 * Get the preferred (new) name for a product, regardless of input format
 * @param productName - The product name in either old or new format
 * @returns The new (preferred) product name
 * @throws ProductNameError if the name cannot be resolved
 */
export const getPreferredProductName = (productName: string): string => {
  const normalizedName = validateAndNormalizeProductName(productName);
  
  // If it's already a new name, return it
  if (isValidNewProductName(normalizedName)) {
    return normalizedName;
  }
  
  // If it's an old name, convert it
  if (isValidOldProductName(normalizedName)) {
    return convertOldToNewName(normalizedName);
  }
  
  // This should never happen due to validation above, but included for completeness
  throw new ProductNameValidationError(normalizedName, 'Unable to determine preferred name');
};

/**
 * Batch convert multiple old product names to new names
 * @param oldNames - Array of old product names
 * @returns Array of conversion results with success/error information
 */
export interface ProductNameConversionResult {
  originalName: string;
  convertedName?: string;
  success: boolean;
  error?: ProductNameError;
}

export const batchConvertOldToNewNames = (oldNames: string[]): ProductNameConversionResult[] => {
  return oldNames.map(oldName => {
    try {
      const convertedName = convertOldToNewName(oldName);
      return {
        originalName: oldName,
        convertedName,
        success: true
      };
    } catch (error) {
      return {
        originalName: oldName,
        success: false,
        error: error instanceof ProductNameError ? error : new ProductNameError(error?.message || 'Unknown error', oldName)
      };
    }
  });
};

/**
 * Get mapping statistics for debugging and validation
 */
export const getMappingStatistics = () => {
  const oldNames = getOldProductNames();
  const newNames = getNewProductNames();
  
  return {
    totalMappings: oldNames.length,
    oldNames,
    newNames,
    averageOldNameLength: oldNames.reduce((sum, name) => sum + name.length, 0) / oldNames.length,
    averageNewNameLength: newNames.reduce((sum, name) => sum + name.length, 0) / newNames.length,
    longestOldName: oldNames.reduce((longest, name) => name.length > longest.length ? name : longest, ''),
    shortestOldName: oldNames.reduce((shortest, name) => name.length < shortest.length ? name : shortest, oldNames[0] || ''),
    duplicateNewNames: newNames.filter((name, index) => newNames.indexOf(name) !== index)
  };
};