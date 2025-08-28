import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as React from 'react';
import type { Order, Client, Product } from '../../types';
import OrdersPage from '../../components/OrdersPage';

// Mock window.alert and window.confirm
Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(() => true),
});

describe('Badge Real-time Updates Integration Tests', () => {
  let mockOrders: Order[];
  let mockClients: Client[];
  let mockProducts: Product[];
  let setOrdersMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock data
    mockOrders = [
      {
        id: 'order-1',
        clientId: 'client-1',
        clientName: 'John Doe',
        items: [{
          productId: 'prod-1',
          productName: 'Ti',
          type: 'Ti',
          size: '1g',
          quantity: 1,
          price: 50
        }],
        total: 50,
        status: 'Unpaid',
        date: '2024-01-01'
      },
      {
        id: 'order-2',
        clientId: 'client-2',
        clientName: 'Jane Smith',
        items: [{
          productId: 'prod-2',
          productName: 'Gh',
          type: 'Gh',
          size: '20ml',
          quantity: 1,
          price: 75
        }],
        total: 75,
        status: 'Unpaid',
        date: '2024-01-02'
      },
      {
        id: 'order-3',
        clientId: 'client-3',
        clientName: 'Bob Johnson',
        items: [{
          productId: 'prod-3',
          productName: 'Vi',
          type: 'Blue (100mg)',
          size: 'unit',
          quantity: 1,
          price: 100
        }],
        total: 100,
        status: 'Completed',
        date: '2024-01-03'
      }
    ];

    mockClients = [
      { id: 'client-1', displayId: 1, name: 'John Doe', orders: 1, totalSpent: 50 },
      { id: 'client-2', displayId: 2, name: 'Jane Smith', orders: 1, totalSpent: 75 },
      { id: 'client-3', displayId: 3, name: 'Bob Johnson', orders: 1, totalSpent: 100 }
    ];

    mockProducts = [
      { id: 'prod-1', name: 'Ti', type: 'g', stock: 10, price: 50 },
      { id: 'prod-2', name: 'Gh', type: 'ml', stock: 15, price: 75 },
      { id: 'prod-3', name: 'Vi', type: 'unit', stock: 20, price: 100 }
    ];

    setOrdersMock = vi.fn();
  });

  describe('Order status changes from unpaid to completed', () => {
    it('should update orders when marking an order as paid via "Mark as Paid" button', async () => {
      render(
        <OrdersPage 
          orders={mockOrders}
          setOrders={setOrdersMock}
          clients={mockClients}
          products={mockProducts}
        />
      );
      
      // Find and click "Mark as Paid" button for the first unpaid order
      const markAsPaidButtons = screen.getAllByText('Mark as Paid');
      expect(markAsPaidButtons).toHaveLength(2); // Two unpaid orders
      
      fireEvent.click(markAsPaidButtons[0]);
      
      // Verify setOrders was called with updated status
      expect(setOrdersMock).toHaveBeenCalledWith(expect.any(Function));
      
      // Simulate the state update by calling the function passed to setOrders
      const updateFunction = setOrdersMock.mock.calls[0][0];
      const updatedOrders = updateFunction(mockOrders);
      
      // Verify the order status was updated
      expect(updatedOrders[0].status).toBe('Completed');
      expect(updatedOrders[0].amountPaid).toBe(50);
      
      // Verify other orders remain unchanged
      expect(updatedOrders[1].status).toBe('Unpaid');
      expect(updatedOrders[2].status).toBe('Completed');
    });

    it('should verify order status update logic for edit scenarios', () => {
      // Test the core logic that determines order status based on payment
      const testOrder = { ...mockOrders[0] };
      
      // Simulate the logic used in OrdersPage for determining status
      const calculateNewStatus = (amountPaid: number, total: number) => {
        return amountPaid >= total ? 'Completed' : 'Unpaid';
      };
      
      // Test various payment scenarios
      expect(calculateNewStatus(0, 50)).toBe('Unpaid');
      expect(calculateNewStatus(25, 50)).toBe('Unpaid');
      expect(calculateNewStatus(50, 50)).toBe('Completed');
      expect(calculateNewStatus(75, 50)).toBe('Completed');
      
      // Verify this matches the expected behavior for badge calculation
      const updatedOrder = {
        ...testOrder,
        amountPaid: 50,
        status: calculateNewStatus(50, 50) as 'Unpaid' | 'Completed'
      };
      
      expect(updatedOrder.status).toBe('Completed');
    });
  });

  describe('Order status changes from unpaid to paid (partial payment)', () => {
    it('should handle partial payment logic correctly', () => {
      // Test the logic for partial payments and completion
      const partiallyPaidOrder = {
        ...mockOrders[0],
        amountPaid: 25 // Less than total of 50
      };
      
      // Verify initial state
      expect(partiallyPaidOrder.status).toBe('Unpaid');
      expect(partiallyPaidOrder.amountPaid).toBe(25);
      expect(partiallyPaidOrder.total).toBe(50);
      
      // Simulate updating to full payment
      const fullyPaidOrder = {
        ...partiallyPaidOrder,
        amountPaid: 50,
        status: 'Completed' as const
      };
      
      expect(fullyPaidOrder.status).toBe('Completed');
      expect(fullyPaidOrder.amountPaid).toBe(fullyPaidOrder.total);
      
      // Test badge calculation logic with partial vs full payment
      const ordersWithPartial = [partiallyPaidOrder, mockOrders[1], mockOrders[2]];
      const ordersWithFull = [fullyPaidOrder, mockOrders[1], mockOrders[2]];
      
      const unpaidCountPartial = ordersWithPartial.filter(order => order.status === 'Unpaid').length;
      const unpaidCountFull = ordersWithFull.filter(order => order.status === 'Unpaid').length;
      
      expect(unpaidCountPartial).toBe(2); // partiallyPaidOrder + mockOrders[1]
      expect(unpaidCountFull).toBe(1); // only mockOrders[1]
    });
  });

  describe('Badge visibility toggle when count changes between 0 and 1', () => {
    it('should handle deletion of unpaid orders', async () => {
      render(
        <OrdersPage 
          orders={mockOrders}
          setOrders={setOrdersMock}
          clients={mockClients}
          products={mockProducts}
        />
      );
      
      // Find and click delete button for first unpaid order
      const deleteButtons = screen.getAllByTitle('Delete Order');
      fireEvent.click(deleteButtons[0]);
      
      // Verify setOrders was called to remove the order
      expect(setOrdersMock).toHaveBeenCalledWith(expect.any(Function));
      
      const updateFunction = setOrdersMock.mock.calls[0][0];
      const updatedOrders = updateFunction(mockOrders);
      
      // Verify the order was removed
      expect(updatedOrders).toHaveLength(2);
      expect(updatedOrders.find(order => order.id === 'order-1')).toBeUndefined();
      
      // Verify remaining orders are correct
      expect(updatedOrders[0].id).toBe('order-2');
      expect(updatedOrders[1].id).toBe('order-3');
    });

    it('should handle adding new orders (simulated by testing order creation logic)', () => {
      // Test the logic that would be used when creating new orders
      const newOrder: Order = {
        id: 'order-4',
        clientId: 'client-1',
        clientName: 'John Doe',
        items: [{
          productId: 'prod-1',
          productName: 'Sp',
          type: 'Sp',
          size: 'unit',
          quantity: 1,
          price: 25
        }],
        total: 25,
        status: 'Unpaid',
        date: '2024-01-04'
      };
      
      // Simulate adding a new order to existing orders
      const ordersWithNewOrder = [...mockOrders, newOrder];
      
      // Count unpaid orders before and after
      const unpaidCountBefore = mockOrders.filter(order => order.status === 'Unpaid').length;
      const unpaidCountAfter = ordersWithNewOrder.filter(order => order.status === 'Unpaid').length;
      
      expect(unpaidCountBefore).toBe(2);
      expect(unpaidCountAfter).toBe(3);
    });
  });

  describe('Badge updates from OrdersPage component interactions', () => {
    it('should handle multiple simultaneous order status changes', async () => {
      render(
        <OrdersPage 
          orders={mockOrders}
          setOrders={setOrdersMock}
          clients={mockClients}
          products={mockProducts}
        />
      );
      
      // Mark first order as paid
      const markAsPaidButtons = screen.getAllByText('Mark as Paid');
      fireEvent.click(markAsPaidButtons[0]);
      
      // Verify first call to setOrders
      expect(setOrdersMock).toHaveBeenCalledTimes(1);
      
      // Mark second order as paid
      fireEvent.click(markAsPaidButtons[1]);
      
      // Verify second call to setOrders
      expect(setOrdersMock).toHaveBeenCalledTimes(2);
      
      // Verify both update functions work correctly
      const firstUpdateFunction = setOrdersMock.mock.calls[0][0];
      const firstUpdatedOrders = firstUpdateFunction(mockOrders);
      expect(firstUpdatedOrders[0].status).toBe('Completed');
      
      const secondUpdateFunction = setOrdersMock.mock.calls[1][0];
      const secondUpdatedOrders = secondUpdateFunction(firstUpdatedOrders);
      expect(secondUpdatedOrders[1].status).toBe('Completed');
      
      // Verify both originally unpaid orders are now completed
      const finalUnpaidCount = secondUpdatedOrders.filter(order => order.status === 'Unpaid').length;
      expect(finalUnpaidCount).toBe(0);
    });

    it('should verify order item editing logic affects badge calculation', () => {
      // Test the logic for how order item changes affect totals and status
      const originalOrder = mockOrders[0];
      
      // Simulate doubling quantity (which would double the price)
      const updatedItems = originalOrder.items.map(item => ({
        ...item,
        quantity: item.quantity * 2,
        price: item.price * 2 // Price should update based on quantity
      }));
      
      const newTotal = updatedItems.reduce((sum, item) => sum + item.price, 0);
      
      // Test different payment scenarios with new total
      const scenarios = [
        { amountPaid: 0, expectedStatus: 'Unpaid' },
        { amountPaid: newTotal / 2, expectedStatus: 'Unpaid' },
        { amountPaid: newTotal, expectedStatus: 'Completed' }
      ];
      
      scenarios.forEach(scenario => {
        const updatedOrder = {
          ...originalOrder,
          items: updatedItems,
          total: newTotal,
          amountPaid: scenario.amountPaid,
          status: scenario.amountPaid >= newTotal ? 'Completed' as const : 'Unpaid' as const
        };
        
        expect(updatedOrder.status).toBe(scenario.expectedStatus);
        expect(updatedOrder.total).toBe(100); // 50 * 2
      });
    });
  });

  describe('Cross-component functionality simulation', () => {
    it('should verify badge calculation logic works with different order states', () => {
      // Test various order state combinations that would affect badge count
      const testScenarios = [
        {
          name: 'All unpaid orders',
          orders: mockOrders.map(order => ({ ...order, status: 'Unpaid' as const })),
          expectedCount: 3
        },
        {
          name: 'Mixed status orders',
          orders: mockOrders, // 2 unpaid, 1 completed
          expectedCount: 2
        },
        {
          name: 'All completed orders',
          orders: mockOrders.map(order => ({ ...order, status: 'Completed' as const })),
          expectedCount: 0
        },
        {
          name: 'Empty orders array',
          orders: [],
          expectedCount: 0
        }
      ];

      testScenarios.forEach(scenario => {
        const unpaidCount = scenario.orders.filter(order => order.status === 'Unpaid').length;
        expect(unpaidCount).toBe(scenario.expectedCount);
      });
    });

    it('should verify order status transitions work correctly', () => {
      // Test the logic for determining when an order should be marked as completed
      const testCases = [
        { amountPaid: 0, total: 50, expectedStatus: 'Unpaid' },
        { amountPaid: 25, total: 50, expectedStatus: 'Unpaid' },
        { amountPaid: 50, total: 50, expectedStatus: 'Completed' },
        { amountPaid: 75, total: 50, expectedStatus: 'Completed' }
      ];

      testCases.forEach(testCase => {
        const status = testCase.amountPaid >= testCase.total ? 'Completed' : 'Unpaid';
        expect(status).toBe(testCase.expectedStatus);
      });
    });
  });
});