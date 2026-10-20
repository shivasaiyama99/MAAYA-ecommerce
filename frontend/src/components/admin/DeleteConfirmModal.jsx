import React, { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import productService from '../../services/productService';

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onSuccess,
  product,
}) => {
  if (!isOpen || !product) return null;

  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await productService.deleteProduct(product._id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete product from database.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Confirm Product Deletion
          </h3>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold text-stone-800">"{product.title}"</span>{' '}
            (<span className="font-mono text-stone-700">{product.sku}</span>)?
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs mt-3 leading-relaxed">
            ⚠️ This will permanently remove the record from MongoDB and delete all associated photographs from Cloudinary storage.
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold tracking-wider transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Confirm & Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
