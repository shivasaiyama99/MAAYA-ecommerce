import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/formatCurrency';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  HeartHandshake,
  ShoppingBag,
  Zap,
  Star,
  CheckCircle2,
} from 'lucide-react';

export const HomePage = () => {
  const navigate = useNavigate();
  const { addToCart, setBuyNowItem } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const response = await productService.getPublicProducts({ limit: 4 });
        if (response.success && response.data?.products) {
          setFeaturedProducts(response.data.products);
        }
      } catch (err) {
        console.error('Failed to load featured sarees', err);
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  const handleBuyNow = (product) => {
    setBuyNowItem({ product, quantity: 1 });
    navigate('/checkout');
  };

  const categories = [
    {
      title: 'Kanjeevaram Silk',
      tag: 'Korvai Temple Borders',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80',
      link: '/shop?category=Kanjivaram',
      desc: 'Woven with pure mulberry silk and silver-dipped gold zari.',
    },
    {
      title: 'Royal Banarasi',
      tag: 'Katan & Kadwa Brocade',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=700&q=80',
      link: '/shop?category=Banarasi',
      desc: 'Timeless Varanasi weaves featuring intricate floral jaals.',
    },
    {
      title: 'Organza & Tissue',
      tag: 'Sheer Gossamer Grace',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=700&q=80',
      link: '/shop?category=Organza',
      desc: 'Featherlight drapes with delicate hand-embroidered scalloped borders.',
    },
    {
      title: 'Chanderi Weaves',
      tag: 'Madhya Pradesh Heritage',
      image: '/chanderi_saree.jpg',
      link: '/shop?category=Chanderi',
      desc: 'Fine cotton-silk weaves perfect for celebratory day festivities.',
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F7F2EB] via-[#FAF6F0] to-[#FAF9F5] border-b border-stone-200 py-16 sm:py-24 md:py-32">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gradient-to-br from-gold-300/20 to-maroon-700/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-gradient-to-tr from-maroon-500/10 to-gold-400/20 blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text column */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-maroon-50 border border-maroon-200/60 text-maroon-800 text-xs font-semibold tracking-widest uppercase shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                <span>Bespoke Handloom Couture</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-stone-900 font-bold tracking-tight leading-tight">
                Drapes of <span className="text-maroon-700 italic">Royalty</span>, Woven in Pure Gold.
              </h1>

              <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-light max-w-xl mx-auto lg:mx-0">
                Explore an authentic curation of pure silk handlooms, heirloom bridal Kanjeevarams, and exquisite Banarasi kadwa weaves crafted by India's master artisans.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/shop"
                  id="hero-shop-now-btn"
                  className="px-7 py-3.5 rounded-lg bg-maroon-700 hover:bg-maroon-800 text-white font-semibold text-xs tracking-widest uppercase transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/shop?category=Banarasi"
                  className="px-6 py-3.5 rounded-lg bg-white border border-stone-300 hover:border-maroon-500 text-stone-800 hover:text-maroon-700 font-semibold text-xs tracking-widest uppercase transition-all shadow-sm"
                >
                  Banarasi Edit
                </Link>
              </div>

              {/* Trust Callout */}
              <div className="pt-6 border-t border-stone-200/80 flex items-center justify-center lg:justify-start gap-6 text-xs text-stone-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Silk Mark Certified</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pan-India Free Express Shipping</span>
                </span>
              </div>
            </div>

            {/* Visual Mosaic Column */}
            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 bg-stone-100 relative group">
                <img
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80"
                  alt="Royal Silk Saree Model"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8 text-white">
                  <span className="text-xs uppercase tracking-widest text-gold-300 font-bold mb-1">
                    Featured Drape
                  </span>
                  <h3 className="font-serif text-2xl font-bold">
                    Kanjeevaram Crimson Bridal Silk
                  </h3>
                  <p className="text-xs text-stone-200 mt-1">
                    Gold zari woven body with korvai temple borders
                  </p>
                </div>
              </div>

              {/* Floating Luxury Tag */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-stone-200 hidden sm:flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gold-50 border border-gold-200 text-gold-700 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                    Authentic Artisan Weave
                  </span>
                  <span className="font-serif text-base font-bold text-stone-900">
                    100% Genuine Silk Mark
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-gold-700 uppercase tracking-widest block">
            Heritage Craft
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mt-2">
            Curated Handloom Weaves
          </h2>
          <p className="text-sm text-stone-600 mt-2">
            Explore masterpieces sourced directly from weaver clusters across Varanasi, Kanchipuram, and Chanderi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <Link
              key={idx}
              to={cat.link}
              className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col"
            >
              <div className="aspect-[4/5] overflow-hidden bg-stone-100 relative">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-stone-800 tracking-wider uppercase">
                  {cat.tag}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-maroon-700 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                    {cat.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-maroon-700">
                  <span>Explore Sarees</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Sarees (Direct from MongoDB Backend) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold text-maroon-700 uppercase tracking-widest block">
              Direct From Atelier
            </span>
            <h2 className="text-3xl font-serif font-bold text-stone-900 mt-1">
              Featured Boutique Drapes
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Live handloom pieces synced in real-time from our workshop inventory.
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-maroon-700 hover:text-maroon-900"
          >
            <span>View All Sarees</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-stone-200 p-4 space-y-4 animate-pulse">
                <div className="aspect-[3/4] bg-stone-200 rounded-xl" />
                <div className="h-4 bg-stone-200 rounded w-3/4" />
                <div className="h-4 bg-stone-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8">
            <p className="text-sm text-stone-500">
              New bridal and festive sarees are currently being cataloged. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => {
              const photo =
                product.images?.find((img) => img.isMain)?.url ||
                product.images?.[0]?.url ||
                'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80';

              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product._id}
                  className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col"
                >
                  {/* Photo Container */}
                  <Link
                    to={`/shop/${product._id}`}
                    className="aspect-[3/4] overflow-hidden bg-stone-100 relative block"
                  >
                    <img
                      src={photo}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Category Tag */}
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-0.5 rounded-full text-[10px] font-bold text-stone-800 tracking-wider uppercase">
                      {product.category}
                    </span>

                    {/* Stock Status Pill */}
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

                  {/* Info & Shopping Actions */}
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
      </section>

      {/* Story & Artisan Craftsmanship Banner */}
      <section className="bg-stone-900 text-stone-100 py-16 md:py-24 border-y border-stone-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold tracking-[0.25em] text-gold-400 uppercase">
                The Weaver's Devotion
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-white leading-snug">
                Centuries of Tradition, One Thread at a Time.
              </h2>
              <p className="text-stone-300 text-sm leading-relaxed font-light">
                Each Maya Collections drape and jewel represents over 120 hours of concentrated handloom artistry and exquisite craftsmanship. Using age-old pit looms, natural dye extractions, certified pure zari, and authentic gemstones, our master artisans create timeless heirlooms.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4 text-xs">
                <div className="border-l-2 border-gold-400 pl-4">
                  <span className="text-2xl font-serif font-bold text-white block">120+</span>
                  <span className="text-stone-400">Hours of Weaver Handcrafting</span>
                </div>
                <div className="border-l-2 border-gold-400 pl-4">
                  <span className="text-2xl font-serif font-bold text-white block">100%</span>
                  <span className="text-stone-400">Pure Certified Silk & Ornaments</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border-2 border-gold-500/30 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80"
                alt="Banarasi Weave Craftsmanship"
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Boutique Visit & WhatsApp Contact Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-maroon-900 via-stone-900 to-maroon-950 rounded-3xl p-8 sm:p-12 text-white border-2 border-gold-500/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative z-10">
            {/* Logo & Headline */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:items-start text-center sm:text-left gap-5">
              <img
                src="/logo.png"
                alt="Maya Collections Logo"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-gold-400 shadow-xl"
              />
              <div>
                <span className="text-xs font-bold tracking-[0.25em] text-gold-400 uppercase block">
                  Store & Atelier
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
                  Maya Collections
                </h3>
                <p className="text-xs text-stone-300 tracking-wider uppercase font-semibold mt-0.5">
                  Sarees & Royal Jewellery
                </p>
              </div>
            </div>

            {/* Address & Contact Information */}
            <div className="space-y-4 text-xs sm:text-sm text-stone-200 border-y lg:border-y-0 lg:border-x border-stone-800 py-6 lg:py-0 lg:px-8">
              <div className="flex items-start gap-3">
                <span className="text-gold-400 font-bold uppercase text-[11px] tracking-wider block min-w-[70px]">
                  Address:
                </span>
                <span className="text-stone-300 font-light leading-relaxed">
                  H.no: 4-6-158/31A, Durga Nagar, Nacharam, Rangareddy. Pincode 500076
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-gold-400 font-bold uppercase text-[11px] tracking-wider block min-w-[70px]">
                  Phone:
                </span>
                <a
                  href="tel:+919701607651"
                  className="text-white hover:text-gold-300 font-medium transition-colors"
                >
                  +91 97016 07651
                </a>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-gold-400 font-bold uppercase text-[11px] tracking-wider block min-w-[70px]">
                  Email:
                </span>
                <a
                  href="mailto:komakulakiranmai@gmail.com"
                  className="text-stone-300 hover:text-gold-300 font-medium transition-colors break-all"
                >
                  komakulakiranmai@gmail.com
                </a>
              </div>
            </div>

            {/* Call to Actions: WhatsApp & Phone */}
            <div className="flex flex-col gap-3 justify-center items-stretch sm:items-center lg:items-stretch">
              <a
                href="https://wa.me/919701607651?text=Hello%20Maya%20Collections,%20I%20would%20like%20to%20inquire%20about%20your%20sarees%20and%20jewellery."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg hover:shadow-[#25D366]/40 flex items-center justify-center gap-2 group text-center"
              >
                <span>Direct WhatsApp Inquiries</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="tel:+919701607651"
                className="w-full py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs tracking-wider uppercase transition-colors border border-white/20 text-center"
              >
                Call: +91 97016 07651
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 text-center space-y-2 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gold-50 text-gold-700 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-stone-900 text-sm">Silk Mark Certified</h4>
            <p className="text-xs text-stone-500">100% Guaranteed Pure Mulberry & Katan Silks</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 text-center space-y-2 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gold-50 text-gold-700 flex items-center justify-center mx-auto">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-stone-900 text-sm">Pan-India Express</h4>
            <p className="text-xs text-stone-500">Complimentary insured delivery across India</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 text-center space-y-2 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gold-50 text-gold-700 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-stone-900 text-sm">100% Handloom Silk</h4>
            <p className="text-xs text-stone-500">Certified authentic weaves & royal jewellery</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 text-center space-y-2 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gold-50 text-gold-700 flex items-center justify-center mx-auto">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-stone-900 text-sm">Artisan Empowerment</h4>
            <p className="text-xs text-stone-500">Fair trade direct from master weaver clusters</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
