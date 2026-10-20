import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import cartService from '../services/cartService';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  // Guest Cart State (from localStorage)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('swarna_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
      return [];
    }
  });

  // Direct Buy Now Item State (persisted in sessionStorage across login redirect)
  const [buyNowItem, setBuyNowItemState] = useState(() => {
    try {
      const saved = sessionStorage.getItem('swarna_buynow_item');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [toastMessage, setToastMessage] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const setBuyNowItem = (item) => {
    setBuyNowItemState(item);
    if (item) {
      sessionStorage.setItem('swarna_buynow_item', JSON.stringify(item));
    } else {
      sessionStorage.removeItem('swarna_buynow_item');
    }
  };

  const clearBuyNow = () => {
    setBuyNowItemState(null);
    sessionStorage.removeItem('swarna_buynow_item');
  };

  /**
   * Sync MongoDB cart for authenticated customers, or reconcile guest cart upon login
   */
  const syncCartFromBackend = useCallback(async () => {
    if (!isAuthenticated) return;

    setCartLoading(true);
    try {
      // Check if there are any guest items stored in localStorage to reconcile
      let guestItems = [];
      try {
        const saved = localStorage.getItem('swarna_cart');
        guestItems = saved ? JSON.parse(saved) : [];
      } catch {
        guestItems = [];
      }

      if (guestItems.length > 0 && user?.role === 'customer') {
        // Reconcile / Merge guest items into MongoDB user cart without duplication
        const payload = guestItems.map((item) => ({
          productId: item.product?._id || item.product,
          quantity: item.quantity,
        }));
        await cartService.mergeCart(payload);
        // Clear guest items after merging into database
        localStorage.removeItem('swarna_cart');
      }

      // Fetch authoritative MongoDB cart
      const response = await cartService.getCart();
      if (response.success && response.data?.items) {
        setCart(response.data.items);
      }
    } catch (err) {
      console.error('Failed to sync shopping bag with database:', err);
    } finally {
      setCartLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  // Sync on login / user change
  useEffect(() => {
    if (isAuthenticated) {
      syncCartFromBackend();
    } else {
      // Load guest cart from localStorage
      try {
        const saved = localStorage.getItem('swarna_cart');
        setCart(saved ? JSON.parse(saved) : []);
      } catch {
        setCart([]);
      }
    }
  }, [isAuthenticated, user, syncCartFromBackend]);

  // Save guest cart to localStorage when not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        localStorage.setItem('swarna_cart', JSON.stringify(cart));
      } catch (e) {
        console.error('Failed to save guest cart to localStorage', e);
      }
    }
  }, [cart, isAuthenticated]);

  /**
   * Add a product to cart with stock validation
   */
  const addToCart = async (product, quantity = 1) => {
    if (!product || product.stock <= 0) {
      showToast('Sorry, this saree is currently out of stock.');
      return false;
    }

    if (isAuthenticated) {
      try {
        const response = await cartService.addToCart(product._id, quantity);
        if (response.success && response.data?.items) {
          setCart(response.data.items);
          showToast(`Added "${product.title}" to your shopping bag.`);
          return true;
        }
      } catch (err) {
        showToast(err.message || 'Failed to add saree to shopping bag.');
        return false;
      }
    }

    // Guest Cart (localStorage)
    let addedSuccessfully = true;
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.product._id === product._id
      );

      if (existingIndex > -1) {
        const currentQty = prevCart[existingIndex].quantity;
        const newQty = Math.min(currentQty + quantity, product.stock);

        if (currentQty >= product.stock) {
          showToast(`Maximum available stock (${product.stock}) already in bag.`);
          addedSuccessfully = false;
          return prevCart;
        }

        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        showToast(`Updated "${product.title}" in your bag.`);
        return updated;
      } else {
        const initialQty = Math.min(quantity, product.stock);
        showToast(`Added "${product.title}" to your bag.`);
        return [...prevCart, { product, quantity: initialQty }];
      }
    });

    return addedSuccessfully;
  };

  /**
   * Update quantity of an item
   */
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    if (isAuthenticated) {
      try {
        const response = await cartService.updateQuantity(productId, newQuantity);
        if (response.success && response.data?.items) {
          setCart(response.data.items);
        }
      } catch (err) {
        showToast(err.message || 'Failed to update quantity.');
      }
      return;
    }

    // Guest Cart
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product._id === productId) {
          const maxStock = item.product.stock || 1;
          const cappedQty = Math.min(newQuantity, maxStock);
          return { ...item, quantity: cappedQty };
        }
        return item;
      })
    );
  };

  /**
   * Remove an item from cart
   */
  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
      try {
        const response = await cartService.removeItem(productId);
        if (response.success && response.data?.items) {
          setCart(response.data.items);
        }
      } catch (err) {
        console.error('Failed to remove item from database cart', err);
      }
    }

    setCart((prevCart) => prevCart.filter((item) => item.product._id !== productId));
    showToast('Item removed from shopping bag.');
  };

  /**
   * Clear all cart items
   */
  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await cartService.clearCart();
      } catch (err) {
        console.error('Failed to clear database cart', err);
      }
    }

    setCart([]);
    localStorage.removeItem('swarna_cart');
  };

  // Derived metrics
  const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
  const subtotal = cart.reduce(
    (total, item) => total + (item.product?.price || 0) * (item.quantity || 1),
    0
  );
  const shippingFee = 0; // Free pan-India express shipping
  const finalTotal = subtotal + shippingFee;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        shippingFee,
        finalTotal,
        buyNowItem,
        setBuyNowItem,
        clearBuyNow,
        toastMessage,
        syncCartFromBackend,
      }}
    >
      {children}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-gold-400/30 flex items-center gap-3 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-gold-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
