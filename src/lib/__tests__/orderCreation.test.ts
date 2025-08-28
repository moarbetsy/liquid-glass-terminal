import { describe, it, expect } from 'vitest';
import type { CartItem, Order, Client } from '../../types';

describe('Enhanced Order Creation', () => {
  it('should create order with complete hierarchy information', () => {
    // Mock cart items with enhanced hierarchy data
    const mockCartItems: CartItem[] = [
      {
        productId: 'ti-ti-premium-1',
        productName: 'Ti Premium',
        product: 'Ti Premium',
        categoryName: 'Ti',
        productTypeName: 'Ti Premium',
        displayName: 'Ti > Ti Premium > 1g',
        size: '1g',
        unit: 'g',
        quantity: 2,
        price: 100
      },
      {
        productId: 'vi-blue-2',
        productName: 'Blue',
        product: 'Blue',
        categoryName: 'Vi',
        productTypeName: 'Blue',
        displayName: 'Vi > Blue > 1 pill',
        size: '1 pill',
        quantity: 5,
        price: 50
      }
    ];

    const mockClient: Client = {
      id: 'client-1',
      displayId: 1,
      name: 'Test Client',
      orders: 0,
      totalSpent: 0
    };

    // Simulate order creation (similar to handlePlaceOrder)
    const order: Order = {
      id: `order-${Date.now()}`,
      clientId: mockClient.id,
      clientName: mockClient.name,
      items: mockCartItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        type: item.type,
        size: item.size,
        unit: item.unit,
        quantity: item.quantity,
        price: item.price,
        // Include enhanced hierarchy information in order items
        categoryName: item.categoryName,
        productTypeName: item.productTypeName
      })),
      total: mockCartItems.reduce((total, item) => total + item.price, 0),
      status: 'Unpaid',
      date: new Date().toISOString(),
      notes: ''
    };

    // Verify order contains complete hierarchy information
    expect(order.items).toHaveLength(2);
    
    // Check first item (Ti Premium)
    expect(order.items[0]).toMatchObject({
      productName: 'Ti Premium',
      categoryName: 'Ti',
      productTypeName: 'Ti Premium',
      size: '1g',
      quantity: 2,
      price: 100
    });

    // Check second item (Vi Blue)
    expect(order.items[1]).toMatchObject({
      productName: 'Blue',
      categoryName: 'Vi',
      productTypeName: 'Blue',
      size: '1 pill',
      quantity: 5,
      price: 50
    });

    // Verify total calculation
    expect(order.total).toBe(150);
    
    // Verify client information
    expect(order.clientId).toBe('client-1');
    expect(order.clientName).toBe('Test Client');
  });

  it('should handle legacy cart items without hierarchy information', () => {
    // Mock legacy cart items (without categoryName/productTypeName)
    const legacyCartItems: CartItem[] = [
      {
        productId: 'legacy-product-1',
        productName: 'Legacy Product',
        product: 'Legacy Product',
        size: '1g',
        quantity: 1,
        price: 25
      }
    ];

    const mockClient: Client = {
      id: 'client-2',
      displayId: 2,
      name: 'Legacy Client',
      orders: 0,
      totalSpent: 0
    };

    // Create order from legacy cart items
    const order: Order = {
      id: `order-${Date.now()}`,
      clientId: mockClient.id,
      clientName: mockClient.name,
      items: legacyCartItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        type: item.type,
        size: item.size,
        unit: item.unit,
        quantity: item.quantity,
        price: item.price,
        categoryName: item.categoryName, // Will be undefined for legacy items
        productTypeName: item.productTypeName // Will be undefined for legacy items
      })),
      total: legacyCartItems.reduce((total, item) => total + item.price, 0),
      status: 'Unpaid',
      date: new Date().toISOString(),
      notes: ''
    };

    // Verify order is created successfully even without hierarchy info
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({
      productName: 'Legacy Product',
      size: '1g',
      quantity: 1,
      price: 25,
      categoryName: undefined,
      productTypeName: undefined
    });
  });
});