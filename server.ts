/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import * as path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db/jsonDb';
import { hashPassword, comparePassword, generateToken, verifyToken } from './server/utils/auth';
import { triggerOrderEmails, emailLogs } from './server/utils/emailService';
import { User, Vendor, Product, Order, Review, Coupon, ChatMessage } from './src/types';
import { WebSocketServer, WebSocket } from 'ws';
import { algoliasearch } from 'algoliasearch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API Middlewares
function authenticateToken(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token is required' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Session expired or token invalid' });
  }

  req.user = payload;
  next();
}

function requireRole(roles: ('customer' | 'vendor' | 'admin')[]) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient privileges.' });
    }
    next();
  };
}

// ==========================================
// WEBSOCKETS & ALGOLIA CLIENT CONFIGURATION
// ==========================================
const wsClients = new Map<WebSocket, { userId: string; role: string; wishlist?: string[] }>();

function broadcastOrderStatusChange(orderId: string, customerId: string, vendorId: string, status: string, message: string) {
  const payload = JSON.stringify({
    type: 'ORDER_STATUS_UPDATE',
    orderId,
    status,
    message,
    timestamp: new Date().toISOString()
  });

  wsClients.forEach((info, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      if (info.userId === customerId || info.userId === vendorId || info.role === 'admin') {
        try {
          ws.send(payload);
        } catch (err) {
          console.error('Error sending WS message:', err);
        }
      }
    }
  });
}

function broadcastWishlistNotification(product: Product, type: 'PRICE_DROP' | 'BACK_IN_STOCK', oldVal: number, newVal: number) {
  const message = type === 'PRICE_DROP'
    ? `Price dropped! "${product.title}" is now $${newVal.toFixed(2)} (was $${oldVal.toFixed(2)}).`
    : `Back in stock! "${product.title}" is now available to order.`;

  const payload = JSON.stringify({
    type: 'WISHLIST_NOTIFICATION',
    productId: product.id,
    updateType: type.toLowerCase(),
    message,
    product: {
      id: product.id,
      title: product.title,
      price: product.price,
      images: product.images,
      stock: product.stock,
    },
    timestamp: new Date().toISOString()
  });

  wsClients.forEach((info, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      if (info.wishlist && info.wishlist.includes(product.id)) {
        try {
          ws.send(payload);
          console.log(`Sent wishlist notification to client ${info.userId} for product ${product.id}`);
        } catch (err) {
          console.error('Error sending WS wishlist message:', err);
        }
      }
    }
  });
}

let algoliaClient: any = null;

function getAlgoliaIndex() {
  if (!algoliaClient) {
    const appId = process.env.ALGOLIA_APP_ID;
    const apiKey = process.env.ALGOLIA_API_KEY;
    if (appId && apiKey) {
      try {
        algoliaClient = algoliasearch(appId, apiKey);
        console.log(`Algolia search client initialized successfully for index: ${process.env.ALGOLIA_INDEX_NAME || 'nexus_products'}`);
      } catch (err) {
        console.error('Error initializing Algolia client:', err);
      }
    }
  }
  return algoliaClient;
}

async function syncProductToAlgolia(product: Product) {
  const client = getAlgoliaIndex();
  if (!client) return;
  try {
    const indexName = process.env.ALGOLIA_INDEX_NAME || 'nexus_products';
    const record = {
      objectID: product.id,
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
      category: product.category,
      images: product.images,
      vendorId: product.vendorId,
      vendorName: product.vendorName,
      avgRating: product.avgRating,
      totalReviews: product.totalReviews,
      createdAt: product.createdAt,
    };
    if (typeof client.saveObject === 'function') {
      await client.saveObject({ indexName, body: record });
    } else {
      await client.saveObjects({ indexName, objects: [record] });
    }
    console.log(`Successfully synced product to Algolia: ${product.id}`);
  } catch (err) {
    console.error(`Algolia sync failed for product ${product.id}:`, err);
  }
}

async function deleteProductFromAlgolia(productId: string) {
  const client = getAlgoliaIndex();
  if (!client) return;
  try {
    const indexName = process.env.ALGOLIA_INDEX_NAME || 'nexus_products';
    if (typeof client.deleteObject === 'function') {
      await client.deleteObject({ indexName, objectID: productId });
    } else {
      await client.deleteObjects({ indexName, objectIDs: [productId] });
    }
    console.log(`Successfully deleted product from Algolia: ${productId}`);
  } catch (err) {
    console.error(`Algolia delete failed for product ${productId}:`, err);
  }
}

