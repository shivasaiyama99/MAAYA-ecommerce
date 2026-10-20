import React, { useState, useEffect } from 'react';
import productService from '../../services/productService';
import {
  X,
  Upload,
  Sparkles,
  Loader2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

const CATEGORIES = [
  'Silk',
  'Cotton',
  'Banarasi',
  'Kanjivaram',
  'Designer',
  'Chanderi',
  'Organza',
  'Other',
];

export const ProductFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  product = null, // If provided, Edit mode; else Create mode
}) => {
  const isEdit = Boolean(product && product._id);

  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    description: '',
    category: 'Silk',
    fabric: 'Pure Silk',
    price: '',
    stock: '',
    isActive: true,
  });

  const [images, setImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || '',
        sku: product.sku || '',
        description: product.description || '',
        category: product.category || 'Silk',
        fabric: product.fabric || 'Pure Silk',
        price: product.price !== undefined ? product.price.toString() : '',
        stock: product.stock !== undefined ? product.stock.toString() : '',
        isActive: product.isActive !== undefined ? product.isActive : true,
      });
      setImages(product.images || []);
    } else {
      setFormData({
        title: '',
        sku: `SAR-${Math.floor(1000 + Math.random() * 9000)}`,
        description: '',
        category: 'Silk',
        fabric: 'Pure Silk',
        price: '',
        stock: '1',
        isActive: true,
      });
      setImages([]);
    }
    setError(null);
    setFieldErrors({});
  }, [product, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters long.';
    }
    if (!formData.sku.trim() || !/^[A-Za-z0-9_-]{3,30}$/.test(formData.sku.trim())) {
      errs.sku = 'SKU must be 3-30 alphanumeric characters (e.g., KANJ-01).';
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters long.';
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      errs.price = 'Price must be a valid positive amount.';
    }
    const stockNum = parseInt(formData.stock, 10);
    if (isNaN(stockNum) || stockNum < 0 || !Number.isInteger(Number(formData.stock))) {
      errs.stock = 'Stock must be a non-negative integer.';
    }
    if (images.length === 0) {
      errs.images = 'At least one product photograph is required.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (error) setError(null);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setError(null);

    // Validate client-side file formats & sizes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    for (const file of files) {
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setError(`"${file.name}" is not a supported format. Please upload JPEG, PNG, WEBP, or AVIF.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" exceeds the 5MB file size limit.`);
        return;
      }
    }

    setUploadingImage(true);
    try {
      const uploadedImages = [];
      for (const file of files) {
        const response = await productService.uploadImage(file);
        if (response.success && response.data) {
          uploadedImages.push({
            publicId: response.data.publicId,
            url: response.data.url,
            alt: `${formData.title || 'Saree'} photograph`,
            isMain: images.length === 0 && uploadedImages.length === 0,
          });
        }
      }

      setImages((prev) => [...prev, ...uploadedImages]);
      if (fieldErrors.images) {
        setFieldErrors((prev) => ({ ...prev, images: null }));
      }
    } catch (err) {
      setError(err.message || 'Failed to upload photograph to Cloudinary.');
    } finally {
      setUploadingImage(false);
      // Reset input value so same file can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      // If we removed the main image, make the first remaining image main
      if (updated.length > 0 && !updated.some((img) => img.isMain)) {
        updated[0].isMain = true;
      }
      return updated;
    });
  };

  const handleSetMainImage = (indexToMain) => {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        isMain: idx === indexToMain,
      }))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError(null);

    const payload = {
      title: formData.title.trim(),
      sku: formData.sku.trim().toUpperCase(),
      description: formData.description.trim(),
      category: formData.category,
      fabric: formData.fabric.trim(),
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      isActive: Boolean(formData.isActive),
      images,
    };

    try {
      if (isEdit) {
        await productService.updateProduct(product._id, payload);
      } else {
        await productService.createProduct(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save saree listing.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold-600" />
            <h2 className="font-serif text-xl font-bold text-stone-900">
              {isEdit ? 'Edit Saree Listing' : 'Create New Saree Listing'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Saree Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Saree Name / Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Royal Maroon Kanjeevaram Silk with Gold Zari Pallu"
              className={`block w-full px-3.5 py-2.5 text-sm rounded-lg border ${
                fieldErrors.title ? 'border-rose-400 bg-rose-50/20' : 'border-stone-300'
              } focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors`}
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p>
            )}
          </div>

          {/* SKU & Category & Fabric */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                SKU / Product Code *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="KANJ-001"
                className={`block w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border ${
                  fieldErrors.sku ? 'border-rose-400 bg-rose-50/20' : 'border-stone-300'
                } focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors`}
              />
              {fieldErrors.sku && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.sku}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="block w-full px-3 py-2.5 text-sm rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Fabric Material
              </label>
              <input
                type="text"
                name="fabric"
                value={formData.fabric}
                onChange={handleChange}
                placeholder="e.g. Mulberry Silk, Cotton Silk"
                className="block w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          {/* Price & Stock & Active Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Price in INR (₹) *
              </label>
              <input
                type="number"
                name="price"
                min="0"
                step="any"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g. 18500"
                className={`block w-full px-3.5 py-2.5 text-sm rounded-lg border ${
                  fieldErrors.price ? 'border-rose-400 bg-rose-50/20' : 'border-stone-300'
                } focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors`}
              />
              {fieldErrors.price && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stock"
                min="0"
                step="1"
                value={formData.stock}
                onChange={handleChange}
                placeholder="e.g. 5"
                className={`block w-full px-3.5 py-2.5 text-sm rounded-lg border ${
                  fieldErrors.stock ? 'border-rose-400 bg-rose-50/20' : 'border-stone-300'
                } focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors`}
              />
              {fieldErrors.stock && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.stock}</p>
              )}
            </div>

            <div className="pt-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-maroon-600 border-stone-300 rounded focus:ring-maroon-500"
                />
                <span className="text-xs font-semibold text-stone-800">
                  Active Listing (Visible to buyers)
                </span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Description & Weaving Details *
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of weave, zari work, border motif, and drape occasion..."
              className={`block w-full px-3.5 py-2 text-sm rounded-lg border ${
                fieldErrors.description ? 'border-rose-400 bg-rose-50/20' : 'border-stone-300'
              } focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent transition-colors`}
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.description}</p>
            )}
          </div>

          {/* Image Upload Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Product Photographs (Cloudinary Upload) *
              </label>
              <span className="text-[11px] text-stone-500">
                JPEG, PNG, WEBP, AVIF up to 5MB
              </span>
            </div>

            {/* Drop / Select Zone */}
            <label className="border-2 border-dashed border-stone-300 hover:border-maroon-600 hover:bg-stone-50/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
              <Upload className="w-8 h-8 text-stone-400 mb-2" />
              <span className="text-sm font-semibold text-stone-800">
                {uploadingImage ? 'Uploading photograph to Cloudinary...' : 'Click to select product photographs'}
              </span>
              <span className="text-xs text-stone-500 mt-1">
                First photograph serves as main display photograph unless customized below
              </span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFileUpload}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>

            {fieldErrors.images && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.images}</p>
            )}

            {/* Uploaded Gallery Thumbnails */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-lg border overflow-hidden group bg-stone-50 ${
                      img.isMain ? 'ring-2 ring-maroon-600 border-transparent' : 'border-stone-200'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt || 'Saree photograph'}
                      className="w-full h-28 object-cover"
                    />

                    {/* Main Badge */}
                    {img.isMain && (
                      <span className="absolute top-1 left-1 bg-maroon-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                        MAIN
                      </span>
                    )}

                    {/* Actions overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                      {!img.isMain && (
                        <button
                          type="button"
                          onClick={() => handleSetMainImage(idx)}
                          className="px-2 py-1 bg-white text-stone-800 text-[10px] font-semibold rounded hover:bg-gold-100"
                        >
                          Make Main
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 bg-rose-600 text-white rounded hover:bg-rose-700"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="px-6 py-2.5 rounded-lg bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-semibold tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <span>{isEdit ? 'Update Saree' : 'Publish Saree Listing'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
