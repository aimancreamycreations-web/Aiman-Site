import React, { useState, useEffect, useRef } from 'react';
import { 
  Cake, Compass, Sparkles, Smile, ArrowRight, Heart, Star, PhoneCall, Gift, Check, Zap, MessageSquare 
} from 'lucide-react';
import { Product, Order, OrderItem, ShopSettings } from './types';
import { DEFAULT_PRODUCTS, FLAVORS, CATEGORIES } from './data';

import Header from './components/Header';
import ProductCard from './components/ProductCard';
import CustomizationModal from './components/CustomizationModal';
import CustomCakeWizard from './components/CustomCakeWizard';
import CartDrawer from './components/CartDrawer';
import { 
  firestoreDb, 
  collection, 
  doc, 
  onSnapshot, 
  dbSaveProduct, 
  dbSaveSettings, 
  dbSaveOrder,
  handleFirestoreError,
  OperationType
} from './firebase';

export default function App() {
  // Load initial database list or fallback to factory listings
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Store Settings (Dynamic Open status, hotline etc.)
  const [settings, setSettings] = useState<ShopSettings>(() => {
    const cached = localStorage.getItem('acc_settings');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return {
          ...parsed,
          customCakePricePerLb: parsed.customCakePricePerLb ?? 750,
          customCakePricePerKg: parsed.customCakePricePerKg ?? 1500,
          whatsappNumber: parsed.whatsappNumber ?? '+919319812658',
          instagramUrl: parsed.instagramUrl ?? 'https://www.instagram.com/aiman_creamy_creation/'
        };
      } catch (e) {
        // Safe check skip
      }
    }
    return {
      isOpen: true,
      supportPhone: '+91 93198 12658',
      studioAddress: 'Rampur, Uttar Pradesh, India',
      blockedDates: [],
      customCakePricePerLb: 750,
      customCakePricePerKg: 1500,
      whatsappNumber: '+919319812658',
      instagramUrl: 'https://www.instagram.com/aiman_creamy_creation/'
    };
  });

  const handleUpdateSettings = (updated: ShopSettings) => {
    setSettings(updated);
    localStorage.setItem('acc_settings', JSON.stringify(updated));
    dbSaveSettings(updated);
  };

  // Cart operations
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [customImages, setCustomImages] = useState<string[]>([]); // Base64 references for uploaded custom cake images

  // Modals / Navigation states
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCustomWizardOpen, setIsCustomWizardOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Storefront Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // References for smoother scrolling animations
  const menuScrollRef = useRef<HTMLDivElement>(null);

  // Synchronize localStorage and Firebase on startup
  useEffect(() => {
    const cachedProducts = localStorage.getItem('acc_products');
    if (cachedProducts) {
      setProducts(JSON.parse(cachedProducts));
    } else {
      setProducts(DEFAULT_PRODUCTS);
      localStorage.setItem('acc_products', JSON.stringify(DEFAULT_PRODUCTS));
    }

    const cachedOrders = localStorage.getItem('acc_orders');
    if (cachedOrders) {
      setOrders(JSON.parse(cachedOrders));
    } else {
      setOrders([]);
    }

    // Connect real-time Firebase listeners to always fetch latest and live synced products and settings!
    if (firestoreDb) {
      const unsubProducts = onSnapshot(collection(firestoreDb, "products"), (snapshot) => {
        const prods: Product[] = [];
        snapshot.forEach((docSnap) => {
          prods.push({ id: docSnap.id, ...docSnap.data() } as Product);
        });
        if (prods.length > 0) {
          setProducts(prods);
          localStorage.setItem('acc_products', JSON.stringify(prods));
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "products");
      });

      const unsubSettings = onSnapshot(doc(firestoreDb, "settings", "shop_settings"), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const merged = {
            ...settings,
            ...data
          } as ShopSettings;
          setSettings(merged);
          localStorage.setItem('acc_settings', JSON.stringify(merged));
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, "settings/shop_settings");
      });

      const unsubOrders = onSnapshot(collection(firestoreDb, "orders"), (snapshot) => {
        const ords: Order[] = [];
        snapshot.forEach((docSnap) => {
          ords.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });
        setOrders(ords);
        localStorage.setItem('acc_orders', JSON.stringify(ords));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "orders");
      });

      return () => {
        unsubProducts();
        unsubSettings();
        unsubOrders();
      };
    }
  }, []);

  // Update categories database helper
  const handleAddProduct = (newProduct: Product) => {
    const updated = [newProduct, ...products];
    setProducts(updated);
    localStorage.setItem('acc_products', JSON.stringify(updated));
    dbSaveProduct(newProduct);
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    localStorage.setItem('acc_products', JSON.stringify(updated));
  };

  const handleEditProduct = (updatedProduct: Product) => {
    const updated = products.map((p) => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updated);
    localStorage.setItem('acc_products', JSON.stringify(updated));
    dbSaveProduct(updatedProduct);
  };

  // Manage client invoice trackers
  const handlePlaceOrder = (newOrder: Order) => {
    const updated = [newOrder, ...orders];
    setOrders(updated);
    localStorage.setItem('acc_orders', JSON.stringify(updated));
    dbSaveOrder(newOrder);
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        const newOrder = { ...o, status };
        dbSaveOrder(newOrder);
        return newOrder;
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem('acc_orders', JSON.stringify(updated));
  };

  // Clear or restore factory databases
  const handleResetDatabase = () => {
    if (confirm('Are you absolutely sure you want to reset all menus to the factory default list? This will erase custom categories and products.')) {
      setProducts(DEFAULT_PRODUCTS);
      localStorage.setItem('acc_products', JSON.stringify(DEFAULT_PRODUCTS));
      setOrders([]);
      localStorage.removeItem('acc_orders');

      if (firestoreDb) {
        DEFAULT_PRODUCTS.forEach(p => dbSaveProduct(p));
      }
    }
  };

  // Cart operations helpers
  const handleAddToCart = (item: OrderItem, customImg?: string) => {
    setCartItems([...cartItems, item]);
    // Save image or empty placeholder line corresponding to the position
    setCustomImages([...customImages, customImg || '']);
    setIsCartOpen(true);
  };

  const handleRemoveCartItem = (index: number) => {
    const nextItems = [...cartItems];
    nextItems.splice(index, 1);
    setCartItems(nextItems);

    const nextImages = [...customImages];
    nextImages.splice(index, 1);
    setCustomImages(nextImages);
  };

  const handleClearCart = () => {
    setCartItems([]);
    setCustomImages([]);
  };

  const scrollToStorefront = () => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const scrollToMenuCategory = (cat: string) => {
    setSelectedCategory(cat);
    if (menuScrollRef.current) {
      menuScrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filter storefront lists
  const displayedProducts = selectedCategory === 'All'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-brown flex flex-col font-sans selection:bg-brand-pink-light selection:text-brand-rose">
      {/* SVG gooey liquid filter def for organic melting and realistic droplets */}
      <svg className="absolute w-0 h-0 pointer-events-none select-none" width="0" height="0" aria-hidden="true">
        <defs>
          <filter id="liquid-wax-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* 1. Universal Top Header bar */}
      <Header
        cartCount={cartItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCustomWizard={() => setIsCustomWizardOpen(true)}
        scrollToStorefront={scrollToStorefront}
        settings={settings}
      />

      {/* Primary body switcher: Customer Front */}
      <main className="flex-grow">
          {/* A. Sweet Boutique Elegant Hero Section */}
          <section className="relative overflow-hidden py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in pb-4">
                
                {/* Hero visual marketing speech */}
                <div className="space-y-6">
                  <div className="inline-flex items-center space-x-2 bg-brand-pink-light border border-brand-pink/35 text-brand-rose rounded-full px-4.5 py-1.5 text-xs font-bold leading-normal mx-auto">
                    <Sparkles className="w-3.5 h-3.5 stroke-[2.5] text-brand-pink animate-spin" />
                    <span>Pure Premium Homemade Delight</span>
                  </div>

                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight text-brand-brown leading-[1.2] py-2">
                    Baked With{' '}
                    <span className="relative inline-block text-brand-rose font-serif font-black px-1.5 group cursor-pointer">
                      Love
                      {/* Interactive floating red hearts with staggered timers */}
                      <span className="absolute left-1/4 -top-1 text-red-500 text-xs select-none pointer-events-none animate-float-h1">❤️</span>
                      <span className="absolute left-2/4 -top-2 text-red-400 text-[9px] select-none pointer-events-none animate-float-h2" style={{ animationDelay: '0.4s' }}>❤️</span>
                      <span className="absolute left-3/4 -top-1 text-rose-500 text-[10px] select-none pointer-events-none animate-float-h3" style={{ animationDelay: '0.9s' }}>❤️</span>
                      <span className="absolute left-1/3 top-0 text-red-600 text-[8px] select-none pointer-events-none animate-float-h4" style={{ animationDelay: '1.5s' }}>❤️</span>
                    </span>{' '}
                    &{' '}
                    <span className="relative inline-flex items-baseline text-brand-pink font-serif font-black italic select-none">
                      <span>C</span>
                      <span>r</span>
                      <span>e</span>
                      <span>a</span>
                      <span>m</span>
                      <span>y</span>
                    </span>{' '}
                    Goodness
                  </h2>

                  <p className="text-sm md:text-base text-brand-brown/85 leading-relaxed font-sans max-w-xl mx-auto">
                     Welcome to <strong>Aiman Creamy Creation</strong>! We specialize in crafting luscious customized birthday cakes, luxurious pastries, and chunky melt-in-mouth cookies. Freshly baked from our studio to light up your celebrations.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => scrollToMenuCategory('All')}
                      id="hero-browse-menu"
                      className="w-full sm:w-auto bg-brand-pink hover:bg-brand-rose text-white font-sans font-bold text-xs py-3.5 px-7 rounded-2xl shadow-md transition-all hover:scale-102 flex items-center justify-center space-x-1.5 cursor-pointer"
                      style={{
                        animation: 'button-wax-glow 16s ease-in-out infinite',
                      }}
                    >
                      <Compass className="w-4 h-4" />
                      <span>Browse Sweet Menu</span>
                    </button>

                    <button
                      onClick={() => setIsCustomWizardOpen(true)}
                      id="hero-custom-designer"
                      className="w-full sm:w-auto bg-white border border-orange-100 hover:bg-brand-pink-light/30 text-brand-brown font-sans font-bold text-xs py-3.5 px-6 rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-brand-pink" />
                      <span>Inspiration Design Quote</span>
                    </button>
                  </div>

                  {/* Highlights credentials line */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-dashed border-orange-200 max-w-md mx-auto select-none">
                    <div className="text-center">
                      <p className="font-serif font-black text-brand-rose text-lg sm:text-xl">100%</p>
                      <p className="text-[10px] text-brand-brown/60 font-sans uppercase font-bold tracking-wider">Eggless Avail</p>
                    </div>
                    <div className="text-center">
                      <p className="font-serif font-black text-brand-rose text-lg sm:text-xl">Premium</p>
                      <p className="text-[10px] text-brand-brown/60 font-sans uppercase font-bold tracking-wider">Ingredients</p>
                    </div>
                    <div className="text-center">
                      <p className="font-serif font-black text-brand-rose text-lg sm:text-xl">Fast</p>
                      <p className="text-[10px] text-brand-brown/60 font-sans uppercase font-bold tracking-wider">WhatsApp Confirm</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* B. Fast Custom Inspiration Cake Highlight card */}
          <section className="bg-brand-pink py-10 text-white shadow-inner select-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4 text-center md:text-left">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white flex-shrink-0 mx-auto md:mx-0">
                  <Sparkles className="w-8 h-8 animate-pulse text-amber-200" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg sm:text-xl">Have a Reference Photo or Custom Idea?</h3>
                  <p className="text-xs text-white/90 font-sans mt-0.5">
                    Upload your customized cartoon, tier cake, or anniversary design & place direct Orders.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomWizardOpen(true)}
                id="banner-design-btn"
                className="w-full md:w-auto bg-brand-brown hover:bg-brand-brown/95 text-white font-sans font-bold text-xs py-3.5 px-6 rounded-xl shadow-md transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
              >
                Launch Custom Cake Wizard →
              </button>
            </div>
          </section>

          {/* C. Restaurant Interactive Menu Explorer */}
          <section ref={menuScrollRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 space-y-12">
            
            {/* Title block */}
            <div className="text-center space-y-3">
              <span className="text-xs uppercase font-extrabold tracking-widest text-brand-rose bg-brand-pink-light px-3.5 py-1.5 rounded-full border border-brand-pink/30">
                Freshly Baked Selection
              </span>
              <h2 className="font-serif font-bold text-brand-brown text-3xl sm:text-4xl">
                Explore Our Gourmet Menu
              </h2>
              <p className="text-xs sm:text-sm text-brand-brown/70 font-sans max-w-xl mx-auto">
                Sort dessert items using categories, and click to configure custom specifications before ordering.
              </p>
            </div>

            {/* Category tabs filters */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {['All', ...CATEGORIES].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`py-2 px-4.5 text-xs sm:text-sm font-sans font-bold rounded-full transition-all duration-300 transform active:scale-95 focus:outline-none ${
                    selectedCategory === category
                      ? 'bg-brand-pink text-white shadow-md'
                      : 'bg-white hover:bg-brand-pink-light/45 text-brand-brown border border-orange-100 shadow-xs'
                  }`}
                >
                  {category === 'All' ? '🌟 All Baked Goods' : category}
                </button>
              ))}
            </div>

            {/* Dishes Listings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onCustomize={(p) => setSelectedProduct(p)}
                />
              ))}

              {displayedProducts.length === 0 && (
                <div className="col-span-full border border-dashed border-orange-200 rounded-3xl p-12 text-center text-brand-brown/50 bg-white">
                  No baked desserts found in this category yet! Try toggling other categories.
                </div>
              )}
            </div>
          </section>

          {/* D. Brand Values Section */}
          <section className="bg-brand-pink-light/35 border-y border-orange-100/50 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="flex items-start space-x-4 bg-white p-6 rounded-2xl border border-orange-50/50 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-brand-pink-light flex items-center justify-center text-brand-rose flex-shrink-0 shadow-xs">
                  <Heart className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-brand-brown text-base">Eggless Preparation</h4>
                  <p className="text-xs text-brand-brown/75 font-sans mt-1">
                    We keep separate premium utensils for eggless batters, ensuring 100% vegetarian cake purity.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start space-x-4 bg-white p-6 rounded-2xl border border-orange-50/50 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0 shadow-xs">
                  <Gift className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-brand-brown text-base">Perfect Gifts & Surprise</h4>
                  <p className="text-xs text-brand-brown/75 font-sans mt-1">
                    Delight friends with custom congratulation notes written in elegant chocolate frosting script.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start space-x-4 bg-white p-6 rounded-2xl border border-orange-50/50 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-brand-pink-light flex items-center justify-center text-brand-rose flex-shrink-0 shadow-xs">
                  <PhoneCall className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-brand-brown text-base">WhatsApp Support Instantly</h4>
                  <p className="text-xs text-brand-brown/75 font-sans mt-1">
                    Your specs route immediately to our chef's phone. No bot calls, talk live to real human chefs.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

      {/* 2. Responsive UI Footer Block */}
      <footer className="bg-brand-brown text-white/90 border-t border-brand-brown/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-[#5e4b41]">
            {/* Brand column */}
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-brand-pink text-lg">Aiman Creamy Creation</h3>
              <p className="text-xs text-white/70 leading-relaxed font-sans max-w-sm">
                Bespoke home-baker crafting elegant designer cakes, cookies, and sweet pastry treats. Delivering gorgeous custom designs to complete your memorable parties.
              </p>
              {settings.isOpen ? (
                <div className="flex items-center space-x-2 text-xs font-bold text-green-300 font-sans">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-ping" />
                  <span>We are open & accepting orders online</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-xs font-bold text-brand-rose font-sans">
                  <span className="h-2 w-2 rounded-full bg-brand-rose" />
                  <span>Closed & Paused for fresh bake bookings</span>
                </div>
              )}
            </div>

            {/* Contacts info */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-white text-base">Order Helpline & Timings</h4>
              <p className="text-xs text-white/70 font-sans">📞 Mobile Support: <strong className="text-brand-pink">{settings.supportPhone}</strong></p>
              <p className="text-xs text-white/70 font-sans">📍 Studio Setup: <strong>{settings.studioAddress}</strong></p>
              <p className="text-xs text-white/70 font-sans">⏰ Delivery Slots: <strong>10:00 AM - 10:00 PM (Daily)</strong></p>
              
              {/* Footer Social Badges */}
              <div className="flex items-center gap-2 pt-2">
                <a
                  href={`https://wa.me/${settings.whatsappNumber?.replace(/\D/g, '') || '919319812658'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat with Aiman Creamy Creation on WhatsApp"
                  className="p-2.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded-full border border-emerald-500/20 flex items-center justify-center transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4 fill-current text-green-400" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.263 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.859-4.42 9.863-9.864.002-2.637-1.023-5.115-2.883-6.979C16.588 1.9 14.113.882 11.48.882c-5.441 0-9.864 4.42-9.868 9.865-.001 1.76.46 3.479 1.336 4.992l-1.012 3.701 3.794-.995h.005h.011zm11.238-6.196c-.3-.15-1.772-.875-2.046-.975-.276-.1-.477-.15-.677.15-.2.3-.775.975-.95 1.175-.177.2-.35.225-.65.075-1.205-.6-2.08-1.125-2.812-2.375-.19-.325-.013-.5.14-.7-.15-.225-.3-.6-.375-.775-.1-.25-.15-.425-.075-.575.075-.15.375-.525.525-.75.15-.225.2-.375.3-.575.1-.2-.05-.375-.125-.525-.075-.15-.675-1.625-.925-2.225-.244-.588-.491-.508-.675-.518-.174-.009-.374-.01-.574-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.225 5.112 4.525.715.31 1.273.495 1.71.635.717.228 1.37.195 1.885.118.574-.085 1.771-.725 2.021-1.425.25-.7.25-1.3.175-1.425-.075-.125-.275-.2-.575-.35z" />
                  </svg>
                </a>
                
                <a
                  href={settings.instagramUrl || 'https://www.instagram.com/aiman_creamy_creation/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Aiman Creamy Creation on Instagram"
                  className="p-2.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-full border border-rose-500/20 flex items-center justify-center transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4 fill-current text-rose-400" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick order shortcuts */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-white text-base">Quick Shortcuts</h4>
              <div className="flex flex-col space-y-2 text-xs text-white/70 font-bold font-sans">
                <button onClick={() => scrollToMenuCategory('Cakes')} className="hover:text-brand-pink text-left cursor-pointer transition-colors">🎂 Designer Cakes</button>
                <button onClick={() => scrollToMenuCategory('Pastries')} className="hover:text-brand-pink text-left cursor-pointer transition-colors">🍓 French Pastries</button>
                <button onClick={() => scrollToMenuCategory('Cookies')} className="hover:text-brand-pink text-left cursor-pointer transition-colors">🍪 Bakery Cookies</button>
                <button onClick={() => setIsCustomWizardOpen(true)} className="hover:text-brand-pink text-left cursor-pointer transition-colors">✨ Inspired Cake Reference Upload</button>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col items-center justify-center text-center text-[10px] text-white/45 font-semibold font-mono space-y-1">
            <p className="uppercase tracking-wider">website created and design by Henriey Technologies</p>
            <p className="text-white/35">© 2026 aiman creamy creations</p>
          </div>
        </div>
      </footer>

      {/* 3. Sliding Shopping Basket Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        customImages={customImages}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onPlaceOrder={handlePlaceOrder}
        settings={settings}
      />

      {/* 4. Item Customization detailed Configuration dialogue */}
      {selectedProduct && (
        <CustomizationModal
          product={selectedProduct}
          isOpen={selectedProduct !== null}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* 5. Upload Custom References Design Wizard */}
      <CustomCakeWizard
        isOpen={isCustomWizardOpen}
        onClose={() => setIsCustomWizardOpen(false)}
        onAddToCart={handleAddToCart}
        settings={settings}
      />
    </div>
  );
}
