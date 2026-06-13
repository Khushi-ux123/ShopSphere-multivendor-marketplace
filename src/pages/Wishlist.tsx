/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';

interface WishlistProps {
  onNavigate: (page: string) => void;
}

export const Wishlist: React.FC<WishlistProps> = ({ onNavigate }) => {
  const { wishlist, products, toggleWishlist, addToCart } = useApp();

  const wishlistedItems = products.filter(p => wishlist.includes(p.id));

  const handleAddToCart = (product: any) => {
    addToCart(product);
    alert(`${product.title} has been moved to your shopping cart!`);
  };

  if (wishlistedItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center">
          <Heart className="h-8 w-8 text-rose-500 fill-rose-500/20" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">Your Wishlist is Empty</h1>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Save items that caught your attention here while exploring other artisanal categories.
          </p>
        </div>
        <button
          id="wishlist-discover-btn"
          onClick={() => onNavigate('products')}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs flex items-center gap-2 mx-auto transition"
        >
          Discover Products
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      
      <div className="space-y-4 mb-8">
        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">My Saved Wishlist</h1>
        <p className="text-xs text-neutral-500">You saved {wishlistedItems.length} craft products for future reviews</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {wishlistedItems.map((prod) => (
          <div
            id={`wishlist-item-card-${prod.id}`}
            key={prod.id}
            className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            {/* Visual Header */}
            <div className="relative aspect-square overflow-hidden bg-neutral-100">
              <img 
                src={prod.images[0]} 
                alt={prod.title} 
                className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
              />
              <button
                id={`wishlist-remove-${prod.id}`}
                onClick={() => toggleWishlist(prod.id)}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-neutral-80/90 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 backdrop-blur transition"
                title="Remove from wishlist"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Information panel */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-semibold uppercase text-indigo-500 dark:text-indigo-400">{prod.category}</span>
                <h3 
                  onClick={() => onNavigate(`products/${prod.id}`)}
                  className="font-medium text-neutral-900 dark:text-white text-sm hover:text-indigo-600 cursor-pointer line-clamp-1"
                >
                  {prod.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2" title={prod.description}>{prod.description}</p>
                <p className="text-sm font-bold text-neutral-950 dark:text-neutral-100 mt-2">${prod.price.toFixed(2)}</p>
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-850 mt-4">
                <button
                  id={`wishlist-cart-${prod.id}`}
                  onClick={() => handleAddToCart(prod)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Move to Cart
                </button>
              </div>

            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
