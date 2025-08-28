import React, { useRef, useEffect, useState, type ReactNode } from 'react';
import { X, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Client, Product, Order, OrderItem, Expense, LogEntry } from '../types';
import { ProductInfoPopover, ReferenceInfoDisplay, CustomQuantityInput, SimpleBarChart } from './common';
import { calculatePrice, calculateCost } from '../lib/utils';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  size?: 'lg' | 'xl' | '2xl' | '3xl';
}

const BaseModal: React.FC<BaseModalProps> = ({ isOpen, onClose, children, title, size = 'lg' }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const mouseDownTarget = useRef<EventTarget | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
      if (mouseDownTarget.current === e.target && e.target === e.currentTarget) {
          onClose();
      }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      mouseDownTarget.current = e.target;
  };
  
  const sizeClasses = {
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-8"
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`w-full ${sizeClasses[size]}`}
          >
            <div className="rounded-2xl bg-glass border border-white/10 shadow-lg flex flex-col max-h-[90vh]">
               <div className="flex-shrink-0 p-6 pb-4 flex items-center justify-between">
                 <h2 className="text-xl font-bold text-primary">{title}</h2>
                 <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted">
                    <X size={20} />
                 </button>
               </div>
               <div className="flex-grow overflow-y-auto px-6 pb-6">
                 {children}
               </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Form Components ---
