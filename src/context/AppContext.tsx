/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Vendor, Product, Category, Order, Review, Coupon, ChatMessage } from '../types';

const getCartKey = (u: User | null) => {
  if (!u) return 'cart_guest';
  if (u.role === 'admin' || u.role === 'vendor') {
    return 'cart_staff';
  }
  return `cart_${u.id || u.email}`;
};

const getWishlistKey = (u: User | null) => {
  if (!u) return 'wishlist_guest';
  if (u.role === 'admin' || u.role === 'vendor') {
    return 'wishlist_staff';
  }
  return `wishlist_${u.id || u.email}`;
};

interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  vendorId: string;
}

export interface LiveNotification {
  id: string;
  orderId: string;
  status: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface AppContextProps {
  currentView: string;
  navigateTo: (view: string) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  vendor: Vendor | null;
  setVendor: (vendor: Vendor | null) => void;
  cart: CartItem[];
  wishlist: string[];
  products: Product[];
  categories: Category[];
  orders: Order[];
  appliedCoupon: Coupon | null;
  theme: 'light' | 'dark';
  isLoading: boolean;
  error: string | null;
  notifications: LiveNotification[];
  dismissNotification: (id: string) => void;
  
  // Auth operations
  login: (token: string, user: User, vendor?: Vendor) => void;
  logout: () => void;
  updateUserSession: (user: User, vendor?: Vendor) => void;
  
  // Cart operations
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Wishlist operations
  toggleWishlist: (productId: string) => void;
  
  // Coupon operations
  applyDiscountCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  
  // API Fetch actions
  fetchProducts: (filters?: { category?: string; search?: string; sort?: string }) => Promise<void>;
  fetchProductDetail: (id: string) => Promise<{ product: Product; reviews: Review[] } | null>;
  addReview: (productId: string, rating: number, comment: string) => Promise<boolean>;
  submitOrder: (shippingAddress: any, paymentMethod: string) => Promise<boolean>;
  fetchOrders: () => Promise<void>;
  
  // Theme toggling
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<string>('home');
  const navigateTo = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [vendor, setVendor] = useState<Vendor | null>(() => {
    const saved = localStorage.getItem('vendor');
    return saved ? JSON.parse(saved) : null;
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedUser = localStorage.getItem('user');
    const u = savedUser ? JSON.parse(savedUser) : null;
    const saved = localStorage.getItem(getCartKey(u));
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const savedUser = localStorage.getItem('user');
    const u = savedUser ? JSON.parse(savedUser) : null;
    const saved = localStorage.getItem(getWishlistKey(u));
    return saved ? JSON.parse(saved) : [];
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    if (vendor) localStorage.setItem('vendor', JSON.stringify(vendor));
    else localStorage.removeItem('vendor');
  }, [vendor]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const [notifications, setNotifications] = useState<LiveNotification[]>([]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        console.log('Wishlist changed. Syncing wishlist with WebSocket server:', wishlist);
        socketRef.current.send(JSON.stringify({
          type: 'WISHLIST_SYNC',
          wishlist
        }));
      } catch (err) {
        console.error('Failed to sync wishlist on wishlist change:', err);
      }
    }
  }, [wishlist]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/?token=${encodeURIComponent(token)}`;
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      console.log('Connecting to WebSocket status updates feed...');
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connection opened. Syncing wishlist...');
        if (socket && socket.readyState === WebSocket.OPEN) {
          try {
            socket.send(JSON.stringify({
              type: 'WISHLIST_SYNC',
              wishlist
            }));
          } catch (err) {
            console.error('Failed to send initial wishlist sync:', err);
          }
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ORDER_STATUS_UPDATE') {
            // Trigger order list refresh
            fetchOrders();
            // Refresh product catalog in case stock quantities changed
            fetchProducts();
            
            // Add a beautiful toast alert to notifications
            const newNotif: LiveNotification = {
              id: `notif_${Date.now()}`,
              orderId: data.orderId,
              status: data.status,
              message: data.message,
              timestamp: data.timestamp || new Date().toISOString(),
              read: false,
            };
            setNotifications(prev => [newNotif, ...prev]);
            
            // Automatically dismiss toast after 9 seconds
            setTimeout(() => {
              dismissNotification(newNotif.id);
            }, 9000);
          } else if (data.type === 'WISHLIST_NOTIFICATION') {
            // Refresh product catalog in case price/stock elements changed
            fetchProducts();

            const newNotif: LiveNotification = {
              id: `notif_${Date.now()}`,
              orderId: '',
              status: data.updateType,
              message: data.message,
              timestamp: data.timestamp || new Date().toISOString(),
              read: false,
            };
            setNotifications(prev => [newNotif, ...prev]);

            setTimeout(() => {
              dismissNotification(newNotif.id);
            }, 9000);
          }
        } catch (err) {
          console.error('Error reading WebSocket message:', err);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket stream closed. Retrying in 5 seconds...');
        reconnectTimeout = setTimeout(connect, 5000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket stream error:', err);
        socket?.close();
      };
    }

    connect();

    return () => {
      if (socket) {
        socket.close();
      }
      socketRef.current = null;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [token]);

  // Initial loads
  useEffect(() => {
    fetchCategories();
    fetchProducts();
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error('Failed to fetch categories', e);
    }
  };

  const fetchProducts = async (filters?: { category?: string; search?: string; sort?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = '/api/products';
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.sort) params.append('sort', filters.sort);
      
      const res = await fetch(`${url}?${params.toString()}`);
      if (!res.ok) throw new Error('Could not download product catalog');
      const data = await res.json();
      setProducts(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  };

  const login = (jwtToken: string, userData: User, vendorData?: Vendor) => {
    setToken(jwtToken);
    setUser(userData);
    if (vendorData) setVendor(vendorData);
    else setVendor(null);

    // Sync state immediately upon login
    const cartKey = getCartKey(userData);
    const savedCart = localStorage.getItem(cartKey);
    setCart(savedCart ? JSON.parse(savedCart) : []);

    const wishlistKey = getWishlistKey(userData);
    const savedWishlist = localStorage.getItem(wishlistKey);
    setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setVendor(null);
    setOrders([]);
    setAppliedCoupon(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('vendor');

    // Reset to guest session immediately
    const cartKey = getCartKey(null);
    const savedCart = localStorage.getItem(cartKey);
    setCart(savedCart ? JSON.parse(savedCart) : []);

    const wishlistKey = getWishlistKey(null);
    const savedWishlist = localStorage.getItem(wishlistKey);
    setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
  };

  const updateUserSession = (userData: User, vendorData?: Vendor) => {
    setUser(userData);
    if (vendorData) setVendor(vendorData);

    const cartKey = getCartKey(userData);
    const savedCart = localStorage.getItem(cartKey);
    setCart(savedCart ? JSON.parse(savedCart) : []);

    const wishlistKey = getWishlistKey(userData);
    const savedWishlist = localStorage.getItem(wishlistKey);
    setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      let nextCart;
      if (existing) {
        nextCart = prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) }
            : item
        );
      } else {
        nextCart = [
          ...prev,
          {
            productId: product.id,
            title: product.title,
            price: product.price,
            quantity: Math.min(product.stock, quantity),
            image: product.images[0],
            vendorId: product.vendorId,
          },
        ];
      }
      localStorage.setItem(getCartKey(user), JSON.stringify(nextCart));
      return nextCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const nextCart = prev.filter(item => item.productId !== productId);
      localStorage.setItem(getCartKey(user), JSON.stringify(nextCart));
      return nextCart;
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => {
      const nextCart = prev.map(item => (item.productId === productId ? { ...item, quantity } : item));
      localStorage.setItem(getCartKey(user), JSON.stringify(nextCart));
      return nextCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    localStorage.setItem(getCartKey(user), JSON.stringify([]));
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const nextWishlist = prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId];
      localStorage.setItem(getWishlistKey(user), JSON.stringify(nextWishlist));
      return nextWishlist;
    });
  };

  const applyDiscountCoupon = async (code: string) => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, amount: subtotal }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Invalid Coupon Code');
      }
      const data = await res.json();
      setAppliedCoupon({
        code: data.code,
        discountPercent: data.discountPercent,
        description: data.message,
        active: true,
      });
      return true;
    } catch (e: any) {
      alert(e.message);
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const addReview = async (productId: string, rating: number, comment: string) => {
    if (!token) return false;
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
        fetchProducts(); // refresh products ratings
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const submitOrder = async (shippingAddress: any, paymentMethod: string) => {
    if (!token) return false;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
          shippingAddress,
          paymentMethod,
          couponCode: appliedCoupon?.code,
        }),
      });

      if (res.ok) {
        clearCart();
        fetchOrders();
        fetchProducts(); // Refresh stocks
        return true;
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit order');
        return false;
      }
    } catch (e) {
      return false;
    }
  };

  const fetchOrders = async () => {
    if (!token || !user) return;
    try {
      const endpoint = user.role === 'vendor' ? '/api/orders/vendor' : '/api/orders/customer';
      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error('Failed to download orders', e);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        navigateTo,
        token,
        setToken,
        user,
        setUser,
        vendor,
        setVendor,
        cart,
        wishlist,
        products,
        categories,
        orders,
        appliedCoupon,
        theme,
        isLoading,
        error,
        notifications,
        dismissNotification,
        login,
        logout,
        updateUserSession,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        applyDiscountCoupon,
        removeCoupon,
        fetchProducts,
        fetchProductDetail,
        addReview,
        submitOrder,
        fetchOrders,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside an AppProvider');
  return context;
};
