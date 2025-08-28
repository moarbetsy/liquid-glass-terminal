import type { CartItem, OrderItem, Order, ProductConfig } from '../types';
import { PRODUCT_CONFIG } from './productConfig';
import { PRODUCT_NAME_MAPPINGS, REVERSE_PRODUCT_NAME_MAPPINGS } from './productNameMappings';

/**
 * Migration service to handle conversion from legacy flat product structure
 * to new hierarchical category-based structure
 */
export class MigrationService {
  private static productToHierarchyMap: Map<string, { category: string; productType: string; type?: string }> = new Map();

  /**
   * Initialize the product mapping from legacy names to new hierarchy
   */
  static initializeMapping(): void {
    // Clear existing mapping
    this.productToHierarchyMap.clear();

    // Build mapping from PRODUCT_CONFIG
    Object.entries(PRODUCT_CONFIG).forEach(([productName, productData]) => {
      if (productData.types) {
        // Product has multiple types
        const typeNames = Object.keys(productData.types);
        // For the main product name, use the first type as default
        this.productToHierarchyMap.set(productName, { 
          category: 'products', 
          productType: productName,
          type: typeNames[0] 
        });
        // Map each type name individually
        typeNames.forEach(typeName => {
          this.productToHierarchyMap.set(typeName, { 
            category: 'products', 
            productType: productName,
            type: typeName 
          });
        });
      } else {
        // Product has direct sizes
        this.productToHierarchyMap.set(productName, { 
          category: 'products', 
          productType: productName 
        });
      }
    });

    // Add special mappings for legacy product names that don't match exactly
    this.addLegacyMappings();
  }

  /**
   * Add special mappings for legacy product names that have changed
   */
  private static addLegacyMappings(): void {
    // Map legacy names to new structure
    const legacyMappings = [
      // Original hierarchy mappings (maintain existing behavior for backward compatibility)
      { legacy: 'GH', category: 'Jus', productType: 'Jus' },
      { legacy: 'Jus', category: 'Jus', productType: 'Jus' },
      { legacy: 'Torch Light', category: 'Accessories', productType: 'Torch Light' },
      { legacy: 'V Blue', category: 'Viagra', productType: 'Viagra', type: 'Blue (100mg)' },
      { legacy: 'V Purple', category: 'Viagra', productType: 'Viagra', type: 'Purple (100mg)' },
      { legacy: 'V Red', category: 'Viagra', productType: 'Viagra', type: 'Red (150mg)' },
      { legacy: 'V Black', category: 'Viagra', productType: 'Viagra', type: 'Black (200mg)' },
      { legacy: 'V Levi', category: 'Viagra', productType: 'Viagra', type: 'Levi (60mg)' },
      { legacy: 'V Kam Jelly', category: 'Viagra', productType: 'Viagra', type: 'Kam Jelly (100mg)' },
      { legacy: 'Cial 20mg', category: 'Cialis', productType: 'Cialis', type: '20mg' },
      { legacy: 'Cial 60mg', category: 'Cialis', productType: 'Cialis', type: '60mg' },
      { legacy: 'Cial 80mg', category: 'Cialis', productType: 'Cialis', type: '80mg' },
      { legacy: 'Spd', category: 'Drugs', productType: 'Speed' },
      { legacy: 'Ecst', category: 'Drugs', productType: 'Ecstasy' },
      { legacy: 'Brown', category: 'Drugs', productType: 'Hash' },
      { legacy: 'MD 1g', category: 'Drugs', productType: 'MD' },
      { legacy: 'Tina Premium', category: 'Ti', productType: 'Ti' }
    ];

    legacyMappings.forEach(mapping => {
      this.productToHierarchyMap.set(mapping.legacy, {
        category: mapping.category,
        productType: mapping.productType,
        type: mapping.type
      });
    });

    // Add product name refactoring mappings - these map old product names to new names
    // while maintaining the existing category structure for backward compatibility
    const productNameRefactoringMappings = [
      // Map old product names to their categories with new product type names
      { legacy: 'Tina', category: 'Ti', productType: 'Ti', type: 'Ti' },
      { legacy: 'Viag', category: 'Vi', productType: 'Vi' },
      { legacy: 'Cial', category: 'Ci', productType: 'Ci' },
      { legacy: 'Speed', category: 'Sp', productType: 'Sp' },
      { legacy: 'Ecsta', category: 'E', productType: 'E' },
      { legacy: 'MD', category: 'Md', productType: 'Md' },
      { legacy: 'Weed', category: 'We', productType: 'We' },
      { legacy: 'Hash', category: 'Ha', productType: 'Ha' },
      { legacy: 'Shrooms', category: 'Mu', productType: 'Mu' },
      { legacy: 'Ket', category: 'Ke', productType: 'Ke' },
      { legacy: 'Coco', category: 'Co', productType: 'Co' },
      { legacy: 'Poppers', category: 'Pop', productType: 'Pop' },
      { legacy: 'Glass Pipe', category: 'Pi', productType: 'Pi' },
      { legacy: 'Torch Lighter', category: 'Li', productType: 'Li' },
      { legacy: 'Bong', category: 'Bo', productType: 'Bo' }
    ];

    productNameRefactoringMappings.forEach(mapping => {
      // Only add if not already mapped by legacy mappings
      if (!this.productToHierarchyMap.has(mapping.legacy)) {
        this.productToHierarchyMap.set(mapping.legacy, {
          category: mapping.category,
          productType: mapping.productType,
          type: mapping.type
        });
      }
    });

    // Add reverse mappings for new product names to ensure they map to themselves
    // Map new names to a generic 'products' category for new structure
    Object.values(PRODUCT_NAME_MAPPINGS).forEach(newName => {
      if (!this.productToHierarchyMap.has(newName)) {
        this.productToHierarchyMap.set(newName, {
          category: 'products',
          productType: newName
        });
      }
    });
  }

