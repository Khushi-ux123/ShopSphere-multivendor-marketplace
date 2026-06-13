/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Save, User as UserIcon, Store, Landmark, Mail, Map, ArrowLeft, Shield } from 'lucide-react';

interface ProfileSettingsProps {
  onNavigate: (page: string) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onNavigate }) => {
  const { user, vendor, token, updateUserSession } = useApp();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || vendor?.phone || '');
  const [address, setAddress] = useState(user?.address || vendor?.address || '');
  
  // Vendor-specific profile params
  const [storeName, setStoreName] = useState(vendor?.storeName || '');
  const [description, setDescription] = useState(vendor?.description || '');
  const [logoUrl, setLogoUrl] = useState(vendor?.logoUrl || '');
  const [bankAccount, setBankAccount] = useState(vendor?.bankAccount || '');
  
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          phone,
          address,
          storeName: user?.role === 'vendor' ? storeName : undefined,
          description: user?.role === 'vendor' ? description : undefined,
          logoUrl: user?.role === 'vendor' ? logoUrl : undefined,
          bankAccount: user?.role === 'vendor' ? bankAccount : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        updateUserSession(data.user, data.vendor);
        alert('Your settings have been saved and applied throughout the platform successfully!');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update preferences.');
      }
    } catch {
      alert('Internal connection failure.');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      
      {/* Back button */}
      <button
        id="profile-back-btn"
        onClick={() => {
          if (user?.role === 'admin') onNavigate('admin-dashboard');
          else if (user?.role === 'vendor') onNavigate('vendor-dashboard');
          else onNavigate('customer-dashboard');
        }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 transition mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Admin/Seller Dashboard
      </button>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
        
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Save className="h-6 w-6 text-indigo-500" />
            Account Profiles Setup
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Configure profile signatures, store descriptors, or accounting information.</p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
          
          {/* USER COORDINATES PORTION */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold text-neutral-400 font-mono tracking-wide flex items-center gap-1.5 pb-2 border-b">
              <UserIcon className="h-4 w-4" /> User Core Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-550 uppercase">Legal Full Name</label>
                <input
                  id="profile-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="space-y-1 opacity-60">
                <label className="text-[10px] text-neutral-550 uppercase">User Email (Immutable Record)</label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-9 pr-3.5 py-1.5 border border-neutral-200 dark:border-neutral-800 dark:bg-neutral-950 text-xs rounded-xl cursor-not-allowed"
                  />
                  <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-550 uppercase">Tel Contact</label>
                <input
                  id="profile-phone"
                  type="tel"
                  required
                  placeholder="+1 (555) 012-3456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none text-neutral-105"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-550 uppercase">Default Delivery / Street Address</label>
                <input
                  id="profile-addr"
                  type="text"
                  required
                  placeholder="Street details..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none text-neutral-105"
                />
              </div>
            </div>
          </div>

          {/* VENDOR SPECIFIC SETTINGS PORTION */}
          {user?.role === 'vendor' && (
            <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-850">
              <h3 className="text-xs uppercase font-bold text-neutral-400 font-mono tracking-wide flex items-center gap-1.5 pb-2 border-b">
                <Store className="h-4 w-4" /> Artisan Merchant Profile
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-550 uppercase">Store Signature Handle</label>
                  <input
                    id="profile-store-name"
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none text-neutral-105"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-550 uppercase">Artisan Shop Logo Link Image</label>
                  <input
                    id="profile-logo"
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-neutral-550 uppercase">Merchant Bio Description</label>
                <textarea
                  id="profile-desc"
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none"
                />
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3.5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-450 flex items-center gap-1.5">
                  <Landmark className="h-4 w-4" /> Settlement &amp; Bank Escrow Accounts
                </h4>
                <div className="space-y-1 text-left">
                  <label className="text-[9px] uppercase font-bold text-neutral-400">Account Wire Casing</label>
                  <input
                    id="profile-bank-details"
                    type="text"
                    required
                    placeholder="US-CHASE-0192-..."
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full px-3.5 py-1.5 border border-neutral-350 dark:border-neutral-700 dark:bg-white text-neutral-900 rounded-xl focus:outline-none dark:bg-neutral-950 dark:text-neutral-200"
                  />
                  <p className="text-[9px] text-neutral-400 italic">Net revenue from delivered e-commerce sales credits instantly back to this account.</p>
                </div>
              </div>

            </div>
          )}

          <button
            id="profile-save-btn"
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition"
          >
            {saving ? 'Synchronizing files...' : 'Save Settings Profiles'}
          </button>

        </form>

      </div>

    </div>
  );
};
