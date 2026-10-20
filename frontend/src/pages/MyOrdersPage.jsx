import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../services/orderService';
import { formatINR } from '../utils/formatCurrency';
import {
  Package,
  MapPin,
  ArrowRight,
  Loader2,
  RefreshCw,
  ShoppingBag,
  XCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Truck,
} from 'lucide-react';

export const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancellation Modal State
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getMyOrders();
      if (response.success && response.data) {
        setOrders(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      const response = await orderService.cancelOrder(cancellingOrder._id);
      if (response.success && response.data) {
        // Update local orders list immediately
        setOrders((prev) =>
          prev.map((o) => (o._id === cancellingOrder._id ? response.data : o))
        );
        setCancellingOrder(null);
      }
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel order.');
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Confirmed':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Placed':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-[0.25em] text-gold-700 uppercase">
            Order Sanctuary
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight mt-1">
            My Orders & Handloom Drapes
          </h1>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-stone-500">
          <Loader2 className="w-8 h-8 text-maroon-700 animate-spin mb-3" />
          <p className="text-sm font-medium">Retrieving your order records...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchOrders} className="underline font-bold">Retry</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-xl font-bold text-stone-900">
            No Orders Placed Yet
          </h3>
          <p className="text-xs text-stone-500 font-light leading-relaxed">
            When you purchase our handcrafted Kanjeevaram and Banarasi sarees, your orders and delivery tracking will appear here.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-md"
          >
            <span>Browse Saree Boutique</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            const canCancel = ['Placed', 'Confirmed'].includes(order.orderStatus);

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-5 sm:p-6 bg-stone-50/70 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">
                        Order Number
                      </span>
                      <span className="font-mono font-bold text-stone-900">
                        {order.orderNumber}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">
                        Placed On
                      </span>
                      <span className="font-medium text-stone-800">{formattedDate}</span>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">
                        Total Amount
                      </span>
                      <span className="font-serif font-bold text-maroon-800 text-sm">
                        {formatINR(order.totalAmount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">
                        Payment Status
                      </span>
                      <span className={`font-semibold ${order.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {order.paymentStatus} ({order.paymentMethod})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                        order.orderStatus
                      )}`}
                    >
                      {order.orderStatus || 'Placed'}
                    </span>

                    {/* Customer Cancellation Action */}
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setCancellingOrder(order)}
                        className="px-3 py-1 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>

                {/* Items in Order */}
                <div className="p-5 sm:p-6 divide-y divide-stone-100">
                  {order.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-16 h-20 rounded-lg object-cover border border-stone-200 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-20 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-6 h-6 text-stone-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-serif font-bold text-stone-900 truncate">
                            {item.title}
                          </h4>
                          <span className="text-[11px] text-stone-500 font-mono">
                            SKU: {item.sku} • Qty: {item.quantity}
                          </span>
                        </div>
                      </div>

                      <span className="font-serif font-bold text-stone-900 text-sm shrink-0">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Shipping & Instructions Footer */}
                <div className="p-5 sm:p-6 bg-stone-50/40 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                    <span>
                      Shipping to: <strong className="text-stone-800">{order.shippingAddress?.fullName}</strong>,{' '}
                      {order.shippingAddress?.addressLine}, {order.shippingAddress?.city}, {order.shippingAddress?.state} ({order.shippingAddress?.pincode})
                    </span>
                  </div>

                  {order.shippingAddress?.deliveryInstructions && (
                    <div className="w-full text-stone-500 italic pl-6 text-[11px]">
                      Delivery Instructions: "{order.shippingAddress.deliveryInstructions}"
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Cancel Order {cancellingOrder.orderNumber}?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed font-light">
                Are you sure you wish to cancel this handcrafted saree order? The reserved inventory will be automatically restored to our boutique atelier.
              </p>
            </div>

            {cancelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {cancelError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                disabled={cancelLoading}
                className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
              >
                Keep Order
              </button>

              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelLoading}
                className="py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2"
              >
                {cancelLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Confirm Cancel</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
