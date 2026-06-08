import React from 'react';
import { ShoppingBag, ShieldAlert, Sparkles, LogOut, Cake } from 'lucide-react';
import { ShopSettings } from '../types';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenCustomWizard: () => void;
  scrollToStorefront: () => void;
  settings?: ShopSettings;
}

export default function Header({
  cartCount,
  onOpenCart,
  onOpenCustomWizard,
  scrollToStorefront,
  settings
}: HeaderProps) {
  const sanitizedWhatsapp = settings?.whatsappNumber?.replace(/\D/g, '') || '919319812658';
  const instagramUrl = settings?.instagramUrl || 'https://www.instagram.com/aiman_creamy_creation/';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100/50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Branding */}
        <div 
          onClick={scrollToStorefront} 
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 bg-brand-pink rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform duration-300">
            A
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-brand-rose flex items-center gap-1.5">
              <span>Aiman</span> <span className="text-brand-pink font-semibold">Creamy Creation</span>
            </h1>
            <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-brand-brown/60">
              Gourmet Bakery & Custom Cakes
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {/* Social Links */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 mr-0.5 sm:mr-1">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/${sanitizedWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with Aiman Creamy Creation on WhatsApp"
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100/85 text-emerald-600 rounded-full border border-emerald-100 flex items-center justify-center transition-all duration-300 hover:scale-[1.04] active:scale-95 shadow-xs"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.263 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.859-4.42 9.863-9.864.002-2.637-1.023-5.115-2.883-6.979C16.588 1.9 14.113.882 11.48.882c-5.441 0-9.864 4.42-9.868 9.865-.001 1.76.46 3.479 1.336 4.992l-1.012 3.701 3.794-.995h.005h.011zm11.238-6.196c-.3-.15-1.772-.875-2.046-.975-.276-.1-.477-.15-.677.15-.2.3-.775.975-.95 1.175-.177.2-.35.225-.65.075-1.205-.6-2.08-1.125-2.812-2.375-.19-.325-.013-.5.14-.7-.15-.225-.3-.6-.375-.775-.1-.25-.15-.425-.075-.575.075-.15.375-.525.525-.75.15-.225.2-.375.3-.575.1-.2-.05-.375-.125-.525-.075-.15-.675-1.625-.925-2.225-.244-.588-.491-.508-.675-.518-.174-.009-.374-.01-.574-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.225 5.112 4.525.715.31 1.273.495 1.71.635.717.228 1.37.195 1.885.118.574-.085 1.771-.725 2.021-1.425.25-.7.25-1.3.175-1.425-.075-.125-.275-.2-.575-.35z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Aiman Creamy Creation on Instagram"
              className="p-2.5 bg-rose-50 hover:bg-rose-100/85 text-rose-600 rounded-full border border-rose-100 flex items-center justify-center transition-all duration-300 hover:scale-[1.04] active:scale-95 shadow-xs"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>

          <button
            onClick={onOpenCustomWizard}
            id="custom-design-btn"
            className="flex items-center space-x-2 bg-brand-pink text-white font-sans font-bold text-xs py-2.5 px-4 rounded-full shadow-md hover:bg-brand-rose transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
            <span className="hidden sm:inline">Customize Your Cake</span>
            <span className="sm:hidden">Customize</span>
          </button>

          {/* Cart Icon Button */}
          <button
            onClick={onOpenCart}
            id="cart-drawer-trigger"
            className="relative p-3 bg-brand-pink-light hover:bg-[#ffe5e9] text-brand-rose rounded-full border border-orange-100 shadow-xs transition-all duration-300 group focus:outline-none"
          >
            <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-rose text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
