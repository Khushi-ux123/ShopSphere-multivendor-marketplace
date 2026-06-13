import { pgTable, text, timestamp, doublePrecision, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password'),
  role: text('role').notNull(), // 'customer', 'vendor', 'admin'
  createdAt: text('created_at').notNull(),
  avatar: text('avatar'),
  phone: text('phone'),
  address: text('address'),
});

export const vendors = pgTable('vendors', {
  id: text('id').primaryKey(), // matches User.id
  userId: text('user_id').notNull(),
  storeName: text('store_name').notNull(),
  description: text('description').notNull(),
  logoUrl: text('logo_url'),
  status: text('status').notNull(), // 'pending', 'approved', 'rejected'
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  bankAccount: text('bank_account').notNull(),
  totalEarnings: doublePrecision('total_earnings').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: doublePrecision('price').notNull(),
  originalPrice: doublePrecision('original_price'),
  stock: integer('stock').notNull(),
  category: text('category').notNull(),
  images: jsonb('images').notNull(), // array of strings
  vendorId: text('vendor_id').notNull(),
  vendorName: text('vendor_name').notNull(),
  avgRating: doublePrecision('avg_rating').notNull().default(0),
  totalReviews: integer('total_reviews').notNull().default(0),
  tags: jsonb('tags'), // array of strings
  createdAt: text('created_at').notNull(),
});

export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  items: jsonb('items').notNull(), // array of OrderItems
  totalAmount: doublePrecision('total_amount').notNull(),
  discountAmount: doublePrecision('discount_amount'),
  shippingAddress: jsonb('shipping_address').notNull(), // shippingAddress object
  paymentMethod: text('payment_method').notNull(),
  paymentStatus: text('payment_status').notNull(), // 'pending', 'paid', 'failed'
  paymentId: text('payment_id'),
  createdAt: text('created_at').notNull(),
});

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment').notNull(),
  createdAt: text('created_at').notNull(),
  verified: boolean('verified'),
});

export const coupons = pgTable('coupons', {
  code: text('code').primaryKey(),
  discountPercent: doublePrecision('discount_percent').notNull(),
  description: text('description').notNull(),
  active: boolean('active').notNull().default(true),
  minAmount: doublePrecision('min_amount'),
  type: text('type'), // 'percentage', 'fixed_amount', 'free_shipping'
  discountValue: doublePrecision('discount_value'),
});

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  senderId: text('sender_id').notNull(),
  receiverId: text('receiver_id').notNull(),
  message: text('message').notNull(),
  createdAt: text('created_at').notNull(),
});
