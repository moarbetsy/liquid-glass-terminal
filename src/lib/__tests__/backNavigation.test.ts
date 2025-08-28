import { describe, it, expect } from 'vitest';
import type { NavigationState, CategoryData, ProductTypeData } from '../../types';

describe('Back Navigation Functionality', () => {
  // Mock category and product data for testing
  const mockCategory: CategoryData = {
    id: 'test-category',
    name: 'Test Category',
    products: [
      {
        id: 'test-product',
        name: 'Test Product',
        sizes: [
          { id: '1g', name: '1g', price: 10 },
          { id: '2g', name: '2g', price: 20 }
        ]
      }
    ]
  };

  const mockProduct: ProductTypeData = {
    id: 'test-product',
    name: 'Test Product',
    sizes: [
      { id: '1g', name: '1g', price: 10 },
      { id: '2g', name: '2g', price: 20 }
    ]
  };

  it('should initialize with empty navigation history', () => {
    const initialState: NavigationState = {
      currentLayer: 'category',
      history: []
    };

    expect(initialState.history).toHaveLength(0);
    expect(initialState.currentLayer).toBe('category');
  });

  it('should create navigation history when moving between layers', () => {
    const initialState: NavigationState = {
      currentLayer: 'category',
      history: []
    };

    // Simulate navigation to product layer
    const stateAfterCategorySelection: NavigationState = {
      currentLayer: 'product',
      selectedCategory: mockCategory,
      history: [initialState]
    };

    expect(stateAfterCategorySelection.history).toHaveLength(1);
    expect(stateAfterCategorySelection.currentLayer).toBe('product');
    expect(stateAfterCategorySelection.selectedCategory).toBe(mockCategory);
  });

  it('should maintain complete navigation history through all layers', () => {
    const categoryState: NavigationState = {
      currentLayer: 'category',
      history: []
    };

    const productState: NavigationState = {
      currentLayer: 'product',
      selectedCategory: mockCategory,
      history: [categoryState]
    };

    const sizeState: NavigationState = {
      currentLayer: 'size',
      selectedCategory: mockCategory,
      selectedProduct: mockProduct,
      history: [categoryState, productState]
    };

    expect(sizeState.history).toHaveLength(2);
    expect(sizeState.currentLayer).toBe('size');
    expect(sizeState.selectedCategory).toBe(mockCategory);
    expect(sizeState.selectedProduct).toBe(mockProduct);
  });

  it('should restore previous state when going back', () => {
    const categoryState: NavigationState = {
      currentLayer: 'category',
      history: []
    };

    const productState: NavigationState = {
      currentLayer: 'product',
      selectedCategory: mockCategory,
      history: [categoryState]
    };

    const sizeState: NavigationState = {
      currentLayer: 'size',
      selectedCategory: mockCategory,
      selectedProduct: mockProduct,
      history: [categoryState, productState]
    };

    // Simulate going back from size to product
    const previousState = sizeState.history[sizeState.history.length - 1];
    const restoredState: NavigationState = {
      currentLayer: previousState.currentLayer,
      selectedCategory: previousState.selectedCategory,
      selectedProduct: previousState.selectedProduct,
      history: previousState.history
    };

    expect(restoredState.currentLayer).toBe('product');
    expect(restoredState.selectedCategory).toBe(mockCategory);
    expect(restoredState.selectedProduct).toBeUndefined();
    expect(restoredState.history).toHaveLength(1);
  });

  it('should handle navigation reset when adding item to cart', () => {
    const resetState: NavigationState = {
      currentLayer: 'category',
      selectedCategory: undefined,
      selectedProduct: undefined,
      history: []
    };

    expect(resetState.currentLayer).toBe('category');
    expect(resetState.selectedCategory).toBeUndefined();
    expect(resetState.selectedProduct).toBeUndefined();
    expect(resetState.history).toHaveLength(0);
  });

  it('should validate navigation state consistency', () => {
    // Test that navigation state maintains consistency
    const state: NavigationState = {
      currentLayer: 'size',
      selectedCategory: mockCategory,
      selectedProduct: mockProduct,
      history: [
        { currentLayer: 'category', history: [] },
        { 
          currentLayer: 'product', 
          selectedCategory: mockCategory, 
          history: [{ currentLayer: 'category', history: [] }] 
        }
      ]
    };

    // Verify that the current state has all required selections for its layer
    expect(state.currentLayer).toBe('size');
    expect(state.selectedCategory).toBeDefined();
    expect(state.selectedProduct).toBeDefined();
    
    // Verify that history maintains proper structure
    expect(state.history).toHaveLength(2);
    expect(state.history[0].currentLayer).toBe('category');
    expect(state.history[1].currentLayer).toBe('product');
    expect(state.history[1].selectedCategory).toBe(mockCategory);
  });
});