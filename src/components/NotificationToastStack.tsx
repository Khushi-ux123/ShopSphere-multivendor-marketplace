import React from 'react';
import { useApp } from '../context/AppContext';
import { X, ShieldAlert, CheckCircle, Package, Truck } from 'lucide-react';

export const NotificationToastStack: React.FC = () => {
  const { notifications, dismissNotification, navigateTo, user } = useApp();

  if (!notifications || notifications.length === 0) return null;

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shipped':
        return <Truck className="h-4.5 w-4.5 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />;
      case 'cancelled':
      case 'rejected':
        return <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />;
      case 'price_drop':
        return <span className="text-base leading-none">💸</span>;
      case 'back_in_stock':
        return <span className="text-base leading-none">📦</span>;
      case 'pending':
      default:
        return <Package className="h-4.5 w-4.5 text-amber-500 animate-pulse" />;
    }
  };

  const handleToastClick = (notif: any) => {
    if (user) {
      if (user.role === 'vendor') {
        navigateTo('vendor-dashboard');
      } else if (user.role === 'admin') {
        navigateTo('admin-dashboard');
      } else {
        navigateTo('customer-dashboard');
      }
    }
    dismissNotification(notif.id);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-855 shadow-2xl p-4 rounded-2xl flex gap-3 items-start transform transition-all duration-300 animate-slideIn hover:translate-y-[-2px] border-l-4 border-l-indigo-500"
          style={{ contentVisibility: 'auto' }}
        >
          {/* Accent icon */}
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-950 flex-shrink-0 mt-0.5">
            {getStatusIcon(notif.status)}
          </div>

          {/* Details message */}
          <div 
            className="flex-grow space-y-1 text-left cursor-pointer" 
            onClick={() => handleToastClick(notif)}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-450 dark:text-neutral-500">
                {notif.orderId ? 'Order Update Alert' : 'Wishlist Deal Alert'}
              </span>
              {notif.orderId && (
                <span className="text-[9px] font-mono font-medium text-indigo-600 dark:text-indigo-400">#{notif.orderId.substring(0, 12)}</span>
              )}
            </div>
            <p className="text-xs font-bold text-neutral-900 dark:text-white capitalize">
              {notif.orderId ? `${notif.status} State Triggered` : (notif.status === 'price_drop' ? 'Price Discount Drop!' : 'Back In Stock Alert!')}
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-snug">{notif.message}</p>
          </div>

          {/* Close trigger */}
          <button
            onClick={() => dismissNotification(notif.id)}
            className="p-1 text-neutral-400 hover:text-rose-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
