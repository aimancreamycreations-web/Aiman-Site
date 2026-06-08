import React from 'react';
import { Star, Sparkles, Check, Cake } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onCustomize: (product: Product) => void;
  key?: string;
}

export default function ProductCard({ product, onCustomize }: ProductCardProps) {
  const isCake = product.category.toLowerCase() === 'cakes';

  return (
    <div 
      id={`product-card-${product.id}`}
      className="bg-white rounded-3xl overflow-hidden border border-orange-100/50 shadow-md hover:shadow-xl hover:shadow-orange-100/40 transition-all duration-300 group flex flex-col h-full"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-square w-full bg-brand-pink-light/30 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-pink/55">
            <Cake className="w-16 h-16 stroke-[1.2]" />
          </div>
        )}
        
        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          <span className="bg-brand-pink text-white font-sans text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
            {product.category}
          </span>
          {product.popular && (
            <span className="bg-brand-rose text-white font-sans text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm flex items-center space-x-1">
              <Star className="w-3 h-3 fill-current" />
              <span>Best Seller</span>
            </span>
          )}
        </div>
      </div>

      {/* Product Info Block */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Name and Rating */}
        <div className="flex justify-between items-start space-x-2">
          <h3 className="font-serif font-black text-brand-brown text-lg group-hover:text-brand-rose transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Description */}
        <p className="mt-2 text-xs font-sans text-brand-brown/70 leading-relaxed line-clamp-3">
          {product.description}
        </p>

        {/* Available Flavors preview */}
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wider font-bold text-brand-brown/50">Available Flavors:</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {product.flavors.slice(0, 3).map((flavor, idx) => (
              <span 
                key={idx} 
                className="bg-brand-pink-light/60 border border-brand-pink-light text-brand-rose font-mono text-[9px] px-2 py-0.5 rounded-md"
              >
                {flavor}
              </span>
            ))}
            {product.flavors.length > 3 && (
              <span className="bg-brand-pink-light text-brand-rose font-mono text-[9px] px-2 py-0.5 rounded-md font-bold">
                +{product.flavors.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Pricing tag and Customize Action Button */}
        <div className="mt-auto pt-6 border-t border-dashed border-orange-100 flex items-center justify-between">
          <div>
            {isCake ? (
              <div className="space-y-0.5 select-none text-[11px] font-sans">
                <div className="flex items-baseline space-x-1">
                  <span className="text-[9px] uppercase font-bold text-brand-brown/55">250g:</span>
                  <span className="font-serif font-extrabold text-stone-700">
                    ₹{product.weightPrices?.['0.25kg'] ?? Math.round((product.pricePerKg ?? product.pricePerPound * 2) * 0.25)}
                  </span>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-[9px] uppercase font-bold text-brand-brown/55">500g:</span>
                  <span className="font-serif font-extrabold text-brand-rose">
                    ₹{product.weightPrices?.['0.5kg'] ?? Math.round((product.pricePerKg ?? product.pricePerPound * 2) * 0.5)}
                  </span>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-[9px] uppercase font-bold text-brand-brown/55">1 Kg:</span>
                  <span className="text-xs font-serif font-extrabold text-amber-700">
                    ₹{product.weightPrices?.['1kg'] ?? (product.pricePerKg ?? product.pricePerPound * 2)}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-brown/50">
                  Price Per Piece
                </p>
                <p className="text-lg font-serif font-bold text-brand-rose">
                  ₹{product.pricePerPound}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => onCustomize(product)}
            id={`customize-trigger-${product.id}`}
            className="flex items-center space-x-1.5 bg-brand-pink hover:bg-brand-rose text-white font-sans font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all group-hover:-translate-y-0.5 cursor-pointer"
          >
            {isCake ? (
              <>
                <Cake className="w-3.5 h-3.5" />
                <span>Order Now</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Order Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
