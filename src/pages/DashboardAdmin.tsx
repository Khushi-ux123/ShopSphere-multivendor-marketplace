/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ShieldAlert, 
  Users, 
  UserCheck, 
  ShoppingBag, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Loader,
  Settings,
  FolderLock,
  Tag,
  Trash2,
  Activity
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const DashboardAdmin: React.FC = () => {
  const { token, fetchProducts } = useApp();
  
  type AdminTab = 'analytics' | 'vendors' | 'users' | 'orders' | 'coupons';
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Coupon states
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'percentage' | 'fixed_amount' | 'free_shipping'>('percentage');
  const [newPct, setNewPct] = useState(10);
  const [newVal, setNewVal] = useState(15);
  const [newMin, setNewMin] = useState(0);
  const [addingCoupon, setAddingCoupon] = useState(false);
  const [algoliaSyncing, setAlgoliaSyncing] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const authHeader = { 'Authorization': `Bearer ${token}` };

      // Parallel data fetching
      const [resAnal, resVend, resUser] = await Promise.all([
        fetch('/api/analytics', { headers: authHeader }),
        fetch('/api/admin/vendors', { headers: authHeader }),
        fetch('/api/admin/users', { headers: authHeader })
      ]);

      if (resAnal.ok) setAnalytics(await resAnal.json());
      if (resVend.ok) setVendorsList(await resVend.json());
      if (resUser.ok) setUsersList(await resUser.json());

    } catch (e) {
      console.error('Error fetching admin workspace', e);
    }
    setLoading(false);
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCouponsList(await res.json());
      }
    } catch (e) {
      console.error('Error downloading coupon definitions:', e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminData();
    }
  }, [token]);

  useEffect(() => {
    if (token && activeTab === 'coupons') {
      fetchCoupons();
    }
  }, [token, activeTab]);

  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    setAddingCoupon(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          type: newType,
          discountPercent: newType === 'percentage' ? parseFloat(newPct as any) : 0,
          discountValue: newType === 'fixed_amount' ? parseFloat(newVal as any) : 0,
          minAmount: newMin ? parseFloat(newMin as any) : undefined,
          description: newDesc || `${newCode} discount coupon`,
          active: true
        })
      });

      if (res.ok) {
        alert(`Successfully registered coupon: ${newCode.trim().toUpperCase()}`);
        setNewCode('');
        setNewDesc('');
        setNewMin(0);
        setNewPct(10);
        setNewVal(15);
        fetchCoupons();
      } else {
        const err = await res.json();
        alert(err.error || 'Coupon registry failed.');
      }
    } catch {
      alert('Internal network connection timed out.');
    } finally {
      setAddingCoupon(false);
    }
  };

  const handleToggleCouponActive = async (code: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/coupons/${code}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: !currentStatus })
      });
      if (res.ok) {
        fetchCoupons();
      } else {
        alert('Could not alter coupon state.');
      }
    } catch {
      console.error('Coupon state toggle fail.');
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`Are you sure you want to permanently delete coupon #${code}?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${code}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCoupons();
      } else {
        alert('Could not remove coupon.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAlgoliaSync = async () => {
    setAlgoliaSyncing(true);
    try {
      const res = await fetch('/api/admin/algolia/sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        alert(d.message || 'Product entries catalog uploaded to Algolia cleanly!');
      } else {
        const err = await res.json();
        alert(err.error || 'Algolia manual index synchronisation was declined.');
      }
    } catch {
      alert('Internal connection error while communicating with search servers.');
    } finally {
      setAlgoliaSyncing(false);
    }
  };

  const handleUpdateVendorStatus = async (vendorId: string, status: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to set status of this vendor account to '${status}'?`)) return;

    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        alert('Vendor marketplace onboarding status has been synchronized successfully!');
        fetchAdminData(); // refresh
        fetchProducts(); // refresh products listed
      } else {
        const err = await res.json();
        alert(err.error || 'Operation declined by server database');
      }
    } catch {
      alert('Internal processing failed.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="h-8 w-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-neutral-500 font-mono">Unlocking administrative registry vault...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      
      {/* Admin header */}
      <div className="bg-gradient-to-r from-rose-750 to-slate-900 text-white p-6 sm:p-8 rounded-3xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-mono font-medium">
            <FolderLock className="h-3.5 w-3.5 text-rose-350" />
            <span>EXECUTIVE SYSTEMS CONTROL REGISTER</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold loading-none">Global Marketplace Admin Console</h1>
        </div>
        
        <div className="flex gap-4 font-mono w-full sm:w-auto">
          <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/5 text-center flex-1">
            <p className="text-xl font-bold">${analytics?.revenueOverview.toFixed(2) || '0.00'}</p>
            <p className="text-[9px] uppercase tracking-wider text-rose-300 mt-0.5">Cleared Net Rev</p>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-4 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-sm font-semibold whitespace-nowrap transition ${
            activeTab === 'analytics' 
              ? 'border-b-2 border-rose-500 text-rose-600' 
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
          }`}
        >
          Cleared analytics &amp; Performance
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`pb-3 text-sm font-semibold whitespace-nowrap transition ${
            activeTab === 'vendors' 
              ? 'border-b-2 border-rose-500 text-rose-600' 
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
          }`}
        >
          Vendor Approval Queue ({vendorsList.filter(v => v.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-semibold whitespace-nowrap transition ${
            activeTab === 'users' 
              ? 'border-b-2 border-rose-500 text-rose-600' 
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
          }`}
        >
          Platform User Accounts Directory ({usersList.length})
        </button>
        <button
          id="admin-coupons-tab-btn"
          onClick={() => setActiveTab('coupons')}
          className={`pb-3 text-sm font-semibold whitespace-nowrap transition ${
            activeTab === 'coupons' 
              ? 'border-b-2 border-rose-500 text-rose-600' 
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
          }`}
        >
          Coupons &amp; Algolia Sync
        </button>
      </div>

      {/* RENDER ACTIVE VIEWS CONTAINER */}
      {activeTab === 'analytics' && (
        <section className="space-y-8">
          
          {/* Top stats panels */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl">
              <div className="flex justify-between items-start mb-3">
                <Users className="h-5 w-5 text-indigo-500" />
                <span className="text-[10px] font-mono text-neutral-400 uppercase">Users</span>
              </div>
              <p className="text-2xl font-extrabold text-neutral-905 dark:text-white">{analytics?.totalUsers}</p>
              <p className="text-xs text-neutral-400 mt-1">Total registered buyer/seller profiles</p>
            </div>

            <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl">
              <div className="flex justify-between items-start mb-3">
                <UserCheck className="h-5 w-5 text-emerald-500" />
                <span className="text-[10px] font-mono text-neutral-400 uppercase">Vendors</span>
              </div>
              <p className="text-2xl font-extrabold text-neutral-905 dark:text-white">{analytics?.totalVendors}</p>
              <p className="text-xs text-neutral-400 mt-1">Total specialized artisan sellers</p>
            </div>

            <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl">
              <div className="flex justify-between items-start mb-3">
                <ShoppingBag className="h-5 w-5 text-amber-500" />
                <span className="text-[10px] font-mono text-neutral-400 uppercase">Listed Items</span>
              </div>
              <p className="text-2xl font-extrabold text-neutral-905 dark:text-white">{analytics?.totalProducts}</p>
              <p className="text-xs text-neutral-400 mt-1">Catalog items published</p>
            </div>

            <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl">
              <div className="flex justify-between items-start mb-3">
                <TrendingUp className="h-5 w-5 text-rose-500" />
                <span className="text-[10px] font-mono text-neutral-400 uppercase">Orders Sold</span>
              </div>
              <p className="text-2xl font-extrabold text-neutral-905 dark:text-white">{analytics?.totalOrders}</p>
              <p className="text-xs text-neutral-400 mt-1">Completed online order receipts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Sales Volume Recharts bar chart */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-6 rounded-2xl flex flex-col justify-between">
              <h3 className="font-display font-bold text-neutral-900 dark:text-white text-xs uppercase tracking-wide mb-6">Best Selling Creations Performance</h3>
              <div className="h-64 sm:h-80">
                {analytics?.bestSelling && analytics.bestSelling.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.bestSelling}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="title" fontSize={8} stroke="#888888" />
                      <YAxis stroke="#888888" fontSize={9} />
                      <Tooltip />
                      <Bar dataKey="sales" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Completed Sales" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                    No order metrics registered yet.
                  </div>
                )}
              </div>
            </div>

            {/* Vendor Performance list table */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-6 rounded-2xl">
              <h3 className="font-display font-bold text-neutral-900 dark:text-white text-xs uppercase tracking-wide mb-6">Artisan Partnership Performaces</h3>
              
              {analytics?.vendorPerformance?.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-450">No partner accounts registered.</div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {analytics?.vendorPerformance.map((v: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border">
                      <div className="text-left">
                        <p className="font-semibold text-xs text-neutral-900 dark:text-white">{v.storeName}</p>
                        <p className="text-[10px] text-neutral-400 mt-1">{v.productsCount} catalog items listed • status: <span className="uppercase font-mono font-bold text-indigo-500">{v.status}</span></p>
                      </div>
                      <span className="font-mono text-sm font-extrabold text-emerald-500">+${v.earnings.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </section>
      )}

      {activeTab === 'vendors' && (
        <section className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-205 dark:border-neutral-850 p-4 rounded-xl">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-rose-500">Artisan Master Onboarding Review queue</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Authorise or restrict merchant registrations requesting marketplace access</p>
          </div>

          {vendorsList.length === 0 ? (
            <div className="py-20 text-center border font-semibold text-neutral-450 text-xs">No pending vendor applications reported.</div>
          ) : (
            <div className="space-y-4">
              {vendorsList.map((vend) => (
                <div key={vend.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  
                  <div className="space-y-2 flex-1 text-left">
                    <div className="flex gap-2 items-center">
                      <h4 className="font-bold text-xs text-neutral-900 dark:text-white uppercase">{vend.storeName}</h4>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-wider uppercase font-bold ${
                        vend.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        vend.status === 'pending' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                        {vend.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 font-serif leading-relaxed">"{vend.description}"</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[10px] text-neutral-400">
                      <p><strong>Merchant Email:</strong> {vend.userId}@marketplace.com</p>
                      <p><strong>Settlement Bank Route:</strong> {vend.bankAccount || 'None Provided'}</p>
                      <p><strong>Primary Contact:</strong> {vend.phone || 'None Provided'}</p>
                    </div>
                  </div>

                  {vend.status === 'pending' && (
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        id={`vendor-approve-btn-${vend.id}`}
                        onClick={() => handleUpdateVendorStatus(vend.userId, 'approved')}
                        className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve Merchant
                      </button>
                      <button
                        id={`vendor-reject-btn-${vend.id}`}
                        onClick={() => handleUpdateVendorStatus(vend.userId, 'rejected')}
                        className="flex-1 md:flex-none px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject File
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'users' && (
        <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-6 rounded-2xl">
          <h3 className="font-display font-medium text-xs uppercase text-neutral-900 dark:text-white border-b pb-4 mb-6">User Accounts Registry Directory</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b text-neutral-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Account ID</th>
                  <th className="py-3 px-4">Primary Name</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4">Workspace Role</th>
                  <th className="py-3 px-4">Signed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850 font-medium">
                {usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20">
                    <td className="py-3.5 px-4 font-mono text-[10px] text-neutral-400">{usr.id}</td>
                    <td className="py-3.5 px-4 text-neutral-900 dark:text-white font-semibold">{usr.name}</td>
                    <td className="py-3.5 px-4 font-mono text-neutral-500">{usr.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-wider font-extrabold uppercase ${
                        usr.role === 'admin' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40' :
                        usr.role === 'vendor' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' :
                        'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40'
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400 font-mono text-[10px]">{new Date(usr.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'coupons' && (
        <section className="space-y-8 animate-fadeIn text-left">
          
          {/* Algolia Search Sync Card (High-density design) */}
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500 animate-pulse" />
                <h3 className="font-display font-medium text-xs text-neutral-900 dark:text-white uppercase tracking-wider">Algolia Product Indexer Sync Server</h3>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed max-w-2xl">
                Force synchronize catalog entries directly with the Algolia search backend index. Running this triggers a complete clean sync of all registered products, updating real-time autocomplete matrices.
              </p>
            </div>
            <button
              onClick={handleAlgoliaSync}
              disabled={algoliaSyncing}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition duration-200 flex-shrink-0 flex items-center justify-center gap-1.5"
            >
              <Settings className={`h-4 w-4 ${algoliaSyncing ? 'animate-spin' : ''}`} />
              {algoliaSyncing ? 'Synchronizing Index...' : 'Trigger Algolia Re-index Sync'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Create Coupon Card */}
            <div className="lg:col-span-1 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 p-6 rounded-2xl h-fit">
              <h3 className="font-display font-bold text-xs text-rose-500 uppercase tracking-widest pb-3 border-b mb-5 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Register New Coupon
              </h3>

              <form onSubmit={handleCreateCouponSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Unique Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="SHOPSPHEREFREE"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3.5 py-2 uppercase border border-neutral-300 dark:border-neutral-750 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none focus:border-rose-500 text-neutral-800 dark:text-neutral-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Coupon Benefit Model</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full px-3.5 py-2 border border-neutral-350 dark:border-neutral-750 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none text-neutral-800 dark:text-neutral-200"
                  >
                    <option value="percentage">Percentage Off (%)</option>
                    <option value="fixed_amount">Fixed Cash Reduction ($)</option>
                    <option value="free_shipping">Free Shipping Rebate ($15)</option>
                  </select>
                </div>

                {newType === 'percentage' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Percentage Discount Amount (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={newPct}
                      onChange={(e) => setNewPct(parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs font-mono rounded-xl focus:outline-none text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                )}

                {newType === 'fixed_amount' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Cash Savings Value ($)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newVal}
                      onChange={(e) => setNewVal(parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs font-mono rounded-xl focus:outline-none text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Minimum Order Subtotal ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={newMin}
                    onChange={(e) => setNewMin(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs font-mono rounded-xl focus:outline-none text-neutral-800 dark:text-neutral-200"
                  />
                  <p className="text-[9px] text-neutral-450 mt-0.5">Optional. Set to 0 for no limits.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Label Description</label>
                  <input
                    type="text"
                    placeholder="ShopSphere coupon discount description"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3.5 py-2 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none text-neutral-800 dark:text-neutral-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingCoupon}
                  className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {addingCoupon ? 'Configuring System...' : 'Publish Unique Code'}
                </button>
              </form>
            </div>

            {/* Coupons list table (High density) */}
            <div className="lg:col-span-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <h3 className="font-display font-medium text-xs uppercase text-neutral-900 dark:text-white">Active Discount Coupon Registrations</h3>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-neutral-900 rounded text-[9px] text-neutral-500 font-bold">{couponsList.length} global</span>
              </div>

              {couponsList.length === 0 ? (
                <div className="py-20 text-center text-xs text-neutral-450 border border-dashed rounded-xl border-neutral-200 dark:border-neutral-850">
                  No discount coupons configured. Register one above to start.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b text-neutral-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Coupon Code</th>
                        <th className="py-3 px-4">Description / Type</th>
                        <th className="py-3 px-4">Discount Applied</th>
                        <th className="py-3 px-4">Min Spend</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850 font-medium">
                      {couponsList.map((cp) => (
                        <tr key={cp.code} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20">
                          <td className="py-3.5 px-4 font-mono font-bold text-rose-500 text-xs uppercase tracking-wider">
                            {cp.code}
                          </td>
                          <td className="py-3.5 px-4 text-left">
                            <p className="text-neutral-905 dark:text-white font-semibold">{cp.description}</p>
                            <p className="text-[9px] text-indigo-500 font-mono font-semibold mt-0.5 uppercase">
                              {(cp.type || 'percentage').replace('_', ' ')}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-neutral-900 dark:text-white font-semibold text-xs">
                            {cp.type === 'free_shipping' ? (
                              <span className="text-emerald-500 font-bold text-[10px]">FREE SHIPPING ($15)</span>
                            ) : cp.type === 'fixed_amount' ? (
                              <span>${cp.discountValue || cp.discountPercent || 0} OFF</span>
                            ) : (
                              <span>{cp.discountPercent}% OFF</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-neutral-400">
                            {cp.minAmount ? `$${cp.minAmount}` : 'No Limit'}
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleCouponActive(cp.code, cp.active)}
                              className={`px-2.5 py-1 rounded-full text-[9px] font-mono tracking-wider font-extrabold uppercase transition ${
                                cp.active 
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-450'
                              }`}
                            >
                              {cp.active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteCoupon(cp.code)}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                              title="Delete Coupon"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </section>
      )}

    </div>
  );
};
