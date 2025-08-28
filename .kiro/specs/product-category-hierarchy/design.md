# Design Document

## Overview

This design implements a 3-layer hierarchical product selection system that transforms the current flat product structure into an organized category-based navigation. The system will maintain backward compatibility while providing an intuitive user experience through progressive disclosure of product options.

## Architecture

### Data Structure Changes

The current system uses a flat `PRODUCT_CONFIG` object where each product is a top-level key. The new system will introduce a category layer while maintaining the existing type and size structure:

```typescript
interface CategoryConfig {
  [categoryName: string]: {
    products: {
      [productName: string]: {
        types?: {
          [typeName: string]: {
            [size: string]: number;
          };
        };
        sizes?: {
          [size: string]: number;
        };
        allowCustom?: string;
      };
    };
  };
}
```

### Category Mapping

Based on the provided data structure, products will be organized into the following categories:

- **Ti**: Ti (regular), Ti Premium
- **Gh**: Gh (single product type)
- **Vi**: Blue, Purple, Red, Black, Levi, Kam Jelly
- **Ci**: 20mg, 60mg, 80mg
- **Sp**: Sp (single product type)
- **E**: E (single product type)
- **Md**: Md (single product type with multiple sizes)
- **We**: We (single product type)
- **Ha**: Ha (single product type)
- **Ke**: Ke (single product type)
- **Co**: Co (single product type)
- **Mu**: Mu (single product type)
- **Pop**: Pop (single product type)
- **Pi**: Pi (single product type)
- **Li**: Li (single product type)
- **Bo**: Bo (single product type)

## Components and Interfaces

### Updated Type Definitions

```typescript
interface CategoryData {
  id: string;
  name: string;
  products: ProductTypeData[];
}

interface ProductTypeData {
  id: string;
  name: string;
  sizes: SizeData[];
  allowCustom?: string;
}

interface SizeData {
  id: string;
  name: string;
  price: number;
  unit?: string;
}

interface NavigationState {
  currentLayer: 'category' | 'product' | 'size';
  selectedCategory?: CategoryData;
  selectedProduct?: ProductTypeData;
  history: NavigationState[];
}
```

### Screen Flow Updates

The OrderingTerminal component will be updated to support the new navigation flow:

1. **Category Screen** (Layer 1): Display all product categories
2. **Product Type Screen** (Layer 2): Show available product types within selected category
3. **Size Selection Screen** (Layer 3): Display sizes and prices for selected product type
4. **Cart Screen**: Maintain existing functionality with enhanced product information display

### Navigation Component

A new navigation system will handle the 3-layer hierarchy:

```typescript
interface NavigationProps {
  currentState: NavigationState;
  onNavigate: (newState: NavigationState) => void;
  onBack: () => void;
}
```

## Data Models

### Category Configuration Structure

The new category configuration will replace the current `PRODUCT_CONFIG`:

```typescript
export const CATEGORY_CONFIG: CategoryConfig = {
  "Ti": {
    products: {
      "Ti": {
        sizes: { "1g": 30, "2g": 60, "3.5g": 130, "7g": 200, "14g": 300, "28g": 450, "100g": 1800, "500g": 4900, "1kg": 8000 },
        allowCustom: "g"
      },
      "Ti Premium": {
        sizes: { "1g": 50, "2g": 80, "3.5g": 160, "7g": 230, "14g": 400, "28g": 550, "100g": 2000, "500g": 6555, "1kg": 9500 },
        allowCustom: "g"
      }
    }
  },
  "GH": {
    products: {
      "GH": {
        sizes: { "5ml": 10, "20ml": 40, "60ml": 100, "100ml": 180, "1000ml": 1400 },
        allowCustom: "ml"
      }
    }
  },
  // ... additional categories
};
```

### Cart Item Enhancement

The CartItem interface will be enhanced to include full hierarchy information:

```typescript
interface EnhancedCartItem extends CartItem {
  categoryName: string;
  productTypeName: string;
  displayName: string; // Full hierarchy display name
}
```

### Migration Strategy

A migration utility will convert existing cart items and orders to the new format:

```typescript
interface MigrationService {
  migrateCartItems(items: CartItem[]): EnhancedCartItem[];
  migrateOrders(orders: Order[]): Order[];
  mapLegacyProductToCategory(productName: string): { category: string; productType: string };
}
```

## Error Handling

### Navigation Error Recovery

- **Invalid Category Selection**: Redirect to category screen with error message
- **Missing Product Data**: Show fallback message and return to previous screen
- **Price Calculation Errors**: Display error and prevent cart addition until resolved

### Data Migration Error Handling

- **Unmapped Legacy Products**: Create a "Legacy" category for products that cannot be automatically categorized
- **Missing Price Data**: Use fallback pricing or mark items as "Price TBD"
- **Corrupted Cart Data**: Clear cart and notify user of data reset

### Backward Compatibility

- **Legacy Order Display**: Show legacy orders with available product information
- **Product Name Mapping**: Maintain mapping table for legacy product names to new hierarchy
- **Graceful Degradation**: If category data is unavailable, fall back to flat product list

## Testing Strategy

### Unit Testing

1. **Category Configuration Tests**
   - Validate category structure integrity
   - Test product-to-category mapping accuracy
   - Verify price data consistency

2. **Navigation Logic Tests**
   - Test navigation state transitions
   - Validate back navigation functionality
   - Test edge cases (empty categories, single products)

3. **Migration Service Tests**
   - Test legacy data conversion accuracy
   - Validate error handling for corrupted data
   - Test backward compatibility scenarios

### Integration Testing

1. **End-to-End Product Selection**
   - Test complete category → product → size → cart flow
   - Validate cart item display with full hierarchy information
   - Test order creation with enhanced product data

2. **Navigation Flow Testing**
   - Test all possible navigation paths
   - Validate back button functionality at each level
   - Test navigation state persistence

3. **Data Persistence Testing**
   - Test cart persistence across browser sessions
   - Validate order history with migrated data
   - Test configuration updates and data integrity

### User Experience Testing

1. **Performance Testing**
   - Measure navigation response times
   - Test with large product catalogs
   - Validate smooth animations and transitions

2. **Accessibility Testing**
   - Test keyboard navigation through hierarchy
   - Validate screen reader compatibility
   - Test touch navigation on mobile devices

3. **Usability Testing**
   - Test intuitive navigation flow
   - Validate clear product hierarchy display
   - Test error recovery scenarios

## Implementation Phases

### Phase 1: Data Structure Migration
- Create new category configuration structure
- Implement migration utilities for existing data
- Update type definitions

### Phase 2: Navigation System
- Implement 3-layer navigation logic
- Create category, product, and size selection screens
- Add back navigation functionality

### Phase 3: Cart and Order Integration
- Update cart display with hierarchy information
- Enhance order creation with full product details
- Implement backward compatibility for existing orders

### Phase 4: UI Polish and Testing
- Implement smooth animations and transitions
- Add comprehensive error handling
- Conduct thorough testing and optimization