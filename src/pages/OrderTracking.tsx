/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Truck, 
  Package, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  CreditCard, 
  ArrowLeft, 
  Copy, 
  Sparkles, 
  Compass, 
  RefreshCw,
  Home,
  Check,
  Map,
  AlertCircle,
  Star,
  X,
  MessageSquare
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid
} from 'recharts';

interface OrderTrackingProps {
  initialOrderId?: string;
  onNavigate: (view: string) => void;
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ initialOrderId = '', onNavigate }) => {
  const { user, token } = useApp();
  const [searchId, setSearchId] = useState(initialOrderId);
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  // Rate My Order Modal state managers
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingVal, setRatingVal] = useState(5);
  const [hoverRatingVal, setHoverRatingVal] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [modalDismissed, setModalDismissed] = useState(false);

  useEffect(() => {
    if (order) {
      const isDelivered = order.items && order.items.length > 0 && order.items.every((i: any) => i.status === 'delivered');
      if (isDelivered && !order.isRated && !modalDismissed) {
        setShowRatingModal(true);
      }
    }
  }, [order, modalDismissed]);

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSubmittingRating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: ratingVal,
          comment: ratingComment
        })
      });
      if (res.ok) {
        setRatingSuccess(true);
        // update order locally so 'isRated' is true
        setOrder({
          ...order,
          isRated: true,
          items: order.items.map((it: any) => ({ ...it, isRated: true, itemRating: ratingVal, itemFeedback: ratingComment }))
        });
        setTimeout(() => {
          setShowRatingModal(false);
          setRatingSuccess(false);
          setRatingComment('');
        }, 1800);
      } else {
        const data = await res.json();
        alert(data.error || 'Could not record your review.');
      }
    } catch (err) {
      alert('Communication failure while submitting order review.');
    } finally {
      setSubmittingRating(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      fetchOrderDetails(initialOrderId);
    }
  }, [initialOrderId]);

  const fetchOrderDetails = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    setModalDismissed(false); // Reset dismiss lock when tracking a new wave
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(id.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        
        // Calculate simulated progress based on individual items status
        // average out statuses: pending = 10%, processing = 30%, shipped = 65%, delivered = 100%
        if (data.items && data.items.length > 0) {
          const statusWeights: Record<string, number> = {
            'pending': 15,
            'processing': 40,
            'shipped': 75,
            'delivered': 100,
            'cancelled': 0
          };
          const totalWeight = data.items.reduce((sum: number, item: any) => sum + (statusWeights[item.status] || 15), 0);
          const averageProgress = Math.round(totalWeight / data.items.length);
          setSimulatedProgress(averageProgress);
        }
      } else {
        const errData = await res.json();
        setError(errData.error || 'Invoice record not found on ShopSphere database query.');
      }
    } catch (e) {
      setError('Connection failure trying to retrieve parcel coordinates from dispatcher.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrderDetails(searchId);
  };

  const getStepStatus = (stepValue: number) => {
    if (simulatedProgress >= stepValue) return 'completed';
    if (simulatedProgress + 15 >= stepValue) return 'current';
    return 'upcoming';
  };

  const handleCopyId = () => {
    if (order?.id) {
      navigator.clipboard.writeText(order.id);
      alert('Invoice ID copied to clipboard!');
    }
  };

  // Stepper data based on the dynamic status weights
  const statusValues = [
    { name: 'Placed', val: 15, label: 'Order Confirmed', desc: 'Awaiting fulfillment team pickup' },
    { name: 'Processed', val: 40, label: 'In Production', desc: 'Craftsmen packing assets double foam' },
    { name: 'Shipped', val: 75, label: 'Dispatched', desc: 'In courier cargo transit radar' },
    { name: 'Delivered', val: 100, label: 'Delivered Signed', desc: 'Package signed at residence' }
  ];

  const trackingChartData = statusValues.map(step => ({
    name: step.name,
    label: step.label,
    progress: simulatedProgress,
    // active value is 100 if completed, or an intermediate progression
    value: simulatedProgress >= step.val ? 100 : (simulatedProgress + 30 >= step.val ? 45 : 0),
    desc: step.desc
  }));

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const stepVal = data.name === 'Placed' ? 15 : data.name === 'Processed' ? 40 : data.name === 'Shipped' ? 75 : 100;
      const isMet = simulatedProgress >= stepVal;
      return (
        <div className="bg-slate-900 border border-white/10 p-3 rounded-xl shadow-xl text-left max-w-[200px] font-sans">
          <p className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-wider">{data.name}</p>
          <p className="text-xs font-bold text-white mt-1 leading-tight">{data.label}</p>
          <p className="text-[9px] text-neutral-300 mt-1 leading-normal">{data.desc}</p>
          <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-white/5">
            <span className={`h-1.5 w-1.5 rounded-full ${isMet ? 'bg-emerald-500' : 'bg-neutral-600'}`} />
            <span className="text-[8.5px] font-mono text-neutral-400 font-semibold uppercase">
              {isMet ? 'Completed' : 'Awaiting'}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <button 
          onClick={() => onNavigate('customer-dashboard')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customer Portal
        </button>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">ShopSphere Dispatch Pipeline</span>
        </div>
      </div>

      {/* Main Title Info */}
      <div className="text-left space-y-2 mb-10">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Real-Time Courier Tracking
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
          Enter your Invoice Reference Number to inspect real-time courier dispatch status, simulated cargo transit vectors, and live fulfillment timeline indicators.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm text-left mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-neutral-400" />
            <input
              id="order-tracking-search-input"
              type="text"
              required
              placeholder="e.g. ord_1718059848529"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-neutral-400"
            />
          </div>
          <button
            id="order-tracking-query-btn"
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 text-white font-semibold text-xs sm:text-sm rounded-2xl transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Truck className="h-4 w-4" />
            )}
            Track Shipments
          </button>
        </form>
      </div>

      {/* Loading state spinner */}
      {loading && (
        <div className="py-24 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-mono text-neutral-500">Retrieving satellite dispatch data...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-3xl p-8 text-center max-w-lg mx-auto my-6 space-y-3">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <div>
            <h3 className="font-display font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wide">Lookup Failure</h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{error}</p>
          </div>
          <p className="text-[11px] text-neutral-500">Please double check the Invoice ID format. You can obtain your ID instantly from the transactions panel on your profile page.</p>
        </div>
      )}

      {/* Order info details panel */}
      {order && !loading && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Order Header / Key Details Banner style */}
          <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-8 border border-neutral-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-left">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                <Sparkles className="h-3 w-3" /> Courier Waybill Registered
              </span>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-base sm:text-lg font-bold tracking-tight text-white">{order.id}</h2>
                <button 
                  onClick={handleCopyId}
                  className="p-1 hover:bg-white/10 rounded transition text-neutral-400 hover:text-white"
                  title="Copy Reference ID"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-neutral-400">
                Purchased on <span className="font-semibold text-neutral-200">{new Date(order.createdAt).toLocaleDateString()}</span> to <span className="font-semibold text-neutral-200">{order.shippingAddress.fullName}</span>
              </p>
            </div>

            <div className="flex gap-4 border-t border-neutral-800 md:border-t-0 pt-4 md:pt-0 w-full md:w-auto font-mono">
              <div className="bg-neutral-800/50 px-4 py-2.5 rounded-2xl border border-neutral-700/30 flex-1 md:flex-none">
                <p className="text-[9px] uppercase tracking-wider text-neutral-400">Dispatcher</p>
                <p className="text-xs font-bold text-neutral-100 mt-0.5">ShopSphere Express</p>
              </div>
              <div className="bg-neutral-800/50 px-4 py-2.5 rounded-2xl border border-neutral-700/30 flex-1 md:flex-none">
                <p className="text-[9px] uppercase tracking-wider text-neutral-400">Est. Delivery</p>
                <p className="text-xs font-bold text-amber-400 mt-0.5">
                  {order.items.every((i: any) => i.status === 'delivered') 
                    ? 'Delivered' 
                    : new Date(new Date(order.createdAt).getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Timeline & Steps Column (Left 2 Col) */}
            <div className="lg:col-span-2 space-y-6 text-left">

              {/* RATE MY ORDER STATIC CALLOUT BANNER CARD */}
              {order && order.items && order.items.length > 0 && order.items.every((i: any) => i.status === 'delivered') && (
                <div className="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 dark:from-emerald-950/20 dark:to-indigo-950/20 border border-emerald-500/20 dark:border-emerald-500/40 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 text-left select-none animate-fadeIn">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[8.5px] font-mono font-bold bg-emerald-500 text-white rounded uppercase tracking-wider">
                        Order Delivered
                      </span>
                      <h4 className="font-display font-extrabold text-sm text-neutral-900 dark:text-white">
                        Rate Your Shopping Experience!
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md">
                      {order.isRated 
                        ? 'Thank you! Your verified star feedback and review comments have been securely saved.'
                        : 'Please tell us how our craftsmen performed by leaving a star rating and text feedback for the vendors.'
                      }
                    </p>
                  </div>
                  <button
                    id="rate-my-order-cta-btn"
                    onClick={() => {
                      setRatingVal(5);
                      setRatingComment('');
                      setShowRatingModal(true);
                    }}
                    className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition whitespace-nowrap ${
                      order.isRated 
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md'
                    }`}
                  >
                    {order.isRated ? 'View Rating Details' : 'Rate My Order'}
                  </button>
                </div>
              )}
              
              {/* Delivery Progress Card */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="font-display font-extrabold text-sm text-neutral-900 dark:text-white mb-6 uppercase tracking-wider">
                  Fulfillment Milestones
                </h3>
                
                {/* Recharts Flow Chart / Stepper Component */}
                <div className="mb-8 p-4 bg-neutral-50 dark:bg-neutral-950/40 rounded-2xl border border-neutral-200/50 dark:border-neutral-850 h-[170px] w-full relative">
                  <div className="absolute top-2 right-4 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-[8.5px] font-mono font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/55 px-2 py-0.5 rounded-lg border border-indigo-500/10">
                      ⚡ RECHARTS LOGISTICS STREAM
                    </span>
                  </div>
                  
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trackingChartData} margin={{ top: 35, right: 30, left: 30, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorFulfillment" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="50%" stopColor="#818cf8" stopOpacity={0.25}/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.08)" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={10}
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                        dy={8}
                      />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: 'rgba(99, 102, 241, 0.2)', strokeWidth: 1.5 }} />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorFulfillment)" 
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          const stepVal = payload.name === 'Placed' ? 15 : payload.name === 'Processed' ? 40 : payload.name === 'Shipped' ? 75 : 100;
                          const isCompleted = simulatedProgress >= stepVal;
                          return (
                            <g key={payload.name}>
                              <circle 
                                cx={cx} 
                                cy={cy} 
                                r={9} 
                                fill={isCompleted ? '#fdba74' : '#1e293b'} 
                                stroke={isCompleted ? '#f97316' : '#475569'} 
                                strokeWidth={2.5} 
                                className={isCompleted ? 'animate-pulse' : ''}
                              />
                              <circle 
                                cx={cx} 
                                cy={cy} 
                                r={isCompleted ? 3.5 : 2} 
                                fill={isCompleted ? '#ffffff' : '#64748b'} 
                              />
                            </g>
                          );
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Vertical granular tracking list */}
                <div className="relative border-l border-neutral-200 dark:border-neutral-800 pl-6 ml-3 space-y-8">
                  
                  {/* Step 4: Delivered */}
                  <div className="relative">
                    <div className={`absolute -left-[30px] top-0.5 p-1 rounded-full border ${
                      getStepStatus(100) === 'completed' 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400'
                    }`}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${getStepStatus(100) === 'completed' ? 'text-emerald-500' : 'text-neutral-500'}`}>
                        Delivered successfully
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">Package signed at primary entrance by residential recipient.</p>
                      {getStepStatus(100) === 'completed' && (
                        <span className="inline-block mt-2 text-[10px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-950 px-2 py-0.5 rounded">
                          Signed at {new Date(order.createdAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Shipped / Handed to Courier */}
                  <div className="relative">
                    <div className={`absolute -left-[30px] top-0.5 p-1 rounded-full border ${
                      getStepStatus(75) === 'completed' 
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500' 
                        : getStepStatus(75) === 'current'
                          ? 'bg-indigo-500 border-indigo-500 text-white animate-pulse'
                          : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400'
                    }`}>
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${
                        getStepStatus(75) === 'completed' ? 'text-neutral-900 dark:text-white' : getStepStatus(75) === 'current' ? 'text-indigo-500' : 'text-neutral-500'
                      }`}>
                        Handed Over to Courier Service
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">Waybill processed by ShopSphere Cargo Hub in {order.shippingAddress.state}. Dispatch vehicle details: Truck #{order.id.substring(4,8).toUpperCase()}</p>
                      {getStepStatus(75) === 'completed' && (
                        <span className="inline-block mt-2 text-[10px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-950 px-2 py-0.5 rounded">
                          Dispatched via Express Courier Carrier
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Processing */}
                  <div className="relative">
                    <div className={`absolute -left-[30px] top-0.5 p-1 rounded-full border ${
                      getStepStatus(40) === 'completed' 
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500' 
                        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400'
                    }`}>
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                        Fulfillment Warehouse Processing
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">Craftsman designers have accepted coordination orders. Catalog units picked, validated, and safely packed in double foam secure cases.</p>
                    </div>
                  </div>

                  {/* Step 1: Placed */}
                  <div className="relative">
                    <div className="absolute -left-[30px] top-0.5 p-1 rounded-full border bg-indigo-500/10 border-indigo-500 text-indigo-500">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                        Order Placed &amp; Funds Escrowed
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">Transactions registered successfully on the platform index. Merchant verification clearance achieved.</p>
                      <span className="inline-block mt-2 text-[10px] font-mono text-neutral-400 bg-neutral-105 dark:bg-neutral-950 px-2 py-0.5 rounded">
                        Authorized ref: {order.paymentId || 'PAY-ONLINE-DIRECT'}
                      </span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Items in shipment */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="font-display font-extrabold text-sm text-neutral-900 dark:text-white mb-4 uppercase tracking-wider">
                  Cargo Inventory Included ({order.items.length})
                </h3>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-4 first:pt-0 last:pb-0 gap-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-10 h-10 object-cover rounded-lg border border-neutral-100 dark:border-neutral-800"
                        />
                        <div>
                          <p className="font-semibold text-xs text-neutral-900 dark:text-white leading-tight">{item.title}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">Quantity: {item.quantity} x ${item.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 font-bold font-mono text-[8px] uppercase tracking-wider rounded ${
                        item.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' :
                        item.status === 'shipped' ? 'bg-blue-500/10 text-blue-500' :
                        item.status === 'processing' ? 'bg-amber-500/10 text-amber-500 animate-pulse' :
                        'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* GPS Vector / Quick Actions Column (Right Col) */}
            <div className="space-y-6 text-left">
              
              {/* Simulated Cargo Tracker Radar Map */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm overflow-hidden text-center">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-extrabold text-xs text-neutral-950 dark:text-white uppercase tracking-wider">
                    Simulated GPS Cargo Radar
                  </h3>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                </div>

                {/* Radar Grid Graphic panel */}
                <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-indigo-950 to-neutral-900 flex items-center justify-center overflow-hidden border border-neutral-800">
                  
                  {/* Radar grid segments circles */}
                  <div className="absolute inset-0 border border-indigo-500/10 rounded-full scale-[0.2]" />
                  <div className="absolute inset-0 border border-indigo-500/10 rounded-full scale-[0.4]" />
                  <div className="absolute inset-0 border border-indigo-500/10 rounded-full scale-[0.6] animate-pulse" />
                  <div className="absolute inset-0 border border-indigo-505/10 rounded-full scale-[0.8]" />
                  <div className="absolute inset-0 border border-indigo-500/10 rounded-full scale-[1.0]" />
                  
                  {/* Scan line rotation */}
                  <div className="absolute inset-0 bg-conic-radar origin-center animate-spin-slow opacity-25" />

                  {/* Milestones coordinate markers */}
                  <div className="absolute top-1/4 left-1/4 text-center">
                    <Compass className="h-4 w-4 text-indigo-400 animate-bounce mb-0.5" />
                    <span className="text-[8px] font-mono text-neutral-400 bg-black/40 px-1 rounded">DEPARTURE</span>
                  </div>

                  <div className="absolute bottom-1/3 right-1/4 text-center">
                    <MapPin className="h-5 w-5 text-rose-500 animate-pulse mb-0.5" />
                    <span className="text-[8px] font-mono text-neutral-200 bg-neutral-950/70 px-1 rounded uppercase">{order.shippingAddress.city}</span>
                  </div>

                  {/* Courier vehicle path pointer */}
                  {simulatedProgress >= 40 && simulatedProgress < 100 && (
                    <div 
                      className="absolute text-center transition-all duration-[3000ms] ease-in-out"
                      style={{
                        top: `${75 - (simulatedProgress - 40) * 0.7}%`,
                        left: `${25 + (simulatedProgress - 40) * 0.8}%`,
                      }}
                    >
                      <Truck className="h-4.5 w-4.5 text-amber-400 animate-pulse" />
                      <span className="text-[7px] font-mono font-bold text-white bg-indigo-600 px-1 rounded uppercase">IN TRANSIT</span>
                    </div>
                  )}

                  {/* Satellite stats overlay in radar */}
                  <div className="absolute bottom-3 left-3 bg-neutral-950/80 px-2 py-1 rounded-lg border border-neutral-800 text-[8px] font-mono text-emerald-400 text-left space-y-0.5">
                    <p>SAT-LINK: ACTIVE</p>
                    <p>GEO: {order.shippingAddress.latitude || '34.0522° N'}, {order.shippingAddress.longitude || '-118.2437° W'}</p>
                    <p>LATENCY: ~14ms</p>
                  </div>
                </div>

                <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-450 flex items-center justify-center gap-1.5">
                  <Map className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Interactive cargo routing simulation synced with courier logistics</span>
                </div>
              </div>

              {/* Courier Delivery Destination Info */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4 text-xs">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono">Consignee Address</p>
                  <p className="font-bold text-neutral-900 dark:text-white mt-1 text-sm">{order.shippingAddress.fullName}</p>
                </div>
                <div className="space-y-1 text-neutral-600 dark:text-neutral-400">
                  <p>{order.shippingAddress.addressLine1}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.postalCode}</p>
                  <p className="uppercase font-mono tracking-wider font-semibold text-[10px] mt-2 text-indigo-500">{order.shippingAddress.country}</p>
                </div>
                <div className="pt-3 border-t font-mono">
                  <p className="text-[9px] uppercase text-neutral-400">Recipient contact number</p>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200 mt-1">{order.shippingAddress.phone}</p>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Lookup guidance note */}
      {!order && !loading && (
        <div className="border border-indigo-100 dark:border-indigo-950/50 bg-indigo-55/20 dark:bg-indigo-950/10 rounded-3xl p-6 text-left max-w-xl mx-auto my-12 flex gap-4">
          <Sparkles className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-indigo-950 dark:text-indigo-300">How do I track my purchase?</h4>
            <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              When checking out from ShopSphere, we process a secure transaction invoice containing a unique ID. Take note of it, paste it into the field above, and query our carrier pipeline database. Safe travels inside the multi-vendor coordinate universe!
            </p>
          </div>
        </div>
      )}

      {/* Interstitial Rate My Order Modal dialog panel */}
      {showRatingModal && order && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 animate-fade-in" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          {/* Backdrop blur overlay */}
          <div 
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity" 
            onClick={() => { if (!submittingRating) { setModalDismissed(true); setShowRatingModal(false); } }} 
          />

          {/* Modal Container element */}
          <div className="relative bg-white dark:bg-neutral-900 border border-neutral-250/70 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 text-center max-w-md w-full shadow-2xl transition-all scale-100 select-none">
            
            {/* Close trigger anchor */}
            <button
              id="close-rating-modal-btn"
              onClick={() => { setModalDismissed(true); setShowRatingModal(false); }}
              disabled={submittingRating}
              className="absolute top-4 right-4 p-1.5 rounded-full border border-neutral-100 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition"
              title="Dismiss rating banner info"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Heading & Visual state symbol */}
            <div className="flex flex-col items-center space-y-2 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500">
                <Star className="h-6 w-6 fill-amber-500 animate-pulse" />
              </div>
              <h3 className="font-display font-extrabold text-lg text-neutral-900 dark:text-white" id="modal-title">
                {order.isRated ? 'Your Feedback Recalled' : 'Rate Your Order'}
              </h3>
              <p className="text-xs text-neutral-400 max-w-xs">
                {order.isRated 
                  ? `Order #${order.id.substring(4, 12).toUpperCase()} rating coordinates successfully compiled.` 
                  : `Please evaluate your artisan vendors and courier transport for Order #${order.id.substring(4, 12).toUpperCase()}.`
                }
              </p>
            </div>

            {ratingSuccess ? (
              <div className="py-8 space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-405">
                  <Check className="h-6 w-6 stroke-[3]" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-neutral-900 dark:text-white">Review Saved Successfully!</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Your ratings have been calculated dynamically inside vendor logs.</p>
                </div>
              </div>
            ) : order.isRated ? (
              <div className="space-y-4 text-left">
                {/* Rated items preview mode */}
                <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest font-extrabold">Active Rating</span>
                    <div className="flex gap-0.5 text-amber-550 mr-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-4.5 w-4.5 ${s <= (order.items[0]?.itemRating || 5) ? 'fill-amber-400 text-amber-400' : 'text-neutral-200 dark:text-neutral-800'}`} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest font-extrabold">Comments Logged</span>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 italic mt-1 leading-relaxed">
                      "{order.items[0]?.itemFeedback || 'Excellent courier dispatch transit efficiency.'}"
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="w-full px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-850 dark:text-white text-xs font-bold rounded-2xl border border-neutral-250/25 transition"
                >
                  Close Feedback Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRating} className="space-y-4">
                
                {/* Active review list items summary */}
                <div className="bg-neutral-50 dark:bg-neutral-950/60 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-850 text-left space-y-2 max-h-[120px] overflow-y-auto">
                  <p className="text-[9.5px] font-mono text-neutral-400 uppercase tracking-wider font-extrabold mb-1">Catalog items included:</p>
                  {order.items.map((it: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <img src={it.image} alt={it.title} className="w-7 h-7 object-cover rounded-md border border-neutral-250/10 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-neutral-855 dark:text-neutral-200 truncate leading-none">{it.title}</p>
                        <p className="text-[8px] font-mono text-neutral-400 mt-0.5">Seller: {it.vendorId.substring(4, 12).toUpperCase()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rating Input Star Line */}
                <div className="flex flex-col items-center space-y-1.5 py-3 rounded-2xl bg-neutral-25/50 dark:bg-neutral-950/20 border border-neutral-100 dark:border-neutral-850 transition-colors">
                  <span className="text-[9.5px] font-mono text-neutral-400 tracking-wider uppercase font-bold">Grade Order Quality</span>
                  <div id="star-rating-picker-container" className="flex gap-1.5 flex-wrap justify-center">
                    {[1, 2, 3, 4, 5].map((starIdx) => {
                      const isLit = hoverRatingVal ? starIdx <= hoverRatingVal : starIdx <= ratingVal;
                      return (
                        <button
                          id={`star-btn-${starIdx}`}
                          key={starIdx}
                          type="button"
                          onClick={() => setRatingVal(starIdx)}
                          onMouseEnter={() => setHoverRatingVal(starIdx)}
                          onMouseLeave={() => setHoverRatingVal(0)}
                          className="p-0.5 hover:scale-125 transition duration-150 cursor-pointer focus:outline-none"
                        >
                          <Star 
                            className={`h-6.5 w-6.5 transition-colors ${
                              isLit 
                                ? 'fill-amber-400 text-amber-400' 
                                : 'text-neutral-300 dark:text-neutral-700'
                            }`} 
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[10.5px] font-extrabold text-amber-500 font-mono">
                    {ratingVal === 1 && '⭐ Poor (Deficient)'}
                    {ratingVal === 2 && '⭐⭐ Substandard'}
                    {ratingVal === 3 && '⭐⭐⭐ Average (Standard)'}
                    {ratingVal === 4 && '⭐⭐⭐⭐ Highly Satisfactory'}
                    {ratingVal === 5 && '⭐⭐⭐⭐⭐ Exceptional Masterpiece'}
                  </span>
                </div>

                {/* Text feedback input field */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="order-rating-feedback-textarea" className="block text-[9.5px] font-mono text-neutral-405 dark:text-neutral-400 uppercase tracking-wider font-extrabold">
                    Explain Feedback Details
                  </label>
                  <textarea
                    id="order-rating-feedback-textarea"
                    required
                    rows={3}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Provide details about the packaging quality, shipping safety, product authenticity, and craft vendor performance..."
                    className="w-full px-4.5 py-3 text-xs border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 rounded-2xl focus:ring-1 focus:ring-indigo-500 focus:outline-none text-neutral-900 dark:text-neutral-200 placeholder-neutral-450 leading-relaxed disabled:opacity-50"
                    disabled={submittingRating}
                  />
                </div>

                {/* Confirm Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    id="cancel-rating-modal-btn"
                    type="button"
                    onClick={() => { setModalDismissed(true); setShowRatingModal(false); }}
                    disabled={submittingRating}
                    className="flex-1 px-4 py-2.5 border border-neutral-200 dark:border-neutral-800 text-xs font-bold rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-850 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-rating-modal-btn"
                    type="submit"
                    disabled={submittingRating || !ratingComment.trim()}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 transition text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingRating ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Submit Rating
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
