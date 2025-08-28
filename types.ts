
export type Page = 'dashboard' | 'orders' | 'clients' | 'products' | 'expenses' | 'log' | 'settings' | 'pricing';

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

export interface Product {
  id: string;
  name: string;
  type: 'g' | 'ml' | 'unit';
  stock: number;
  price: number;
  suggestedPrice?: string;
  cost?: string;
  referenceQuantity?: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  clientId: string;
  items: OrderItem[];
  total: number;
  status: 'Draft' | 'Unpaid' | 'Completed';
  date: string;
  notes?: string;
  shipping?: number;
  discount?: number;
  amountPaid?: number;
}

export interface Metric {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: Record<string, any>;
}