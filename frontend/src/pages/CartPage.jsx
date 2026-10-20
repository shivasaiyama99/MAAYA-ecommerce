import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/formatCurrency';
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

export const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, totalItems, clearBuyNow } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="max-w-md mx-auto bg-white p-10 rounded-3xl border border-stone-200 shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-full bg-maroon-50 border border-maroon-100 text-maroon-700 flex items-center justify-center mx-auto shadow-inner">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            Your Shopping Bag is Empty
          </h2>
          <p className="text-xs text-stone-500 leading-relaxed font-light">
            You haven't added any handcrafted sarees to your bag yet. Explore our pure silk Kanjeevarams and bridal Banarasis.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-semibold tracking-widest uppercase transition-all shadow-md hover:shadow-lg"
          >
            <span>Explore Collection</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <span className="text-xs font-bold tracking-[0.25em] text-gold-700 uppercase">
          Curated Selection
        </span>
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight mt-1">
          Your Shopping Bag ({totalItems} {totalItems === 1 ? 'drape' : 'drapes'})
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100 overflow-hidden">
            {cart.map((item) => {
              const product = item.product;
              const photo =
                product.images?.find((img) => img.isMain)?.url ||
                product.images?.[0]?.url ||
                'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80';

              return (
                <div key={product._id} className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Item Image and Title */}
                  <div className="flex items-center gap-4 min-w-0">
                    <Link to={`/shop/${product._id}`} className="shrink-0">
                      <img
                        src={photo}
                        alt={product.title}
                        className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl object-cover border border-stone-200 shadow-sm"
                      />
                    </Link>

                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold-700 bg-gold-50 px-2 py-0.5 rounded border border-gold-200">
                        {product.category}
                      </span>
                      <Link to={`/shop/${product._id}`}>
                        <h3 className="font-serif text-sm sm:text-base font-bold text-stone-900 hover:text-maroon-700 transition-colors line-clamp-2">
                          {product.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-stone-400 font-mono">
                        SKU: {product.sku}
                      </p>
                      <div className="text-sm font-serif font-bold text-maroon-800">
                        {formatINR(product.price)}
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Remove Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-stone-100">
                    <div className="flex items-center border border-stone-300 rounded-lg bg-stone-50">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product._id, item.quantity - 1)}
                        className="p-1.5 text-stone-600 hover:text-stone-900 disabled:opacity-30"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 font-mono font-bold text-xs text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product._id, item.quantity + 1)}
                        disabled={item.quantity >= (product.stock || 1)}
                        className="p-1.5 text-stone-600 hover:text-stone-900 disabled:opacity-30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-serif font-bold text-stone-900 block">
                        {formatINR((product.price || 0) * item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product._id)}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-medium inline-flex items-center gap-1 mt-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-stone-600 hover:text-maroon-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </Link>

            <button
              type="button"
              onClick={clearCart}
              className="text-stone-400 hover:text-rose-600 transition-colors"
            >
              Clear Shopping Bag
            </button>
          </div>
        </div>

        {/* Order Summary Column */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6 sticky top-28">
          <h2 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">
            Order Summary
          </h2>

          <div className="space-y-3 text-xs text-stone-600">
            <div className="flex justify-between items-center">
              <span>Bag Subtotal ({totalItems} items)</span>
              <span className="font-semibold text-stone-900">{formatINR(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Pan-India Delivery</span>
              <span className="font-semibold text-emerald-700">FREE</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Taxes (GST)</span>
              <span className="font-semibold text-stone-900">Included</span>
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-between items-center text-sm">
              <span className="font-serif font-bold text-stone-900">Total Payable</span>
              <span className="font-serif text-xl font-bold text-maroon-800">
                {formatINR(subtotal)}
              </span>
            </div>
          </div>

          <button
            type="button"
            id="cart-proceed-checkout-btn"
            onClick={() => {
              clearBuyNow();
              navigate('/checkout');
            }}
            className="w-full py-3.5 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-semibold text-xs tracking-widest uppercase transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-4 border-t border-stone-100 space-y-2 text-[11px] text-stone-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Silk Mark Certified Pure Handlooms</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-gold-600 shrink-0" />
              <span>Complimentary insured shipping across India</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
