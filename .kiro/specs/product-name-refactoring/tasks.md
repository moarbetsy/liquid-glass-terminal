# Implementation Plan

- [x] 1. Create product name mapping configuration and migration utilities
  - Create a centralized mapping configuration file with old-to-new product name mappings
  - Implement utility functions for product name conversion and validation
  - Add comprehensive error handling for missing or invalid product mappings
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 2. Enhance migration service for product name refactoring
  - Extend existing migration service to handle product name updates in localStorage data
  - Add new migration version specifically for product name refactoring
  - Implement migration functions for products, orders, and cart items
  - Add rollback capability and comprehensive logging for migration process
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Update product configuration with new names
  - Update `src/lib/productConfig.ts` to use new 2-letter abbreviations as keys
  - Maintain all existing pricing, sizes, and configuration structure
  - Ensure all product variants and types are properly mapped to new names
  - _Requirements: 1.1, 3.1, 3.3_

- [x] 4. Update initial data with new product names
  - Update `src/lib/data.ts` initialProducts array to use new product names
  - Update any hardcoded product references in client notes or descriptions
  - Maintain all existing product IDs, pricing, and stock information
  - _Requirements: 1.1, 1.2, 3.1_

- [x] 5. Update OrderingTerminal component for new product names
  - Modify product display logic in `src/components/OrderingTerminal.tsx` to show new names
  - Update cart functionality to work correctly with new product names
  - Ensure product selection and quantity management works with new names
  - Update any product search or filtering logic to use new names
  - _Requirements: 1.1, 1.3, 3.2_

- [x] 6. Update ProductsPage component for new product names
  - Modify product listing and management in `src/components/ProductsPage.tsx` to use new names
  - Update product editing and stock management functionality
  - Ensure product creation and deletion works with new naming convention
  - Update any product-related UI elements to display new names
  - _Requirements: 1.1, 1.3, 3.2_

- [x] 7. Update migration service legacy mappings
  - Update existing legacy mappings in `src/lib/migrationService.ts` to use new product names
  - Ensure backward compatibility with existing migration logic
  - Add new mappings for the product name refactoring migration
  - _Requirements: 2.1, 2.2, 3.1_

- [x] 8. Update all test files with new product names
  - Update test mock data in all test files to use new product names
  - Modify test assertions and expectations to match new naming convention
  - Update product-related test scenarios to reflect new names
  - Ensure all existing tests pass with new product names
  - _Requirements: 3.2, 4.1, 4.2, 4.3_

- [x] 9. Update migration utility tests for new product names
  - Update `src/lib/__tests__/migrationUtils.test.ts` to test new product name mappings
  - Add comprehensive tests for product name migration functions
  - Test edge cases like missing products or invalid mappings
  - Verify migration preserves data integrity with new names
  - _Requirements: 4.1, 4.4, 4.5_

- [x] 10. Update badge and cart-related tests
  - Update badge count tests to work with new product names
  - Update cart display and functionality tests for new naming convention
  - Ensure real-time updates and error handling tests work with new names
  - Update integration tests to use new product names
  - _Requirements: 4.2, 4.3, 4.5_

- [x] 11. Add comprehensive migration tests for product name refactoring
  - Create new test suite specifically for product name migration functionality
  - Test migration of products, orders, and cart items from old to new names
  - Test error handling and rollback scenarios for failed migrations
  - Verify migration performance and data integrity
  - _Requirements: 4.1, 4.4, 4.5_

- [x] 12. Update any remaining component references to product names
  - Search for and update any remaining hardcoded product name references in components
  - Update any product-related utility functions to use new names
  - Ensure consistent naming throughout the entire codebase
  - Remove any legacy product name references that are no longer needed
  - _Requirements: 1.1, 3.1, 3.4_