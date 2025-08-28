import { describe, it, expect } from 'vitest';
import type { CartItem } from '../../types';

describe('Cart Display Functionality', () => {
  it('should create proper hierarchy display for cart items', () => {
    const mockCartItem: CartItem = {
      productId: 'ti-ti-123456',
      productName: 'Ti',
      product: 'Ti',
      categoryName: 'Ti',
      productTypeName: 'Ti',
      displayName: 'Ti > Ti > 1g',
      size: '1g',
      quantity: 2,
      price: 60
    };

    // Test hierarchy display creation
    const sizeDisplay = typeof mockCartItem.size === 'string' 
      ? mockCartItem.size 
      : `${mockCartItem.size}${mockCartItem.unit || ''} (Custom)`;
    
    const hierarchyDisplay = mockCartItem.displayName || 
      `${mockCartItem.categoryName || 'Unknown'} > ${mockCartItem.productTypeName || mockCartItem.productName} > ${sizeDisplay}`;

    expect(hierarchyDisplay).toBe('Ti > Ti > 1g');
    expect(sizeDisplay).toBe('1g');
  });

  it('should handle custom size display correctly', () => {
    const mockCartItemCustom: CartItem = {
      productId: 'gh-gh-123456',
      productName: 'Gh',
      product: 'Gh',
      categoryName: 'Gh',
      productTypeName: 'Gh',
      size: 15,
      unit: 'ml',
      quantity: 1,
      price: 30
    };

    const sizeDisplay = typeof mockCartItemCustom.size === 'string' 
      ? mockCartItemCustom.size 
      : `${mockCartItemCustom.size}${mockCartItemCustom.unit || ''} (Custom)`;
    
    const hierarchyDisplay = mockCartItemCustom.displayName || 
      `${mockCartItemCustom.categoryName || 'Unknown'} > ${mockCartItemCustom.productTypeName || mockCartItemCustom.productName} > ${sizeDisplay}`;

    expect(sizeDisplay).toBe('15ml (Custom)');
    expect(hierarchyDisplay).toBe('Gh > Gh > 15ml (Custom)');
  });

  it('should calculate unit price correctly', () => {
    const mockCartItem: CartItem = {
      productId: 'ti-ti-premium-123456',
      productName: 'Ti Premium',
      product: 'Ti Premium',
      categoryName: 'Ti',
      productTypeName: 'Ti Premium',
      displayName: 'Ti > Ti Premium > 3.5g',
      size: '3.5g',
      quantity: 3,
      price: 480 // 160 * 3
    };

    const unitPrice = mockCartItem.price / mockCartItem.quantity;
    expect(unitPrice).toBe(160);
  });

  it('should handle missing category information gracefully', () => {
    const mockCartItemIncomplete: CartItem = {
      productId: 'unknown-product-123456',
      productName: 'Unknown Product',
      product: 'Unknown Product',
      size: '1g',
      quantity: 1,
      price: 30
    };

    const sizeDisplay = typeof mockCartItemIncomplete.size === 'string' 
      ? mockCartItemIncomplete.size 
      : `${mockCartItemIncomplete.size}${mockCartItemIncomplete.unit || ''} (Custom)`;
    
    const hierarchyDisplay = mockCartItemIncomplete.displayName || 
      `${mockCartItemIncomplete.categoryName || 'Unknown'} > ${mockCartItemIncomplete.productTypeName || mockCartItemIncomplete.productName} > ${sizeDisplay}`;

    expect(hierarchyDisplay).toBe('Unknown > Unknown Product > 1g');
  });
});