import { describe, it, expect } from 'vitest';
import { PRODUCT_CONFIG } from '../productConfig';

describe('ProductsPage Hierarchy Support', () => {
  it('should have valid product configuration structure', () => {
    expect(PRODUCT_CONFIG).toBeDefined();
    expect(typeof PRODUCT_CONFIG).toBe('object');
    
    // Check that we have products
    const products = Object.keys(PRODUCT_CONFIG);
    expect(products.length).toBeGreaterThan(0);
    
    // Check structure of first product
    const firstProduct = products[0];
    const productData = PRODUCT_CONFIG[firstProduct];
    expect(productData).toHaveProperty('sizes');
    expect(typeof productData.sizes).toBe('object');
  });

  it('should convert product config to flat product list correctly', () => {
    const getProducts = () => {
      const products: Array<{
        productName: string;
        sizes: { [size: string]: number };
        allowCustom?: string;
        stock: number;
      }> = [];
      
      Object.entries(PRODUCT_CONFIG).forEach(([productName, productData]) => {
        products.push({
          productName,
          sizes: productData.sizes,
          allowCustom: productData.allowCustom,
          stock: 0
        });
      });
      
      return products;
    };

    const products = getProducts();
    expect(products.length).toBeGreaterThan(0);
    
    // Check that each product has required fields
    products.forEach(product => {
      expect(product.productName).toBeDefined();
      expect(product.sizes).toBeDefined();
      expect(typeof product.sizes).toBe('object');
      expect(Object.keys(product.sizes).length).toBeGreaterThan(0);
    });
  });

  it('should group products by category correctly', () => {
    const mockProducts = [
      { categoryName: 'Ti', productName: 'Ti', typeName: 'Regular', sizes: { '1g': 30 }, stock: 0 },
      { categoryName: 'Ti', productName: 'Ti', typeName: 'Premium', sizes: { '1g': 50 }, stock: 0 },
      { categoryName: 'Sp', productName: 'Sp', sizes: { 'unit': 3 }, stock: 0 }
    ];

    const grouped = mockProducts.reduce((acc, product) => {
      if (!acc[product.categoryName]) {
        acc[product.categoryName] = [];
      }
      acc[product.categoryName].push(product);
      return acc;
    }, {} as Record<string, typeof mockProducts>);

    expect(grouped['Ti']).toHaveLength(2);
    expect(grouped['Sp']).toHaveLength(1);
    expect(Object.keys(grouped)).toHaveLength(2);
  });

  it('should handle products with different size structures', () => {
    // Test Ti product (has sizes with allowCustom)
    const tiProduct = PRODUCT_CONFIG['Ti'];
    expect(tiProduct.sizes).toBeDefined();
    expect(tiProduct.allowCustom).toBe('g');
    expect(tiProduct.sizes['1g']).toBe(30);

    // Test Sp product (has sizes without allowCustom)
    const spProduct = PRODUCT_CONFIG['Sp'];
    expect(spProduct.sizes).toBeDefined();
    expect(spProduct.allowCustom).toBeUndefined();
    expect(spProduct.sizes['unit']).toBe(3);
  });
});