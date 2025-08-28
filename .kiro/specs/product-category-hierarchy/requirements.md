# Requirements Document

## Introduction

This feature introduces a 3-layer hierarchical product structure to improve the ordering terminal experience. Instead of showing all products in a flat list, users will first select a category (Layer 1), then choose a product type (Layer 2), and finally select the specific size/quantity (Layer 3). This creates a more organized and intuitive product selection flow.

## Requirements

### Requirement 1

**User Story:** As a user operating the ordering terminal, I want to select products through a category-first approach, so that I can quickly navigate to the products I need without scrolling through a long list.

#### Acceptance Criteria

1. WHEN the ordering terminal loads THEN the system SHALL display product categories as the first selection layer
2. WHEN a user clicks on a category THEN the system SHALL show available product types within that category
3. WHEN a user clicks on a product type THEN the system SHALL display available sizes/quantities with their respective prices
4. WHEN a user selects a size/quantity THEN the system SHALL add the item to the cart with correct product details

### Requirement 2

**User Story:** As a user, I want the system to support multiple product variants within the same category, so that I can choose between different quality levels or types (like "Ti" vs "Ti Premium").

#### Acceptance Criteria

1. WHEN a category contains multiple product types THEN the system SHALL display all available types in Layer 2
2. WHEN a product type has multiple sizes THEN the system SHALL display all available sizes with individual pricing in Layer 3
3. IF a category has only one product type THEN the system SHALL still show Layer 2 for consistency
4. WHEN displaying product types THEN the system SHALL clearly differentiate between variants (e.g., "Ti" vs "Ti Premium")

### Requirement 3

**User Story:** As a user, I want to navigate back through the hierarchy levels, so that I can change my selection without starting over.

#### Acceptance Criteria

1. WHEN viewing Layer 2 (product types) THEN the system SHALL provide a way to return to Layer 1 (categories)
2. WHEN viewing Layer 3 (sizes) THEN the system SHALL provide a way to return to Layer 2 (product types)
3. WHEN navigating back THEN the system SHALL maintain the current cart contents
4. WHEN navigating back THEN the system SHALL preserve any previously selected client information

### Requirement 4

**User Story:** As a user, I want the cart to display complete product information including category, type, and size, so that I can verify my selections are correct.

#### Acceptance Criteria

1. WHEN an item is added to the cart THEN the system SHALL display the full product hierarchy (category > type > size)
2. WHEN viewing cart items THEN the system SHALL show the price for each specific size/quantity combination
3. WHEN cart items are displayed THEN the system SHALL maintain consistent naming with the selection hierarchy
4. WHEN creating an order THEN the system SHALL store complete product information for order history

### Requirement 5

**User Story:** As a system administrator, I want the product management interface to support the new hierarchical structure, so that I can maintain products organized by categories and types.

#### Acceptance Criteria

1. WHEN viewing the products page THEN the system SHALL display products grouped by category
2. WHEN editing products THEN the system SHALL allow modification of category, type, and size information
3. WHEN adding new products THEN the system SHALL require category and type assignment
4. WHEN managing inventory THEN the system SHALL track stock levels for each specific size within each product type

### Requirement 6

**User Story:** As a user, I want the system to maintain backward compatibility with existing orders and data, so that historical information remains accessible and accurate.

#### Acceptance Criteria

1. WHEN the system loads existing orders THEN it SHALL correctly display historical order items with available product information
2. WHEN migrating existing product data THEN the system SHALL preserve all pricing and inventory information
3. IF existing orders reference products that don't match the new structure THEN the system SHALL handle them gracefully without errors
4. WHEN displaying order history THEN the system SHALL show product information in the most detailed format available