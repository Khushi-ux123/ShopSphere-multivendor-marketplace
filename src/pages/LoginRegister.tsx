/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
// @ts-ignore
import logoImg from '../components/assets/images/shopsphere_logo_1781309426828.jpg';
import { ShieldCheck, Eye, EyeOff, User as UserIcon, Mail, Lock, Store, Laptop } from 'lucide-react';

interface LoginRegisterProps {
  onNavigate: (page: string) => void;
  initialRegisterType?: 'customer' | 'vendor' | null;
}

export const LoginRegister: React.FC<LoginRegisterProps> = ({ onNavigate, initialRegisterType = null }) => {
  const { login, token } = useApp();
  
  // Tabs management
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Registration Role
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  
  // Shared text parameters
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Success state for pop up
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Vendor-specific parameters
  const [storeName, setStoreName] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  // Password recovery features
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [resetFinished, setResetFinished] = useState(false);

  useEffect(() => {
    if (initialRegisterType) {
      setActiveTab('register');
      setRole(initialRegisterType);
    }
  }, [initialRegisterType]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        login(data.token, data.user, data.vendor);
        alert('Credentials approved! Welcome back to ShopSphere systems.');
        
        // Redirect to appropriate page
        if (data.user.role === 'admin') onNavigate('admin-dashboard');
        else if (data.user.role === 'vendor') onNavigate('vendor-dashboard');
        else onNavigate('products');
      } else {
        const err = await res.json();
        alert(err.error || 'Authentication denied. Check password.');
      }
    } catch {
      alert('Internal connection failed.');
    }
    setLoading(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          storeName: role === 'vendor' ? storeName : undefined,
          storeDescription: role === 'vendor' ? storeDesc : undefined,
          phone: role === 'vendor' ? phone : undefined,
          address: role === 'vendor' ? address : undefined,
          bankAccount: role === 'vendor' ? bankAccount : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        login(data.token, data.user, data.vendor);
        setShowSuccessPopup(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Registration failed');
      }
    } catch {
      alert('Local database sync failed.');
    }
    setLoading(false);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail })
      });

      if (res.ok) {
        setResetFinished(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Reset query rejected');
      }
    } catch {
      alert('Internal error.');
    }
    setLoading(false);
  };

  // Rendering Password Recovery Box
  if (forgotPasswordMode) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-6 rounded-3xl space-y-6 shadow-xl">
          
          <div className="space-y-1 text-center">
            <h2 className="font-display font-extrabold text-lg text-neutral-900 dark:text-white uppercase tracking-wider">Account Recovery</h2>
            <p className="text-xs text-neutral-500">Provide registration email address to check vault matches</p>
          </div>

          {resetFinished ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900 rounded-2xl text-center space-y-3">
              <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Recovery check fired</p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">A secure simulation reset token has been dispatched. You can try logging in using base credentials: <strong>password123</strong>.</p>
              <button onClick={() => { setForgotPasswordMode(false); setResetFinished(false); }} className="text-xs font-bold text-indigo-600 hover:underline pt-2">Return to Login</button>
            </div>
          ) : (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">Registration Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  placeholder="customer@marketplace.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none placeholder-neutral-400"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  id="forgot-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition"
                >
                  {loading ? 'Sifting directories...' : 'Dispatch Reset Email'}
                </button>
                <button
                  id="forgot-cancel"
                  type="button"
                  onClick={() => setForgotPasswordMode(false)}
                  className="w-full text-center text-xs text-neutral-400 hover:text-indigo-600 hover:underline"
                >
                  Cancel Recovery
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      
      {/* Brand logo details */}
      <div className="text-center space-y-3 mb-8 flex flex-col items-center">
        <img 
          src={logoImg} 
          alt="ShopSphere Logo" 
          className="h-24 w-auto mix-blend-multiply dark:mix-blend-screen dark:filter dark:invert hover:opacity-90 transition-opacity object-contain"
          referrerPolicy="no-referrer"
        />
        <h2 className="font-display font-black tracking-tight text-3xl text-neutral-900 dark:text-white uppercase text-indigo-600 dark:text-indigo-400">ShopSphere Gateway</h2>
        <p className="text-xs text-neutral-500 max-w-xs mx-auto">Access your customer or seller dashboard from our unified authentication tunnel.</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-6 rounded-3xl shadow-2xl space-y-6">
        
        {/* Sign in vs Sign up tabs */}
        <div className="grid grid-cols-2 border-b border-neutral-100 dark:border-neutral-850 pb-1">
          <button
            id="tab-login"
            onClick={() => setActiveTab('login')}
            className={`pb-3 font-semibold text-xs uppercase tracking-wide transition ${
              activeTab === 'login' 
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-250'
            }`}
          >
            Sign In Account
          </button>
          <button
            id="tab-register"
            onClick={() => setActiveTab('register')}
            className={`pb-3 font-semibold text-xs uppercase tracking-wide transition ${
              activeTab === 'register' 
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-250'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* 1. SIGN IN FORM PANEL */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">E-mail Coordinates</label>
              <div className="relative">
                <input
                  id="login-email-input"
                  type="email"
                  required
                  placeholder="customer@marketplace.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none"
                />
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-neutral-500 uppercase font-bold">Password Key</label>
                <button
                  id="login-forgot-pass-btn"
                  type="button"
                  onClick={() => setForgotPasswordMode(true)}
                  className="text-[10px] text-indigo-600 hover:underline font-bold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-pass-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none"
                />
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                <button
                  id="login-eye-toggle"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              {loading ? 'Matching coordinates...' : 'Sign In'}
            </button>

            {/* Quick Register Action Links under layout instructions */}
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-850 space-y-2">
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider text-center font-sans">New to ShopSphere?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setRole('customer');
                  }}
                  className="py-2 text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/10 hover:bg-indigo-50/20 border border-indigo-200/50 dark:border-indigo-900/50 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 text-center"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  Register as Buyer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setRole('vendor');
                  }}
                  className="py-2 text-[10.5px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50/10 hover:bg-purple-50/20 border border-purple-200/50 dark:border-purple-900/50 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 text-center"
                >
                  <Store className="h-3.5 w-3.5" />
                  Register as Seller
                </button>
              </div>
            </div>

          </form>
        ) : (
          
          /* 2. REGISTRATION CARD FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* Choose Role selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Select Marketplace Intent</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  id="role-opt-customer"
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`p-2 border text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition ${
                    role === 'customer' 
                      ? 'border-indigo-600 bg-indigo-50/20 text-indigo-600' 
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                  }`}
                >
                  <UserIcon className="h-4 w-4" />
                  Become Buyer
                </button>
                <button
                  id="role-opt-vendor"
                  type="button"
                  onClick={() => setRole('vendor')}
                  className={`p-2 border text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition ${
                    role === 'vendor' 
                      ? 'border-indigo-600 bg-indigo-50/20 text-indigo-600' 
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                  }`}
                >
                  <Store className="h-4 w-4" />
                  Become Seller
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Legal Full Name</label>
              <input
                id="register-name"
                type="text"
                required
                placeholder="Jane Miller"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none placeholder-neutral-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">E-mail Coordinates</label>
              <input
                id="register-email"
                type="email"
                required
                placeholder="customer@marketplace.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none placeholder-neutral-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase">Secure Password Key</label>
              <input
                id="register-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none"
              />
            </div>

            {/* VENDOR EXTRAS PROFILE BUILD */}
            {role === 'vendor' && (
              <div className="space-y-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 animate-fadeIn">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Artisan Credentials Setup</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-400">Store Name Handle</label>
                    <input
                      id="register-store-name"
                      type="text"
                      required
                      placeholder="Sterling Tech Labs"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-400">Primary Store Tel</label>
                    <input
                      id="register-store-phone"
                      type="tel"
                      required
                      placeholder="+1 (415) 555-0199"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-400">Merchant Bio Description</label>
                  <textarea
                    id="register-store-desc"
                    rows={2}
                    required
                    placeholder="We produce bespoke linearly balanced switches..."
                    value={storeDesc}
                    onChange={(e) => setStoreDesc(e.target.value)}
                    className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-400">Legal Dispatch Address</label>
                  <input
                    id="register-store-addr"
                    type="text"
                    required
                    placeholder="582 Oak Ave, Portland, OR"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-400">Chase Clearance Bank Account</label>
                  <input
                    id="register-bank"
                    type="text"
                    required
                    placeholder="US-STERLING-CHASE-0941"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer active:scale-95 shadow-md shadow-indigo-600/15"
            >
              {loading ? 'Creating directory entry...' : role === 'vendor' ? 'Register as Seller' : 'Register as Buyer'}
            </button>

          </form>
        )}

      </div>

      {/* SUCCESS REGISTRATION POP UP DIALOG OVERLAY */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-250/50 dark:border-neutral-850 p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-300 relative overflow-hidden text-neutral-850 dark:text-neutral-105">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-600" />
            
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-inner border border-emerald-100 dark:border-emerald-900/40">
              ✨
            </div>
            
            <div className="space-y-2">
              <span className="text-[9.5px] bg-emerald-100 dark:bg-emerald-950/55 text-emerald-800 dark:text-emerald-300 font-mono tracking-widest font-extrabold px-3 py-1 rounded-md uppercase">
                Account Active
              </span>
              <h3 className="font-display text-2xl font-black tracking-tight text-neutral-900 dark:text-white mt-1">
                Account Created Successfully!
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto animate-pulse">
                Welcome to ShopSphere! Your brand new <span className="font-bold text-neutral-800 dark:text-neutral-200">{role === 'vendor' ? 'Artisan Seller Profile' : 'Customer Account Profile'}</span> is registered securely under dynamic multi-vendor parameters.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessPopup(false);
                  if (role === 'vendor') {
                    onNavigate('vendor-dashboard');
                  } else {
                    onNavigate('products');
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                Go to Your Dashboard &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