// ==========================================
// 1. AUTHENTICATION & PROFILE APIS
// ==========================================

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }

  const existing = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const userId = `usr_${Date.now()}`;
  const newUser: User = {
    id: userId,
    name,
    email: email.toLowerCase(),
    password: hashPassword(password),
    role: role as any,
    createdAt: new Date().toISOString(),
  };

  db.addUser(newUser);

  // If registering as vendor, create pending vendor Profile
  if (role === 'vendor') {
    const newVendor: Vendor = {
      id: userId,
      userId: userId,
      storeName: req.body.storeName || `${name}'s Store`,
      description: req.body.storeDescription || 'A brand new artisanal vendor shop on our marketplace.',
      phone: req.body.phone || '',
      address: req.body.address || '',
      bankAccount: req.body.bankAccount || '',
      status: 'pending',
      totalEarnings: 0,
      createdAt: new Date().toISOString(),
    };
    db.addVendor(newVendor);
  }

  const token = generateToken({ id: userId, email: newUser.email, role: newUser.role, name: newUser.name });
  
  // Exclude password in response
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: userWithoutPassword,
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !user.password || !comparePassword(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  
  let vendorProfile: Vendor | undefined;
  if (user.role === 'vendor') {
    vendorProfile = db.getVendors().find(v => v.userId === user.id);
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    message: 'Login successful',
    token,
    user: userWithoutPassword,
    vendor: vendorProfile,
  });
});

app.get('/api/auth/me', authenticateToken, (req: any, res: Response) => {
  const user = db.getUsers().find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let vendorProfile: Vendor | undefined;
  if (user.role === 'vendor') {
    vendorProfile = db.getVendors().find(v => v.userId === user.id);
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    user: userWithoutPassword,
    vendor: vendorProfile,
  });
});

app.put('/api/auth/profile', authenticateToken, (req: any, res: Response) => {
  const { name, phone, address, storeName, description, logoUrl, bankAccount } = req.body;
  const userId = req.user.id;

  const success = db.updateUser(userId, { name, phone, address });
  if (!success) {
    return res.status(404).json({ error: 'User settings could not be updated' });
  }

  if (req.user.role === 'vendor') {
    db.updateVendorProfile(userId, { storeName, description, logoUrl, phone, address, bankAccount });
  }

  const user = db.getUsers().find(u => u.id === userId);
  let vendor: Vendor | undefined;
  if (user?.role === 'vendor') {
    vendor = db.getVendors().find(v => v.userId === userId);
  }

  const { password: _, ...userWithoutPassword } = user as User;
  res.json({
    message: 'Profile settings saved successfully',
    user: userWithoutPassword,
    vendor,
  });
});

// For password reset/forgot mock features
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = db.getUsers().find(u => u.email.toLowerCase() === email?.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found with this email' });
  }
  res.json({ message: 'Password recovery email simulated successfully. In production, this fires an authenticated SMTP mail. Try log in with password123.' });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  const user = db.getUsers().find(u => u.email.toLowerCase() === email?.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found with this email' });
  }
  db.updateUser(user.id, { password: hashPassword(newPassword) });
  res.json({ message: 'Password updated successfully! Try logging in now.' });
});


// ==========================================
// 2. PRODUCT & CATEGORY APIS
// ==========================================

