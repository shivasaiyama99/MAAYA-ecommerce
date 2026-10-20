import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/formatCurrency';
import {
  Search,
  Filter,
  ShoppingBag,
  Zap,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  X,
  AlertTriangle,
  Loader2,
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

export const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart, setBuyNowItem } = useCart();

  // URL Query Parameters
  const initialCategory = searchParams.get('category') || 'All Categories';
  const initialSearch = searchParams.get('search') || '';

  // State
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync category from URL if changed externally
  useEffect(() => {
    const paramCat = searchParams.get('category');
    if (paramCat && paramCat !== category) {
      setCategory(paramCat);
      setPage(1);
    }
  }, [searchParams]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getPublicProducts({
        search,
        category: category === 'All Categories' ? '' : category,
        sort,
        page,
        limit: 12,
      });

      if (response.success && response.data) {
        setProducts(response.data.products || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve saree collection from atelier.');
    } finally {
      setLoading(false);
    }
  }, [search, category, sort, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleCategorySelect = (selectedCat) => {
    setCategory(selectedCat);
    setPage(1);
    if (selectedCat === 'All Categories') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', selectedCat);
    }
    setSearchParams(searchParams);
    setMobileFilterOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const handleBuyNow = (product) => {
    setBuyNowItem({ product, quantity: 1 });
    navigate('/checkout');
  };

  const handleResetFilters = () => {
    setCategory('All Categories');
    setSearch('');
    setSort('newest');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold tracking-[0.25em] text-gold-700 uppercase">
          Artisanal Drapes
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 tracking-tight">
          Handcrafted Saree Collection
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 font-light max-w-xl mx-auto">
          Explore pure Kanjeevarams, opulent Banarasis, ethereal Chanderis, and sheer Organza drapes direct from master artisans.
        </p>
      </div>

      {/* Main Grid: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block bg-white rounded-2xl border border-stone-200 p-6 space-y-6 shadow-sm sticky top-28">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-base">
              <SlidersHorizontal className="w-4 h-4 text-maroon-700" />
              <span>Filter Collection</span>
            </div>
            {(category !== 'All Categories' || search || sort !== 'newest') && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-maroon-700 hover:text-maroon-900 underline"
              >
                Reset
              </button>
            )}
          </div>

          {/* Categories List */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-3">
              Weaves & Categories
            </label>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                    category === cat
                      ? 'bg-maroon-50 text-maroon-800 font-semibold border border-maroon-200'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  <span>{cat}</span>
                  {category === cat && (
                    <span className="w-1.5 h-1.5 rounded-full bg-maroon-700" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-6 border-t border-stone-100 space-y-3 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-600 shrink-0" />
              <span>100% Genuine Silk Mark</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-600 shrink-0" />
              <span>Pan-India Free Express Delivery</span>
            </div>
          </div>
        </aside>

        {/* Products Main Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Search & Sort Controls Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by saree title, fabric, or motif..."
                className="block w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors"
              />
            </form>

            <div className="flex items-center gap-3">
              {/* Mobile Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs font-medium text-stone-700"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <span className="hidden sm:inline font-medium">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-maroon-600"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Tags */}
          {(category !== 'All Categories' || search) && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-stone-500 font-medium">Active filters:</span>
              {category !== 'All Categories' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-maroon-50 border border-maroon-200 text-maroon-800 font-semibold">
                  <span>{category}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-maroon-900"
                    onClick={() => handleCategorySelect('All Categories')}
                  />
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-300 text-stone-800">
                  <span>"{search}"</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-stone-900"
                    onClick={() => {
                      setSearch('');
                      setPage(1);
                    }}
                  />
                </span>
              )}
            </div>
          )}

          {/* Results Summary & Counter */}
          <div className="text-xs text-stone-500 font-medium">
            Showing {products.length} of {pagination.total} authentic handloom sarees
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={loadProducts}
                className="font-semibold text-rose-800 underline hover:text-rose-900"
              >
                Retry
              </button>
            </div>
          )}

          {/* Product Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl border border-stone-200 p-4 space-y-4 animate-pulse"
                >
                  <div className="aspect-[3/4] bg-stone-200 rounded-xl" />
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-4 bg-stone-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                No Sarees Match Your Criteria
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                We couldn't find any sarees matching your selected filters. Try searching with broader terms or clear your active filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-lg bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-semibold tracking-wider uppercase transition-colors shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const photo =
                  product.images?.find((img) => img.isMain)?.url ||
                  product.images?.[0]?.url ||
                  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80';

                const isOutOfStock = product.stock <= 0;

                return (
                  <div
                    key={product._id}
                    className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col"
                  >
                    {/* Photograph Container */}
                    <Link
                      to={`/shop/${product._id}`}
                      className="aspect-[3/4] overflow-hidden bg-stone-100 relative block"
                    >
                      <img
                        src={photo}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Category Badge */}
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-0.5 rounded-full text-[10px] font-bold text-stone-800 tracking-wider uppercase">
                        {product.category}
                      </span>

                      {/* Stock availability indicator */}
                      {isOutOfStock ? (
                        <span className="absolute top-3 right-3 bg-rose-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                          Out of Stock
                        </span>
                      ) : product.stock <= 2 ? (
                        <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                          Only {product.stock} left
                        </span>
                      ) : null}
                    </Link>

                    {/* Saree Details & Action Buttons */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <Link to={`/shop/${product._id}`}>
                          <h3 className="font-serif text-sm font-bold text-stone-900 group-hover:text-maroon-700 transition-colors line-clamp-2">
                            {product.title}
                          </h3>
                        </Link>
                        <p className="text-[11px] text-stone-500 mt-1">
                          {product.fabric || 'Pure Silk'} • SKU: {product.sku}
                        </p>
                        <div className="mt-2 text-base font-serif font-bold text-maroon-800">
                          {formatINR(product.price)}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => addToCart(product, 1)}
                          disabled={isOutOfStock}
                          className="py-2 px-2 rounded-lg border border-stone-300 hover:border-maroon-600 text-stone-800 hover:text-maroon-700 text-[11px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Bag</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBuyNow(product)}
                          disabled={isOutOfStock}
                          className="py-2 px-2 rounded-lg bg-maroon-700 hover:bg-maroon-800 text-white text-[11px] font-semibold tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Buy Now</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="pt-8 border-t border-stone-200 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage || loading}
                className="p-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold text-stone-700 px-3">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNextPage || loading}
                className="p-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Filter Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <span className="font-serif font-bold text-base text-stone-900">
                  Filter Sarees
                </span>
                <button onClick={() => setMobileFilterOpen(false)}>
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Weaves & Categories
                </label>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                      category === cat
                        ? 'bg-maroon-50 text-maroon-800 font-semibold border border-maroon-200'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full py-3 bg-maroon-700 text-white rounded-lg text-xs font-semibold uppercase tracking-wider mt-6"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
