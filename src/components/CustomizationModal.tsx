import React, { useState, useEffect } from 'react';
import { X, Check, ShoppingCart, Sparkles, Heart } from 'lucide-react';
import { Product, OrderItem } from '../types';

interface CustomizationModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: OrderItem) => void;
}

export default function CustomizationModal({
  product,
  isOpen,
  onClose,
  onAddToCart
}: CustomizationModalProps) {
  const isCake = product.category.toLowerCase() === 'cakes';
  
  // State variables for dynamic configurations
  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb');
  const [weight, setWeight] = useState<number>(1);
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [eggless, setEggless] = useState<boolean>(true);
  const [quantity, setQuantity] = useState<number>(1);

  // Reset states when modal gets a new product
  useEffect(() => {
    setWeightUnit('lb');
    setWeight(1);
    setSelectedFlavor(product.flavors[0] || 'Original');
    setMessage('');
    setEggless(true);
    setQuantity(1);
  }, [product, isCake]);

  if (!isOpen) return null;

  // Calculates live preview pricing based on weight unit
  const weightKey = `${weight}${weightUnit}`;
  const customWeightPrice = product.weightPrices?.[weightKey];
  
  let basePriceForSelectedWeight = 0;
  if (customWeightPrice !== undefined && customWeightPrice > 0) {
    basePriceForSelectedWeight = customWeightPrice;
  } else {
    const activeRate = weightUnit === 'lb' 
      ? product.pricePerPound 
      : (product.pricePerKg ?? product.pricePerPound * 2);
    basePriceForSelectedWeight = activeRate * weight;
  }
  const calculatedPrice = basePriceForSelectedWeight * quantity;

  const formatWeightName = (w: number, unit: 'lb' | 'kg') => {
    if (unit === 'kg') {
      if (w === 0.25) return '250g';
      if (w === 0.5) return '500g';
      if (w === 0.75) return '750g';
      return `${w} Kg`;
    }
    return `${w} Lb`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddToCart({
      productId: product.id,
      productName: isCake ? `${product.name} (${formatWeightName(weight, weightUnit)})` : product.name,
      category: product.category,
      quantity,
      pound: isCake ? (weightUnit === 'lb' ? weight : weight * 2) : 1,
      weightUnit: isCake ? weightUnit : 'lb',
      flavor: selectedFlavor,
      messageOnCake: isCake && message.trim() ? message.trim() : undefined,
      eggless,
      price: calculatedPrice
    });
    onClose();
  };

  const lbSelections = [1, 1.5, 2, 3, 5];
  const kgSelections = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];

  return (
    <div id="customize-modal-backdrop" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-brand-brown/40 backdrop-blur-xs animate-fade-in">
      <div 
        id="customize-modal-card" 
        className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-orange-100/60 flex flex-col max-h-[90vh]"
      >
        {/* Header Block with banner image preview */}
        <div className="relative h-44 bg-brand-pink-light overflow-hidden">
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-brand-pink-light" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-brown/70 to-transparent" />
          
          {/* Close button indicator */}
          <button 
            type="button" 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/30 hover:bg-white/55 text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 text-white pr-6">
            <h2 className="font-serif font-black text-xl leading-tight">{product.name}</h2>
            <p className="text-xs text-white/80 font-sans mt-0.5 line-clamp-1">{product.description}</p>
          </div>
        </div>

        {/* Customizer Panel Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-grow space-y-5">
          {/* 1. Pound/Weight Selection (ONLY for Cakes) */}
          {isCake && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-brand-brown/60 uppercase tracking-widest">
                  Choose Cake Weight
                </label>
                {/* Unit Switcher */}
                <div className="flex bg-orange-100/60 p-1 rounded-lg text-center select-none cursor-pointer">
                  <span 
                    onClick={() => {
                      setWeightUnit('lb');
                      setWeight(1);
                    }}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition-all ${weightUnit === 'lb' ? 'bg-brand-pink text-white' : 'text-brand-brown/60'}`}
                  >
                    Lb (Pound)
                  </span>
                  <span 
                    onClick={() => {
                      setWeightUnit('kg');
                      setWeight(0.5); // Default to 500g (0.5 kg)
                    }}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition-all ${weightUnit === 'kg' ? 'bg-brand-pink text-white' : 'text-brand-brown/60'}`}
                  >
                    Kg (Kilo)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {(weightUnit === 'lb' ? lbSelections : kgSelections).map((w) => {
                  const wKey = `${w}${weightUnit}`;
                  const customPrice = product.weightPrices?.[wKey];
                  const displayPrice = customPrice !== undefined && customPrice > 0
                    ? customPrice
                    : (weightUnit === 'lb' 
                        ? product.pricePerPound * w 
                        : (product.pricePerKg ?? product.pricePerPound * 2) * w);

                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWeight(w)}
                      className={`py-2 px-1 text-center rounded-xl border flex flex-col items-center justify-center transition-all duration-200 focus:outline-none ${
                        weight === w
                          ? 'bg-brand-pink border-brand-pink text-white shadow-xs'
                          : 'bg-white hover:bg-brand-pink-light/35 text-brand-brown border-orange-100/70'
                      }`}
                    >
                      <span className="text-xs font-sans font-extrabold leading-tight">
                        {w === 0.25 ? '250g' : w === 0.5 ? '500g' : w === 0.75 ? '750g' : `${w} ${weightUnit}`}
                      </span>
                      <span className={`text-[9px] font-bold mt-0.5 leading-none ${weight === w ? 'text-white/90' : 'text-brand-rose'}`}>
                        ₹{displayPrice}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-brand-brown/40 mt-2 font-medium italic">
                * Note: Standard rates are ₹{weightUnit === 'lb' ? product.pricePerPound : (product.pricePerKg ?? product.pricePerPound * 2)} per {weightUnit === 'lb' ? 'Pound' : 'Kg'}. You can set special customized pack sizes!
              </p>
            </div>
          )}

          {/* 2. Flavor Selection */}
          <div>
            <label className="block text-xs font-bold text-brand-brown/60 uppercase tracking-widest mb-2">
              Select Favorite Flavor
            </label>
            <div className="grid grid-cols-2 gap-2">
              {product.flavors.map((flavor) => (
                <button
                  key={flavor}
                  type="button"
                  onClick={() => setSelectedFlavor(flavor)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs font-sans font-semibold transition-all duration-200 focus:outline-none ${
                    selectedFlavor === flavor
                      ? 'bg-brand-pink-light border-brand-pink/50 text-brand-rose'
                      : 'bg-white hover:bg-orange-50/20 text-brand-brown/85 border-orange-100/70'
                  }`}
                >
                  <span className="truncate">{flavor}</span>
                  {selectedFlavor === flavor && (
                    <Check className="w-3.5 h-3.5 text-brand-rose flex-shrink-0 ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Written Message (ONLY for Cakes) */}
          {isCake && (
            <div>
              <label htmlFor="modal-custom-message" className="block text-xs font-bold text-brand-brown/60 uppercase tracking-widest mb-2">
                Message Written On Cake (Icing Text)
              </label>
              <input
                type="text"
                id="modal-custom-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={45}
                placeholder="e.g. Happy 10th Birthday Sameer! (Max 45 chars)"
                className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-sm font-sans text-brand-brown"
              />
            </div>
          )}

          {/* 4. Dietary Toggle Option (Egg vs Eggless) */}
          <div className="bg-brand-pink-light/30 p-4 rounded-2xl flex items-center justify-between border border-orange-100/40">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-full ${eggless ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div>
                <p className="text-xs font-bold text-brand-brown">Eggless Preparation?</p>
                <p className="text-[10px] text-brand-brown/50">Baked in dedicated pure vegetarian setups.</p>
              </div>
            </div>
            <div className="flex bg-orange-100/65 p-1 rounded-full w-28 text-center select-none cursor-pointer relative">
              <div 
                className={`absolute inset-y-1 rounded-full bg-white shadow-xs w-[44%] transition-all duration-300 ${
                  eggless ? 'left-1' : 'left-[51%]'
                }`}
              />
              <span 
                onClick={() => setEggless(true)}
                className={`w-1/2 text-[10px] font-bold z-10 py-1 transition-colors ${eggless ? 'text-emerald-700' : 'text-brand-brown/60'}`}
              >
                Yes
              </span>
              <span 
                onClick={() => setEggless(false)}
                className={`w-1/2 text-[10px] font-bold z-10 py-1 transition-colors ${!eggless ? 'text-brand-rose' : 'text-brand-brown/60'}`}
              >
                No
              </span>
            </div>
          </div>

          {/* 5. Quantity Slider / Controller */}
          <div className="flex justify-between items-center bg-brand-pink-light/50 p-4 rounded-2xl border border-orange-100/50">
            <span className="text-xs font-bold text-brand-brown/60 uppercase tracking-widest">Quantity:</span>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full bg-white hover:bg-brand-pink-light flex items-center justify-center text-brand-rose font-bold border border-orange-100/60 shadow-xs"
              >
                -
              </button>
              <span className="font-bold font-mono text-base text-brand-brown w-6 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-full bg-white hover:bg-brand-pink-light flex items-center justify-center text-brand-rose font-bold border border-orange-100/60 shadow-xs"
              >
                +
              </button>
            </div>
          </div>

          {/* Bottom Action Pane */}
          <div className="pt-4 border-t border-orange-100/50 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-brand-brown/50 uppercase">Estimated Price:</p>
              <p className="text-2xl font-serif font-black text-brand-rose">₹{calculatedPrice}</p>
            </div>
            <button
              type="submit"
              id="submit-customization-btn"
              className="flex items-center space-x-2 bg-brand-pink hover:bg-brand-rose text-white font-sans font-bold text-sm py-3 px-6 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-white/90" />
              <span>Add to Basket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