const FormRow = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col gap-2">{children}</div>;
const Label = ({ children, htmlFor }: { children: React.ReactNode, htmlFor: string }) => <label htmlFor={htmlFor} className="text-sm font-medium text-muted">{children}</label>;
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />;
const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none" />;
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />;
const ModalActions = ({ onClose, saveLabel = "Save" }: { onClose: () => void; saveLabel?: string }) => (
    <div className="flex justify-end gap-2 pt-6">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-white/10 text-primary font-medium">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded-lg gloss-btn">{saveLabel}</button>
    </div>
);
const CheckboxRow: React.FC<{
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  children?: ReactNode;
}> = ({ checked, onChange, label, children }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm text-primary cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded text-indigo-500 bg-white/10 border-white/20 focus:ring-indigo-500"
      />
      {label}
    </label>
    <AnimatePresence>
      {checked && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden pl-6"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// --- Modals ---

interface CreateOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    clients: Client[];
    products: Product[];
    onCreate: (data: { clientId: string, items: OrderItem[], shipping: number, discount: number, amountPaid: number, date: string }) => void;
}
export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, clients, products, onCreate }) => {
    const [clientId, setClientId] = useState('');
    const [items, setItems] = useState<OrderItem[]>([]);
    const [showShipping, setShowShipping] = useState(false);
    const [shipping, setShipping] = useState(0);
    const [showDiscount, setShowDiscount] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [amountPaid, setAmountPaid] = useState(0);
    const [date, setDate] = useState('');
    const [isProfitVisible, setIsProfitVisible] = useState(false);

    const resetState = () => {
        setClientId(clients[0]?.id || '');
        const firstProduct = products[0];
        const initialPrice = firstProduct ? calculatePrice(firstProduct, 1) : 0;
        setItems([{ productId: firstProduct?.id || '', quantity: 1, price: initialPrice }]);
        setShowShipping(false);
        setShipping(0);
        setShowDiscount(false);
        setDiscount(0);
        setAmountPaid(0);
        setDate(new Date().toISOString().split('T')[0]);
    };

    useEffect(() => {
        if (isOpen) resetState();
    }, [isOpen, clients, products]);
    
    const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
        const newItems = [...items];
        const currentItem = newItems[index];
        
        if (field === 'productId' && typeof value === 'string') {
            currentItem.productId = value;
            const product = products.find(p => p.id === value);
            if (product) {
                currentItem.price = calculatePrice(product, currentItem.quantity);
            } else {
                currentItem.price = 0;
            }
        } else if (field === 'quantity') {
            const newQuantity = Number(value);
            currentItem.quantity = newQuantity;
            const product = products.find(p => p.id === currentItem.productId);
            if (product && newQuantity > 0) {
                currentItem.price = calculatePrice(product, newQuantity);
            } else {
                currentItem.price = 0;
            }
        } else if (field === 'price') {
            currentItem.price = Number(value);
        }

        setItems(newItems);
    }
    
    const addItem = () => {
        const firstProduct = products[0];
        const initialPrice = firstProduct ? calculatePrice(firstProduct, 1) : 0;
        setItems([...items, { productId: firstProduct?.id || '', quantity: 1, price: initialPrice }]);
    }
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const handleSubmit = () => {
        if (!clientId || items.some(i => !i.productId || i.quantity <= 0)) {
            alert('Please fill all fields correctly.');
            return;
        }
        onCreate({ clientId, items, shipping, discount, amountPaid, date });
    };

    const getUnitLabel = (type: Product['type'] | undefined) => {
        switch(type) {
            case 'g': return 'Grams (g)';
            case 'ml': return 'Milliliters (ml)';
            case 'unit': return 'Units';
            default: return 'Qty';
        }
    };

    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const total = subtotal + shipping - discount;

    const totalCost = items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + (product ? calculateCost(product, item.quantity) : 0);
    }, 0);
    const netRevenue = subtotal - discount;
    const profit = netRevenue - totalCost;
    const profitMargin = netRevenue > 0 ? (profit / netRevenue) * 100 : 0;

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Create New Order">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormRow>
                        <Label htmlFor="client">Client</Label>
                        <Select id="client" value={clientId} onChange={e => setClientId(e.target.value)}>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </FormRow>
                     <FormRow>
                        <Label htmlFor="order-date">Date</Label>
                        <Input id="order-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </FormRow>
                </div>
                <hr className="border-white/10" />

                {items.map((item, index) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-6">
                                <div className="flex items-center gap-2 mb-2">
                                  <Label htmlFor={`product-${index}`}>Product</Label>
                                  <ProductInfoPopover product={product} />
                                </div>
                                <Select id={`product-${index}`} value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)}>
                                    <option value="" disabled>Select a product</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor={`qty-${index}`}>{getUnitLabel(product?.type)}</Label>
                                <CustomQuantityInput 
                                    value={item.quantity} 
                                    onChange={newValue => handleItemChange(index, 'quantity', newValue)}
                                    productType={product?.type}
                                />
                            </div>
                            <div className="col-span-3">
                                <Label htmlFor={`price-${index}`}>Price</Label>
                                <Input id={`price-${index}`} type="number" step="0.01" min="0" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} />
                            </div>
                            <div className="col-span-1 self-end">
                                <button type="button" onClick={() => removeItem(index)} className="w-full h-[46px] flex items-center justify-center bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )
                })}

                <button type="button" onClick={addItem} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted">
                    <Plus size={16} /> Add Item
                </button>
                <hr className="border-white/10" />
                
                <div className="space-y-3">
                    <CheckboxRow checked={showShipping} onChange={e => {setShowShipping(e.target.checked); if(!e.target.checked) setShipping(0);}} label="Add Shipping Fees">
                         <Input type="number" placeholder="Enter amount" value={shipping || ''} onChange={e => setShipping(Number(e.target.value))} />
                    </CheckboxRow>
                    <CheckboxRow checked={showDiscount} onChange={e => {setShowDiscount(e.target.checked); if(!e.target.checked) setDiscount(0);}} label="Add Discount">
                         <Input type="number" placeholder="Enter amount" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} />
                    </CheckboxRow>
                    <FormRow>
                        <Label htmlFor="amount-paid">Amount Paid</Label>
                        <Input id="amount-paid" type="number" placeholder="Enter amount paid" value={amountPaid || ''} onChange={e => setAmountPaid(Number(e.target.value))} />
                    </FormRow>
                </div>
                
                <div
                    className="pt-4 border-t border-white/10 space-y-2 cursor-default"
                    onMouseEnter={() => setIsProfitVisible(true)}
                    onMouseLeave={() => setIsProfitVisible(false)}
                >
                    <div className="flex justify-between text-sm text-muted"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    {showShipping && shipping > 0 && <div className="flex justify-between text-sm text-muted"><span>Shipping</span><span>${shipping.toFixed(2)}</span></div>}
                    {showDiscount && discount > 0 && <div className="flex justify-between text-sm text-muted"><span>Discount</span><span className="text-green-400">-${discount.toFixed(2)}</span></div>}
                    <div className="flex justify-between text-lg font-bold text-primary"><span>Total</span><span>${total.toFixed(2)}</span></div>
                    
                    <AnimatePresence>
                        {isProfitVisible && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="pt-2 mt-2 border-t border-white/10 border-dashed space-y-1"
                            >
                                <div className="flex justify-between text-xs text-muted">
                                    <span>Total Cost</span>
                                    <span>${totalCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-primary font-medium">
                                    <span>Profit</span>
                                    <span>${profit.toFixed(2)}</span>
                                </div>
                                 <div className="flex justify-between text-xs text-primary font-medium">
                                    <span>Profit Margin</span>
                                    <span>{profitMargin.toFixed(2)}%</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex justify-center pt-6">
                    <button type="submit" className="px-6 py-2.5 rounded-lg gloss-btn w-full max-w-xs">Create Order</button>
                </div>
            </form>
        </BaseModal>
    );
}

