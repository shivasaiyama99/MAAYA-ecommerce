import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/formatCurrency';
import {
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Plus,
  Loader2,
  HeartHandshake,
} from 'lucide-react';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, setBuyNowItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await productService.getProductById(id);
        if (response.success && response.data) {
          setProduct(response.data);
        } else {
          setError('Product not found.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load saree details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-stone-500">
        <Loader2 className="w-10 h-10 text-maroon-700 animate-spin mb-3" />
        <p className="text-sm font-medium">Unfolding handcrafted drape details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 bg-white border border-stone-200 rounded-2xl shadow-sm text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          Saree Not Found
        </h2>
        <p className="text-xs text-stone-500">
          {error || 'This handcrafted piece is no longer available in our boutique.'}
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-maroon-700 text-white text-xs font-semibold tracking-wider uppercase transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Boutique</span>
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80', alt: product.title }];

  const currentPhoto = images[activeImageIndex] || images[0];
  const isOutOfStock = product.stock <= 0;

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    setBuyNowItem({ product, quantity });
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-stone-500">
        <Link to="/" className="hover:text-maroon-700">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
        <Link to="/shop" className="hover:text-maroon-700">All Sarees</Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
        <Link to={`/shop?category=${product.category}`} className="hover:text-maroon-700">
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
        <span className="text-stone-800 font-semibold truncate max-w-[200px]">
          {product.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left Column: Photograph Gallery */}
        <div className="space-y-4">
          <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 shadow-xl relative group">
            <img
              src={currentPhoto.url}
              alt={currentPhoto.alt || product.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {isOutOfStock && (
              <div className="absolute top-4 right-4 bg-rose-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                Sold Out
              </div>
            )}
          </div>

          {/* Gallery Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-24 rounded-xl overflow-hidden border shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? 'ring-2 ring-maroon-600 border-transparent shadow-md'
                      : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Saree Details & Shopping Actions */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-gold-50 border border-gold-200 text-gold-800">
                {product.category} Saree
              </span>
              <span className="text-xs font-mono text-stone-400">
                SKU: {product.sku}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight leading-tight">
              {product.title}
            </h1>

            <div className="mt-4 flex items-baseline gap-4">
              <span className="font-serif text-3xl font-bold text-maroon-800">
                {formatINR(product.price)}
              </span>
              <span className="text-xs text-stone-500">
                Inclusive of all taxes • Pan-India Free Delivery
              </span>
            </div>
          </div>

          {/* Stock Availability Pill */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700">Inventory Status:</span>
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Currently Out of Stock</span>
              </span>
            ) : product.stock <= 2 ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Only {product.stock} drape(s) remaining in atelier</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>In Stock ({product.stock} units available)</span>
              </span>
            )}
          </div>

          {/* Quantity Selector & Shopping Actions */}
          <div className="space-y-4">
            {!isOutOfStock && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Quantity:
                </span>
                <div className="flex items-center border border-stone-300 rounded-lg bg-white">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    className="p-2 text-stone-600 hover:text-stone-900 disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 font-mono font-bold text-xs text-stone-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={quantity >= product.stock}
                    className="p-2 text-stone-600 hover:text-stone-900 disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                id="pdp-add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="py-3.5 px-6 rounded-xl border-2 border-maroon-700 text-maroon-800 hover:bg-maroon-50 font-semibold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Shopping Bag</span>
              </button>

              <button
                type="button"
                id="pdp-buy-now-btn"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="py-3.5 px-6 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-semibold text-xs tracking-widest uppercase transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now with Express Checkout</span>
              </button>
            </div>
          </div>

          {/* Description & Specifications */}
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900 mb-2">
                Weaving & Craftsmanship Story
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line font-light">
                {product.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-stone-50/70 p-4 rounded-xl border border-stone-200">
              <div>
                <span className="text-stone-400 block">Fabric Material</span>
                <span className="font-semibold text-stone-800">{product.fabric || 'Pure Mulberry Silk'}</span>
              </div>
              <div>
                <span className="text-stone-400 block">Zari Type</span>
                <span className="font-semibold text-stone-800">Gold & Silver Dipped Threads</span>
              </div>
              <div>
                <span className="text-stone-400 block">Blouse Piece</span>
                <span className="font-semibold text-stone-800">Included (Matching Running)</span>
              </div>
              <div>
                <span className="text-stone-400 block">Length & Width</span>
                <span className="font-semibold text-stone-800">6.2 Meters with Blouse Piece</span>
              </div>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-200 text-xs text-stone-600">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Silk Mark Certified</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-gold-600 shrink-0" />
              <span>Pan-India Free Express</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-maroon-700 shrink-0" />
              <span>100% Handcrafted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
