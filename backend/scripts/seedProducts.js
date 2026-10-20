import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import Product from '../src/models/productModel.js';

const realisticSarees = [
  {
    title: 'Crimson Temple Border Kanjeevaram Silk Saree',
    sku: 'KANJ-CRIM-001',
    description: 'Authentic Kanchipuram handloom drape woven in pure crimson red mulberry silk. Features a classic korvai interlocking technique with gold-dipped silver zari temple borders and ornate peacock pallu motifs.',
    category: 'Kanjivaram',
    fabric: 'Pure Mulberry Silk',
    price: 28500,
    stock: 5,
    isActive: true,
    images: [
      {
        publicId: 'sarees/seed_kanj_1',
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
        alt: 'Crimson Kanjeevaram Silk Saree',
        isMain: true,
      },
    ],
  },
  {
    title: 'Midnight Blue Brocade Banarasi Katan Silk Saree',
    sku: 'BAN-BLUE-002',
    description: 'Woven over three weeks in Varanasi using the time-honored Kadwa technique where each gold zari butta is individually engraved. Opulent katan silk base in deep royal navy.',
    category: 'Banarasi',
    fabric: 'Pure Katan Silk',
    price: 34000,
    stock: 3,
    isActive: true,
    images: [
      {
        publicId: 'sarees/seed_ban_2',
        url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80',
        alt: 'Midnight Blue Banarasi Saree',
        isMain: true,
      },
    ],
  },
  {
    title: 'Ivory Gold Tissue Chanderi Silk Saree',
    sku: 'CHAN-IVO-003',
    description: 'Gossamer Chanderi cotton-silk drape characterized by its sheer, featherlight texture and handwoven gold zari micro-buttis. Ideal for auspicious day celebrations.',
    category: 'Chanderi',
    fabric: 'Cotton Silk Blend',
    price: 14500,
    stock: 7,
    isActive: true,
    images: [
      {
        publicId: 'sarees/seed_chan_3',
        url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
        alt: 'Ivory Gold Chanderi Saree',
        isMain: true,
      },
    ],
  },
  {
    title: 'Pastel Rose Gold Organza Handloom Saree',
    sku: 'ORG-ROSE-004',
    description: 'Ethereal sheer organza in subtle dusty rose pink. Features exquisite scalloped zari borders and delicate hand-embroidered floral sprigs throughout the body.',
    category: 'Organza',
    fabric: 'Pure Silk Organza',
    price: 19800,
    stock: 4,
    isActive: true,
    images: [
      {
        publicId: 'sarees/seed_org_4',
        url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
        alt: 'Pastel Rose Organza Saree',
        isMain: true,
      },
    ],
  },
  {
    title: 'Emerald Green Shikargah Banarasi Brocade Saree',
    sku: 'BAN-EMER-005',
    description: 'A regal collector masterpiece depicting imperial royal hunt and flora motifs in fine antique gold zari on rich emerald green silk. Silk Mark certified.',
    category: 'Banarasi',
    fabric: 'Pure Silk',
    price: 42000,
    stock: 2,
    isActive: true,
    images: [
      {
        publicId: 'sarees/seed_ban_5',
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
        alt: 'Emerald Green Banarasi Saree',
        isMain: true,
      },
    ],
  },
  {
    title: 'Mustard Gold Korvai Kanjeevaram Bridal Saree',
    sku: 'KANJ-MUST-006',
    description: 'Traditional Muhurtham yellow-gold silk adorned with contrast ruby red korvai temple borders and pure zari rudraksha motifs.',
    category: 'Kanjivaram',
    fabric: 'Pure Mulberry Silk',
    price: 36500,
    stock: 3,
    isActive: true,
    images: [
      {
        publicId: 'sarees/seed_kanj_6',
        url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80',
        alt: 'Mustard Gold Kanjeevaram Bridal Saree',
        isMain: true,
      },
    ],
  },
];

const seed = async () => {
  console.log('--- Seeding Realistic Handloom Sarees to MongoDB ---');
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Cannot seed: Database connection failed. Please check your credentials or MONGODB_URI in .env');
    process.exit(1);
  }

  try {
    for (const saree of realisticSarees) {
      const existing = await Product.findOne({ sku: saree.sku });
      if (existing) {
        await Product.updateOne({ _id: existing._id }, { $set: saree });
        console.log(`Updated: ${saree.sku} - ${saree.title}`);
      } else {
        await Product.create(saree);
        console.log(`Created: ${saree.sku} - ${saree.title}`);
      }
    }
    console.log('✅ Realistic saree catalog successfully seeded.');
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