interface EditOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    clients: Client[];
    products: Product[];
    onSave: (originalOrder: Order, updatedData: Omit<Order, 'id'>) => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({ isOpen, onClose, order, clients, products, onSave }) => {
    const [clientId, setClientId] = useState('');
    const [items, setItems] = useState<OrderItem[]>([]);
    const [shipping, setShipping] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [amountPaid, setAmountPaid] = useState(0);
    const [showShipping, setShowShipping] = useState(false);
    const [showDiscount, setShowDiscount] = useState(false);
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState('');
    const [isProfitVisible, setIsProfitVisible] = useState(false);

    useEffect(() => {
        if (isOpen && order) {
            setClientId(order.clientId);
            setItems(JSON.parse(JSON.stringify(order.items))); // Deep copy
            const ship = order.shipping || 0;
            const disc = order.discount || 0;
            setShipping(ship);
            setDiscount(disc);
            setAmountPaid(order.amountPaid || 0);
            setShowShipping(ship > 0);
            setShowDiscount(disc > 0);
            setDate(order.date);
            setNotes(order.notes || '');
        }
    }, [isOpen, order]);
    
    const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
        const newItems = [...items];
        const currentItem = newItems[index];
        
        if (field === 'productId' && typeof value === 'string') {
            currentItem.productId = value;
            const product = products.find(p => p.id === value);
            if (product) {
                currentItem.price = calculatePrice(product, currentItem.quantity);
            } else {
                currentItem.price = 0;
            }
        } else if (field === 'quantity') {
            const newQuantity = Number(value);
            currentItem.quantity = newQuantity;
            const product = products.find(p => p.id === currentItem.productId);
            if (product && newQuantity > 0) {
                currentItem.price = calculatePrice(product, newQuantity);
            } else {
                currentItem.price = 0;
            }
        } else if (field === 'price') {
            currentItem.price = Number(value);
        }

        setItems(newItems);
    }
    
    const addItem = () => {
        const firstProduct = products[0];
        const initialPrice = firstProduct ? calculatePrice(firstProduct, 1) : 0;
        setItems([...items, { productId: firstProduct?.id || '', quantity: 1, price: initialPrice }]);
    }
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const handleSubmit = () => {
        if (!order) return;
        if (!clientId || items.some(i => !i.productId || i.quantity <= 0)) {
            alert('Please fill all fields correctly.');
            return;
        }

        const itemsTotal = items.reduce((sum, item) => sum + item.price, 0);
        const total = itemsTotal + shipping - discount;

        let newStatus: 'Draft' | 'Unpaid' | 'Completed' = 'Unpaid';
        if (amountPaid >= total) {
            newStatus = 'Completed';
        }
        
        const updatedData = {
            clientId,
            items,
            total,
            status: newStatus,
            shipping,
            discount,
            amountPaid,
            date,
            notes
        };
        onSave(order, updatedData);
    };

    const getUnitLabel = (type: Product['type'] | undefined) => {
        switch(type) {
            case 'g': return 'Grams (g)';
            case 'ml': return 'Milliliters (ml)';
            case 'unit': return 'Units';
            default: return 'Qty';
        }
    };

    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const total = subtotal + shipping - discount;

    const totalCost = items.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + (product ? calculateCost(product, item.quantity) : 0);
    }, 0);
    const netRevenue = subtotal - discount;
    const profit = netRevenue - totalCost;
    const profitMargin = netRevenue > 0 ? (profit / netRevenue) * 100 : 0;

    if (!order) return null;

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={`Edit Order ${order.id}`}>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormRow>
                      <Label htmlFor="edit-client">Client</Label>
                      <Select id="edit-client" value={clientId} onChange={e => setClientId(e.target.value)}>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </Select>
                  </FormRow>
                  <FormRow>
                      <Label htmlFor="edit-date">Order Date</Label>
                      <Input id="edit-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                  </FormRow>
                </div>
                <hr className="border-white/10" />

                {items.map((item, index) => {
                    const product = products.find(p => p.id === item.productId);
                    const originalOrderItem = order.items.find(i => i.productId === item.productId);
                    const availableStock = (product?.stock || 0) + (originalOrderItem?.quantity || 0);
                    return (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Label htmlFor={`edit-product-${index}`}>Product</Label>
                                    <ProductInfoPopover product={product} />
                                </div>
                                <Select id={`edit-product-${index}`} value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)}>
                                    <option value="" disabled>Select a product</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor={`edit-qty-${index}`}>{getUnitLabel(product?.type)}</Label>
                                <CustomQuantityInput 
                                    value={item.quantity} 
                                    onChange={newValue => handleItemChange(index, 'quantity', newValue)}
                                    productType={product?.type}
                                />
                            </div>
                            <div className="col-span-3">
                                <Label htmlFor={`edit-price-${index}`}>Price</Label>
                                <Input id={`edit-price-${index}`} type="number" step="0.01" min="0" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} />
                            </div>
                            <div className="col-span-1 self-end">
                                <button type="button" onClick={() => removeItem(index)} className="w-full h-[46px] flex items-center justify-center bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )
                })}

                <button type="button" onClick={addItem} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted">
                    <Plus size={16} /> Add Item
                </button>
                <hr className="border-white/10" />

                <FormRow>
                  <Label htmlFor="edit-notes">Order Notes</Label>
                  <Textarea id="edit-notes" value={notes} onChange={e => setNotes(e.target.value)} />
                </FormRow>

                <div className="space-y-3">
                    <CheckboxRow checked={showShipping} onChange={e => {setShowShipping(e.target.checked); if(!e.target.checked) setShipping(0);}} label="Edit Shipping Fees">
                         <Input type="number" placeholder="Enter amount" value={shipping || ''} onChange={e => setShipping(Number(e.target.value))} />
                    </CheckboxRow>
                    <CheckboxRow checked={showDiscount} onChange={e => {setShowDiscount(e.target.checked); if(!e.target.checked) setDiscount(0);}} label="Edit Discount">
                         <Input type="number" placeholder="Enter amount" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} />
                    </CheckboxRow>
                     <FormRow>
                        <Label htmlFor="edit-amount-paid">Amount Paid</Label>
                        <Input id="edit-amount-paid" type="number" placeholder="Enter amount paid" value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value))} />
                    </FormRow>
                </div>
                
                <div
                    className="pt-4 border-t border-white/10 space-y-2 cursor-default"
                    onMouseEnter={() => setIsProfitVisible(true)}
                    onMouseLeave={() => setIsProfitVisible(false)}
                >
                    <div className="flex justify-between text-sm text-muted"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    {showShipping && shipping > 0 && <div className="flex justify-between text-sm text-muted"><span>Shipping</span><span>${shipping.toFixed(2)}</span></div>}
                    {showDiscount && discount > 0 && <div className="flex justify-between text-sm text-muted"><span>Discount</span><span className="text-green-400">-${discount.toFixed(2)}</span></div>}
                    <div className="flex justify-between text-lg font-bold text-primary"><span>Total</span><span>${total.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm text-muted"><span>Amount Paid</span><span>${Number(amountPaid).toFixed(2)}</span></div>
                     <div className="flex justify-between text-sm font-bold text-primary"><span>Balance Due</span><span>${(total - amountPaid).toFixed(2)}</span></div>
                    
                    <AnimatePresence>
                        {isProfitVisible && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="pt-2 mt-2 border-t border-white/10 border-dashed space-y-1"
                            >
                                <div className="flex justify-between text-xs text-muted">
                                    <span>Total Cost</span>
                                    <span>${totalCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-primary font-medium">
                                    <span>Profit</span>
                                    <span>${profit.toFixed(2)}</span>
                                </div>
                                 <div className="flex justify-between text-xs text-primary font-medium">
                                    <span>Profit Margin</span>
                                    <span>{profitMargin.toFixed(2)}%</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <ModalActions onClose={onClose} saveLabel="Save Changes" />
            </form>
        </BaseModal>
    );
}

interface CreateClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: Omit<Client, 'id' | 'orders' | 'totalSpent' | 'displayId'>) => void;
}
export const CreateClientModal: React.FC<CreateClientModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if(isOpen) {
            setName('');
            setEmail('');
            setPhone('');
            setAddress('');
            setNotes('');
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!name.trim()) return;
        onAdd({ name, email, phone, address, notes });
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Add New Client">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                <FormRow><Label htmlFor="clientName">Name</Label><Input id="clientName" value={name} onChange={e => setName(e.target.value)} /></FormRow>
                <div className="grid grid-cols-2 gap-4">
                    <FormRow><Label htmlFor="clientPhone">Phone</Label><Input id="clientPhone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></FormRow>
                    <FormRow><Label htmlFor="clientEmail">Email</Label><Input id="clientEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} /></FormRow>
                </div>
                <FormRow><Label htmlFor="clientAddress">Address</Label><Textarea id="clientAddress" value={address} onChange={e => setAddress(e.target.value)} /></FormRow>
                <FormRow><Label htmlFor="clientNotes">Notes</Label><Textarea id="clientNotes" value={notes} onChange={e => setNotes(e.target.value)} /></FormRow>
                <div className="flex justify-center pt-6">
                    <button type="submit" className="px-6 py-2.5 rounded-lg gloss-btn w-full max-w-xs">Add Client</button>
                </div>
            </form>
        </BaseModal>
    );
};

