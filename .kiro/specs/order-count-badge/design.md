# Design Document

## Overview

The order count badge feature provides real-time visibility into uncompleted orders through a dynamic badge displayed next to the "Orders" navigation item. The current implementation shows the total count of all orders (`orders.length`), but the requirements specify it should only show uncompleted orders and update dynamically when order statuses change.

## Architecture

### Current State Analysis

The application currently uses:
- **State Management**: React hooks with `useLocalStorage` for persistence
- **Order Status Types**: `'Unpaid' | 'Completed'` (from `src/types.ts`)
- **Navigation Structure**: Static badge count in `navItems` array
- **Order Updates**: Handled in `OrdersPage` component via `setOrders` function

### Proposed Architecture

The solution will implement a computed badge count that:
1. Filters orders by uncompleted status (`'Unpaid'`)
2. Updates automatically when the orders array changes
3. Conditionally renders based on count > 0

## Components and Interfaces

### Badge Count Computation

```typescript
// Computed value in App.tsx
const uncompletedOrdersCount = orders.filter(order => order.status === 'Unpaid').length;
```

### Navigation Item Structure

```typescript
// Updated navItems structure
const navItems = [
  // ... other items
  { 
    id: 'orders', 
    label: 'Orders', 
    icon: ShoppingCart, 
    badge: uncompletedOrdersCount > 0 ? uncompletedOrdersCount : undefined 
  },
  // ... other items
];
```

### Badge Rendering Logic

```typescript
// In navigation rendering (existing pattern)
{item.badge && item.badge > 0 && (
  <span className="ml-auto bg-white/[0.1] text-white text-xs px-2 py-1 rounded-full border border-white/[0.1] backdrop-blur-xl">
    {item.badge}
  </span>
)}
```

## Data Models

### Order Status Validation

The design leverages the existing `Order` interface:

```typescript
interface Order {
  id: string;
  clientId: string;
  clientName: string;
  items: OrderItem[];
  total: number;
  status: 'Unpaid' | 'Completed'; // Key field for badge logic
  date: string;
  notes?: string;
  shipping?: number;
  discount?: number;
  amountPaid?: number;
}
```

### Badge State Dependencies

The badge count depends on:
- **Primary**: `orders` array from localStorage
- **Filter Criteria**: `order.status === 'Unpaid'`
- **Reactivity**: Automatic updates via React's dependency tracking

## Error Handling

### Status Validation

```typescript
// Defensive filtering to handle potential data inconsistencies
const uncompletedOrdersCount = orders.filter(order => 
  order && order.status === 'Unpaid'
).length;
```

### Fallback Behavior

- If `orders` is undefined/null: count defaults to 0
- If order status is invalid: order is excluded from count
- If count calculation fails: badge is hidden

### Error Boundaries

Leverage existing `ErrorHandler` utility for:
- Logging badge calculation errors
- Graceful degradation if computation fails
- Maintaining application stability

## Testing Strategy

### Unit Tests

1. **Badge Count Calculation**
   ```typescript
   describe('Badge Count Logic', () => {
     it('should count only unpaid orders', () => {
       const orders = [
         { status: 'Unpaid' },
         { status: 'Completed' },
         { status: 'Unpaid' }
       ];
       expect(getUncompletedCount(orders)).toBe(2);
     });
   });
   ```

2. **Badge Visibility**
   ```typescript
   it('should hide badge when count is 0', () => {
     const orders = [{ status: 'Completed' }];
     expect(shouldShowBadge(orders)).toBe(false);
   });
   ```

### Integration Tests

1. **Order Status Updates**
   - Test badge updates when marking orders as paid
   - Test badge updates when creating new orders
   - Test badge updates when deleting orders

2. **Cross-Component Updates**
   - Verify updates from OrdersPage component
   - Verify updates from Dashboard quick actions
   - Verify updates from OrderingTerminal

### Visual Regression Tests

1. **Badge Appearance**
   - Badge styling consistency
   - Badge positioning
   - Badge animations

2. **Responsive Behavior**
   - Badge display on different screen sizes
   - Badge text truncation for large numbers

## Implementation Approach

### Phase 1: Core Logic Update

1. Replace static `orders.length` with computed `uncompletedOrdersCount`
2. Update badge conditional rendering logic
3. Test basic functionality

### Phase 2: Real-time Updates

1. Verify automatic updates via React's reactivity
2. Test order status changes from all components
3. Validate localStorage persistence

### Phase 3: Edge Cases & Polish

1. Handle edge cases (empty orders, invalid statuses)
2. Add error handling and logging
3. Implement smooth animations for badge changes

## Performance Considerations

### Computation Efficiency

- **Filter Operation**: O(n) complexity on orders array
- **Frequency**: Recalculated on every orders array change
- **Optimization**: Consider memoization for large order sets

```typescript
const uncompletedOrdersCount = useMemo(() => 
  orders.filter(order => order.status === 'Unpaid').length,
  [orders]
);
```

### Memory Impact

- **Minimal**: Only adds one computed value
- **No Additional State**: Leverages existing orders array
- **No Subscriptions**: Uses React's built-in reactivity

## Security Considerations

### Data Validation

- Validate order status values before filtering
- Handle malformed order objects gracefully
- Prevent injection through order status manipulation

### Client-Side Storage

- Badge count derived from localStorage data
- No additional security concerns beyond existing order storage
- Maintains existing data privacy model

## Accessibility

### Screen Reader Support

```typescript
// Enhanced badge with accessibility
{item.badge && item.badge > 0 && (
  <span 
    className="ml-auto bg-white/[0.1] text-white text-xs px-2 py-1 rounded-full border border-white/[0.1] backdrop-blur-xl"
    aria-label={`${item.badge} uncompleted orders`}
    role="status"
  >
    {item.badge}
  </span>
)}
```

### Visual Indicators

- Maintain existing high contrast design
- Ensure badge remains visible in all themes
- Preserve glassmorphism styling for consistency

## Migration Strategy

### Backward Compatibility

- No breaking changes to existing data structures
- Maintains existing Order interface
- Preserves current navigation behavior

### Deployment Approach

1. **Development**: Implement and test locally
2. **Validation**: Verify with existing order data
3. **Release**: Deploy as single atomic change

The implementation requires minimal changes to existing code while providing the exact functionality specified in the requirements.