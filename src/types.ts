/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'customer' | 'vendor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: string;
  avatar?: string;
  phone?: string;
  address?: string;
}

export interface Vendor {
  id: string; // matches User.id
  userId: string;
  storeName: string;
  description: string;
  logoUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  phone: string;
  address: string;
  bankAccount: string;
  totalEarnings: number;
  createdAt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: string;
  images: string[];
  vendorId: string;
  vendorName: string;
  avgRating: number;
  totalReviews: number;
  tags?: string[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  vendorId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  discountAmount?: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentId?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  verified?: boolean;
}

export interface Coupon {
  code: string;
  discountPercent: number; // e.g. 10 for 10%
  description: string;
  active: boolean;
  minAmount?: number;
  type?: 'percentage' | 'fixed_amount' | 'free_shipping';
  discountValue?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
}
