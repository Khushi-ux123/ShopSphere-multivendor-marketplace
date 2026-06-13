/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CreditCard, Truck, ShieldCheck, ArrowLeft, Loader, HelpCircle, Sparkles } from 'lucide-react';

interface CheckoutProps {
  onNavigate: (page: string) => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ onNavigate }) => {
  const { cart, appliedCoupon, submitOrder, token } = useApp();
  
  const [fullName, setFullName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [phone, setPhone] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('ONLINE');
  const [submitting, setSubmitting] = useState(false);

  // Razorpay simulator overlay states
  const [showRazorpayPay, setShowRazorpayPay] = useState(false);
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [razorpaySuccess, setRazorpaySuccess] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Calculate coupon discounts by model types
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

  const shippingFee = (subtotal > 150 || isFreeShippingCoupon) ? 0 : 15.00;
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      alert('Please log in or register to submit transactions.');
      onNavigate('login');
      return;
    }

    if (!fullName || !addressLine1 || !city || !state || !postalCode || !phone) {
      alert('Please compile all delivery fields to verify dispatch coordinates.');
      return;
    }

    if (paymentMethod === 'COD') {
      setSubmitting(true);
      const address = { fullName, phone, addressLine1, city, state, postalCode, country };
      const success = await submitOrder(address, 'COD');
      setSubmitting(false);
      
      if (success) {
        alert('Order submitted successfully as Cash On Delivery (COD)! Track status inside Customer Center.');
        onNavigate('customer-dashboard');
      }
    } else {
      // Trigger Razorpay Simulation checkout!
      setShowRazorpayPay(true);
    }
  };

  const handleRazorpayPaymentSubmit = () => {
    setRazorpayLoading(true);
    setTimeout(async () => {
      setRazorpayLoading(false);
      setRazorpaySuccess(true);
      
      // Complete database submission
      const address = { fullName, phone, addressLine1, city, state, postalCode, country };
      const success = await submitOrder(address, 'Razorpay Secure Platform');
      
      if (success) {
        setTimeout(() => {
          setShowRazorpayPay(false);
          setRazorpaySuccess(false);
          alert('Razorpay Secure Payment Approved! Order published successfully.');
          onNavigate('customer-dashboard');
        }, 1500);
      } else {
        setShowRazorpayPay(false);
        setRazorpaySuccess(false);
        alert('Internal server validation failed. Try again.');
      }
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      
      {/* Back button */}
      <button
        id="checkout-back-btn"
        onClick={() => onNavigate('cart')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 transition mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Shopping Bag
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT TWO COLUMNS: SHIPPING INPUT FORM */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-205 dark:border-neutral-850 p-6 rounded-2xl space-y-6">
          <h2 className="font-display font-bold text-lg text-neutral-905 dark:text-white flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-850">
            <Truck className="h-5 w-5 text-indigo-500" />
            Shipping Coordinates
          </h2>

          <form onSubmit={handlePlaceOrder} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Receiver Full Name</label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  placeholder="Jane Miller"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none placeholder-neutral-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Primary Contact Phone</label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  placeholder="+1 (312) 555-0144"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none placeholder-neutral-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Physical Address Street Line</label>
              <input
                id="checkout-addr"
                type="text"
                required
                placeholder="88 Michigan Avenue, Apt 4C"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full px-3.5 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none placeholder-neutral-400"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">City</label>
                <input
                  id="checkout-city"
                  type="text"
                  required
                  placeholder="Chicago"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">State / Prov</label>
                <input
                  id="checkout-state"
                  type="text"
                  required
                  placeholder="IL"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Postal Code</label>
                <input
                  id="checkout-zip"
                  type="text"
                  required
                  placeholder="60611"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3.5 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Country</label>
                <input
                  id="checkout-country"
                  type="text"
                  required
                  placeholder="United States"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-850">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Payment Selection</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Razorpay Option */}
                <button
                  id="pay-opt-online"
                  type="button"
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`p-4 border rounded-2xl flex items-center gap-3 text-left transition ${
                    paymentMethod === 'ONLINE' 
                      ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10' 
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Debit / Credit Cards</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Secure Razorpay platform gateway</p>
                  </div>
                </button>

                {/* Cash On Delivery Option */}
                <button
                  id="pay-opt-cod"
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 border rounded-2xl flex items-center gap-3 text-left transition ${
                    paymentMethod === 'COD' 
                      ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/10' 
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                  }`}
                >
                  <Truck className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Cash On Delivery (COD)</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Settle balance upon secure unpacking</p>
                  </div>
                </button>

              </div>
            </div>

            <button
              id="checkout-place-btn"
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition"
            >
              {submitting ? 'Submitting Purchase...' : paymentMethod === 'COD' ? 'Submit Order' : 'Authorize Secure Payment Gateway'}
            </button>

          </form>

        </div>

        {/* RIGHT COLUMN: RECAP & CHARGES DISPLAY */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-6 rounded-2xl">
            <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white pb-3 border-b mb-4">
              Basket Summary
            </h3>

            {/* List of items */}
            <div className="space-y-4 max-h-60 overflow-y-auto mb-4 border-b pb-4">
              {cart.map((item) => (
                <div key={item.productId} className="flex gap-3 justify-between items-center text-xs">
                  <div className="flex gap-2 items-center">
                    <img src={item.image} alt={item.title} className="w-8 h-8 rounded border object-cover" />
                    <div>
                      <p className="font-medium text-neutral-800 dark:text-neutral-200 line-clamp-1">{item.title}</p>
                      <p className="text-[10px] text-neutral-400">Qty: {item.quantity} x ${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-neutral-905 dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Bills recap */}
            <div className="space-y-3.5 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-neutral-900 dark:text-white font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Applied ({appliedCoupon.code})</span>
                  <span className="font-mono font-semibold">-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-medium">
                <span>Shipping Courier Fee</span>
                {shippingFee === 0 ? (
                  <span className="text-emerald-500 font-bold uppercase">FREE</span>
                ) : (
                  <span className="font-mono">${shippingFee.toFixed(2)}</span>
                )}
              </div>

              <div className="border-t pt-3 flex justify-between text-base font-bold text-indigo-600 dark:text-indigo-400">
                <span>Final Total Due</span>
                <span className="font-mono">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* RAZORPAY GATEWAY SIMULATION FULL SCREEN OVERLAY */}
      {showRazorpayPay && (
        <div className="fixed inset-0 z-50 bg-neutral-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 max-w-sm w-full overflow-hidden shadow-2xl relative">
            
            {/* Header branding */}
            <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 p-6 text-white text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white/10 text-xs font-mono mb-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>RAZORPAY SECURE CHECKOUT</span>
              </div>
              <h3 className="font-display font-bold text-lg">ShopSphere Multi-Vendor Marketplace</h3>
              <p className="text-[11px] text-slate-300 font-mono mt-1">Transaction ID: TXN-{Date.now().toString().slice(6)}</p>
            </div>

            {/* Bill display */}
            <div className="p-6 space-y-4">
              
              <div className="text-center">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Amount Payable</p>
                <p className="text-3xl font-extrabold text-neutral-900 dark:text-white font-mono mt-0.5">${finalTotal.toFixed(2)}</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-neutral-500 uppercase">Secure Test Card Number</label>
                  <input
                    id="razorpay-card-num"
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full text-center px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs font-mono rounded-lg focus:outline-none text-neutral-800 dark:text-neutral-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-500 uppercase">Expiry Date</label>
                    <input
                      id="razorpay-expiry"
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full text-center px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs font-mono rounded-lg focus:outline-none text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-neutral-500 uppercase">CVV Code</label>
                    <input
                      id="razorpay-cvv"
                      type="password"
                      required
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full text-center px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs font-mono rounded-lg focus:outline-none text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                </div>
              </div>

              {razorpaySuccess ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl text-center space-y-2 animate-pulse">
                  <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Secure Payment Authorized</p>
                  <p className="text-[10px] text-neutral-400">Submitting cart receipts...</p>
                </div>
              ) : razorpayLoading ? (
                <div className="py-4 text-center space-y-2">
                  <Loader className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Resolving multi-part OTP challenge...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    id="razorpay-submit-btn"
                    onClick={handleRazorpayPaymentSubmit}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
                  >
                    Proceed with Mock Payment
                  </button>
                  <button
                    id="razorpay-cancel-btn"
                    onClick={() => setShowRazorpayPay(false)}
                    className="w-full text-center text-xs text-neutral-400 hover:text-rose-500 hover:underline"
                  >
                    Cancel Secure Session
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