  /**
   * Map a legacy product name to the new hierarchy structure
   */
  static mapLegacyProductToCategory(productName: string): { category: string; productType: string; type?: string } | null {
    if (this.productToHierarchyMap.size === 0) {
      this.initializeMapping();
    }

    const mapping = this.productToHierarchyMap.get(productName);
    if (mapping) {
      return mapping;
    }

    // Try partial matching for products with variations
    for (const [key, value] of this.productToHierarchyMap.entries()) {
      if (productName.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(productName.toLowerCase())) {
        return value;
      }
    }

    // If no mapping found, create a legacy category
    return {
      category: 'Legacy',
      productType: productName
    };
  }

  /**
   * Convert old product name to new product name using the refactoring mappings
   */
  static migrateProductName(oldProductName: string): string {
    // Check if it's already a new product name
    if (Object.values(PRODUCT_NAME_MAPPINGS).includes(oldProductName)) {
      return oldProductName;
    }

    // Check direct mapping
    const newName = PRODUCT_NAME_MAPPINGS[oldProductName];
    if (newName) {
      return newName;
    }

    // Check legacy mappings for hierarchy-based names
    const hierarchyMapping = this.mapLegacyProductToCategory(oldProductName);
    if (hierarchyMapping && hierarchyMapping.productType !== oldProductName) {
      return hierarchyMapping.productType;
    }

    // Return original name if no mapping found
    return oldProductName;
  }

  /**
   * Migrate product names in cart items and order items for the refactoring
   */
  static migrateProductNames<T extends CartItem | OrderItem>(items: T[]): T[] {
    return items.map(item => ({
      ...item,
      productName: this.migrateProductName(item.productName),
      // Update productTypeName if it exists
      ...(item.productTypeName && { productTypeName: this.migrateProductName(item.productTypeName) })
    }));
  }

  /**
   * Apply product name refactoring migration to cart items
   */
  static applyProductNameMigrationToCartItems(items: CartItem[]): CartItem[] {
    return items.map(item => {
      const migratedProductName = this.migrateProductName(item.productName);
      const migratedProductTypeName = item.productTypeName ? this.migrateProductName(item.productTypeName) : item.productTypeName;
      
      return {
        ...item,
        productName: migratedProductName,
        productTypeName: migratedProductTypeName,
        // Update display name if it exists
        ...(item.displayName && item.categoryName && { 
          displayName: this.createDisplayName(item.categoryName, migratedProductTypeName || migratedProductName, item.type, item.size) 
        })
      };
    });
  }

  /**
   * Apply product name refactoring migration to order items
   */
  static applyProductNameMigrationToOrderItems(items: OrderItem[]): OrderItem[] {
    return items.map(item => {
      const migratedProductName = this.migrateProductName(item.productName);
      const migratedProductTypeName = item.productTypeName ? this.migrateProductName(item.productTypeName) : item.productTypeName;
      
      return {
        ...item,
        productName: migratedProductName,
        productTypeName: migratedProductTypeName
      };
    });
  }

