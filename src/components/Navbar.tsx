/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
// @ts-ignore
import logoImg from './assets/images/shopsphere_logo_1781309426828.jpg';
import { 
  ShoppingBag, 
  Heart, 
  User as UserIcon, 
  Sun, 
  Moon, 
  Search, 
  LogOut, 
  Store, 
  ShieldCheck, 
  LayoutDashboard,
  Menu,
  X,
  Truck
} from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage = '' }) => {
  const { user, vendor, cart, wishlist, theme, toggleTheme, logout, products, categories } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const [isPopping, setIsPopping] = useState(false);
  const prevCartCountRef = useRef(cartCount);

  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setIsPopping(true);
      const timer = setTimeout(() => setIsPopping(false), 500);
      prevCartCountRef.current = cartCount;
      return () => clearTimeout(timer);
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const matchedCategories = trimmedQuery
    ? categories.filter(cat => cat.name.toLowerCase().includes(trimmedQuery)).slice(0, 3)
    : [];
  const matchedProducts = trimmedQuery
    ? products.filter(p => p.title.toLowerCase().includes(trimmedQuery) || p.description.toLowerCase().includes(trimmedQuery)).slice(0, 5)
    : [];

  const unifiedSuggestions = [
    ...matchedCategories.map(cat => ({ type: 'category' as const, id: cat.id, name: cat.name, slug: cat.slug, data: cat })),
    ...matchedProducts.map(p => ({ type: 'product' as const, id: p.id, name: p.title, price: p.price, image: p.images?.[0], data: p }))
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (unifiedSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        prev < unifiedSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : unifiedSuggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < unifiedSuggestions.length) {
        e.preventDefault();
        const item = unifiedSuggestions[activeSuggestionIndex];
        if (item.type === 'category') {
          setSearchQuery('');
          onNavigate(`products?category=${item.slug}`);
        } else {
          setSearchQuery('');
          onNavigate(`products/${item.id}`);
        }
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate(`products?search=${encodeURIComponent(searchQuery)}`);
    setShowSuggestions(false);
  };

  const getDashboardBtn = () => {
    if (!user) return null;
    switch (user.role) {
      case 'admin':
        return (
          <button 
            id="nav-admin-dash"
            onClick={() => { onNavigate('admin-dashboard'); setIsOpen(false); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
              currentPage === 'admin-dashboard' 
                ? 'bg-rose-500/10 text-rose-500' 
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Admin Panel
          </button>
        );
      case 'vendor':
        return (
          <button 
            id="nav-vendor-dash"
            onClick={() => { onNavigate('vendor-dashboard'); setIsOpen(false); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
              currentPage === 'vendor-dashboard' 
                ? 'bg-emerald-500/10 text-emerald-500' 
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <Store className="h-4 w-4" />
            Seller Hub
          </button>
        );
      case 'customer':
      default:
        return (
          <button 
            id="nav-customer-dash"
            onClick={() => { onNavigate('customer-dashboard'); setIsOpen(false); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
              currentPage === 'customer-dashboard' 
                ? 'bg-indigo-500/10 text-indigo-505 dark:text-indigo-400 font-bold' 
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            My Orders
          </button>
        );
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <button 
              id="nav-logo"
              onClick={() => onNavigate('home')} 
              className="flex items-center gap-2 font-display text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white"
            >
              <img 
                src={logoImg} 
                alt="ShopSphere Logo" 
                className="h-11 sm:h-12 w-auto mix-blend-multiply dark:mix-blend-screen dark:filter dark:invert hover:opacity-90 transition-opacity"
                referrerPolicy="no-referrer"
              />
              <span className="font-display font-black tracking-tight text-neutral-900 dark:text-white">ShopSphere</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/10">
                PRO
              </span>
            </button>
          </div>

          {/* Search bar with instant autocomplete suggestions */}
          <div className="hidden md:block flex-1 max-w-md relative">
            <form onSubmit={handleSearch} className="relative">
              <input
                id="search-input-desktop"
                type="text"
                placeholder="Search products, brands, or categories..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveSuggestionIndex(-1);
                  setShowSuggestions(true);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  // Delay close slightly so matches can be clicked
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                className="w-full pl-10 pr-12 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                autoComplete="off"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-xs font-semibold px-1.5 py-0.5 rounded bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-300 transition"
                >
                  ✕
                </button>
              )}
            </form>

            {/* Suggestions Overlay */}
            {showSuggestions && trimmedQuery && (matchedCategories.length > 0 || matchedProducts.length > 0) && (
              <div className="absolute top-11 left-0 right-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800 text-left">
                {/* Categories matched */}
                {matchedCategories.length > 0 && (
                  <div className="p-2.5 bg-neutral-50/40 dark:bg-neutral-900/40">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 mb-1">Suggested Categories</p>
                    <div className="space-y-0.5">
                      {matchedCategories.map((cat, i) => {
                        const isCatActive = activeSuggestionIndex === i;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setSearchQuery('');
                              onNavigate(`products?category=${cat.slug}`);
                              setShowSuggestions(false);
                            }}
                            onMouseEnter={() => setActiveSuggestionIndex(i)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                              isCatActive
                                ? 'bg-indigo-600 text-white'
                                : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            <span className="capitalize">{cat.name}</span>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors ${
                              isCatActive
                                ? 'bg-white/20 text-white'
                                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500'
                            }`}>Category</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Products matched */}
                {matchedProducts.length > 0 && (
                  <div className="p-2.5">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 mb-1">Matching Products</p>
                    <div className="space-y-1">
                      {matchedProducts.map((p, j) => {
                        const absIndex = matchedCategories.length + j;
                        const isProdActive = activeSuggestionIndex === absIndex;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              setSearchQuery('');
                              onNavigate(`products/${p.id}`);
                              setShowSuggestions(false);
                            }}
                            onMouseEnter={() => setActiveSuggestionIndex(absIndex)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-2.5 transition-colors ${
                              isProdActive
                                ? 'bg-indigo-600 text-white'
                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-850 dark:text-neutral-200'
                            }`}
                          >
                            <img
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100'}
                              alt={p.title}
                              className="h-9 w-9 object-cover rounded-md flex-shrink-0 animate-fade-in"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-grow min-w-0">
                              <p className={`font-semibold truncate ${
                                isProdActive ? 'text-white' : 'text-neutral-900 dark:text-white'
                              }`}>{p.title}</p>
                              <p className={`text-[10px] font-mono ${
                                isProdActive ? 'text-white/80' : 'text-neutral-450'
                              }`}>${p.price}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dynamic Hint Bar */}
                <div className="bg-neutral-50 dark:bg-neutral-950/50 px-3 py-1.5 flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 border-t border-neutral-100 dark:border-neutral-800/80 select-none">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-neutral-200/50 dark:bg-neutral-800 rounded font-mono text-[9px] border border-neutral-300/40">↑</kbd>
                    <kbd className="px-1 py-0.5 bg-neutral-200/50 dark:bg-neutral-800 rounded font-mono text-[9px] border border-neutral-300/40">↓</kbd>
                    to navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-neutral-200/50 dark:bg-neutral-800 rounded font-mono text-[9px] border border-neutral-300/40">Enter</kbd>
                    to select
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Tools Nav */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Wishlist */}
            <button
              id="wishlist-nav-btn"
              onClick={() => onNavigate('wishlist')}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 relative transition"
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              id="cart-nav-btn"
              onClick={() => onNavigate('cart')}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 relative transition"
            >
              <motion.div
                animate={isPopping ? { scale: [1, 1.4, 0.9, 1.15, 1], rotate: [0, -10, 10, -5, 0] } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                className="relative flex items-center justify-center animate-duration-500"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </motion.div>
            </button>

            {/* Role specific links and Profile */}
            {getDashboardBtn()}

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-neutral-200 dark:border-neutral-800">
                <button
                  id="profile-nav-btn"
                  onClick={() => onNavigate('profile-settings')}
                  className="flex items-center gap-2 hover:opacity-80 transition"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-1">{user.name}</p>
                    <p className="font-mono text-neutral-500 capitalize text-[9px]">{user.role}</p>
                  </div>
                </button>
                <button
                  id="logout-nav-btn"
                  onClick={() => { logout(); onNavigate('home'); }}
                  className="p-2 rounded-full hover:bg-rose-500/10 text-rose-500 transition ml-1"
                  title="Logout"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <button
                id="login-btn"
                onClick={() => onNavigate('login')}
                className="ml-2 flex items-center gap-1.5 px-4.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
              >
                <UserIcon className="h-4 w-4" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-theme-toggle"
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              id="mobile-menu-trigger"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 pt-2 pb-4 space-y-3">
          {/* Mobile search */}
          <div className="relative mt-1 text-left">
            <form onSubmit={handleSearch} className="relative">
              <input
                id="search-input-mobile"
                type="text"
                placeholder="Search products or categories..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveSuggestionIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoComplete="off"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            </form>

            {trimmedQuery && (matchedCategories.length > 0 || matchedProducts.length > 0) && (
              <div className="mt-1.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-xl shadow-lg overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-850">
                {matchedCategories.length > 0 && (
                  <div className="p-2 bg-neutral-50/30 dark:bg-neutral-905/30">
                    <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider px-2 mb-1">Categories</p>
                    <div className="space-y-0.5">
                      {matchedCategories.map((cat, i) => {
                        const isCatActive = activeSuggestionIndex === i;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setSearchQuery('');
                              onNavigate(`products?category=${cat.slug}`);
                              setIsOpen(false);
                            }}
                            onMouseEnter={() => setActiveSuggestionIndex(i)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                              isCatActive
                                ? 'bg-indigo-600 text-white'
                                : 'text-neutral-805 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            <span className="capitalize">{cat.name}</span>
                            <span className={`text-[8px] font-mono px-1 rounded transition-colors ${
                              isCatActive ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-550'
                            }`}>Category</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {matchedProducts.length > 0 && (
                  <div className="p-2">
                    <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider px-2 mb-1">Products</p>
                    <div className="space-y-1">
                      {matchedProducts.map((p, j) => {
                        const absIndex = matchedCategories.length + j;
                        const isProdActive = activeSuggestionIndex === absIndex;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              setSearchQuery('');
                              onNavigate(`products/${p.id}`);
                              setIsOpen(false);
                            }}
                            onMouseEnter={() => setActiveSuggestionIndex(absIndex)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                              isProdActive
                                ? 'bg-indigo-600 text-white'
                                : 'hover:bg-neutral-55 dark:hover:bg-neutral-900 text-neutral-850 dark:text-neutral-200'
                            }`}
                          >
                            <img
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100'}
                              alt={p.title}
                              className="h-7 w-7 object-cover rounded flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-grow min-w-0">
                              <p className={`font-semibold truncate text-[11px] ${
                                isProdActive ? 'text-white' : 'text-neutral-900 dark:text-white'
                              }`}>{p.title}</p>
                              <p className={`text-[9px] font-mono ${
                                isProdActive ? 'text-white/80' : 'text-neutral-450'
                              }`}>${p.price}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="mob-wishlist-btn"
              onClick={() => { onNavigate('wishlist'); setIsOpen(false); }}
              className="flex items-center justify-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              <Heart className="h-4 w-4 text-rose-500" />
              Wishlist ({wishlist.length})
            </button>
            <button
              id="mob-cart-btn"
              onClick={() => { onNavigate('cart'); setIsOpen(false); }}
              className="flex items-center justify-center gap-2 p-2 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              <motion.div
                animate={isPopping ? { scale: [1, 1.4, 0.9, 1.15, 1], rotate: [0, -10, 10, -5, 0] } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
              >
                <ShoppingBag className="h-4 w-4 text-indigo-500" />
              </motion.div>
              Cart ({cartCount})
            </button>
          </div>

          <div className="space-y-1">
            {getDashboardBtn()}
            {user ? (
              <>
                <button
                  id="mob-profile-btn"
                  onClick={() => { onNavigate('profile-settings'); setIsOpen(false); }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <UserIcon className="h-4 w-4 text-neutral-400" />
                  Account Settings ({user.name})
                </button>
                <button
                  id="mob-logout-btn"
                  onClick={() => { logout(); onNavigate('home'); setIsOpen(false); }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4 text-rose-500" />
                  Logout Account
                </button>
              </>
            ) : (
              <button
                id="mob-login-btn"
                onClick={() => { onNavigate('login'); setIsOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
              >
                <UserIcon className="h-4 w-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
