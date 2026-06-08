import React, { useState, useRef } from 'react';
import { Upload, X, Sparkles, Check, Info, FileImage } from 'lucide-react';
import { OrderItem, ShopSettings } from '../types';
import { FLAVORS } from '../data';

interface CustomCakeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: OrderItem, customImage?: string) => void;
  settings?: ShopSettings;
}

export default function CustomCakeWizard({
  isOpen,
  onClose,
  onAddToCart,
  settings
}: CustomCakeWizardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom design states
  const [flavor, setFlavor] = useState<string>(FLAVORS[0]);
  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb');
  const [weight, setWeight] = useState<number>(2); // Custom designs often start at 2lb / 1kg min
  const [message, setMessage] = useState<string>('');
  const [eggless, setEggless] = useState<boolean>(true);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);

  if (!isOpen) return null;

  // File to base64 conversion for persistent localStorage storage
  const handleImageUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setPreviewImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewImage) {
      alert('Please upload a cake design reference photo first!');
      return;
    }

    // Custom designer cakes have base tier prices configured dynamically from Admin Settings (lb vs kg)
    const baseRate = weightUnit === 'lb' 
      ? (settings?.customCakePricePerLb ?? 750) 
      : (settings?.customCakePricePerKg ?? 1500);
    const estimateBasePrice = baseRate * weight;

    onAddToCart({
      productName: `Custom Designer Cake (${weight} ${weightUnit.toUpperCase()})`,
      category: 'Cakes', // Custom is a Cake tier
      quantity: 1,
      pound: weightUnit === 'lb' ? weight : weight * 2, // Represent equivalent Lb internally
      flavor,
      messageOnCake: message.trim() ? message.trim() : undefined,
      customInstructions: notes.trim() ? notes.trim() : undefined,
      eggless,
      price: estimateBasePrice
    }, previewImage);

    // Reset wizard
    setFlavor(FLAVORS[0]);
    setWeightUnit('lb');
    setWeight(2);
    setMessage('');
    setEggless(true);
    setPreviewImage('');
    setNotes('');
    onClose();
  };

  return (
    <div id="wizard-modal-backdrop" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-brand-brown/40 backdrop-blur-xs animate-fade-in">
      <div 
        id="wizard-modal-card" 
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-orange-100 flex flex-col max-h-[95vh]"
      >
        {/* Banner with spark overlay */}
        <div className="bg-brand-pink p-6 text-white relative">
          <button 
            type="button" 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <Sparkles className="w-7 h-7 text-amber-200 animate-pulse" />
            <div>
              <h2 className="font-serif font-bold text-2xl leading-tight">Design Your Dream Cake</h2>
              <p className="text-xs text-white/95 font-sans mt-0.5">
                Upload your custom design inspiration picture and configure your requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Wizard Form Workspace */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Image Reference Upload */}
          <div className="flex flex-col space-y-4">
            <label className="block text-xs font-bold text-brand-brown/60 uppercase tracking-widest">
              Reference Photo Upload (Required)
            </label>

            {previewImage ? (
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-brand-pink/50 bg-brand-bg self-stretch flex items-center justify-center">
                <img 
                  src={previewImage} 
                  alt="Custom Cake Reference" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 p-2 bg-brand-rose hover:bg-brand-rose/90 text-white rounded-full shadow-md hover:scale-105 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-grow aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 ${
                  dragActive 
                    ? 'border-brand-pink bg-brand-pink-light/70 text-brand-rose' 
                    : 'border-orange-100 hover:border-brand-pink bg-brand-pink-light/10 hover:bg-brand-pink-light/30 text-brand-brown/60'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div className="w-14 h-14 rounded-full bg-brand-pink-light flex items-center justify-center text-brand-rose mb-4 shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-sm font-sans font-bold">Drag and drop your cake image reference</p>
                <p className="text-xs text-brand-brown/50 font-sans mt-1">or click to browse from device photos</p>
                <div className="mt-4 flex items-center space-x-1 justify-center bg-brand-pink-light/60 text-brand-rose px-3 py-1.5 rounded-full text-[10px]">
                  <FileImage className="w-3.5 h-3.5 text-brand-rose" />
                  <span>Supports PNG, JPG (base64 storage)</span>
                </div>
              </div>
            )}
            
            <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 flex space-x-2.5 items-start">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-stone-600 leading-relaxed font-sans">
                <strong>Pricing Guideline:</strong> Base customized cake designs start at ~₹{settings?.customCakePricePerLb ?? 750}/pound. Theme elements, fondant figures, toy toppers, or heavy architecture will be priced & discussed with you on WhatsApp.
              </p>
            </div>
          </div>

          {/* Column 2: Specs & Details */}
          <div className="flex flex-col space-y-4">
            {/* 1. Weight / Pound and Kg */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-brand-brown/60 uppercase tracking-widest md:tracking-wider">
                  Estimate Weight
                </label>
                {/* Unit Toggle Buttons */}
                <div className="flex bg-orange-100/60 p-1 rounded-lg text-center select-none cursor-pointer">
                  <span 
                    onClick={() => {
                      setWeightUnit('lb');
                      setWeight(1.5);
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

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 text-center font-sans font-bold text-xs select-none">
                {weightUnit === 'lb' 
                  ? [1, 1.5, 2, 3, 5, 8].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setWeight(w)}
                        className={`py-2 text-[10px] font-sans font-bold rounded-lg border transition-all ${
                          weight === w
                            ? 'bg-brand-pink border-brand-pink text-white shadow-xs animate-pulse-once'
                            : 'bg-white hover:bg-brand-pink-light text-brand-brown border-orange-100'
                        }`}
                      >
                        {w} lb
                      </button>
                    ))
                  : [0.25, 0.5, 0.75, 1, 1.5, 2, 3].map((w) => {
                      const displayLabel = w === 0.25 ? '250g' : w === 0.5 ? '500g' : w === 0.75 ? '750g' : `${w} Kg`;
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setWeight(w)}
                          className={`py-2 text-[10px] font-sans font-bold rounded-lg border transition-all ${
                            weight === w
                              ? 'bg-brand-pink border-brand-pink text-white shadow-xs animate-pulse-once'
                              : 'bg-white hover:bg-brand-pink-light text-brand-brown border-orange-100'
                          }`}
                        >
                          {displayLabel}
                        </button>
                      );
                    })
                }
              </div>
              <p className="text-[10px] text-brand-brown/40 mt-1.5 italic">
                * Note: Minimum customized weight starting at {weightUnit === 'lb' ? '1 lb' : '250g (0.25 kg)'}. Rate: ₹{weightUnit === 'lb' ? (settings?.customCakePricePerLb ?? 750) : (settings?.customCakePricePerKg ?? 1500)} per {weightUnit === 'lb' ? 'Pound' : 'Kg'}.
              </p>
            </div>

            {/* 2. Flavor */}
            <div>
              <label htmlFor="wizard-flavor-select" className="block text-xs font-bold text-brand-brown/60 uppercase tracking-widest mb-2">
                Preferred Frosting Flavor
              </label>
              <select
                id="wizard-flavor-select"
                value={flavor}
                onChange={(e) => setFlavor(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-orange-100 bg-white focus:border-brand-pink focus:outline-none text-xs font-sans font-semibold text-brand-brown"
              >
                {FLAVORS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Written Message */}
            <div>
              <label htmlFor="wizard-custom-msg" className="block text-xs font-bold text-brand-brown/60 uppercase tracking-widest mb-2">
                Message Written On Cake (Icing Text)
              </label>
              <input
                type="text"
                id="wizard-custom-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={45}
                placeholder="e.g. Happy Birthday Di! (Max 45 chars)"
                className="w-full px-4 py-2.5 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans text-brand-brown"
              />
            </div>

            {/* 4. Vegetarian / Eggless Toggle */}
            <div className="bg-brand-pink-light/30 p-3.5 rounded-xl flex items-center justify-between border border-orange-100/40">
              <div>
                <p className="text-xs font-bold text-brand-brown">Vegan/Eggless Cake?</p>
                <p className="text-[9px] text-brand-brown/50 font-sans">Pure vegetarian recipe</p>
              </div>
              <div className="flex bg-orange-100/60 p-1 rounded-full w-24 text-center select-none cursor-pointer relative">
                <div 
                  className={`absolute inset-y-1 rounded-full bg-white shadow-xs w-[44%] transition-all duration-300 ${
                    eggless ? 'left-1' : 'left-[51%]'
                  }`}
                />
                <span 
                  onClick={() => setEggless(true)}
                  className={`w-1/2 text-[9px] font-bold z-10 py-1 transition-colors ${eggless ? 'text-emerald-700' : 'text-brand-brown/60'}`}
                >
                  Yes
                </span>
                <span 
                  onClick={() => setEggless(false)}
                  className={`w-1/2 text-[9px] font-bold z-10 py-1 transition-colors ${!eggless ? 'text-brand-rose' : 'text-brand-brown/60'}`}
                >
                  No
                </span>
              </div>
            </div>

            {/* 5. Creator Specification Notes */}
            <div>
              <label htmlFor="wizard-custom-notes" className="block text-xs font-bold text-brand-brown/60 uppercase tracking-widest mb-2">
                Detailed Custom Instructions
              </label>
              <textarea
                id="wizard-custom-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Examples: Add gold flakes, chocolate drip, double-tiered cake, pastel pink decorations..."
                className="w-full px-4 py-2 rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-xs font-sans text-brand-brown resize-none"
              />
            </div>

            {/* Price Preview Estimation */}
            <div className="pt-4 border-t border-orange-100 flex items-center justify-between bg-brand-pink-light/20 -mx-4 -mb-4 px-4 py-3 rounded-b-2xl mt-auto">
              <div>
                <p className="text-[10px] font-bold text-brand-brown/50 uppercase leading-none">Min Base Estimate:</p>
                <p className="text-xl font-serif font-black text-brand-rose">
                  ₹{weightUnit === 'lb' 
                    ? (settings?.customCakePricePerLb ?? 750) * weight 
                    : (settings?.customCakePricePerKg ?? 1500) * weight}
                </p>
              </div>
              <button
                type="submit"
                id="wizard-submit-btn"
                className="flex items-center space-x-1.5 bg-brand-pink hover:bg-brand-rose text-white font-sans font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-white/90" />
                <span>Add Custom Design</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
