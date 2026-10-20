import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import orderService from '../services/orderService';
import { formatINR } from '../utils/formatCurrency';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShoppingBag,
  Zap,
  Info,
  LogIn,
  Smartphone,
  Copy,
  Check,
  QrCode,
  Clock,
  Mail,
  AlertTriangle,
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
    email: user?.email || '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    deliveryInstructions: '',
  });

  const [paymentConfig, setPaymentConfig] = useState({
    upiId: import.meta.env.VITE_STORE_UPI_ID || '',
    upiName: import.meta.env.VITE_STORE_UPI_NAME || 'MAAYA Collections',
    upiQrUrl: import.meta.env.VITE_STORE_UPI_QR_URL || '',
    supportEmail: 'komakulakiranmai@gmail.com',
    supportPhone: '+91 97016 07651',
    emailConfigured: false,
    emailUser: 'sih7952@gmail.com',
  });

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [showEmailPopup, setShowEmailPopup] = useState(false);

  // Sync user profile data to address form once authenticated user is available
  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  // Fetch store payment & support settings from backend
  useEffect(() => {
    orderService
      .getPaymentConfig()
      .then((res) => {
        if (res?.success && res?.data) {
          setPaymentConfig((prev) => ({
            ...prev,
            upiId: res.data.upiId || prev.upiId,
            upiName: res.data.upiName || prev.upiName,
            upiQrUrl: res.data.upiQrUrl || prev.upiQrUrl,
            supportEmail: res.data.supportEmail || prev.supportEmail,
            supportPhone: res.data.supportPhone || prev.supportPhone,
            emailConfigured: Boolean(res.data.emailConfigured),
            emailUser: res.data.emailUser || prev.emailUser,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyUpi = () => {
    if (paymentConfig.upiId) {
      navigator.clipboard.writeText(paymentConfig.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

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
    const handleCopyOrderId = () => {
      if (placedOrder.orderNumber) {
        navigator.clipboard.writeText(placedOrder.orderNumber);
        setCopiedOrderId(true);
        setTimeout(() => setCopiedOrderId(false), 2500);
      }
    };

    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-6 relative">
        {/* "Check Your Mail" Modal Popup right after email is dispatched or pending setup */}
        {showEmailPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 text-center space-y-5 animate-scale-up relative">
              {/* Dismiss X */}
              <button
                type="button"
                onClick={() => setShowEmailPopup(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                title="Close Pop-up"
              >
                ✕
              </button>

              {paymentConfig.emailConfigured ? (
                <>
                  {/* Animated Mail Icon with Notification Beacon */}
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-maroon-700 via-maroon-800 to-amber-600 text-white flex items-center justify-center shadow-xl shadow-maroon-900/25">
                      <Mail className="w-10 h-10 animate-pulse" />
                    </div>
                    <span className="absolute top-0 right-0 flex h-6 w-6">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                        ✓
                      </span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Order Placed &bull; Email Sent
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                      Check Your Mail!
                    </h2>
                    <p className="text-xs text-stone-600 leading-relaxed font-light">
                      An order placement acknowledgement with complete PhonePe / Google Pay payment details has just been dispatched to:
                    </p>
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 font-mono text-xs font-bold text-maroon-900 break-all select-all shadow-inner">
                      {placedOrder.customerEmail}
                    </div>
                  </div>

                  {/* Spam/Promotions notice */}
                  <div className="p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200 text-left text-xs text-stone-700 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950">
                      <Info className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Important: Check Spam / Promotions Folder</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      If the email does not appear in your Primary Inbox within 1-2 minutes, please check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder. Marking it as <em>"Not Spam"</em> ensures you receive future payment verification and dispatch tracking updates.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Setup Notice Icon */}
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-center shadow-xl shadow-amber-900/25">
                      <Mail className="w-10 h-10" />
                    </div>
                    <span className="absolute top-0 right-0 flex h-6 w-6">
                      <span className="relative inline-flex rounded-full h-6 w-6 bg-amber-500 border-2 border-white flex items-center justify-center text-[11px] text-white font-bold">
                        !
                      </span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-100 text-amber-900 border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      Order Placed &bull; Email Setup Pending
                    </span>
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                      Order Placed!
                    </h2>
                    <p className="text-xs text-stone-600 leading-relaxed font-light">
                      Your order reference <strong>#{placedOrder.orderNumber}</strong> has been registered. Please complete payment using the store UPI details shown below.
                    </p>
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 font-mono text-xs font-bold text-stone-700 break-all select-all shadow-inner">
                      Recipient: {placedOrder.customerEmail}
                    </div>
                  </div>

                  {/* Missing EMAIL_PASS notice */}
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 text-left text-xs text-stone-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Live Gmail Delivery Pending Setup</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Server <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-950">.env</code> is missing <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-950">EMAIL_PASS</code> for <strong>{paymentConfig.emailUser || 'sih7952@gmail.com'}</strong>.
                    </p>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      To receive live emails in your inbox, generate a 16-character <strong>Google App Password</strong> and paste it into <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-950">backend/.env</code>.
                    </p>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => setShowEmailPopup(false)}
                className="w-full py-3.5 px-6 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-semibold tracking-widest uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>View Payment Instructions</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Top Notification Banner */}
        {paymentConfig.emailConfigured ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-emerald-900">
                  Check Your Mail! Acknowledgement sent to {placedOrder.customerEmail}
                </p>
                <p className="text-[11px] text-emerald-700">
                  Please check your inbox (and spam/promotions folder) for your order record and UPI transfer guide.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEmailPopup(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] tracking-wider uppercase transition-colors shrink-0"
            >
              Reopen Notice
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-100/70 border border-amber-300 text-amber-950 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-amber-950">
                  Order Registered! Live Email Pending Configuration
                </p>
                <p className="text-[11px] text-amber-800">
                  To send live confirmation emails to {placedOrder.customerEmail}, configure EMAIL_PASS in backend/.env.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEmailPopup(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-[11px] tracking-wider uppercase transition-colors shrink-0"
            >
              View Email Setup
            </button>
          </div>
        )}

        <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-widest text-emerald-800 bg-emerald-100/80 uppercase">
            <Clock className="w-3.5 h-3.5" />
            Order Placed – Awaiting Payment Verification
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Thank You, {placedOrder.shippingAddress?.fullName || 'Valued Patron'}!
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-light max-w-xl mx-auto leading-relaxed">
            Your handcrafted saree order has been placed. An order acknowledgement email has been sent to{' '}
            <strong className="text-stone-900 font-medium">{placedOrder.customerEmail}</strong>.
          </p>
        </div>

        {/* Step-by-Step Payment Notice Card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 rounded-2xl border border-amber-200 text-left space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Smartphone className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-stone-900 text-sm sm:text-base">
                Next Step: Transfer {formatINR(placedOrder.totalAmount)} via PhonePe or Google Pay
              </h3>
              <p className="text-xs text-stone-700 leading-relaxed">
                Please make a manual UPI transfer of the exact order total to complete your order. Once our team verifies receipt in our bank account, your order will be confirmed and prepared for insured dispatch.
              </p>
            </div>
          </div>

          <div className="p-4 bg-white/90 rounded-xl border border-amber-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                Store UPI ID (PhonePe / Google Pay)
              </span>
              {paymentConfig.upiId ? (
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy UPI ID</span>
                    </>
                  )}
                </button>
              ) : null}
            </div>

            {paymentConfig.upiId ? (
              <div className="flex items-center justify-between bg-stone-50 p-3 rounded-lg border border-stone-200">
                <span className="font-mono font-bold text-maroon-900 text-sm sm:text-base break-all">
                  {paymentConfig.upiId}
                </span>
                <span className="text-[11px] font-semibold text-stone-500 ml-2 shrink-0">
                  ({paymentConfig.upiName})
                </span>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-300 text-amber-900 text-xs">
                <strong>Store UPI details:</strong> Please contact store support at{' '}
                <a href={`mailto:${paymentConfig.supportEmail}`} className="underline font-semibold">
                  {paymentConfig.supportEmail}
                </a>{' '}
                for the direct transfer UPI ID.
              </div>
            )}

            {paymentConfig.upiQrUrl && (
              <div className="text-center pt-2">
                <p className="text-xs font-medium text-stone-600 mb-2">Or scan QR code to pay:</p>
                <img
                  src={paymentConfig.upiQrUrl}
                  alt="UPI Payment QR"
                  className="w-48 h-48 mx-auto object-contain rounded-lg border border-stone-300 bg-white p-2 shadow-sm"
                />
              </div>
            )}

            <div className="text-[11px] text-stone-600 space-y-1 pt-1 border-t border-amber-100">
              <p className="flex items-center gap-1.5 text-amber-900 font-medium">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Please use Order Reference <strong>{placedOrder.orderNumber}</strong> in your payment remarks/note.
                </span>
              </p>
              <p className="text-stone-500">
                • Placing an order does not mean payment has been received or verified.
              </p>
              <p className="text-stone-500">
                • Our administrator will check the bank transfer and send an official confirmation email upon verification.
              </p>
            </div>
          </div>
        </div>

        {/* Order Details Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm text-left space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <span className="text-stone-500">Order Reference</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-stone-900 text-sm">
                {placedOrder.orderNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyOrderId}
                className="p-1 rounded text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                title="Copy Order ID"
              >
                {copiedOrderId ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <span className="text-stone-500">Order Status</span>
            <span className="font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {placedOrder.orderStatus || 'Placed (Awaiting Admin Confirmation)'}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <span className="text-stone-500">Payment Status</span>
            <span className="font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Pending Verification
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <span className="text-stone-500">Payment Method</span>
            <span className="font-semibold text-stone-800">
              Transfer via PhonePe / Google Pay
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <span className="text-stone-500">Total Order Amount</span>
            <span className="font-serif font-bold text-maroon-800 text-base">
              {formatINR(placedOrder.totalAmount)}
            </span>
          </div>

          {/* Delivery Address */}
          <div className="pt-1 space-y-1">
            <span className="text-stone-500 block font-medium">Delivering To:</span>
            <p className="font-medium text-stone-800">
              {placedOrder.shippingAddress?.fullName} ({placedOrder.shippingAddress?.phone})
            </p>
            <p className="text-stone-600">
              {placedOrder.customerEmail}
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
      !address.email.trim() ||
      !address.addressLine.trim() ||
      !address.city.trim() ||
      !address.state.trim() ||
      !address.pincode.trim()
    ) {
      setError('Please fill in all required delivery address fields (including email).');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(address.email.trim())) {
      setError('Please enter a valid email address so we can send your order confirmation.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const idempotencyKey = `ord_idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const orderPayload = {
      idempotencyKey,
      isBuyNow: isDirectBuyNow,
      fromCart: !isDirectBuyNow,
      customerEmail: address.email.trim(),
      items: activeItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      })),
      shippingAddress: {
        fullName: address.fullName.trim(),
        phone: address.phone.trim(),
        email: address.email.trim(),
        addressLine: address.addressLine.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
        deliveryInstructions: address.deliveryInstructions?.trim() || '',
      },
      paymentMethod: 'PhonePe / Google Pay',
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
        setShowEmailPopup(true);
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
                  Email Address (for Order Updates & Confirmation) *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={address.email}
                  onChange={handleInputChange}
                  placeholder="e.g. radhika@example.com"
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

          {/* Section 2: Payment Method - Manual UPI Transfer (PhonePe / Google Pay) */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h2 className="font-serif text-lg font-bold text-stone-900">
                2. Payment Method
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Manual UPI Transfer
              </span>
            </div>

            {/* Selected Payment Option: Transfer via PhonePe / Google Pay */}
            <div className="p-5 rounded-2xl border-2 border-maroon-700 bg-gradient-to-br from-stone-50 via-white to-amber-50/20 space-y-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-maroon-50 border border-maroon-200 flex items-center justify-center text-maroon-700 shrink-0 shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif font-bold text-stone-900 text-sm sm:text-base">
                      Transfer via PhonePe / Google Pay
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-maroon-100 text-maroon-900 uppercase tracking-wider">
                      Active Method
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    Transfer the order amount securely using PhonePe, Google Pay, or any UPI app.
                  </p>
                </div>
              </div>

              {/* UPI ID Details Box */}
              <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    Store UPI ID for Payment
                  </span>
                  {paymentConfig.upiId && (
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy UPI ID</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {paymentConfig.upiId ? (
                  <div className="flex items-center justify-between bg-stone-50 p-3 rounded-lg border border-stone-200">
                    <div>
                      <span className="font-mono font-bold text-maroon-900 text-sm sm:text-base">
                        {paymentConfig.upiId}
                      </span>
                      <span className="block text-[11px] text-stone-500 mt-0.5">
                        Recipient: {paymentConfig.upiName}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-300 text-amber-900 text-xs">
                    <strong>UPI Configuration Notice:</strong> Store owner UPI ID is being configured. You may place the order now, and our team will provide payment transfer details directly or via order email.
                  </div>
                )}

                {paymentConfig.upiQrUrl && (
                  <div className="text-center pt-2">
                    <p className="text-xs font-medium text-stone-600 mb-2">Scan to Pay via Any UPI App:</p>
                    <img
                      src={paymentConfig.upiQrUrl}
                      alt="Store UPI QR Code"
                      className="w-44 h-44 mx-auto object-contain rounded-lg border border-stone-200 bg-white p-2 shadow-xs"
                    />
                  </div>
                )}
              </div>

              {/* Crucial notices as specified in requirements */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-stone-700 text-xs space-y-1.5 leading-relaxed">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Important Payment & Confirmation Notice:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-stone-600 text-[11px]">
                  <li>
                    Customers must transfer the displayed order amount (<strong>{formatINR(finalTotal)}</strong>) through <strong>PhonePe</strong> or <strong>Google Pay</strong>.
                  </li>
                  <li>
                    <strong>Placing an order does not mean the payment has been received or verified.</strong>
                  </li>
                  <li>
                    The order will be confirmed by the admin after payment is received and verified in our bank account.
                  </li>
                </ul>
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
                    <span>Place Order</span>
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
                <span>Manual PhonePe / Google Pay Transfer</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
