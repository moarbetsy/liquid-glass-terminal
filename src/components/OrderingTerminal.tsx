import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Plus, Minus, X, AlertTriangle } from 'lucide-react';
import type { CartItem, Client, Order, NavigationState, CategoryData, ProductTypeData, SizeData } from '../types';
import { PRODUCT_CONFIG } from '../lib/productConfig';
import { ErrorHandler } from '../lib/errorHandling';


interface OrderingTerminalProps {
  cart: CartItem[];
  setCart: (cart: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void;
  clients: Client[];
  onCreateOrder: (order: Order) => void;
}

type Screen = 'category' | 'product' | 'size' | 'cart' | 'client' | 'confirmation';

interface CurrentSelection {
  category?: CategoryData;
  product?: ProductTypeData;
  size?: SizeData;
  quantity: number;
}

const OrderingTerminal: React.FC<OrderingTerminalProps> = ({
  cart,
  setCart,
  clients,
  onCreateOrder
}) => {
  // Debug log for client count
  React.useEffect(() => {
    console.log(`OrderingTerminal loaded with ${clients.length} clients`);
  }, [clients.length]);
  // Repair cart items on component mount
  React.useEffect(() => {
    try {
      const repairedCart = cart.map(item => ErrorHandler.repairCartItem(item));
      const hasChanges = repairedCart.some((item, index) =>
        JSON.stringify(item) !== JSON.stringify(cart[index])
      );

      if (hasChanges) {
        setCart(repairedCart);
      }
    } catch (error) {
      ErrorHandler.logError('OrderingTerminal.repairCart', error);
    }
  }, []);
  const [currentScreen, setCurrentScreen] = useState<Screen>('product');
  const [currentSelection, setCurrentSelection] = useState<CurrentSelection>({ quantity: 1 });
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentLayer: 'category',
    history: []
  });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customCallback, setCustomCallback] = useState<((value: number) => void) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfigAvailable, setIsConfigAvailable] = useState(ErrorHandler.isCategoryConfigAvailable());
  const [clientSearch, setClientSearch] = useState('');
  const [showAllClients, setShowAllClients] = useState(false);

  // Helper function to get display name for products - now just returns the abbreviated code
  const getProductDisplayName = (productKey: string): string => {
    // Always return the abbreviated code - no conversion needed
    return productKey;
  };

  // Helper function to get the internal product key from display name
  const getProductKey = (displayName: string): string => {
    // Since we only use abbreviated codes, the display name IS the key
    return displayName;
  };

  // Convert PRODUCT_CONFIG to CategoryData format for easier navigation with error handling
  const availableCategories: CategoryData[] = ErrorHandler.withErrorBoundary(
    () => {
      if (!PRODUCT_CONFIG) {
        return [];
      }

      // Create a single category containing all products
      const allProducts = Object.entries(PRODUCT_CONFIG).map(([productKey, productConfig]) => ({
        id: productKey, // Keep internal key as id
        name: getProductDisplayName(productKey), // Use display name for UI
        internalKey: productKey, // Store internal key for reference
        sizes: productConfig.sizes
          ? Object.entries(productConfig.sizes).map(([sizeName, price]) => ({
            id: sizeName,
            name: sizeName,
            price,
            unit: productConfig.allowCustom
          }))
          : productConfig.types
            ? Object.entries(productConfig.types).flatMap(([typeName, typeConfig]) =>
              Object.entries(typeConfig).map(([sizeName, price]) => ({
                id: `${typeName}-${sizeName}`,
                name: sizeName,
                price,
                unit: productConfig.allowCustom
              }))
            )
            : [],
        allowCustom: productConfig.allowCustom
      }));

      const productsCategory = {
        id: 'products',
        name: 'Products',
        products: allProducts
      };

      return [productsCategory];
    },
    [],
    'OrderingTerminal.availableCategories'
  );

  // Auto-select the products category since there's only one
  React.useEffect(() => {
    if (availableCategories.length > 0 && !currentSelection.category) {
      setCurrentSelection(prev => ({ ...prev, category: availableCategories[0] }));
    }
  }, [availableCategories, currentSelection.category]);

  const navigateToScreen = (screen: Screen, updateHistory: boolean = true) => {
    try {
      // Clear any existing errors when navigating
      setError(null);

      if (updateHistory && currentScreen !== screen) {
        // Create a complete snapshot of current navigation state
        const currentStateSnapshot: NavigationState = {
          currentLayer: navigationState.currentLayer,
          selectedCategory: navigationState.selectedCategory,
          selectedProduct: navigationState.selectedProduct,
          history: navigationState.history
        };

        setNavigationState(prev => ({
          ...prev,
          history: [...prev.history, currentStateSnapshot]
        }));
      }

      // Validate navigation to client screen
      if (screen === 'client' && cart.length === 0) {
        setError('Cannot proceed to client selection with an empty cart');
        return;
      }

      // Reset client search when navigating to client screen
      if (screen === 'client') {
        setClientSearch('');
        setShowAllClients(false);
      }

      setCurrentScreen(screen);

      // Update navigation layer based on screen
      const layerMap: Record<Screen, NavigationState['currentLayer']> = {
        'category': 'category',
        'product': 'product',
        'size': 'size',
        'cart': 'category',
        'client': 'category',
        'confirmation': 'category'
      };

      setNavigationState(prev => ({
        ...prev,
        currentLayer: layerMap[screen]
      }));
    } catch (error) {
      ErrorHandler.logError('navigateToScreen', error, { screen, updateHistory });
      setError('Navigation failed. Please try again.');
    }
  };

  const canGoBack = () => {
    return navigationState.history.length > 0 || currentScreen !== 'product';
  };

  const getScreenTransitionDirection = () => {
    // Determine transition direction based on navigation flow
    const screenHierarchy = ['category', 'product', 'size', 'cart', 'client', 'confirmation'];
    const currentIndex = screenHierarchy.indexOf(currentScreen);
    const previousScreen = navigationState.history.length > 0
      ? screenHierarchy.indexOf(navigationState.history[navigationState.history.length - 1].currentLayer)
      : -1;

    // Forward navigation (deeper into hierarchy)
    if (previousScreen >= 0 && currentIndex > previousScreen) {
      return { initial: 30, exit: -30 };
    }
    // Backward navigation (up the hierarchy)
    else if (previousScreen >= 0 && currentIndex < previousScreen) {
      return { initial: -30, exit: 30 };
    }
    // Default or lateral navigation
    else {
      return { initial: 20, exit: -20 };
    }
  };

  const goBack = () => {
    if (navigationState.history.length > 0) {
      const previousState = navigationState.history[navigationState.history.length - 1];

      // Restore the complete previous navigation state
      setNavigationState({
        currentLayer: previousState.currentLayer,
        selectedCategory: previousState.selectedCategory,
        selectedProduct: previousState.selectedProduct,
        history: previousState.history
      });

      // Determine screen based on current layer
      const screenMap: Record<NavigationState['currentLayer'], Screen> = {
        'category': 'category',
        'product': 'product',
        'size': 'size'
      };

      setCurrentScreen(screenMap[previousState.currentLayer]);

      // Restore current selection based on navigation state
      setCurrentSelection(prev => ({
        ...prev,
        category: previousState.selectedCategory,
        product: previousState.selectedProduct,
        // Preserve quantity but reset size selection when going back
        size: undefined
      }));
    } else {
      // If no history, go back to product screen as fallback
      setCurrentScreen('product');
      setNavigationState({
        currentLayer: 'product',
        selectedCategory: availableCategories[0],
        selectedProduct: undefined,
        history: []
      });
      setCurrentSelection({
        quantity: 1,
        category: availableCategories[0],
        product: undefined,
        size: undefined
      });
    }
  };

  // Add keyboard navigation support
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key for back navigation
      if (event.key === 'Escape' && canGoBack() && !showCustomInput) {
        event.preventDefault();
        goBack();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigationState.history.length, currentScreen, showCustomInput]);

  const handleCategorySelection = (category: CategoryData) => {
    try {
      // Clear any previous errors
      setError(null);

      // Validate category selection
      const validation = ErrorHandler.validateCategory(category.name);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid category selection');
        return;
      }

      setCurrentSelection(prev => ({ ...prev, category, product: undefined, size: undefined }));
      setNavigationState(prev => ({
        ...prev,
        selectedCategory: category,
        selectedProduct: undefined
      }));
      navigateToScreen('product');
    } catch (error) {
      ErrorHandler.logError('handleCategorySelection', error, { category });
      setError('Failed to select category. Please try again.');
    }
  };

  const handleProductSelection = (product: ProductTypeData) => {
    try {
      // Clear any previous errors
      setError(null);

      // Validate product selection
      if (!currentSelection.category) {
        setError('No category selected');
        return;
      }

      const productKey = product.internalKey || product.id;
      const validation = ErrorHandler.validateProduct(currentSelection.category.name, productKey);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid product selection');
        return;
      }

      setCurrentSelection(prev => ({ ...prev, product, size: undefined }));
      setNavigationState(prev => ({
        ...prev,
        selectedProduct: product
      }));

      // Navigate to size selection screen
      navigateToScreen('size');
    } catch (error) {
      ErrorHandler.logError('handleProductSelection', error, { product, category: currentSelection.category });
      setError('Failed to select product. Please try again.');
    }
  };

  const showCustomInputModal = (title: string, callback: (value: number) => void) => {
    setCustomTitle(title);
    setCustomCallback(() => callback);
    setCustomValue('');
    setShowCustomInput(true);
  };

  const handleCustomInput = () => {
    const value = parseFloat(customValue);
    if (!isNaN(value) && value > 0 && customCallback) {
      customCallback(value);
      setShowCustomInput(false);
    }
  };

  const getProductQuantityInCart = (categoryName: string, productTypeName: string) => {
    return cart.filter(item =>
      item.categoryName === categoryName && item.productTypeName === productTypeName
    ).reduce((total, item) => total + item.quantity, 0);
  };

  const handleSizeSelection = (size: SizeData) => {
    try {
      // Clear any previous errors
      setError(null);

      if (!currentSelection.category || !currentSelection.product) {
        setError('Missing category or product selection');
        return;
      }

      // Validate size selection using internal key
      const productKey = currentSelection.product.internalKey || currentSelection.product.id;
      const validation = ErrorHandler.validateSize(
        currentSelection.category.name,
        productKey,
        size.name,
        currentSelection.product.name.includes(' - ') ? currentSelection.product.name.split(' - ')[1] : undefined
      );

      if (!validation.isValid && size.id !== 'custom') {
        setError(validation.error || 'Invalid size selection');
        return;
      }

      if (size.id === 'custom') {
        showCustomInputModal(
          `Enter Custom Amount (${currentSelection.product?.allowCustom})`,
          (customSize) => {
            addItemToCart(customSize, undefined, currentSelection.product?.allowCustom!);
          }
        );
      } else {
        addItemToCart(size.name, size.price);
      }
    } catch (error) {
      ErrorHandler.logError('handleSizeSelection', error, { size, category: currentSelection.category, product: currentSelection.product });
      setError('Failed to select size. Please try again.');
    }
  };

  const addItemToCart = (size: string | number, price?: number, unit?: string) => {
    try {
      // Clear any previous errors
      setError(null);

      if (!currentSelection.category || !currentSelection.product) {
        setError('Missing category or product selection');
        return;
      }

      let finalPrice = 0;

      if (typeof size === 'string' && price !== undefined) {
        finalPrice = price;
      } else if (typeof size === 'number') {
        // Custom size calculation - find base price for 1 unit from available sizes
        const baseUnitSize = `1${unit}`;
        const baseSizeData = currentSelection.product.sizes.find(s => s.name === baseUnitSize);

        if (baseSizeData) {
          finalPrice = size * baseSizeData.price;
        } else {
          // If no 1-unit size exists, try to calculate from smallest available size
          const sizesWithUnit = currentSelection.product.sizes
            .filter(s => s.name.includes(unit || '') && s.price > 0)
            .map(s => ({
              ...s,
              numericValue: parseFloat(s.name.replace(/[^\d.]/g, ''))
            }))
            .filter(s => !isNaN(s.numericValue))
            .sort((a, b) => a.numericValue - b.numericValue);

          if (sizesWithUnit.length > 0) {
            const smallestSize = sizesWithUnit[0];
            const pricePerUnit = smallestSize.price / smallestSize.numericValue;
            finalPrice = size * pricePerUnit;
          } else {
            // Fallback: use a default price or show error
            ErrorHandler.logError('addItemToCart', `Unable to calculate custom price for ${size}${unit} - no base pricing found`, {
              category: currentSelection.category.name,
              product: currentSelection.product.name,
              size,
              unit
            });
            setError(`Unable to calculate price for custom amount. Please select a standard size.`);
            return;
          }
        }
      }

      // Check if this exact item already exists in cart
      const existingItemIndex = cart.findIndex(item =>
        item.categoryName === currentSelection.category!.name &&
        item.productTypeName === currentSelection.product!.name &&
        item.size === size &&
        item.unit === unit
      );

      if (existingItemIndex >= 0) {
        // Increment existing item
        updateCartItemQuantity(existingItemIndex, cart[existingItemIndex].quantity + currentSelection.quantity);
      } else {
        // Create enhanced cart item with full hierarchy information
        const sizeDisplay = typeof size === 'string' ? size : `${size}${unit || ''} (Custom)`;
        const displayName = `${currentSelection.category.name} > ${currentSelection.product.name} > ${sizeDisplay}`;

        // Ensure we use the correct internal key for storage
        const productKey = currentSelection.product.internalKey || currentSelection.product.id;
        
        const newItem: CartItem = {
          productId: `${currentSelection.category.name}-${productKey}-${Date.now()}`,
          productName: getProductDisplayName(productKey), // Store display name for consistency
          product: productKey, // Store internal key for data consistency
          categoryName: currentSelection.category.name,
          productTypeName: productKey, // Store internal key for data consistency
          displayName: displayName,
          size,
          unit,
          quantity: currentSelection.quantity,
          price: finalPrice * currentSelection.quantity
        };

        // Validate the cart item before adding
        const validation = ErrorHandler.validateCartItem(newItem);
        if (!validation.isValid) {
          setError(`Invalid cart item: ${validation.errors.join(', ')}`);
          return;
        }

        setCart(prev => [...prev, newItem]);
      }

      // Reset selection and return to category screen
      setCurrentSelection({
        quantity: 1,
        category: undefined,
        product: undefined,
        size: undefined
      });
      setNavigationState({
        currentLayer: 'category',
        selectedCategory: undefined,
        selectedProduct: undefined,
        history: []
      });
      setCurrentScreen('product');
    } catch (error) {
      ErrorHandler.logError('addItemToCart', error, { size, price, unit, category: currentSelection.category, product: currentSelection.product });
      setError('Failed to add item to cart. Please try again.');
    }
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }

    setCart(prev => prev.map((item, i) =>
      i === index
        ? { ...item, quantity: newQuantity, price: (item.price / item.quantity) * newQuantity }
        : item
    ));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price, 0);
  };

  const handlePlaceOrder = () => {
    try {
      // Clear any existing errors
      setError(null);

      // Validate order requirements
      if (!selectedClient) {
        setError('Please select a client before placing the order');
        return;
      }

      if (cart.length === 0) {
        setError('Cannot place an empty order');
        return;
      }

      // Validate cart items
      const invalidItems = cart.filter(item => !item.productName || !item.price || item.quantity <= 0);
      if (invalidItems.length > 0) {
        setError(`Invalid items in cart: ${invalidItems.map(i => i.productName || 'Unknown').join(', ')}`);
        return;
      }

      const order: Order = {
        id: `order-${Date.now()}-${selectedClient.displayId}`,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          type: item.type,
          size: item.size,
          unit: item.unit,
          quantity: item.quantity,
          price: item.price,
          // Include enhanced hierarchy information in order items
          categoryName: item.categoryName,
          productTypeName: item.productTypeName
        })),
        total: getTotalPrice(),
        status: 'Unpaid',
        date: new Date().toISOString(),
        notes: ''
      };

      // Validate order total
      if (order.total <= 0) {
        setError('Order total must be greater than $0');
        return;
      }

      onCreateOrder(order);
      setCart([]);
      setSelectedClient(null);
      setCurrentScreen('confirmation');
      setNavigationState({
        currentLayer: 'category',
        history: []
      });

      // Log successful order creation
      console.log(`Order created successfully: ${order.id} for ${selectedClient.name} - $${order.total.toFixed(2)}`);

    } catch (error) {
      ErrorHandler.logError('handlePlaceOrder', error, { selectedClient, cartLength: cart.length });
      setError('Failed to place order. Please try again.');
    }
  };

  const renderBreadcrumb = () => {
    const breadcrumbItems = [];

    // Always show Products as the first item
    breadcrumbItems.push({
      label: 'Products',
      isActive: currentScreen === 'product',
      onClick: () => {
        if (currentScreen !== 'product') {
          setCurrentScreen('product');
          setNavigationState({
            currentLayer: 'product',
            selectedCategory: availableCategories[0],
            selectedProduct: undefined,
            history: []
          });
          setCurrentSelection({
            quantity: 1,
            category: availableCategories[0],
            product: undefined,
            size: undefined
          });
        }
      }
    });

    // Skip adding category since it's redundant (category.name is also "Products")

    // Add product if selected
    if (currentSelection.product) {
      breadcrumbItems.push({
        label: currentSelection.product.name,
        isActive: currentScreen === 'size',
        onClick: () => { } // No action for current screen
      });
    }

    if (breadcrumbItems.length <= 1) return null;

    return (
      <motion.div
        className="mb-6 flex justify-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <motion.div
          className="glass-panel px-4 py-2 flex items-center gap-2 text-sm"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
        >
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <motion.span
                  className="text-white/30"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  ›
                </motion.span>
              )}
              <motion.button
                onClick={item.onClick}
                className={`${item.isActive
                  ? 'text-white font-medium'
                  : 'text-white/60 hover:text-white/80'
                  } transition-colors duration-200`}
                disabled={item.isActive}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                whileHover={!item.isActive ? { scale: 1.05 } : {}}
                whileTap={!item.isActive ? { scale: 0.95 } : {}}
              >
                {item.label}
              </motion.button>
            </React.Fragment>
          ))}
        </motion.div>
      </motion.div>
    );
  };

  const renderErrorMessage = () => {
    if (!error) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6 mx-auto max-w-2xl"
      >
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
          <div>
            <div className="text-red-400 font-medium text-sm">Error</div>
            <div className="text-white/80 text-sm">{error}</div>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    );
  };

  const renderConfigUnavailableMessage = () => {
    if (isConfigAvailable) return null;

    return (
      <div className="mb-8 mx-auto max-w-2xl">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
          <AlertTriangle size={32} className="text-yellow-400 mx-auto mb-3" />
          <h3 className="text-yellow-400 font-medium mb-2">Configuration Unavailable</h3>
          <p className="text-white/70 text-sm mb-4">
            Products are temporarily unavailable. You can still view your cart and manage existing orders.
          </p>
          <button
            onClick={() => {
              setIsConfigAvailable(ErrorHandler.isCategoryConfigAvailable());
              setError(null);
            }}
            className="glass-button px-4 py-2 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  };



  const renderProductTypeScreen = () => {
    if (!currentSelection.category) return null;

    // Since we now have a flat structure, get products directly from PRODUCT_CONFIG
    const products = Object.entries(PRODUCT_CONFIG);

    // Handle single product categories by auto-advancing to size selection
    if (products.length === 1) {
      const [productName, productConfig] = products[0];

      // Check if this product has types (multiple variants)
      if (productConfig.types) {
        const types = Object.keys(productConfig.types);

        // If single type, auto-advance to size selection
        if (types.length === 1) {
          const typeName = types[0];
          const sizes = Object.entries(productConfig.types[typeName]);

          // If single size and no custom option, auto-advance to size selection to show quantity selector
          if (sizes.length === 1 && !productConfig.allowCustom) {
            React.useEffect(() => {
              const productData: ProductTypeData = {
                id: `${productName}-${typeName}`,
                name: `${getProductDisplayName(productName)} - ${typeName}`,
                internalKey: productName, // Store the internal key
                sizes: Object.entries(productConfig.types![typeName]).map(([sizeName, price]) => ({
                  id: sizeName,
                  name: sizeName,
                  price,
                  unit: productConfig.allowCustom
                })),
                allowCustom: productConfig.allowCustom
              };

              setCurrentSelection(prev => ({ ...prev, product: productData }));
              setNavigationState(prev => ({
                ...prev,
                selectedProduct: productData
              }));
              navigateToScreen('size');
            }, []);

            return (
              <div className="p-8 text-center">
                <div className="text-white/60">Loading sizes...</div>
              </div>
            );
          }

          // Auto-advance to size selection for single type
          React.useEffect(() => {
            const productData: ProductTypeData = {
              id: `${productName}-${typeName}`,
              name: `${getProductDisplayName(productName)} - ${typeName}`,
              internalKey: productName,
              sizes: Object.entries(productConfig.types![typeName]).map(([sizeName, price]) => ({
                id: sizeName,
                name: sizeName,
                price,
                unit: productConfig.allowCustom
              })),
              allowCustom: productConfig.allowCustom
            };

            setCurrentSelection(prev => ({ ...prev, product: productData }));
            setNavigationState(prev => ({
              ...prev,
              selectedProduct: productData
            }));
            navigateToScreen('size');
          }, []);

          return (
            <div className="p-8 text-center">
              <div className="text-white/60">Loading sizes...</div>
            </div>
          );
        }

        // Multiple types - show type selection
        return (
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              {renderBreadcrumb()}
              <motion.div
                className="mb-8 text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <motion.h1
                  className="text-3xl font-semibold gradient-text mb-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  Select {getProductDisplayName(productName)} Type
                </motion.h1>
                <motion.p
                  className="text-white/40 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  Choose the type you need from {currentSelection.category.name}
                </motion.p>
              </motion.div>

              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.15
                    }
                  }
                }}
              >
                {Object.entries(productConfig.types).map(([typeName, typeConfig], index) => {
                  const quantityInCart = getProductQuantityInCart(currentSelection.category!.name, `${productName}-${typeName}`);
                  const sizeCount = Object.keys(typeConfig).length;

                  return (
                    <motion.button
                      key={typeName}
                      onClick={() => {
                        const productData: ProductTypeData = {
                          id: `${productName}-${typeName}`,
                          name: `${getProductDisplayName(productName)} - ${typeName}`,
                          internalKey: productName,
                          sizes: Object.entries(typeConfig).map(([sizeName, price]) => ({
                            id: sizeName,
                            name: sizeName,
                            price,
                            unit: productConfig.allowCustom
                          })),
                          allowCustom: productConfig.allowCustom
                        };
                        handleProductSelection(productData);
                      }}
                      className="glass-card p-6 text-center relative group"
                      variants={{
                        hidden: { opacity: 0, y: 20, scale: 0.95 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 24
                          }
                        }
                      }}
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.2, ease: "easeOut" }
                      }}
                      whileTap={{
                        scale: 0.98,
                        transition: { duration: 0.1 }
                      }}
                    >
                      <motion.div
                        className="text-white font-medium"
                        initial={{ opacity: 0.8 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {typeName}
                        {quantityInCart > 0 && (
                          <motion.span
                            className="text-white/70 text-sm ml-2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 + index * 0.05, type: "spring", stiffness: 400 }}
                          >
                            ({quantityInCart})
                          </motion.span>
                        )}
                      </motion.div>
                      <div className="text-white/50 text-xs mt-1 group-hover:text-white/70 transition-colors duration-200">
                        {sizeCount} size{sizeCount !== 1 ? 's' : ''} available
                      </div>
                      {quantityInCart > 0 && (
                        <motion.div
                          className="absolute -top-2 -right-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full w-6 h-6 flex items-center justify-center"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            delay: 0.4 + index * 0.05,
                            type: "spring",
                            stiffness: 400,
                            damping: 15
                          }}
                          whileHover={{ scale: 1.1 }}
                        >
                          <span className="text-white text-xs font-medium">{quantityInCart}</span>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>

            </div>
          </div>
        );
      } else if (productConfig.sizes) {
        // Single product with direct sizes - auto-advance to size selection
        const sizes = Object.entries(productConfig.sizes);

        // If single size and no custom option, auto-advance to size selection to show quantity selector
        if (sizes.length === 1 && !productConfig.allowCustom) {
          React.useEffect(() => {
            const [sizeName, price] = sizes[0];
            const productData: ProductTypeData = {
              id: productName,
              name: getProductDisplayName(productName),
              internalKey: productName,
              sizes: Object.entries(productConfig.sizes!).map(([sizeName, price]) => ({
                id: sizeName,
                name: sizeName,
                price,
                unit: productConfig.allowCustom
              })),
              allowCustom: productConfig.allowCustom
            };

            setCurrentSelection(prev => ({ ...prev, product: productData }));
            setNavigationState(prev => ({
              ...prev,
              selectedProduct: productData
            }));
            navigateToScreen('size');
          }, []);

          return (
            <div className="p-8 text-center">
              <div className="text-white/60">Loading sizes...</div>
            </div>
          );
        }

        // Auto-advance to size selection
        React.useEffect(() => {
          const productData: ProductTypeData = {
            id: productName,
            name: getProductDisplayName(productName),
            internalKey: productName,
            sizes: Object.entries(productConfig.sizes!).map(([sizeName, price]) => ({
              id: sizeName,
              name: sizeName,
              price,
              unit: productConfig.allowCustom
            })),
            allowCustom: productConfig.allowCustom
          };

          setCurrentSelection(prev => ({ ...prev, product: productData }));
          setNavigationState(prev => ({
            ...prev,
            selectedProduct: productData
          }));
          navigateToScreen('size');
        }, []);

        return (
          <div className="p-8 text-center">
            <div className="text-white/60">Loading sizes...</div>
          </div>
        );
      }
    }

    // Multiple products in category - show product selection
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {renderBreadcrumb()}
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <motion.h1
              className="text-3xl font-semibold gradient-text mb-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              Select Product
            </motion.h1>
            <motion.p
              className="text-white/40 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              Choose the product you need
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.15
                }
              }
            }}
          >
            {products.map(([productName, productConfig], index) => {
              const quantityInCart = getProductQuantityInCart(currentSelection.category!.name, productName);

              // Calculate available options count
              let optionCount = 0;
              if (productConfig.types) {
                optionCount = Object.keys(productConfig.types).length;
              } else if (productConfig.sizes) {
                optionCount = Object.keys(productConfig.sizes).length;
              }

              return (
                <motion.button
                  key={productName}
                  onClick={() => {
                    // For products with types, we need to show type selection
                    if (productConfig.types) {
                      const types = Object.keys(productConfig.types);
                      if (types.length === 1) {
                        // Single type - create product data and go to size selection
                        const typeName = types[0];
                        const productData: ProductTypeData = {
                          id: `${productName}-${typeName}`,
                          name: `${getProductDisplayName(productName)} - ${typeName}`,
                          internalKey: productName,
                          sizes: Object.entries(productConfig.types[typeName]).map(([sizeName, price]) => ({
                            id: sizeName,
                            name: sizeName,
                            price,
                            unit: productConfig.allowCustom
                          })),
                          allowCustom: productConfig.allowCustom
                        };
                        handleProductSelection(productData);
                      } else {
                        // Multiple types - need to show type selection, but we'll handle this in the main product type screen
                        const productData: ProductTypeData = {
                          id: productName,
                          name: getProductDisplayName(productName),
                          internalKey: productName,
                          sizes: [], // Will be populated based on type selection
                          allowCustom: productConfig.allowCustom
                        };
                        setCurrentSelection(prev => ({ ...prev, product: productData }));
                        // Stay on product screen to show types
                      }
                    } else if (productConfig.sizes) {
                      // Direct sizes - create product data and go to size selection
                      const productData: ProductTypeData = {
                        id: productName,
                        name: getProductDisplayName(productName),
                        internalKey: productName,
                        sizes: Object.entries(productConfig.sizes).map(([sizeName, price]) => ({
                          id: sizeName,
                          name: sizeName,
                          price,
                          unit: productConfig.allowCustom
                        })),
                        allowCustom: productConfig.allowCustom
                      };
                      handleProductSelection(productData);
                    }
                  }}
                  className="glass-card p-6 text-center relative group"
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 24
                      }
                    }
                  }}
                  whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.2, ease: "easeOut" }
                  }}
                  whileTap={{
                    scale: 0.98,
                    transition: { duration: 0.1 }
                  }}
                >
                  <motion.div
                    className="text-white font-medium"
                    initial={{ opacity: 0.8 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {getProductDisplayName(productName)}
                    {quantityInCart > 0 && (
                      <motion.span
                        className="text-white/70 text-sm ml-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.05, type: "spring", stiffness: 400 }}
                      >
                        ({quantityInCart})
                      </motion.span>
                    )}
                  </motion.div>
                  <div className="text-white/50 text-xs mt-1 group-hover:text-white/70 transition-colors duration-200">
                    {productConfig.types ? `${optionCount} type${optionCount !== 1 ? 's' : ''}` : `${optionCount} size${optionCount !== 1 ? 's' : ''}`} available
                  </div>
                  {quantityInCart > 0 && (
                    <motion.div
                      className="absolute -top-2 -right-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full w-6 h-6 flex items-center justify-center"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.4 + index * 0.05,
                        type: "spring",
                        stiffness: 400,
                        damping: 15
                      }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <span className="text-white text-xs font-medium">{quantityInCart}</span>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Cart button */}
          <AnimatePresence>
            {cart.length > 0 && (
              <motion.button
                onClick={() => navigateToScreen('cart', false)}
                className="fixed bottom-8 right-8 glass-button px-6 py-3 flex items-center gap-2 apple-shadow z-50"
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 20
                  }
                }}
                exit={{
                  scale: 0,
                  opacity: 0,
                  y: 20,
                  transition: { duration: 0.2 }
                }}
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ rotate: 0 }}
                  whileHover={{ rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <ShoppingCart size={18} />
                </motion.div>
                <span className="font-medium">Cart ({cart.length})</span>

                {/* Subtle pulse animation */}
                <motion.div
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  animate={{
                    opacity: [0, 0.3, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.button>
            )}
          </AnimatePresence>

        </div>
      </div>
    );
  };

  const renderSizeScreen = () => {
    if (!currentSelection.category || !currentSelection.product) return null;

    // Use the sizes from the selected product (which should already be properly formatted)
    let availableSizes: SizeData[] = [...currentSelection.product.sizes];

    // Add custom option if allowed
    if (currentSelection.product.allowCustom) {
      availableSizes.push({
        id: 'custom',
        name: `Custom (${currentSelection.product.allowCustom})`,
        price: 0,
        unit: currentSelection.product.allowCustom
      });
    }

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {renderBreadcrumb()}
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <motion.h1
              className="text-3xl font-semibold gradient-text mb-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              Select Size for {currentSelection.product.name}
            </motion.h1>
            <motion.p
              className="text-white/40 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              Choose the size and quantity you need
            </motion.p>
          </motion.div>

          {/* Quantity selector */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="glass-panel p-4 flex items-center gap-4">
              <span className="text-white/70 text-sm">Quantity:</span>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => setCurrentSelection(prev => ({
                    ...prev,
                    quantity: Math.max(1, prev.quantity - 1)
                  }))}
                  className="w-8 h-8 glass-button flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={currentSelection.quantity <= 1}
                >
                  <Minus size={14} />
                </motion.button>
                <motion.span
                  className="text-white font-medium w-8 text-center text-sm"
                  key={currentSelection.quantity}
                  initial={{ scale: 1.2, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  {currentSelection.quantity}
                </motion.span>
                <motion.button
                  onClick={() => setCurrentSelection(prev => ({
                    ...prev,
                    quantity: prev.quantity + 1
                  }))}
                  className="w-8 h-8 glass-button flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Plus size={14} />
                </motion.button>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.08,
                  delayChildren: 0.2
                }
              }
            }}
          >
            {availableSizes.map((size, index) => {
              const totalPrice = size.price * currentSelection.quantity;
              const isCustom = size.id === 'custom';

              return (
                <motion.button
                  key={size.id}
                  onClick={() => handleSizeSelection(size)}
                  className={`glass-card p-6 text-center group relative overflow-hidden ${isCustom ? 'border-purple-500/30 bg-purple-500/5' : ''
                    }`}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 24
                      }
                    }
                  }}
                  whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.2, ease: "easeOut" }
                  }}
                  whileTap={{
                    scale: 0.98,
                    transition: { duration: 0.1 }
                  }}
                >
                  {/* Subtle background animation on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100"
                    transition={{ duration: 0.3 }}
                  />

                  <div className="relative z-10">
                    <motion.div
                      className={`font-medium ${isCustom ? 'text-purple-300' : 'text-white'}`}
                      initial={{ opacity: 0.8 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {size.name}
                    </motion.div>

                    {size.price > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                      >
                        <div className="text-white/70 text-sm mt-1 group-hover:text-white/90 transition-colors duration-200">
                          ${size.price.toFixed(2)} each
                        </div>
                        {currentSelection.quantity > 1 && (
                          <motion.div
                            className="text-white/50 text-xs mt-1 group-hover:text-white/70 transition-colors duration-200"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                          >
                            Total: ${totalPrice.toFixed(2)}
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {isCustom && (
                      <motion.div
                        className="text-purple-400/70 text-xs mt-1 group-hover:text-purple-300 transition-colors duration-200"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + index * 0.05 }}
                      >
                        Enter custom amount
                      </motion.div>
                    )}
                  </div>

                  {/* Subtle pulse effect for custom option */}
                  {isCustom && (
                    <motion.div
                      className="absolute inset-0 border border-purple-400/20 rounded-xl"
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.01, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Back button */}
          <motion.div
            className="flex justify-center mt-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <motion.button
              onClick={goBack}
              className="glass-button px-6 py-3 flex items-center gap-2 group"
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={{ x: 0 }}
                whileHover={{ x: -2 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowLeft size={18} />
              </motion.div>
              <span className="group-hover:text-white/90 transition-colors duration-200">
                Back to Products
              </span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  };

  const renderCartScreen = () => (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold gradient-text mb-2">
            Review Your Order
          </h1>
          <p className="text-white/40 text-sm">Review items before placing order</p>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-white/40 text-lg mb-4">Your cart is empty</div>
            <button
              onClick={() => {
                setCurrentScreen('product');
                setNavigationState({
                  currentLayer: 'product',
                  history: []
                });
              }}
              className="glass-button py-3 px-6 font-medium"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-8">
              {cart.map((item, index) => {
                // Repair cart item and handle errors gracefully
                const repairedItem = ErrorHandler.withErrorBoundary(
                  () => ErrorHandler.repairCartItem(item),
                  item,
                  'renderCartScreen.repairCartItem'
                );

                const sizeDisplay = typeof repairedItem.size === 'string' ? repairedItem.size : `${repairedItem.size}${repairedItem.unit || ''} (Custom)`;
                const unitPrice = repairedItem.price / repairedItem.quantity;

                // Create a clear hierarchy display with fallback
                const hierarchyDisplay = ErrorHandler.withErrorBoundary(
                  () => repairedItem.displayName || ErrorHandler.createFallbackDisplayName(repairedItem),
                  `${repairedItem.productName} - ${sizeDisplay}`,
                  'renderCartScreen.hierarchyDisplay'
                );

                const isLegacy = repairedItem.categoryName === 'Legacy';

                return (
                  <motion.div
                    key={index}
                    className={`glass-panel p-6 ${isLegacy ? 'border-yellow-500/20' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Main product hierarchy display */}
                        <div className={`font-medium mb-2 leading-tight flex items-center gap-2 ${isLegacy ? 'text-yellow-400' : 'text-white'
                          }`}>
                          {hierarchyDisplay}
                          {isLegacy && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                              Legacy
                            </span>
                          )}
                        </div>

                        {/* Detailed breakdown */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-white/50 text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-white/40">Category:</span>
                              <span className={`font-medium ${isLegacy ? 'text-yellow-400/70' : 'text-white/70'}`}>
                                {repairedItem.categoryName || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-white/40">Product:</span>
                              <span className="text-white/70 font-medium">{repairedItem.productTypeName || repairedItem.productName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-white/40">Size:</span>
                              <span className="text-white/70 font-medium">{sizeDisplay}</span>
                            </div>
                          </div>

                          {/* Pricing breakdown */}
                          <div className="text-white/40 text-xs">
                            ${unitPrice.toFixed(2)} each × {repairedItem.quantity} = ${repairedItem.price.toFixed(2)}
                          </div>

                          {/* Legacy warning */}
                          {isLegacy && (
                            <div className="text-yellow-400/60 text-xs mt-2">
                              This item uses the legacy product structure
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quantity controls and actions */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                            className="w-8 h-8 glass-button flex items-center justify-center"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-white font-medium w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                            className="w-8 h-8 glass-button flex items-center justify-center"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Total price for this item */}
                        <div className="text-white font-medium min-w-[80px] text-right">
                          ${item.price.toFixed(2)}
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={() => removeFromCart(index)}
                          className="w-8 h-8 glass-button flex items-center justify-center text-white/60 hover:text-white transition-colors"
                          title="Remove item"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Cart summary */}
            <div className="glass-panel p-6 mb-8">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-white/70">
                  <span>Items ({cart.length}):</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 pt-2">
                  <div className="flex justify-between items-center text-xl font-semibold text-white">
                    <span>Total:</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setCurrentScreen('product');
                  setNavigationState({
                    currentLayer: 'product',
                    history: []
                  });
                }}
                className="flex-1 glass-button py-4 px-6 font-medium"
              >
                Add More Items
              </button>
              <button
                onClick={() => navigateToScreen('client', false)}
                className="flex-1 glass-button py-4 px-6 font-medium bg-white/[0.08] border-white/[0.15]"
                disabled={cart.length === 0}
              >
                Select Client & Place Order
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderClientScreen = () => {
    try {
      // Validate clients data
      if (!clients || !Array.isArray(clients)) {
        return (
          <div className="p-8 text-center">
            <div className="text-red-400 mb-4">Error: Client data not available</div>
            <button
              onClick={() => setCurrentScreen('cart')}
              className="glass-button px-6 py-3"
            >
              Back to Cart
            </button>
          </div>
        );
      }

      // Filter clients based on search
      const filteredClients = clients.filter(client => {
        if (!client || !client.name) return false;
        const searchLower = clientSearch.toLowerCase();
        return (
          client.name.toLowerCase().includes(searchLower) ||
          (client.phone && client.phone.includes(clientSearch)) ||
          (client.address && client.address.toLowerCase().includes(searchLower))
        );
      });

      // Show limited clients initially for performance, but allow showing all
      const displayedClients = showAllClients ? filteredClients : filteredClients.slice(0, 50);

      return (
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-semibold gradient-text mb-2">
                Select Client
              </h1>
              <p className="text-white/40 text-sm">
                Choose a client for this order ({clients.length} total clients)
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group bg-white/[0.08] text-white border border-white/[0.12]" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search clients"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    autoFocus
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 font-medium text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Client Count Info */}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-white/60 text-sm">
                Showing {displayedClients.length} of {filteredClients.length} clients
                {clientSearch && ` (filtered from ${clients.length} total)`}
              </div>
              {filteredClients.length > 50 && !showAllClients && (
                <button
                  onClick={() => setShowAllClients(true)}
                  className="glass-button px-4 py-2 text-sm"
                >
                  Show All {filteredClients.length} Clients
                </button>
              )}
            </div>

            {/* Clients Grid - Memory Optimized */}
            <div className="mb-8 max-h-96 overflow-y-auto border border-white/10 rounded-xl">
              {displayedClients.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {displayedClients.map((client, index) => (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`w-full p-4 text-left transition-colors duration-150 ${selectedClient?.id === client.id
                        ? 'bg-white/[0.08] text-white'
                        : 'hover:bg-white/[0.02] text-white/90'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm mb-1 truncate">{client.name}</div>
                          <div className="text-xs text-white/50 mb-1">
                            ID: {client.displayId} • Phone: {client.phone || 'N/A'}
                          </div>
                          <div className="text-xs text-white/40 truncate">
                            {client.address || 'No address'}
                          </div>
                          {client.notes && (
                            <div className="text-xs text-white/30 mt-1 truncate">
                              Notes: {client.notes}
                            </div>
                          )}
                        </div>
                        {selectedClient?.id === client.id && (
                          <div className="text-green-400 text-xs font-medium ml-2">
                            ✓ Selected
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-white/40 mb-2">No clients found</div>
                  <div className="text-white/30 text-sm">
                    {clientSearch ? 'Try adjusting your search terms' : 'No clients available'}
                  </div>
                </div>
              )}
            </div>

            {/* Complete Order Button */}
            {selectedClient && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6"
              >
                <motion.button
                  onClick={handlePlaceOrder}
                  className="w-full glass-button py-4 px-6 font-medium text-lg bg-white/[0.08] border-white/[0.15] apple-shadow"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Complete Order for {selectedClient.name} (${getTotalPrice().toFixed(2)})
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      );
    } catch (error) {
      ErrorHandler.logError('renderClientScreen', error);
      return (
        <div className="p-8 text-center">
          <div className="text-red-400 mb-4">Error loading client selection</div>
          <button
            onClick={() => setCurrentScreen('cart')}
            className="glass-button px-6 py-3"
          >
            Back to Cart
          </button>
        </div>
      );
    }
  };

  const renderConfirmationScreen = () => (
    <div className="p-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-md mx-auto"
      >
        <h1 className="text-3xl font-semibold gradient-text mb-4">Order Placed!</h1>
        <p className="text-white/50 text-sm mb-8">Your order has been successfully submitted.</p>
        <button
          onClick={() => {
            setCurrentScreen('product');
            setNavigationState({
              currentLayer: 'product',
              history: []
            });
            setCurrentSelection({ quantity: 1 });
          }}
          className="glass-button py-4 px-8 font-medium bg-white/[0.08] border-white/[0.15] apple-shadow"
        >
          Start New Order
        </button>
      </motion.div>
    </div>
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case 'product': return renderProductTypeScreen();
      case 'size': return renderSizeScreen();
      case 'cart': return renderCartScreen();
      case 'client': return renderClientScreen();
      case 'confirmation': return renderConfirmationScreen();
      default: return renderProductTypeScreen();
    }
  };

  return (
    <div className="h-full bg-black relative overflow-auto">
      {/* Back button */}
      {currentScreen !== 'product' && currentScreen !== 'confirmation' && (
        <button
          onClick={goBack}
          className="absolute top-6 left-6 z-10 glass-button p-3"
        >
          <ArrowLeft size={18} />
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, x: getScreenTransitionDirection().initial }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: getScreenTransitionDirection().exit }}
          transition={{
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
            opacity: { duration: 0.3 }
          }}
          className="h-full"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {/* Custom Input Modal */}
      {showCustomInput && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ease: [0.25, 0.46, 0.45, 0.94] }}
            className="glass-panel p-6 w-96 mx-4"
          >
            <h2 className="text-white font-medium mb-4">{customTitle}</h2>
            <input
              type="number"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="glass-input w-full mb-4"
              placeholder="Enter amount"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCustomInput(false)}
                className="flex-1 glass-button py-2 px-4 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomInput}
                className="flex-1 glass-button py-2 px-4 text-sm font-medium bg-white/[0.08] border-white/[0.15]"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OrderingTerminal;