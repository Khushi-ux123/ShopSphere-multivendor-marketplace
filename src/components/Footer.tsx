/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// @ts-ignore
import logoImg from './assets/images/shopsphere_logo_1781309426828.jpg';
import { ShoppingBag, ChevronRight, HelpCircle, Heart, Shield, RefreshCw } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-900 transition-colors">
      
      {/* Advantage Features Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-neutral-200 dark:border-neutral-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
        <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 transition duration-200">
          <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">Safe & Secure Transactions</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">PCI compliant tokenization and mock-Razorpay integration</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 transition duration-200">
          <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">30-Day Easy Returns</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">If items arrive with any unexpected discrepancy</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 transition duration-200">
          <div className="p-3 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">Handcrafted With Passion</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Independent artisans and master crafters from our local community</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 transition duration-200">
          <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">24/7 Dedicated Support</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Instant chat correspondence with vendors directly</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
            <img 
              src={logoImg} 
              alt="ShopSphere Logo" 
              className="h-10 w-auto rounded-lg mix-blend-multiply dark:mix-blend-screen dark:filter dark:invert hover:opacity-90 transition-opacity"
              referrerPolicy="no-referrer"
            />
            <span>SHOPSPHERE</span>
          </div>
          <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            A premium multi-vendor ecosystem delivering consumer electronics, architectural woodworking, home utilities, and artisan crafts.
          </p>
        </div>

        {/* Directory Links */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-4">Shop Categories</h3>
          <ul className="space-y-2 text-xs text-neutral-500 dark:text-neutral-400">
            <li>
              <button onClick={() => onNavigate('products?category=electronics')} className="hover:text-indigo-600 transition flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                Consumer Electronics
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('products?category=books-stationery')} className="hover:text-indigo-600 transition flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                Books & Stationery
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('products?category=home-living')} className="hover:text-indigo-600 transition flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                Home & Living
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('products?category=handmade-crafts')} className="hover:text-indigo-600 transition flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                Handcrafted & Artisan Crafts
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('products?category=beauty')} className="hover:text-indigo-600 transition flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                Beauty 
              </button>
            </li>
          </ul>
        </div>

        {/* Platform Policy */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-4">Partner Programs</h3>
          <ul className="space-y-2 text-xs text-neutral-500 dark:text-neutral-400">
            <li>
              <button onClick={() => onNavigate('login?register=vendor')} className="hover:text-indigo-600 transition flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                Launch Your Seller Shop
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('profile-settings')} className="hover:text-indigo-600 transition flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                Vendor Bank Accounts
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('admin-dashboard')} className="hover:text-indigo-600 transition flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                Compliance Admin Panel
              </button>
            </li>
          </ul>
        </div>

      </div>

      <div className="bg-neutral-100 dark:bg-neutral-950/60 py-6 text-center text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-250 dark:border-neutral-900">
        <p>© 2026 ShopSphere Multi-Vendor Marketplace. Developed for showcase on developer portfolios.</p>
      </div>

    </footer>
  );
};
