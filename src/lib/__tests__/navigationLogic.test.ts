import { describe, it, expect, beforeEach } from 'vitest';
import type { NavigationState, CategoryData, ProductTypeData, SizeData } from '../../types';
import { PRODUCT_CONFIG } from '../productConfig';

describe('Navigation Logic and State Management', () => {
  let mockCategoryData: CategoryData;
  let mockProductTypeData: ProductTypeData;
  let mockSizeData: SizeData[];

  beforeEach(() => {
    // Create mock data for testing
    mockSizeData = [
      { id: '1g', name: '1g', price: 30 },
      { id: '2g', name: '2g', price: 60 },
      { id: '3.5g', name: '3.5g', price: 130 }
    ];

    mockProductTypeData = {
      id: 'ti-regular',
      name: 'Ti',
      sizes: mockSizeData
    };

    mockCategoryData = {
      id: 'ti',
      name: 'Ti',
      products: [mockProductTypeData]
    };
  });

  describe('NavigationState structure', () => {
    it('should create valid initial navigation state', () => {
      const initialState: NavigationState = {
        currentLayer: 'category',
        history: []
      };

      expect(initialState.currentLayer).toBe('category');
      expect(initialState.selectedCategory).toBeUndefined();
      expect(initialState.selectedProduct).toBeUndefined();
      expect(initialState.history).toEqual([]);
    });

    it('should create valid category selection state', () => {
      const categoryState: NavigationState = {
        currentLayer: 'product',
        selectedCategory: mockCategoryData,
        history: [{
          currentLayer: 'category',
          history: []
        }]
      };

      expect(categoryState.currentLayer).toBe('product');
      expect(categoryState.selectedCategory).toEqual(mockCategoryData);
      expect(categoryState.history).toHaveLength(1);
    });

    it('should create valid product selection state', () => {
      const productState: NavigationState = {
        currentLayer: 'size',
        selectedCategory: mockCategoryData,
        selectedProduct: mockProductTypeData,
        history: [
          {
            currentLayer: 'category',
            history: []
          },
          {
            currentLayer: 'product',
            selectedCategory: mockCategoryData,
            history: [{
              currentLayer: 'category',
              history: []
            }]
          }
        ]
      };

      expect(productState.currentLayer).toBe('size');
      expect(productState.selectedCategory).toEqual(mockCategoryData);
      expect(productState.selectedProduct).toEqual(mockProductTypeData);
      expect(productState.history).toHaveLength(2);
    });
  });

  describe('Navigation state transitions', () => {
    it('should transition from category to product layer', () => {
      const initialState: NavigationState = {
        currentLayer: 'category',
        history: []
      };

      const navigateToProduct = (state: NavigationState, category: CategoryData): NavigationState => {
        return {
          currentLayer: 'product',
          selectedCategory: category,
          history: [...state.history, state]
        };
      };

      const newState = navigateToProduct(initialState, mockCategoryData);

      expect(newState.currentLayer).toBe('product');
      expect(newState.selectedCategory).toEqual(mockCategoryData);
      expect(newState.history).toHaveLength(1);
      expect(newState.history[0]).toEqual(initialState);
    });

    it('should transition from product to size layer', () => {
      const productState: NavigationState = {
        currentLayer: 'product',
        selectedCategory: mockCategoryData,
        history: [{
          currentLayer: 'category',
          history: []
        }]
      };

      const navigateToSize = (state: NavigationState, product: ProductTypeData): NavigationState => {
        return {
          currentLayer: 'size',
          selectedCategory: state.selectedCategory,
          selectedProduct: product,
          history: [...state.history, state]
        };
      };

      const newState = navigateToSize(productState, mockProductTypeData);

      expect(newState.currentLayer).toBe('size');
      expect(newState.selectedCategory).toEqual(mockCategoryData);
      expect(newState.selectedProduct).toEqual(mockProductTypeData);
      expect(newState.history).toHaveLength(2);
    });

    it('should handle back navigation correctly', () => {
      const sizeState: NavigationState = {
        currentLayer: 'size',
        selectedCategory: mockCategoryData,
        selectedProduct: mockProductTypeData,
        history: [
          {
            currentLayer: 'category',
            history: []
          },
          {
            currentLayer: 'product',
            selectedCategory: mockCategoryData,
            history: [{
              currentLayer: 'category',
              history: []
            }]
          }
        ]
      };

      const goBack = (state: NavigationState): NavigationState | null => {
        if (state.history.length === 0) return null;
        return state.history[state.history.length - 1];
      };

      const previousState = goBack(sizeState);

      expect(previousState).not.toBeNull();
      expect(previousState!.currentLayer).toBe('product');
      expect(previousState!.selectedCategory).toEqual(mockCategoryData);
      expect(previousState!.selectedProduct).toBeUndefined();
    });

    it('should handle back navigation from category layer', () => {
      const categoryState: NavigationState = {
        currentLayer: 'category',
        history: []
      };

      const goBack = (state: NavigationState): NavigationState | null => {
        if (state.history.length === 0) return null;
        return state.history[state.history.length - 1];
      };

      const previousState = goBack(categoryState);
      expect(previousState).toBeNull();
    });
  });

  describe('Navigation utility functions', () => {
    it('should convert product config to CategoryData format', () => {
      const convertProductToCategory = (productName: string): CategoryData | null => {
        const productConfig = PRODUCT_CONFIG[productName];
        if (!productConfig) return null;

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

      const tiCategory = convertProductToCategory('Ti');
      expect(tiCategory).not.toBeNull();
      expect(tiCategory!.name).toBe('Ti');
      expect(tiCategory!.products).toHaveLength(1);
      expect(tiCategory!.products[0].name).toBe('Ti');

      const spCategory = convertProductToCategory('Sp');
      expect(spCategory).not.toBeNull();
      expect(spCategory!.name).toBe('Sp');
      expect(spCategory!.products.length).toBe(1);
      expect(spCategory!.products[0].name).toBe('Sp');
    });

    it('should get all available products as categories', () => {
      const getAllProductCategories = (): CategoryData[] => {
        return Object.keys(PRODUCT_CONFIG).map(productName => {
          const productConfig = PRODUCT_CONFIG[productName];
          
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
        });
      };

      const categories = getAllProductCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.some(cat => cat.name === 'Ti')).toBe(true);
      expect(categories.some(cat => cat.name === 'Sp')).toBe(true);
      expect(categories.some(cat => cat.name === 'Vi')).toBe(true);
    });

    it('should validate navigation state consistency', () => {
      const validateNavigationState = (state: NavigationState): boolean => {
        // Category layer should not have selected category or product
        if (state.currentLayer === 'category') {
          return !state.selectedCategory && !state.selectedProduct;
        }
        
        // Product layer should have selected category but not product
        if (state.currentLayer === 'product') {
          return !!state.selectedCategory && !state.selectedProduct;
        }
        
        // Size layer should have both selected category and product
        if (state.currentLayer === 'size') {
          return !!state.selectedCategory && !!state.selectedProduct;
        }
        
        return false;
      };

      const validCategoryState: NavigationState = {
        currentLayer: 'category',
        history: []
      };
      expect(validateNavigationState(validCategoryState)).toBe(true);

      const validProductState: NavigationState = {
        currentLayer: 'product',
        selectedCategory: mockCategoryData,
        history: []
      };
      expect(validateNavigationState(validProductState)).toBe(true);

      const validSizeState: NavigationState = {
        currentLayer: 'size',
        selectedCategory: mockCategoryData,
        selectedProduct: mockProductTypeData,
        history: []
      };
      expect(validateNavigationState(validSizeState)).toBe(true);

      const invalidProductState: NavigationState = {
        currentLayer: 'product',
        selectedProduct: mockProductTypeData, // Should not have product without category
        history: []
      };
      expect(validateNavigationState(invalidProductState)).toBe(false);
    });
  });

  describe('Navigation history management', () => {
    it('should maintain correct history depth', () => {
      const getHistoryDepth = (state: NavigationState): number => {
        return state.history.length;
      };

      const categoryState: NavigationState = {
        currentLayer: 'category',
        history: []
      };
      expect(getHistoryDepth(categoryState)).toBe(0);

      const productState: NavigationState = {
        currentLayer: 'product',
        selectedCategory: mockCategoryData,
        history: [categoryState]
      };
      expect(getHistoryDepth(productState)).toBe(1);

      const sizeState: NavigationState = {
        currentLayer: 'size',
        selectedCategory: mockCategoryData,
        selectedProduct: mockProductTypeData,
        history: [categoryState, productState]
      };
      expect(getHistoryDepth(sizeState)).toBe(2);
    });

    it('should manage navigation history correctly', () => {
      const addToHistory = (state: NavigationState, previousState: NavigationState): NavigationState => {
        return {
          ...state,
          history: [...previousState.history, previousState]
        };
      };

      const initialState: NavigationState = {
        currentLayer: 'category',
        history: []
      };

      const productState: NavigationState = {
        currentLayer: 'product',
        selectedCategory: mockCategoryData,
        history: []
      };

      // Add initial state to product state history
      const productStateWithHistory = addToHistory(productState, initialState);
      expect(productStateWithHistory.history).toHaveLength(1);
      expect(productStateWithHistory.history[0].currentLayer).toBe('category');

      const sizeState: NavigationState = {
        currentLayer: 'size',
        selectedCategory: mockCategoryData,
        selectedProduct: mockProductTypeData,
        history: []
      };

      // Add product state to size state history
      const sizeStateWithHistory = addToHistory(sizeState, productStateWithHistory);
      expect(sizeStateWithHistory.history).toHaveLength(2);
      expect(sizeStateWithHistory.history[0].currentLayer).toBe('category');
      expect(sizeStateWithHistory.history[1].currentLayer).toBe('product');
    });
  });
});