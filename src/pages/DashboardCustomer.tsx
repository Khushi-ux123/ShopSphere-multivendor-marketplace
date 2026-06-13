/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { jsPDF } from 'jspdf';
import { EmailNotificationLogs } from '../components/EmailNotificationLogs';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { 
  Package, 
  Heart, 
  MapPin, 
  MessageSquare, 
  Clock, 
  Receipt, 
  User as UserIcon, 
  Navigation,
  Send,
  Loader,
  Edit3,
  Undo,
  RefreshCw,
  XCircle,
  CheckCircle,
  AlertCircle,
  X,
  Calendar,
  Truck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Gift,
  Sparkles
} from 'lucide-react';

export const DashboardCustomer: React.FC = () => {
  const { user, orders, wishlist, products, fetchProducts, token, fetchOrders, navigateTo, addToCart, toggleWishlist } = useApp();

  // Spending trend data over the last 6 months
  const getSpendingTrendData = () => {
    const months = [];
    const now = new Date();
    
    // Generate last 6 months list (from 5 months ago to today)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      const yearLabel = d.getFullYear().toString().slice(-2);
      months.push({
        label: `${monthLabel} '${yearLabel}`,
        month: d.getMonth(),
        year: d.getFullYear(),
        amount: 0,
      });
    }

    // Populate with actual order spending sum
    orders.forEach((order: any) => {
      // Exclude cancelled from total spending trends
      if (order.status !== 'cancelled') {
        const orderDate = new Date(order.createdAt);
        const orderMonth = orderDate.getMonth();
        const orderYear = orderDate.getFullYear();
        
        const found = months.find(m => m.month === orderMonth && m.year === orderYear);
        if (found) {
          found.amount += order.totalAmount;
        }
      }
    });

    // Simplify to recharts format
    return months.map(m => ({
      name: m.label,
      Amount: parseFloat(m.amount.toFixed(2))
    }));
  };

  const trendData = getSpendingTrendData();

  // Predictive delivery helper based on carrier and status
  const getPredictiveDelivery = (createdAt: string, status: string) => {
    const baseDate = new Date(createdAt);
    let minDays = 2;
    let maxDays = 5;
    let accuracy = "96%";
    let formula = "Standard Courier Transit Velocity Calculation";
    let explanation = "Calculated from our historical dispatch records for DHL Express Express routing.";

    if (status === 'pending') {
      minDays = 4;
      maxDays = 7;
      accuracy = "88%";
      formula = "Artisan Queue + Freight Transport Cycle";
      explanation = "Artisans typically need up to 48 hours to secure block packaging before courier handoff.";
    } else if (status === 'processing') {
      minDays = 3;
      maxDays = 5;
      accuracy = "93%";
      formula = "Fulfillment Hub Sorting Flow rate";
      explanation = "Your package has been custom-packed. Awaiting loading dock scan at DHL logistics base.";
    } else if (status === 'shipped') {
      minDays = 1;
      maxDays = 3;
      accuracy = "97%";
      formula = "Active Linehaul Courier Transit Mode";
      explanation = "Cargo plane departed regional sorting depot. Estimated on-time schedule is solid.";
    } else if (status === 'delivered') {
      return {
        range: "Completed",
        days: "Delivered",
        accuracy: "100%",
        formula: "Final Hand-Delivered Receipt Certified",
        explanation: "Handed over directly to residence consignee on schedule."
      };
    }

    const minDate = new Date(baseDate);
    minDate.setDate(minDate.getDate() + minDays);
    const maxDate = new Date(baseDate);
    maxDate.setDate(maxDate.getDate() + maxDays);

    const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', weekday: 'short' };
    const estRange = `${minDate.toLocaleDateString('en-US', formatOptions)} - ${maxDate.toLocaleDateString('en-US', formatOptions)}`;
    
    return {
      range: estRange,
      days: `${minDays}-${maxDays} business days`,
      accuracy,
      formula,
      explanation
    };
  };
  
  const handleSimulatePriceDrop = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/simulate-deal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'price_drop' })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to simulate price drop');
      }
    } catch (error) {
      console.error('Error simulating price drop:', error);
    }
  };

  const handleSimulateRestock = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/simulate-deal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'back_in_stock' })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to simulate restock');
      }
    } catch (error) {
      console.error('Error simulating restock:', error);
    }
  };

  const handleDownloadInvoice = (order: any) => {
    const doc = new jsPDF();
    
    // Header brand design
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 27, 75); // Extra deep dark indigo for solid visibility
    doc.text("SHOPSPHERE", 20, 25);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(17, 24, 39); // Slate-900 (High contrast dark grey) for sub-brand
    doc.text("Bespoke Artisan Craft Marketplace & Partner Hub", 20, 31);
    doc.text("support@shopsphere-marketplace.example.com", 20, 36);
    
    // Stamp or Invoice box
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0); // Solid black for "OFFICIAL INVOICE" header
    doc.text("OFFICIAL INVOICE", 140, 25);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55); // Slate-800
    doc.text(`Invoice ID: ${order.id}`, 140, 31);
    doc.text(`Receipt Date: ${new Date(order.createdAt).toLocaleDateString()}`, 140, 36);
    doc.text(`Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus.toUpperCase()})`, 140, 41);
    
    // Draw decorative header divider
    doc.setDrawColor(75, 85, 99); // Slate-600 line for high visibility
    doc.setLineWidth(0.5);
    doc.line(20, 48, 190, 48);
    
    // Recipient & Shipping Information Section
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0); // Solid black
    doc.text("DELIVERY CONSIGNEE:", 20, 56);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(17, 24, 39); // Slate-900 for high-contrast recipient text
    const shipping = order.shippingAddress || {};
    doc.text(shipping.fullName || user?.name || 'Customer', 20, 62);
    doc.text(shipping.line1 || 'Primary Residence Address', 20, 67);
    doc.text(`${shipping.city || ''}, ${shipping.state || ''} ${shipping.postalCode || ''}`, 20, 72);
    doc.text(shipping.country || 'USA', 20, 77);
    doc.text(`Contact: ${shipping.phone || 'N/A'}`, 20, 82);
    
    // Items table header definition
    doc.setFillColor(226, 232, 240); // slate-200
    doc.rect(20, 92, 170, 8, "F");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0); // Pure solid black
    doc.text("Handcrafted Creation Particulars", 25, 97.5);
    doc.text("Unit Price", 115, 97.5);
    doc.text("Qty", 145, 97.5);
    doc.text("Net Total", 165, 97.5);
    
    // Iterating orders creation list
    let itemY = 107;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(31, 41, 55); // Slate-800 (high contrast dark)
    
    (order.items || []).forEach((item: any, idx: number) => {
      if (itemY > 250) {
        doc.addPage();
        itemY = 30;
      }
      doc.text(`${idx + 1}. ${item.title.substring(0, 40)}`, 25, itemY);
      doc.text(`$${item.price.toFixed(2)}`, 115, itemY);
      doc.text(item.quantity.toString(), 145, itemY);
      doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 165, itemY);
      itemY += 8;
    });
    
    // Net total summary layout block
    doc.setDrawColor(75, 85, 99); // Slate-600 line
    doc.line(20, itemY + 2, 190, itemY + 2);
    itemY += 12;
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0); // Solid black
    doc.text("Total Certified Grand Amount:", 100, itemY);
    doc.setTextColor(30, 27, 75); // Deep Indigo
    doc.text(`$${order.totalAmount.toFixed(2)}`, 165, itemY);
    
    // Soft reminder stamp
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(31, 41, 55); // Slate-800
    doc.text("Thank you for buying handcrafted creations directly from community artisans via ShopSphere.", 20, 275);
    doc.text("This official electronic record functions as proof of payment.", 20, 280);
    
    doc.save(`shopsphere-invoice-ref-${order.id}.pdf`);
  };

  // Chats state
  const [chats, setChats] = useState<any[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [chatsLoading, setChatsLoading] = useState(false);

  // Address edit state
  const [addressEditOrder, setAddressEditOrder] = useState<any | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLine1, setEditLine1] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editCountry, setEditCountry] = useState('');

  // Return / Exchange state
  const [returnExchangeItem, setReturnExchangeItem] = useState<{
    orderId: string;
    productId: string;
    title: string;
    type: 'return' | 'exchange';
  } | null>(null);
  const [requestReason, setRequestReason] = useState('Damaged or Defective');
  const [requestDetails, setRequestDetails] = useState('');

  const [loadingAction, setLoadingAction] = useState(false);

  // Core Interactive Persona & Gift Section States
  const [activeTab, setActiveTab] = useState<'orders' | 'gifting_chats' | 'notifications'>('orders');
  const [selectedGiftRecipient, setSelectedGiftRecipient] = useState<'kids' | 'adults' | 'women' | 'men' | 'seniors'>('women');
  const [isSpinning, setIsSpinning] = useState(false);
  const [customerWheelDegree, setCustomerWheelDegree] = useState(0);
  const [matchedGift, setMatchedGift] = useState<any | null>(null);
  const [scratchVoucherRevealed, setScratchVoucherRevealed] = useState(false);
  const [scratchCode, setScratchCode] = useState('GOLDGIFT2026');



  const handleSpinGiftWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setMatchedGift(null);
    setCustomerWheelDegree(prev => prev + 1440 + Math.floor(Math.random() * 360));
    
    setTimeout(() => {
      // Find candidate gifts matching recipients
      const candidates = products.filter(p => {
        const titleL = p.title.toLowerCase();
        
        switch (selectedGiftRecipient) {
          case 'kids':
            return titleL.includes('toy') || titleL.includes('kids') || titleL.includes('child') || titleL.includes('game') || titleL.includes('baby') || titleL.includes('plush') || titleL.includes('card');
          case 'women':
            return titleL.includes('dress') || titleL.includes('women') || titleL.includes('jewelry') || titleL.includes('ceramic') || titleL.includes('decor') || titleL.includes('ring') || titleL.includes('bag') || titleL.includes('soap');
          case 'men':
            return titleL.includes('leather') || titleL.includes('men') || titleL.includes('tool') || titleL.includes('wood') || titleL.includes('wallet') || titleL.includes('belt') || titleL.includes('card');
          case 'seniors':
            return titleL.includes('knit') || titleL.includes('warm') || titleL.includes('comfort') || titleL.includes('cozy') || titleL.includes('tea') || titleL.includes('cup') || titleL.includes('wool');
          case 'adults':
          default:
            return true;
        }
      });

      const finalPool = candidates.length > 0 ? candidates : products;
      if (finalPool.length > 0) {
        const randomIdx = Math.floor(Math.random() * finalPool.length);
        setMatchedGift(finalPool[randomIdx]);
      }
      setIsSpinning(false);
    }, 1550);
  };



  // Help & Support Center state
  const [supportSearch, setSupportSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders(); // Download fresh orders coordinates
    if (token) {
      loadCustomerChats();
    }
  }, [token]);

  const loadCustomerChats = async () => {
    setChatsLoading(true);
    try {
      const res = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        
        // Auto select first partner if not set
        if (data.length > 0 && !activePartnerId) {
          const firstMsg = data[0];
          const otherUserId = firstMsg.senderId === user?.id ? firstMsg.receiverId : firstMsg.senderId;
          setActivePartnerId(otherUserId);
        }
      }
    } catch (e) {
      console.error('Failed to resolve chats', e);
    }
    setChatsLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activePartnerId || !token) return;

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: activePartnerId,
          message: messageInput
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setChats(prev => [...prev, newMsg]);
        setMessageInput('');
      }
    } catch (err) {
      console.error('Failed to send text message', err);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order? This will replenish shop inventory reserves and notify sellers.')) {
      return;
    }
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert('Order successfully cancelled. Product inventory blocks have been released.');
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to cancel order.');
      }
    } catch (e) {
      alert('Network error trying to process cancellation.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEditAddressClick = (order: any) => {
    setAddressEditOrder(order);
    setEditFullName(order.shippingAddress.fullName || '');
    setEditPhone(order.shippingAddress.phone || '');
    setEditLine1(order.shippingAddress.addressLine1 || '');
    setEditCity(order.shippingAddress.city || '');
    setEditState(order.shippingAddress.state || '');
    setEditPostalCode(order.shippingAddress.postalCode || '');
    setEditCountry(order.shippingAddress.country || '');
  };

  const handleSaveAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressEditOrder || !editFullName || !editLine1 || !editCity || !editState || !editPostalCode || !editCountry) {
      alert('Please fill in all address coordinates fields.');
      return;
    }
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/orders/${addressEditOrder.id}/address`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shippingAddress: {
            fullName: editFullName,
            phone: editPhone,
            addressLine1: editLine1,
            city: editCity,
            state: editState,
            postalCode: editPostalCode,
            country: editCountry
          }
        })
      });
      if (res.ok) {
        alert('Delivery address updated successfully for Order #' + addressEditOrder.id);
        setAddressEditOrder(null);
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update address.');
      }
    } catch (e) {
      alert('Connection issue trying to contact database server.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRequestReturnExchangeClick = (orderId: string, productId: string, title: string, type: 'return' | 'exchange') => {
    setReturnExchangeItem({
      orderId,
      productId,
      title,
      type
    });
    setRequestReason('Damaged or Defective');
    setRequestDetails('');
  };

  const handleRequestReturnExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnExchangeItem) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/orders/${returnExchangeItem.orderId}/items/${returnExchangeItem.productId}/return-exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: returnExchangeItem.type,
          reason: requestReason,
          details: requestDetails
        })
      });
      if (res.ok) {
        alert(`Your request for product ${returnExchangeItem.type} has been registered under verification status successfully.`);
        setReturnExchangeItem(null);
        setRequestDetails('');
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to request return or exchange.');
      }
    } catch (e) {
      alert('Connection issue communicating return/exchange data.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Group messages by partner, so we present nice threads inside a support sidebar
  const getThreadsList = () => {
    const threads: Record<string, any> = {};
    chats.forEach((msg) => {
      const partnerId = msg.senderId === user?.id ? msg.receiverId : msg.senderId;
      if (!threads[partnerId]) {
        threads[partnerId] = {
          partnerId,
          messages: [],
          lastText: msg.message,
          lastTime: msg.createdAt
        };
      }
      threads[partnerId].messages.push(msg);
      threads[partnerId].lastText = msg.message;
      threads[partnerId].lastTime = msg.createdAt;
    });
    return Object.values(threads);
  };

  const activeThread = chats.filter(m => 
    (m.senderId === user?.id && m.receiverId === activePartnerId) || 
    (m.senderId === activePartnerId && m.receiverId === user?.id)
  );

  const threads = getThreadsList();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      
      {/* Visual greeting card matching high-contrast ShopSphere portal style */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-black text-white p-6 sm:p-8 rounded-[2.5rem] mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-2xl relative overflow-hidden border border-white/5 group">
        {/* Subtle background graphics */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
        
        <div className="space-y-2 relative z-10 max-w-lg">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/10 dark:bg-black/25 border border-white/10 backdrop-blur-md rounded-full text-[10px] font-mono font-black uppercase tracking-widest text-indigo-300">
              CUSTOMER ACCOUNT HUB
            </span>
            <span className="animate-ping h-2 w-2 rounded-full bg-emerald-500"></span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight leading-none text-white">
            Welcome Back, {user?.name || 'Customer'}! ✨
          </h1>
          <p className="text-neutral-300 text-xs sm:text-sm font-semibold leading-relaxed">
            Manage your items, check order status, initiate returns, and communicate with artisan partners instantly from your custom ShopSphere dashboard.
          </p>
        </div>
        <div className="flex gap-4 font-mono relative z-10">
          <div className="bg-white/5 border border-white/10 backdrop-blur-md px-5 py-3 rounded-2xl text-white shadow-xl hover:scale-105 transition-transform duration-200">
            <p className="text-3xl font-black font-display text-indigo-400">{orders.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-indigo-300 mt-0.5 font-bold">Purchases</p>
          </div>
          <div className="bg-white/5 border border-white/10 backdrop-blur-md px-5 py-3 rounded-2xl text-white shadow-xl hover:scale-105 transition-transform duration-200">
            <p className="text-3xl font-black font-display text-pink-400">{wishlist.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-pink-300 mt-0.5 font-bold">Alert Inbox</p>
          </div>
        </div>
      </div>

      {/* Dynamic Tab Navigation Controller Bar */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-8 gap-4 overflow-x-auto scrollbar-none">
        {[
          { key: 'orders', label: '🛒 My Purchases & Tracker', count: orders.length, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 text-[10px]' },
          { key: 'gifting_chats', label: '🎡 Surprise Wheel & Chats', count: threads.length, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 text-[10px]' },
          { key: 'notifications', label: '🔔 Notification Hub & Wishlist', count: wishlist.length, color: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 text-[10px]' }
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 pt-1 px-4 text-xs font-mono font-extrabold uppercase tracking-wider relative transition-all duration-300 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive 
                  ? 'text-neutral-900 border-b-2 border-indigo-600 dark:text-white' 
                  : 'text-neutral-400 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${tab.color}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT TWO COLUMNS: HISTORICAL ORDERS COURIER HUB */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === 'orders' && (
            <>
              <div className="space-y-1 pb-2 border-b">
                <h2 className="font-display font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-indigo-500" />
                  Historical Transactions &amp; Tracking Log
                </h2>
                <p className="text-xs text-neutral-550 dark:text-neutral-400">Review status updates for orders pending dispatcher updates</p>
              </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-3xl bg-neutral-50/50 dark:bg-neutral-900/50">
              <Clock className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
              <p className="font-bold text-xs text-neutral-800 dark:text-neutral-200 uppercase">No purchases registered</p>
              <p className="text-[11px] text-neutral-500 mt-1 max-w-xs mx-auto">Items you check out via cards or cash will list here complete with courier channels.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const orderCreatedAtTime = new Date(order.createdAt).getTime();
                const hoursRemaining = Math.max(0, 48 - (Date.now() - orderCreatedAtTime) / (1000 * 60 * 60));
                const worksAsCancellable = hoursRemaining > 0 && !order.items.some(item => 
                  item.status === 'shipped' || item.status === 'delivered' || item.status === 'cancelled'
                );
                const canEditAddress = hoursRemaining > 0 && !order.items.some(item => 
                  item.status === 'shipped' || item.status === 'delivered' || item.status === 'cancelled'
                );

                return (
                  <div key={order.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl overflow-hidden shadow-xs">
                    
                    {/* Top order recap card */}
                    <div className="bg-neutral-50 dark:bg-neutral-950/45 px-5 py-3.5 border-b flex flex-wrap justify-between items-center gap-4 text-xs">
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[9px] text-neutral-400 uppercase font-mono">Invoice Ref</p>
                          <p className="font-bold text-neutral-800 dark:text-neutral-200 font-mono">{order.id}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-neutral-400 uppercase font-mono">Receipt Date</p>
                          <p className="font-semibold text-neutral-700 dark:text-neutral-300">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-neutral-400 uppercase font-mono">Grand Total</p>
                          <p className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">${order.totalAmount.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold font-mono rounded text-[9px] uppercase">
                          {order.paymentMethod}
                        </span>
                        <span className={`px-2.5 py-1 font-bold font-mono rounded text-[9px] uppercase ${
                          order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {order.paymentStatus}
                        </span>
                        
                        <button
                          onClick={() => navigateTo(`track/${order.id}`)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-mono rounded text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all"
                        >
                          <Navigation className="h-3 w-3" />
                          Track Shipment
                        </button>

                        <button
                          onClick={() => handleDownloadInvoice(order)}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/50 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-300 border border-amber-300/50 dark:border-amber-800/40 font-bold font-mono rounded text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all shadow-3xs cursor-pointer"
                          title="Download invoice summary as printable PDF document"
                        >
                          <Receipt className="h-3 w-3 text-amber-800 dark:text-amber-400" />
                          <span className="text-amber-900 dark:text-amber-300 font-extrabold uppercase">Invoice PDF 📥</span>
                        </button>

                        {worksAsCancellable && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={loadingAction}
                            className="px-2.5 py-1 bg-red-650/10 hover:bg-neutral-100 text-red-600 font-bold font-mono rounded text-[9px] uppercase tracking-wider flex items-center gap-1 border border-red-500/20 shadow-2xs transition-all disabled:opacity-50"
                          >
                            <XCircle className="h-3 w-3" />
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order products list */}
                    <div className="p-5 space-y-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="border-b last:border-0 pb-5 last:pb-0 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800" />
                              <div className="space-y-1">
                                <p className="font-semibold text-xs text-neutral-900 dark:text-white">{item.title}</p>
                                <p className="text-[10px] text-neutral-400 font-mono">Qty: {item.quantity} x ${item.price.toFixed(2)}</p>
                                
                                {/* Delivered Item -> Exchange or Return Widget */}
                                {item.status === 'delivered' && (
                                  <div className="pt-2">
                                    {(item as any).returnRequest ? (
                                      <div className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900 space-y-0.5 max-w-sm">
                                        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider text-[8px]">
                                          <CheckCircle className="h-3 w-3 text-emerald-500" />
                                          {(item as any).returnRequest.type} request recorded
                                        </div>
                                        <p className="text-neutral-700 dark:text-neutral-300">
                                          Reason: <span className="font-semibold">{(item as any).returnRequest.reason}</span>
                                        </p>
                                        {((item as any).returnRequest.details) && (
                                          <p className="text-neutral-500 dark:text-neutral-400 italic">"{(item as any).returnRequest.details}"</p>
                                        )}
                                        <p className="text-[8.5px] text-neutral-400 font-mono">Status: Pending review confirmation</p>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => handleRequestReturnExchangeClick(order.id, item.productId, item.title, 'return')}
                                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-white dark:text-amber-400 dark:hover:text-white font-bold rounded-lg text-[9.5px] flex items-center gap-1 transition-all"
                                        >
                                          <Undo className="h-3 w-3" />
                                          Return Item
                                        </button>
                                        <button
                                          onClick={() => handleRequestReturnExchangeClick(order.id, item.productId, item.title, 'exchange')}
                                          className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-700 hover:text-white dark:text-indigo-400 dark:hover:text-white font-bold rounded-lg text-[9.5px] flex items-center gap-1 transition-all"
                                        >
                                          <RefreshCw className="h-3 w-3" />
                                          Exchange Item
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Order status tracking steps visual */}
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider ${
                                item.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' :
                                item.status === 'shipped' ? 'bg-blue-500/10 text-blue-500 animate-pulse' :
                                item.status === 'processing' ? 'bg-amber-500/10 text-amber-500' :
                                item.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                                'bg-neutral-100 text-neutral-500 dark:bg-neutral-850 dark:text-neutral-400'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                          </div>

                          {/* Beautiful Interactive Visual Shipping Timeline */}
                          {item.status !== 'cancelled' && (
                            <div className="bg-neutral-55/40 dark:bg-neutral-950/20 p-4 sm:p-5 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 transition-colors">
                              <div className="relative flex items-center justify-between w-full max-w-xl mx-auto px-6 py-2">
                                {/* Background connecting pipeline track */}
                                <div className="absolute left-[2.25rem] right-[2.25rem] top-[1.35rem] -translate-y-1/2 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full z-0" />
                                {/* Colored completed tracking metrics track */}
                                <div 
                                  className="absolute left-[2.25rem] top-[1.35rem] -translate-y-1/2 h-1 bg-indigo-650 dark:bg-indigo-500 rounded-full z-0 transition-all duration-[600ms] ease-out animate-pulse" 
                                  style={{
                                    width: 
                                      item.status === 'delivered' ? 'calc(100% - 4.5rem)' :
                                      item.status === 'shipped' ? '66%' :
                                      item.status === 'processing' ? '33%' : '0%'
                                  }}
                                />
                                                              {/* Timeline markers steps array mapping */}
                                {[
                                  { key: 'placed', label: 'Order Placed', active: true, icon: CheckCircle },
                                  { key: 'packed', label: 'Order Packed', active: ['processing', 'shipped', 'delivered'].includes(item.status), icon: Package },
                                  { key: 'shipped', label: 'Order Shipped', active: ['shipped', 'delivered'].includes(item.status), icon: Truck },
                                  { key: 'current', label: 'Order Delivered', active: item.status === 'delivered', icon: MapPin }
                                ].map((step, sIdx) => {
                                  const StepIcon = step.icon;
                                  return (
                                    <div key={sIdx} className="relative z-10 flex flex-col items-center">
                                      <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-350 border-2 shadow-xs ${
                                        step.active 
                                          ? 'bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500' 
                                          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500'
                                      }`}>
                                        <StepIcon className="h-4 w-4" />
                                      </div>
                                      <span className={`text-[9.5px] font-semibold mt-2 whitespace-nowrap tracking-tight ${
                                        step.active ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-neutral-400 dark:text-neutral-500'
                                      }`}>
                                        {step.label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
 
                              {/* Dynamic Courier status detailed readout banner */}
                              <div className="mt-4 bg-white dark:bg-neutral-900/80 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-700 dark:text-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs">
                                <div className="flex items-start gap-2.5">
                                  <span className="relative flex h-3 w-3 shrink-0 mt-0.5">
                                    {item.status === 'shipped' && (
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    )}
                                    {item.status === 'processing' && (
                                      <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    )}
                                    <span className={`relative inline-flex rounded-full h-3 w-3 ${
                                      item.status === 'delivered' ? 'bg-emerald-500' :
                                      item.status === 'shipped' ? 'bg-blue-500' :
                                      item.status === 'processing' ? 'bg-amber-500' : 'bg-neutral-400'
                                    }`}></span>
                                  </span>
                                  <div className="leading-relaxed font-sans">
                                    {item.status === 'delivered' && (
                                      <div>
                                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">📍 Delivery Completed</p>
                                        <p>🎉 <strong>Delivered Location:</strong> Handed to consignee <strong>{order.shippingAddress.fullName}</strong> at front entrance in <strong>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}, {order.shippingAddress.country}</strong>.</p>
                                      </div>
                                    )}
                                    {item.status === 'shipped' && (
                                      <div>
                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">📍 Current Location Tracker</p>
                                        <p>🚚 <strong>Current Warehouse Hub:</strong> Cargo Transit Carrier is currently on route inside <strong>{order.shippingAddress.state || 'local sorter center'}</strong>. Shipped and on its way to final destination of <strong>{order.shippingAddress.city}, {order.shippingAddress.country}</strong>.</p>
                                      </div>
                                    )}
                                    {item.status === 'processing' && (
                                      <div>
                                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">📍 Current Location Tracker</p>
                                        <p>📦 <strong>Current Warehouse Hub:</strong> Sealed package was cleared for courier dispatch. Moving to loading bay at seller fulfillment depot in <strong>{order.shippingAddress.state}</strong>.</p>
                                      </div>
                                    )}
                                    {item.status === 'pending' && (
                                      <div>
                                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">📍 Placement Verification Stage</p>
                                        <p>⏳ <strong>Current Status Location:</strong> Order registered securely in verification queue. Artisan is confirming inventory block before arranging local courier pickup channels.</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                                  <span className="text-[9px] font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-500 font-bold">
                                    Carrier: DHL Express
                                  </span>
                                  {item.status !== 'cancelled' && (() => {
                                    const pred = getPredictiveDelivery(order.createdAt, item.status);
                                    return (
                                      <div className="relative group/pred flex items-center justify-end">
                                        <div className="flex items-center gap-1 cursor-help bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/40 px-2 py-0.5 rounded text-[9.5px]">
                                          <Clock className="h-2.5 w-2.5 text-indigo-550 dark:text-indigo-400 animate-pulse" />
                                          <span className="text-indigo-650 dark:text-indigo-400 font-extrabold uppercase font-mono tracking-tight text-[8px]">
                                            Predictive Delivery 💡
                                          </span>
                                        </div>
                                        
                                        {/* Hover Tooltip Box */}
                                        <div className="absolute bottom-full right-0 mb-2 w-72 scale-95 opacity-0 pointer-events-none group-hover/pred:scale-100 group-hover/pred:opacity-100 group-hover/pred:pointer-events-auto transition-all duration-200 origin-bottom-right z-50">
                                          <div className="bg-neutral-900 text-white dark:bg-neutral-950 p-3.5 rounded-xl shadow-lg border border-neutral-800 text-left space-y-2 text-[10px] leading-relaxed">
                                            <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                                              <span className="font-bold text-indigo-400 font-mono tracking-widest uppercase text-[9px]">🔮 AI Dispatch Forecast</span>
                                              <span className="text-[8px] font-mono bg-indigo-900/60 px-1.5 py-0.5 rounded text-indigo-300 font-bold">
                                                Confidence: {pred.accuracy}
                                              </span>
                                            </div>
                                            
                                            <div className="space-y-1">
                                              <p className="text-neutral-300">
                                                <strong className="text-white">Est. Arrival Date:</strong>
                                              </p>
                                              <p className="text-indigo-300 font-extrabold text-xs font-mono">
                                                {pred.range}
                                              </p>
                                              <p className="text-[9px] text-neutral-450">
                                                Duration: {pred.days}
                                              </p>
                                            </div>

                                            <div className="pt-1 border-t border-neutral-800/80 space-y-1">
                                              <p className="text-[8.5px] text-neutral-400 leading-tight">
                                                <strong className="text-neutral-300 block font-sans text-[8px]">Methodology:</strong>
                                                {pred.formula}
                                              </p>
                                              <p className="text-[8.5px] text-neutral-450 italic leading-tight pt-0.5">
                                                {pred.explanation}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Delivery Address display details with Change option if eligible */}
                      <div className="pt-2 text-[11px] text-neutral-500 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-50 dark:bg-neutral-950 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-850">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-neutral-800 dark:text-neutral-300">Deliver To: {order.shippingAddress.fullName}</p>
                            <p>{order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
                            <p>Tel: {order.shippingAddress.phone}</p>
                          </div>
                        </div>

                        {canEditAddress && (
                          <div className="flex flex-col items-end gap-1 shrink-0 self-end md:self-center">
                            <button
                              onClick={() => handleEditAddressClick(order)}
                              disabled={loadingAction}
                              className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-850 text-indigo-600 dark:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-850 font-bold rounded-lg text-[10px] tracking-wide flex items-center gap-1 transition-all shadow-2xs hover:shadow-xs disabled:opacity-50"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Change Address
                            </button>
                            <p className="text-[8px] font-medium text-neutral-405 font-mono tracking-wider flex items-center gap-0.5 mt-1.5">
                              <Clock className="h-2.5 w-2.5 text-indigo-400" />
                              {hoursRemaining.toFixed(1)} hrs remaining to edit
                            </p>
                          </div>
                        )}
                      </div>

                    </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'gifting_chats' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[520px] animate-fadeIn">
          <div className="bg-neutral-50 dark:bg-neutral-950/45 px-5 py-4 border-b flex justify-between items-center">
            <div>
              <h3 className="font-display font-extrabold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-indigo-500 animate-bounce" />
                Active Artisan Correspondence (Wide Mode)
              </h3>
              <p className="text-[10px] text-neutral-550 dark:text-neutral-400">Real-time instant communication pipeline with shop craftsmen and dispatch couriers</p>
            </div>
            <button id="chats-refresh-btn-tab" onClick={loadCustomerChats} className="px-3 py-1 text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-450 hover:bg-indigo-100 rounded-lg font-bold border border-indigo-500/10 transition cursor-pointer">
              Refresh Thread
            </button>
          </div>

          {chatsLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2 select-none">
              <Loader className="h-6 w-6 text-indigo-500 animate-spin" />
              <p className="text-[10px] font-mono text-neutral-400">Retrieving correspondence strings...</p>
            </div>
          ) : threads.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-450 select-none">
              <MessageSquare className="h-8 w-8 text-neutral-305 mb-2" />
              <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">No active correspondence records found</p>
              <p className="text-[10px] text-neutral-500 mt-1 max-w-[280px]">Please head over to any of our custom custom detail pages and click \'Contact Seller\' to prompt chat logs.</p>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Threads list sidebar */}
              <div className="w-32 border-r border-neutral-150 dark:border-neutral-800 overflow-y-auto space-y-1 p-1.5 shrink-0 bg-neutral-25/55 dark:bg-neutral-950/20">
                {threads.map((thread) => (
                  <button
                    id={`customer-chat-thread-tab-${thread.partnerId}`}
                    key={thread.partnerId}
                    onClick={() => setActivePartnerId(thread.partnerId)}
                    className={`w-full p-2.5 text-left rounded-xl transition overflow-hidden text-ellipsis cursor-pointer ${
                      activePartnerId === thread.partnerId 
                        ? 'bg-indigo-600 text-white shadow-md font-bold' 
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <p className="text-[10.5px] line-clamp-1 font-bold">Artist Partner</p>
                    <p className={`text-[8.5px] font-mono line-clamp-1 ${activePartnerId === thread.partnerId ? 'text-indigo-200' : 'text-neutral-400'}`}>{thread.partnerId.substring(4, 12).toUpperCase()}</p>
                  </button>
                ))}
              </div>

              {/* Main active message thread */}
              <div className="flex-1 flex flex-col justify-between bg-neutral-50/50 dark:bg-neutral-950/25">
                
                {/* Messages scrollarea */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {activeThread.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`p-3 rounded-2xl max-w-[280px] text-xs font-semibold leading-relaxed shadow-sm ${
                          isMe 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white border text-neutral-850 rounded-tl-none dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-200'
                        }`}>
                          {msg.message}
                        </div>
                        <span className="text-[8px] font-mono text-neutral-400 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Input container box */}
                <form onSubmit={handleSendMessage} className="p-3.5 border-t bg-white dark:bg-neutral-900 flex gap-2">
                  <input
                    id="customer-chat-input-tab"
                    type="text"
                    required
                    placeholder="Type a response to artisan vendor..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-450 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    id="customer-chat-send-btn-tab"
                    type="submit"
                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-6 animate-fadeIn">
          <EmailNotificationLogs token={token} currentUserEmail={user?.email} />
        </div>
      )}

        </div>

        {/* RIGHT COLUMN: DIRECT ARTISAN SELLER CHAT CENTER */}
        <div className="space-y-6">

          {activeTab === 'gifting_chats' && (
            <div className="space-y-6 animate-fadeIn">
              {/* ✨ MULTI-GENERATIONAL ARTISAN GIFT GENERATOR & MATCHER WHEEL */}
              <div className="bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 border border-indigo-500/40 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden text-white group transform hover:scale-[1.02] hover:shadow-[0_25px_50px_rgba(99,102,241,0.25)] transition-all duration-300">
            {/* Background elements */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl -mr-8 -mt-8" />
            <div className="absolute left-0 bottom-0 w-32 h-32 bg-pink-500/10 rounded-full blur-xl -ml-8 -mb-8" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2 bg-indigo-500/40 text-indigo-200 rounded-lg text-xs font-bold leading-none uppercase tracking-widest flex items-center gap-1.5 shadow">
                    <Gift className="h-3.5 w-3.5 animate-bounce text-pink-400" />
                    Special Section
                  </span>
                </div>
                <span className="text-[9px] font-mono tracking-widest uppercase font-extrabold text-pink-400 animate-pulse">
                  🔮 Magic Generator
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-display font-black text-lg tracking-tight flex items-center gap-1">
                  Sparkle Gift Matcher &amp; Gifting Wheel
                </h3>
                <p className="text-[10.5px] text-indigo-200/80 leading-relaxed">
                  Stuck looking for the perfect surprise? Spin our handcrafted oracle to match any family member with custom-made organic gifts!
                </p>
              </div>

              {/* Selector for Recipient */}
              <div className="space-y-2 pt-1">
                <p className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-indigo-300">Select Gift Target Recipient:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'kids', label: '🧸 For Kids', tooltip: 'Playful toys and creations' },
                    { key: 'women', label: '👗 For Women', tooltip: 'Elegant luxury items and jewelry' },
                    { key: 'men', label: '⚡ For Men', tooltip: 'Strong designs and rustic accessories' },
                    { key: 'seniors', label: '👵 For Seniors', tooltip: 'Warm blankets and cozy sets' },
                  ].map((rec) => {
                    const isSelected = selectedGiftRecipient === rec.key;
                    return (
                      <button
                        key={rec.key}
                        type="button"
                        onClick={() => setSelectedGiftRecipient(rec.key as any)}
                        className={`px-2.5 py-2 text-[10px] font-bold rounded-xl transition-all duration-300 transform active:scale-95 cursor-pointer border text-left flex items-center justify-between ${
                          isSelected 
                            ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white border-transparent shadow-[0_4px_12px_rgba(236,72,153,0.3)] scale-103' 
                            : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                        }`}
                        title={rec.tooltip}
                      >
                        <span>{rec.label}</span>
                        {isSelected && <span className="text-[8px] animate-ping">●</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spinner Wheel Segment display */}
              <div id="customer-spin-wheel-card" className="flex flex-col items-center justify-center p-4 py-6 border border-white/5 bg-slate-900/60 rounded-3xl relative overflow-hidden group/spinner min-h-[220px]">
                {isSpinning ? (
                  <div className="space-y-4 text-center flex flex-col items-center justify-center">
                    {/* Visual Segmented Spinner Wheel */}
                    <div className="relative h-24 w-24 mx-auto flex items-center justify-center">
                      <div 
                        className="absolute inset-0 rounded-full border-4 border-dashed border-indigo-400 animate-spin" 
                        style={{ 
                          animationDuration: '1.2s',
                          transform: `rotate(${customerWheelDegree}deg)`,
                          transition: 'transform 1.5s cubic-bezier(0.25, 0.1, 0.25, 1)'
                        }} 
                      />
                      <div className="absolute inset-2 rounded-full border-4 border-dotted border-pink-400 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                      <div className="absolute inset-4 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center shadow-inner z-10 animate-pulse">
                        <Sparkles className="h-6 w-6 text-yellow-300" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono tracking-widest text-indigo-300 font-extrabold uppercase animate-pulse">Consulting ShopSphere Artisans...</p>
                      <p className="text-[8px] text-neutral-400 italic">Selecting the highest rated handmade creation</p>
                    </div>
                  </div>
                ) : matchedGift ? (
                  <div className="w-full text-left space-y-3.5 animate-fadeIn duration-550">
                    <div className="flex items-center justify-between">
                      <span className="text-[8.5px] uppercase font-mono tracking-widest bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-md font-bold">
                        🎁 Winner Perfect Match!
                      </span>
                      <button 
                        onClick={() => setMatchedGift(null)}
                        className="text-[9.5px] text-indigo-200 hover:text-white underline cursor-pointer font-bold font-mono uppercase"
                      >
                        Spin Again
                      </button>
                    </div>
                    
                    <div className="flex gap-3 bg-white/5 p-3 rounded-2xl border border-white/15 active:scale-99 transition-all">
                      <img 
                        src={matchedGift.images?.[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=150'} 
                        alt={matchedGift.title} 
                        className="w-16 h-16 rounded-xl object-cover bg-black/40 border border-white/10 shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white truncate leading-tight" title={matchedGift.title}>
                            {matchedGift.title}
                          </h4>
                          <p className="text-[11px] text-indigo-250 mt-1 font-mono font-black text-indigo-300">
                            ${matchedGift.price ? matchedGift.price.toFixed(2) : '19.99'}
                          </p>
                        </div>
                        <span className="text-[8px] text-neutral-400 truncate capitalize mt-1 block">
                          Cat: {matchedGift.category || 'Handcrafted'} ({matchedGift.stock > 0 ? `In Stock: ${matchedGift.stock}` : 'Pre-order status'})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-0.5">
                      <button
                        onClick={() => {
                          addToCart(matchedGift);
                          alert(`🎁 Yay! "${matchedGift.title}" has been added to your shopping gift cart!`);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-97 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        🛒 Add to Cart
                      </button>
                      <button
                        onClick={() => {
                          toggleWishlist(matchedGift.id);
                          alert(`❤️ "${matchedGift.title}" saved to your Wishlist alert tracker.`);
                        }}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl font-bold transition-all active:scale-97 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        ❤️ Save Match
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-center flex flex-col items-center justify-center">
                    {/* Visual Segmented Decorative Roulette Wheel */}
                    <div 
                      onClick={handleSpinGiftWheel}
                      className="relative h-24 w-24 mx-auto cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center rounded-full shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                    >
                      <div 
                        className="absolute inset-0 rounded-full border-4 border-double border-indigo-400/50" 
                        style={{ 
                          transform: `rotate(${customerWheelDegree}deg)`,
                          transition: 'transform 2s cubic-bezier(0.25, 0.1, 0.25, 1)',
                          background: 'conic-gradient(#6366f1 0deg 90deg, #ec4899 90deg 180deg, #8b5cf6 180deg 270deg, #f59e0b 270deg 360deg)'
                        }} 
                      />
                      <div className="absolute inset-1.5 bg-slate-950 rounded-full border border-white/10 flex items-center justify-center z-10">
                        <Gift className="h-6 w-6 text-pink-400 group-hover/spinner:scale-110 transition-transform duration-300" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <button
                        onClick={handleSpinGiftWheel}
                        className="px-6 py-2 bg-gradient-to-r from-pink-500 via-indigo-600 to-purple-600 hover:from-pink-600 hover:to-indigo-700 text-white text-xs font-black uppercase rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        🎡 Spin Magic Wheel
                      </button>
                      <p className="text-[8.5px] text-indigo-300 font-mono uppercase mt-2">105% Artisan Gold Match Guarantee</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scratch & reveal coupon area */}
              <div className="border border-white/10 p-4 bg-white/5 rounded-2xl space-y-3 mt-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-pink-305 font-bold block">
                    🌟 Customer Appreciation Ticket
                  </span>
                  <span className="text-[8px] font-mono text-neutral-400">Scratch &amp; Save</span>
                </div>
                
                {scratchVoucherRevealed ? (
                  <div className="bg-gradient-to-r from-amber-500/25 to-yellow-500/20 border border-amber-400/50 p-2.5 rounded-xl text-center space-y-1 animate-pulse">
                    <p className="text-[8.5px] uppercase font-mono text-amber-200 tracking-widest font-black">🌟 YOUR GOLDEN GIFT CODE REVEALED 🌟</p>
                    <p className="text-sm font-extrabold font-mono text-white tracking-widest bg-slate-950/60 p-1.5 rounded-lg border border-amber-450/30">
                      {scratchCode}
                    </p>
                    <p className="text-[8px] text-neutral-400">Apply code at review screen for flat 15% discount matches!</p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setScratchVoucherRevealed(true);
                    }}
                    className="w-full py-3 bg-gradient-to-br from-neutral-705 to-stone-850 hover:from-neutral-600 hover:to-stone-800 border bg-neutral-800 border-dashed border-neutral-500 rounded-xl text-center font-extrabold tracking-widest text-[9.5px] text-neutral-300 font-mono select-none uppercase hover:text-white transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>🎰 Press to Scratch Ticket ✨</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Wishlist & Real-Time Alerts Panel */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                    <span className="p-1 px-1.5 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-450 rounded-lg text-xs font-mono">❤️</span>
                    My Wishlist &amp; Alerts
                </h3>
                <p className="text-[10px] text-neutral-450 dark:text-neutral-400 mt-0.5">Real-time alerts for price drops &amp; restocks</p>
              </div>
              <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-955 text-rose-700 dark:text-rose-400 font-mono text-[9px] font-bold uppercase rounded-lg">
                WS Live Active
              </span>
            </div>

            {products.filter(p => wishlist.includes(p.id)).length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-xl bg-neutral-50/50 dark:bg-neutral-900/50">
                <p className="text-xs text-neutral-500">Your wishlist is empty.</p>
                <p className="text-[9px] text-neutral-450 mt-1">Browse cards or categories and click heart icons to sub.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {products.filter(p => wishlist.includes(p.id)).map(product => {
                  const isOutOfStock = product.stock === 0;
                  return (
                    <div key={product.id} className="flex items-center gap-3 p-2 rounded-xl border border-neutral-100 dark:border-neutral-850 hover:bg-neutral-50 dark:hover:bg-neutral-850/55 transition animate-fadeIn">
                      <img 
                        src={product.images[0]} 
                        alt={product.title} 
                        className="h-10 w-10 rounded-lg object-cover bg-neutral-100 dark:bg-neutral-950" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-grow min-w-0">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate" title={product.title}>
                          {product.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
                            ${product.price ? product.price.toFixed(2) : '0.00'}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-[10px] font-mono text-neutral-450 dark:text-neutral-400 line-through">
                              ${product.originalPrice.toFixed(2)}
                            </span>
                          )}
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            isOutOfStock 
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-450' 
                              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-450'
                          }`}>
                            {isOutOfStock ? 'Sold Out' : `In Stock (${product.stock})`}
                          </span>
                        </div>
                      </div>

                      {/* Simulation Trigger Column */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleSimulatePriceDrop(product.id)}
                          className="px-2 py-0.5 text-[8px] font-extrabold font-mono bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded border border-amber-200/50 dark:border-amber-900/45 transition cursor-pointer"
                          title="Simulate a 15% price discount drop"
                        >
                          💸 Drop %
                        </button>
                        <button
                          onClick={() => handleSimulateRestock(product.id)}
                          className="px-2 py-0.5 text-[8px] font-extrabold font-mono bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded border border-emerald-200/50 dark:border-emerald-900/45 transition cursor-pointer"
                          title="Simulate a stock update to restock item"
                        >
                          📦 Restock
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Core spending trend dynamic chart */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                  <span className="p-1 px-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 rounded-lg text-xs font-mono">📈</span>
                  Order Spending Trends
                </h3>
                <p className="text-[10px] text-neutral-450 dark:text-neutral-400 mt-0.5">Purchasing habits over the last 6 months</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-400 dark:text-neutral-500 font-bold block">Total Spent</span>
                <span className="text-xs font-mono font-extrabold text-indigo-650 dark:text-indigo-400">${trendData.reduce((sum, item) => sum + item.Amount, 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="h-[160px] w-full text-[9px] font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" className="hidden dark:block" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={8.5}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={8.5}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      border: 'none', 
                      borderRadius: '8px', 
                      color: '#f8fafc',
                      fontSize: '10px',
                      fontFamily: 'monospace'
                    }} 
                    formatter={(value: any) => [`$${value}`, 'Amount Spent']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Amount" 
                    stroke="#6366f1" 
                    strokeWidth={2.5}
                    activeDot={{ r: 5, stroke: '#818cf8', strokeWidth: 1 }}
                    dot={{ r: 3, strokeWidth: 1.5, fill: '#ffffff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Help & Support Center Search Box */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-indigo-500" />
              <div>
                <h3 className="font-display font-extrabold text-sm text-neutral-900 dark:text-white">Help &amp; Support</h3>
                <p className="text-[10px] text-neutral-400">Instant answers regarding shipping, returns, and invoice queries</p>
              </div>
            </div>

            {/* Live FAQ search field */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={supportSearch}
                onChange={(e) => {
                  setSupportSearch(e.target.value);
                  setExpandedFaq(null); // Reset expand on search for cleaner UX
                }}
                placeholder="Search shipping, returns, invoices..."
                className="w-full pl-9 pr-8 py-2.5 border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
              />
              {supportSearch && (
                <button 
                  onClick={() => setSupportSearch('')} 
                  className="absolute right-2.5 top-3 text-neutral-450 hover:text-neutral-600 dark:hover:text-neutral-300 text-xs animate-fade-in"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Frequently Asked Accordions */}
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {[
                {
                  question: "How can I download my order as a PDF invoice?",
                  answer: "Scroll down to 'Historical Transactions & Tracking Log', locate the relevant order card, and click the red 'Invoice PDF 📥' button to instantly generate and download a formal printable summary sheet of item breakdowns.",
                  category: "Invoice Downloads",
                  icon: Receipt
                },
                {
                  question: "How does standard shipping tracking work?",
                  answer: "Once the seller marks your item as packed/dispatched, the status updates to 'shipped'. We display an interactive timeline visualizer inside the order items panel showing real-time courier status and checkpoint log locations (e.g., DHL local hub updates).",
                  category: "Shipping",
                  icon: Truck
                },
                {
                  question: "How do I register an exchange or a return request?",
                  answer: "For any delivered items, click on the corresponding 'Return Item' or 'Exchange Item' button, choose our pre-populated reason parameters (e.g., Damaged or Defective), and enter any specific descriptive text before sending.",
                  category: "Returns",
                  icon: Undo
                },
                {
                  question: "Can I edit my delivery address after checking out?",
                  answer: "Absolutely! Look for the 'Change Address' action next to your delivery coordinates. You can alter shipping details freely within a 48-hour safety buffer or until any item in your order switches to 'shipped' state status.",
                  category: "Shipping",
                  icon: MapPin
                },
                {
                  question: "How can I text prompt/message my product designer?",
                  answer: "Take advantage of our built-in 'Seller Courier Chats' messenger center right on your screen. To start new individual chats, simply head to any of their custom product detail pages and press 'Contact Seller'.",
                  category: "Communication",
                  icon: MessageSquare
                }
              ].filter(faq => 
                faq.question.toLowerCase().includes(supportSearch.toLowerCase()) || 
                faq.answer.toLowerCase().includes(supportSearch.toLowerCase()) ||
                faq.category.toLowerCase().includes(supportSearch.toLowerCase())
              ).length === 0 ? (
                <div className="text-center py-6 text-neutral-400 dark:text-neutral-500">
                  <p className="text-xs font-mono font-bold">No answers found</p>
                  <p className="text-[10px] mt-1 text-neutral-500">Try keywords like 'invoice', 'shipping', 'return', 'address' or 'chat'</p>
                </div>
              ) : (
                [
                  {
                    question: "How can I download my order as a PDF invoice?",
                    answer: "Scroll down to 'Historical Transactions & Tracking Log', locate the relevant order card, and click the red 'Invoice PDF 📥' button to instantly generate and download a formal printable summary sheet of item breakdowns.",
                    category: "Invoice Downloads",
                    icon: Receipt
                  },
                  {
                    question: "How does standard shipping tracking work?",
                    answer: "Once the seller marks your item as packed/dispatched, the status updates to 'shipped'. We display an interactive timeline visualizer inside the order items panel showing real-time courier status and checkpoint log locations (e.g., DHL local hub updates).",
                    category: "Shipping",
                    icon: Truck
                  },
                  {
                    question: "How do I register an exchange or a return request?",
                    answer: "For any delivered items, click on the corresponding 'Return Item' or 'Exchange Item' button, choose our pre-populated reason parameters (e.g., Damaged or Defective), and enter any specific descriptive text before sending.",
                    category: "Returns",
                    icon: Undo
                  },
                  {
                    question: "Can I edit my delivery address after checking out?",
                    answer: "Absolutely! Look for the 'Change Address' action next to your delivery coordinates. You can alter shipping details freely within a 48-hour safety buffer or until any item in your order switches to 'shipped' state status.",
                    category: "Shipping",
                    icon: MapPin
                  },
                  {
                    question: "How can I text prompt/message my product designer?",
                    answer: "Take advantage of our built-in 'Seller Courier Chats' messenger center right on your screen. To start new individual chats, simply head to any of their custom product detail pages and press 'Contact Seller'.",
                    category: "Communication",
                    icon: MessageSquare
                  }
                ].filter(faq => 
                  faq.question.toLowerCase().includes(supportSearch.toLowerCase()) || 
                  faq.answer.toLowerCase().includes(supportSearch.toLowerCase()) ||
                  faq.category.toLowerCase().includes(supportSearch.toLowerCase())
                ).map((faq, idx) => {
                  const isExpanded = expandedFaq === idx;
                  const IconComp = faq.icon;
                  return (
                    <div 
                      key={idx} 
                      className="border border-neutral-150 dark:border-neutral-800 rounded-xl overflow-hidden transition-all duration-200 bg-neutral-25/40 dark:bg-neutral-950/20"
                    >
                      <button
                        onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                        className="w-full px-3 py-2.5 text-left flex justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <IconComp className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 leading-tight">
                            {faq.question}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-neutral-400 shrink-0 ml-1" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-neutral-400 shrink-0 ml-1" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="px-3 pb-2.5 pt-0.5 text-[10.5px] text-neutral-600 dark:text-neutral-400 leading-relaxed bg-white/50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-850 animate-in slide-in-from-top-1 duration-150">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick action badges */}
            <div className="pt-2 border-t border-neutral-150 dark:border-neutral-800 flex flex-wrap gap-1.5 justify-start text-[9px] font-mono text-neutral-550 font-bold">
              <span className="text-neutral-400 uppercase tracking-widest mr-1 self-center">Tags:</span>
              <button 
                onClick={() => setSupportSearch('invoice')}
                className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-indigo-600/10 dark:hover:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 rounded-md transition cursor-pointer"
              >
                #Invoices
              </button>
              <button 
                onClick={() => setSupportSearch('shipping')}
                className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-indigo-600/10 dark:hover:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 rounded-md transition cursor-pointer"
              >
                #Shipping
              </button>
              <button 
                onClick={() => setSupportSearch('return')}
                className="px-2 py-0.5 bg-neutral-105 dark:bg-neutral-800 hover:bg-indigo-600/10 dark:hover:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 rounded-md transition cursor-pointer"
              >
                #Returns
              </button>
            </div>
          </div>
          </div>
          )}

        </div>

      </div>

      {/* ---------------- ADDRESS REVISION MODAL ---------------- */}
      {addressEditOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-neutral-850 dark:text-neutral-200">
            <div className="bg-neutral-50 dark:bg-neutral-950 px-6 py-4 border-b border-neutral-150 dark:border-neutral-850 flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="h-4.5 w-4.5 text-indigo-500" />
                  Edit Order Shipping Address
                </h3>
                <p className="text-[10px] text-neutral-400">Order ID: #{addressEditOrder.id}</p>
              </div>
              <button
                onClick={() => setAddressEditOrder(null)}
                className="p-1 text-neutral-400 hover:text-neutral-650 dark:hover:text-neutral-250 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddressSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Full Name / Recipient</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-xl focus:ring-1 focus:ring-indigo-550 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-xl focus:ring-1 focus:ring-indigo-550 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Address line 1</label>
                <input
                  type="text"
                  required
                  value={editLine1}
                  onChange={(e) => setEditLine1(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-xl focus:ring-1 focus:ring-indigo-550 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">City</label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-xl focus:ring-1 focus:ring-indigo-550 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">State / Prov</label>
                  <input
                    type="text"
                    required
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-xl focus:ring-1 focus:ring-indigo-550 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={editPostalCode}
                    onChange={(e) => setEditPostalCode(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-xl focus:ring-1 focus:ring-indigo-550 focus:outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Country</label>
                  <input
                    type="text"
                    required
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-xl focus:ring-1 focus:ring-indigo-550 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setAddressEditOrder(null)}
                  className="px-4 py-2 border border-neutral-350 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-850 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow active:scale-98 disabled:opacity-50"
                >
                  {loadingAction ? 'Saving Address...' : 'Save Shipping Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- RETURN & EXCHANGE MODAL ---------------- */}
      {returnExchangeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-neutral-850 dark:text-neutral-200">
            <div className="bg-neutral-50 dark:bg-neutral-950 px-6 py-4 border-b border-neutral-150 dark:border-neutral-850 flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                  {returnExchangeItem.type === 'return' ? (
                    <Undo className="h-4.5 w-4.5 text-amber-500" />
                  ) : (
                    <RefreshCw className="h-4.5 w-4.5 text-indigo-500" />
                  )}
                  Product {returnExchangeItem.type === 'return' ? 'Return' : 'Exchange'}
                </h3>
                <p className="text-[10px] text-neutral-400">Order Ref: #{returnExchangeItem.orderId}</p>
              </div>
              <button
                onClick={() => setReturnExchangeItem(null)}
                className="p-1 text-neutral-400 hover:text-neutral-650 dark:hover:text-neutral-250 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRequestReturnExchange} className="p-6 space-y-4">
              <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200 dark:border-neutral-805 text-xs text-neutral-600 dark:text-neutral-350 leading-relaxed space-y-1">
                <p className="font-bold text-neutral-800 dark:text-neutral-200">Target Item:</p>
                <p className="font-serif italic font-medium">"{returnExchangeItem.title}"</p>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Reason for request</label>
                <select
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-xl focus:ring-1 focus:ring-indigo-550 focus:outline-none"
                >
                  <option value="Damaged or Defective">Damaged or Defective</option>
                  <option value="Incorrect Size / Fit mismatch">Incorrect Size / Fit mismatch</option>
                  <option value="Visual mismatch with Online Photos">Visual mismatch with Online Photos</option>
                  <option value="Received incorrect item count/product">Received incorrect item count/product</option>
                  <option value="Quality level below expectation">Quality level below expectation</option>
                  <option value="No longer desired by buyer">No longer desired by buyer</option>
                </select>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Additional Details / Comments</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell us exactly what was wrong, or your replacement size choice details..."
                  value={requestDetails}
                  onChange={(e) => setRequestDetails(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-xl focus:ring-1 focus:ring-indigo-550 focus:outline-none placeholder-neutral-400"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setReturnExchangeItem(null)}
                  className="px-4 py-2 border border-neutral-350 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-850 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow active:scale-98 disabled:opacity-50"
                >
                  {loadingAction ? 'Registering Request...' : `Submit ${returnExchangeItem.type === 'return' ? 'Return' : 'Exchange'} Request`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
