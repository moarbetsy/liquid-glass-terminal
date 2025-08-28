import React from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronUp, ChevronDown } from 'lucide-react';
import type { Metric, Product } from '../types';


interface GlassCardProps {
  title?: string;
  children: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ title, children, action, className = '' }) => {
  return (
    <div className={`rounded-2xl p-4 glass-wrap ${className}`}>
      <div className="glass relative overflow-hidden p-6 h-full">
        {(title || action) && (
          <div className="flex items-center justify-between mb-4">
            {title && <h3 className="font-semibold text-lg text-primary">{title}</h3>}
            {action && (
              <button
                onClick={action.onClick}
                className="text-sm font-medium text-muted gloss-secondary px-3 py-1 rounded-lg hover:text-primary transition-colors"
              >
                {action.label}
              </button>
            )}
          </div>
        )}
        {children}
        <div className="glass-inner-glow" />
      </div>
    </div>
  );
};

export const MetricCard: React.FC<{ metric: Metric; onClick?: () => void; }> = ({ metric, onClick }) => {
  const colorClasses: Record<string, { bg: string; text: string; }> = {
    green: { bg: 'bg-green-500/10', text: 'text-green-400' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  };

  const selectedColor = colorClasses[metric.color] || colorClasses.blue;

  const content = (
      <GlassCard>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-muted">{metric.title}</p>
            <p className="text-6xl font-semibold text-primary tracking-tighter">{metric.value}</p>
            <p className="text-lg text-muted">{metric.subtitle}</p>
          </div>
          <div className={`p-4 rounded-xl ${selectedColor.bg} ${selectedColor.text}`}>
            {metric.icon}
          </div>
        </div>
      </GlassCard>
  );

  if (onClick) {
      return (
          <button onClick={onClick} className="w-full text-left transition-transform duration-200 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-2xl">
              {content}
          </button>
      );
  }

  return content;
};


interface NavItemProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

export const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, badge }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full text-sm p-2 rounded-lg transition-all relative ${
        active ? 'bg-glass' : 'hover:bg-glass/60 text-muted'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-primary">
        {icon}
      </div>
      <div className="flex-1 text-left font-medium text-primary">{label}</div>
      {badge !== undefined && badge > 0 && (
         <span className="bg-indigo-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {badge}
         </span>
      )}
    </button>
  );
};

interface MobileNavItemProps {
  onClick: () => void;
  icon: ReactNode;
  active: boolean;
}

