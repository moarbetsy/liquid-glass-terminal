import { describe, it, expect } from 'vitest';
import { PRODUCT_CONFIG } from '../productConfig';

describe('Product Configuration Structure', () => {
  describe('PRODUCT_CONFIG validation', () => {
    it('should have valid structure', () => {
      expect(PRODUCT_CONFIG).toBeDefined();
      expect(typeof PRODUCT_CONFIG).toBe('object');
      expect(Object.keys(PRODUCT_CONFIG).length).toBeGreaterThan(0);
    });

    it('should have all required products', () => {
      const expectedProducts = [
        'Ti', 'Gh', 'Vi', 'Ci', 'Sp', 'E', 'Md', 'We', 'Ha', 
        'Ke', 'Co', 'Mu', 'Pop', 'Pi', 'Li', 'Bo'
      ];

      const actualProducts = Object.keys(PRODUCT_CONFIG);
      expectedProducts.forEach(product => {
        expect(actualProducts).toContain(product);
      });
    });

    it('should have valid product structure for each product', () => {
      Object.entries(PRODUCT_CONFIG).forEach(([_productName, productData]) => {
        // Product should have either types or sizes, but not both
        const hasTypes = productData.types !== undefined;
        const hasSizes = productData.sizes !== undefined;
        
        expect(hasTypes || hasSizes).toBe(true);
        expect(hasTypes && hasSizes).toBe(false);

        if (hasTypes) {
          expect(typeof productData.types).toBe('object');
          Object.entries(productData.types!).forEach(([_typeName, sizes]) => {
            expect(typeof sizes).toBe('object');
            expect(Object.keys(sizes).length).toBeGreaterThan(0);
            
            // All size values should be positive numbers
            Object.values(sizes).forEach(price => {
              expect(typeof price).toBe('number');
              expect(price).toBeGreaterThan(0);
            });
          });
        }

        if (hasSizes && productData.sizes) {
          expect(typeof productData.sizes).toBe('object');
          expect(Object.keys(productData.sizes).length).toBeGreaterThan(0);
          
          // All size values should be positive numbers
          Object.values(productData.sizes).forEach(price => {
            expect(typeof price).toBe('number');
            expect(price).toBeGreaterThan(0);
          });
        }

        // allowCustom should be a string if present
        if (productData.allowCustom) {
          expect(typeof productData.allowCustom).toBe('string');
          expect(['g', 'ml', 'unit']).toContain(productData.allowCustom);
        }
      });
    });
  });

  describe('Product data integrity', () => {
    it('should have consistent pricing across all products', () => {
      Object.entries(PRODUCT_CONFIG).forEach(([_productName, productData]) => {
        if (productData.types) {
          Object.entries(productData.types).forEach(([_typeName, sizes]) => {
            Object.entries(sizes).forEach(([_size, price]) => {
              expect(price).toBeGreaterThan(0);
              expect(Number.isFinite(price)).toBe(true);
            });
          });
        }

        if (productData.sizes) {
          Object.entries(productData.sizes).forEach(([_size, price]) => {
            expect(price).toBeGreaterThan(0);
            expect(Number.isFinite(price)).toBe(true);
          });
        }
      });
    });

    it('should have unique type names within products', () => {
      Object.entries(PRODUCT_CONFIG).forEach(([_productName, productData]) => {
        if (productData.types) {
          const typeNames = Object.keys(productData.types);
          const uniqueTypes = new Set(typeNames);
          expect(uniqueTypes.size).toBe(typeNames.length);
        }
      });
    });
  });

  describe('Specific product validations', () => {
    it('should validate Ti product structure', () => {
      const ti = PRODUCT_CONFIG['Ti'];
      expect(ti.sizes).toBeDefined();
      expect(ti.allowCustom).toBe('g');
      
      // Check pricing structure for Ti
      expect(ti.sizes!['1g']).toBe(30);
      expect(ti.sizes!['2g']).toBe(60);
      expect(ti.sizes!['3.5g']).toBe(130);
      expect(ti.sizes!['1kg']).toBe(8000);
    });

    it('should validate Vi product structure', () => {
      const vi = PRODUCT_CONFIG['Vi'];
      expect(vi.sizes).toBeDefined();
      
      const expectedSizes = ['Blue 100mg', 'Purple 100mg', 'Red 150mg', 'Black 200mg', 'Levi 60mg', 'Kam Jelly 100mg'];
      expectedSizes.forEach(size => {
        expect(vi.sizes![size]).toBeDefined();
        expect(vi.sizes![size]).toBeGreaterThan(0);
      });
    });

    it('should validate Gh product structure', () => {
      const gh = PRODUCT_CONFIG['Gh'];
      expect(gh.sizes).toBeDefined();
      expect(gh.allowCustom).toBe('ml');
      
      expect(gh.sizes!['5ml']).toBe(10);
      expect(gh.sizes!['20ml']).toBe(40);
      expect(gh.sizes!['1000ml']).toBe(1400);
    });
  });

  describe('Product utility functions', () => {
    it('should extract all products correctly', () => {
      const getProducts = (): string[] => {
        return Object.keys(PRODUCT_CONFIG);
      };

      const products = getProducts();
      expect(products.length).toBeGreaterThan(0);
      expect(products).toContain('Ti');
      expect(products).toContain('Vi');
      expect(products).toContain('Sp');
    });

    it('should extract product types correctly', () => {
      const getProductTypes = (productName: string) => {
        const product = PRODUCT_CONFIG[productName];
        if (!product || !product.types) return [];
        return Object.keys(product.types);
      };

      expect(getProductTypes('Vi')).toEqual([]); // Vi now has sizes, not types
      expect(getProductTypes('Ci')).toEqual([]); // Ci now has sizes, not types
      expect(getProductTypes('Sp')).toEqual([]);
    });

    it('should extract sizes correctly', () => {
      const getSizes = (productName: string, typeName?: string) => {
        const product = PRODUCT_CONFIG[productName];
        if (!product) return {};
        
        if (typeName && product.types && product.types[typeName]) {
          return product.types[typeName];
        } else if (product.sizes) {
          return product.sizes;
        }
        return {};
      };

      const tiSizes = getSizes('Ti');
      expect(tiSizes['1g']).toBe(30);
      expect(tiSizes['2g']).toBe(60);

      const viSizes = getSizes('Vi');
      expect(viSizes['Blue 100mg']).toBe(6);
    });
  });
});