app.get('/api/products', async (req: Request, res: Response) => {
  const search = (req.query.search as string) || '';
  const category = (req.query.category as string) || 'all';
  const sort = (req.query.sort as string) || 'newest';

  const client = getAlgoliaIndex();
  
  if (client && (search || (category && category !== 'all'))) {
    try {
      const indexName = process.env.ALGOLIA_INDEX_NAME || 'nexus_products';
      let filters = '';
      if (category && category !== 'all') {
        filters = `category:${category}`;
      }

      console.log(`Running Algolia query: "${search}" [Filters: "${filters}"]`);
      let results: any[] = [];
      const indexObj = typeof client.initIndex === 'function' ? client.initIndex(indexName) : null;

      if (indexObj) {
        const response = await indexObj.search(search, {
          filters: filters || undefined,
          typoTolerance: true,
        });
        results = response.hits;
      } else {
        const response = await client.search({
          queries: [
            {
              indexName,
              query: search,
              filters: filters || undefined,
              typoTolerance: true,
            }
          ]
        });
        results = (response.results[0] as any).hits || [];
      }

      const products = results.map(hit => ({
        id: hit.id || hit.objectID,
        title: hit.title,
        description: hit.description,
        price: hit.price,
        originalPrice: hit.originalPrice,
        stock: hit.stock,
        category: hit.category,
        images: hit.images,
        vendorId: hit.vendorId,
        vendorName: hit.vendorName,
        avgRating: hit.avgRating,
        totalReviews: hit.totalReviews,
        createdAt: hit.createdAt,
      }));

      if (sort === 'price-asc') {
        products.sort((a, b) => a.price - b.price);
      } else if (sort === 'price-desc') {
        products.sort((a, b) => b.price - a.price);
      } else if (sort === 'rating') {
        products.sort((a, b) => b.avgRating - a.avgRating);
      } else {
        products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      return res.json(products);
    } catch (err) {
      console.error('Algolia query failed, falling back to db search:', err);
    }
  }

  let products = db.getProducts();

  // Search
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  // Category
  if (category && category !== 'all') {
    products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  // Sorting
  if (sort === 'price-asc') {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    products.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating') {
    products.sort((a, b) => b.avgRating - a.avgRating);
  } else {
    // default: newest
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json(products);
});

app.get('/api/categories', (req: Request, res: Response) => {
  res.json(db.getCategories());
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  const product = db.getProducts().find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const reviews = db.getReviews().filter(r => r.productId === product.id);
  res.json({ product, reviews });
});

// Add Product - Vendor Only
app.post('/api/products', authenticateToken, requireRole(['vendor']), (req: any, res: Response) => {
  const { title, description, price, originalPrice, stock, category, images } = req.body;
  const vendorId = req.user.id;

  const vendor = db.getVendors().find(v => v.userId === vendorId);
  if (!vendor || vendor.status !== 'approved') {
    return res.status(403).json({ error: 'Only approved vendors can list new catalog items' });
  }

  if (!title || !description || !price || stock === undefined || !category) {
    return res.status(400).json({ error: 'Title, description, price, stock, and category are required' });
  }

  const newProduct: Product = {
    id: `prod_${Date.now()}`,
    title,
    description,
    price: Float(price),
    originalPrice: originalPrice ? Float(originalPrice) : undefined,
    stock: Int(stock),
    category,
    images: images && images.length ? images : ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80'],
    vendorId,
    vendorName: vendor.storeName,
    avgRating: 0,
    totalReviews: 0,
    createdAt: new Date().toISOString(),
  };

  db.addProduct(newProduct);
  syncProductToAlgolia(newProduct).catch(e => console.error('Algolia sync error:', e));
  res.status(201).json({ message: 'Product published successfully', product: newProduct });
});

// Bulk Add Products - Vendor Only
app.post('/api/products/bulk', authenticateToken, requireRole(['vendor']), (req: any, res: Response) => {
  const { products } = req.body;
  const vendorId = req.user.id;

  const vendor = db.getVendors().find(v => v.userId === vendorId);
  if (!vendor || vendor.status !== 'approved') {
    return res.status(403).json({ error: 'Only approved vendors can list new catalog items' });
  }

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'A non-empty list of products is required' });
  }

  const addedProducts: Product[] = [];
  const errors: string[] = [];

  for (let i = 0; i < products.length; i++) {
    const { title, description, price, originalPrice, stock, category, images } = products[i];
    const rowNum = i + 1;

    if (!title || !title.trim()) {
      errors.push(`Row ${rowNum}: Title is missing.`);
      continue;
    }
    if (!description || !description.trim()) {
      errors.push(`Row ${rowNum}: Description is missing.`);
      continue;
    }
    if (price === undefined || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      errors.push(`Row ${rowNum}: Price "${price}" is invalid (must be a positive number).`);
      continue;
    }
    if (stock === undefined || isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0) {
      errors.push(`Row ${rowNum}: Stock "${stock}" is invalid (must be a non-negative integer).`);
      continue;
    }
    if (!category || !category.trim()) {
      errors.push(`Row ${rowNum}: Category is missing.`);
      continue;
    }

    const parsedImages = images && images.length 
      ? (Array.isArray(images) ? images : [images]) 
      : ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80'];

    const newProduct: Product = {
      id: `prod_bulk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title,
      description,
      price: Float(price),
      originalPrice: originalPrice ? Float(originalPrice) : undefined,
      stock: Int(stock),
      category: category.trim().toLowerCase(),
      images: parsedImages,
      vendorId,
      vendorName: vendor.storeName,
      avgRating: 0,
      totalReviews: 0,
      createdAt: new Date().toISOString(),
    };

    db.addProduct(newProduct);
    syncProductToAlgolia(newProduct).catch(e => console.error('Algolia sync error:', e));
    addedProducts.push(newProduct);
  }

  res.status(201).json({
    message: `Processed ${products.length} entries. Successfully added ${addedProducts.length} products.`,
    addedCount: addedProducts.length,
    added: addedProducts,
    errors: errors.length ? errors : undefined,
  });
});

// Update Product
app.put('/api/products/:id', authenticateToken, requireRole(['vendor', 'admin']), (req: any, res: Response) => {
  const { title, description, price, originalPrice, stock, category, images } = req.body;
  const productId = req.params.id;

  const product = db.getProducts().find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Only vendor owner or admin can edit
  if (req.user.role !== 'admin' && product.vendorId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to edit other vendors products' });
  }

  const updates: Partial<Product> = {};
  if (title) updates.title = title;
  if (description) updates.description = description;
  if (price !== undefined) updates.price = Float(price);
  if (originalPrice !== undefined) updates.originalPrice = Float(originalPrice);
  if (stock !== undefined) updates.stock = Int(stock);
  if (category) updates.category = category;
  if (images) updates.images = images;

  const oldPrice = product.price;
  const newPrice = price !== undefined ? Float(price) : product.price;
  const isPriceDropped = price !== undefined && newPrice < oldPrice;

  const oldStock = product.stock;
  const newStock = stock !== undefined ? Int(stock) : product.stock;
  const isBackInStock = stock !== undefined && oldStock === 0 && newStock > 0;

  db.updateProduct(productId, updates);
  
  const updatedProduct = { ...product, ...updates };

  if (isPriceDropped) {
    try {
      broadcastWishlistNotification(updatedProduct, 'PRICE_DROP', oldPrice, newPrice);
    } catch (err) {
      console.error('Wishlist notification error (price):', err);
    }
  }

  if (isBackInStock) {
    try {
      broadcastWishlistNotification(updatedProduct, 'BACK_IN_STOCK', oldStock, newStock);
    } catch (err) {
      console.error('Wishlist notification error (stock):', err);
    }
  }

  syncProductToAlgolia(updatedProduct).catch(e => console.error('Algolia sync error:', e));
  res.json({ message: 'Product updated successfully', product: updatedProduct });
});

// Simulate Wishlist Deal/Restock Alerts for immediate testing
app.post('/api/products/:id/simulate-deal', (req: Request, res: Response) => {
  const { type } = req.body; // 'price_drop' | 'back_in_stock'
  const productId = req.params.id;
  const product = db.getProducts().find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (type === 'price_drop') {
    const oldPrice = product.price;
    const newPrice = Float((oldPrice * 0.85).toFixed(2)); // 15% discount
    db.updateProduct(productId, { price: newPrice });
    try {
      broadcastWishlistNotification({ ...product, price: newPrice }, 'PRICE_DROP', oldPrice, newPrice);
    } catch (err) {
      console.error('Wishlist notify price error:', err);
    }
    return res.json({ message: 'Price drop simulated and broadcasted successfully!', price: newPrice });
  } else if (type === 'back_in_stock') {
    const oldStock = product.stock;
    const newStock = oldStock === 0 ? 15 : oldStock + 10;
    db.updateProduct(productId, { stock: newStock });
    try {
      broadcastWishlistNotification({ ...product, stock: newStock }, 'BACK_IN_STOCK', oldStock, newStock);
    } catch (err) {
      console.error('Wishlist notify stock error:', err);
    }
    return res.json({ message: 'Back-in-stock simulated and broadcasted successfully!', stock: newStock });
  }

  res.status(400).json({ error: 'Invalid simulation type' });
});

// Delete Product
app.delete('/api/products/:id', authenticateToken, requireRole(['vendor', 'admin']), (req: any, res: Response) => {
  const productId = req.params.id;
  const product = db.getProducts().find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (req.user.role !== 'admin' && product.vendorId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to delete this product' });
  }

  db.deleteProduct(productId);
  deleteProductFromAlgolia(productId).catch(e => console.error('Algolia delete error:', e));
  res.json({ message: 'Product deleted successfully' });
});


// ==========================================
// 3. CART, WISHLIST, COUPON, & REVIEW APIS
// ==========================================

app.post('/api/coupons/apply', (req: Request, res: Response) => {
  const { code, amount } = req.body;
  const coupon = db.getCoupons().find(c => c.code.toUpperCase() === code?.toUpperCase() && c.active);

  if (!coupon) {
    return res.status(400).json({ error: 'Invalid or expired discount coupon' });
  }

  if (coupon.minAmount && amount < coupon.minAmount) {
    return res.status(400).json({ error: `This coupon requires a minimum subtotal of $${coupon.minAmount}` });
  }

  const couponType = coupon.type || 'percentage';
  let discount = 0;
  let isFreeShipping = false;

  if (couponType === 'percentage') {
    discount = Float((amount * ((coupon.discountPercent || 0) / 100)).toFixed(2));
  } else if (couponType === 'fixed_amount') {
    discount = Float(Math.min(amount, coupon.discountValue || coupon.discountPercent || 0).toFixed(2));
  } else if (couponType === 'free_shipping') {
    discount = 15.00; // Simulated shipping cost rebate
    isFreeShipping = true;
  }

  res.json({
    message: isFreeShipping 
      ? 'Free Shipping coupon applied successfully!' 
      : `Coupon applied successfully! Saved $${discount}`,
    code: coupon.code,
    discountPercent: coupon.discountPercent || 0,
    discountAmount: discount,
    type: couponType,
    discountValue: coupon.discountValue || 0,
    isFreeShipping,
  });
});

app.post('/api/products/:id/review', authenticateToken, requireRole(['customer']), (req: any, res: Response) => {
  const productId = req.params.id;
  const { rating, comment } = req.body;

  if (rating === undefined || !comment) {
    return res.status(400).json({ error: 'Rating (1-5) and comment are required' });
  }

  const product = db.getProducts().find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Verify that the customer has actually purchased this product
  const hasPurchased = db.getOrders().some(o => 
    o.customerId === req.user.id && 
    o.items.some(item => item.productId === productId)
  );

  if (!hasPurchased) {
    return res.status(403).json({ 
      error: 'Access Denied. You are only permitted to submit reviews for products you have verified and purchased on ShopSphere.' 
    });
  }

  const newReview: Review = {
    id: `rev_${Date.now()}`,
    productId,
    userId: req.user.id,
    userName: req.user.name,
    rating: Int(rating),
    comment,
    createdAt: new Date().toISOString(),
    verified: true
  };

  db.addReview(newReview);
  res.status(201).json({ message: 'Review posted successfully', review: newReview });
});


// ==========================================
// 4. ORDER & SECURE CHECKOUT APIS
// ==========================================

app.post('/api/orders', authenticateToken, requireRole(['customer']), (req: any, res: Response) => {
  const { items, shippingAddress, paymentMethod, couponCode } = req.body;

  if (!items || !items.length || !shippingAddress) {
    return res.status(400).json({ error: 'Cart items and complete delivery address are required' });
  }

  let calculatedAmt = 0;
  const orderItems: any[] = [];

  for (const item of items) {
    const product = db.getProducts().find(p => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ error: `Product not found: ${item.productId}` });
    }

    if (product.stock < item.quantity) {
      return res.status(400).json({ error: `Not enough stock available for: ${product.title}` });
    }

    calculatedAmt += product.price * item.quantity;
    
    orderItems.push({
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity: item.quantity,
      image: product.images[0],
      vendorId: product.vendorId,
      status: 'pending',
    });
  }

  // Deduct coupon discount if valid
  let discountAmount = 0;
  if (couponCode) {
    const coupon = db.getCoupons().find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
    if (coupon && (!coupon.minAmount || calculatedAmt >= coupon.minAmount)) {
      const couponType = coupon.type || 'percentage';
      if (couponType === 'percentage') {
        discountAmount = Float((calculatedAmt * ((coupon.discountPercent || 0) / 100)).toFixed(2));
      } else if (couponType === 'fixed_amount') {
        discountAmount = Float(Math.min(calculatedAmt, coupon.discountValue || coupon.discountPercent || 0).toFixed(2));
      } else if (couponType === 'free_shipping') {
        discountAmount = 15.00; // Simulated shipping costs rebate
      }
    }
  }

  const finalAmount = Float((calculatedAmt - discountAmount).toFixed(2));

  // Reduce inventory stocks & credit active vendors immediately upon successful payment
  orderItems.forEach(item => {
    const product = db.getProducts().find(p => p.id === item.productId);
    if (product) {
      db.updateProduct(item.productId, { stock: Math.max(0, product.stock - item.quantity) });
    }
    // Record earnings for the vendor (simulation)
    db.updateVendorEarnings(item.vendorId, item.price * item.quantity);
  });

  const orderId = `ord_${Date.now()}`;
  const newOrder: Order = {
    id: orderId,
    customerId: req.user.id,
    customerName: req.user.name,
    customerEmail: req.user.email,
    items: orderItems,
    totalAmount: finalAmount,
    discountAmount,
    shippingAddress,
    paymentMethod,
    paymentStatus: paymentMethod === 'COD' ? 'pending' : 'paid',
    paymentId: paymentMethod === 'COD' ? undefined : `pay_rzp_mock_${Math.random().toString(36).substring(3, 10).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };

  db.addOrder(newOrder);

  // Trigger outbound email notifications using API to customer and relevant vendors
  triggerOrderEmails(newOrder).catch(err => console.error('Outbound email notification warning:', err));

  // Broadcast live notifications to the customer and the involved sellers
  try {
    orderItems.forEach(item => {
      broadcastOrderStatusChange(
        orderId,
        req.user.id,
        item.vendorId,
        'pending',
        `New order #${orderId} placed for "${item.title}" (${item.quantity} counts).`
      );
    });
  } catch (wsErr) {
    console.error('Failed to broadcast real-time order placement notifications:', wsErr);
  }

  res.status(201).json({ message: 'Order submitted and verified successfully', order: newOrder });
});

app.post('/api/orders/:orderId/rate', authenticateToken, requireRole(['customer']), (req: any, res: Response) => {
  const { orderId } = req.params;
  const { rating, comment } = req.body;

  if (rating === undefined || !comment) {
    return res.status(400).json({ error: 'Rating (1-5) and feedback comment are required.' });
  }

  const order = db.getOrders().find(o => o.id === orderId && o.customerId === req.user.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found or access denied.' });
  }

  // Submit product reviews for every item in this order
  order.items.forEach(item => {
    const reviews = db.getReviews();
    const alreadyReviewed = reviews.some(r => r.productId === item.productId && r.userId === req.user.id);
    if (!alreadyReviewed) {
      const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newReview: Review = {
        id: reviewId,
        productId: item.productId,
        userId: req.user.id,
        userName: req.user.name,
        rating: Number(rating),
        comment: comment,
        createdAt: new Date().toISOString(),
        verified: true
      };
      db.addReview(newReview);
    }
  });

  const success = db.rateOrder(orderId, Number(rating), comment);
  if (!success) {
    return res.status(404).json({ error: 'Could not complete order rating.' });
  }

  res.json({ message: 'Your rating and feedback have been successfully submitted!' });
});

app.get('/api/orders/customer', authenticateToken, requireRole(['customer']), (req: any, res: Response) => {
  const orders = db.getOrders().filter(o => o.customerId === req.user.id);
  res.json(orders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

// Order tracking public lookup API
app.get('/api/orders/track/:orderId', (req: Request, res: Response) => {
  const order = db.getOrders().find(o => o.id === req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// Vendor orders endpoint - Orders which contain products belonging to the active vendor
app.get('/api/orders/vendor', authenticateToken, requireRole(['vendor']), (req: any, res: Response) => {
  const vendorId = req.user.id;
  const allOrders = db.getOrders();
  
  const vendorOrders = allOrders.filter(order => 
    order.items.some(item => item.vendorId === vendorId)
  ).map(order => {
    // Return only active items sold by this vendor to secure multi-vendor boundary
    const filteredItems = order.items.filter(item => item.vendorId === vendorId);
    const vendorSubtotal = filteredItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    return {
      ...order,
      items: filteredItems,
      totalAmount: vendorSubtotal, // vendor subtotal
    };
  });

  res.json(vendorOrders);
});

// GET /api/emails - Secure notification & mail alert log viewer
app.get('/api/emails', authenticateToken, (req: any, res: Response) => {
  const user = req.user;
  if (user.role === 'admin') {
    return res.json(emailLogs);
  }
  // Customers/vendors can only see emails sent to their verified email address
  const filtered = emailLogs.filter(log => log.recipient.toLowerCase() === user.email.toLowerCase());
  res.json(filtered);
});

// Update single product status in an order
app.put('/api/orders/:orderId/status', authenticateToken, requireRole(['vendor', 'admin']), (req: any, res: Response) => {
  const { orderId } = req.params;
  const { productId, status } = req.body;
  const vendorId = req.user.id;

  if (!productId || !status) {
    return res.status(400).json({ error: 'Product ID and new status are required' });
  }

  // Find order before updating so we can grab product names/customer IDs
  const order = db.getOrders().find(o => o.id === orderId);

  // Verification step
  const success = db.updateOrderStatus(orderId, req.user.role === 'admin' ? req.body.vendorId : vendorId, productId, status);
  if (!success) {
    return res.status(404).json({ error: 'Product item in specified order not found.' });
  }

  if (order) {
    const item = order.items.find(i => i.productId === productId);
    const itemTitle = item ? item.title : 'Your item';
    // Notify customer, vendor, and admins
    try {
      broadcastOrderStatusChange(
        orderId,
        order.customerId,
        req.user.role === 'admin' ? (req.body.vendorId || '') : vendorId,
        status,
        `Item "${itemTitle}" from Order #${orderId} has been updated to "${status}".`
      );
    } catch (wsErr) {
      console.error('Error broadcasting websocket order status update:', wsErr);
    }
  }

  res.json({ message: 'Order unit status updated successfully' });
});


// Change Shipping Address (Up to 2 days until order gets shipped)
app.put('/api/orders/:orderId/address', authenticateToken, requireRole(['customer']), (req: any, res: Response) => {
  const { orderId } = req.params;
  const { shippingAddress } = req.body;
  
  if (!shippingAddress) {
    return res.status(400).json({ error: 'Shipping address object is required' });
  }

  const order = db.getOrders().find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.customerId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const hoursPassed = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursPassed > 48) {
    return res.status(400).json({ error: 'Address change timeframe of 2 days has expired.' });
  }

  const isAnyShippedOrDelivered = order.items.some(item => 
    item.status === 'shipped' || item.status === 'delivered' || item.status === 'cancelled'
  );
  if (isAnyShippedOrDelivered) {
    return res.status(400).json({ error: 'Cannot change address because items in this order have already been processed, shipped, or cancelled.' });
  }

  order.shippingAddress = shippingAddress;
  db.saveCollection('orders');

  res.json({ message: 'Shipping address updated successfully', order });
});

// Cancel Order (Up to 2 days after order is placed)
app.post('/api/orders/:orderId/cancel', authenticateToken, requireRole(['customer']), (req: any, res: Response) => {
  const { orderId } = req.params;

  const order = db.getOrders().find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.customerId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const hoursPassed = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursPassed > 48) {
    return res.status(400).json({ error: 'Cancellation timeframe of 2 days has expired.' });
  }

  const isAnyShippedOrDelivered = order.items.some(item => 
    item.status === 'shipped' || item.status === 'delivered'
  );
  if (isAnyShippedOrDelivered) {
    return res.status(400).json({ error: 'This order cannot be cancelled because it contains items that have already been shipped or delivered.' });
  }

  // Restore inventory, deduct vendor earnings, set item status to cancelled
  order.items.forEach(item => {
    if (item.status !== 'cancelled') {
      item.status = 'cancelled';
      
      const product = db.getProducts().find(p => p.id === item.productId);
      if (product) {
        db.updateProduct(item.productId, { stock: product.stock + item.quantity });
      }
      
      // Reverse earning
      db.updateVendorEarnings(item.vendorId, -(item.price * item.quantity));
    }
  });

  db.saveCollection('orders');

  res.json({ message: 'Order has been successfully cancelled and stock replenished', order });
});

// Exchange/Return Request after delivery
app.post('/api/orders/:orderId/items/:productId/return-exchange', authenticateToken, requireRole(['customer']), (req: any, res: Response) => {
  const { orderId, productId } = req.params;
  const { type, reason, details } = req.body;

  if (!type || !reason) {
    return res.status(400).json({ error: 'Type (return/exchange) and reason are required' });
  }

  const order = db.getOrders().find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.customerId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const item = order.items.find(i => i.productId === productId);
  if (!item) {
    return res.status(404).json({ error: 'Product item not found in this order' });
  }

  if (item.status !== 'delivered') {
    return res.status(400).json({ error: 'Only delivered items can be returned or exchanged.' });
  }

  // Attach a returnRequest field to the order item
  (item as any).returnRequest = {
    type,
    reason,
    details: details || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.saveCollection('orders');

  res.json({ message: `Your request for ${type} has been registered and is under verification.`, order });
});


// ==========================================
// 5. CHAT / COMMUNICATION CHANNEL APIS
// ==========================================

app.get('/api/chats', authenticateToken, (req: any, res: Response) => {
  const userId = req.user.id;
  const messages = db.getMessages().filter(m => m.senderId === userId || m.receiverId === userId);
  res.json(messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
});

app.post('/api/chats', authenticateToken, (req: any, res: Response) => {
  const { receiverId, message } = req.body;
  const senderId = req.user.id;

  if (!receiverId || !message) {
    return res.status(400).json({ error: 'Receiver ID and chat message content are required' });
  }

  const newMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    senderId,
    receiverId,
    message,
    createdAt: new Date().toISOString(),
  };

  db.addMessage(newMessage);
  res.status(201).json(newMessage);
});


// ==========================================
// 6. ADMINISTRATIVE & ANALYTICS PANELS APIS
// ==========================================

// Get analytical performance dashboard matrices
app.get('/api/analytics', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const allUsers = db.getUsers();
  const allVendors = db.getVendors();
  const allProducts = db.getProducts();
  const allOrders = db.getOrders();

  const totalUsers = allUsers.length;
  const totalVendors = allVendors.length;
  const totalProducts = allProducts.length;
  const totalOrders = allOrders.length;
  
  // Calculate total platform revenue from actual paid/delivered receipts
  const revenueOverview = allOrders.reduce((sum, order) => {
    if (order.paymentStatus === 'paid') {
      return sum + order.totalAmount;
    }
    return sum;
  }, 0);

  // Best Selling Products calculation
  const salesMap: Record<string, { title: string; price: number; sales: number; revenue: number }> = {};
  allOrders.forEach(o => {
    o.items.forEach(item => {
      if (!salesMap[item.productId]) {
        salesMap[item.productId] = { title: item.title, price: item.price, sales: 0, revenue: 0 };
      }
      salesMap[item.productId].sales += item.quantity;
      salesMap[item.productId].revenue += item.price * item.quantity;
    });
  });

  const bestSelling = Object.values(salesMap)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Vendor Performance Overview
  const vendorPerformance = allVendors.map(vendor => {
    const productsListedCount = allProducts.filter(p => p.vendorId === vendor.userId).length;
    return {
      vendorId: vendor.userId,
      storeName: vendor.storeName,
      status: vendor.status,
      earnings: vendor.totalEarnings,
      productsCount: productsListedCount,
    };
  });

  res.json({
    totalUsers,
    totalVendors,
    totalProducts,
    totalOrders,
    revenueOverview: parseFloat(revenueOverview.toFixed(2)),
    bestSelling,
    vendorPerformance,
  });
});

// Admin list vendors
app.get('/api/admin/vendors', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  res.json(db.getVendors());
});

// Admin Approved Vendor Accounts
app.put('/api/admin/vendors/:id/status', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const vendorId = req.params.id;
  const { status } = req.body; // 'approved' | 'rejected'

  if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Status is invalid' });
  }

  const success = db.updateVendorStatus(vendorId, status);
  if (!success) {
    return res.status(404).json({ error: 'Vendor profile not found' });
  }

  res.json({ message: `Vendor marketplace status updated to ${status} successfully!` });
});

// Admin List Users
app.get('/api/admin/users', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const users = db.getUsers().map(u => {
    const { password, ...safeUser } = u;
    return safeUser;
  });
  res.json(users);
});

// ==========================================
// ADMIN COUPON & DISC SYSTEM APIS
// ==========================================

// 1. List all Coupons on platform - Admin only
app.get('/api/admin/coupons', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  res.json(db.getCoupons());
});

// 2. Clear / Delete Coupon - Admin only
app.delete('/api/admin/coupons/:code', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const { code } = req.params;
  const deleted = db.deleteCoupon(code);
  if (!deleted) {
    return res.status(404).json({ error: 'Coupon code not found' });
  }
  res.json({ message: `Successfully deleted coupon: ${code}` });
});

