import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Product, Order, ShopSettings } from './types';
import { DEFAULT_PRODUCTS } from './data';
import AdminPanel from './components/AdminPanel';
import { ArrowLeft, Cake, Sparkles } from 'lucide-react';
import './index.css';
import { 
  firestoreDb, 
  collection, 
  doc, 
  onSnapshot, 
  dbSaveProduct, 
  dbDeleteProduct, 
  dbSaveSettings, 
  dbSaveOrder,
  handleFirestoreError,
  OperationType
} from './firebase';

function AdminRoot() {
  // Synchronized state handlers matching localStorage schema
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
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
        // Fallback
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

  useEffect(() => {
    // Initial fetch of variables
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

    // Live subscription to Firebase Firestore
    if (firestoreDb) {
      const unsubProducts = onSnapshot(collection(firestoreDb, "products"), (snapshot) => {
        const prods: Product[] = [];
        snapshot.forEach((doc) => {
          prods.push({ id: doc.id, ...doc.data() } as Product);
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
        snapshot.forEach((doc) => {
          ords.push({ id: doc.id, ...doc.data() } as Order);
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
    dbDeleteProduct(id);
  };

  const handleEditProduct = (updatedProduct: Product) => {
    const updated = products.map((p) => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updated);
    localStorage.setItem('acc_products', JSON.stringify(updated));
    dbSaveProduct(updatedProduct);
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

  const handleUpdateSettings = (updated: ShopSettings) => {
    setSettings(updated);
    localStorage.setItem('acc_settings', JSON.stringify(updated));
    dbSaveSettings(updated);
  };

  const handleResetDatabase = () => {
    if (confirm('Are you absolutely sure you want to reset all menus to the factory default list? This will erase custom categories and products.')) {
      setProducts(DEFAULT_PRODUCTS);
      localStorage.setItem('acc_products', JSON.stringify(DEFAULT_PRODUCTS));
      setOrders([]);
      localStorage.removeItem('acc_orders');
      
      // Clean Firestore records
      if (firestoreDb) {
        DEFAULT_PRODUCTS.forEach(p => dbSaveProduct(p));
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-brown font-sans flex flex-col selection:bg-brand-pink-light selection:text-brand-rose">
      {/* Admin Top Dashboard Bar */}
      <header className="bg-white border-b border-orange-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-brown rounded-full flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <div>
              <h1 className="text-lg font-serif font-black text-brand-rose flex items-center gap-1.5">
                <span>Aiman Creamy Creation</span>
                <span className="bg-brand-rose/10 text-brand-rose text-[9px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin Control Setup
                </span>
              </h1>
              <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#a88a79]">
                Private Security Administration panel
              </p>
            </div>
          </div>

          <a
            href="/"
            className="flex items-center space-x-1.5 px-4 py-2 bg-brand-pink-light/30 hover:bg-brand-pink-light/60 text-brand-rose rounded-full text-xs font-bold font-sans transition-all group cursor-pointer border border-brand-pink/15"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return Storefront</span>
          </a>
        </div>
      </header>

      {/* Primary Workspace Viewport */}
      <main className="flex-grow py-4">
        <AdminPanel
          products={products}
          orders={orders}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
          onEditProduct={handleEditProduct}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onResetDatabase={handleResetDatabase}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />
      </main>

      {/* Simple Footer Brand Signatures */}
      <footer className="bg-stone-900 text-stone-500 py-6 border-t border-stone-800 text-center font-mono text-[9px]">
        <p className="uppercase tracking-wider">website created and design by Henriey Technologies</p>
        <p className="mt-1">© 2026 aiman creamy creations • Secure Session Console</p>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminRoot />
  </StrictMode>
);
