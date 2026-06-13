/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  ArrowLeft, 
  Truck, 
  RotateCcw, 
  MessageSquare,
  User as UserIcon,
  Store,
  MessageCircle,
  AlertTriangle,
  BadgeCheck,
  Check,
  Gift,
  Sparkles,
  Link2
} from 'lucide-react';

interface ProductDetailsProps {
  productId: string;
  onNavigate: (page: string) => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ productId, onNavigate }) => {
  const { fetchProductDetail, addReview, addToCart, toggleWishlist, wishlist, token, user, orders, products } = useApp();
  
  const [data, setData] = useState<{ product: any; reviews: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  
  // Interactive Gifting and Comparison states
  const [compareProductId, setCompareProductId] = useState<string>('');
  const [accessoryProduct, setAccessoryProduct] = useState<any | null>(null);

  // Review form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Chat/Correspondence mock state
  const [messagePrompt, setMessagePrompt] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showChatBox, setShowChatBox] = useState(false);

  // Recently Viewed states
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  const trackRecentlyViewed = (currentProduct: any) => {
    try {
      const stored = sessionStorage.getItem('recentlyViewed');
      let list: any[] = stored ? JSON.parse(stored) : [];
      
      // Filter out duplicate
      list = list.filter((p: any) => p.id !== currentProduct.id);
      
      // Unshift summary
      const productSummary = {
        id: currentProduct.id,
        title: currentProduct.title,
        price: currentProduct.price,
        images: currentProduct.images,
        category: currentProduct.category,
        avgRating: currentProduct.avgRating,
      };
      list.unshift(productSummary);
      
      // Slice list
      list = list.slice(0, 5);
      
      sessionStorage.setItem('recentlyViewed', JSON.stringify(list));
      setRecentlyViewed(list.filter((p: any) => p.id !== productId));
    } catch (e) {
      console.error('Error tracking recently viewed products:', e);
    }
  };

  const clearRecentlyViewed = () => {
    try {
      sessionStorage.removeItem('recentlyViewed');
      setRecentlyViewed([]);
    } catch (e) {
      console.error('Error clearing recently viewed products:', e);
    }
  };

  const getProductAndReviews = async () => {
    setLoading(true);
    const detail = await fetchProductDetail(productId);
    if (detail) {
      setData(detail);
      if (detail.product.images?.length > 0) {
        setActiveImage(detail.product.images[0]);
      }
      trackRecentlyViewed(detail.product);
    }
    setLoading(false);
  };

  useEffect(() => {
    getProductAndReviews();
    
    // Also update current view state immediately to prevent displaying current product
    try {
      const stored = sessionStorage.getItem('recentlyViewed');
      if (stored) {
        const list = JSON.parse(stored);
        setRecentlyViewed(list.filter((p: any) => p.id !== productId));
      } else {
        setRecentlyViewed([]);
      }
    } catch (e) {
      console.error('Error loading recently viewed products:', e);
    }
  }, [productId]);

  // Set up logical comparison product of matching category, or a general alternative
  useEffect(() => {
    if (data?.product && products?.length > 0) {
      const others = products.filter(p => p.id !== data.product.id && p.category === data.product.category);
      if (others.length > 0) {
        setAccessoryProduct(others[0]);
        setCompareProductId(others[0].id);
      } else {
        const anyOther = products.filter(p => p.id !== data.product.id);
        if (anyOther.length > 0) {
          setAccessoryProduct(anyOther[0]);
          setCompareProductId(anyOther[0].id);
        }
      }
    }
  }, [data, products]);

  const handleAddToCart = () => {
    if (data) {
      addToCart(data.product);
      alert(`${data.product.title} has been added to your shopping bag!`);
    }
  };

  const handleBuyNow = () => {
    if (data) {
      addToCart(data.product);
      onNavigate('cart');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingReview(true);
    setReviewError(null);
    try {
      const res = await fetch(`/api/products/${productId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });
      if (res.ok) {
        setComment('');
        setRating(5);
        setReviewError(null);
        alert('Your review has been successfully submitted and compiled!');
        getProductAndReviews(); // refresh review timeline
      } else {
        const errJson = await res.json();
        setReviewError(errJson.error || 'Could not publish review. Check your session.');
      }
    } catch (err) {
      setReviewError('Connection error trying to reach server database.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleContactVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messagePrompt.trim() || !token) return;
    setSendingMsg(true);
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: data?.product.vendorId,
          message: messagePrompt
        })
      });

      if (res.ok) {
        alert('Your message has been safely delivered to the seller catalog box! Check correspondence inside your Customer Panel.');
        setMessagePrompt('');
        setShowChatBox(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to dispatch message');
      }
    } catch {
      alert('Communication failed. Ensure server connectivity.');
    }
    setSendingMsg(false);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-neutral-500 font-mono">Unfolding master packaging specs...</p>
      </div>
    );
  }

  if (!data || !data.product) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="font-display font-bold text-lg text-neutral-900 dark:text-white">Product Catalog Specification Missing</h2>
        <p className="text-xs text-neutral-500">The product SKU your query requested does not exist or has been discontinued.</p>
        <button onClick={() => onNavigate('products')} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
          Return to Catalog
        </button>
      </div>
    );
  }

  const { product, reviews } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      
      {/* Back button */}
      <button
        id="detail-back-btn"
        onClick={() => onNavigate('products')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 transition mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to listings
      </button>



      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
        
        {/* IMAGES LEFT COLUMN COLUMN */}
        <div className="space-y-4">
          <div className="aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 relative group/zoom">
            <img 
              src={activeImage || product.images[0]} 
              alt={product.title} 
              className="w-full h-full object-cover rounded-3xl transition-transform duration-500 hover:scale-115 active:scale-130 cursor-zoom-in"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-[8.5px] font-mono tracking-wider text-white px-3 py-1 rounded-md uppercase font-bold select-none pointer-events-none opacity-0 group-hover/zoom:opacity-100 transition-opacity">
              🔍 Hover to zoom in
            </span>
          </div>
          
          {/* Sub photos grid */}
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img: string, i: number) => (
                <button
                  id={`detail-img-thumb-${i}`}
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`aspect-square rounded-xl overflow-hidden bg-neutral-50 border-2 transition ${
                    activeImage === img ? 'border-indigo-600' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail view" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* METADATA RIGHT GRID VIEW */}
        <div className="space-y-6">
          
          <div className="space-y-2">
            <span className="text-xs uppercase font-mono tracking-wider font-semibold text-indigo-500 dark:text-indigo-400">
              {product.category.replace('-', ' ')} Collection
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white leading-tight">
              {product.title}
            </h1>
            
            <div className="flex items-center gap-4 flex-wrap pt-1">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  {product.avgRating || 'No score'} ({product.totalReviews} ratings)
                </span>
              </div>
              <span className="text-neutral-300 dark:text-neutral-700">|</span>
              <span className={`text-xs font-semibold ${product.stock > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {product.stock > 0 ? `${product.stock} items remaining` : 'Discontinued (Out of Stock)'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 rounded-2xl">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-xs font-mono text-neutral-400 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1 uppercase font-mono">Tax inclusive with free dispatch coverage</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-neutral-900 dark:text-white text-xs uppercase tracking-wide">Product Overview</h3>
            <p className="text-xs sm:text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              {product.description}
            </p>
          </div>

          {/* Shipping specifications bar */}
          <div className="border-t border-b border-neutral-200 dark:border-neutral-850 py-4 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Secure Courier Dispatch</p>
                <p className="text-[10px] text-neutral-500">Delivered within 3-5 days</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">30-Day Escrow Coverage</p>
                <p className="text-[10px] text-neutral-500">Fast, easy return pipeline</p>
              </div>
            </div>
          </div>

          {/* Call to Actions */}
          {product.stock > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="detail-add-cart-btn"
                onClick={handleAddToCart}
                className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>

              <button
                id="detail-buy-now-btn"
                onClick={handleBuyNow}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                Buy Now ⚡
              </button>
              
              <button
                id="detail-wishlist-toggle"
                onClick={() => toggleWishlist(product.id)}
                className="p-3 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl transition shrink-0"
                title="Add to wishlist"
              >
                <Heart className={`h-5 w-5 ${wishlist.includes(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
          )}

          {/* ARTISAN SELLER BANNER ELEMENT */}
          <div className="p-4 bg-indigo-50/50 dark:bg-neutral-950 border border-indigo-100 dark:border-neutral-850 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-905 dark:text-white uppercase font-mono tracking-wider">Artisan Master Shop</h4>
                  <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{product.vendorName}</p>
                </div>
              </div>
              
              {token && user?.id !== product.vendorId && (
                <button
                  id="detail-contact-seller-btn"
                  onClick={() => setShowChatBox(!showChatBox)}
                  className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/15 text-indigo-700 dark:text-indigo-400 text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Contact Seller
                </button>
              )}
            </div>

            {showChatBox && (
              <form onSubmit={handleContactVendorSubmit} className="space-y-2 border-t border-indigo-100 dark:border-neutral-850 pt-3">
                <p className="text-[10px] font-mono text-neutral-400">Ask seller a question about stock custom options or specs:</p>
                <div className="flex gap-2">
                  <input
                    id="contact-vendor-msg-input"
                    type="text"
                    placeholder="Hello Alexander, could you tell me more about..."
                    value={messagePrompt}
                    onChange={(e) => setMessagePrompt(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg dark:bg-neutral-900 text-neutral-900 dark:text-white"
                  />
                  <button
                    id="contact-vendor-send-btn"
                    type="submit"
                    disabled={sendingMsg}
                    className="px-4 py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-700 transition"
                  >
                    Send
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>

      {/* 🤝 INTERACTIVE COMMERCE LAYERS: BUNDLES & COMPARISONS */}
      <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-10 pt-12 border-t border-neutral-200 dark:border-neutral-850">
        
        {/* 🎁 FREQUENTLY BOUGHT TOGETHER / SURPRISE BUNDLER */}
        {accessoryProduct && (
          <div className="bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-neutral-900/60 dark:via-neutral-950 dark:to-purple-950/20 border border-indigo-100 dark:border-neutral-800 p-6 rounded-[2.5rem] shadow-xl space-y-5">
            <div className="space-y-1">
              <span className="p-1 px-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest leading-none inline-flex items-center gap-1.5 animate-pulse">
                <Gift className="h-3 w-3" />
                Bundle &amp; Match Discount
              </span>
              <h3 className="font-display font-black text-lg text-neutral-900 dark:text-white tracking-tight">
                Frequently Bought Together
              </h3>
              <p className="text-xs text-neutral-500">
                Unlock high-value combinations rated by our global shopper base. Grab the set below now and save 15%!
              </p>
            </div>

            {/* Bundle Grid Cards */}
            <div className="flex flex-col sm:flex-row items-center gap-4 py-2 relative">
              
              {/* Card 1: Current Item */}
              <div className="flex items-center gap-3 bg-white/70 dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full sm:w-1/2">
                <img 
                  src={product.images[0]} 
                  alt={product.title} 
                  className="w-14 h-14 object-cover rounded-xl border shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate" title={product.title}>
                    {product.title}
                  </h4>
                  <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">${product.price.toFixed(2)}</p>
                </div>
              </div>

              {/* Linking Plus Sign */}
              <div className="p-2 bg-indigo-600 text-white rounded-full font-bold text-sm absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 shadow-lg border-2 border-white select-none hidden sm:flex items-center justify-center w-8 h-8">
                +
              </div>
              <div className="p-1.5 bg-indigo-600 text-white rounded-full font-bold text-xs flex sm:hidden items-center justify-center w-6 h-6 select-none shadow">
                +
              </div>

              {/* Card 2: Accessory Partner */}
              <div className="flex items-center gap-3 bg-white/70 dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full sm:w-1/2">
                <img 
                  src={accessoryProduct.images[0]} 
                  alt={accessoryProduct.title} 
                  className="w-14 h-14 object-cover rounded-xl border shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate" title={accessoryProduct.title}>
                    {accessoryProduct.title}
                  </h4>
                  <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">${accessoryProduct.price.toFixed(2)}</p>
                </div>
              </div>

            </div>

            {/* Price Calculations */}
            <div className="p-4 bg-white/60 dark:bg-neutral-905 rounded-2xl border border-neutral-150 dark:border-neutral-850 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-neutral-400 uppercase font-mono">Special Bundle Price</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                    ${((product.price + accessoryProduct.price) * 0.85).toFixed(2)}
                  </span>
                  <span className="text-xs text-neutral-400 line-through font-mono">
                    ${(product.price + accessoryProduct.price).toFixed(2)}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  addToCart(product);
                  addToCart(accessoryProduct);
                  alert(`🎉 Woohoo! BOTH "${product.title}" and "${accessoryProduct.title}" have been added to your cart with a 15% Combo promotion applied!`);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                Buy Bundle &amp; Save 15%
              </button>
            </div>
          </div>
        )}

        {/* ⚖️ PRODUCT DYNAMIC COMPARISON MATRIX */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-[2.5rem] shadow-xl space-y-5">
          <div className="space-y-1">
            <span className="p-1 px-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest leading-none inline-flex items-center gap-1.5">
              ⚖️ Smart Decision Matrix
            </span>
            <h3 className="font-display font-black text-lg text-neutral-905 dark:text-white tracking-tight">
              Compare Sibling Products
            </h3>
            <p className="text-xs text-neutral-500">
              Not sure which artisan spec matches your workspace configuration? Compare against alternatives below in real time.
            </p>
          </div>

          {/* Select dropdown container */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-mono uppercase tracking-wider text-neutral-400">Select Sibling Alternates</label>
            <select
              value={compareProductId}
              onChange={(e) => setCompareProductId(e.target.value)}
              className="w-full text-xs p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-250 dark:border-neutral-800 rounded-xl font-bold text-neutral-850 dark:text-neutral-100 focus:outline-none"
            >
              <option value="">-- Choose an alternative craft --</option>
              {products
                ?.filter(p => p.id !== product.id)
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} (${p.price.toFixed(2)}) - {p.category}
                  </option>
                ))}
            </select>
          </div>

          {/* Comparison Side-by-Side Matrix Table */}
          {compareProductId && (() => {
            const matchProd = products?.find(p => p.id === compareProductId);
            if (!matchProd) return null;
            return (
              <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-250 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                      <th className="p-3">Specification</th>
                      <th className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">This Product</th>
                      <th className="p-3 text-neutral-600 dark:text-neutral-300 font-bold">Alternate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-neutral-100 dark:border-neutral-850">
                      <td className="p-3 font-mono font-bold text-neutral-450 text-[10px]">Image</td>
                      <td className="p-3">
                        <img src={product.images[0]} alt={product.title} className="w-10 h-10 object-cover rounded-lg border" referrerPolicy="no-referrer" />
                      </td>
                      <td className="p-3">
                        <img src={matchProd.images[0]} alt={matchProd.title} className="w-10 h-10 object-cover rounded-lg border" referrerPolicy="no-referrer" />
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-100 dark:border-neutral-850">
                      <td className="p-3 font-mono font-bold text-neutral-450 text-[10px]">Craft Price</td>
                      <td className="p-3 font-mono font-black text-emerald-600">${product.price.toFixed(2)}</td>
                      <td className="p-3 font-mono font-black text-neutral-700 dark:text-neutral-305">${matchProd.price.toFixed(2)}</td>
                    </tr>
                    <tr className="border-b border-neutral-100 dark:border-neutral-850">
                      <td className="p-3 font-mono font-bold text-neutral-450 text-[10px]">Rating Score</td>
                      <td className="p-3">🔥 {product.avgRating || 'New'}</td>
                      <td className="p-3">⭐ {matchProd.avgRating || 'New'}</td>
                    </tr>
                    <tr className="border-b border-neutral-100 dark:border-neutral-850">
                      <td className="p-3 font-mono font-bold text-neutral-450 text-[10px]">Stock Level</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${product.stock > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                          {product.stock} left
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${matchProd.stock > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                          {matchProd.stock} left
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>

      </div>

      {/* REVIEWS & COMMENT BOARD HUB */}
      <section className="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-850">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Average breakdown & Write Review Form */}
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-white">Customer Reviews</h2>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-5xl font-extrabold text-neutral-900 dark:text-white">{product.avgRating ? Number(product.avgRating).toFixed(1) : 'No Reviews'}</span>
                <div>
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-5 w-5 ${i < Math.round(product.avgRating || 0) ? 'fill-amber-500' : 'text-neutral-250 dark:text-neutral-700'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Based on {reviews.length} authentic ratings</p>
                </div>
              </div>
            </div>

            {/* Form to submit a rating */}
            {token && user?.role === 'customer' ? (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-850 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-neutral-100 dark:border-neutral-800">
                  <h4 className="font-bold text-sm text-neutral-950 dark:text-neutral-50">Write a Review</h4>
                  {orders?.some(o => o.items?.some(item => item.productId === productId)) ? (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <BadgeCheck className="h-3 w-3" />
                      Verified Owner
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                      Unverified
                    </span>
                  )}
                </div>

                {orders?.some(o => o.items?.some(item => item.productId === productId)) ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    {reviewError && (
                      <div className="p-3 text-xs bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{reviewError}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                        Your Rating: <span className="font-bold text-amber-500">{hoverRating ?? rating} Stars</span>
                      </label>
                      <div className="flex gap-2 items-center py-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            id={`score-star-${s}`}
                            key={s}
                            type="button"
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => setRating(s)}
                            className="text-amber-500 transition-all duration-150 hover:scale-125 focus:outline-none"
                          >
                            <Star className={`h-8 w-8 transition-all duration-150 ${
                              s <= (hoverRating ?? rating) ? 'fill-amber-500 text-amber-500' : 'text-neutral-300 dark:text-neutral-700'
                            }`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Review Feedback</label>
                      <textarea
                        id="review-comment-textarea"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share details of your experience with this item, its quality, textures, or performance..."
                        className="w-full border border-neutral-300 dark:border-neutral-700 p-2.5 text-xs rounded-xl dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-1 focus:ring-indigo-550 focus:border-indigo-550 focus:outline-none placeholder-neutral-400 transition"
                      />
                    </div>

                    <button
                      id="review-submit-btn"
                      type="submit"
                      disabled={submittingReview}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition shadow-sm hover:shadow active:scale-[0.98]"
                    >
                      {submittingReview ? 'Submitting Review...' : 'Publish Feedback'}
                    </button>
                  </form>
                ) : (
                  <div className="p-3 text-xs bg-amber-500/5 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/10 space-y-2">
                    <p className="font-medium">
                      🔒 Purchase coordinates verification required.
                    </p>
                    <p className="text-[10px] leading-relaxed text-neutral-500">
                      Our system verifies that you have purchased this product before you are allowed to post star ratings or commentary feedback. This ensures absolute trust and coordinates transparency.
                    </p>
                  </div>
                )}
              </div>
            ) : !token ? (
              <div className="bg-neutral-50 dark:bg-neutral-900 p-5 rounded-2xl text-center border border-neutral-200 dark:border-neutral-800 space-y-3">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Sign in to write verified product reviews and contact marketplace sellers.
                </p>
                <button 
                  onClick={() => onNavigate('login')} 
                  className="w-full py-2 border border-indigo-600/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/5 font-semibold text-xs rounded-xl transition"
                >
                  Sign In →
                </button>
              </div>
            ) : null}
          </div>

          {/* FEEDBACK LISTING LIST */}
          <div className="lg:col-span-2 space-y-4">
            {reviews.length === 0 ? (
              <div className="p-12 text-center border border-dashed rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/30 text-neutral-400">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-700" />
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">No reviews found</p>
                <p className="text-[10px] text-neutral-400 mt-1">Be the first to order and review this masterpiece!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  Reviews history & feedback ({reviews.length})
                </h3>
                
                {reviews.map((rev) => {
                  const initials = rev.userName ? rev.userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
                  return (
                    <div key={rev.id} className="p-5 border border-neutral-200 dark:border-neutral-850 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm space-y-3 hover:translate-y-[-2px] transition duration-200">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-100 dark:border-neutral-800 font-bold text-xs text-indigo-600 dark:text-indigo-400 font-sans">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-neutral-850 dark:text-neutral-100">{rev.userName}</p>
                              {rev.verified && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                                  <BadgeCheck className="h-2.5 w-2.5" />
                                  Verified
                                </span>
                              )}
                            </div>
                            <p className="text-[9.5px] font-mono text-neutral-400 mt-0.5">
                              {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-700'}`} />
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300 italic font-medium px-1">
                        "{rev.comment}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 🕒 RECENTLY VIEWED PRODUCTS */}
      {recentlyViewed.length > 0 && (
        <section className="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-850">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-indigo-500 animate-spin-slow" />
                  Recently Viewed
                </h2>
                <p className="text-xs text-neutral-500 mt-1">Your recently visited items during this browsing session.</p>
              </div>
              <button 
                onClick={clearRecentlyViewed}
                id="clear-recent-btn"
                className="text-xs text-neutral-400 hover:text-rose-500 dark:hover:text-rose-450 font-semibold transition cursor-pointer"
              >
                Clear History
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {recentlyViewed.map((item: any) => (
                <div 
                  key={item.id}
                  id={`recent-item-${item.id}`}
                  onClick={() => onNavigate(`products/${item.id}`)}
                  className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl p-3 shadow-xs hover:shadow-md hover:-translate-y-1 transition duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden relative">
                      <img 
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80'} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase font-mono tracking-wider block">
                        {item.category?.replace('-', ' ')}
                      </span>
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 line-clamp-1 group-hover:text-indigo-600 transition">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-850">
                    <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                      ${item.price.toFixed(2)}
                    </span>
                    {item.avgRating ? (
                      <span className="text-[10px] font-medium text-amber-500 flex items-center gap-0.5">
                        ★ {item.avgRating}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
};