// 3. Create or register unique coupon - Admin only
app.post('/api/admin/coupons', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const { code, discountPercent, description, active, minAmount, type, discountValue } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Coupon code string is required' });
  }

  const existing = db.getCoupons().find(c => c.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    return res.status(400).json({ error: 'A coupon with this code already exists' });
  }

  const newCoupon: Coupon = {
    code: code.toUpperCase(),
    discountPercent: Float(discountPercent || 0),
    description: description || `${code} coupon`,
    active: active !== false,
    minAmount: minAmount ? Float(minAmount) : undefined,
    type: type || 'percentage',
    discountValue: discountValue ? Float(discountValue) : undefined,
  };

  db.addCoupon(newCoupon);
  res.status(201).json({ message: 'New coupon configured successfully!', coupon: newCoupon });
});

// 4. Update existing coupon settings (Toggle Active/Inactives, values)
app.put('/api/admin/coupons/:code', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const { code } = req.params;
  const { active, discountPercent, description, minAmount, type, discountValue } = req.body;

  const coupon = db.getCoupons().find(c => c.code.toUpperCase() === code.toUpperCase());
  if (!coupon) {
    return res.status(404).json({ error: 'Coupon not found' });
  }

  if (active !== undefined) coupon.active = active;
  if (discountPercent !== undefined) coupon.discountPercent = Float(discountPercent);
  if (description !== undefined) coupon.description = description;
  if (minAmount !== undefined) coupon.minAmount = minAmount ? Float(minAmount) : undefined;
  if (type !== undefined) coupon.type = type;
  if (discountValue !== undefined) coupon.discountValue = Float(discountValue);

  db.saveCollection('coupons');
  res.json({ message: 'Coupon updated successfully', coupon });
});

