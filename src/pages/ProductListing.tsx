/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  SlidersHorizontal, 
  Grid, 
  ArrowUpDown, 
  Star, 
  ShoppingCart, 
  Heart,
  ChevronRight,
  Filter,
  Mic,
  MicOff
} from 'lucide-react';

interface ProductListingProps {
  onNavigate: (page: string) => void;
  initialCategory?: string;
  initialSearch?: string;
}

export const ProductListing: React.FC<ProductListingProps> = ({ 
  onNavigate, 
  initialCategory = 'all', 
  initialSearch = '' 
}) => {
  const { products, categories, fetchProducts, toggleWishlist, wishlist, addToCart, isLoading } = useApp();
  
  const [search, setSearch] = useState(initialSearch);
  const [selectedCat, setSelectedCat] = useState(initialCategory);
  const [sort, setSort] = useState('newest');
  const [maxPrice, setMaxPrice] = useState(600);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Voice Search states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = React.useRef<any>(null);

  // Setup Web Speech API on mount
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      setSpeechSupported(true);
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const cleanedText = transcript.replace(/[.?!]$/g, '').trim();
          setSearch(cleanedText);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!speechSupported) {
      alert('Speech Recognition is not supported in your browser. Please try using a modern browser like Google Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  // Trigger download whenever search parameters update
  useEffect(() => {
    fetchProducts({
      category: selectedCat,
      search: search,
      sort: sort,
    });
  }, [selectedCat, search, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts({
      category: selectedCat,
      search: search,
      sort: sort,
    });
  };

  // Local client side price filtering for seamless user experience
  const filteredProducts = products.filter(p => p.price <= maxPrice);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      
      {/* Search Header Bar - High Density */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-4 rounded-xl mb-5">
        <div>
          <h1 className="font-display text-lg font-bold text-neutral-900 dark:text-white capitalize">
            {selectedCat === 'all' ? 'All Marketplace Products' : selectedCat.replace('-', ' ')}
          </h1>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Showing {filteredProducts.length} high-fidelity products curated globally
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-xs flex items-center">
          <div className="relative w-full">
            <input
              id="listing-search-input"
              type="text"
              placeholder={isListening ? "Listening... Speak now!" : "Search items in this room..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-8.5 pr-8 py-1.5 border rounded-md text-xs text-neutral-900 dark:text-white focus:ring-1 focus:ring-indigo-500 transition-all duration-300 ${
                isListening 
                  ? 'border-red-500 dark:border-red-600 bg-red-50/50 dark:bg-red-950/20 ring-1 ring-red-400' 
                  : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800'
              }`}
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            
            {/* Embedded voice-to-text mic option */}
            <button
              type="button"
              id="voice-search-btn"
              onClick={toggleListening}
              title={isListening ? "Stop listening" : "Search with your voice"}
              className={`absolute right-2 top-2 p-0.5 rounded-full transition-all duration-200 cursor-pointer ${
                isListening
                  ? 'text-red-600 dark:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 animate-pulse scale-110'
                  : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {isListening ? (
                <MicOff className="h-3.5 w-3.5" />
              ) : (
                <Mic className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        
        {/* DESKTOP SIDE BAR FILTERS */}
        <aside className="w-full lg:w-56 shrink-0 space-y-4.5 hidden lg:block">
          
          {/* Categories select checklist */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-3.5 rounded-xl">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-neutral-900 dark:text-white mb-2.5 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-indigo-500" /> Catalog Collections
            </h3>
            
            <div className="space-y-0.5">
              <button
                id="cat-select-all"
                onClick={() => setSelectedCat('all')}
                className={`w-full text-left flex items-center justify-between text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition ${
                  selectedCat === 'all' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span>All Categories</span>
                <ChevronRight className="h-3 w-3" />
              </button>
              
              {categories.map((cat) => (
                <button
                  id={`cat-select-${cat.slug}`}
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.slug)}
                  className={`w-full text-left flex items-center justify-between text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition ${
                    selectedCat === cat.slug 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>{cat.name}</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>

          {/* Price Range selectors */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-3.5 rounded-xl">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-neutral-900 dark:text-white mb-2.5">
              Price Range Cap
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px] text-neutral-500 font-mono">
                <span>$0</span>
                <span>Max: ${maxPrice}</span>
              </div>
              <input
                id="price-range-slider"
                type="range"
                min="10"
                max="1000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
              />
              <div className="flex gap-1.5">
                <button 
                  id="preset-price-low"
                  onClick={() => setMaxPrice(100)} 
                  className="px-2 py-0.5 text-[9px] uppercase font-mono rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:opacity-85"
                >
                  &lt; $100
                </button>
                <button 
                  id="preset-price-mid"
                  onClick={() => setMaxPrice(300)} 
                  className="px-2 py-0.5 text-[9px] uppercase font-mono rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:opacity-85"
                >
                  &lt; $300
                </button>
                <button 
                  id="preset-price-hi"
                  onClick={() => setMaxPrice(600)} 
                  className="px-2 py-0.5 text-[9px] uppercase font-mono rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:opacity-85"
                >
                  &lt; $600
                </button>
              </div>
            </div>
          </div>

        </aside>

        {/* MAIN PRODUCT CATALOG CONTAINER */}
        <div className="flex-1 space-y-4">
          
          {/* Sorting and Mobile control panel */}
          <div className="flex justify-between items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 px-3.5 py-2.5 rounded-xl gap-3">
            
            <button
              id="mobile-filter-drawer-btn"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 border border-neutral-200 dark:border-neutral-800 rounded-lg"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-500" />
              <span>Filters</span>
            </button>

            <div className="flex items-center gap-1.5 ml-auto">
              <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" />
              <select
                id="sorting-dropdown"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent text-[11px] text-neutral-700 dark:text-neutral-300 font-semibold focus:outline-none"
              >
                <option value="newest" className="dark:bg-neutral-900">Sort by: Newest Arrivals</option>
                <option value="price-asc" className="dark:bg-neutral-900">Price: Low to High</option>
                <option value="price-desc" className="dark:bg-neutral-900">Price: High to Low</option>
                <option value="rating" className="dark:bg-neutral-900">Customer Ratings</option>
              </select>
            </div>
          </div>

          {/* Mobile Filter Drawer Representation */}
          {showMobileFilters && (
            <div className="lg:hidden bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 p-4 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-850 pb-2">
                <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-200 uppercase">Interactive Filters</span>
                <button onClick={() => setShowMobileFilters(false)} className="text-rose-500 text-xs font-bold">Close ✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setSelectedCat('all')} className="p-2 border rounded text-xs dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">All Collections</button>
                {categories.map(c => (
                  <button key={c.id} onClick={() => setSelectedCat(c.slug)} className="p-2 border rounded text-xs dark:border-neutral-800 truncate text-neutral-800 dark:text-neutral-200">{c.name}</button>
                ))}
              </div>
              <div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 mb-1">Max Price: ${maxPrice}</p>
                <input
                  id="mobile-price-slider"
                  type="range"
                  min="10"
                  max="1000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          )}

          {/* Loading state indicator */}
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-neutral-500 font-mono">Synchronizing marketplace catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-4 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/50">
              <Grid className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mx-auto" />
              <div>
                <p className="font-display font-bold text-neutral-800 dark:text-neutral-200">No Catalog Products Match Your Filters</p>
                <p className="text-xs text-neutral-500 mt-1">Try relaxing price caps or searching with global phrases instead.</p>
              </div>
              <button
                id="reset-listings-filters"
                onClick={() => { setSearch(''); setSelectedCat('all'); setMaxPrice(600); }}
                className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5 font-sans">
              {filteredProducts.map((prod) => (
                <div
                  id={`product-listing-card-${prod.id}`}
                  key={prod.id}
                  className="group bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-850 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  
                  {/* Photo representation */}
                  <div className="relative aspect-square overflow-hidden bg-neutral-100">
                    <img
                      src={prod.images[0]}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                    />
                    
                    <button
                      id={`list-wishlist-toggle-${prod.id}`}
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(prod.id); }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-neutral-900/80 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-neutral-700 dark:text-neutral-300 backdrop-blur"
                    >
                      <Heart className={`h-4.5 w-4.5 ${wishlist.includes(prod.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>

                    {prod.stock <= 0 && (
                      <div className="absolute inset-0 bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center">
                        <span className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider animate-pulse">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  {/* Body information */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between text-left align-left">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] text-neutral-400">
                        <span className="uppercase font-mono font-semibold text-indigo-500 dark:text-indigo-400">{prod.category}</span>
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300">{prod.avgRating || 'New'}</span>
                        </div>
                      </div>

                      <h3 
                        onClick={() => onNavigate(`products/${prod.id}`)}
                        className="font-semibold text-neutral-900 dark:text-white text-xs hover:text-indigo-600 cursor-pointer line-clamp-1 transition duration-200"
                      >
                        {prod.title}
                      </h3>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed" title={prod.description}>
                        {prod.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-850 mt-3 flex items-center justify-between text-left">
                      <div>
                        <p className="text-sm font-extrabold text-neutral-900 dark:text-white">${prod.price.toFixed(2)}</p>
                        {prod.originalPrice && (
                          <span className="text-[9px] font-mono text-neutral-400 line-through">${prod.originalPrice.toFixed(2)}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`list-buy-btn-${prod.id}`}
                          onClick={() => onNavigate(`products/${prod.id}`)}
                          className="px-2.5 py-1 border border-neutral-250 dark:border-neutral-800 rounded-md text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        >
                          View Details
                        </button>
                        {prod.stock > 0 && (
                          <div className="flex items-center gap-1">
                            <button
                              id={`list-direct-buy-btn-${prod.id}`}
                              onClick={(e) => { e.stopPropagation(); addToCart(prod); onNavigate('cart'); }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold transition-all"
                            >
                              Buy ⚡
                            </button>
                            <button
                              id={`list-add-cart-btn-${prod.id}`}
                              onClick={() => { addToCart(prod); alert(`${prod.title} added to shopping bag!`); }}
                              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md cursor-pointer transition"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
