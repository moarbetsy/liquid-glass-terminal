# Implementation Plan

- [x] 1. Update badge count calculation in App.tsx
  - Replace static `orders.length` with filtered count of uncompleted orders
  - Implement conditional badge value assignment (undefined when count is 0)
  - Add defensive filtering to handle potential data inconsistencies
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Add performance optimization with useMemo
  - Implement memoized calculation for uncompleted orders count
  - Add proper dependency array to prevent unnecessary recalculations
  - Ensure React's reactivity triggers badge updates when orders change
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Enhance badge accessibility and styling
  - Add ARIA labels for screen reader support
  - Add role="status" for dynamic content announcement
  - Ensure badge maintains existing glassmorphism styling consistency
  - Verify badge positioning and responsive behavior
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4. Create unit tests for badge count logic
  - Write test for counting only unpaid orders from mixed status array
  - Write test for returning 0 when all orders are completed
  - Write test for handling empty orders array
  - Write test for handling malformed order objects
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 5. Create integration tests for real-time updates
  - Write test for badge update when order status changes from unpaid to completed
  - Write test for badge update when order status changes from unpaid to paid
  - Write test for badge visibility toggle when count changes between 0 and 1
  - Write test for badge updates from OrdersPage component interactions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4_

- [x] 6. Add error handling and logging
  - Implement try-catch around badge count calculation
  - Add error logging using existing ErrorHandler utility
  - Implement fallback behavior when calculation fails
  - Add validation for order status values before filtering
  - _Requirements: 1.1, 2.5, 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Test cross-component functionality
  - Verify badge updates when orders are marked as paid in OrdersPage
  - Verify badge updates when new orders are created in OrderingTerminal
  - Verify badge updates when orders are deleted from OrdersPage
  - Test badge behavior with simultaneous order status changes
  - _Requirements: 3.1, 3.2, 3.3, 3.4_