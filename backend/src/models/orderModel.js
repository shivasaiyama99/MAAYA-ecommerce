import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    image: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    addressLine: {
      type: String,
      required: [true, 'Address line is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
    },
    deliveryInstructions: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a customer user'],
      index: true,
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required for order updates'],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid customer email address'],
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'PhonePe / Google Pay', 'COD', 'Card'],
      default: 'PhonePe / Google Pay',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid'],
      default: 'Pending',
    },
    orderStatus: {
      type: String,
      enum: ['Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Placed',
    },
    paymentVerified: {
      type: Boolean,
      default: false,
    },
    paymentVerifiedAt: {
      type: Date,
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: '',
    },
    placementEmailSent: {
      type: Boolean,
      default: false,
    },
    placementEmailError: {
      type: String,
      default: null,
    },
    confirmationEmailSent: {
      type: Boolean,
      default: false,
    },
    confirmationEmailSentAt: {
      type: Date,
      default: null,
    },
    confirmationEmailError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);
    this.orderNumber = `MAYA-${timestamp}-${random}`;
  }
  next();
});

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
