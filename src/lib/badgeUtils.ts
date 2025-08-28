import type { Order } from '../types';
import { ErrorHandler } from './errorHandling';

/**
 * Valid order status values for validation
 */
const VALID_ORDER_STATUSES: Array<Order['status']> = ['Unpaid', 'Completed'];

/**
 * Validates if an order status is valid
 * @param status The status to validate
 * @returns True if status is valid, false otherwise
 */
const isValidOrderStatus = (status: any): status is Order['status'] => {
  return VALID_ORDER_STATUSES.includes(status);
};

/**
 * Calculates the count of uncompleted orders for badge display
 * @param orders Array of orders to filter
 * @returns Number of orders with 'Unpaid' status
 */
export const getUncompletedOrdersCount = (orders: Order[]): number => {
  return ErrorHandler.withErrorBoundary(() => {
    // Input validation
    if (!orders || !Array.isArray(orders)) {
      ErrorHandler.logError('BadgeCount', 'Invalid orders input - not an array', { orders });
      return 0;
    }
    
    // Filter orders with proper validation
    const uncompletedCount = orders.filter(order => {
      // Validate order object structure
      if (!order || typeof order !== 'object') {
        ErrorHandler.logError('BadgeCount', 'Invalid order object found', { order });
        return false;
      }
      
      // Validate order status before filtering
      if (!isValidOrderStatus(order.status)) {
        ErrorHandler.logError('BadgeCount', 'Invalid order status found', { 
          orderId: order.id, 
          status: order.status,
          validStatuses: VALID_ORDER_STATUSES 
        });
        return false;
      }
      
      return order.status === 'Unpaid';
    }).length;
    
    return uncompletedCount;
  }, 0, 'getUncompletedOrdersCount');
};

/**
 * Determines if the badge should be shown based on order count
 * @param orders Array of orders to evaluate
 * @returns True if badge should be shown (count > 0), false otherwise
 */
export const shouldShowBadge = (orders: Order[]): boolean => {
  return ErrorHandler.withErrorBoundary(() => {
    return getUncompletedOrdersCount(orders) > 0;
  }, false, 'shouldShowBadge');
};

/**
 * Gets the badge value for display (undefined if count is 0)
 * @param orders Array of orders to evaluate
 * @returns Badge count number or undefined if no badge should be shown
 */
export const getBadgeValue = (orders: Order[]): number | undefined => {
  return ErrorHandler.withErrorBoundary(() => {
    const count = getUncompletedOrdersCount(orders);
    return count > 0 ? count : undefined;
  }, undefined, 'getBadgeValue');
};