import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import orderService from '../services/orderService';
import { formatINR } from '../utils/formatCurrency';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShoppingBag,
  Zap,
  Info,
  LogIn,
} from 'lucide-react';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    cart,
    subtotal: cartSubtotal,
    totalItems: cartTotalItems,
    clearCart,
    buyNowItem,
    clearBuyNow,
  } = useCart();

  // Determine active checkout mode (Direct Buy Now vs Shopping Bag)
  const isDirectBuyNow = Boolean(buyNowItem && buyNowItem.product);

  const activeItems = isDirectBuyNow
    ? [
        {
          product: buyNowItem.product,
          quantity: buyNowItem.quantity || 1,
        },
      ]
    : cart;

  const activeSubtotal = isDirectBuyNow
    ? (buyNowItem.product?.price || 0) * (buyNowItem.quantity || 1)
    : cartSubtotal;

  const activeTotalItems = isDirectBuyNow
    ? buyNowItem.quantity || 1
    : cartTotalItems;

  const shippingFee = 0; // Free pan-India express shipping
  const finalTotal = activeSubtotal + shippingFee;

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    deliveryInstructions: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [placedOrder, setPlacedOrder] = useState(null);

  // Empty state when neither Buy Now nor Bag items exist
  if (activeItems.length === 0 && !placedOrder) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <ShoppingBag className="w-12 h-12 text-stone-400 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-stone-900">
            No Sarees to Checkout
          </h2>
          <p className="text-xs text-stone-500">
            Please select a saree from our boutique or add items to your shopping bag.
          </p>
          <Link
            to="/shop"
            className="inline-block px-5 py-2.5 rounded-lg bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            Explore Sarees
          </Link>
        </div>
      </div>
    );
  }

  // Order Confirmation Success Screen
  if (placedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold tracking-[0.25em] text-emerald-700 uppercase">
            Order Confirmed
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Thank You for Celebrating Handloom
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-light max-w-lg mx-auto">
            Your handcrafted order has been placed. Our weavers are carefully packaging your drape for dispatch.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm text-left space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <span className="text-stone-500">Order Reference</span>
            <span className="font-mono font-bold text-stone-900 text-sm">
              {placedOrder.orderNumber}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <span className="text-stone-500">Order Status</span>
            <span className="font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {placedOrder.orderStatus || 'Placed'}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <span className="text-stone-500">Total Payable at Delivery</span>
            <span className="font-serif font-bold text-maroon-800 text-base">
              {formatINR(placedOrder.totalAmount)}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <span className="text-stone-500">Payment Option</span>
            <div>
              <span className="font-semibold text-stone-800 block">
                {placedOrder.paymentMethod === 'COD'
                  ? 'Cash on Delivery (Pay at Doorstep)'
                  : placedOrder.paymentMethod}
              </span>
              <span className="text-[10px] text-amber-700">
                Payment Status: {placedOrder.paymentStatus || 'Pending'} (Unpaid until handover)
              </span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="pt-1 space-y-1">
            <span className="text-stone-500 block">Delivering To:</span>
            <p className="font-medium text-stone-800">
              {placedOrder.shippingAddress?.fullName} ({placedOrder.shippingAddress?.phone})
            </p>
            <p className="text-stone-600">
              {placedOrder.shippingAddress?.addressLine}, {placedOrder.shippingAddress?.city},{' '}
              {placedOrder.shippingAddress?.state} - {placedOrder.shippingAddress?.pincode}
            </p>
            {placedOrder.shippingAddress?.deliveryInstructions && (
              <p className="text-stone-500 italic mt-1">
                Instructions: "{placedOrder.shippingAddress.deliveryInstructions}"
              </p>
            )}
          </div>

          {/* Items Summary */}
          <div className="pt-3 border-t border-stone-100">
            <span className="text-stone-500 block mb-2 font-medium">Items Ordered:</span>
            <div className="space-y-2">
              {placedOrder.items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-10 h-12 object-cover rounded border border-stone-200 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-serif font-semibold text-stone-800 truncate">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-stone-500">
                      Qty: {item.quantity} × {formatINR(item.price)}
                    </p>
                  </div>
                  <span className="font-medium text-stone-800 shrink-0">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link
            to="/my-orders"
            className="px-6 py-3 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-semibold tracking-widest uppercase transition-all shadow-md"
          >
            Track in My Orders
          </Link>
          <Link
            to="/shop"
            className="px-6 py-3 rounded-xl bg-white border border-stone-300 hover:border-maroon-600 text-stone-800 text-xs font-semibold tracking-widest uppercase transition-all shadow-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // Enforce authentication before checkout
    if (!isAuthenticated) {
      setError('Please sign in or register to complete your order.');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    if (
      !address.fullName.trim() ||
      !address.phone.trim() ||
      !address.addressLine.trim() ||
      !address.city.trim() ||
      !address.state.trim() ||
      !address.pincode.trim()
    ) {
      setError('Please fill in all required delivery address fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const idempotencyKey = `ord_idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const orderPayload = {
      idempotencyKey,
      isBuyNow: isDirectBuyNow,
      fromCart: !isDirectBuyNow,
      items: activeItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      })),
      shippingAddress: {
        fullName: address.fullName.trim(),
        phone: address.phone.trim(),
        addressLine: address.addressLine.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
        deliveryInstructions: address.deliveryInstructions?.trim() || '',
      },
      paymentMethod,
    };

    try {
      const response = await orderService.createOrder(orderPayload);
      if (response.success && response.data) {
        if (isDirectBuyNow) {
          clearBuyNow();
        } else {
          clearCart();
        }
        setPlacedOrder(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div>
        <span className="text-xs font-bold tracking-[0.25em] text-gold-700 uppercase">
          Safe & Insured Checkout
        </span>
        <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight mt-1">
          Delivery & Payment
        </h1>
      </div>

      {/* Direct Buy Now Indicator */}
      {isDirectBuyNow && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-semibold">
              Direct Buy Now Checkout: Checking out single saree ({buyNowItem.product.title})
            </span>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearBuyNow}
              className="text-amber-800 underline hover:text-amber-950 font-medium"
            >
              Switch to full shopping bag ({cart.length} {cart.length === 1 ? 'item' : 'items'})
            </button>
          )}
        </div>
      )}

      {/* Authentication Requirement Banner */}
      {!isAuthenticated && (
        <div className="p-4 rounded-2xl bg-maroon-50 border border-maroon-200 text-maroon-900 text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <LogIn className="w-4 h-4 text-maroon-700 shrink-0" />
            <span>
              <strong>Customer sign-in required:</strong> Please sign in or register to complete your order. Your items are safely preserved.
            </span>
          </div>
          <Link
            to="/login"
            state={{ from: { pathname: '/checkout' } }}
            className="px-4 py-2 rounded-lg bg-maroon-700 hover:bg-maroon-800 text-white font-semibold tracking-wider uppercase text-[11px] transition-colors"
          >
            Sign In to Checkout
          </Link>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Shipping Address & Payment Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Shipping Address Form */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-stone-900 pb-2 border-b border-stone-100">
              1. Delivery Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={address.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g. Smt. Radhika Iyer"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-maroon-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={address.phone}
                  onChange={handleInputChange}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-maroon-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Flat / House No., Building, Street *
                </label>
                <input
                  type="text"
                  name="addressLine"
                  required
                  value={address.addressLine}
                  onChange={handleInputChange}
                  placeholder="e.g. 402 Heritage Heights, North Mada Street"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-maroon-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  City / Town *
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  value={address.city}
                  onChange={handleInputChange}
                  placeholder="e.g. Chennai"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-maroon-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  required
                  value={address.state}
                  onChange={handleInputChange}
                  placeholder="e.g. Tamil Nadu"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-maroon-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  name="pincode"
                  required
                  maxLength={6}
                  value={address.pincode}
                  onChange={handleInputChange}
                  placeholder="6-digit PIN code"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-maroon-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  name="deliveryInstructions"
                  value={address.deliveryInstructions}
                  onChange={handleInputChange}
                  placeholder="e.g. Leave with security, call before arrival"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-maroon-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method Selection */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-stone-900 pb-2 border-b border-stone-100">
              2. Payment Method
            </h2>

            <div className="space-y-3">
              {/* Option 1: Cash on Delivery (Active & Recommended) */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-maroon-700 bg-maroon-50/20 ring-1 ring-maroon-700'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1 text-maroon-700 focus:ring-maroon-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-maroon-700" />
                    <span className="font-semibold text-stone-900 text-xs">
                      Cash on Delivery (COD)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Available
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                    Pay at your doorstep via Cash or mobile UPI upon delivery. Your order remains safely recorded as <em>Pending</em> until verified upon handover.
                  </p>
                </div>
              </label>

              {/* Option 2: Online Payment Gateway (Clean notice, structured for future integration) */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-stone-200 bg-stone-50/70 opacity-80 cursor-not-allowed">
                <input
                  type="radio"
                  name="paymentMethod"
                  disabled
                  className="mt-1 text-stone-400"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-stone-400" />
                    <span className="font-semibold text-stone-500 text-xs">
                      Online Cards, UPI & Net Banking
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-700">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Razorpay/Stripe online payment gateway integration in progress. Please choose Cash on Delivery for immediate fulfillment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Order Summary & Place Order Action */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-stone-900 pb-2 border-b border-stone-100">
              Order Summary ({activeTotalItems} {activeTotalItems === 1 ? 'drape' : 'drapes'})
            </h2>

            {/* Saree Items List */}
            <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto space-y-2 pr-1">
              {activeItems.map((item, idx) => {
                const prod = item.product || {};
                const photo =
                  prod.images?.find((img) => img.isMain)?.url ||
                  prod.images?.[0]?.url ||
                  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80';

                return (
                  <div key={prod._id || idx} className="flex gap-3 pt-2">
                    <img
                      src={photo}
                      alt={prod.title}
                      className="w-12 h-16 object-cover rounded-lg border border-stone-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-xs font-semibold text-stone-900 truncate">
                        {prod.title}
                      </p>
                      <p className="text-[10px] text-stone-500 mt-0.5">
                        {prod.category} • Qty: {item.quantity}
                      </p>
                      <p className="text-xs font-bold text-maroon-800 mt-1">
                        {formatINR((prod.price || 0) * (item.quantity || 1))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-stone-100 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{formatINR(activeSubtotal)}</span>
              </div>

              <div className="flex justify-between text-stone-600">
                <span>Pan-India Handloom Delivery</span>
                <span className="text-emerald-700 font-semibold uppercase text-[10px] tracking-wider">
                  Free Express
                </span>
              </div>

              <div className="flex justify-between font-serif font-bold text-base text-stone-900 pt-2 border-t border-stone-100">
                <span>Final Total</span>
                <span className="text-maroon-800">{formatINR(finalTotal)}</span>
              </div>
            </div>

            {/* Place Order CTA Button */}
            {!isAuthenticated ? (
              <Link
                to="/login"
                state={{ from: { pathname: '/checkout' } }}
                className="w-full py-3.5 px-4 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-semibold text-xs tracking-widest uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-center"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Register to Place Order</span>
              </Link>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-semibold text-xs tracking-widest uppercase transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Safely Creating Order...</span>
                  </>
                ) : (
                  <>
                    <span>Place Order (Pay on Delivery)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {/* Trust Badges */}
            <div className="pt-3 border-t border-stone-100 space-y-2 text-[11px] text-stone-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gold-600 shrink-0" />
                <span>100% Genuine Silk Mark Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-gold-600 shrink-0" />
                <span>Zero Advance Payment Required</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