export const MobileNavItem: React.FC<MobileNavItemProps> = ({ onClick, icon, active }) => {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-full transition-colors text-primary ${
        active ? 'bg-glass' : 'hover:bg-glass/60'
      }`}
    >
      {icon}
    </button>
  );
};

export const ReferenceInfoDisplay: React.FC<{ product: Product | null | undefined }> = ({ product }) => {
  if (!product || (!product.referenceQuantity && !product.suggestedPrice && !product.cost)) {
    return null;
  }
    
  const quantities = product.referenceQuantity?.split('/').map(s => s.trim()) || [];
  const prices = product.suggestedPrice?.split('/').map(s => s.trim()) || [];
  const costs = product.cost?.split('/').map(s => s.trim()) || [];
  const isTiered = quantities.length > 1 && quantities.length === prices.length && quantities.length === costs.length;

  return (
    <div className="pt-4 mt-4 border-t border-white/10">
      <h3 className="text-sm font-semibold text-muted mb-3">Reference Information</h3>
      {isTiered ? (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-2 text-muted font-medium">Quantity</th>
              <th className="p-2 text-muted font-medium">Suggested Price</th>
              <th className="p-2 text-muted font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {quantities.map((q, index) => (
              <tr key={index} className="border-b border-white/5">
                <td className="p-2 text-primary">{q}</td>
                <td className="p-2 text-primary">${prices[index]}</td>
                <td className="p-2 text-primary">${costs[index]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="space-y-2 text-sm">
          {product.referenceQuantity && (
            <div className="grid grid-cols-3 gap-2">
              <span className="col-span-1 text-muted">Quantity:</span>
              <span className="col-span-2 text-primary font-medium">{product.referenceQuantity}</span>
            </div>
          )}
          {product.suggestedPrice && (
            <div className="grid grid-cols-3 gap-2">
              <span className="col-span-1 text-muted">Suggested Price:</span>
              <span className="col-span-2 text-primary font-medium">${product.suggestedPrice}</span>
            </div>
          )}
          {product.cost && (
            <div className="grid grid-cols-3 gap-2">
              <span className="col-span-1 text-muted">Cost:</span>
              <span className="col-span-2 text-primary font-medium">${product.cost}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


export const ProductInfoPopover: React.FC<{ product: Product | null | undefined }> = ({ product }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!product || (!product.referenceQuantity && !product.suggestedPrice && !product.cost)) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="text-muted hover:text-primary transition-colors"
        aria-label="Show product reference information"
      >
        <Info size={14} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 z-20"
          >
            <div className="rounded-xl p-1 glass-wrap">
              <div className="glass p-3">
                <p className="text-sm font-bold text-primary mb-1">{product.name}</p>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-1.5 text-muted font-medium">Qty</th>
                      <th className="p-1.5 text-muted font-medium">Sugg. Price</th>
                      <th className="p-1.5 text-muted font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(product.referenceQuantity?.split('/') || []).map((q, index) => (
                      <tr key={index} className="border-b border-white/5 last:border-b-0">
                        <td className="p-1.5 text-primary">{q.trim()}</td>
                        <td className="p-1.5 text-primary">${(product.suggestedPrice?.split('/')[index] || '0').trim()}</td>
                        <td className="p-1.5 text-primary">${(product.cost?.split('/')[index] || '0').trim()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const gramSteps = [0.25, 0.5, 0.75, 1, 2, 3.5, 7, 14, 28];

export const CustomQuantityInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  productType: 'g' | 'ml' | 'unit' | undefined;
}> = ({ value, onChange, productType }) => {
  const handleStep = (direction: 'up' | 'down') => {
    const currentValue = Number(value);

    if (productType !== 'g') {
      const newValue = direction === 'up' ? currentValue + 1 : Math.max(0, currentValue - 1);
      onChange(newValue);
      return;
    }

    if (direction === 'up') {
      if (currentValue >= 28) {
        onChange(currentValue + 1);
      } else {
        const nextStep = gramSteps.find(step => step > currentValue);
        onChange(nextStep !== undefined ? nextStep : gramSteps[0]);
      }
    } else { // direction is 'down'
      if (currentValue > 28) {
        onChange(currentValue - 1);
      } else {
        const prevStep = [...gramSteps].reverse().find(step => step < currentValue);
        onChange(prevStep !== undefined ? prevStep : 0);
      }
    }
  };

  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={productType === 'g' ? "0.25" : "1"}
        step={productType === 'g' ? "0.01" : "1"}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
        <button
          type="button"
          onClick={() => handleStep('up')}
          className="h-5 w-5 flex items-center justify-center text-muted hover:text-primary rounded-sm hover:bg-white/10"
          aria-label="Increase quantity"
        >
          <ChevronUp size={12} />
        </button>
        <button
          type="button"
          onClick={() => handleStep('down')}
          className="h-5 w-5 flex items-center justify-center text-muted hover:text-primary rounded-sm hover:bg-white/10"
          aria-label="Decrease quantity"
        >
          <ChevronDown size={12} />
        </button>
      </div>
    </div>
  );
};

interface SimpleBarChartProps {
  data: { label: string; value: number }[];
  yAxisLabel?: string;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, yAxisLabel }) => {
  if (!data || data.length === 0) {
    return <p className="text-muted text-center py-8">No data available.</p>;
  }
  
  const maxValue = Math.max(0, ...data.map(d => d.value));
  const minValue = Math.min(0, ...data.map(d => d.value));
  const totalRange = maxValue - minValue;

  if (totalRange === 0) {
     return <p className="text-muted text-center py-8">No variation in data to display.</p>;
  }

  return (
    <div className="w-full space-y-2">
      {yAxisLabel && <p className="text-xs text-muted text-center">{yAxisLabel}</p>}
      <div className="flex pl-12 pr-4 h-80">
        <div className="h-full flex flex-col justify-between text-xs text-muted py-4 relative">
            <span>{`$${maxValue.toLocaleString()}`}</span>
            {minValue < 0 && <span>{`$0`}</span>}
            {minValue < 0 && <span>{`$${minValue.toLocaleString()}`}</span>}
        </div>
        <div className="flex-grow h-full flex justify-around gap-2 relative border-l border-white/10 ml-4">
          {/* Zero line */}
          {minValue < 0 && (
              <div 
                  className="absolute w-full border-t border-dashed border-white/20"
                  style={{ top: `${(maxValue / totalRange) * 100}%` }}
              />
          )}
          
          {data.map((item, index) => {
              const top = item.value >= 0 
                  ? ((maxValue - item.value) / totalRange) * 100 
                  : (maxValue / totalRange) * 100;
              const height = (Math.abs(item.value) / totalRange) * 100;
              
              return (
                  <div key={index} className="flex-1 flex flex-col justify-end items-center h-full group">
                      <div className="w-full h-full relative">
                          <div 
                              className={`w-3/4 mx-auto rounded-t-md transition-colors ${item.value >= 0 ? 'bg-indigo-500/70 hover:bg-indigo-400' : 'bg-red-500/70 hover:bg-red-400'}`}
                              style={{
                                  position: 'absolute',
                                  left: '12.5%',
                                  top: `${top}%`,
                                  height: `${height}%`,
                              }}
                          >
                              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {`$${item.value.toLocaleString()}`}
                              </span>
                          </div>
                      </div>
                       <div className="mt-2 text-xs text-muted text-center h-8 flex items-start justify-center">{item.label}</div>
                  </div>
              );
          })}
        </div>
      </div>
    </div>
  );
};