interface EditClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
    onSave: (updatedClient: Client) => void;
}
export const EditClientModal: React.FC<EditClientModalProps> = ({ isOpen, onClose, client, onSave }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if(client) {
            setName(client.name);
            setEmail(client.email || '');
            setPhone(client.phone || '');
            setAddress(client.address || '');
            setNotes(client.notes || '');
        }
    }, [client]);
    
    const handleSubmit = () => {
        if (!client || !name.trim()) return;
        onSave({
            ...client,
            name,
            email,
            phone,
            address,
            notes
        });
    };
    
    if (!client) return null;

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={`Edit ${client.name}`}>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                <FormRow><Label htmlFor="editClientName">Name</Label><Input id="editClientName" value={name} onChange={e => setName(e.target.value)} /></FormRow>
                <div className="grid grid-cols-2 gap-4">
                    <FormRow><Label htmlFor="editClientPhone">Phone</Label><Input id="editClientPhone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></FormRow>
                    <FormRow><Label htmlFor="editClientEmail">Email</Label><Input id="editClientEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} /></FormRow>
                </div>
                <FormRow><Label htmlFor="editClientAddress">Address</Label><Textarea id="editClientAddress" value={address} onChange={e => setAddress(e.target.value)} /></FormRow>
                <FormRow><Label htmlFor="editClientNotes">Notes</Label><Textarea id="editClientNotes" value={notes} onChange={e => setNotes(e.target.value)} /></FormRow>
                 <div className="flex justify-center pt-6">
                    <button type="submit" className="px-6 py-2.5 rounded-lg gloss-btn w-full max-w-xs">Save Changes</button>
                </div>
            </form>
        </BaseModal>
    )
}

