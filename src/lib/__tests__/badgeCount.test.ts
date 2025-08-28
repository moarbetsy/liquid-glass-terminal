import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Order } from '../../types';
import { getUncompletedOrdersCount, shouldShowBadge, getBadgeValue } from '../badgeUtils';
import { ErrorHandler } from '../errorHandling';

describe('Badge Count Logic', () => {
  describe('getUncompletedOrdersCount', () => {
    it('should count only unpaid orders from mixed status array', () => {
      const orders: Order[] = [
        {
          id: 'order-1',
          clientId: 'client-1',
          clientName: 'Client 1',
          items: [],
          total: 100,
          status: 'Unpaid',
          date: '2024-01-01'
        },
        {
          id: 'order-2',
          clientId: 'client-2',
          clientName: 'Client 2',
          items: [],
          total: 200,
          status: 'Completed',
          date: '2024-01-02'
        },
        {
          id: 'order-3',
          clientId: 'client-3',
          clientName: 'Client 3',
          items: [],
          total: 150,
          status: 'Unpaid',
          date: '2024-01-03'
        },
        {
          id: 'order-4',
          clientId: 'client-4',
          clientName: 'Client 4',
          items: [],
          total: 75,
          status: 'Completed',
          date: '2024-01-04'
        }
      ];

      const result = getUncompletedOrdersCount(orders);
      expect(result).toBe(2);
    });

    it('should return 0 when all orders are completed', () => {
      const orders: Order[] = [
        {
          id: 'order-1',
          clientId: 'client-1',
          clientName: 'Client 1',
          items: [],
          total: 100,
          status: 'Completed',
          date: '2024-01-01'
        },
        {
          id: 'order-2',
          clientId: 'client-2',
          clientName: 'Client 2',
          items: [],
          total: 200,
          status: 'Completed',
          date: '2024-01-02'
        }
      ];

      const result = getUncompletedOrdersCount(orders);
      expect(result).toBe(0);
    });

    it('should handle empty orders array', () => {
      const orders: Order[] = [];
      const result = getUncompletedOrdersCount(orders);
      expect(result).toBe(0);
    });

    it('should handle malformed order objects', () => {
      // Test with null/undefined orders in array
      const ordersWithNull: any[] = [
        {
          id: 'order-1',
          clientId: 'client-1',
          clientName: 'Client 1',
          items: [],
          total: 100,
          status: 'Unpaid',
          date: '2024-01-01'
        },
        null,
        {
          id: 'order-2',
          clientId: 'client-2',
          clientName: 'Client 2',
          items: [],
          total: 200,
          status: 'Unpaid',
          date: '2024-01-02'
        },
        undefined,
        {
          id: 'order-3',
          clientId: 'client-3',
          clientName: 'Client 3',
          items: [],
          total: 150,
          status: 'Completed',
          date: '2024-01-03'
        }
      ];

      const result = getUncompletedOrdersCount(ordersWithNull);
      expect(result).toBe(2); // Should only count valid unpaid orders
    });

    it('should handle orders with missing status property', () => {
      const ordersWithMissingStatus: any[] = [
        {
          id: 'order-1',
          clientId: 'client-1',
          clientName: 'Client 1',
          items: [],
          total: 100,
          status: 'Unpaid',
          date: '2024-01-01'
        },
        {
          id: 'order-2',
          clientId: 'client-2',
          clientName: 'Client 2',
          items: [],
          total: 200,
          // Missing status property
          date: '2024-01-02'
        },
        {
          id: 'order-3',
          clientId: 'client-3',
          clientName: 'Client 3',
          items: [],
          total: 150,
          status: 'Completed',
          date: '2024-01-03'
        }
      ];

      const result = getUncompletedOrdersCount(ordersWithMissingStatus);
      expect(result).toBe(1); // Should only count the valid unpaid order
    });

    it('should handle invalid status values', () => {
      const ordersWithInvalidStatus: any[] = [
        {
          id: 'order-1',
          clientId: 'client-1',
          clientName: 'Client 1',
          items: [],
          total: 100,
          status: 'Unpaid',
          date: '2024-01-01'
        },
        {
          id: 'order-2',
          clientId: 'client-2',
          clientName: 'Client 2',
          items: [],
          total: 200,
          status: 'InvalidStatus',
          date: '2024-01-02'
        },
        {
          id: 'order-3',
          clientId: 'client-3',
          clientName: 'Client 3',
          items: [],
          total: 150,
          status: null,
          date: '2024-01-03'
        }
      ];

      const result = getUncompletedOrdersCount(ordersWithInvalidStatus);
      expect(result).toBe(1); // Should only count the valid unpaid order
    });

    it('should handle null or undefined orders array', () => {
      expect(getUncompletedOrdersCount(null as any)).toBe(0);
      expect(getUncompletedOrdersCount(undefined as any)).toBe(0);
    });

    it('should handle non-array input', () => {
      expect(getUncompletedOrdersCount('not an array' as any)).toBe(0);
      expect(getUncompletedOrdersCount({} as any)).toBe(0);
      expect(getUncompletedOrdersCount(123 as any)).toBe(0);
    });
  });

  describe('shouldShowBadge', () => {
    it('should return true when there are unpaid orders', () => {
      const orders: Order[] = [
        {
          id: 'order-1',
          clientId: 'client-1',
          clientName: 'Client 1',
          items: [],
          total: 100,
          status: 'Unpaid',
          date: '2024-01-01'
        }
      ];

      expect(shouldShowBadge(orders)).toBe(true);
    });

    it('should return false when all orders are completed', () => {
      const orders: Order[] = [
        {
          id: 'order-1',
          clientId: 'client-1',
          clientName: 'Client 1',
          items: [],
          total: 100,
          status: 'Completed',
          date: '2024-01-01'
        }
      ];

      expect(shouldShowBadge(orders)).toBe(false);
    });

    it('should return false for empty orders array', () => {
      expect(shouldShowBadge([])).toBe(false);
    });
  });

  describe('getBadgeValue', () => {
    it('should return count when there are unpaid orders', () => {
      const orders: Order[] = [
        {
          id: 'order-1',
          clientId: 'client-1',
          clientName: 'Client 1',
          items: [],
          total: 100,
          status: 'Unpaid',
          date: '2024-01-01'
        },
        {
          id: 'order-2',
          clientId: 'client-2',
          clientName: 'Client 2',
          items: [],
          total: 200,
          status: 'Unpaid',
          date: '2024-01-02'
        }
      ];

      expect(getBadgeValue(orders)).toBe(2);
    });

    it('should return undefined when count is 0', () => {
      const orders: Order[] = [
        {
          id: 'order-1',
          clientId: 'client-1',
          clientName: 'Client 1',
          items: [],
          total: 100,
          status: 'Completed',
          date: '2024-01-01'
        }
      ];

      expect(getBadgeValue(orders)).toBeUndefined();
    });

    it('should return undefined for empty orders array', () => {
      expect(getBadgeValue([])).toBeUndefined();
    });
  });

  describe('Error Handling and Logging', () => {
    let logErrorSpy: any;

    beforeEach(() => {
      logErrorSpy = vi.spyOn(ErrorHandler, 'logError').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should log error for invalid orders input', () => {
      getUncompletedOrdersCount(null as any);
      
      expect(logErrorSpy).toHaveBeenCalledWith(
        'BadgeCount',
        'Invalid orders input - not an array',
        { orders: null }
      );
    });

    it('should log error for invalid order objects', () => {
      const ordersWithInvalidObject: any[] = [
        {
          id: 'order-1',
          clientId: 'client-1',
          clientName: 'Client 1',
          items: [],
          total: 100,
          status: 'Unpaid',
          date: '2024-01-01'
        },
        'invalid-order-object'
      ];

      getUncompletedOrdersCount(ordersWithInvalidObject);
      
      expect(logErrorSpy).toHaveBeenCalledWith(
        'BadgeCount',
        'Invalid order object found',
        { order: 'invalid-order-object' }
      );
    });

    it('should log error for invalid order status values', () => {
      const ordersWithInvalidStatus: any[] = [
        {
          id: 'order-1',
          clientId: 'client-1',
          clientName: 'Client 1',
          items: [],
          total: 100,
          status: 'InvalidStatus',
          date: '2024-01-01'
        }
      ];

      getUncompletedOrdersCount(ordersWithInvalidStatus);
      
      expect(logErrorSpy).toHaveBeenCalledWith(
        'BadgeCount',
        'Invalid order status found',
        { 
          orderId: 'order-1', 
          status: 'InvalidStatus',
          validStatuses: ['Unpaid', 'Completed']
        }
      );
    });

    it('should return fallback value when calculation throws error', () => {
      // Mock the filter method to throw an error
      const mockOrders: any[] = [];
      Object.defineProperty(mockOrders, 'filter', {
        value: () => { throw new Error('Filter operation failed'); }
      });

      const result = getUncompletedOrdersCount(mockOrders as any);
      expect(result).toBe(0); // Should return fallback value
    });

    it('should handle errors gracefully in shouldShowBadge', () => {
      const mockOrders: any[] = [];
      Object.defineProperty(mockOrders, 'filter', {
        value: () => { throw new Error('Filter operation failed'); }
      });

      const result = shouldShowBadge(mockOrders as any);
      expect(result).toBe(false); // Should return fallback value
    });

    it('should handle errors gracefully in getBadgeValue', () => {
      const mockOrders: any[] = [];
      Object.defineProperty(mockOrders, 'filter', {
        value: () => { throw new Error('Filter operation failed'); }
      });

      const result = getBadgeValue(mockOrders as any);
      expect(result).toBeUndefined(); // Should return fallback value
    });

    it('should validate order status values correctly', () => {
      const ordersWithMixedStatuses: any[] = [
        {
          id: 'order-1',
          clientId: 'client-1',
          clientName: 'Client 1',
          items: [],
          total: 100,
          status: 'Unpaid', // Valid
          date: '2024-01-01'
        },
        {
          id: 'order-2',
          clientId: 'client-2',
          clientName: 'Client 2',
          items: [],
          total: 200,
          status: 'Completed', // Valid
          date: '2024-01-02'
        },
        {
          id: 'order-3',
          clientId: 'client-3',
          clientName: 'Client 3',
          items: [],
          total: 150,
          status: 'Pending', // Invalid
          date: '2024-01-03'
        },
        {
          id: 'order-4',
          clientId: 'client-4',
          clientName: 'Client 4',
          items: [],
          total: 75,
          status: 'Unpaid', // Valid
          date: '2024-01-04'
        }
      ];

      const result = getUncompletedOrdersCount(ordersWithMixedStatuses);
      expect(result).toBe(2); // Should only count valid 'Unpaid' orders
      
      // Should log error for invalid status
      expect(logErrorSpy).toHaveBeenCalledWith(
        'BadgeCount',
        'Invalid order status found',
        { 
          orderId: 'order-3', 
          status: 'Pending',
          validStatuses: ['Unpaid', 'Completed']
        }
      );
    });
  });
});