  /**
   * Apply product name refactoring migration to orders
   */
  static applyProductNameMigrationToOrders(orders: Order[]): Order[] {
    return orders.map(order => ({
      ...order,
      items: this.applyProductNameMigrationToOrderItems(order.items)
    }));
  }

  /**
   * Convert legacy cart items to new hierarchical format
   */
  static migrateCartItems(items: CartItem[]): CartItem[] {
    return items.map(item => this.migrateCartItem(item));
  }

  /**
   * Convert a single legacy cart item to new format
   */
  static migrateCartItem(item: CartItem): CartItem {
    // If item already has hierarchy information, return as-is (maintain backward compatibility)
    if (item.categoryName && item.productTypeName) {
      return {
        ...item,
        displayName: item.displayName || this.createDisplayName(item.categoryName, item.productTypeName, item.type, item.size)
      };
    }

    // Map the product name to hierarchy
    const hierarchy = this.mapLegacyProductToCategory(item.productName);
    if (!hierarchy) {
      // Fallback for unmappable products
      return {
        ...item,
        categoryName: 'Legacy',
        productTypeName: item.productName,
        displayName: this.createDisplayName('Legacy', item.productName, undefined, item.size)
      };
    }

    // Create enhanced cart item with hierarchy information
    const enhancedItem: CartItem = {
      ...item,
      categoryName: hierarchy.category,
      productTypeName: hierarchy.productType,
      type: hierarchy.type || item.type,
      displayName: this.createDisplayName(hierarchy.category, hierarchy.productType, hierarchy.type || item.type, item.size)
    };

    return enhancedItem;
  }

  /**
   * Convert legacy order items to new hierarchical format
   */
  static migrateOrderItems(items: OrderItem[]): OrderItem[] {
    return items.map(item => this.migrateOrderItem(item));
  }

  /**
   * Convert a single legacy order item to new format
   */
  static migrateOrderItem(item: OrderItem): OrderItem {
    // If item already has hierarchy information, return as-is (maintain backward compatibility)
    if (item.categoryName && item.productTypeName) {
      return item;
    }

    // Map the product name to hierarchy
    const hierarchy = this.mapLegacyProductToCategory(item.productName);
    if (!hierarchy) {
      // Fallback for unmappable products
      return {
        ...item,
        categoryName: 'Legacy',
        productTypeName: item.productName
      };
    }

    // Create enhanced order item with hierarchy information
    const enhancedItem: OrderItem = {
      ...item,
      categoryName: hierarchy.category,
      productTypeName: hierarchy.productType,
      type: hierarchy.type || item.type
    };

    return enhancedItem;
  }

  /**
   * Migrate existing orders to include hierarchy information
   */
  static migrateOrders(orders: Order[]): Order[] {
    return orders.map(order => ({
      ...order,
      items: this.migrateOrderItems(order.items)
    }));
  }

  /**
   * Create a display name for the full product hierarchy
   */
  static createDisplayName(category: string, productType: string, type?: string, size?: string | number): string {
    let displayName = '';
    
    // For Legacy category, always show full hierarchy
    if (category === 'Legacy') {
      displayName = category;
      if (productType && productType !== category) {
        displayName += ` > ${productType}`;
      }
    }
    // For products with types that differ from productType, show full hierarchy
    else if (type && type !== productType) {
      displayName = category;
      if (productType && productType !== category) {
        displayName += ` > ${productType}`;
      }
      displayName += ` > ${type}`;
    }
    // Check if productType actually exists in the category
    else if (productType !== category && !type) {
      const productExists = PRODUCT_CONFIG[productType];
      
      // If product doesn't exist in category, show hierarchy (for legacy mappings)
      if (!productExists) {
        displayName = category + ' > ' + productType;
      } else {
        // Product exists in category, just use productType
        displayName = productType;
      }
    }
    // For simple products (with or without types that equal productType), just use productType
    else {
      displayName = productType;
    }
    
    if (size) {
      displayName += ` - ${size}`;
    }
    
    return displayName;
  }

