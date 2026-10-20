import mongoose from 'mongoose';
import Product from '../models/productModel.js';
import { CloudinaryService } from '../services/cloudinaryService.js';
import { ApiResponse } from '../utils/apiResponse.js';

// Development in-memory fallback catalog (active only when MongoDB URI is pending in local dev)
const devProducts = [
  {
    _id: new mongoose.Types.ObjectId().toString(),
    title: 'Crimson Temple Border Kanjeevaram Silk Saree',
    sku: 'KANJ-001',
    slug: 'crimson-temple-border-kanjeevaram-silk-saree-kanj-001',
    description: 'Handwoven pure mulberry silk with korvai gold-dipped silver zari temple borders and rich pallu.',
    category: 'Kanjivaram',
    fabric: 'Pure Mulberry Silk',
    price: 28500,
    stock: 4,
    isActive: true,
    images: [
      {
        publicId: 'sarees/dev_kanj_1',
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
        alt: 'Kanjeevaram Saree',
        isMain: true,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    title: 'Midnight Blue Brocade Banarasi Katan Saree',
    sku: 'BAN-002',
    slug: 'midnight-blue-brocade-banarasi-katan-saree-ban-002',
    description: 'Opulent katan silk weave adorned with antique gold zari floral jaals and shikargah pallu.',
    category: 'Banarasi',
    fabric: 'Katan Silk',
    price: 34000,
    stock: 3,
    isActive: true,
    images: [
      {
        publicId: 'sarees/dev_ban_2',
        url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
        alt: 'Banarasi Saree',
        isMain: true,
      },
    ],
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3600000),
  },
  {
    _id: new mongoose.Types.ObjectId().toString(),
    title: 'Ivory Gold Tissue Chanderi Saree',
    sku: 'CHAN-003',
    slug: 'ivory-gold-tissue-chanderi-saree-chan-003',
    description: 'Featherlight silk-cotton blend with fine zari motifs, perfect for festive day celebrations.',
    category: 'Chanderi',
    fabric: 'Cotton Silk Blend',
    price: 14500,
    stock: 6,
    isActive: true,
    images: [
      {
        publicId: 'sarees/dev_chan_3',
        url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        alt: 'Chanderi Saree',
        isMain: true,
      },
    ],
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date(Date.now() - 7200000),
  },
];

const shouldUseMongoose = () => {
  return mongoose.connection.readyState === 1 || process.env.NODE_ENV === 'test';
};

/**
 * @route   POST /api/products/upload-image
 * @desc    Upload an image file directly to Cloudinary via backend memory buffer
 * @access  Admin Only
 */
export const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return ApiResponse.error(res, 'No image file was provided for upload.', 400);
    }

    const uploadResult = await CloudinaryService.uploadBuffer(
      req.file.buffer,
      req.file.mimetype,
      'sarees/products'
    );

    return ApiResponse.success(
      res,
      uploadResult,
      'Image uploaded to Cloudinary successfully',
      201
    );
  } catch (error) {
    console.error('Image upload error:', error);
    return ApiResponse.error(res, error.message || 'Image upload failed', 500);
  }
};

/**
 * @route   POST /api/products
 * @desc    Create a new saree product listing
 * @access  Admin Only
 */
