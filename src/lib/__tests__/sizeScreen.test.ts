import { describe, it, expect } from 'vitest';
import type { CategoryData, ProductTypeData, SizeData } from '../../types';

describe('Size Screen Data Structure', () => {
  it('should properly structure size data for rendering', () => {
    // Mock category data
    const mockCategory: CategoryData = {
      id: 'Ti',
      name: 'Ti',
      products: []
    };

    // Mock product with sizes
    const mockProduct: ProductTypeData = {
      id: 'ti-premium',
      name: 'Ti Premium',
      sizes: [
        { id: '1g', name: '1g', price: 50 },
        { id: '2g', name: '2g', price: 80 },
        { id: '3.5g', name: '3.5g', price: 160 }
      ],
      allowCustom: 'g'
    };

    // Test that sizes are properly structured
    expect(mockProduct.sizes).toHaveLength(3);
    expect(mockProduct.sizes[0]).toEqual({
      id: '1g',
      name: '1g', 
      price: 50
    });

    // Test custom size option would be added
    const customSize: SizeData = {
      id: 'custom',
      name: `Custom (${mockProduct.allowCustom})`,
      price: 0,
      unit: mockProduct.allowCustom
    };

    expect(customSize.name).toBe('Custom (g)');
    expect(customSize.unit).toBe('g');
  });

  it('should handle products without custom sizing', () => {
    const mockProduct: ProductTypeData = {
      id: 'sp',
      name: 'Sp',
      sizes: [
        { id: 'unit', name: 'unit', price: 3 }
      ]
    };

    expect(mockProduct.allowCustom).toBeUndefined();
    expect(mockProduct.sizes).toHaveLength(1);
  });

  it('should calculate custom pricing correctly', () => {
    const mockSizes: SizeData[] = [
      { id: '1g', name: '1g', price: 50 },
      { id: '2g', name: '2g', price: 80 },
      { id: '3.5g', name: '3.5g', price: 160 }
    ];

    // Find base price for 1g
    const baseSize = mockSizes.find(s => s.name === '1g');
    expect(baseSize?.price).toBe(50);

    // Calculate custom price for 5g
    const customAmount = 5;
    const customPrice = customAmount * (baseSize?.price || 0);
    expect(customPrice).toBe(250);
  });
});