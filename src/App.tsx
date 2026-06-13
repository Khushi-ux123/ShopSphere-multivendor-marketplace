/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { ProductListing } from './pages/ProductListing';
import { ProductDetails } from './pages/ProductDetails';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Wishlist } from './pages/Wishlist';
import { DashboardCustomer } from './pages/DashboardCustomer';
import { DashboardVendor } from './pages/DashboardVendor';
import { DashboardAdmin } from './pages/DashboardAdmin';
import { LoginRegister } from './pages/LoginRegister';
import { ProfileSettings } from './pages/ProfileSettings';
import { OrderTracking } from './pages/OrderTracking';

import { NotificationToastStack } from './components/NotificationToastStack';

const AppContent: React.FC = () => {
  const { theme, currentView, navigateTo, setToken, setUser, setVendor } = useApp();

  // Handle URL hash/path initial configuration
  useEffect(() => {
    // Try to auto-login from localStorage token
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedVendor = localStorage.getItem('vendor');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      if (storedVendor) {
        setVendor(JSON.parse(storedVendor));
      }
    }
  }, []);

  // Sync light/dark tailwind theme mode classes on body
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Page Routing resolver based on custom string state
  const renderCurrentPage = () => {
    // Exact routes matching
    if (currentView === 'home') {
      return <Home onNavigate={navigateTo} />;
    }
    if (currentView.startsWith('products?') || currentView === 'products') {
      let searchParam = '';
      let categoryParam = 'all';
      if (currentView.includes('?')) {
        const queryStr = currentView.split('?')[1];
        const params = new URLSearchParams(queryStr);
        searchParam = params.get('search') || '';
        categoryParam = params.get('category') || 'all';
      }
      return (
        <ProductListing
          key={currentView}
          onNavigate={navigateTo}
          initialSearch={searchParam}
          initialCategory={categoryParam}
        />
      );
    }
    if (currentView === 'cart') {
      return <Cart onNavigate={navigateTo} />;
    }
    if (currentView === 'checkout') {
      return <Checkout onNavigate={navigateTo} />;
    }
    if (currentView === 'wishlist') {
      return <Wishlist onNavigate={navigateTo} />;
    }
    if (currentView === 'customer-dashboard') {
      return <DashboardCustomer />;
    }
    if (currentView === 'vendor-dashboard') {
      return <DashboardVendor />;
    }
    if (currentView === 'admin-dashboard') {
      return <DashboardAdmin />;
    }
    if (currentView === 'login') {
      return <LoginRegister onNavigate={navigateTo} />;
    }
    if (currentView === 'register-customer') {
      return <LoginRegister onNavigate={navigateTo} initialRegisterType="customer" />;
    }
    if (currentView === 'register-vendor') {
      return <LoginRegister onNavigate={navigateTo} initialRegisterType="vendor" />;
    }
    if (currentView === 'settings') {
      return <ProfileSettings onNavigate={navigateTo} />;
    }
    if (currentView.startsWith('track')) {
      let orderId = '';
      if (currentView.includes('/')) {
        orderId = currentView.split('/')[1];
      } else if (currentView.includes('?')) {
        const queryStr = currentView.split('?')[1];
        const params = new URLSearchParams(queryStr);
        orderId = params.get('id') || '';
      }
      return <OrderTracking initialOrderId={orderId} onNavigate={navigateTo} />;
    }

    // Dynamic Parameterized Routes Matching (e.g. products/:id)
    if (currentView.startsWith('products/')) {
      const productId = currentView.split('/')[1];
      return <ProductDetails productId={productId} onNavigate={navigateTo} />;
    }

    // Default Fallback
    return <Home onNavigate={navigateTo} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col justify-between transition-colors duration-300">
      
      {/* Platform Header Navigation */}
      <Navbar onNavigate={navigateTo} currentPage={currentView} />

      {/* Viewport Core Stage layout */}
      <main className="flex-grow">
        <div className="animate-fadeIn">
          {renderCurrentPage()}
        </div>
      </main>

      {/* Advantage, Info, Partner list layout */}
      <Footer onNavigate={navigateTo} />

      {/* Real-time Order Status Updates overlay */}
      <NotificationToastStack />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