interface CreateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: Omit<Product, 'id'>) => void;
}
export const CreateProductModal: React.FC<CreateProductModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<Product['type']>('unit');

    useEffect(() => {
        if(isOpen) {
            setName('');
            setType('unit');
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!name.trim()) return;
        onAdd({ name, type, price: 0, stock: 0 });
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Add New Product">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                <FormRow><Label htmlFor="prodName">Product Name</Label><Input id="prodName" value={name} onChange={e => setName(e.target.value)}/></FormRow>
                <FormRow>
                    <Label htmlFor="prodType">Type</Label>
                    <Select id="prodType" value={type} onChange={e => setType(e.target.value as Product['type'])}>
                        <option value="unit">Unit</option>
                        <option value="g">Gram (g)</option>
                        <option value="ml">Milliliter (ml)</option>
                    </Select>
                </FormRow>
                <div className="flex justify-center pt-6">
                    <button type="submit" className="px-6 py-2.5 rounded-lg gloss-btn w-full max-w-xs">Add Product</button>
                </div>
            </form>
        </BaseModal>
    );
}

interface EditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onSave: (updatedProduct: Product) => void;
}
export const EditProductModal: React.FC<EditProductModalProps> = ({ isOpen, onClose, product, onSave }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<Product['type']>('unit');

    useEffect(() => {
        if (product) {
            setName(product.name);
            setType(product.type);
        }
    }, [product]);

    const handleSubmit = () => {
        if (!product || !name.trim()) return;
        onSave({
            ...product,
            name,
            type
        });
    };

    if (!product) return null;

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={`Edit ${product.name}`}>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                <FormRow>
                    <Label htmlFor="editProdName">Product Name</Label>
                    <Input id="editProdName" value={name} onChange={e => setName(e.target.value)} />
                </FormRow>
                <FormRow>
                    <Label htmlFor="editProdType">Type</Label>
                    <Select id="editProdType" value={type} onChange={e => setType(e.target.value as Product['type'])}>
                        <option value="unit">Unit</option>
                        <option value="g">Gram (g)</option>
                        <option value="ml">Milliliter (ml)</option>
                    </Select>
                </FormRow>

                <ReferenceInfoDisplay product={product} />
                
                <div className="flex justify-center pt-6">
                    <button type="submit" className="px-6 py-2.5 rounded-lg gloss-btn w-full max-w-xs">Save Changes</button>
                </div>
            </form>
        </BaseModal>
    );
};


