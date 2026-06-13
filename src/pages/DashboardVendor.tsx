/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { EmailNotificationLogs } from '../components/EmailNotificationLogs';
import { 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Store, 
  Plus, 
  Calendar, 
  DollarSign, 
  ShoppingBag, 
  Edit3, 
  Trash2, 
  PackageCheck, 
  MessageSquare,
  Send,
  Loader,
  X,
  AlertCircle,
  Upload,
  Download,
  CheckCircle,
  FileText
} from 'lucide-react';

export const DashboardVendor: React.FC = () => {
  const { user, vendor, products, orders, token, fetchOrders, fetchProducts } = useApp();

  // Active view management
  const [activeTab, setActiveTab] = useState<'analytics' | 'catalog' | 'orders' | 'chats'>('analytics');

  // Products CRUD states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  
  // Product form parameters
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formCategory, setFormCategory] = useState('electronics');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Bulk Upload states
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ addedCount: number; errors?: string[] } | null>(null);

  const parseCSV = (text: string) => {
    const lines: string[] = [];
    let row = [""];
    let insideQuote = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (insideQuote && nextChar === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        row.push("");
      } else if ((char === '\r' || char === '\n') && !insideQuote) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        lines.push(JSON.stringify(row));
        row = [""];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== "") {
      lines.push(JSON.stringify(row));
    }
    
    const parsedRows = lines.map(line => JSON.parse(line) as string[]);
    if (parsedRows.length === 0) return [];
    
    const headers = parsedRows[0].map(h => h.trim().toLowerCase());
    const dataRows = parsedRows.slice(1);
    
    return dataRows.map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] !== undefined ? row[index].trim() : '';
      });
      return obj;
    });
  };

  const handleCSVFileChange = (file: File) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      alert('Highly critical: Please provide only valid .csv files.');
      return;
    }
    setCsvFile(file);
    setBulkResult(null);
    setCsvErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setCsvErrors(['No records identified inside your CSV document.']);
          setCsvData([]);
          return;
        }

        const tempErrors: string[] = [];
        const validRows = parsed.map((row, index) => {
          const rowNum = index + 2; // header is row 1
          if (!row.title) tempErrors.push(`Row ${rowNum}: Product Title is missing`);
          if (!row.description) tempErrors.push(`Row ${rowNum}: Description overview is missing`);
          if (row.price === undefined || isNaN(parseFloat(row.price)) || parseFloat(row.price) <= 0) {
            tempErrors.push(`Row ${rowNum}: Price "${row.price || ''}" must be a valid positive number`);
          }
          if (row.stock === undefined || isNaN(parseInt(row.stock, 10)) || parseInt(row.stock, 10) < 0) {
            tempErrors.push(`Row ${rowNum}: Stock "${row.stock || ''}" must be a non-negative integer`);
          }
          if (!row.category) tempErrors.push(`Row ${rowNum}: Category option is lacking`);
          
          return {
            title: row.title || '',
            description: row.description || '',
            price: row.price || '',
            originalPrice: row.originalprice || row.originalPrice || '',
            stock: row.stock || '',
            category: (row.category || '').toLowerCase().trim(),
            images: row.images ? row.images.split(';').map((img: string) => img.trim()).filter(Boolean) : []
          };
        });

        setCsvErrors(tempErrors);
        setCsvData(validRows);
      } catch (err) {
        setCsvErrors(['An unexpected parsing crash occurred reading layout parameters.']);
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = 'title,description,price,originalPrice,stock,category,images\n';
    const sampleProduct1 = 'Pure Jojoba Active Face Glow,Bespoke facial elixir treatment infused with Damascus rose extracts and jojoba,42.00,48.00,20,beauty,https://images.unsplash.com/photo-1608248597279-f99d160bfcbc\n';
    const sampleProduct2 = 'Solid Timber Ergonomic Stand,Handcrafted monitor platform constructed from a single slab of sustainable oak,125.00,140.00,8,home-living,https://images.unsplash.com/photo-1527443224154-c4a3942d3acf\n';
    const blob = new Blob([headers + sampleProduct1 + sampleProduct2], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'vendor_product_upload_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkUploadSubmit = async () => {
    if (!csvData.length) {
      alert('Please select and parse a populated, valid CSV document first.');
      return;
    }
    if (csvErrors.length > 0) {
      if (!confirm(`Warning: Your document contains ${csvErrors.length} validation issues. Commit anyway, skipping failed rows?`)) {
        return;
      }
    }

    setUploadProgress(true);
    try {
      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ products: csvData.filter((_, idx) => !csvErrors.some(err => err.startsWith(`Row ${idx + 2}:`))) })
      });

      if (res.ok) {
        const data = await res.json();
        setBulkResult({
          addedCount: data.addedCount || 0,
          errors: data.errors || []
        });
        alert(`Successfully imported ${data.addedCount} vendor products as active catalog items!`);
        fetchProducts(); // Refresh vendor listings
        setCsvFile(null);
        setCsvData([]);
        setCsvErrors([]);
      } else {
        const err = await res.json();
        alert(err.error || 'Server validation failed during bulk load');
      }
    } catch (err) {
      alert('Network processing failed.');
    } finally {
      setUploadProgress(false);
    }
  };

  // Vendor chats state
  const [chats, setChats] = useState<any[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [chatsLoading, setChatsLoading] = useState(false);

  useEffect(() => {
    fetchOrders(); // Load specific vendor elements
    fetchProducts();
    if (token) {
      loadVendorChats();
    }
  }, [token]);

  // Open modal for compiling catalog
  const openProductForm = (prod?: any) => {
    if (prod) {
      setEditingProduct(prod);
      setFormTitle(prod.title);
      setFormDescription(prod.description);
      setFormPrice(prod.price.toString());
      setFormOriginalPrice(prod.originalPrice ? prod.originalPrice.toString() : '');
      setFormStock(prod.stock.toString());
      setFormCategory(prod.category);
      setFormImageUrl(prod.images[0]);
    } else {
      setEditingProduct(null);
      setFormTitle('');
      setFormDescription('');
      setFormPrice('');
      setFormOriginalPrice('');
      setFormStock('');
      setFormCategory('electronics');
      setFormImageUrl('');
    }
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDescription || !formPrice || !formStock) {
      alert('Please compile all essential product parameters.');
      return;
    }

    setPublishing(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          price: parseFloat(formPrice),
          originalPrice: formOriginalPrice ? parseFloat(formOriginalPrice) : undefined,
          stock: parseInt(formStock, 10),
          category: formCategory,
          images: formImageUrl ? [formImageUrl] : undefined
        })
      });

      if (res.ok) {
        alert(editingProduct ? 'Product specifications updated successfully!' : 'Product published on catalog successfully!');
        setShowProductModal(false);
        fetchProducts(); // refresh list
      } else {
        const err = await res.json();
        alert(err.error || 'Server validation failed');
      }
    } catch {
      alert('Network processing failed.');
    }
    setPublishing(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this catalog product listing?')) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Product listed removed from catalog.');
        fetchProducts();
      }
    } catch {
      alert('Deletion command failed.');
    }
  };

  const handleFulfillmentStatusUpdate = async (orderId: string, productId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, status })
      });

      if (res.ok) {
        alert('Courier package fulfillment status updated!');
        fetchOrders(); // reload
      } else {
        const err = await res.json();
        alert(err.error || 'Fulfillment command rejected');
      }
    } catch {
      alert('Transaction failed to deliver.');
    }
  };

  const loadVendorChats = async () => {
    setChatsLoading(true);
    try {
      const res = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        if (data.length > 0 && !activePartnerId) {
          const firstMsg = data[0];
          const otherUserId = firstMsg.senderId === user?.id ? firstMsg.receiverId : firstMsg.senderId;
          setActivePartnerId(otherUserId);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setChatsLoading(false);
  };

  const handleSendVendorMessage = async (e: React.FormEvent) => {
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
      console.error(err);
    }
  };

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

  // Filter products listed by this active vendor only
  const vendorProducts = products.filter(p => p.vendorId === user?.id);

  // Recharts analytics data calculation
  const chartData = vendorProducts.map(p => ({
    name: p.title.substring(0, 10) + '...',
    Stock: p.stock,
    Price: p.price
  }));

  // Daily sales revenue over the last 30 days
  const dailyRevenueData = React.useMemo(() => {
    const data = [];
    const now = new Date();
    
    // Generate last 30 days (from 29 days ago to today)
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateString = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const dateDisplay = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      // Filter orders on this day
      let dayRevenue = 0;
      let dayOrdersCount = 0;
      
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        if (orderDate === dateString) {
          // Sum up items of this vendor
          const vendorItems = order.items.filter(item => {
            const isMyItem = item.vendorId === user?.id;
            const isNotCancelled = item.status !== 'cancelled';
            return isMyItem && isNotCancelled;
          });
          
          if (vendorItems.length > 0) {
            dayOrdersCount++;
            vendorItems.forEach(item => {
              dayRevenue += item.price * item.quantity;
            });
          }
        }
      });
      
      data.push({
        date: dateString,
        displayDate: dateDisplay,
        Revenue: parseFloat(dayRevenue.toFixed(2)),
        'Orders Count': dayOrdersCount
      });
    }
    
    return data;
  }, [orders, user?.id]);

  const total30DayRevenue = React.useMemo(() => {
    return dailyRevenueData.reduce((sum, day) => sum + day.Revenue, 0);
  }, [dailyRevenueData]);

  // Render pending profile warning
  if (vendor && vendor.status !== 'approved') {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-6">
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex flex-col items-center gap-4 text-amber-800 dark:text-amber-400">
          <AlertCircle className="h-12 w-12 text-amber-500" />
          <div className="space-y-1">
            <h2 className="font-display font-extrabold text-lg">Seller Account Approval Pending</h2>
            <p className="text-xs leading-relaxed">
              Your vendor registration coordinates are currently being reviewed by ShopSphere compliance executives. You will access catalog listings utilities once approved.
            </p>
          </div>
          <div className="p-3.5 bg-white dark:bg-neutral-900 border text-neutral-500 rounded-xl text-left w-full space-y-2">
            <p className="text-[10px] font-bold uppercase text-neutral-400">Registration Vault Log:</p>
            <p className="text-xs"><strong>Store Handle:</strong> {vendor.storeName}</p>
            <p className="text-xs"><strong>Bank Clearing Account:</strong> {vendor.bankAccount || 'None Set'}</p>
            <p className="text-xs"><strong>Compliance Status:</strong> <span className="text-amber-500 font-bold uppercase">{vendor.status}</span></p>
          </div>
          <p className="text-[10px] text-neutral-400 italic">Demo Tip: Login as administrative account (admin@marketplace.com / password123) to review and authorize accounts instantly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      
      {/* Metrics Banner */}
      <div className="bg-gradient-to-r from-emerald-750 to-teal-900 text-white p-6 sm:p-8 rounded-3xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-mono font-medium">
            <Store className="h-3.5 w-3.5 text-emerald-300" />
            <span>{vendor?.storeName} Authorized Dashboard</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-none">Seller Performance Hub</h1>
        </div>
        
        <div className="grid grid-cols-3 gap-4 font-mono w-full sm:w-auto">
          <div className="bg-white/10 p-3 rounded-xl text-center border border-white/5">
            <p className="text-lg font-bold">${vendor?.totalEarnings.toFixed(2)}</p>
            <p className="text-[9px] uppercase text-emerald-300">Earnings</p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl text-center border border-white/5">
            <p className="text-lg font-bold">{vendorProducts.length}</p>
            <p className="text-[9px] uppercase text-emerald-300">Listed Items</p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl text-center border border-white/5">
            <p className="text-lg font-bold">{orders.length}</p>
            <p className="text-[9px] uppercase text-emerald-300">Sold Trans</p>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-4 mb-8">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-sm font-semibold transition ${
            activeTab === 'analytics' 
              ? 'border-b-2 border-emerald-500 text-emerald-600' 
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
          }`}
        >
          Sales reports &amp; Analytics
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-sm font-semibold transition ${
            activeTab === 'catalog' 
              ? 'border-b-2 border-emerald-500 text-emerald-600' 
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
          }`}
        >
          My Listed Catalog
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-semibold transition ${
            activeTab === 'orders' 
              ? 'border-b-2 border-emerald-500 text-emerald-600' 
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
          }`}
        >
          Order Fulfillment ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('chats')}
          className={`pb-3 text-sm font-semibold transition ${
            activeTab === 'chats' 
              ? 'border-b-2 border-emerald-500 text-emerald-600' 
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
          }`}
        >
          Customer Correspondence ({threads.length})
        </button>
      </div>

      {/* TABS CONTENT RENDERING */}
      {activeTab === 'analytics' && (
        <section className="space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl">
              <h3 className="text-xs uppercase font-mono font-bold text-neutral-400 mb-2">My Total Cleared Earnings</h3>
              <p className="text-3xl font-extrabold text-neutral-900 dark:text-white">${vendor?.totalEarnings.toFixed(2)}</p>
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 text-xs rounded-xl">
                Cleared dynamically inside Chase banking vault: <strong>{vendor?.bankAccount}</strong>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl">
              <h3 className="text-xs uppercase font-mono font-bold text-neutral-400 mb-2">Total Listed Products</h3>
              <p className="text-3xl font-extrabold text-neutral-900 dark:text-white">{vendorProducts.length} items</p>
              <p className="text-xs text-neutral-500 mt-2">Active catalog size on platform indexing</p>
            </div>

            <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl">
              <h3 className="text-xs uppercase font-mono font-bold text-neutral-400 mb-2">Store Rating Score</h3>
              <p className="text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                4.8★ <span className="text-xs font-mono text-neutral-500 font-normal">(Verified)</span>
              </p>
              <p className="text-xs text-neutral-500 mt-2">Aggregated customer scorecard average</p>
            </div>
          </div>

          {/* Recharts chart render */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* 30-Day Sales Revenue Area Chart */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-6 rounded-2xl flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <div>
                  <h3 className="font-display font-semibold text-neutral-900 dark:text-white text-sm uppercase tracking-wider">30-Day Sales Revenue</h3>
                  <p className="text-[11px] text-neutral-450 dark:text-neutral-500 mt-0.5">Tracking daily incoming marketplace sales revenue</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/20 px-3.5 py-1.5 rounded-xl border border-emerald-500/10 text-right shrink-0">
                  <span className="text-[9px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase block tracking-wider leading-none mb-1">30D Revenue Sum</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">${total30DayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-neutral-800" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#888888" 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`} 
                    />
                    <Tooltip 
                      formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, 'Revenue']}
                      contentStyle={{ backgroundColor: 'rgba(15, 15, 15, 0.9)', borderRadius: '12px', border: '1px solid #262626', color: '#fff', fontSize: '11px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#a3a3a3' }}
                    />
                    <Legend iconType="circle" />
                    <Area 
                      name="Incoming Revenue"
                      type="monotone" 
                      dataKey="Revenue" 
                      stroke="#10b981" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Catalog Inventory & Price Metrics */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-6 rounded-2xl">
              <h3 className="font-display font-semibold text-neutral-900 dark:text-white text-sm mb-6 uppercase tracking-wider">Catalog Inventory &amp; Price Metrics</h3>
              <div className="h-64 sm:h-80">
                {vendorProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-neutral-800" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#888888" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#888888" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 15, 15, 0.9)', borderRadius: '12px', border: '1px solid #262626', color: '#fff', fontSize: '11px' }}
                      />
                      <Legend iconType="circle" />
                      <Bar name="Stock Remainder" dataKey="Stock" fill="#059669" radius={[4, 4, 0, 0]} />
                      <Bar name="Product Unit Price ($)" dataKey="Price" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-neutral-450">
                    Publish products so analytic metrics report performance logs.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Real-time Email Notification & API Logs Console */}
          <EmailNotificationLogs token={token} currentUserEmail={user?.email} />

        </section>
      )}

      {activeTab === 'catalog' && (
        <section className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-4 rounded-xl">
            <div>
              <h3 className="font-semibold text-xs uppercase text-neutral-900 dark:text-white">Active Store Inventory</h3>
              <p className="text-xs text-neutral-500">Edit listing configurations or replenish stocks instantly</p>
            </div>
            <div className="flex gap-2.5">
              <button
                id="bulk-csv-toggle-btn"
                onClick={() => setShowBulkPanel(!showBulkPanel)}
                className={`px-4 py-2 border rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                  showBulkPanel 
                    ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-350 text-rose-600'
                    : 'bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-250 dark:border-neutral-750'
                }`}
              >
                <Upload className="h-4 w-4" />
                {showBulkPanel ? 'Close Bulk Area' : 'Bulk CSV Upload'}
              </button>
              <button
                id="new-product-form-btn"
                onClick={() => openProductForm()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            </div>
          </div>

          {/* 🗂️ BULK CSV PRODUCT UPLOAD COMPONENT */}
          {showBulkPanel && (
            <div id="bulk-upload-workspace" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl p-6 space-y-6 shadow-md transition duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-100 dark:border-neutral-800 pb-4 gap-4">
                <div>
                  <h4 className="font-display font-black text-sm text-neutral-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-500" />
                    CSV Bulk Product Import Console
                  </h4>
                  <p className="text-xs text-neutral-500">Upload multiple products to your active inventory at once via CSV spreadsheet</p>
                </div>
                <button
                  type="button"
                  id="template-download-btn"
                  onClick={downloadTemplate}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Sample CSV
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div
                id="csv-drag-zone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.length) {
                    handleCSVFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => document.getElementById('csv-file-input')?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition duration-300 ${
                  dragOver
                    ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 scale-[0.99] shadow-sm'
                    : 'border-neutral-300 dark:border-neutral-750 hover:border-emerald-500 dark:hover:border-emerald-700 bg-neutral-50/50 dark:bg-neutral-900/10'
                }`}
              >
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      handleCSVFileChange(e.target.files[0]);
                    }
                  }}
                />
                
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Upload className="h-6 w-6 animate-bounce" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      {csvFile ? `Selected: ${csvFile.name}` : 'Drag and drop your spreadsheet CSV here'}
                    </p>
                    <p className="text-[11px] text-neutral-450 mt-1">
                      {csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB` : 'or click to search computer directory'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Supported Columns Guide */}
              <div className="p-4 bg-indigo-50/40 dark:bg-neutral-950/40 rounded-xl space-y-2 border border-neutral-150 dark:border-neutral-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Accepted Spreadsheet Structure</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-mono text-neutral-500">
                  <div>
                    <span className="text-emerald-605 dark:text-emerald-400 font-bold">title*</span>
                    <p className="text-[9px] text-neutral-400">Product display title</p>
                  </div>
                  <div>
                    <span className="text-emerald-605 dark:text-emerald-400 font-bold">description*</span>
                    <p className="text-[9px] text-neutral-400">Paragraph summary</p>
                  </div>
                  <div>
                    <span className="text-emerald-605 dark:text-emerald-400 font-bold">price*</span>
                    <p className="text-[9px] text-neutral-400">Positive float numeric</p>
                  </div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-450">originalPrice</span>
                    <p className="text-[9px] text-neutral-400">Regular MSRP comparison</p>
                  </div>
                  <div>
                    <span className="text-emerald-605 dark:text-emerald-400 font-bold">stock*</span>
                    <p className="text-[9px] text-neutral-400">Integer inventory count</p>
                  </div>
                  <div>
                    <span className="text-emerald-605 dark:text-emerald-400 font-bold">category*</span>
                    <p className="text-[9px] text-neutral-400">e.g. fashion-apparel, beauty...</p>
                  </div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-455">images</span>
                    <p className="text-[9px] text-neutral-450">Semicolon separated URLs</p>
                  </div>
                  <div className="col-span-1 md:col-span-1 text-right flex items-end justify-end">
                    <span className="text-neutral-400 italic font-sans font-bold text-[9px]">* Required</span>
                  </div>
                </div>
              </div>

              {/* Validation Status & Rows Preview */}
              {csvData.length > 0 && (
                <div className="space-y-4 font-sans text-neutral-700 dark:text-neutral-300">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="px-2.5 py-1 bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 rounded-lg text-xs font-mono font-bold">
                        {csvData.length - (csvErrors.length ? csvErrors.length : 0)} Valid Rows
                      </div>
                      {csvErrors.length > 0 && (
                        <div className="px-2.5 py-1 bg-amber-500/10 text-amber-650 dark:text-amber-400 rounded-lg text-xs font-mono font-bold">
                          {csvErrors.length} Warning Lines
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        id="reset-bulk-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCsvFile(null);
                          setCsvData([]);
                          setCsvErrors([]);
                        }}
                        className="px-3 py-1.5 border border-neutral-350 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-lg text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                      >
                        Reset File
                      </button>
                      <button
                        type="button"
                        id="commit-bulk-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBulkUploadSubmit();
                        }}
                        disabled={uploadProgress || csvData.length === csvErrors.length}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {uploadProgress ? (
                          <Loader className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        {uploadProgress ? 'Importing...' : 'Commit Upload'}
                      </button>
                    </div>
                  </div>

                  {/* Warn Details if any */}
                  {csvErrors.length > 0 && (
                    <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1 text-amber-805 dark:text-amber-400 text-xs">
                      <p className="font-bold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Row Skipping Report ({csvErrors.length} rows will be omitted):
                      </p>
                      <ul className="list-disc pl-5 text-[11px] font-mono grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5 max-h-24 overflow-y-auto">
                        {csvErrors.map((err, idx) => (
                          <li key={idx} className="line-clamp-1 text-amber-600 dark:text-amber-400">{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Table View of Spreadsheet Data Row Previews */}
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-neutral-50 dark:bg-neutral-950 text-[10px] font-bold uppercase tracking-wider text-neutral-450 border-b border-neutral-200 dark:border-neutral-800">
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Title</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Price</th>
                          <th className="py-2.5 px-3 font-mono text-center">Stock</th>
                          <th className="py-2.5 px-3 text-right">Images</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-medium text-neutral-700 dark:text-neutral-300">
                        {csvData.map((row, idx) => {
                          const rowNum = idx + 2;
                          const hasErr = csvErrors.some(err => err.startsWith(`Row ${rowNum}:`));
                          return (
                            <tr key={idx} className={`hover:bg-neutral-50/50 dark:hover:bg-neutral-850/50 ${hasErr ? 'opacity-50 bg-rose-50/10' : ''}`}>
                              <td className="py-2 px-3">
                                {hasErr ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono px-1.5 py-0.5 bg-rose-500/10 text-rose-500 rounded-lg uppercase">
                                    Error
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg uppercase">
                                    Ready
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-semibold text-neutral-800 dark:text-neutral-200 max-w-[150px] truncate">
                                {row.title || '•'}
                              </td>
                              <td className="py-2 px-3 text-[11px] uppercase text-neutral-450">
                                {row.category || '•'}
                              </td>
                              <td className="py-2 px-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                {row.price ? `$${parseFloat(row.price).toFixed(2)}` : '•'}
                              </td>
                              <td className="py-2 px-3 font-mono text-center text-neutral-700 dark:text-neutral-300">
                                {row.stock || '0'}
                              </td>
                              <td className="py-2 px-3 text-[11px] text-neutral-450 text-right font-mono">
                                {row.images?.length > 0 ? `${row.images.length} link(s)` : 'Default Cover'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Clear confirmation box or historic result block */}
              {bulkResult && (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-300">
                    <p className="font-bold text-emerald-800 dark:text-emerald-105">Bulk Upload Transaction Complete</p>
                    <p>Successfully processed and imported <span className="font-bold text-emerald-600 dark:text-emerald-400">{bulkResult.addedCount}</span> products into your active storefront.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {vendorProducts.length === 0 ? (
            <div className="p-16 border border-dashed rounded-3xl text-center text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/50">
              <ShoppingBag className="h-10 w-10 mx-auto mb-2 text-neutral-300" />
              <p className="font-bold text-xs uppercase text-neutral-700 dark:text-neutral-300">No Catalog Products Found</p>
              <p className="text-[11px] text-neutral-500 mt-1">Publish your first design to seed indices.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {vendorProducts.map((prod) => (
                <div key={prod.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl overflow-hidden flex flex-col justify-between">
                  <div className="aspect-square relative bg-neutral-50 border-b">
                    <img src={prod.images[0]} alt={prod.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-3 left-3 bg-neutral-900/80 backdrop-blur-sm text-white font-mono text-[9px] px-2 py-0.5 rounded-lg">
                      {prod.category}
                    </span>
                  </div>

                  <div className="p-4 space-y-3.5">
                    <div>
                      <p className="font-bold text-xs text-neutral-900 dark:text-white uppercase line-clamp-1">{prod.title}</p>
                      <p className="text-[10px] text-neutral-500 mt-1">Stock Cap: <span className={prod.stock > 5 ? 'text-neutral-900 dark:text-neutral-200 font-bold' : 'text-rose-500 font-bold'}>{prod.stock} left</span></p>
                    </div>

                    <div className="flex justify-between items-center border-t border-neutral-100 dark:border-neutral-850 pt-3">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">${prod.price}</span>
                      <div className="flex gap-2">
                        <button
                          id={`edit-item-${prod.id}`}
                          onClick={() => openProductForm(prod)}
                          className="p-1.5 border hover:bg-neutral-50 hover:text-indigo-500 rounded-lg text-neutral-500 transition"
                          title="Edit specifications"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          id={`delete-item-${prod.id}`}
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 border hover:bg-rose-50 hover:text-rose-500 rounded-lg text-neutral-500 transition"
                          title="Delete listing"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'orders' && (
        <section className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-4 rounded-xl space-y-1">
            <h3 className="font-semibold text-xs uppercase text-neutral-900 dark:text-white">Active Buyer Fulfillment Rails</h3>
            <p className="text-xs text-neutral-500 text-left">Update shipping statuses immediately as courier packages are dispatched</p>
          </div>

          {orders.length === 0 ? (
            <div className="py-20 border border-dashed rounded-3xl text-center bg-neutral-50/50 dark:bg-neutral-900/50 text-neutral-450 text-xs">
              No transactions have sold your specified vendor products yet.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl overflow-hidden p-5">
                  <div className="flex flex-col sm:flex-row justify-between border-b pb-3 items-start sm:items-center gap-4 text-xs">
                    <div>
                      <p className="text-neutral-400 text-[10px] uppercase font-mono">Fulfillment Shipment Ref</p>
                      <p className="font-bold text-neutral-800 dark:text-neutral-200 font-mono">{ord.id}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 text-[10px] uppercase font-mono">Invoice Date</p>
                      <p className="font-semibold text-neutral-700 dark:text-neutral-300">{new Date(ord.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 text-[10px] uppercase font-mono">Client Email</p>
                      <p className="font-semibold text-neutral-700 dark:text-neutral-300">{ord.customerEmail}</p>
                    </div>
                  </div>

                  <div className="py-4 space-y-4">
                    {ord.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt={item.title} className="w-10 h-10 rounded border object-cover" />
                          <div>
                            <p className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">{item.title}</p>
                            <p className="text-[10px] text-neutral-400">Qty: {item.quantity} x ${item.price}</p>
                          </div>
                        </div>

                        {/* Dropdown status fulfillment controller */}
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] uppercase font-mono text-neutral-400">Status:</label>
                          <select
                            id={`status-fulfilled-${ord.id}-${item.productId}`}
                            value={item.status}
                            onChange={(e) => handleFulfillmentStatusUpdate(ord.id, item.productId, e.target.value)}
                            className="bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold rounded-lg p-1.5 focus:outline-none text-neutral-800 dark:text-neutral-300"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery instructions */}
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-950 transition rounded-xl text-[11px] text-neutral-500 mb-0.5">
                    <p className="font-bold text-semibold text-neutral-800 dark:text-neutral-200">Delivery Street Details:</p>
                    <p>{ord.shippingAddress.fullName} - {ord.shippingAddress.addressLine1}, {ord.shippingAddress.city}, {ord.shippingAddress.state} {ord.shippingAddress.postalCode}</p>
                    <p>Phone Contact: {ord.shippingAddress.phone}</p>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'chats' && (
        <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl h-[500px] flex overflow-hidden">
          
          {threads.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-450 p-6">
              <MessageSquare className="h-8 w-8 text-neutral-200 mb-2" />
              <p className="text-xs">No active conversations yet.</p>
              <p className="text-[10px] text-neutral-550 max-w-[200px] mt-1">Queries started by buyers checking catalog specifications will stream chats here.</p>
            </div>
          ) : (
            <React.Fragment>
              {/* Chats partner columns */}
              <div className="w-28 border-r overflow-y-auto p-1.5">
                {threads.map(t => (
                  <button
                    key={t.partnerId}
                    onClick={() => setActivePartnerId(t.partnerId)}
                    className={`w-full p-2.5 text-left rounded-lg transition text-xs font-semibold ${
                      activePartnerId === t.partnerId 
                        ? 'bg-emerald-500/10 text-emerald-600' 
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <p className="line-clamp-1">Buyer ID</p>
                    <p className="text-[10px] font-mono text-neutral-400 line-clamp-1">{t.partnerId.substring(4, 9)}</p>
                  </button>
                ))}
              </div>

              {/* Chat timeline dialog */}
              <div className="flex-1 flex flex-col justify-between bg-neutral-50/50 dark:bg-neutral-950/20">
                
                {/* Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {activeThread.map(msg => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`p-2.5 rounded-2xl max-w-[150px] text-xs font-semibold leading-relaxed shadow-xs ${
                          isMe 
                            ? 'bg-emerald-600 text-white rounded-tr-none' 
                            : 'bg-white border text-neutral-850 rounded-tl-none dark:bg-neutral-900 dark:border-neutral-85a text-neutral-200'
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

                <form onSubmit={handleSendVendorMessage} className="p-3 bg-white dark:bg-neutral-900 border-t flex gap-2">
                  <input
                    id="vendor-chat-input"
                    type="text"
                    required
                    placeholder="Provide detailed feedback..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 px-3.5 py-1.5 border border-neutral-300 dark:text-neutral-250 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl focus:outline-none placeholder-neutral-400"
                  />
                  <button type="submit" className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                    <Send className="h-4 w-4" />
                  </button>
                </form>

              </div>
            </React.Fragment>
          )}

        </section>
      )}

      {/* DETAILED NEW PRODUCT / EDIT PRODUCT DIALOG MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 max-w-md w-full relative space-y-4 shadow-2xl">
            
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-display font-extrabold text-sm text-neutral-950 dark:text-white uppercase tracking-wider">
                {editingProduct ? 'Configure Product Specifications' : 'Publish Product Details'}
              </h3>
              <button id="product-modal-close" onClick={() => setShowProductModal(false)} className="text-rose-500 hover:text-rose-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-neutral-400">Products Title</label>
                <input
                  id="form-title"
                  type="text"
                  required
                  placeholder="Bespoke ANC Wireless Headphones"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-1.5 border border-neutral-350 dark:border-neutral-700 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none placeholder-neutral-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-neutral-400">Description Overview</label>
                <textarea
                  id="form-desc"
                  rows={3}
                  required
                  placeholder="Immersive noise cancellation console..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-1.5 border border-neutral-350 dark:border-neutral-700 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none placeholder-neutral-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-400">Offer Price ($)</label>
                  <input
                    id="form-price"
                    type="number"
                    step="0.01"
                    required
                    placeholder="299.99"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3.5 py-1.5 border border-neutral-350 dark:border-neutral-700 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-400">Original MSRP ($)</label>
                  <input
                    id="form-orig-price"
                    type="number"
                    step="0.01"
                    placeholder="349.99"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                    className="w-full px-3.5 py-1.5 border border-neutral-350 dark:border-neutral-700 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-400">Available Stock Count</label>
                  <input
                    id="form-stock"
                    type="number"
                    required
                    placeholder="25"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-3.5 py-1.5 border border-neutral-350 dark:border-neutral-700 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-400">Catalog Category</label>
                  <select
                    id="form-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-neutral-350 dark:border-neutral-700 dark:bg-neutral-950 text-xs rounded-xl text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="electronics">Electronics</option>
                    <option value="books-stationery">Books & Stationery</option>
                    <option value="home-living">Home & Living</option>
                    <option value="fashion-apparel">Fashion & Apparel</option>
                    <option value="handmade-crafts">Handmade Crafts</option>
                    <option value="beauty">Beauty 💄</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-neutral-400">Product Image URL</label>
                <input
                  id="form-image"
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full px-3.5 py-1.5 border border-neutral-350 dark:border-neutral-700 dark:bg-neutral-950 text-xs text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none placeholder-neutral-400"
                />
              </div>

              <button
                id="product-form-submit"
                type="submit"
                disabled={publishing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition"
              >
                {publishing ? 'Saving configuration...' : 'Confirm Publish'}
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
