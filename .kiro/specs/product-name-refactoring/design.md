# Design Document

## Overview

This design outlines a comprehensive refactoring approach to replace all product names in the Liquid Glass Business Terminal with standardized 2-letter abbreviations. The refactoring will maintain data integrity while updating the user interface, configuration files, tests, and all related functionality.

## Architecture

### Product Name Mapping Strategy

The refactoring will use a centralized mapping approach where:

1. **Mapping Configuration**: A single source of truth for old-to-new name mappings
2. **Migration Service**: Automated data migration for existing localStorage data
3. **Configuration Updates**: Update all product configuration files
4. **Component Updates**: Update all UI components that display product names
5. **Test Updates**: Update all test files to use new product names

### Product Name Mappings

```typescript
const PRODUCT_NAME_MAPPINGS = {
  // Current Name -> New Name
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
```

## Components and Interfaces

### 1. Migration Service Enhancement

**File**: `src/lib/migrationService.ts`

- Extend existing migration service to handle product name updates
- Add new migration version for product name refactoring
- Ensure backward compatibility with existing data
- Handle edge cases where products might not exist in mapping

### 2. Product Configuration Updates

**File**: `src/lib/productConfig.ts`

- Update all product keys to use new 2-letter abbreviations
- Maintain existing pricing and configuration structure
- Ensure all product variants are properly mapped

### 3. Data Layer Updates

**File**: `src/lib/data.ts`

- Update `initialProducts` array with new product names
- Maintain all existing product IDs and configurations
- Update any hardcoded product references in client notes or descriptions

### 4. Component Updates

**Files**: 
- `src/components/OrderingTerminal.tsx`
- `src/components/ProductsPage.tsx`
- Any other components that display product names

- Update display logic to show new product names
- Ensure cart functionality works with new names
- Update search and filtering logic
- Maintain existing UI/UX patterns

### 5. Type System Updates

**File**: `src/types.ts`

- Update any hardcoded product name references in type definitions
- Ensure type safety is maintained throughout the refactoring

## Data Models

### Migration Data Structure

```typescript
interface ProductNameMigration {
  version: string;
  mappings: Record<string, string>;
  migrateProducts: (products: Product[]) => Product[];
  migrateOrders: (orders: Order[]) => Order[];
  migrateCart: (cart: CartItem[]) => CartItem[];
}
```

### Updated Product Configuration

```typescript
interface UpdatedProductConfig {
  [newProductName: string]: {
    sizes?: { [size: string]: number };
    types?: { [typeName: string]: { [size: string]: number } };
    allowCustom?: string;
  };
}
```

## Error Handling

### Migration Error Handling

1. **Validation**: Verify all existing products can be mapped to new names
2. **Rollback**: Provide mechanism to rollback if migration fails
3. **Logging**: Comprehensive logging of migration process
4. **User Feedback**: Clear error messages if migration issues occur

### Runtime Error Handling

1. **Fallback Display**: If a product name is not found, display original name with warning
2. **Data Integrity**: Ensure orders and cart items remain functional even with missing mappings
3. **Graceful Degradation**: Application continues to work even if some products can't be mapped

## Testing Strategy

### Unit Tests

1. **Migration Service Tests**: Test all migration functions with various data scenarios
2. **Product Configuration Tests**: Verify all products are properly configured with new names
3. **Component Tests**: Test that components display new product names correctly
4. **Data Integrity Tests**: Ensure existing orders and cart items are properly migrated

### Integration Tests

1. **End-to-End Migration**: Test complete migration process from old to new names
2. **Order Creation**: Test that new orders can be created with new product names
3. **Cart Functionality**: Test adding/removing products with new names
4. **Search and Filter**: Test product search with new names

### Test Data Updates

1. **Mock Data**: Update all test mock data to use new product names
2. **Test Scenarios**: Update test scenarios to reflect new naming convention
3. **Edge Cases**: Test edge cases like missing products or invalid mappings

## Implementation Phases

### Phase 1: Core Infrastructure
- Create product name mapping configuration
- Enhance migration service with new migration version
- Update product configuration files

### Phase 2: Data Layer
- Update initial data with new product names
- Implement migration functions for existing data
- Add comprehensive error handling

### Phase 3: UI Components
- Update all components that display product names
- Ensure cart and ordering functionality works correctly
- Update search and filtering logic

### Phase 4: Testing and Validation
- Update all test files with new product names
- Add comprehensive migration tests
- Perform end-to-end testing of migration process

### Phase 5: Documentation and Cleanup
- Update any documentation or comments with new names
- Remove old product name references
- Verify no legacy names remain in codebase

## Backward Compatibility

### Data Migration Strategy

1. **Automatic Migration**: Detect old data format and automatically migrate on app load
2. **Version Tracking**: Track migration version to prevent duplicate migrations
3. **Data Preservation**: Ensure no data loss during migration process
4. **Rollback Support**: Maintain ability to rollback if issues are discovered

### Legacy Support

1. **Graceful Handling**: Handle cases where old product names might still exist
2. **Display Fallbacks**: Show meaningful names even for unmapped products
3. **Import/Export**: Ensure data export/import works with both old and new formats

## Performance Considerations

### Migration Performance

1. **Batch Processing**: Process large datasets in batches to avoid UI blocking
2. **Progress Indication**: Show migration progress for large datasets
3. **Lazy Migration**: Migrate data on-demand rather than all at once if needed

### Runtime Performance

1. **Caching**: Cache product name mappings for quick lookups
2. **Efficient Lookups**: Use efficient data structures for product name resolution
3. **Minimal Impact**: Ensure refactoring doesn't impact application performance

## Security Considerations

### Data Integrity

1. **Validation**: Validate all migrated data for consistency
2. **Backup**: Create backup of original data before migration
3. **Verification**: Verify migration results match expected outcomes

### Error Prevention

1. **Input Validation**: Validate all product name inputs
2. **Safe Defaults**: Use safe defaults for missing or invalid product names
3. **Audit Trail**: Log all migration activities for troubleshooting