// ==========================================
// ADMIN ALGOLIA SERVICES APIS
// ==========================================
app.post('/api/admin/algolia/sync', authenticateToken, requireRole(['admin']), async (req: Request, res: Response) => {
  const client = getAlgoliaIndex();
  if (!client) {
    return res.status(400).json({ error: 'Algolia integration variables not found in environmental configuration' });
  }

  try {
    const products = db.getProducts();
    const indexName = process.env.ALGOLIA_INDEX_NAME || 'nexus_products';
    const records = products.map(product => ({
      objectID: product.id,
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
      category: product.category,
      images: product.images,
      vendorId: product.vendorId,
      vendorName: product.vendorName,
      avgRating: product.avgRating,
      totalReviews: product.totalReviews,
      createdAt: product.createdAt,
    }));

    if (typeof client.saveObjects === 'function') {
      await client.saveObjects({ indexName, objects: records });
    } else {
      await client.saveObjects({ indexName, objects: records });
    }

    try {
      if (typeof client.setSettings === 'function') {
        await client.setSettings({
          indexName,
          indexSettings: {
            searchableAttributes: ['title', 'description', 'category', 'vendorName'],
            attributesForFaceting: ['category', 'vendorId'],
            typoTolerance: true,
            minWordSizefor1Typo: 4,
            minWordSizefor2Typos: 8,
          }
        });
      }
    } catch (settErr) {
      console.warn('Algolia index setSettings warning:', settErr);
    }

    res.json({ message: `Successfully synced ${products.length} product records with typo settings into Algolia!` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Seeding of Algolia indices failed' });
  }
});


// Helper casting functions
function Float(val: any): number {
  const v = parseFloat(val);
  return isNaN(v) ? 0 : v;
}

function Int(val: any): number {
  const v = parseInt(val, 10);
  return isNaN(v) ? 0 : v;
}

// ==========================================
// STATIC ASSET SERVING & VITE BUILD AGENT
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving compiled client bundle
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server launched successfully at: http://0.0.0.0:${PORT}`);
  });

  // Attach the WebSocket server to the Express server
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const urlParams = new URLSearchParams(req.url?.split('?')[1] || '');
    const token = urlParams.get('token');

    if (token) {
      try {
        const payload = verifyToken(token) as any;
        if (payload) {
          wsClients.set(ws, { userId: payload.id, role: payload.role });
          console.log(`WebSocket client authenticated on connect: ${payload.name} (${payload.id})`);
        } else {
          wsClients.set(ws, { userId: 'anonymous', role: 'guest' });
        }
      } catch (err) {
        wsClients.set(ws, { userId: 'anonymous', role: 'guest' });
      }
    } else {
      wsClients.set(ws, { userId: 'anonymous', role: 'guest' });
    }

    ws.on('message', (messageStr) => {
      try {
        const data = JSON.parse(messageStr.toString());
        if (data.type === 'auth' && data.token) {
          const payload = verifyToken(data.token) as any;
          if (payload) {
            wsClients.set(ws, { userId: payload.id, role: payload.role });
            ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', message: `Connected as ${payload.name}` }));
          }
        } else if (data.type === 'WISHLIST_SYNC' && Array.isArray(data.wishlist)) {
          const clientInfo = wsClients.get(ws);
          if (clientInfo) {
            wsClients.set(ws, { ...clientInfo, wishlist: data.wishlist });
            console.log(`WebSocket client ${clientInfo.userId} synced wishlist:`, data.wishlist);
          }
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      wsClients.delete(ws);
    });
  });
}

startServer();