  /**
   * Check if a product exists in the new category structure
   */
  static isProductInNewStructure(productName: string, type?: string): boolean {
    if (this.productToHierarchyMap.size === 0) {
      this.initializeMapping();
    }

    const mapping = this.mapLegacyProductToCategory(productName);
    if (!mapping) return false;

    // First try to find the product using the new product name (migrated)
    const migratedProductName = this.migrateProductName(mapping.productType);
    let product = PRODUCT_CONFIG[migratedProductName];
    
    // If not found, try the original product type name
    if (!product) {
      product = PRODUCT_CONFIG[mapping.productType];
    }
    
    if (!product) return false;

    // If type is specified, check if it exists
    if (type) {
      if (product.types) {
        return Object.keys(product.types).includes(type);
      } else if (product.sizes) {
        // For products with direct sizes, check if the type matches any size key
        // Also handle format conversion: 'Blue (100mg)' -> 'Blue 100mg'
        const normalizedType = type.replace(/\s*\(([^)]+)\)\s*/, ' $1');
        return Object.keys(product.sizes).includes(type) || Object.keys(product.sizes).includes(normalizedType);
      }
      // If type is specified but product has neither types nor sizes, return false
      return false;
    }

    return true;
  }

  /**
   * Get available sizes for a product in the new structure
   */
  static getAvailableSizes(categoryName: string, productTypeName: string, typeName?: string): string[] {
    // First try to find the product using the new product name (migrated)
    const migratedProductName = this.migrateProductName(productTypeName);
    let product = PRODUCT_CONFIG[migratedProductName];
    
    // If not found, try the original product type name
    if (!product) {
      product = PRODUCT_CONFIG[productTypeName];
    }
    
    if (!product) return [];

    if (typeName && product.types && product.types[typeName]) {
      return Object.keys(product.types[typeName]);
    }

    if (product.sizes) {
      return Object.keys(product.sizes);
    }

    return [];
  }

  /**
   * Get price for a specific product configuration
   */
  static getPrice(categoryName: string, productTypeName: string, size: string, typeName?: string): number | null {
    // First try to find the product using the new product name (migrated)
    const migratedProductName = this.migrateProductName(productTypeName);
    let product = PRODUCT_CONFIG[migratedProductName];
    
    // If not found, try the original product type name
    if (!product) {
      product = PRODUCT_CONFIG[productTypeName];
    }
    
    if (!product) return null;

    if (typeName && product.types && product.types[typeName]) {
      return product.types[typeName][size] || null;
    }

    if (product.sizes) {
      return product.sizes[size] || null;
    }

    return null;
  }

  /**
   * Check if data needs product name migration
   */
  static needsProductNameMigration(items: (CartItem | OrderItem)[]): boolean {
    return items.some(item => {
      // Check if the product name is in the old naming format
      return Object.keys(PRODUCT_NAME_MAPPINGS).includes(item.productName) ||
             (item.productTypeName && Object.keys(PRODUCT_NAME_MAPPINGS).includes(item.productTypeName));
    });
  }

  /**
   * Get migration version for product name refactoring
   */
  static getProductNameMigrationVersion(): string {
    return 'product-name-refactoring-v1';
  }

  /**
   * Check if product name migration has been applied
   */
  static hasProductNameMigrationBeenApplied(): boolean {
    const migrationVersion = localStorage.getItem('migration-version');
    return migrationVersion === this.getProductNameMigrationVersion();
  }

  /**
   * Mark product name migration as completed
   */
  static markProductNameMigrationComplete(): void {
    localStorage.setItem('migration-version', this.getProductNameMigrationVersion());
  }

  /**
   * Validate that migrated data is consistent
   */
  static validateMigratedData(items: (CartItem | OrderItem)[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    items.forEach((item, index) => {
      if (!item.categoryName) {
        errors.push(`Item ${index}: Missing category name`);
      }

      if (!item.productTypeName) {
        errors.push(`Item ${index}: Missing product type name`);
      }

      if (item.categoryName && item.productTypeName) {
        const availableSizes = this.getAvailableSizes(item.categoryName, item.productTypeName, item.type);
        if (availableSizes.length > 0 && !availableSizes.includes(String(item.size))) {
          errors.push(`Item ${index}: Size "${item.size}" not available for ${item.categoryName} > ${item.productTypeName}`);
        }

        const expectedPrice = this.getPrice(item.categoryName, item.productTypeName, String(item.size), item.type);
        if (expectedPrice !== null && Math.abs(item.price - expectedPrice) > 0.01) {
          errors.push(`Item ${index}: Price mismatch. Expected ${expectedPrice}, got ${item.price} for ${item.categoryName} > ${item.productTypeName} - ${item.size}`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }


}

// Initialize the mapping when the module is loaded
MigrationService.initializeMapping();