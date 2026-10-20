import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: [true, 'Image public ID is required'],
    },
    url: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    alt: {
      type: String,
      default: '',
      trim: true,
    },
    isMain: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Saree title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU / Product code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
      match: [
        /^[A-Z0-9_-]{3,30}$/,
        'SKU must be 3-30 characters alphanumeric (may include hyphens or underscores)',
      ],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'Silk',
          'Cotton',
          'Banarasi',
          'Kanjivaram',
          'Designer',
          'Chanderi',
          'Organza',
          'Other',
        ],
        message: '{VALUE} is not a supported saree category',
      },
      default: 'Silk',
      index: true,
    },
    fabric: {
      type: String,
      trim: true,
      default: 'Pure Silk',
    },
    price: {
      type: Number,
      required: [true, 'Price in INR is required'],
      min: [0, 'Price must be a positive number'],
    },
    stock: {
      type: Number,
      required: [true, 'Available quantity (stock) is required'],
      min: [0, 'Stock cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be an integer',
      },
      default: 1,
    },
    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: 'At least one product photograph is required',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Auto-generate slug before validation if not explicitly set
productSchema.pre('validate', function (next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    const cleanTitle = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const cleanSku = (this.sku || Math.random().toString(36).substring(2, 6)).toLowerCase();
    this.slug = `${cleanTitle}-${cleanSku}`;
  }
  next();
});

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
