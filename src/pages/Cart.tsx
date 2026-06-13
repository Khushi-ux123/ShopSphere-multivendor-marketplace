/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, ArrowRight, Trash2, Tag, X, ShieldAlert, BadgeInfo } from 'lucide-react';

interface CartProps {
  onNavigate: (page: string) => void;
}

export const Cart: React.FC<CartProps> = ({ onNavigate }) => {
  const { cart, updateCartQuantity, removeFromCart, appliedCoupon, applyDiscountCoupon, removeCoupon } = useApp();
  const [couponInput, setCouponInput] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Calculate discount based on dynamic coupon configurations
  let discount = 0;
  let isFreeShippingCoupon = false;
  if (appliedCoupon) {
    const type = appliedCoupon.type || 'percentage';
    if (type === 'percentage') {
      discount = subtotal * ((appliedCoupon.discountPercent || 0) / 100);
    } else if (type === 'fixed_amount') {
      discount = Math.min(subtotal, appliedCoupon.discountValue || appliedCoupon.discountPercent || 0);
    } else if (type === 'free_shipping') {
      isFreeShippingCoupon = true;
    }
  }

  const shippingFee = (subtotal > 150 || isFreeShippingCoupon) ? 0 : 15.00; // Free shipping on orders over $150 or if Coupon specifies!
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);

  const handleApplyCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const success = await applyDiscountCoupon(couponInput);
    if (success) {
      setCouponInput('');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center animate-bounce">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-neutral-905 dark:text-white">Your Shopping Bag is Empty</h1>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Explore our curated, high-end marketplace to register unique journals, ANC consoles, and woodcarvings.
          </p>
        </div>
        <button
          id="cart-go-listing-btn"
          onClick={() => onNavigate('products')}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs flex items-center gap-2 mx-auto transition"
        >
          View All Listings
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      
      <div className="space-y-4 mb-8">
        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Shopping Bag</h1>
        <p className="text-xs text-neutral-500">You have {cart.length} distinct item groupings in your pending checkout</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: ACTIVE ITEMS LIST */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div 
              id={`cart-item-${item.productId}`}
              key={item.productId}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-6 justify-between transition-colors"
            >
              
              {/* Product Info */}
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-16 h-16 rounded-xl object-cover border"
                />
                <div className="text-left space-y-1">
                  <h3 className="font-medium text-neutral-900 dark:text-white text-sm hover:text-indigo-600 cursor-pointer line-clamp-1" onClick={() => onNavigate(`products/${item.productId}`)}>
                    {item.title}
                  </h3>
                  <p className="text-[10px] font-mono text-neutral-400 capitalize">Vendor SKU: {item.productId.substring(0, 8)}</p>
                  <p className="text-xs font-bold text-neutral-950 dark:text-neutral-200">${item.price.toFixed(2)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-6 justify-between sm:justify-start w-full sm:w-auto border-t sm:border-t-0 border-neutral-100 dark:border-neutral-850 pt-4 sm:pt-0">
                
                {/* Quantity Toggles */}
                <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-lg">
                  <button
                    id={`cart-qty-dec-${item.productId}`}
                    onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                    className="px-2.5 py-1 text-sm text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-850"
                  >
                    -
                  </button>
                  <span className="px-3.5 text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200">{item.quantity}</span>
                  <button
                    id={`cart-qty-inc-${item.productId}`}
                    onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                    className="px-2.5 py-1 text-sm text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-850"
                  >
                    +
                  </button>
                </div>

                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono flex-shrink-0 w-20 text-center sm:text-right">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>

                <button
                  id={`cart-item-remove-btn-${item.productId}`}
                  onClick={() => removeFromCart(item.productId)}
                  className="p-2 text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                  title="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

              </div>

            </div>
          ))}
          
          {/* Shipping incentive notification */}
          {subtotal < 150 && (
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 dark:bg-neutral-950 dark:border-neutral-850 rounded-2xl flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
              <BadgeInfo className="h-5 w-5 text-indigo-500 flex-shrink-0" />
              <p className="text-xs">
                Add <span className="font-bold text-indigo-600">${(150 - subtotal).toFixed(2)}</span> more to your cart to trigger <span className="font-bold text-emerald-500">FREE delivery</span>! (Current shipping cap: $15.00)
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: FINANCIAL STATEMENTS RECEIPT */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-6 rounded-2xl space-y-6">
            <h2 className="font-display font-bold text-base text-neutral-900 dark:text-white pb-3 border-b border-neutral-100 dark:border-neutral-850">
              Order Subtotal
            </h2>

            {/* Price list */}
            <div className="space-y-3.5 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between">
                <span>Cart Subtotal</span>
                <span className="font-mono text-neutral-900 dark:text-white font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    Coupon Applied ({appliedCoupon.code})
                  </span>
                  <span className="font-mono font-semibold">-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping &amp; Courier Coverage</span>
                {shippingFee === 0 ? (
                  <span className="font-mono text-emerald-500 font-bold uppercase">FREE</span>
                ) : (
                  <span className="font-mono text-neutral-900 dark:text-white font-semibold">${shippingFee.toFixed(2)}</span>
                )}
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-850 pt-4 flex justify-between text-base font-bold text-neutral-905 dark:text-white">
                <span>Order Total</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Applied coupon notifications / input */}
            {appliedCoupon ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Coupon Active: {appliedCoupon.code}</p>
                  <p className="text-[10px] text-emerald-500 mt-0.5">{appliedCoupon.discountPercent}% Discount Applied</p>
                </div>
                <button id="cart-coupon-remove-btn" onClick={removeCoupon} className="p-1 rounded bg-white dark:bg-neutral-800 hover:bg-neutral-100">
                  <X className="h-3 w-3 text-neutral-500" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCouponSubmit} className="flex gap-2">
                <input
                  id="coupon-input-field"
                  type="text"
                  placeholder="Coupon Code (WELCOME10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none"
                />
                <button
                  id="coupon-apply-btn"
                  type="submit"
                  className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-850 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-white text-xs font-semibold rounded-xl transition"
                >
                  Apply
                </button>
              </form>
            )}

            <button
              id="cart-checkout-proceed-btn"
              onClick={() => onNavigate('checkout')}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/15 cursor-pointer transition"
            >
              Proceed to Shipping
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="pt-2 text-center text-[10px] text-neutral-400 flex items-center gap-1.5 justify-center">
              <ShieldAlert className="h-3.5 w-3.5 text-neutral-400" />
              <span>Checkout matches secure SHA-256 standard vaults</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