export const createProduct = async (req, res) => {
  try {
    const {
      title,
      sku,
      description,
      category,
      fabric,
      price,
      stock,
      images,
      isActive,
    } = req.body;

    const normalizedSku = sku.trim().toUpperCase();

    // Process images
    let productImages = [];
    if (Array.isArray(images) && images.length > 0) {
      productImages = images.map((img, idx) => ({
        publicId: img.publicId,
        url: img.url,
        alt: img.alt || `${title} photograph ${idx + 1}`,
        isMain: idx === 0 || Boolean(img.isMain),
      }));
    } else {
      return ApiResponse.error(
        res,
        'At least one product photograph is required.',
        400
      );
    }

    // Ensure exactly one main image
    const hasMain = productImages.some((img) => img.isMain);
    if (!hasMain && productImages.length > 0) {
      productImages[0].isMain = true;
    }

    if (shouldUseMongoose()) {
      // Check SKU uniqueness
      const existingSku = await Product.findOne({ sku: normalizedSku });
      if (existingSku) {
        return ApiResponse.error(
          res,
          `A product with SKU "${normalizedSku}" already exists.`,
          409
        );
      }

      const newProduct = await Product.create({
        title: title.trim(),
        sku: normalizedSku,
        description: description.trim(),
        category,
        fabric: fabric ? fabric.trim() : 'Pure Silk',
        price: Number(price),
        stock: parseInt(stock, 10),
        images: productImages,
        isActive: typeof isActive === 'boolean' ? isActive : true,
      });

      return ApiResponse.success(
        res,
        newProduct,
        'Saree listing created successfully in MongoDB',
        201
      );
    }

    // Dev Fallback when MongoDB is disconnected
    if (devProducts.some((p) => p.sku === normalizedSku)) {
      return ApiResponse.error(
        res,
        `A product with SKU "${normalizedSku}" already exists.`,
        409
      );
    }

    const devNewProduct = {
      _id: new mongoose.Types.ObjectId().toString(),
      title: title.trim(),
      sku: normalizedSku,
      slug: (title + '-' + normalizedSku).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description.trim(),
      category,
      fabric: fabric ? fabric.trim() : 'Pure Silk',
      price: Number(price),
      stock: parseInt(stock, 10),
      images: productImages,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    devProducts.unshift(devNewProduct);
    return ApiResponse.success(
      res,
      devNewProduct,
      'Saree listing created successfully',
      201
    );
  } catch (error) {
    console.error('Create product error:', error);
    return ApiResponse.error(
      res,
      error.message || 'Failed to create product listing.',
      500
    );
  }
};

/**
 * @route   GET /api/products/admin
 * @desc    List all products with filtering, search, pagination, and dashboard summary stats
 * @access  Admin Only
 */
export const getAdminProducts = async (req, res) => {
  try {
    const {
      search = '',
      category = '',
      status = 'all',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    if (shouldUseMongoose()) {
      const query = {};

      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [{ title: searchRegex }, { sku: searchRegex }];
      }

      if (category && category !== 'all') {
        query.category = category;
      }

      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }

      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const [products, totalFiltered, allProductsSummary] = await Promise.all([
        Product.find(query).sort(sort).skip(skip).limit(limitNum),
        Product.countDocuments(query),
        Product.aggregate([
          {
            $group: {
              _id: null,
              totalProducts: { $sum: 1 },
              activeListings: {
                $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
              },
              totalStock: { $sum: '$stock' },
            },
          },
        ]),
      ]);

      const stats = allProductsSummary[0] || {
        totalProducts: 0,
        activeListings: 0,
        totalStock: 0,
      };
      stats.ordersReceived = 0;

      const totalPages = Math.ceil(totalFiltered / limitNum) || 1;

      return ApiResponse.success(
        res,
        {
          products,
          pagination: {
            total: totalFiltered,
            page: pageNum,
            limit: limitNum,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
          stats,
        },
        'Admin products retrieved successfully'
      );
    }

    // Dev Fallback
    let filtered = [...devProducts];
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    if (category && category !== 'all') {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (status === 'active') {
      filtered = filtered.filter((p) => p.isActive === true);
    } else if (status === 'inactive') {
      filtered = filtered.filter((p) => p.isActive === false);
    }

    const totalFiltered = filtered.length;
    const paginatedProducts = filtered.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(totalFiltered / limitNum) || 1;

    const stats = {
      totalProducts: devProducts.length,
      activeListings: devProducts.filter((p) => p.isActive).length,
      totalStock: devProducts.reduce((sum, p) => sum + p.stock, 0),
      ordersReceived: 0,
    };

    return ApiResponse.success(
      res,
      {
        products: paginatedProducts,
        pagination: {
          total: totalFiltered,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
        stats,
      },
      'Admin products retrieved successfully (dev mode)'
    );
  } catch (error) {
    console.error('getAdminProducts error:', error);
    return ApiResponse.error(res, 'Failed to fetch admin product list.', 500);
  }
};

/**
 * @route   GET /api/products/:id
 * @desc    Get single product details
 * @access  Public / Admin
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (shouldUseMongoose()) {
      const product = await Product.findById(id);
      if (!product) {
        return ApiResponse.error(res, 'Product not found.', 404);
      }
      return ApiResponse.success(res, product, 'Product retrieved successfully');
    }

    const found = devProducts.find((p) => p._id.toString() === id);
    if (!found) {
      return ApiResponse.error(res, 'Product not found.', 404);
    }
    return ApiResponse.success(res, found, 'Product retrieved successfully');
  } catch (error) {
    console.error('getProductById error:', error);
    return ApiResponse.error(res, 'Failed to fetch product details.', 500);
  }
};

/**
 * @route   PATCH /api/products/:id
 * @desc    Update a saree product listing
 * @access  Admin Only
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (shouldUseMongoose()) {
      const product = await Product.findById(id);
      if (!product) {
        return ApiResponse.error(res, 'Product not found.', 404);
      }

      if (updates.sku && updates.sku.trim().toUpperCase() !== product.sku) {
        const normalizedSku = updates.sku.trim().toUpperCase();
        const existingSku = await Product.findOne({ sku: normalizedSku });
        if (existingSku && existingSku._id.toString() !== id) {
          return ApiResponse.error(
            res,
            `A product with SKU "${normalizedSku}" already exists.`,
            409
          );
        }
        product.sku = normalizedSku;
      }

      if (updates.title !== undefined) product.title = updates.title.trim();
      if (updates.description !== undefined) product.description = updates.description.trim();
      if (updates.category !== undefined) product.category = updates.category;
      if (updates.fabric !== undefined) product.fabric = updates.fabric.trim();
      if (updates.price !== undefined) product.price = Number(updates.price);
      if (updates.stock !== undefined) product.stock = parseInt(updates.stock, 10);
      if (updates.isActive !== undefined) product.isActive = Boolean(updates.isActive);

      if (Array.isArray(updates.images) && updates.images.length > 0) {
        product.images = updates.images;
        if (!product.images.some((img) => img.isMain)) {
          product.images[0].isMain = true;
        }
      }

      await product.save();
      return ApiResponse.success(res, product, 'Product updated successfully');
    }

    // Dev Fallback
    const pIdx = devProducts.findIndex((p) => p._id.toString() === id);
    if (pIdx === -1) {
      return ApiResponse.error(res, 'Product not found.', 404);
    }

    const prod = devProducts[pIdx];
    if (updates.sku && updates.sku.trim().toUpperCase() !== prod.sku) {
      const normalizedSku = updates.sku.trim().toUpperCase();
      if (devProducts.some((p) => p.sku === normalizedSku && p._id.toString() !== id)) {
        return ApiResponse.error(
          res,
          `A product with SKU "${normalizedSku}" already exists.`,
          409
        );
      }
      prod.sku = normalizedSku;
    }

    if (updates.title !== undefined) prod.title = updates.title.trim();
    if (updates.description !== undefined) prod.description = updates.description.trim();
    if (updates.category !== undefined) prod.category = updates.category;
    if (updates.fabric !== undefined) prod.fabric = updates.fabric.trim();
    if (updates.price !== undefined) prod.price = Number(updates.price);
    if (updates.stock !== undefined) prod.stock = parseInt(updates.stock, 10);
    if (updates.isActive !== undefined) prod.isActive = Boolean(updates.isActive);
    if (Array.isArray(updates.images) && updates.images.length > 0) {
      prod.images = updates.images;
      if (!prod.images.some((img) => img.isMain)) {
        prod.images[0].isMain = true;
      }
    }
    prod.updatedAt = new Date();

    return ApiResponse.success(res, prod, 'Product updated successfully');
  } catch (error) {
    console.error('updateProduct error:', error);
    return ApiResponse.error(res, error.message || 'Failed to update product.', 500);
  }
};

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a saree product and its images from Cloudinary
 * @access  Admin Only
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (shouldUseMongoose()) {
      const product = await Product.findById(id);
      if (!product) {
        return ApiResponse.error(res, 'Product not found.', 404);
      }

      if (Array.isArray(product.images)) {
        for (const img of product.images) {
          if (img.publicId) {
            await CloudinaryService.deleteImage(img.publicId);
          }
        }
      }

      await Product.findByIdAndDelete(id);
      return ApiResponse.success(
        res,
        { id, title: product.title },
        'Product deleted successfully from MongoDB'
      );
    }

    const pIdx = devProducts.findIndex((p) => p._id.toString() === id);
    if (pIdx === -1) {
      return ApiResponse.error(res, 'Product not found.', 404);
    }

    const [deleted] = devProducts.splice(pIdx, 1);
    if (Array.isArray(deleted.images)) {
      for (const img of deleted.images) {
        if (img.publicId) {
          await CloudinaryService.deleteImage(img.publicId);
        }
      }
    }

    return ApiResponse.success(
      res,
      { id, title: deleted.title },
      'Product deleted successfully'
    );
  } catch (error) {
    console.error('deleteProduct error:', error);
    return ApiResponse.error(res, 'Failed to delete product.', 500);
  }
};

/**
 * @route   GET /api/products
 * @desc    Public customer endpoint to browse active sarees
 * @access  Public
 */
export const getPublicProducts = async (req, res) => {
  try {
    const {
      search = '',
      category = '',
      minPrice,
      maxPrice,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    if (shouldUseMongoose()) {
      const query = { isActive: true };

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ title: regex }, { description: regex }, { fabric: regex }, { sku: regex }];
      }

      if (category && category !== 'all' && category !== 'All Categories') {
        query.category = category;
      }

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }

      let sortOption = { createdAt: -1 };
      if (sort === 'price_asc') sortOption = { price: 1 };
      if (sort === 'price_desc') sortOption = { price: -1 };
      if (sort === 'oldest') sortOption = { createdAt: 1 };

      const [products, total] = await Promise.all([
        Product.find(query).sort(sortOption).skip(skip).limit(limitNum),
        Product.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limitNum) || 1;

      return ApiResponse.success(
        res,
        {
          products,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        },
        'Public sarees retrieved successfully'
      );
    }

    // Dev Fallback
    let list = devProducts.filter((p) => p.isActive);

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.fabric && p.fabric.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'all' && category !== 'All Categories') {
      list = list.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (minPrice) {
      list = list.filter((p) => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      list = list.filter((p) => p.price <= Number(maxPrice));
    }

    if (sort === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const total = list.length;
    const paginated = list.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(total / limitNum) || 1;

    return ApiResponse.success(
      res,
      {
        products: paginated,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
      'Public sarees retrieved successfully (dev mode)'
    );
  } catch (error) {
    console.error('getPublicProducts error:', error);
    return ApiResponse.error(res, 'Failed to retrieve saree collection.', 500);
  }
};

export const decrementDevProductStock = (productId, quantity) => {
  const prod = devProducts.find(
    (p) => p._id.toString() === productId?.toString()
  );
  if (prod) {
    prod.stock = Math.max(0, prod.stock - quantity);
    prod.updatedAt = new Date();
  }
};

export const getDevProductById = (productId) => {
  return devProducts.find(
    (p) => p._id.toString() === productId?.toString()
  );
};

export default {
  uploadProductImage,
  createProduct,
  getAdminProducts,
  getPublicProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  decrementDevProductStock,
  getDevProductById,
};

