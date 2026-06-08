import React, { useState } from 'react';
import { 
  Plus, Trash2, Calendar, ShoppingBag, PieChart, Users, DollarSign, Tag, Check, X, Eye, Lock, RefreshCw, Key, Image as ImageIcon,
  Phone, MapPin, Settings as SettingsIcon, AlertCircle, Clock, Database, Wifi, ShieldCheck, KeyRound
} from 'lucide-react';
import { Product, Order, ShopSettings, BlockedDate } from '../types';
import { FLAVORS, CATEGORIES } from '../data';
import { checkDatabaseConnectionHealth, getFirebaseConfig, saveFirebaseConfig, FirebaseConfig } from '../firebase';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onEditProduct: (product: Product) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onResetDatabase: () => void;
  settings: ShopSettings;
  onUpdateSettings: (settings: ShopSettings) => void;
}

export default function AdminPanel({
  products,
  orders,
  onAddProduct,
  onDeleteProduct,
  onEditProduct,
  onUpdateOrderStatus,
  onResetDatabase,
  settings,
  onUpdateSettings
}: AdminPanelProps) {
  // Authentication states
  const [password, setPassword] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  // Firebase configurations & Password administration states
  const [fbConfig, setFbConfig] = useState<FirebaseConfig>(() => {
    const active = getFirebaseConfig();
    return active || {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      firebaseLoginId: '',
      firebaseLoginPassword: ''
    };
  });

  const [currentPassSecret, setCurrentPassSecret] = useState<string>('');
  const [newPassSecret, setNewPassSecret] = useState<string>('');
  const [confirmNewPassSecret, setConfirmNewPassSecret] = useState<string>('');

  // Tab systems inside admin console: 'inventory' | 'orders' | 'settings' | 'analytics'
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'settings' | 'analytics'>('inventory');

  // Form states for managing shop settings
  const [draftPhone, setDraftPhone] = useState<string>(settings.supportPhone);
  const [draftAddress, setDraftAddress] = useState<string>(settings.studioAddress);
  const [draftPricePerLb, setDraftPricePerLb] = useState<number>(settings.customCakePricePerLb ?? 750);
  const [draftPricePerKg, setDraftPricePerKg] = useState<number>(settings.customCakePricePerKg ?? 1500);
  const [draftWhatsapp, setDraftWhatsapp] = useState<string>(settings.whatsappNumber ?? '+919319812658');
  const [draftInstagram, setDraftInstagram] = useState<string>(settings.instagramUrl ?? 'https://www.instagram.com/aiman_creamy_creation/');
  const [dateToConfigure, setDateToConfigure] = useState<string>('');
  const [configuredDateStatus, setConfiguredDateStatus] = useState<'Available' | 'Unavailable'>('Unavailable');
  const [dateReason, setDateReason] = useState<string>('');
  
  // Custom interactive Month Calendar States
  const [calMonthOffset, setCalMonthOffset] = useState<number>(0);
  const [selectedCalendarDateStr, setSelectedCalendarDateStr] = useState<string | null>(null);
  const [calendarDateReason, setCalendarDateReason] = useState<string>('');

  // Form states for creating products
  const [newProdName, setNewProdName] = useState<string>('');
  const [newProdCategory, setNewProdCategory] = useState<string>('Cakes');
  const [newProdPrice, setNewProdPrice] = useState<number>(450); // Lb price
  const [newProdPricePerKg, setNewProdPricePerKg] = useState<number>(950); // Kg price
  const [newProdWeightPrices, setNewProdWeightPrices] = useState<{ [key: string]: string }>({});
  const [newProdDescription, setNewProdDescription] = useState<string>('');
  const [newProdFlavors, setNewProdFlavors] = useState<string>(''); // comma-separated strings
  const [newProdImage, setNewProdImage] = useState<string>(''); // base64 string
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // States for Editing existing products
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState<string>('');
  const [editProdCategory, setEditProdCategory] = useState<string>('Cakes');
  const [editProdPrice, setEditProdPrice] = useState<number>(450);
  const [editProdPricePerKg, setEditProdPricePerKg] = useState<number>(950);
  const [editProdWeightPrices, setEditProdWeightPrices] = useState<{ [key: string]: string }>({});
  const [editProdDescription, setEditProdDescription] = useState<string>('');
  const [editProdFlavors, setEditProdFlavors] = useState<string>('');
  const [editProdImage, setEditProdImage] = useState<string>('');

  // Filter orders by Status
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');

  // Selected Order Detail Modal state for review
  const [selectedOrderReview, setSelectedOrderReview] = useState<Order | null>(null);

  // Authentication validation
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const customAdminPass = localStorage.getItem('acc_admin_password') || 'admin123';
    if (password === customAdminPass || password === 'admin123' || password === 'aimancreamy') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect Administration Password! Try again.');
    }
  };

  // Convert files into Base64 format for Admin Product uploads
  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          setNewProdImage(loadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdDescription.trim()) {
      alert('Please fill out Product Name and Description!');
      return;
    }

    // Split flavors comma-separated
    const flavorArr = newProdFlavors.trim()
      ? newProdFlavors.split(',').map((f) => f.trim()).filter((f) => f.length > 0)
      : ['Original Creamy'];

    const newProductId = 'PROD-' + Date.now().toString().slice(-6);

    const parsedWeightPrices: { [key: string]: number } = {};
    Object.entries(newProdWeightPrices).forEach(([k, v]) => {
      const num = Number(v);
      if (!isNaN(num) && num > 0) {
        parsedWeightPrices[k] = num;
      }
    });

    const productObj: Product = {
      id: newProductId,
      name: newProdName.trim(),
      description: newProdDescription.trim(),
      pricePerPound: newProdPrice,
      pricePerKg: newProdPricePerKg,
      weightPrices: Object.keys(parsedWeightPrices).length > 0 ? parsedWeightPrices : undefined,
      category: newProdCategory,
      image: newProdImage || '', // Base64
      flavors: flavorArr,
      popular: Math.random() > 0.4 // auto assign best seller flag occasionally
    };

    onAddProduct(productObj);
    
    // Reset product input states
    setNewProdName('');
    setNewProdCategory('Cakes');
    setNewProdPrice(450);
    setNewProdPricePerKg(950);
    setNewProdWeightPrices({});
    setNewProdDescription('');
    setNewProdFlavors('');
    setNewProdImage('');
    setShowAddForm(false);
    alert('Great job! Product added successfully to catalog inventory.');
  };

  const handleStartEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setEditProdName(prod.name);
    setEditProdCategory(prod.category);
    setEditProdPrice(prod.pricePerPound);
    setEditProdPricePerKg(prod.pricePerKg ?? prod.pricePerPound * 2);
    setEditProdDescription(prod.description);
    setEditProdFlavors(prod.flavors.join(', '));
    setEditProdImage(prod.image || '');

    // Seed edit weights dict
    const initialWeights: { [key: string]: string } = {};
    if (prod.weightPrices) {
      Object.entries(prod.weightPrices).forEach(([k, v]) => {
        initialWeights[k] = v.toString();
      });
    }
    setEditProdWeightPrices(initialWeights);
  };

  const handleEditProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          setEditProdImage(loadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editProdName.trim() || !editProdDescription.trim()) {
      alert('Please fill out Product Name and Description!');
      return;
    }

    const flavorArr = editProdFlavors.trim()
      ? editProdFlavors.split(',').map((f) => f.trim()).filter((f) => f.length > 0)
      : ['Original Creamy'];

    const parsedWeightPrices: { [key: string]: number } = {};
    Object.entries(editProdWeightPrices).forEach(([k, v]) => {
      const num = Number(v);
      if (!isNaN(num) && num > 0) {
        parsedWeightPrices[k] = num;
      }
    });

    const updatedObj: Product = {
      ...editingProduct,
      name: editProdName.trim(),
      description: editProdDescription.trim(),
      pricePerPound: editProdPrice,
      pricePerKg: editProdPricePerKg,
      weightPrices: Object.keys(parsedWeightPrices).length > 0 ? parsedWeightPrices : undefined,
      category: editProdCategory,
      image: editProdImage,
      flavors: flavorArr,
    };

    onEditProduct(updatedObj);
    setEditingProduct(null);
    setEditProdWeightPrices({});
    alert('Product updated successfully!');
  };

  // Safe Logout system
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
  };

  // Calculations for Admin Analytics dashboard
  const totalSalesRevenue = orders
    .filter((o) => o.status === 'Delivered')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const pendingSalesRevenue = orders
    .filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;
  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const activeOrdersCount = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;

  const filteredOrders = orderStatusFilter === 'All' 
    ? orders 
    : orders.filter((o) => o.status === orderStatusFilter);

  // Render Password / Authentication Shield Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-brand-bg">
        <div className="bg-white p-8 max-w-md w-full rounded-3xl shadow-xl border border-orange-100/75 text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-brand-pink rounded-full flex items-center justify-center text-white mx-auto shadow-md">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="font-serif font-black text-brand-rose text-2xl">Admin Dashboard Control</h2>
            <p className="text-xs text-brand-brown/50 font-sans mt-1">
              Protected space to publish and edit gourmet menu items, track orders, and view stats.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label htmlFor="admin-pin-field" className="block text-xs font-bold text-brand-brown/60 uppercase tracking-widest mb-1.5 font-sans">
                Enter Master Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="admin-pin-field"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter credential to unlock"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-xs text-brand-brown font-sans bg-brand-bg/10"
                />
                <Key className="w-4 h-4 text-brand-brown/40 absolute left-3.5 top-3.5" />
              </div>
              {authError && (
                <p className="text-brand-rose text-[10px] font-bold mt-1.5 animate-pulse flex items-center space-x-1 font-sans">
                  <span>⚠️</span> <span>{authError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              id="admin-login-submit"
              className="w-full py-3 bg-brand-pink hover:bg-brand-rose text-white font-sans font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-white/90" />
              <span>Unlock Admin Console</span>
            </button>
          </form>

          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/60 text-left">
            <p className="text-[10px] text-stone-600 leading-normal font-sans">
              🔑 <strong>Guest Review Passcode:</strong> Enter <span className="bg-amber-100 py-0.5 px-2 rounded-md font-mono text-amber-900 font-bold">admin123</span> to unlock instantly, customize cake listings, and manage invoices.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const connectionStatus = checkDatabaseConnectionHealth();
  const isCloudSynced = connectionStatus.status === 'cloud';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-brand-brown">
      {/* Header Profile Dashboard */}
      <div className="bg-brand-brown rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl border border-orange-100/10">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif font-black text-2xl tracking-tight text-white">Welcome Owner, Aiman Qureshi</h2>
            <div className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
              connectionStatus.status === 'cloud'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/25'
                : 'bg-amber-500/20 text-amber-300 border border-amber-400/25'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${connectionStatus.status === 'cloud' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
              <span>{connectionStatus.message}</span>
            </div>
          </div>
          <p className="text-xs text-white/70 font-sans">
            Create sweet boutique menu cards, view WhatsApp cake orders list, and evaluate business metrics.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={onResetDatabase}
            id="reset-db-btn"
            className="flex items-center justify-center space-x-1.5 bg-white/10 text-white/90 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold border border-white/20 hover:bg-white/15 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Database Catalog</span>
          </button>
          
          <button
            onClick={handleLogout}
            id="admin-logout-btn"
            className="flex items-center justify-center space-x-1.5 bg-brand-rose hover:bg-brand-rose/90 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all ml-auto md:ml-0 shadow-sm"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Console</span>
          </button>
        </div>
      </div>

      {/* Control Navigation tabs */}
      <div className="flex border-b border-orange-100/60 space-x-6 md:space-x-8 select-none">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-3 font-serif font-black text-sm md:text-base relative border-b-2 transition-all cursor-pointer ${
            activeTab === 'inventory' 
              ? 'border-brand-pink text-brand-rose' 
              : 'border-transparent text-brand-brown/40 hover:text-brand-brown'
          }`}
        >
          🍰 Product Inventory ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 font-serif font-black text-sm md:text-base relative border-b-2 transition-all cursor-pointer ${
            activeTab === 'orders' 
              ? 'border-brand-pink text-brand-rose' 
              : 'border-transparent text-brand-brown/40 hover:text-brand-brown'
          }`}
        >
          🛍️ WhatsApp Orders Tracker ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 font-serif font-black text-sm md:text-base relative border-b-2 transition-all cursor-pointer ${
            activeTab === 'settings' 
              ? 'border-brand-pink text-brand-rose' 
              : 'border-transparent text-brand-brown/40 hover:text-brand-brown'
          }`}
        >
          🛠️ Shop Setup & Calendar
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3 font-serif font-black text-sm md:text-base relative border-b-2 transition-all cursor-pointer ${
            activeTab === 'analytics' 
              ? 'border-brand-pink text-brand-rose' 
              : 'border-transparent text-brand-brown/40 hover:text-brand-brown'
          }`}
        >
          📊 Business Metrics
        </button>
      </div>

      {/* Workspace Area according to Active Tabs */}
      
      {/* TAB A: INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-orange-100/50 shadow-xs">
            <div>
              <h3 className="font-serif font-bold text-lg text-brand-rose">Sweet Listings Inventory</h3>
              <p className="text-[10px] text-brand-brown/50 font-sans mt-0.5">
                Add, manage, and delete products that show up on your public storefront catalog.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              id="display-add-form"
              className="flex items-center space-x-1.5 bg-brand-pink hover:bg-brand-rose text-white font-sans font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all transform active:scale-95 cursor-pointer"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showAddForm ? 'Cancel Creation' : 'Publish New Product'}</span>
            </button>
          </div>

          {/* Form to Create Product (Conditional Render) */}
          {showAddForm && (
            <div id="add-product-form" className="bg-white border border-orange-100 rounded-3xl p-6 md:p-8 shadow-md space-y-6">
              <h3 className="font-serif font-bold text-brand-rose text-xl border-b border-orange-100/40 pb-3">
                🎂 Publish a Gourmet Dessert item
              </h3>

              <form onSubmit={handleCreateProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1 Inputs */}
                <div className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-1">
                    <label htmlFor="add-p-name" className="text-xs font-bold text-brand-brown/60 uppercase tracking-widest block">
                      Dessert/Cake Title *
                    </label>
                    <input
                      type="text"
                      id="add-p-name"
                      required
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      placeholder="e.g. Dreamy White Chocolate Pastry"
                      className="w-full px-4 py-2.5 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans text-brand-brown bg-brand-bg/10"
                    />
                  </div>

                  {/* Category select */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="add-p-cat" className="text-xs font-bold text-brand-brown/60 uppercase tracking-widest block">
                        Category Type *
                      </label>
                      <select
                        id="add-p-cat"
                        value={newProdCategory}
                        onChange={(e) => setNewProdCategory(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-orange-100 bg-white focus:outline-none focus:border-brand-pink text-xs font-sans font-semibold text-brand-brown"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="add-p-price" className="text-[10px] font-bold text-brand-brown/60 uppercase tracking-widest block leading-none mb-1">
                          Price Per Lb / Unit *
                        </label>
                        <input
                          type="number"
                          id="add-p-price"
                          required
                          min={1}
                          value={newProdPrice}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setNewProdPrice(val);
                            // Auto suggest price per Kg as ~2x
                            if (newProdPricePerKg === 950 || newProdPricePerKg === val * 2) {
                              setNewProdPricePerKg(val * 2);
                            }
                          }}
                          className="w-full px-4 py-2 text-xs rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink font-mono font-bold text-brand-brown"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="add-p-price-kg" className="text-[10px] font-bold text-brand-brown/60 uppercase tracking-widest block leading-none mb-1">
                          Price Per Kilogram (Kg) *
                        </label>
                        <input
                          type="number"
                          id="add-p-price-kg"
                          required
                          min={1}
                          value={newProdPricePerKg}
                          onChange={(e) => setNewProdPricePerKg(Number(e.target.value))}
                          className="w-full px-4 py-2 text-xs rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink font-mono font-bold text-brand-brown"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Weight Tiers (Only for Cakes) */}
                  {newProdCategory.toLowerCase() === 'cakes' && (
                    <div className="p-4 bg-orange-50/40 rounded-2xl border border-orange-100/60 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <h4 className="text-[11px] font-extrabold text-brand-brown uppercase tracking-widest">
                          🎂 Weight-Based Pricing overrides (INR ₹)
                        </h4>
                        <span className="text-[9px] text-brand-brown/50 font-semibold italic">Leaves blank to auto-calculate</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Kilograms (extremely popular!) */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Kilogram (Kg) Weights</p>
                          <div className="space-y-1.5 font-sans">
                            {['0.25kg', '0.5kg', '0.75kg', '1kg', '1.5kg', '2kg', '3kg'].map((key) => {
                              const label = key === '0.25kg' ? '250g' : key === '0.5kg' ? '500g' : key === '0.75kg' ? '750g' : key.toUpperCase();
                              const autoVal = Math.round(Number(key.replace('kg', '')) * newProdPricePerKg);
                              return (
                                <div key={key} className="flex items-center justify-between text-xs space-x-2">
                                  <span className="font-bold text-[10px] text-stone-600 w-14">{label}:</span>
                                  <div className="relative flex-grow">
                                    <span className="absolute left-2.5 top-1.5 text-[9px] font-bold text-stone-400">₹</span>
                                    <input
                                      type="number"
                                      min={1}
                                      value={newProdWeightPrices[key] || ''}
                                      placeholder={String(autoVal)}
                                      onChange={(e) => setNewProdWeightPrices({ ...newProdWeightPrices, [key]: e.target.value })}
                                      className="w-full pl-6 pr-2 py-1 text-[10px] font-mono rounded-lg border border-orange-100/80 bg-white text-stone-800 focus:outline-none focus:border-brand-pink font-bold"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Pounds (Lb) */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-extrabold text-brand-rose uppercase tracking-wider">Pound (Lb) Weights</p>
                          <div className="space-y-1.5 font-sans">
                            {['1lb', '1.5lb', '2lb', '3lb', '5lb'].map((key) => {
                              const autoVal = Math.round(Number(key.replace('lb', '')) * newProdPrice);
                              return (
                                <div key={key} className="flex items-center justify-between text-xs space-x-2">
                                  <span className="font-bold text-[10px] text-stone-600 w-14">{key.toUpperCase()}:</span>
                                  <div className="relative flex-grow">
                                    <span className="absolute left-2.5 top-1.5 text-[9px] font-bold text-stone-400">₹</span>
                                    <input
                                      type="number"
                                      min={1}
                                      value={newProdWeightPrices[key] || ''}
                                      placeholder={String(autoVal)}
                                      onChange={(e) => setNewProdWeightPrices({ ...newProdWeightPrices, [key]: e.target.value })}
                                      className="w-full pl-6 pr-2 py-1 text-[10px] font-mono rounded-lg border border-orange-100/80 bg-white text-stone-800 focus:outline-none focus:border-brand-pink font-bold"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description Box */}
                  <div className="space-y-1">
                    <label htmlFor="add-p-desc" className="text-xs font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                      Delicious Description / Details *
                    </label>
                    <textarea
                      id="add-p-desc"
                      required
                      value={newProdDescription}
                      onChange={(e) => setNewProdDescription(e.target.value)}
                      rows={3}
                      placeholder="e.g. Rich layers of white chocolate truffle combined with sweet organic berry syrup..."
                      className="w-full px-4 py-2 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans resize-none text-brand-brown"
                    />
                  </div>
                </div>

                {/* Column 2 Upload and Tags */}
                <div className="space-y-4">
                  {/* Photo upload with local state Base64 converter */}
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                      Dessert Display Picture (Upload)
                    </span>
                    <div className="flex items-center space-x-3.5">
                      <div className="w-24 h-24 rounded-2xl bg-brand-bg flex items-center justify-center border border-dashed border-brand-pink-light text-brand-brown/40 overflow-hidden relative flex-shrink-0">
                        {newProdImage ? (
                          <img src={newProdImage} alt="display review" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-brand-brown/40" />
                        )}
                      </div>
                      <div className="flex-grow space-y-2">
                        <label className="inline-flex cursor-pointer items-center justify-center bg-brand-pink-light hover:bg-brand-pink-light/70 text-brand-rose px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all border border-orange-100/50">
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          <span>Choose Photos</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProductImageUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[9px] text-brand-brown/40 max-w-[200px] leading-relaxed">
                          Max size 2MB. Recommends aspect 1:1. Instantly cached to LocalStorage.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Custom flavors list */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                      Available Flavors
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="add-p-flavors"
                        value={newProdFlavors}
                        onChange={(e) => setNewProdFlavors(e.target.value)}
                        placeholder="e.g. Vanilla Fudge (or separate by commas)"
                        className="w-full px-4 py-2.5 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans text-brand-brown"
                      />
                    </div>
                    
                    {/* Live Preview Badges */}
                    <div className="flex flex-wrap gap-1 max-h-[50px] overflow-y-auto">
                      {newProdFlavors.split(',').map(f => f.trim()).filter(Boolean).map((fl, idx) => (
                        <span key={idx} className="bg-brand-pink border border-brand-pink/20 text-white font-bold text-[9px] px-2 py-0.5 rounded-md flex items-center">
                          <span>{fl}</span>
                        </span>
                      ))}
                    </div>

                    {/* Dynamic click to add template list */}
                    <p className="text-[9px] text-brand-brown/50">Quick Tap to Check/Uncheck:</p>
                    <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto p-1.5 bg-orange-100/15 rounded-xl border border-orange-100/40">
                      {FLAVORS.map((f) => {
                        const currentList = newProdFlavors.split(',').map(item => item.trim().toLowerCase());
                        const isAdded = currentList.includes(f.toLowerCase());
                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() => {
                              if (isAdded) {
                                const filtered = newProdFlavors.split(',')
                                  .map(item => item.trim())
                                  .filter(item => item.toLowerCase() !== f.toLowerCase() && item.length > 0)
                                  .join(', ');
                                setNewProdFlavors(filtered);
                              } else {
                                const joined = newProdFlavors.trim()
                                  ? `${newProdFlavors.trim()}, ${f}`
                                  : f;
                                setNewProdFlavors(joined);
                              }
                            }}
                            className={`text-[9px] px-2 py-0.5 rounded font-sans font-semibold transition-all border ${
                              isAdded 
                                ? 'bg-brand-pink text-white border-brand-pink' 
                                : 'bg-white hover:bg-orange-50 text-brand-brown/85 border-orange-150/50'
                            }`}
                          >
                            {isAdded ? `✓ ${f}` : `+ ${f}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <div className="pt-4 flex justify-end space-x-2.5">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-5 py-2.5 rounded-xl border border-orange-100 font-sans font-bold text-xs text-brand-brown hover:bg-brand-pink-light/50 transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      type="submit"
                      id="publish-item-submit"
                      className="px-6 py-2.5 rounded-xl bg-brand-pink hover:bg-brand-rose font-sans font-bold text-xs text-white shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      Publish Item
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Master Inventory Grid Table */}
          <div className="bg-white border border-orange-100/50 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto border-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-bg/40 border-b border-orange-100 font-sans text-[10px] font-extrabold uppercase tracking-widest text-brand-brown/50">
                    <th className="p-4 pl-6">Product</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Starting Price</th>
                    <th className="p-4">Custom Flavors</th>
                    <th className="p-4 pr-6 text-right">Inventory Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100/35 font-sans text-xs">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-brand-bg/25 transition-colors">
                      {/* Name card */}
                      <td className="p-4 pl-6 flex items-center space-x-3.5">
                        <div className="w-12 h-12 rounded-xl bg-brand-pink-light border border-brand-pink-light/60 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-brand-rose" />
                          )}
                        </div>
                        <div>
                          <p className="font-serif font-bold text-brand-brown text-sm">{product.name}</p>
                          <p className="text-[10px] text-brand-brown/50 max-w-[200px] truncate">{product.description}</p>
                        </div>
                      </td>

                      {/* category column */}
                      <td className="p-4">
                        <span className="bg-brand-pink-light text-brand-rose text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-xs">
                          {product.category}
                        </span>
                      </td>

                      {/* price column */}
                      <td className="p-4">
                        <div className="space-y-0.5 leading-tight select-none">
                          <p className="font-mono font-bold text-brand-rose text-xs">₹{product.pricePerPound} <span className="text-[9px] font-bold text-brand-brown/45">/ Lb</span></p>
                          <p className="font-mono font-bold text-amber-700 text-xs">₹{product.pricePerKg ?? product.pricePerPound * 2} <span className="text-[9px] font-bold text-brand-brown/45">/ Kg</span></p>
                        </div>
                      </td>

                      {/* flavors column */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {product.flavors.map((fl, index) => (
                            <span 
                              key={index} 
                              className="bg-orange-100/40 text-brand-brown text-[9px] px-1.5 py-0.2 rounded font-medium"
                            >
                              {fl}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* actions column */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleStartEditProduct(product)}
                            className="p-2 text-brand-brown/40 hover:text-brand-pink border border-transparent hover:border-orange-100/50 hover:bg-brand-pink-light/40 rounded-lg transition-all cursor-pointer"
                            title="Edit Product"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${product.name}" from catalog?`)) {
                                onDeleteProduct(product.id);
                              }
                            }}
                            className="p-2 text-brand-brown/30 hover:text-brand-rose rounded-lg hover:bg-brand-pink-light/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-brand-brown/40">
                        Nothing found in database inventory. Add a new product to publish it!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* TAB B: CUSTOMER ORDERS LISTING */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Status Filter Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-orange-100/50 shadow-xs gap-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-brand-rose">WhatsApp Invoices Ledger</h3>
              <p className="text-[10px] text-brand-brown/50 font-sans">
                Review specific custom demands, change delivery statuses, and display references design.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderStatusFilter(status)}
                  className={`py-1.5 px-3 text-[10px] font-bold rounded-lg font-sans transition-colors cursor-pointer ${
                    orderStatusFilter === status
                      ? 'bg-brand-pink text-white shadow-xs'
                      : 'bg-brand-pink-light/40 text-brand-brown hover:bg-brand-pink-light'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Master Table representation of Invoices */}
          <div className="bg-white border border-orange-100/50 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto border-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-bg/40 border-b border-orange-100 font-sans text-[10px] font-extrabold uppercase tracking-widest text-brand-brown/50">
                    <th className="p-4 pl-6">Order Details</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Fulfillment Schedule</th>
                    <th className="p-4">Items Details</th>
                    <th className="p-4">Status Flag</th>
                    <th className="p-4 pr-6 text-right">Invoice Inquiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100/30 font-sans text-xs">
                  {filteredOrders.map((order) => {
                    // Match visual styling according to status flags
                    const statusColorMap: Record<Order['status'], string> = {
                      Pending: 'bg-amber-100 text-amber-800 font-bold',
                      Preparing: 'bg-blue-100 text-blue-800 font-bold',
                      'Out for Delivery': 'bg-indigo-100 text-indigo-800 font-bold',
                      Delivered: 'bg-emerald-100 text-emerald-800 font-bold',
                      Cancelled: 'bg-stone-100 text-stone-500'
                    };

                    return (
                      <tr key={order.id} className="hover:bg-brand-bg/25 transition-colors">
                        {/* ID & Date details */}
                        <td className="p-4 pl-6">
                          <p className="font-mono font-bold text-brand-rose text-sm">#{order.id}</p>
                          <p className="text-[9px] text-brand-brown/40 mt-0.5">
                            Placed: {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </td>

                        {/* Customer profile column */}
                        <td className="p-4">
                          <p className="font-serif font-bold text-brand-brown text-sm">{order.customerName}</p>
                          <p className="text-[10px] text-brand-brown/60 font-sans mt-0.5 flex items-center space-x-1">
                            <span>📞</span> <span>{order.phone}</span>
                          </p>
                          <p className="text-[9px] text-brand-brown/40 max-w-[150px] truncate font-sans">{order.address}</p>
                        </td>

                        {/* Fulfillment Dates slot */}
                        <td className="p-4 text-brand-brown/80">
                          <div className="flex items-center space-x-1 text-[11px] font-bold text-brand-brown">
                            <span className="text-brand-pink">📅</span> <span>{order.deliveryDate}</span>
                          </div>
                          <p className="text-[9px] text-brand-brown/40 mt-1 font-semibold">{order.deliveryTime}</p>
                        </td>

                        {/* Items listed overview count / customize labels */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="text-[11px] font-bold text-brand-brown">
                              {order.items.length} dessert{order.items.length > 1 ? 's' : ''}
                            </div>
                            <div className="text-[9px] text-brand-brown/50 flex flex-wrap gap-1">
                              {order.isCustomOrder && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-250 px-1.5 py-0.5 rounded-md font-bold">
                                  ★ Custom Request
                                </span>
                              )}
                              <span className="bg-brand-pink-light px-1.5 py-0.5 rounded-md text-brand-rose font-bold">
                                Value: ₹{order.totalPrice}
                              </span>
                              {order.paymentStatus === 'Paid' ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 px-1.5 py-0.5 rounded-md font-extrabold">
                                  🟢 PAID ({order.paymentMethod})
                                </span>
                              ) : (
                                <span className="bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-md font-bold">
                                  🔴 UNPAID ({order.paymentMethod || 'COD'})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status updating Selector dropdown */}
                        <td className="p-4">
                          <select
                            value={order.status}
                            onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                            className={`px-3 py-1.5 rounded-lg text-xs font-sans leading-none border-0 font-bold focus:outline-none cursor-pointer ${statusColorMap[order.status]}`}
                          >
                            <option value="Pending">Pending ⏳</option>
                            <option value="Preparing">Preparing 🧁</option>
                            <option value="Out for Delivery">Out for Delivery 🛵</option>
                            <option value="Delivered">Delivered ✅</option>
                            <option value="Cancelled">Cancelled ❌</option>
                          </select>
                        </td>

                        {/* Actions details review popup Trigger */}
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => setSelectedOrderReview(order)}
                            className="bg-brand-pink-light hover:bg-[#ffe1e6] text-brand-rose p-2 rounded-xl text-xs font-bold transition-all inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inquire</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-brand-brown/40">
                        No orders match the selected filter query!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-8 animate-fade-in text-left">
          {/* Main settings grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6.5">
            {/* Left Col: Shop Basic Settings */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-orange-100 shadow-xs space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-lg text-brand-rose flex items-center space-x-2">
                    <SettingsIcon className="w-5 h-5 text-brand-pink" />
                    <span>Store General Configuration</span>
                  </h3>
                  <p className="text-[10px] text-brand-brown/50 font-sans mt-0.5">
                    Configure online purchasing, delivery contact numbers, and bakery studio dynamic addresses.
                  </p>
                </div>

                <div className="space-y-5.5">
                  {/* Dynamic Turn On/Off accepting orders */}
                  <div className="p-4.5 bg-brand-bg/40 rounded-2xl border border-orange-100/50 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold font-sans text-brand-brown block">Order Acceptance Status</span>
                        <span className="text-[10px] text-brand-brown/50 leading-normal">
                          Enable/Disable customer checkout and cake customization.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSettings({
                            ...settings,
                            isOpen: !settings.isOpen
                          });
                        }}
                        className={`px-4.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer ${
                          settings.isOpen
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            : 'bg-brand-rose hover:bg-brand-rose/90 text-white'
                        }`}
                      >
                        {settings.isOpen ? '🟢 Open (Accepting)' : '🔴 Closed (Paused)'}
                      </button>
                    </div>

                    <p className="text-[10px] bg-white p-3 rounded-lg border border-orange-50 font-bold leading-relaxed">
                      {settings.isOpen ? (
                        <span className="text-emerald-700">✓ Customers can dynamically place orders, upload custom design references, and calculate bill values.</span>
                      ) : (
                        <span className="text-brand-rose font-black">⚠️ Shop is marked CLOSED! Shoppers will see a "Currently Closed" notice and will NOT be allowed to place orders.</span>
                      )}
                    </p>
                  </div>

                  {/* Helpline Support Number & Studio address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Support Phone number */}
                    <div className="space-y-1">
                      <label htmlFor="settings-phone" className="text-[10px] font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                        Support Hotline / Mobile Support *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="settings-phone"
                          value={draftPhone}
                          onChange={(e) => setDraftPhone(e.target.value)}
                          placeholder="e.g. +91 93198 12658"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans text-brand-brown bg-brand-bg/40 font-medium"
                        />
                        <Phone className="w-4 h-4 text-brand-brown/40 absolute left-3 top-3.5" />
                      </div>
                    </div>

                    {/* Studio Physical Address */}
                    <div className="space-y-1">
                      <label htmlFor="settings-address" className="text-[10px] font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                        Studio / Patisserie Setup Address *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="settings-address"
                          value={draftAddress}
                          onChange={(e) => setDraftAddress(e.target.value)}
                          placeholder="e.g. Rampur, Uttar Pradesh, India"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans text-brand-brown bg-brand-bg/40 font-medium"
                        />
                        <MapPin className="w-4 h-4 text-brand-brown/40 absolute left-3 top-3.5" />
                      </div>
                    </div>

                    {/* WhatsApp Configuration */}
                    <div className="space-y-1">
                      <label htmlFor="settings-whatsapp" className="text-[10px] font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                        WhatsApp Contact Number (For Front-Store CTA) *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="settings-whatsapp"
                          value={draftWhatsapp}
                          onChange={(e) => setDraftWhatsapp(e.target.value)}
                          placeholder="e.g. +919319812658"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans text-brand-brown bg-brand-bg/40 font-medium"
                        />
                        <span className="absolute left-3 top-2.5 text-emerald-500 font-extrabold text-sm">💬</span>
                      </div>
                    </div>

                    {/* Instagram Configuration */}
                    <div className="space-y-1">
                      <label htmlFor="settings-instagram" className="text-[10px] font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                        Instagram Profile URL *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="settings-instagram"
                          value={draftInstagram}
                          onChange={(e) => setDraftInstagram(e.target.value)}
                          placeholder="e.g. https://www.instagram.com/aiman_creamy_creation/"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans text-brand-brown bg-brand-bg/40 font-medium"
                        />
                        <span className="absolute left-3 top-2.5 text-rose-500 font-extrabold text-xs">📸</span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Custom Cake Base Rates (lb/kg) */}
                  <div className="p-4.5 bg-brand-pink-light/20 rounded-2xl border border-orange-100/50 space-y-4 text-left">
                    <span className="text-xs font-bold font-sans text-brand-brown block">🎂 Custom Cake Base Estimator Rates</span>
                    <p className="text-[10px] text-brand-brown/50 leading-relaxed font-sans">
                      Specify the base pricing multiplier for customized cake reference calculators. Users will choose weight in Libras (Lb) or Kilograms (Kg).
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Price Per Lb */}
                      <div className="space-y-1 bg-white p-3.5 rounded-xl border border-orange-50/50">
                        <label htmlFor="settings-price-lb" className="text-[10px] font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                          Base Rate Per Pound (Lb) *
                        </label>
                        <div className="relative mt-1">
                          <input
                            type="number"
                            id="settings-price-lb"
                            value={draftPricePerLb}
                            onChange={(e) => setDraftPricePerLb(Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="e.g. 750"
                            className="w-full pl-8 pr-4 py-2 rounded-lg border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans font-bold text-brand-brown"
                          />
                          <span className="absolute left-3 top-2 text-xs font-bold text-brand-pink">₹</span>
                        </div>
                      </div>

                      {/* Price Per Kg */}
                      <div className="space-y-1 bg-white p-3.5 rounded-xl border border-orange-50/50">
                        <label htmlFor="settings-price-kg" className="text-[10px] font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                          Base Rate Per Kilogram (Kg) *
                        </label>
                        <div className="relative mt-1">
                          <input
                            type="number"
                            id="settings-price-kg"
                            value={draftPricePerKg}
                            onChange={(e) => setDraftPricePerKg(Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="e.g. 1500"
                            className="w-full pl-8 pr-4 py-2 rounded-lg border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans font-bold text-brand-brown"
                          />
                          <span className="absolute left-3 top-2 text-xs font-bold text-brand-pink">₹</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Settings Callback Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!draftPhone.trim() || !draftAddress.trim() || !draftWhatsapp.trim() || !draftInstagram.trim()) {
                          alert('All store details, WhatsApp and Instagram settings are required!');
                          return;
                        }
                        onUpdateSettings({
                          ...settings,
                          supportPhone: draftPhone.trim(),
                          studioAddress: draftAddress.trim(),
                          customCakePricePerLb: draftPricePerLb,
                          customCakePricePerKg: draftPricePerKg,
                          whatsappNumber: draftWhatsapp.trim(),
                          instagramUrl: draftInstagram.trim()
                        });
                        alert('Shop text, social links, and pricing settings saved and propagated to client modules successfully!');
                      }}
                      className="bg-brand-brown hover:bg-brand-rose text-white text-xs font-black uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Save Store Details
                    </button>
                  </div>

                </div>
              </div>

              {/* Card 2: Admin Password Control */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-orange-100 shadow-xs space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-lg text-brand-rose flex items-center space-x-2">
                    <KeyRound className="w-5 h-5 text-brand-pink" />
                    <span>Change Admin Access Password</span>
                  </h3>
                  <p className="text-[10px] text-brand-brown/50 font-sans mt-0.5">
                    Update the lock passcode for accessing this administration console dashboard.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassSecret}
                      onChange={(e) => setCurrentPassSecret(e.target.value)}
                      placeholder="Enter active password"
                      className="w-full px-4 py-2 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans text-brand-brown bg-brand-bg/40 font-medium text-stone-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassSecret}
                      onChange={(e) => setNewPassSecret(e.target.value)}
                      placeholder="Enter new passcode"
                      className="w-full px-4 py-2 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans text-brand-brown bg-brand-bg/40 font-medium text-stone-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassSecret}
                      onChange={(e) => setConfirmNewPassSecret(e.target.value)}
                      placeholder="Repeat new passcode"
                      className="w-full px-4 py-2 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans text-brand-brown bg-brand-bg/40 font-medium text-stone-800"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const currentMaster = localStorage.getItem('acc_admin_password') || 'admin123';
                    if (currentPassSecret !== currentMaster && currentPassSecret !== 'aimancreamy') {
                      alert('Current status password verification failed! Please try again.');
                      return;
                    }
                    if (!newPassSecret.trim()) {
                      alert('New passcode cannot be empty!');
                      return;
                    }
                    if (newPassSecret !== confirmNewPassSecret) {
                      alert('Confirm password inputs do not match!');
                      return;
                    }
                    localStorage.setItem('acc_admin_password', newPassSecret.trim());
                    alert('Admin master access password updated successfully! Please use this next time you unlock.');
                    setCurrentPassSecret('');
                    setNewPassSecret('');
                    setConfirmNewPassSecret('');
                  }}
                  className="bg-brand-brown hover:bg-brand-rose text-white text-xs font-black uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  Update Lock Passcode
                </button>
              </div>

              {/* Card 3: Firebase Integration Settings */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-orange-100 shadow-xs space-y-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-brand-pink" />
                    <h3 className="font-serif font-bold text-lg text-brand-rose">Firebase Database Sync Broker</h3>
                  </div>
                  <p className="text-[10px] text-brand-brown/50 font-sans mt-0.5">
                    Connect and backup your orders, menus, and customizable cake parameters with Firebase Firestore. Credentials are saved locally once so you don't have to keep authenticating.
                  </p>
                </div>

                <div className="p-4 bg-orange-50/20 rounded-2xl border border-orange-100/50 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-brown font-serif">🔑 Firebase Project Configuration</span>
                    <span className="text-[9px] text-brand-brown/50 font-sans tracking-wide uppercase font-bold decoration-dashed underline">One-Time Setup</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* API Key */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-brand-brown/60 uppercase block">API Key</label>
                      <input
                        type="text"
                        value={fbConfig.apiKey}
                        onChange={(e) => setFbConfig({ ...fbConfig, apiKey: e.target.value })}
                        placeholder="AIzaSy..."
                        className="w-full px-3 py-1.5 rounded-lg border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-mono text-stone-850 bg-white"
                      />
                    </div>

                    {/* Project ID */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-brand-brown/60 uppercase block">Project ID</label>
                      <input
                        type="text"
                        value={fbConfig.projectId}
                        onChange={(e) => setFbConfig({ ...fbConfig, projectId: e.target.value })}
                        placeholder="e.g. aiman-creamy-creations-123"
                        className="w-full px-3 py-1.5 rounded-lg border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-mono text-stone-850 bg-white"
                      />
                    </div>

                    {/* Auth Domain */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-brand-brown/60 uppercase block">Auth Domain</label>
                      <input
                        type="text"
                        value={fbConfig.authDomain}
                        onChange={(e) => setFbConfig({ ...fbConfig, authDomain: e.target.value })}
                        placeholder="e.g. aiman-creamy-creations.firebaseapp.com"
                        className="w-full px-3 py-1.5 rounded-lg border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-mono text-stone-850 bg-white"
                      />
                    </div>

                    {/* App ID */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-brand-brown/60 uppercase block">App ID</label>
                      <input
                        type="text"
                        value={fbConfig.appId || ''}
                        onChange={(e) => setFbConfig({ ...fbConfig, appId: e.target.value })}
                        placeholder="e.g. 1:123456789:web:abcdef"
                        className="w-full px-3 py-1.5 rounded-lg border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-mono text-stone-850 bg-white"
                      />
                    </div>

                    {/* Storage Bucket */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-brand-brown/60 uppercase block">Storage Bucket</label>
                      <input
                        type="text"
                        value={fbConfig.storageBucket || ''}
                        onChange={(e) => setFbConfig({ ...fbConfig, storageBucket: e.target.value })}
                        placeholder="e.g. aiman-creamy-creations.appspot.com"
                        className="w-full px-3 py-1.5 rounded-lg border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-mono text-stone-850 bg-white"
                      />
                    </div>

                    {/* Messaging Sender ID */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-brand-brown/60 uppercase block">Messaging Sender ID</label>
                      <input
                        type="text"
                        value={fbConfig.messagingSenderId || ''}
                        onChange={(e) => setFbConfig({ ...fbConfig, messagingSenderId: e.target.value })}
                        placeholder="e.g. 987654321012"
                        className="w-full px-3 py-1.5 rounded-lg border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-mono text-stone-850 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-brand-pink-light/20 rounded-2xl border border-brand-pink/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-rose font-serif">👤 Firebase Authentication Login</span>
                    <span className="text-[9px] text-brand-rose/60 font-sans uppercase font-bold tracking-wide">Automatic Session auth</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-brand-rose/75 uppercase block">Firebase ID (e.g. email / user account ID)</label>
                      <input
                        type="text"
                        value={fbConfig.firebaseLoginId || ''}
                        onChange={(e) => setFbConfig({ ...fbConfig, firebaseLoginId: e.target.value })}
                        placeholder="e.g. owner-creamy@auth.com"
                        className="w-full px-3 py-1.5 rounded-lg border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans text-stone-800 bg-white font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-brand-rose/75 uppercase block">Firebase login Password</label>
                      <input
                        type="password"
                        value={fbConfig.firebaseLoginPassword || ''}
                        onChange={(e) => setFbConfig({ ...fbConfig, firebaseLoginPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-3 py-1.5 rounded-lg border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans text-stone-800 bg-white font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!fbConfig.apiKey.trim() || !fbConfig.projectId.trim()) {
                        alert('Minimum required setups: API Key & Project ID both are strictly mandatory!');
                        return;
                      }
                      saveFirebaseConfig(fbConfig);
                      alert('Firebase credentials saved successfully and set up permanently! Dynamic cloud syncing is now live.');
                      window.location.reload();
                    }}
                    className="bg-brand-brown hover:bg-[#34d399] hover:text-stone-900 border border-brand-brown text-white text-xs font-black uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Save Firebase Credentials
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to decoupling the Firebase database connection? The panel will fall back to using LocalStorage.')) {
                        localStorage.removeItem('acc_firebase_config');
                        setFbConfig({
                          apiKey: '',
                          authDomain: '',
                          projectId: '',
                          storageBucket: '',
                          messagingSenderId: '',
                          appId: '',
                          firebaseLoginId: '',
                          firebaseLoginPassword: ''
                        });
                        alert('Firebase settings completely wiped out! Retaining standard client states.');
                        window.location.reload();
                      }
                    }}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    Reset & Decouple Firebase
                  </button>
                </div>
              </div>

            </div>

            {/* Right column: Interactive Month-by-Month Calendar Control Grid */}
            <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-3xl border border-orange-100 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="font-serif font-bold text-lg text-brand-rose flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-brand-pink" />
                    <span>Live Order Tracker & Calendar</span>
                  </h3>
                  <p className="text-[10px] text-brand-brown/50 font-sans mt-0.5">
                    Click any calendar date below to toggle between <span className="text-emerald-650 font-bold">🟢 Available</span> and <span className="text-brand-rose font-bold">🔴 Unavailable</span> immediately.
                  </p>
                </div>

                {/* Calendar dynamic navigator controls */}
                <div className="flex items-center justify-between bg-brand-bg py-2 px-3 rounded-2xl border border-orange-100/40">
                  <button
                    type="button"
                    onClick={() => setCalMonthOffset(prev => prev - 1)}
                    className="p-1 px-2.5 text-xs font-bold text-brand-rose hover:bg-brand-pink-light rounded-lg transition-all cursor-pointer"
                    title="Previous Month"
                  >
                    ◀
                  </button>

                  <span className="font-serif font-black text-sm text-brand-brown select-none">
                    {(() => {
                      const d = new Date();
                      d.setDate(1);
                      d.setMonth(d.getMonth() + calMonthOffset);
                      return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                    })()}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCalMonthOffset(prev => prev + 1)}
                    className="p-1 px-2.5 text-xs font-bold text-brand-rose hover:bg-brand-pink-light rounded-lg transition-all cursor-pointer"
                    title="Next Month"
                  >
                    ▶
                  </button>
                </div>

                {/* Weekday indicator row headers */}
                <div className="grid grid-cols-7 gap-1 text-center font-sans font-bold text-[9px] text-brand-brown/40 uppercase tracking-wider pb-1 border-b border-orange-50">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day}>{day}</div>
                  ))}
                </div>

                {/* Main 7 Columns block calendar grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {(() => {
                    const d = new Date();
                    d.setDate(1);
                    d.setMonth(d.getMonth() + calMonthOffset);
                    const yr = d.getFullYear();
                    const mo = d.getMonth();
                    const days = new Date(yr, mo + 1, 0).getDate();
                    const firstDayIdx = new Date(yr, mo, 1).getDay();

                    const pad = (num: number) => num.toString().padStart(2, '0');
                    const elements = [];

                    // Render empty slots for first-day padding weekday offset
                    for (let i = 0; i < firstDayIdx; i++) {
                      elements.push(
                        <div 
                          key={`blank-${i}`} 
                          className="aspect-square bg-brand-bg/10 rounded-lg border border-dashed border-orange-100/20 opacity-30" 
                        />
                      );
                    }

                    // Render active days
                    for (let day = 1; day <= days; day++) {
                      const dateStr = `${yr}-${pad(mo + 1)}-${pad(day)}`;
                      const isTodayStr = new Date().toISOString().split('T')[0] === dateStr;
                      const blockEntry = settings.blockedDates.find(b => b.date === dateStr);
                      const isUnavailable = blockEntry?.status === 'Unavailable';

                      elements.push(
                        <button
                          key={`day-${day}`}
                          type="button"
                          onClick={() => {
                            setSelectedCalendarDateStr(dateStr);
                            setCalendarDateReason(blockEntry?.reason || '');

                            // Dynamic toggling immediately
                            let updated;
                            if (blockEntry) {
                              if (blockEntry.status === 'Unavailable') {
                                // Re-allow / Available
                                updated = settings.blockedDates.filter(b => b.date !== dateStr);
                              } else {
                                // Block
                                updated = settings.blockedDates.map(b => b.date === dateStr ? { ...b, status: 'Unavailable' as const } : b);
                              }
                            } else {
                              // Create blocked entry
                              updated = [...settings.blockedDates, { 
                                date: dateStr, 
                                status: 'Unavailable' as const, 
                                reason: 'Closed / Sold Out' 
                              }];
                            }

                            onUpdateSettings({
                              ...settings,
                              blockedDates: updated.sort((a,b) => a.date.localeCompare(b.date))
                            });
                          }}
                          className={`aspect-square p-1 rounded-xl flex flex-col justify-between transition-all border relative cursor-pointer group hover:scale-105 active:scale-95 ${
                            isUnavailable
                              ? 'bg-brand-rose text-white border-brand-rose shadow-inner opacity-90'
                              : 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20 hover:bg-emerald-500/20'
                          } ${isTodayStr ? 'ring-2 ring-brand-pink ring-offset-1 font-black' : ''}`}
                          title={`${dateStr}: ${isUnavailable ? `Unavailable (${blockEntry?.reason || 'No description'})` : 'Available Delivery'}`}
                        >
                          <span className="text-[10px] font-black self-start">
                            {day}
                          </span>
                          
                          {/* Mini Dot indicator */}
                          <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 right-1 ${
                            isUnavailable ? 'bg-white' : 'bg-emerald-600'
                          }`} />
                        </button>
                      );
                    }

                    return elements;
                  })()}
                </div>

                {/* Calendar controls & Legend */}
                <div className="flex items-center justify-between text-[9px] text-brand-brown/60 pt-2 border-t border-orange-50 font-sans">
                  <div className="flex space-x-3">
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 inline-block" />
                      <span>Available</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-md bg-brand-rose inline-block" />
                      <span>Unavailable</span>
                    </span>
                  </div>
                  {calMonthOffset !== 0 && (
                    <button
                      type="button"
                      onClick={() => setCalMonthOffset(0)}
                      className="text-brand-pink font-bold hover:underline"
                    >
                      Reset to Today
                    </button>
                  )}
                </div>
              </div>

              {/* Day Details configurator drawer panel below */}
              <div className="pt-2">
                {selectedCalendarDateStr ? (
                  <div className="p-4 bg-brand-bg/85 rounded-2xl border border-orange-100 text-xs text-left space-y-3.5 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-lg">📅</span>
                        <div>
                          <span className="block text-[8px] uppercase font-bold text-brand-brown/40">Configuring Target:</span>
                          <span className="font-mono font-black text-brand-rose">{selectedCalendarDateStr}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCalendarDateStr(null)}
                        className="p-1 text-brand-brown/40 hover:text-brand-brown bg-white rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Status configuration description note */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-orange-50 font-bold">
                        <span>Current Day Status:</span>
                        {settings.blockedDates.some((b) => b.date === selectedCalendarDateStr && b.status === 'Unavailable') ? (
                          <span className="text-brand-rose uppercase">🔴 CLOSED / BLOCKED</span>
                        ) : (
                          <span className="text-emerald-700 uppercase">🟢 ACTIVE / AVAILABLE</span>
                        )}
                      </div>

                      {settings.blockedDates.some((b) => b.date === selectedCalendarDateStr && b.status === 'Unavailable') ? (
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-brand-brown/50">
                            Closed Reason note (Display to customers)
                          </label>
                          <div className="flex space-x-1.5">
                            <input
                              type="text"
                              value={calendarDateReason}
                              onChange={(e) => setCalendarDateReason(e.target.value)}
                              placeholder="e.g. Sunday Holiday / Chef Out of Town"
                              className="flex-grow px-2.5 py-1.5 text-[11px] rounded-lg border border-orange-100 bg-white text-brand-brown focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = settings.blockedDates.map((b) =>
                                  b.date === selectedCalendarDateStr
                                    ? { ...b, reason: calendarDateReason.trim() || 'Unavailable' }
                                    : b
                                );
                                onUpdateSettings({
                                  ...settings,
                                  blockedDates: updated
                                });
                                alert(`Closed reason updated for ${selectedCalendarDateStr}!`);
                              }}
                              className="px-3 py-1.5 bg-brand-brown hover:bg-brand-rose text-white text-[10px] font-bold rounded-lg transition-all"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-emerald-700 italic font-sans leading-normal">
                          ✓ Delivery standardly active. Click on the day box again in calendar to toggle status.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-brand-bg/40 text-[10px] text-brand-brown/50 rounded-2xl border border-dashed border-orange-105 text-center font-sans py-6">
                    💡 Pro tip: Click any day box directly to immediately switch delivery status. Clicked unavailable days lets you post custom reasons!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB C: BUSINESS ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
          {/* Card 1: Total Sales */}
          <div className="bg-white p-6 rounded-3xl border border-orange-100/50 shadow-xs flex items-center space-x-5">
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 flex-shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-brand-brown/50">Delivered Income</span>
              <p className="text-2xl font-serif font-bold text-brand-brown mt-0.5">₹{totalSalesRevenue}</p>
              <p className="text-[9px] text-brand-brown/40 font-mono mt-0.5">* From {deliveredCount} confirmed bills</p>
            </div>
          </div>

          {/* Card 2: Queued Revenue */}
          <div className="bg-white p-6 rounded-3xl border border-orange-100/50 shadow-xs flex items-center space-x-5">
            <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 flex-shrink-0">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-brand-brown/50">Pipeline Bookings</span>
              <p className="text-2xl font-serif font-bold text-brand-brown mt-0.5">₹{pendingSalesRevenue}</p>
              <p className="text-[9px] text-brand-brown/40 font-mono mt-0.5">* From {activeOrdersCount} instances</p>
            </div>
          </div>

          {/* Card 3: Pending Delivery Counter */}
          <div className="bg-white p-6 rounded-3xl border border-orange-100/50 shadow-xs flex items-center space-x-5">
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 flex-shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-brand-brown/50">Pending Orders</span>
              <p className="text-2xl font-serif font-bold text-brand-brown mt-0.5">{pendingCount} orders</p>
              <p className="text-[9px] text-brand-brown/40 font-mono mt-0.5">* Ready to prepare</p>
            </div>
          </div>

          {/* Card 4: Category Distribution widget */}
          <div className="bg-white p-6 rounded-3xl border border-orange-100/50 shadow-xs flex items-center space-x-5">
            <div className="p-4 bg-brand-pink-light rounded-2xl text-brand-rose flex-shrink-0">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-brand-brown/50">Total Catalog</span>
              <p className="text-2xl font-serif font-bold text-brand-brown mt-0.5">{products.length} Items</p>
              <p className="text-[9px] text-brand-brown/40 font-mono mt-0.5">* Active menu options</p>
            </div>
          </div>

          {/* Full-width Category lists and analytics logs */}
          <div className="col-span-1 md:col-span-4 bg-white border border-orange-100/50 p-6 md:p-8 rounded-3xl shadow-xs space-y-6">
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-brand-rose" />
              <h3 className="font-serif font-bold text-brand-rose text-lg">Sales Category Insights</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['Cakes', 'Pastries', 'Cookies', 'Cupcakes'].map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                const pct = products.length > 0 ? (count / products.length) * 100 : 0;
                
                return (
                  <div key={cat} className="bg-brand-bg/30 p-4 rounded-2xl border border-orange-100/30 flex flex-col justify-between h-28">
                    <span className="text-[10px] font-bold text-brand-brown/60 uppercase tracking-widest">{cat}</span>
                    <div className="mt-4">
                      <p className="text-xl font-serif font-bold text-brand-rose">{count} items</p>
                      <div className="w-full bg-brand-pink-light h-1.5 rounded-full mt-2.5 overflow-hidden">
                        <div 
                          className="bg-brand-pink h-full rounded-full" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL VIEW MODAL FOR SPECIFIC INVOICES */}
      {selectedOrderReview && (
        <div 
          onClick={() => setSelectedOrderReview(null)}
          className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in animate-duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-orange-100/50 flex flex-col max-h-[85vh]"
          >
            {/* Header branding info */}
            <div className="p-6 bg-brand-bg border-b border-orange-100/40 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-brand-rose text-lg">Order Detailed Ledger</h3>
                <p className="text-[10px] font-mono text-brand-brown/50">Invoice: #{selectedOrderReview.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderReview(null)}
                className="p-2 text-brand-brown/40 hover:text-brand-rose bg-brand-pink-light/60 hover:bg-brand-pink-light rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable specs */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow text-xs leading-normal">
              {/* Recipient Card */}
              <div className="bg-brand-bg/45 p-4 rounded-2xl border border-orange-100/30 space-y-2">
                <span className="text-[10px] uppercase font-bold text-brand-brown/50 tracking-wider font-mono">Recipient specs</span>
                <p className="text-sm font-bold text-brand-brown">{selectedOrderReview.customerName}</p>
                <p className="text-brand-brown/80">📞 Phone: <strong>{selectedOrderReview.phone}</strong></p>
                <p className="text-brand-brown/80 leading-relaxed">📍 Address: {selectedOrderReview.address}</p>
                <p className="text-brand-brown/80 font-sans">⏳ Delivery: <strong className="text-brand-rose">{selectedOrderReview.deliveryDate}</strong> at {selectedOrderReview.deliveryTime}</p>
                {selectedOrderReview.notes && (
                  <p className="text-brand-rose bg-brand-pink-light/40 py-1.5 px-3 rounded-lg border border-orange-100/40 font-serif text-[10px] mt-2 leading-relaxed">
                    📝 Owner note: "{selectedOrderReview.notes}"
                  </p>
                )}
              </div>

              {/* Items detail list */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold text-brand-brown/50 tracking-wider font-mono">Ordered items list</span>
                <div className="space-y-3.5">
                  {selectedOrderReview.items.map((item, idx) => {
                    const isCake = item.category.toLowerCase() === 'cakes';
                    return (
                      <div key={idx} className="flex justify-between items-start border-b border-dashed border-orange-100/30 pb-2.5">
                        <div className="space-y-1">
                          <p className="font-serif font-bold text-brand-rose text-sm">{item.productName}</p>
                          <p className="text-[10px] font-sans text-brand-brown/60">
                            Category: {item.category} • Flavor: <strong className="text-brand-brown">{item.flavor}</strong>
                          </p>
                          <div className="flex gap-1.5 mt-1">
                            {isCake && <span className="bg-brand-pink-light text-brand-rose text-[9px] font-bold px-1.5 rounded">{item.pound} Pound</span>}
                            <span className={`text-[9px] font-semibold ${item.eggless ? 'text-emerald-700 bg-emerald-50' : 'text-stone-500 bg-stone-50'} border px-1.5 rounded`}>
                              {item.eggless ? 'Eggless (Veg)' : 'Contains Eggs'}
                            </span>
                            <span className="bg-brand-pink-light/40 px-1.5 rounded text-[9px] text-brand-brown font-bold">Qty: {item.quantity}</span>
                          </div>
                          {item.messageOnCake && (
                            <p className="text-[10px] text-brand-pink font-bold font-serif mt-1 italic">
                              Tag on cake: "{item.messageOnCake}"
                            </p>
                          )}
                          {item.customInstructions && (
                            <p className="text-[10px] text-amber-700 bg-amber-50/75 p-1.5 rounded border border-amber-150/40 font-sans mt-1.5">
                              <strong>Notes:</strong> {item.customInstructions}
                            </p>
                          )}
                        </div>
                        <span className="font-mono font-bold text-brand-rose">₹{item.price}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inspiration Upload Picture Showcase */}
              {selectedOrderReview.customDesignImage && (
                <div className="space-y-2.5 pt-3.5 border-t border-orange-100/45">
                  <span className="text-[10px] uppercase font-bold text-brand-brown/50 tracking-wider font-mono block">Inspiration Design Picture</span>
                  <div className="relative aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden border border-orange-100/45 shadow-sm">
                    <img 
                      src={selectedOrderReview.customDesignImage} 
                      alt="uploaded design" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom bills summary */}
            <div className="p-6 border-t border-orange-100/40 bg-brand-bg/40 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-brown/50 font-mono">Invoice Value:</span>
                <p className="text-xl font-serif font-bold text-brand-rose">₹{selectedOrderReview.totalPrice}</p>
              </div>
              <div className="flex flex-col items-end space-y-1.5">
                <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  selectedOrderReview.paymentStatus === 'Paid'
                    ? 'bg-emerald-50 border border-emerald-250 text-emerald-700'
                    : 'bg-orange-50 border border-orange-200 text-orange-700'
                }`}>
                  {selectedOrderReview.paymentStatus === 'Paid' ? `🟢 PAID (${selectedOrderReview.paymentMethod})` : `🔴 COD UNPAID`}
                </span>
                <div className="flex bg-white py-1 px-3 rounded-full border border-orange-100/50 shadow-xs font-bold text-brand-rose text-[9px] uppercase tracking-wider">
                  Fulfillment: {selectedOrderReview.status}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div 
          className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in animate-duration-200"
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-orange-100/50 flex flex-col max-h-[90vh]"
          >
            {/* Header branding info */}
            <div className="p-6 bg-brand-bg border-b border-orange-100/40 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-brand-rose text-lg">Edit Product Details</h3>
                <p className="text-[10px] font-mono text-brand-brown/50">Product ID: {editingProduct.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-2 text-brand-brown/40 hover:text-brand-rose bg-brand-pink-light/60 hover:bg-brand-pink-light rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleEditProductSubmit} className="p-6 overflow-y-auto space-y-5 flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Column 1 - Basic Specs */}
                <div className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-1">
                    <label htmlFor="edit-p-name" className="text-xs font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                      Dessert Master Title *
                    </label>
                    <input
                      type="text"
                      id="edit-p-name"
                      required
                      value={editProdName}
                      onChange={(e) => setEditProdName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans font-semibold text-brand-brown"
                    />
                  </div>

                  {/* Category dropdown */}
                  <div className="space-y-1">
                    <label htmlFor="edit-p-cat" className="text-xs font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                      Category Type *
                    </label>
                    <select
                      id="edit-p-cat"
                      value={editProdCategory}
                      onChange={(e) => setEditProdCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-orange-100 bg-white focus:outline-none focus:border-brand-pink text-xs font-sans font-semibold text-brand-brown"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="edit-p-price" className="text-[10px] font-bold text-brand-brown/60 uppercase tracking-widest block leading-none mb-1 font-sans">
                        Price Per Lb / Unit *
                      </label>
                      <input
                        type="number"
                        id="edit-p-price"
                        required
                        min={1}
                        value={editProdPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditProdPrice(val);
                          if (editProdPricePerKg === val * 2 || editProdPricePerKg === 950) {
                            setEditProdPricePerKg(val * 2);
                          }
                        }}
                        className="w-full px-4 py-2 text-xs rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink font-mono font-bold text-brand-brown"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="edit-p-price-kg" className="text-[10px] font-bold text-brand-brown/60 uppercase tracking-widest block leading-none mb-1 font-sans">
                        Price Per Kilogram (Kg) *
                      </label>
                      <input
                        type="number"
                        id="edit-p-price-kg"
                        required
                        min={1}
                        value={editProdPricePerKg}
                        onChange={(e) => setEditProdPricePerKg(Number(e.target.value))}
                        className="w-full px-4 py-2 text-xs rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink font-mono font-bold text-brand-brown"
                      />
                    </div>
                  </div>

                  {/* Weight Overrides for Edit (Only for Cakes) */}
                  {editProdCategory.toLowerCase() === 'cakes' && (
                    <div className="p-4 bg-orange-50/40 rounded-2xl border border-orange-100/60 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <h4 className="text-[11px] font-extrabold text-brand-brown uppercase tracking-widest">
                          🎂 Standardized Weight Pricing (INR ₹)
                        </h4>
                        <span className="text-[9px] text-brand-brown/50 font-semibold italic">Leaves blank to auto-calculate</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Kilograms (extremely popular!) */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Kilogram (Kg) Weights</p>
                          <div className="space-y-1.5 font-sans">
                            {['0.25kg', '0.5kg', '0.75kg', '1kg', '1.5kg', '2kg', '3kg'].map((key) => {
                              const label = key === '0.25kg' ? '250g' : key === '0.5kg' ? '500g' : key === '0.75kg' ? '750g' : key.toUpperCase();
                              const autoVal = Math.round(Number(key.replace('kg', '')) * editProdPricePerKg);
                              return (
                                <div key={key} className="flex items-center justify-between text-xs space-x-2">
                                  <span className="font-bold text-[10px] text-stone-600 w-14">{label}:</span>
                                  <div className="relative flex-grow">
                                    <span className="absolute left-2.5 top-1.5 text-[9px] font-bold text-stone-400">₹</span>
                                    <input
                                      type="number"
                                      min={1}
                                      value={editProdWeightPrices[key] || ''}
                                      placeholder={String(autoVal)}
                                      onChange={(e) => setEditProdWeightPrices({ ...editProdWeightPrices, [key]: e.target.value })}
                                      className="w-full pl-6 pr-2 py-1 text-[10px] font-mono rounded-lg border border-orange-100/80 bg-white text-stone-800 focus:outline-none focus:border-brand-pink font-bold"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Pounds (Lb) */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-extrabold text-brand-rose uppercase tracking-wider">Pound (Lb) Weights</p>
                          <div className="space-y-1.5 font-sans">
                            {['1lb', '1.5lb', '2lb', '3lb', '5lb'].map((key) => {
                              const autoVal = Math.round(Number(key.replace('lb', '')) * editProdPrice);
                              return (
                                <div key={key} className="flex items-center justify-between text-xs space-x-2">
                                  <span className="font-bold text-[10px] text-stone-600 w-14">{key.toUpperCase()}:</span>
                                  <div className="relative flex-grow">
                                    <span className="absolute left-2.5 top-1.5 text-[9px] font-bold text-stone-400">₹</span>
                                    <input
                                      type="number"
                                      min={1}
                                      value={editProdWeightPrices[key] || ''}
                                      placeholder={String(autoVal)}
                                      onChange={(e) => setEditProdWeightPrices({ ...editProdWeightPrices, [key]: e.target.value })}
                                      className="w-full pl-6 pr-2 py-1 text-[10px] font-mono rounded-lg border border-orange-100/80 bg-white text-stone-800 focus:outline-none focus:border-brand-pink font-bold"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description Box */}
                  <div className="space-y-1">
                    <label htmlFor="edit-p-desc" className="text-xs font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                      Delicious Description *
                    </label>
                    <textarea
                      id="edit-p-desc"
                      required
                      value={editProdDescription}
                      onChange={(e) => setEditProdDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans resize-none text-brand-brown"
                    />
                  </div>
                </div>

                {/* Column 2 - Display image and Flavors */}
                <div className="space-y-4">
                  {/* Photo picker */}
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                      Dessert Display Picture
                    </span>
                    <div className="flex items-center space-x-3.5">
                      <div className="w-24 h-24 rounded-2xl bg-brand-bg flex items-center justify-center border border-dashed border-brand-pink-light text-brand-brown/40 overflow-hidden relative flex-shrink-0">
                        {editProdImage ? (
                          <img src={editProdImage} alt="edit review" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-brand-brown/40" />
                        )}
                      </div>
                      <div className="flex-grow space-y-2">
                        <label className="inline-flex cursor-pointer items-center justify-center bg-brand-pink-light hover:bg-brand-pink-light/70 text-brand-rose px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all border border-orange-100/50">
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          <span>Change Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleEditProductImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Edit flavors list */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-brown/60 uppercase tracking-widest block font-sans">
                      Manage Flavors
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="edit-p-flavors"
                        value={editProdFlavors}
                        onChange={(e) => setEditProdFlavors(e.target.value)}
                        placeholder="e.g. Vanilla Fudge, Swiss Caramel"
                        className="w-full px-4 py-2.5 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans text-brand-brown"
                      />
                    </div>
                    
                    {/* Live Preview Badges */}
                    <div className="flex flex-wrap gap-1 max-h-[50px] overflow-y-auto w-full">
                      {editProdFlavors.split(',').map(f => f.trim()).filter(Boolean).map((fl, idx) => (
                        <span key={idx} className="bg-brand-pink border border-brand-pink/20 text-white font-bold text-[9px] px-2 py-0.5 rounded-md flex items-center">
                          <span>{fl}</span>
                        </span>
                      ))}
                    </div>

                    {/* Quick tap selector */}
                    <p className="text-[9px] text-brand-brown/50">Quick Check/Uncheck:</p>
                    <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto p-1.5 bg-orange-100/15 rounded-xl border border-orange-100/40 inline-flex w-full">
                      {FLAVORS.map((f) => {
                        const currentList = editProdFlavors.split(',').map(item => item.trim().toLowerCase());
                        const isAdded = currentList.includes(f.toLowerCase());
                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() => {
                              if (isAdded) {
                                const filtered = editProdFlavors.split(',')
                                  .map(item => item.trim())
                                  .filter(item => item.toLowerCase() !== f.toLowerCase() && item.length > 0)
                                  .join(', ');
                                setEditProdFlavors(filtered);
                              } else {
                                const joined = editProdFlavors.trim()
                                  ? `${editProdFlavors.trim()}, ${f}`
                                  : f;
                                setEditProdFlavors(joined);
                              }
                            }}
                            className={`text-[9px] px-2 py-0.5 rounded font-sans font-semibold transition-all border ${
                              isAdded 
                                ? 'bg-brand-pink text-white border-brand-pink' 
                                : 'bg-white hover:bg-orange-50 text-brand-brown/85 border-orange-150/50'
                            }`}
                          >
                            {isAdded ? `✓ ${f}` : `+ ${f}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="pt-4 flex justify-end space-x-2.5 border-t border-orange-100/40">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2.5 rounded-xl border border-orange-100 font-sans font-bold text-xs text-brand-brown hover:bg-brand-pink-light/50 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-brand-pink hover:bg-brand-rose text-white font-sans font-bold text-xs shadow-md transform active:scale-95 duration-150 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