interface AddStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    onAddStock: (productId: string, amount: number, purchaseCost: number) => void;
}
export const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, onClose, products, onAddStock }) => {
    const [productId, setProductId] = useState('');
    const [amount, setAmount] = useState<number>(1);
    const [purchaseCost, setPurchaseCost] = useState(0);

    useEffect(() => {
        if (isOpen && products.length > 0) {
            const currentProductIsValid = products.some(p => p.id === productId);
            if (!currentProductIsValid) {
                setProductId(products[0].id);
            }
            setAmount(1);
            setPurchaseCost(0);
        }
    }, [isOpen, products]);

    useEffect(() => {
        if (isOpen) {
            const selectedProduct = products.find(p => p.id === productId);
            if (selectedProduct) {
                setPurchaseCost(0);
            }
        }
    }, [isOpen, productId, products]);

    const handleSubmit = () => {
        if (!productId || amount <= 0) return;
        onAddStock(productId, Number(amount), purchaseCost);
    };
    
    const selectedProduct = products.find(p => p.id === productId);
    const quantityLabel = selectedProduct ? `Quantity (${selectedProduct.type})` : 'Quantity';

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Add Stock">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                <FormRow>
                    <Label htmlFor="stockProd">Product</Label>
                    <Select id="stockProd" value={productId} onChange={e => setProductId(e.target.value)}>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                </FormRow>
                 <FormRow>
                    <Label htmlFor="stockAmount">{quantityLabel}</Label>
                    <Input id="stockAmount" type="number" min={selectedProduct?.type === 'g' ? "0.01" : "1"} step={selectedProduct?.type === 'g' ? "0.01" : "1"} value={amount} onChange={e => setAmount(Number(e.target.value))} />
                </FormRow>
                <FormRow>
                    <Label htmlFor="purchaseCost">Purchase Cost (Total)</Label>
                    <Input id="purchaseCost" type="number" step="0.01" min="0" value={purchaseCost || ''} onChange={e => setPurchaseCost(Number(e.target.value) || 0)} />
                </FormRow>
                <div className="flex justify-center pt-6">
                    <button type="submit" className="px-6 py-2.5 rounded-lg gloss-btn w-full max-w-xs">Add Stock</button>
                </div>
            </form>
        </BaseModal>
    );
}

