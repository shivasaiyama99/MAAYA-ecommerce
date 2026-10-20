import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, ShieldCheck, Tag } from 'lucide-react';
import { formatINR } from '../../utils/formatCurrency';

export const ProductPreviewModal = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', alt: 'Saree' }];

  const currentImage = images[activeImageIndex] || images[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-maroon-700" />
            <h2 className="font-serif text-lg font-bold text-stone-900">
              Saree Preview: {product.sku}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Gallery Column */}
            <div className="space-y-4">
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shadow-inner">
                <img
                  src={currentImage.url}
                  alt={currentImage.alt || product.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-20 rounded-lg overflow-hidden border shrink-0 transition-all ${
                        activeImageIndex === idx
                          ? 'ring-2 ring-maroon-600 border-transparent shadow'
                          : 'border-stone-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details Column */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-gold-50 border border-gold-200 text-gold-800">
                    {product.category}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      product.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}
                  >
                    {product.isActive ? 'Active Listing' : 'Inactive'}
                  </span>
                </div>

                <h1 className="font-serif text-2xl font-bold text-stone-900 leading-snug">
                  {product.title}
                </h1>
                <p className="text-xs font-mono text-stone-500 mt-1">
                  SKU: {product.sku}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 block">Selling Price</span>
                  <span className="text-2xl font-serif font-bold text-maroon-800">
                    {formatINR(product.price)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-stone-500 block">Inventory Stock</span>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    {product.stock <= 2 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Low Stock ({product.stock})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{product.stock} units available</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Fabric & Weaving Technique
                </h3>
                <p className="text-sm text-stone-700 bg-stone-50/70 p-3 rounded-lg border border-stone-200">
                  {product.fabric || 'Pure Handloom Silk'}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Product Description
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-100 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold tracking-wider transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPreviewModal;
