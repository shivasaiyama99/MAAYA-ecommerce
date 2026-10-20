import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import productService from '../services/productService';
import { formatINR } from '../utils/formatCurrency';
import ProductFormModal from '../components/admin/ProductFormModal';
import ProductPreviewModal from '../components/admin/ProductPreviewModal';
import DeleteConfirmModal from '../components/admin/DeleteConfirmModal';
import AdminOrdersTab from '../components/admin/AdminOrdersTab';
import {
  Package,
  Layers,
  Archive,
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

const CATEGORIES = [
  'All Categories',
  'Silk',
  'Cotton',
  'Banarasi',
  'Kanjivaram',
  'Designer',
  'Chanderi',
  'Organza',
  'Other',
];

export const AdminDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');

  // Product Catalog State
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeListings: 0,
    totalStock: 0,
    ordersReceived: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [previewProduct, setPreviewProduct] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Fetch Products
  const fetchProducts = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      setError(null);
      try {
        const catFilter =
          selectedCategory === 'All Categories' ? '' : selectedCategory;
        const response = await productService.getAdminProducts({
          search: searchQuery,
          category: catFilter,
          status: selectedStatus,
          page: pageToLoad,
          limit: pagination.limit,
        });

        if (response.success && response.data) {
          setProducts(response.data.products || []);
          if (response.data.stats) {
            setStats(response.data.stats);
          }
          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch saree catalog from database.');
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, selectedCategory, selectedStatus, pagination.limit]
  );

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleOpenPreview = (product) => {
    setPreviewProduct(product);
    setIsPreviewOpen(true);
  };

  const handleOpenDelete = (product) => {
    setDeletingProduct(product);
    setIsDeleteOpen(true);
  };

  const handleModalSuccess = () => {
    // Refresh product list and summary stats from database
    fetchProducts(pagination.page);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header Banner */}
      <div className="bg-stone-900 border-2 border-gold-500/30 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-400/30 text-gold-300 text-xs font-semibold tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4 text-gold-400" />
              <span>Administrative Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
              Saree Inventory & Catalog Management
            </h1>
            <p className="text-stone-400 text-xs sm:text-sm max-w-xl">
              Connected as <span className="text-gold-200 font-mono">{user?.email}</span>. Manage live listings, upload high-resolution weaves to Cloudinary, and audit stock levels.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              id="admin-create-saree-btn"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-maroon-700 to-maroon-600 hover:from-maroon-800 hover:to-maroon-700 text-white text-xs font-semibold tracking-wider shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Saree</span>
            </button>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold tracking-wider border border-stone-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation Controls */}
      <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'products'
              ? 'bg-maroon-700 text-white shadow-md'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Saree Catalog & Inventory</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-maroon-700 text-white shadow-md'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Customer Orders & Fulfillment</span>
        </button>
      </div>

      {activeTab === 'orders' ? (
        <AdminOrdersTab />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Total Products
            </span>
            <p className="text-2xl font-serif font-bold text-stone-900 mt-1">
              {stats.totalProducts}
            </p>
            <span className="text-[11px] text-stone-400 mt-0.5 block">
              In database catalog
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-maroon-50 text-maroon-700 flex items-center justify-center border border-maroon-100">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Active Listings */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Active Listings
            </span>
            <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">
              {stats.activeListings}
            </p>
            <span className="text-[11px] text-stone-400 mt-0.5 block">
              Publicly visible on storefront
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Total Stock Units */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Total Units in Stock
            </span>
            <p className="text-2xl font-serif font-bold text-stone-900 mt-1">
              {stats.totalStock}
            </p>
            <span className="text-[11px] text-stone-400 mt-0.5 block">
              Handcrafted drapes available
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center border border-gold-200">
            <Archive className="w-6 h-6" />
          </div>
        </div>

        {/* Orders Received */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Orders Received
            </span>
            <p className="text-2xl font-serif font-bold text-stone-900 mt-1">
              {stats.ordersReceived || 0}
            </p>
            <span className="text-[11px] text-stone-400 mt-0.5 block">
              Customer checkouts
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Area: Search, Filters & Product Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Search & Filters Bar */}
        <div className="p-4 sm:p-6 border-b border-stone-200 bg-stone-50/70 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by saree title or SKU code..."
                className="block w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors text-stone-700"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors text-stone-700"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchProducts(pagination.page)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-medium transition-colors"
              title="Refresh Catalog"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchProducts(1)}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-100/50 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Saree Product</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-stone-500">
                    <Loader2 className="w-8 h-8 text-maroon-700 animate-spin mx-auto mb-2" />
                    <span>Loading inventory from MongoDB...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                        <Package className="w-6 h-6" />
                      </div>
                      <h4 className="font-serif text-base font-bold text-stone-900">
                        No Saree Listings Found
                      </h4>
                      <p className="text-xs text-stone-500">
                        {searchQuery || selectedCategory !== 'All Categories' || selectedStatus !== 'all'
                          ? 'Try adjusting your search criteria or resetting filters.'
                          : 'Your saree collection is currently empty. Create your first product listing now.'}
                      </p>
                      <button
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-semibold transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First Saree</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const mainPhoto =
                    product.images?.find((img) => img.isMain)?.url ||
                    product.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80';

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-stone-50/80 transition-colors"
                    >
                      {/* Product Thumbnail + Title */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={mainPhoto}
                            alt={product.title}
                            className="w-12 h-14 rounded-lg object-cover border border-stone-200 shrink-0 bg-stone-100 shadow-sm"
                          />
                          <div className="min-w-0 max-w-xs">
                            <span className="font-semibold text-stone-900 block truncate hover:text-maroon-700 cursor-pointer" onClick={() => handleOpenPreview(product)}>
                              {product.title}
                            </span>
                            <span className="text-[11px] text-stone-500 truncate block">
                              {product.fabric || 'Pure Silk'} • {product.images?.length || 1} photo(s)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-stone-700">
                        {product.sku}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 border border-stone-200 text-stone-800">
                          {product.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-serif font-bold text-stone-900 text-sm">
                        {formatINR(product.price)}
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-4">
                        {product.stock <= 2 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Low ({product.stock})
                          </span>
                        ) : (
                          <span className="font-semibold text-stone-800">
                            {product.stock}
                          </span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            product.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 text-stone-500 border border-stone-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              product.isActive ? 'bg-emerald-500' : 'bg-stone-400'
                            }`}
                          />
                          <span>{product.isActive ? 'Active' : 'Inactive'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenPreview(product)}
                            className="p-1.5 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                            title="Preview Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 rounded-md text-stone-500 hover:text-maroon-700 hover:bg-stone-200 transition-colors"
                            title="Edit Saree"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(product)}
                            className="p-1.5 rounded-md text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Saree"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.total > 0 && (
          <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-600">
            <div>
              Showing{' '}
              <span className="font-semibold text-stone-900">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-stone-900">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-stone-900">
                {pagination.total}
              </span>{' '}
              saree listings
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchProducts(pagination.page - 1)}
                disabled={!pagination.hasPrevPage || loading}
                className="p-1.5 rounded-md border border-stone-300 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-semibold text-stone-800">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchProducts(pagination.page + 1)}
                disabled={!pagination.hasNextPage || loading}
                className="p-1.5 rounded-md border border-stone-300 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleModalSuccess}
        product={editingProduct}
      />

      <ProductPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        product={previewProduct}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={handleModalSuccess}
        product={deletingProduct}
      />
    </div>
  );
};

export default AdminDashboardPage;