interface ClientOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
    orders: Order[];
    products: Product[];
}
export const ClientOrdersModal: React.FC<ClientOrdersModalProps> = ({ isOpen, onClose, client, orders, products }) => {
    if (!client) return null;

    const getStatusClass = (order: Order) => {
        const balance = order.total - (order.amountPaid || 0);
        if (order.status === 'Completed' || balance <= 0) return 'status-completed';
        if (order.status === 'Unpaid') {
            return (order.amountPaid && order.amountPaid > 0) ? 'status-unpaid' : 'status-unpaid-zero';
        }
        return `status-${order.status.toLowerCase()}`;
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={`Orders for ${client.name}`} size="3xl">
            <div>
                {orders.length > 0 ? (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs text-muted border-b border-white/10">
                                <th className="p-3">Order ID</th><th className="p-3">Products</th><th className="p-3">Date</th><th className="p-3">Total</th><th className="p-3">Balance</th><th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(o => {
                                const balance = o.total - (o.amountPaid || 0);
                                return (
                                    <tr key={o.id} className="border-b border-white/5 text-xs">
                                        <td className="p-3 font-mono text-primary">{o.id}</td>
                                        <td className="p-3 text-muted">
                                            {o.items.map(item => {
                                                const product = products.find(p => p.id === item.productId);
                                                return <div key={item.productId}>{item.quantity} x {product?.name || 'Unknown'}</div>
                                            })}
                                        </td>
                                        <td className="p-3 text-muted">{o.date}</td>
                                        <td className="p-3 text-primary font-semibold">${o.total.toFixed(2)}</td>
                                        <td className={`p-3 font-semibold ${balance > 0 ? 'text-orange-400' : balance < 0 ? 'text-green-400' : 'text-primary'}`}>
                                            {balance < 0 ? `-$${Math.abs(balance).toFixed(2)}` : `$${balance.toFixed(2)}`}
                                        </td>
                                        <td className="p-3"><span className={`status-badge ${getStatusClass(o)}`}>{balance <= 0 ? 'Completed' : o.status}</span></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-muted text-center py-8">This client has no orders yet.</p>
                )}
            </div>
        </BaseModal>
    );
}

interface EditExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    expense: Expense | null;
    onSave: (updatedExpense: Expense) => void;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({ isOpen, onClose, expense, onSave }) => {
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);

    useEffect(() => {
        if (expense) {
            setDate(expense.date);
            setDescription(expense.description);
            setAmount(expense.amount);
        }
    }, [expense]);

    const handleSubmit = () => {
        if (!expense || !description.trim() || amount <= 0) return;
        onSave({
            ...expense,
            date,
            description,
            amount,
        });
    };

    if (!expense) return null;

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Edit Expense">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormRow>
                        <Label htmlFor="exp-date">Date</Label>
                        <Input id="exp-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </FormRow>
                    <FormRow>
                        <Label htmlFor="exp-amount">Amount</Label>
                        <Input id="exp-amount" type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(Number(e.target.value))} />
                    </FormRow>
                </div>
                <FormRow>
                    <Label htmlFor="exp-desc">Description</Label>
                    <Input id="exp-desc" value={description} onChange={e => setDescription(e.target.value)} />
                </FormRow>
                <ModalActions onClose={onClose} saveLabel="Save Changes" />
            </form>
        </BaseModal>
    );
};

