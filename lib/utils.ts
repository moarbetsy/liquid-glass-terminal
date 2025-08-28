import type { Product } from '../types';

export const calculatePrice = (product: Product, quantity: number): number => {
    if (!product.suggestedPrice) {
        return 0;
    }

    const quantities = (product.referenceQuantity || '').split('/').map(s => s.trim());
    const prices = product.suggestedPrice.split('/').map(p => parseFloat(p.trim()));

    if (prices.length === 0) {
      return 0;
    }

    const numericQuantities = quantities.map(q => parseFloat(q.replace(/[^0-9.]/g, '')));

    // 1. Check for exact tier match
    let exactMatchIndex = -1;
    for (let i = 0; i < numericQuantities.length; i++) {
        if (quantity === numericQuantities[i]) {
            exactMatchIndex = i;
            break;
        }
    }
    if (exactMatchIndex !== -1 && prices[exactMatchIndex] !== undefined) {
        return prices[exactMatchIndex];
    }

    // 2. If no exact match, calculate based on smallest unit price
    if (product.type !== 'unit') {
      let smallestUnit = Infinity;
      let basePricePerUnit = 0;

      for (let i = 0; i < numericQuantities.length; i++) {
          const unit = numericQuantities[i];
          if (unit > 0 && unit < smallestUnit) {
              smallestUnit = unit;
              basePricePerUnit = prices[i] / unit;
          }
      }

      if (basePricePerUnit > 0 && isFinite(basePricePerUnit)) {
          return parseFloat((quantity * basePricePerUnit).toFixed(2));
      }
    }
    
    // 3. Fallback for single-price items or units
    if (prices.length === 1) {
        return quantity * prices[0];
    }

    return 0; // Default if price cannot be determined
};

export const calculateCost = (product: Product, quantity: number): number => {
    if (!product.cost) {
        return 0;
    }

    const quantities = (product.referenceQuantity || '').split('/').map(s => s.trim());
    const costs = product.cost.split('/').map(p => parseFloat(p.trim()));

    if (costs.length === 0) {
      return 0;
    }

    const numericQuantities = quantities.map(q => parseFloat(q.replace(/[^0-9.]/g, '')));

    // 1. Check for exact tier match
    let exactMatchIndex = -1;
    for (let i = 0; i < numericQuantities.length; i++) {
        if (quantity === numericQuantities[i]) {
            exactMatchIndex = i;
            break;
        }
    }
    if (exactMatchIndex !== -1 && costs[exactMatchIndex] !== undefined) {
        return costs[exactMatchIndex];
    }

    // 2. If no exact match, calculate based on smallest unit cost
    if (product.type !== 'unit') {
      let smallestUnit = Infinity;
      let baseCostPerUnit = 0;

      for (let i = 0; i < numericQuantities.length; i++) {
          const unit = numericQuantities[i];
          if (unit > 0 && unit < smallestUnit) {
              smallestUnit = unit;
              baseCostPerUnit = costs[i] / unit;
          }
      }

      if (baseCostPerUnit > 0 && isFinite(baseCostPerUnit)) {
          return parseFloat((quantity * baseCostPerUnit).toFixed(2));
      }
    }
    
    // 3. Fallback for single-cost items or units
    if (costs.length === 1) {
        return quantity * costs[0];
    }

    return 0; // Default if cost cannot be determined
};
