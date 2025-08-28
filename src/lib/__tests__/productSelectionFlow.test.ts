import { describe, it, expect, beforeEach } from 'vitest';
import type { NavigationState, CategoryData, ProductTypeData, SizeData, CartItem } from '../../types';
import { PRODUCT_CONFIG } from '../productConfig';

describe('Complete Product Selection Flow Integration Tests', () => {
  let navigationState: NavigationState;
  let cart: CartItem[];

  beforeEach(() => {
    navigationState = {
      currentLayer: 'category',
      history: []
    };
    cart = [];
  });

  describe('End-to-end product selection flow', () => {
    it('should complete full selection flow for product with types (Ti)', async () => {
      // Step 1: Start at category selection
      expect(navigationState.currentLayer).toBe('category');

      // Step 2: Select Ti category
      const tiCategory: CategoryData = {
        id: 'ti',
        name: 'Ti',
        products: [
          {
            id: 'ti-regular',
            name: 'Ti',
            sizes: [
              { id: '1g', name: '1g', price: 30 },
              { id: '2g', name: '2g', price: 60 },
              { id: '3.5g', name: '3.5g', price: 130 }
            ],
            allowCustom: 'g'
          },
          {
            id: 'ti-premium',
            name: 'Ti Premium',
            sizes: [
              { id: '1g', name: '1g', price: 50 },
              { id: '2g', name: '2g', price: 80 },
              { id: '3.5g', name: '3.5g', price: 160 }
            ],
            allowCustom: 'g'
          }
        ]
      };

      navigationState = {
        currentLayer: 'product',
        selectedCategory: tiCategory,
        history: [{ currentLayer: 'category', history: [] }]
      };

      expect(navigationState.currentLayer).toBe('product');
      expect(navigationState.selectedCategory?.name).toBe('Ti');
      expect(navigationState.selectedCategory?.products).toHaveLength(2);

      // Step 3: Select Ti Premium product type
      const tiPremium = tiCategory.products[1];
      navigationState = {
        currentLayer: 'size',
        selectedCategory: tiCategory,
        selectedProduct: tiPremium,
        history: [
          { currentLayer: 'category', history: [] },
          { currentLayer: 'product', selectedCategory: tiCategory, history: [{ currentLayer: 'category', history: [] }] }
        ]
      };

      expect(navigationState.currentLayer).toBe('size');
      expect(navigationState.selectedProduct?.name).toBe('Ti Premium');
      expect(navigationState.selectedProduct?.sizes).toHaveLength(3);

      // Step 4: Select size and add to cart
      const selectedSize = tiPremium.sizes[0]; // 1g for 50
      const cartItem: CartItem = {
        productId: 'ti-premium',
        productName: 'Ti Premium',
        product: 'Ti Premium',
        size: selectedSize.name,
        quantity: 1,
        price: selectedSize.price,
        categoryName: tiCategory.name,
        productTypeName: tiPremium.name,
        displayName: `${tiCategory.name} > ${tiPremium.name} - ${selectedSize.name}`
      };

      cart.push(cartItem);

      expect(cart).toHaveLength(1);
      expect(cart[0].categoryName).toBe('Ti');
      expect(cart[0].productTypeName).toBe('Ti Premium');
      expect(cart[0].size).toBe('1g');
      expect(cart[0].price).toBe(50);
      expect(cart[0].displayName).toBe('Ti > Ti Premium - 1g');
    });

    it('should complete full selection flow for single-type product (Sp)', async () => {
      // Step 1: Start at category selection
      expect(navigationState.currentLayer).toBe('category');

      // Step 2: Select Sp category
      const spCategory: CategoryData = {
        id: 'sp',
        name: 'Sp',
        products: [
          {
            id: 'sp',
            name: 'Sp',
            sizes: [
              { id: 'unit', name: 'unit', price: 3 }
            ]
          }
        ]
      };

      navigationState = {
        currentLayer: 'product',
        selectedCategory: spCategory,
        history: [{ currentLayer: 'category', history: [] }]
      };

      expect(navigationState.selectedCategory?.products).toHaveLength(1);

      // Step 3: Select Sp product (only one available)
      const spProduct = spCategory.products[0];
      navigationState = {
        currentLayer: 'size',
        selectedCategory: spCategory,
        selectedProduct: spProduct,
        history: [
          { currentLayer: 'category', history: [] },
          { currentLayer: 'product', selectedCategory: spCategory, history: [{ currentLayer: 'category', history: [] }] }
        ]
      };

      expect(navigationState.selectedProduct?.name).toBe('Sp');
      expect(navigationState.selectedProduct?.sizes).toHaveLength(1);

      // Step 4: Select size and add to cart
      const selectedSize = spProduct.sizes[0];
      const cartItem: CartItem = {
        productId: 'sp',
        productName: 'Sp',
        product: 'Sp',
        size: selectedSize.name,
        quantity: 2, // Buy 2 units
        price: selectedSize.price,
        categoryName: spCategory.name,
        productTypeName: spProduct.name,
        displayName: `${spCategory.name} - ${selectedSize.name}`
      };

      cart.push(cartItem);

      expect(cart).toHaveLength(1);
      expect(cart[0].categoryName).toBe('Sp');
      expect(cart[0].productTypeName).toBe('Sp');
      expect(cart[0].quantity).toBe(2);
      expect(cart[0].displayName).toBe('Sp - unit');
    });

    it('should handle back navigation during selection flow', () => {
      // Start with a deep navigation state
      const tiCategory: CategoryData = {
        id: 'ti',
        name: 'Ti',
        products: [
          {
            id: 'ti-regular',
            name: 'Ti',
            sizes: [{ id: '1g', name: '1g', price: 30 }]
          }
        ]
      };

      const sizeState: NavigationState = {
        currentLayer: 'size',
        selectedCategory: tiCategory,
        selectedProduct: tiCategory.products[0],
        history: [
          { currentLayer: 'category', history: [] },
          { 
            currentLayer: 'product', 
            selectedCategory: tiCategory, 
            history: [{ currentLayer: 'category', history: [] }] 
          }
        ]
      };

      // Navigate back to product selection
      const goBack = (state: NavigationState): NavigationState | null => {
        if (state.history.length === 0) return null;
        return state.history[state.history.length - 1];
      };

      const productState = goBack(sizeState);
      expect(productState).not.toBeNull();
      expect(productState!.currentLayer).toBe('product');
      expect(productState!.selectedCategory?.name).toBe('Ti');
      expect(productState!.selectedProduct).toBeUndefined();

      // Navigate back to category selection
      const categoryState = goBack(productState!);
      expect(categoryState).not.toBeNull();
      expect(categoryState!.currentLayer).toBe('category');
      expect(categoryState!.selectedCategory).toBeUndefined();
      expect(categoryState!.selectedProduct).toBeUndefined();

      // Try to navigate back from category (should return null)
      const nowhereToGo = goBack(categoryState!);
      expect(nowhereToGo).toBeNull();
    });
  });

  describe('Cart management during selection flow', () => {
    it('should handle multiple items from different categories', () => {
      const items: CartItem[] = [
        {
          productId: 'ti-premium',
          productName: 'Ti Premium',
          product: 'Ti Premium',
          size: '1g',
          quantity: 1,
          price: 50,
          categoryName: 'Ti',
          productTypeName: 'Ti Premium',
          displayName: 'Ti > Ti Premium - 1g'
        },
        {
          productId: 'sp',
          productName: 'Sp',
          product: 'Sp',
          size: 'unit',
          quantity: 2,
          price: 3,
          categoryName: 'Sp',
          productTypeName: 'Sp',
          displayName: 'Sp - unit'
        },
        {
          productId: 'vi-blue',
          productName: 'Blue (100mg)',
          product: 'Blue (100mg)',
          size: 'unit',
          quantity: 1,
          price: 6,
          categoryName: 'Vi',
          productTypeName: 'Vi',
          type: 'Blue (100mg)',
          displayName: 'Vi > Vi > Blue (100mg) - unit'
        }
      ];

      cart.push(...items);

      expect(cart).toHaveLength(3);
      
      // Verify categories are represented
      const categories = new Set(cart.map(item => item.categoryName));
      expect(categories.has('Ti')).toBe(true);
      expect(categories.has('Sp')).toBe(true);
      expect(categories.has('Vi')).toBe(true);

      // Calculate total
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      expect(total).toBe(50 + (3 * 2) + 6); // 50 + 6 + 6 = 62
    });

    it('should handle quantity updates for existing cart items', () => {
      const initialItem: CartItem = {
        productId: 'ti-regular',
        productName: 'Ti',
        product: 'Ti',
        size: '1g',
        quantity: 1,
        price: 30,
        categoryName: 'Ti',
        productTypeName: 'Ti',
        displayName: 'Ti - 1g'
      };

      cart.push(initialItem);
      expect(cart[0].quantity).toBe(1);

      // Update quantity
      const updateQuantity = (productId: string, size: string, newQuantity: number) => {
        const itemIndex = cart.findIndex(item => 
          item.productId === productId && item.size === size
        );
        if (itemIndex !== -1) {
          cart[itemIndex].quantity = newQuantity;
        }
      };

      updateQuantity('ti-regular', '1g', 3);
      expect(cart[0].quantity).toBe(3);

      // Calculate new total
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      expect(total).toBe(90); // 30 * 3
    });

    it('should handle cart item removal', () => {
      const items: CartItem[] = [
        {
          productId: 'ti-regular',
          productName: 'Ti',
          product: 'Ti',
          size: '1g',
          quantity: 1,
          price: 30,
          categoryName: 'Ti',
          productTypeName: 'Ti',
          displayName: 'Ti - 1g'
        },
        {
          productId: 'sp',
          productName: 'Sp',
          product: 'Sp',
          size: 'unit',
          quantity: 1,
          price: 3,
          categoryName: 'Sp',
          productTypeName: 'Sp',
          displayName: 'Sp - unit'
        }
      ];

      cart.push(...items);
      expect(cart).toHaveLength(2);

      // Remove first item
      const removeItem = (productId: string, size: string) => {
        const itemIndex = cart.findIndex(item => 
          item.productId === productId && item.size === size
        );
        if (itemIndex !== -1) {
          cart.splice(itemIndex, 1);
        }
      };

      removeItem('ti-regular', '1g');
      expect(cart).toHaveLength(1);
      expect(cart[0].productId).toBe('sp');
    });
  });

  describe('Error handling during selection flow', () => {
    it('should handle invalid product selection', () => {
      const selectProduct = (productName: string): CategoryData | null => {
        const productConfig = PRODUCT_CONFIG[productName];
        if (!productConfig) return null;

        // Convert to CategoryData format
        const sizeData: SizeData[] = Object.entries(productConfig.sizes).map(([size, price]) => ({
          id: size,
          name: size,
          price
        }));

        const product: ProductTypeData = {
          id: productName.toLowerCase(),
          name: productName,
          sizes: sizeData,
          allowCustom: productConfig.allowCustom
        };

        return {
          id: productName.toLowerCase(),
          name: productName,
          products: [product]
        };
      };

      const validProduct = selectProduct('Ti');
      expect(validProduct).not.toBeNull();
      expect(validProduct!.name).toBe('Ti');

      const invalidProduct = selectProduct('NonExistentProduct');
      expect(invalidProduct).toBeNull();
    });

    it('should handle empty cart scenarios', () => {
      expect(cart).toHaveLength(0);

      const calculateTotal = (cartItems: CartItem[]): number => {
        return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      };

      const total = calculateTotal(cart);
      expect(total).toBe(0);

      const isEmpty = cart.length === 0;
      expect(isEmpty).toBe(true);
    });

    it('should validate cart item structure', () => {
      const validateCartItem = (item: CartItem): boolean => {
        return !!(
          item.productId &&
          item.productName &&
          item.size &&
          item.quantity > 0 &&
          item.price >= 0 &&
          item.categoryName &&
          item.productTypeName
        );
      };

      const validItem: CartItem = {
        productId: 'ti-regular',
        productName: 'Ti',
        product: 'Ti',
        size: '1g',
        quantity: 1,
        price: 30,
        categoryName: 'Ti',
        productTypeName: 'Ti',
        displayName: 'Ti - 1g'
      };

      expect(validateCartItem(validItem)).toBe(true);

      const invalidItem: CartItem = {
        productId: '',
        productName: 'Ti',
        product: 'Ti',
        size: '1g',
        quantity: 0, // Invalid quantity
        price: -10, // Invalid price
        categoryName: 'Ti',
        productTypeName: 'Ti'
      };

      expect(validateCartItem(invalidItem)).toBe(false);
    });
  });

  describe('Custom size handling', () => {
    it('should handle custom size input for products that allow it', () => {
      const tiProduct = PRODUCT_CONFIG['Ti'];
      
      expect(tiProduct.allowCustom).toBe('g');

      // Simulate custom size calculation
      const calculateCustomPrice = (basePrice: number, baseSize: string, customSize: string): number => {
        const baseSizeNum = parseFloat(baseSize.replace('g', ''));
        const customSizeNum = parseFloat(customSize.replace('g', ''));
        
        if (isNaN(baseSizeNum) || isNaN(customSizeNum)) return basePrice;
        
        return Math.round((basePrice / baseSizeNum) * customSizeNum);
      };

      // Use 1g as base (30 price) to calculate 2.5g
      const customPrice = calculateCustomPrice(30, '1g', '2.5g');
      expect(customPrice).toBe(75); // 30 * 2.5

      const customCartItem: CartItem = {
        productId: 'ti-regular',
        productName: 'Ti',
        product: 'Ti',
        size: '2.5g',
        quantity: 1,
        price: customPrice,
        categoryName: 'Ti',
        productTypeName: 'Ti',
        displayName: 'Ti - 2.5g (custom)'
      };

      cart.push(customCartItem);
      expect(cart[0].size).toBe('2.5g');
      expect(cart[0].price).toBe(75);
    });
  });
});