/**
 * Tests for Product Name Mapping Configuration and Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  PRODUCT_NAME_MAPPINGS,
  REVERSE_PRODUCT_NAME_MAPPINGS,
  getOldProductNames,
  getNewProductNames
} from '../productNameMappings';
import {
  convertOldToNewName,
  convertNewToOldName,
  safeConvertOldToNewName,
  safeConvertNewToOldName,
  isValidOldProductName,
  isValidNewProductName,
  isValidProductName,
  validateAndNormalizeProductName,
  getPreferredProductName,
  batchConvertOldToNewNames,
  getMappingStatistics,
  ProductNameError,
  ProductNameMappingError,
  ProductNameValidationError
} from '../productNameUtils';

describe('Product Name Mappings Configuration', () => {
  it('should have all expected product mappings', () => {
    const expectedMappings = {
      'Tina': 'Ti',
      'GH': 'Gh',
      'Viag': 'Vi',
      'Cial': 'Ci',
      'Speed': 'Sp',
      'Ecsta': 'E',
      'MD': 'Md',
      'Weed': 'We',
      'Hash': 'Ha',
      'Ket': 'Ke',
      'Coco': 'Co',
      'Shrooms': 'Mu',
      'Poppers': 'Pop',
      'Glass Pipe': 'Pi',
      'Torch Lighter': 'Li',
      'Bong': 'Bo'
    };

    expect(PRODUCT_NAME_MAPPINGS).toEqual(expectedMappings);
  });

  it('should have correct reverse mappings', () => {
    Object.entries(PRODUCT_NAME_MAPPINGS).forEach(([oldName, newName]) => {
      expect(REVERSE_PRODUCT_NAME_MAPPINGS[newName]).toBe(oldName);
    });
  });

  it('should return correct old product names', () => {
    const oldNames = getOldProductNames();
    expect(oldNames).toContain('Tina');
    expect(oldNames).toContain('Glass Pipe');
    expect(oldNames).toHaveLength(16);
  });

  it('should return correct new product names', () => {
    const newNames = getNewProductNames();
    expect(newNames).toContain('Ti');
    expect(newNames).toContain('Pi');
    expect(newNames).toHaveLength(16);
  });

  it('should have unique new product names', () => {
    const newNames = getNewProductNames();
    const uniqueNames = [...new Set(newNames)];
    expect(newNames).toHaveLength(uniqueNames.length);
  });
});

describe('Product Name Conversion', () => {
  describe('convertOldToNewName', () => {
    it('should convert valid old names to new names', () => {
      expect(convertOldToNewName('Tina')).toBe('Ti');
      expect(convertOldToNewName('Glass Pipe')).toBe('Pi');
      expect(convertOldToNewName('Shrooms')).toBe('Mu');
    });

    it('should throw ProductNameMappingError for unknown old names', () => {
      expect(() => convertOldToNewName('Unknown Product')).toThrow(ProductNameMappingError);
      expect(() => convertOldToNewName('Invalid')).toThrow('No mapping found for product name: Invalid');
    });

    it('should throw ProductNameValidationError for invalid inputs', () => {
      expect(() => convertOldToNewName('')).toThrow(ProductNameValidationError);
      expect(() => convertOldToNewName('   ')).toThrow(ProductNameValidationError);
      expect(() => convertOldToNewName(null as any)).toThrow(ProductNameValidationError);
      expect(() => convertOldToNewName(undefined as any)).toThrow(ProductNameValidationError);
    });

    it('should handle whitespace in product names', () => {
      expect(convertOldToNewName('  Tina  ')).toBe('Ti');
      expect(convertOldToNewName(' Glass Pipe ')).toBe('Pi');
    });
  });

  describe('convertNewToOldName', () => {
    it('should convert valid new names to old names', () => {
      expect(convertNewToOldName('Ti')).toBe('Tina');
      expect(convertNewToOldName('Pi')).toBe('Glass Pipe');
      expect(convertNewToOldName('Mu')).toBe('Shrooms');
    });

    it('should throw ProductNameMappingError for unknown new names', () => {
      expect(() => convertNewToOldName('XX')).toThrow(ProductNameMappingError);
      expect(() => convertNewToOldName('Invalid')).toThrow('No mapping found for product name: Invalid');
    });

    it('should throw ProductNameValidationError for invalid inputs', () => {
      expect(() => convertNewToOldName('')).toThrow(ProductNameValidationError);
      expect(() => convertNewToOldName('   ')).toThrow(ProductNameValidationError);
      expect(() => convertNewToOldName(null as any)).toThrow(ProductNameValidationError);
    });
  });

  describe('Safe conversion functions', () => {
    it('should safely convert valid names', () => {
      expect(safeConvertOldToNewName('Tina')).toBe('Ti');
      expect(safeConvertNewToOldName('Ti')).toBe('Tina');
    });

    it('should return original name as fallback for invalid names', () => {
      expect(safeConvertOldToNewName('Invalid')).toBe('Invalid');
      expect(safeConvertNewToOldName('XX')).toBe('XX');
    });

    it('should use custom fallback when provided', () => {
      expect(safeConvertOldToNewName('Invalid', 'FALLBACK')).toBe('FALLBACK');
      expect(safeConvertNewToOldName('XX', 'FALLBACK')).toBe('FALLBACK');
    });
  });
});

describe('Product Name Validation', () => {
  describe('isValidOldProductName', () => {
    it('should return true for valid old product names', () => {
      expect(isValidOldProductName('Tina')).toBe(true);
      expect(isValidOldProductName('Glass Pipe')).toBe(true);
      expect(isValidOldProductName('Shrooms')).toBe(true);
    });

    it('should return false for invalid old product names', () => {
      expect(isValidOldProductName('Ti')).toBe(false);
      expect(isValidOldProductName('Invalid')).toBe(false);
      expect(isValidOldProductName('')).toBe(false);
      expect(isValidOldProductName(null as any)).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(isValidOldProductName('  Tina  ')).toBe(true);
    });
  });

  describe('isValidNewProductName', () => {
    it('should return true for valid new product names', () => {
      expect(isValidNewProductName('Ti')).toBe(true);
      expect(isValidNewProductName('Pi')).toBe(true);
      expect(isValidNewProductName('Mu')).toBe(true);
    });

    it('should return false for invalid new product names', () => {
      expect(isValidNewProductName('Tina')).toBe(false);
      expect(isValidNewProductName('Invalid')).toBe(false);
      expect(isValidNewProductName('')).toBe(false);
      expect(isValidNewProductName(null as any)).toBe(false);
    });
  });

  describe('isValidProductName', () => {
    it('should return true for both old and new valid names', () => {
      expect(isValidProductName('Tina')).toBe(true);
      expect(isValidProductName('Ti')).toBe(true);
      expect(isValidProductName('Glass Pipe')).toBe(true);
      expect(isValidProductName('Pi')).toBe(true);
    });

    it('should return false for invalid names', () => {
      expect(isValidProductName('Invalid')).toBe(false);
      expect(isValidProductName('')).toBe(false);
    });
  });

  describe('validateAndNormalizeProductName', () => {
    it('should return normalized valid product names', () => {
      expect(validateAndNormalizeProductName('  Tina  ')).toBe('Tina');
      expect(validateAndNormalizeProductName('Ti')).toBe('Ti');
    });

    it('should throw for invalid product names', () => {
      expect(() => validateAndNormalizeProductName('Invalid')).toThrow(ProductNameValidationError);
      expect(() => validateAndNormalizeProductName('')).toThrow(ProductNameValidationError);
      expect(() => validateAndNormalizeProductName('   ')).toThrow(ProductNameValidationError);
    });
  });

  describe('getPreferredProductName', () => {
    it('should return new name for old product names', () => {
      expect(getPreferredProductName('Tina')).toBe('Ti');
      expect(getPreferredProductName('Glass Pipe')).toBe('Pi');
    });

    it('should return same name for already new product names', () => {
      expect(getPreferredProductName('Ti')).toBe('Ti');
      expect(getPreferredProductName('Pi')).toBe('Pi');
    });

    it('should throw for invalid product names', () => {
      expect(() => getPreferredProductName('Invalid')).toThrow(ProductNameValidationError);
    });
  });
});

describe('Batch Operations', () => {
  describe('batchConvertOldToNewNames', () => {
    it('should convert multiple valid old names', () => {
      const results = batchConvertOldToNewNames(['Tina', 'Glass Pipe', 'Shrooms']);
      
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({
        originalName: 'Tina',
        convertedName: 'Ti',
        success: true
      });
      expect(results[1]).toEqual({
        originalName: 'Glass Pipe',
        convertedName: 'Pi',
        success: true
      });
      expect(results[2]).toEqual({
        originalName: 'Shrooms',
        convertedName: 'Mu',
        success: true
      });
    });

    it('should handle mixed valid and invalid names', () => {
      const results = batchConvertOldToNewNames(['Tina', 'Invalid', 'Glass Pipe']);
      
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[0].convertedName).toBe('Ti');
      
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeInstanceOf(ProductNameMappingError);
      
      expect(results[2].success).toBe(true);
      expect(results[2].convertedName).toBe('Pi');
    });

    it('should handle empty array', () => {
      const results = batchConvertOldToNewNames([]);
      expect(results).toHaveLength(0);
    });
  });
});

describe('Mapping Statistics', () => {
  it('should return correct mapping statistics', () => {
    const stats = getMappingStatistics();
    
    expect(stats.totalMappings).toBe(16);
    expect(stats.oldNames).toHaveLength(16);
    expect(stats.newNames).toHaveLength(16);
    expect(stats.averageOldNameLength).toBeGreaterThan(0);
    expect(stats.averageNewNameLength).toBeGreaterThan(0);
    expect(stats.longestOldName).toBe('Torch Lighter');
    expect(stats.shortestOldName).toBe('GH');
    expect(stats.duplicateNewNames).toHaveLength(0);
  });
});

describe('Error Classes', () => {
  it('should create ProductNameError with correct properties', () => {
    const error = new ProductNameError('Test message', 'TestProduct');
    expect(error.message).toBe('Test message');
    expect(error.productName).toBe('TestProduct');
    expect(error.name).toBe('ProductNameError');
  });

  it('should create ProductNameMappingError with correct properties', () => {
    const error = new ProductNameMappingError('TestProduct');
    expect(error.message).toBe('No mapping found for product name: TestProduct');
    expect(error.productName).toBe('TestProduct');
    expect(error.name).toBe('ProductNameMappingError');
  });

  it('should create ProductNameValidationError with correct properties', () => {
    const error = new ProductNameValidationError('TestProduct', 'Test reason');
    expect(error.message).toBe('Invalid product name "TestProduct": Test reason');
    expect(error.productName).toBe('TestProduct');
    expect(error.name).toBe('ProductNameValidationError');
  });
});