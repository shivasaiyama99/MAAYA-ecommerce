import React, { useState, useEffect, useCallback } from 'react';
import orderService from '../../services/orderService';
import { formatINR } from '../../utils/formatCurrency';
import {
  Package,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
  Loader2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Banknote,
  DollarSign,
  TrendingUp,
  Mail,
  Send,
  ShieldCheck,
  CheckSquare,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

const ALLOWED_STATUS_TRANSITIONS = {
  Placed: ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

export const AdminOrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    placedOrders: 0,
    confirmedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status Update Modal State (Shipped, Delivered, Cancelled)
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Dedicated "Confirm Order & Send Email" Modal State
  const [confirmingOrder, setConfirmingOrder] = useState(null);
  const [paymentVerifiedCheckbox, setPaymentVerifiedCheckbox] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [confirmSuccessMessage, setConfirmSuccessMessage] = useState(null);
  const [emailSuccessModal, setEmailSuccessModal] = useState(null);

  // Resend Email State
  const [resendingEmailId, setResendingEmailId] = useState(null);

  // Detail Modal State
  const [detailOrder, setDetailOrder] = useState(null);

  const fetchOrders = useCallback(async (pageToLoad = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getAdminOrders({
        status: selectedStatus === 'all' ? '' : selectedStatus,
        search: searchQuery.trim(),
        page: pageToLoad,
        limit: pagination.limit,
      });

      if (response.success && response.data) {
        setOrders(response.data.orders || []);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve orders.');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, searchQuery, pagination.limit]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders(1);
  };

  // Handle standard status update
  const handleStatusUpdate = async () => {
    if (!updatingOrder || !newStatus) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const response = await orderService.updateOrderStatus(
        updatingOrder._id,
        newStatus,
        false
      );
      if (response.success) {
        setUpdatingOrder(null);
        fetchOrders(pagination.page);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to update order status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Payment Status Toggle
  const handlePaymentStatusToggle = async (order, targetStatus) => {
    try {
      const response = await orderService.updateOrderPayment(order._id, targetStatus);
      if (response.success) {
        fetchOrders(pagination.page);
      }
    } catch (err) {
      alert(err.message || 'Failed to update payment status.');
    }
  };

  // Open "Confirm Order & Send Email" Modal
  const openConfirmModal = (order) => {
    setConfirmingOrder(order);
    setPaymentVerifiedCheckbox(false);
    setAdminNotes('');
    setConfirmError(null);
  };

  // Submit Payment Verification & Confirm Order
  const handleConfirmOrder = async () => {
    if (!confirmingOrder) return;
    if (!paymentVerifiedCheckbox) {
      setConfirmError('You must check the box confirming receipt and verification of the UPI transfer.');
      return;
    }

    setConfirmSubmitting(true);
    setConfirmError(null);

    try {
      const response = await orderService.confirmOrder(
        confirmingOrder._id,
        true,
        adminNotes.trim()
      );

      if (response.success) {
        const isEmailSent = Boolean(response.data?.confirmationEmailSent);
        if (isEmailSent) {
          setEmailSuccessModal({
            orderNumber: confirmingOrder.orderNumber,
            customerEmail: confirmingOrder.customerEmail,
            title: 'Order Confirmed & Email Dispatched!',
            message: `The official order confirmation email was dispatched from sih7952@gmail.com to:`,
            note: 'Customer has been notified that payment was verified. Advise customer to check their Inbox or Spam / Promotions folder.',
            isWarning: false,
          });
          setConfirmSuccessMessage(
            `Order ${confirmingOrder.orderNumber} successfully confirmed and confirmation email sent!`
          );
        } else {
          setEmailSuccessModal({
            orderNumber: confirmingOrder.orderNumber,
            customerEmail: confirmingOrder.customerEmail,
            title: 'Order Confirmed (Email Pending Setup)',
            message: `Order was confirmed and marked as Paid. However, live email delivery could not be completed: ${response.data?.confirmationEmailError || 'EMAIL_PASS is not configured in backend/.env'}.`,
            note: 'To send live emails to customers, configure a 16-character Google App Password in backend/.env (EMAIL_PASS) and click "Retry" in the orders list.',
            isWarning: true,
          });
          setConfirmSuccessMessage(
            `Order ${confirmingOrder.orderNumber} confirmed. ⚠️ Live email delivery pending setup.`
          );
        }
        setTimeout(() => setConfirmSuccessMessage(null), 5000);
        setConfirmingOrder(null);
        fetchOrders(pagination.page);
      }
    } catch (err) {
      setConfirmError(err.message || 'Failed to confirm order.');
    } finally {
      setConfirmSubmitting(false);
    }
  };

  // Handle Safe Resend Email
  const handleResendEmail = async (orderId, type = 'confirmation') => {
    setResendingEmailId(orderId);
    try {
      const res = await orderService.resendOrderEmail(orderId, type);
      if (res.success) {
        const targetOrder = orders.find((o) => o._id === orderId) || detailOrder;
        setEmailSuccessModal({
          orderNumber: targetOrder?.orderNumber || 'Order',
          customerEmail: targetOrder?.customerEmail || 'Customer',
          title: 'Email Notification Sent!',
          message: `${type === 'confirmation' ? 'Order confirmation' : 'Order placement acknowledgement'} email dispatched from sih7952@gmail.com to:`,
          note: 'Please advise the recipient to check their Inbox or Spam / Promotions folder.',
          isWarning: false,
        });
        fetchOrders(pagination.page);
        if (detailOrder && detailOrder._id === orderId) {
          // Refresh detail modal view
          setDetailOrder((prev) => ({
            ...prev,
            confirmationEmailSent: type === 'confirmation' ? true : prev.confirmationEmailSent,
            placementEmailSent: type === 'placement' ? true : prev.placementEmailSent,
          }));
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to resend email.';
      alert(`Could not send email: ${errMsg}\n\nNote: If EMAIL_PASS is empty in backend/.env, please add a 16-character Google App Password.`);
    } finally {
      setResendingEmailId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Shipped':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Confirmed':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Placed':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {confirmSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{confirmSuccessMessage}</span>
          </div>
          <button
            onClick={() => setConfirmSuccessMessage(null)}
            className="text-emerald-700 font-bold hover:text-emerald-950"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">
            Total Orders
          </span>
          <div className="text-2xl font-serif font-bold text-stone-900">
            {stats.totalOrders}
          </div>
          <p className="text-[10px] text-stone-500">All customer bookings</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm space-y-1">
          <span className="text-[10px] font-bold tracking-wider text-amber-800 uppercase">
            Placed (Pending)
          </span>
          <div className="text-2xl font-serif font-bold text-amber-900">
            {stats.placedOrders}
          </div>
          <p className="text-[10px] text-amber-700">Awaiting payment verification</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm space-y-1">
          <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
            Confirmed
          </span>
          <div className="text-2xl font-serif font-bold text-emerald-900">
            {stats.confirmedOrders}
          </div>
          <p className="text-[10px] text-emerald-700">Payment verified</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-sm space-y-1">
          <span className="text-[10px] font-bold tracking-wider text-blue-700 uppercase">
            In Transit / Shipped
          </span>
          <div className="text-2xl font-serif font-bold text-blue-900">
            {stats.shippedOrders}
          </div>
          <p className="text-[10px] text-blue-600">With courier partners</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-2xl border border-gold-200 bg-gold-50/20 shadow-sm space-y-1">
          <span className="text-[10px] font-bold tracking-wider text-gold-800 uppercase">
            Total Revenue
          </span>
          <div className="text-xl font-serif font-bold text-maroon-800 truncate">
            {formatINR(stats.totalRevenue)}
          </div>
          <p className="text-[10px] text-gold-700">Non-cancelled orders</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order number, customer name, email, or phone..."
            className="block w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-maroon-600"
          />
        </form>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span className="font-semibold text-stone-700 hidden sm:inline">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-maroon-600"
            >
              <option value="all">All Statuses</option>
              <option value="Placed">Placed (Pending Verification)</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <button
            onClick={() => fetchOrders(pagination.page)}
            disabled={loading}
            className="p-2 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-stone-500">
            <Loader2 className="w-8 h-8 text-maroon-700 animate-spin mb-2" />
            <p className="text-xs font-medium">Loading customer orders...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-700 space-y-2">
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={() => fetchOrders(1)}
              className="text-xs underline font-bold"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Package className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="font-serif text-base font-bold text-stone-800">
              No Orders Found
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto font-light">
              No orders matched your active filter or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-stone-100">
              <thead className="bg-stone-50/80 text-stone-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Order / Date</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Saree Items</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Email Status</th>
                  <th className="px-5 py-3.5">Order Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {orders.map((order) => {
                  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[order.orderStatus] || [];
                  const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  const isPendingConfirmation = order.orderStatus === 'Placed';

                  return (
                    <tr key={order._id} className="hover:bg-stone-50/60 transition-colors">
                      {/* Order Number & Date */}
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-stone-900 block">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          {dateStr}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="px-5 py-4">
                        <span className="font-medium text-stone-900 block">
                          {order.shippingAddress?.fullName || 'Customer'}
                        </span>
                        <span className="text-[11px] text-stone-600 block truncate max-w-[160px]">
                          {order.customerEmail || order.shippingAddress?.email}
                        </span>
                        <span className="text-[10px] text-stone-400 block">
                          {order.shippingAddress?.phone} • {order.shippingAddress?.city}
                        </span>
                      </td>

                      {/* Items Preview */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {order.items?.[0]?.image && (
                            <img
                              src={order.items[0].image}
                              alt={order.items[0].title}
                              className="w-8 h-10 object-cover rounded border border-stone-200 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <span className="font-serif font-semibold text-stone-900 truncate block max-w-[150px]">
                              {order.items?.[0]?.title}
                            </span>
                            <span className="text-[10px] text-stone-500">
                              {order.items?.length === 1
                                ? `Qty: ${order.items[0].quantity}`
                                : `+${order.items.length - 1} more drape(s)`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-5 py-4 font-serif font-bold text-maroon-800 text-sm whitespace-nowrap">
                        {formatINR(order.totalAmount)}
                      </td>

                      {/* Payment Method & Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-semibold text-stone-800 block text-[11px]">
                          {order.paymentMethod === 'PhonePe / Google Pay'
                            ? 'PhonePe / GPay'
                            : order.paymentMethod}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                          {order.paymentVerified && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title="Payment verified by store admin">
                              <ShieldCheck className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Email Notification Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {order.orderStatus === 'Placed' ? (
                            order.placementEmailSent ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                                  <Mail className="w-3 h-3 text-emerald-600" />
                                  Order Ack Sent
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleResendEmail(order._id, 'placement')}
                                  disabled={resendingEmailId === order._id}
                                  className="text-[10px] text-maroon-700 underline font-semibold hover:text-maroon-900"
                                  title="Resend Placement Ack Email to Customer"
                                >
                                  {resendingEmailId === order._id ? 'Sending...' : 'Resend'}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  Ack Pending
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleResendEmail(order._id, 'placement')}
                                  disabled={resendingEmailId === order._id}
                                  className="text-[10px] text-maroon-700 underline font-semibold hover:text-maroon-900"
                                  title="Resend Placement Ack Email"
                                >
                                  {resendingEmailId === order._id ? 'Sending...' : 'Retry'}
                                </button>
                              </div>
                            )
                          ) : (
                            order.confirmationEmailSent ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Confirmed Email Sent
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleResendEmail(order._id, 'confirmation')}
                                  disabled={resendingEmailId === order._id}
                                  className="text-[10px] text-maroon-700 underline font-semibold hover:text-maroon-900"
                                  title="Resend Confirmation Email to Customer"
                                >
                                  {resendingEmailId === order._id ? 'Sending...' : 'Resend'}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 cursor-help"
                                  title={order.confirmationEmailError || 'EMAIL_PASS is not configured in backend/.env'}
                                >
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  Email Pending
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleResendEmail(order._id, 'confirmation')}
                                  disabled={resendingEmailId === order._id}
                                  className="text-[10px] text-maroon-700 underline font-semibold hover:text-maroon-900"
                                  title="Retry Dispatching Confirmation Email"
                                >
                                  Retry
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </td>

                      {/* Order Status Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                            order.orderStatus
                          )}`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                        {/* View Full Details */}
                        <button
                          type="button"
                          onClick={() => setDetailOrder(order)}
                          className="p-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700"
                          title="View Order Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Dedicated "Confirm Order & Send Email" button for Placed orders */}
                        {isPendingConfirmation ? (
                          <button
                            type="button"
                            onClick={() => openConfirmModal(order)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] tracking-wider uppercase transition-colors shadow-xs inline-flex items-center gap-1.5"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Confirm & Email</span>
                          </button>
                        ) : allowedTransitions.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setUpdatingOrder(order);
                              setNewStatus(allowedTransitions[0]);
                              setActionError(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-maroon-700 hover:bg-maroon-800 text-white font-semibold text-[11px] tracking-wider uppercase transition-colors"
                          >
                            Update Status
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-stone-50/60 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
            <span>
              Showing {orders.length} of {pagination.total} orders
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchOrders(pagination.page - 1)}
                disabled={!pagination.hasPrevPage || loading}
                className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="font-semibold text-stone-800">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => fetchOrders(pagination.page + 1)}
                disabled={!pagination.hasNextPage || loading}
                className="p-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated Payment Verification & Order Confirmation Modal */}
      {confirmingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block">
                  Step 1: Admin Payment Verification
                </span>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Confirm Order & Send Customer Email
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmingOrder(null)}
                className="text-stone-400 hover:text-stone-700 font-bold text-base"
              >
                ✕
              </button>
            </div>

            {/* Order Overview Snapshot */}
            <div className="bg-stone-50 p-4 rounded-xl space-y-2 border border-stone-200">
              <div className="flex justify-between">
                <span className="text-stone-500">Order Reference:</span>
                <span className="font-mono font-bold text-stone-900">
                  {confirmingOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Customer:</span>
                <span className="font-medium text-stone-900">
                  {confirmingOrder.shippingAddress?.fullName} ({confirmingOrder.customerEmail})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Phone:</span>
                <span className="font-mono text-stone-900">
                  {confirmingOrder.shippingAddress?.phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment Method:</span>
                <span className="font-semibold text-stone-900">
                  {confirmingOrder.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2 text-sm">
                <span className="font-bold text-stone-800">Total Order Amount:</span>
                <span className="font-serif font-bold text-maroon-800">
                  {formatINR(confirmingOrder.totalAmount)}
                </span>
              </div>
            </div>

            {/* Items Snapshot */}
            <div className="space-y-1.5">
              <span className="text-stone-500 font-bold uppercase text-[10px] block">
                Order Items ({confirmingOrder.items?.length || 0}):
              </span>
              <div className="divide-y divide-stone-100 max-h-36 overflow-y-auto bg-stone-50/60 p-2 rounded-lg">
                {confirmingOrder.items?.map((item, idx) => (
                  <div key={idx} className="py-1 flex justify-between items-center text-[11px]">
                    <span className="truncate max-w-[240px] font-medium text-stone-800">
                      {item.title} (x{item.quantity})
                    </span>
                    <span className="font-semibold text-stone-700">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Crucial Verification Requirement Checkbox */}
            <div className="p-4 bg-amber-50/80 rounded-xl border-2 border-amber-300 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-950 text-xs">
                    Mandatory UPI Verification Check
                  </h4>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Check your PhonePe / Google Pay / Bank Statement to verify that the customer has transferred exactly{' '}
                    <strong>{formatINR(confirmingOrder.totalAmount)}</strong> for Order #{confirmingOrder.orderNumber}.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 p-3 rounded-lg bg-white border border-amber-300 cursor-pointer hover:bg-amber-50/30 transition-colors">
                <input
                  type="checkbox"
                  checked={paymentVerifiedCheckbox}
                  onChange={(e) => {
                    setPaymentVerifiedCheckbox(e.target.checked);
                    if (confirmError) setConfirmError(null);
                  }}
                  className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                />
                <span className="text-xs font-semibold text-stone-900 leading-snug">
                  I explicitly confirm that I have checked our bank / UPI statement and verified that the full payment of {formatINR(confirmingOrder.totalAmount)} has been received.
                </span>
              </label>
            </div>

            {/* Optional Admin Notes (e.g., UTR / Transaction ID) */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Admin Notes / UPI UTR / Transaction Reference (Optional):
              </label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. UPI Ref #402319876523 received in Kotak/SBI"
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-maroon-600"
              />
            </div>

            {confirmError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{confirmError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingOrder(null)}
                disabled={confirmSubmitting}
                className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={confirmSubmitting || !paymentVerifiedCheckbox}
                className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {confirmSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Confirming & Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm & Send Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Transition Modal (for Shipped, Delivered, Cancelled) */}
      {updatingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-2">
              Update Status for {updatingOrder.orderNumber}
            </h3>

            <div className="text-xs space-y-1">
              <span className="text-stone-500">Current Order Status:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold block w-fit border ${getStatusBadge(updatingOrder.orderStatus)}`}>
                {updatingOrder.orderStatus}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Select Allowed Next Status:
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-maroon-600"
              >
                {(ALLOWED_STATUS_TRANSITIONS[updatingOrder.orderStatus] || []).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {newStatus === 'Cancelled' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                ⚠️ Cancelling this order will automatically restore reserved saree inventory back to the active catalog.
              </div>
            )}

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {actionError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUpdatingOrder(null)}
                disabled={actionLoading}
                className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
              >
                Dismiss
              </button>

              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={actionLoading || !newStatus}
                className="py-2.5 px-4 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Apply Status</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Order Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-stone-200 space-y-5 text-xs">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase">
                  Order Details
                </span>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  {detailOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="text-stone-400 hover:text-stone-700 font-bold text-base"
              >
                ✕
              </button>
            </div>

            {/* Status & Verification Badges */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl">
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">
                  Order Status
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold inline-block mt-0.5 border ${getStatusBadge(detailOrder.orderStatus)}`}>
                  {detailOrder.orderStatus}
                </span>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">
                  Payment Status
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold inline-block mt-0.5 ${
                  detailOrder.paymentStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {detailOrder.paymentStatus} {detailOrder.paymentVerified ? '(Verified)' : ''}
                </span>
              </div>
            </div>

            {/* Email Dispatch Info */}
            <div className="p-3 bg-stone-50 rounded-xl space-y-2 border border-stone-200">
              <span className="text-stone-500 font-bold uppercase text-[10px] block">
                Email Dispatch Details:
              </span>
              <div className="flex justify-between items-center">
                <span>Placement Ack Email:</span>
                <span className={detailOrder.placementEmailSent ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                  {detailOrder.placementEmailSent ? 'Sent' : 'Pending / Failed'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Confirmation Email:</span>
                <span className={detailOrder.confirmationEmailSent ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                  {detailOrder.confirmationEmailSent ? 'Sent' : 'Not Sent Yet'}
                </span>
              </div>
              {detailOrder.confirmedAt && (
                <div className="text-[10px] text-stone-500 border-t border-stone-200 pt-1">
                  Confirmed on: {new Date(detailOrder.confirmedAt).toLocaleString()}
                </div>
              )}
              {detailOrder.adminNotes && (
                <div className="text-[10px] text-stone-600 bg-white p-2 rounded border border-stone-200">
                  <strong>Admin Note:</strong> {detailOrder.adminNotes}
                </div>
              )}
            </div>

            {/* Delivery Address & Instructions */}
            <div className="p-4 rounded-xl bg-stone-50 space-y-1">
              <span className="text-stone-500 font-bold uppercase text-[10px] block">
                Shipping Destination:
              </span>
              <p className="font-semibold text-stone-900">
                {detailOrder.shippingAddress?.fullName} ({detailOrder.shippingAddress?.phone})
              </p>
              <p className="text-stone-600 font-mono text-[11px]">
                {detailOrder.customerEmail}
              </p>
              <p className="text-stone-600">
                {detailOrder.shippingAddress?.addressLine}, {detailOrder.shippingAddress?.city},{' '}
                {detailOrder.shippingAddress?.state} - {detailOrder.shippingAddress?.pincode}
              </p>
              {detailOrder.shippingAddress?.deliveryInstructions && (
                <p className="text-stone-500 italic pt-1">
                  Instructions: "{detailOrder.shippingAddress.deliveryInstructions}"
                </p>
              )}
            </div>

            {/* Items Breakdown */}
            <div className="space-y-3">
              <span className="text-stone-500 font-bold uppercase text-[10px] block">
                Purchased Sarees:
              </span>
              <div className="divide-y divide-stone-100">
                {detailOrder.items?.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-10 h-12 object-cover rounded border border-stone-200 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-serif font-semibold text-stone-900 truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-stone-500 font-mono">
                          SKU: {item.sku} • Qty: {item.quantity} × {formatINR(item.price)}
                        </p>
                      </div>
                    </div>
                    <span className="font-serif font-bold text-stone-900 shrink-0">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-3 border-t border-stone-100 space-y-1 text-right">
              <div className="text-stone-500">
                Subtotal: <strong>{formatINR(detailOrder.subtotal || detailOrder.totalAmount)}</strong>
              </div>
              <div className="text-stone-500">
                Shipping: <strong>FREE PAN-INDIA</strong>
              </div>
              <div className="font-serif font-bold text-base text-maroon-800">
                Total Amount: {formatINR(detailOrder.totalAmount)}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleResendEmail(detailOrder._id, 'confirmation')}
                disabled={resendingEmailId === detailOrder._id}
                className="flex-1 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resend Conf Email</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white font-semibold text-xs tracking-wider uppercase hover:bg-stone-800 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "Email Sent / Check Your Mail" Pop-up Modal */}
      {emailSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 text-center space-y-4 animate-scale-up relative">
            <button
              type="button"
              onClick={() => setEmailSuccessModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              title="Close"
            >
              ✕
            </button>

            <div className="relative w-16 h-16 mx-auto">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md ${
                  emailSuccessModal.isWarning
                    ? 'bg-amber-100 border border-amber-300 text-amber-700'
                    : 'bg-emerald-100 border border-emerald-300 text-emerald-700'
                }`}
              >
                {emailSuccessModal.isWarning ? (
                  <AlertTriangle className="w-8 h-8" />
                ) : (
                  <Mail className="w-8 h-8 animate-pulse" />
                )}
              </div>
              <span className="absolute top-0 right-0 flex h-5 w-5">
                {emailSuccessModal.isWarning ? (
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                    !
                  </span>
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-600 border-2 border-white flex items-center justify-center text-[9px] text-white font-bold">
                      ✓
                    </span>
                  </>
                )}
              </span>
            </div>

            <div className="space-y-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase border ${
                  emailSuccessModal.isWarning
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {emailSuccessModal.isWarning
                  ? 'Setup Pending • Email Not Dispatched'
                  : 'Email Dispatched Successfully'}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                {emailSuccessModal.title}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed font-light">
                {emailSuccessModal.message}
              </p>
              <p className="font-mono font-bold text-xs text-maroon-900 bg-stone-50 p-2.5 rounded-xl border border-stone-200 break-all select-all shadow-inner">
                {emailSuccessModal.customerEmail}
              </p>
            </div>

            <div className="p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200/90 text-left text-xs text-stone-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Notice: {emailSuccessModal.isWarning ? 'Email Setup Required' : 'Advise Customer to Check Mail'}</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                {emailSuccessModal.note}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEmailSuccessModal(null)}
              className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs tracking-wider uppercase transition-colors"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersTab;