interface LogDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logEntry: LogEntry | null;
}

export const LogDetailsModal: React.FC<LogDetailsModalProps> = ({ isOpen, onClose, logEntry }) => {
  if (!logEntry) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Log Event Details">
      <div className="space-y-4 text-sm">
        <div>
          <p className="text-muted">Timestamp</p>
          <p className="text-primary font-mono">{new Date(logEntry.timestamp).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted">User</p>
          <p className="text-primary">{logEntry.user}</p>
        </div>
        <div>
          <p className="text-muted">Action</p>
          <p className="text-primary font-semibold">{logEntry.action}</p>
        </div>
        <div>
          <p className="text-muted">Details</p>
          <pre className="bg-white/5 p-3 rounded-lg text-xs text-primary overflow-x-auto">
            {JSON.stringify(logEntry.details, null, 2)}
          </pre>
        </div>
      </div>
    </BaseModal>
  );
};

interface SessionTimeoutModalProps {
  isOpen: boolean;
  onClose: () => void; // This will be logout
  onExtendSession: () => void;
  timeoutDuration: number; // in seconds
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({ isOpen, onClose, onExtendSession, timeoutDuration }) => {
  const [countdown, setCountdown] = useState(timeoutDuration);
  const intervalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setCountdown(timeoutDuration);
      
      intervalRef.current = window.setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            onClose(); // Logout when timer hits 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, onClose, timeoutDuration]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <BaseModal isOpen={isOpen} onClose={onExtendSession} title="Session Timeout Warning">
      <div className="text-center space-y-4 py-4">
        <p className="text-muted">You have been inactive. For your security, you will be logged out soon.</p>
        <div className="text-primary text-4xl font-bold font-mono tracking-widest">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
      <div className="flex justify-center gap-4 pt-6">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-white/10 text-primary font-medium w-40">Log Out Now</button>
        <button type="button" onClick={onExtendSession} className="px-4 py-2 rounded-lg gloss-btn w-40">Stay Logged In</button>
      </div>
    </BaseModal>
  );
};

export interface ChartData {
  title: string;
  data: { label: string; value: number }[];
  yAxisLabel?: string;
}

interface MetricDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartData: ChartData | null;
}

export const MetricDetailsModal: React.FC<MetricDetailsModalProps> = ({ isOpen, onClose, chartData }) => {
    if (!chartData) return null;

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={chartData.title} size="3xl">
            <div className="pt-4">
                <SimpleBarChart data={chartData.data} yAxisLabel={chartData.yAxisLabel} />
            </div>
        </BaseModal>
    )
}


export default BaseModal;