export type Page = 'terminal' | 'dashboard' | 'orders' | 'clients' | 'products' | 'statistics' | 'settings';

export interface Client {
  id: string;
  displayId: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  orders: number;
  totalSpent: number;
}

export interface ProductConfig {
  [key: string]: {
    types?: {
      [typeName: string]: {
        [size: string]: number;
      };
    };
    sizes?: {
      [size: string]: number;
    };
    allowCustom?: string;
  };
}

// New hierarchical product structure interfaces
export interface CategoryConfig {
  [categoryName: string]: {
    products: {
      [productName: string]: {
        types?: {
          [typeName: string]: {
            [size: string]: number;
          };
        };
        sizes?: {
          [size: string]: number;
        };
        allowCustom?: string;
      };
    };
  };
}

export interface CategoryData {
  id: string;
  name: string;
  products: ProductTypeData[];
}

export interface ProductTypeData {
  id: string;
  name: string;
  internalKey?: string; // Internal key for data consistency
  sizes: SizeData[];
  allowCustom?: string;
}

export interface SizeData {
  id: string;
  name: string;
  price: number;
  unit?: string;
}

export interface NavigationState {
  currentLayer: 'category' | 'product' | 'size';
  selectedCategory?: CategoryData;
  selectedProduct?: ProductTypeData;
  history: NavigationState[];
}

export interface Product {
  id: string;
  name: string;
  type: 'g' | 'ml' | 'unit';
  stock: number;
  price: number;
  suggestedPrice?: string;
  cost?: string;
  referenceQuantity?: string;
  // Enhanced fields for category hierarchy
  categoryName?: string;
  productTypeName?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  type?: string;
  size: string | number;
  unit?: string;
  quantity: number;
  price: number;
  // Enhanced fields for category hierarchy
  categoryName?: string;
  productTypeName?: string;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  items: OrderItem[];
  total: number;
  status: 'Unpaid' | 'Completed';
  date: string;
  notes?: string;
  shipping?: number;
  discount?: number;
  amountPaid?: number;
}

export interface CartItem extends OrderItem {
  product: string;
  // Enhanced fields for category hierarchy
  categoryName?: string;
  productTypeName?: string;
  displayName?: string; // Full hierarchy display name (category > type > size)
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}