/**
 * Product Name Mapping Configuration
 * 
 * Centralized mapping from old product names to new 2-letter abbreviations.
 * This serves as the single source of truth for product name refactoring.
 */

export const PRODUCT_NAME_MAPPINGS: Record<string, string> = {
  // Pharmaceuticals
  'Tina': 'Ti',
  'GH': 'Gh', 
  'Viag': 'Vi',
  'Cial': 'Ci',
  
  // Stimulants
  'Speed': 'Sp',
  'Ecsta': 'E',
  'MD': 'Md',
  
  // Botanicals
  'Weed': 'We',
  'Hash': 'Ha',
  'Shrooms': 'Mu',
  
  // Chemicals
  'Ket': 'Ke',
  'Coco': 'Co',
  'Poppers': 'Pop',
  
  // Accessories
  'Glass Pipe': 'Pi',
  'Torch Lighter': 'Li',
  'Bong': 'Bo'
};

/**
 * Reverse mapping for converting new names back to old names if needed
 */
export const REVERSE_PRODUCT_NAME_MAPPINGS: Record<string, string> = Object.fromEntries(
  Object.entries(PRODUCT_NAME_MAPPINGS).map(([oldName, newName]) => [newName, oldName])
);

/**
 * Get all old product names
 */
export const getOldProductNames = (): string[] => {
  return Object.keys(PRODUCT_NAME_MAPPINGS);
};

/**
 * Get all new product names
 */
export const getNewProductNames = (): string[] => {
  return Object.values(PRODUCT_NAME_MAPPINGS);
};