import React, { useState } from 'react';
import { X, ShoppingBag, Trash2, Calendar, Clock, MapPin, Phone, User, Notebook, ArrowRight, ShieldCheck } from 'lucide-react';
import { OrderItem, Order, ShopSettings } from '../types';
import PaymentGatewayModal from './PaymentGatewayModal';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: OrderItem[];
  customImages: string[]; // Corresponding Base64 reference images for custom orders
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onPlaceOrder: (order: Order) => void;
  onViewOrders?: () => void;
  settings?: ShopSettings;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  customImages,
  onRemoveItem,
  onClearCart,
  onPlaceOrder,
  onViewOrders,
  settings
}: CartDrawerProps) {
  // Delivery State Info
  const [customerName, setCustomerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  
  // Defaults to tomorrow since custom bakers need notice
  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  const [deliveryDate, setDeliveryDate] = useState<string>(getTomorrowString());
  const [deliveryTime, setDeliveryTime] = useState<string>('04:00 PM - 06:00 PM');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Secure checkout selections
  const [paymentMethodChoice, setPaymentMethodChoice] = useState<'COD' | 'Online'>('COD');
  const [isPaymentGatewayOpen, setIsPaymentGatewayOpen] = useState<boolean>(false);

  // Track success order state to show the beautiful confirmation overlay animation
  const [successOrder, setSuccessOrder] = useState<{ id: string; price: number; paymentMethod: string; paymentStatus: string } | null>(null);

  const getSelectedDateStatus = () => {
    if (!settings || !settings.blockedDates) return null;
    return settings.blockedDates.find((item) => item.date === deliveryDate);
  };

  // Custom helper close drawer handler to wipe success order screen upon exiting
  const handleCloseDrawer = () => {
    setSuccessOrder(null);
    onClose();
  };

  // Default shop WhatsApp Phone (Aiman Creamy Creation Owner number)
  // Owner can configure this, let's suggest +91 93198 12658 or similar, or promptable
  const SHOP_PHONE = '919319812658'; // Standard Indian layout without +

  if (!isOpen) return null;

  const totalBill = cartItems.reduce((acc, item) => acc + item.price, 0);

  // Unified callback to execute placing of order inside localStorage without redirects
  const executeOrderPlacement = (method: 'COD' | 'UPI' | 'Card', paymentStatus: 'Pending' | 'Paid', transactionId?: string) => {
    setIsSubmitting(true);

    const orderId = 'ACC-' + Math.floor(100000 + Math.random() * 900000);
    const newOrder: Order = {
      id: orderId,
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      deliveryDate,
      deliveryTime,
      items: [...cartItems],
      totalPrice: totalBill,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      notes: notes.trim() ? notes.trim() : undefined,
      isCustomOrder: cartItems.some(i => i.productName.toLowerCase().includes('custom')),
      customDesignImage: customImages.find(img => !!img) || undefined, // Find first non-empty custom reference across all checkout items
      paymentMethod: method,
      paymentStatus: paymentStatus
    };

    // Save order in client memory and local database so it catalogs in Admin Panel
    onPlaceOrder(newOrder);

    // Set success state to toggle beautiful interactive animate view overlay inside drawer
    setSuccessOrder({
      id: orderId,
      price: totalBill,
      paymentMethod: method === 'COD' ? 'Cash on Delivery (COD)' : method === 'UPI' ? 'UPI Instant Pay' : 'Credit/Debit Card',
      paymentStatus: paymentStatus === 'Paid' ? 'Paid' : 'Pending'
    });

    // Reset customer states & clear basket
    setIsSubmitting(false);
    onClearCart();
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert('Your basket is empty. Please add delicious treats first!');
      return;
    }

    if (settings && !settings.isOpen) {
      alert('Aiman Creamy Creation is currently Closed and pausing fresh online bookings. Please try again later or ping support via WhatsApp details list.');
      return;
    }

    const dateStatus = getSelectedDateStatus();
    if (dateStatus && dateStatus.status === 'Unavailable') {
      alert(`Delivery slot to ${deliveryDate} is NOT available! ${dateStatus.reason ? `Reason: ${dateStatus.reason}` : 'All slots fully booked.'} Please choose another date.`);
      return;
    }

    if (!customerName.trim() || !phone.trim() || !address.trim() || !deliveryDate || !deliveryTime) {
      alert('Please fill out all required recipient details to complete your order!');
      return;
    }

    if (paymentMethodChoice === 'Online') {
      // Trigger Online Secure Payment Gateway Simulation Flow
      setIsPaymentGatewayOpen(true);
    } else {
      // Direct Cash On Delivery placing standard system flow
      executeOrderPlacement('COD', 'Pending');
    }
  };

  const deliveryTimes = [
    '10:00 AM - 12:00 PM (Morning)',
    '12:00 PM - 02:00 PM (Noon)',
    '02:00 PM - 04:00 PM (Afternoon)',
    '04:00 PM - 06:00 PM (Evening)',
    '06:00 PM - 08:00 PM (Night)',
    '08:00 PM - 10:00 PM (Late Night)'
  ];

  return (
    <div id="cart-drawer-backdrop" className="fixed inset-0 z-50 bg-brand-brown/40 backdrop-blur-xs flex justify-end">
      <div 
        id="cart-drawer-container"
        className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-orange-100 relative max-h-screen text-brand-brown overflow-hidden"
      >
        {successOrder ? (
          <>
            {/* Confetti Decorative sparkles background animation */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.12] bg-[radial-gradient(#FF8E9E_1.5px,transparent_1.5px)] [background-size:16px_16px] animate-pulse-soft"></div>
            
            <div className="p-6 border-b border-orange-100/40 bg-brand-pink-light/30 flex items-center justify-between">
              <h2 className="font-serif font-black text-sm text-brand-rose">Order Confirmed!</h2>
              <button 
                onClick={handleCloseDrawer}
                className="p-2 text-brand-brown/40 hover:text-brand-brown hover:bg-brand-pink-light rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-8 flex flex-col items-center justify-center text-center space-y-6 relative">
              {/* Super polished animated checking circle with radiating waves */}
              <div className="relative flex items-center justify-center">
                {/* Outer radiating rings */}
                <span className="absolute w-24 h-24 rounded-full border border-emerald-400 opacity-20 animate-ping"></span>
                <span className="absolute w-32 h-32 rounded-full border border-emerald-400 opacity-10 animate-pulse-soft"></span>
                
                <div className="w-18 h-18 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-lg border border-emerald-100 relative z-10 animate-bounce">
                  <svg className="w-10 h-10 stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                {/* Decorative sweet sparkles floating */}
                <span className="absolute text-brand-rose -top-3 -left-3 animate-pulse text-base">✨</span>
                <span className="absolute text-yellow-500 -bottom-1 -right-4 animate-bounce text-lg">🎉</span>
                <span className="absolute text-emerald-500 top-4 -right-6 animate-pulse text-xs">🧁</span>
                <span className="absolute text-brand-pink -bottom-4 -left-6 animate-pulse text-sm">🍒</span>
              </div>

              <div className="space-y-2">
                <span className="inline-block text-[10px] uppercase font-bold tracking-widest bg-brand-pink text-white px-3.5 py-1 rounded-full shadow-inner animate-pulse-soft">
                  🍰 Fresh Bake Booked 🍰
                </span>
                <h3 className="text-2xl font-serif font-extrabold text-brand-rose tracking-tight">
                  Order Placed Successfully!
                </h3>
                <p className="text-xs text-brand-brown/70 leading-relaxed max-w-sm mx-auto">
                  Congratulations! Your sweet request is officially booked in our patisserie ledger. Chef Aiman has received your creative details!
                </p>
              </div>

              {/* High fidelity order breakdown */}
              <div className="w-full bg-brand-bg border border-orange-100 rounded-2xl p-4.5 text-left text-xs space-y-3 shadow-inner relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand-pink"></div>
                
                <div className="flex justify-between items-center pb-2 border-b border-orange-100/40">
                  <span className="text-brand-brown/50 font-bold uppercase text-[9px] tracking-wider">Invoice ID ref:</span>
                  <span className="font-mono font-black text-xs text-brand-rose bg-white px-2 py-0.5 rounded-lg border border-orange-100/50">
                    #{successOrder.id}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-brand-brown/50 font-bold">Recipient:</span>
                  <span className="font-bold text-brand-brown">{customerName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-brand-brown/50 font-bold">Delivery Slot:</span>
                  <span className="text-brand-brown font-semibold text-right text-xs">
                    {deliveryDate} ({deliveryTime})
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-brand-brown/50 font-bold">Payment Channel:</span>
                  <span className="text-brand-brown font-semibold">{successOrder.paymentMethod}</span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-orange-100/40">
                  <span className="text-brand-brown/50 font-black uppercase text-[9px] tracking-wider">Settlement status:</span>
                  <span className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide flex items-center shadow-xs border ${
                    successOrder.paymentStatus === 'Paid'
                      ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
                      : 'bg-orange-50 border-orange-200 text-orange-700'
                  }`}>
                    {successOrder.paymentStatus === 'Paid' ? '🟢 PAID' : '🔴 COD UNPAID'}
                  </span>
                </div>

                <div className="flex justify-between text-brand-brown pt-1">
                  <span className="font-black text-brand-brown/60">Grand Total Invoice:</span>
                  <span className="font-serif font-black text-brand-rose text-sm">₹{successOrder.price}</span>
                </div>
              </div>

              <p className="text-[10px] text-brand-brown/50 leading-normal max-w-xs">
                🔒 Registered under private client sandbox safety. Zero external tracker coordinates leak. Chef Aiman will review your orders inside Rampur suite.
              </p>
            </div>

            <div className="p-6 border-t border-orange-100/40 bg-brand-pink-light/35 space-y-2.5">
              {onViewOrders && (
                <button
                  type="button"
                  onClick={onViewOrders}
                  className="w-full flex items-center justify-center space-x-2 bg-brand-brown hover:bg-brand-rose text-white font-sans font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>🛍️ Track in Admin Panel</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCloseDrawer}
                className="w-full flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-sans font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl border border-emerald-300 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>🧁 Continue Sweet Shopping</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Header Block */}
            <div className="p-6 border-b border-orange-100/40 bg-brand-pink-light/60 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <ShoppingBag className="w-5 h-5 text-brand-rose" />
                <h2 className="font-serif font-bold text-lg text-brand-rose">Your Sweet Basket</h2>
                <span className="bg-brand-pink text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-xs">
                  {cartItems.length}
                </span>
              </div>
              <button 
                onClick={handleCloseDrawer}
                className="p-2 text-brand-brown/40 hover:text-brand-brown hover:bg-brand-pink-light rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

        {/* Contents lists */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-brand-pink-light flex items-center justify-center text-brand-rose/65 mb-4 shadow-inner">
                <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="font-serif font-bold text-brand-brown text-base">Your Basket Is Empty</h3>
              <p className="text-xs text-brand-brown/50 mt-1 max-w-[240px]">
                Browse our delicious fresh baked menu to add gourmet treats and custom cakes!
              </p>
            </div>
          ) : (
            <>
              {/* Product list array */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-brand-brown/50 tracking-wider">Selected Treats</span>
                  <button 
                    onClick={onClearCart}
                    className="text-brand-brown/40 hover:text-brand-rose text-xs flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {cartItems.map((item, idx) => {
                    const isCake = item.category.toLowerCase() === 'cakes';
                    const hasCustomDesign = item.productName.toLowerCase().includes('custom') && customImages[idx];
                    
                    return (
                      <div 
                        key={idx} 
                        className="flex items-center space-x-3 p-3 bg-brand-bg rounded-xl border border-orange-100/40 group relative"
                      >
                        {hasCustomDesign ? (
                          <div className="w-12 h-12 rounded-lg bg-brand-pink-light overflow-hidden flex-shrink-0 border border-brand-pink/30">
                            <img src={customImages[idx]} alt="Custom view" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-brand-pink-light flex items-center justify-center text-brand-rose flex-shrink-0 border border-brand-pink-light">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                        
                        <div className="flex-grow min-w-0">
                          <h4 className="text-xs font-bold text-brand-brown truncate">{item.productName}</h4>
                          <p className="text-[10px] text-brand-brown/60 flex items-center space-x-1 mt-0.5 font-sans">
                            {isCake && <span className="bg-brand-pink/15 text-brand-rose px-1.5 py-0.2 rounded font-bold">{item.pound} lb</span>}
                            <span>{item.flavor}</span>
                            <span>•</span>
                            <span className={item.eggless ? 'text-emerald-700 font-bold' : 'text-brand-brown/60'}>
                              {item.eggless ? 'Eggless' : 'Normal'}
                            </span>
                          </p>
                          {item.messageOnCake && (
                            <p className="text-[10px] text-brand-rose italic font-mono truncate mt-0.5">
                              Tag: "{item.messageOnCake}"
                            </p>
                          )}
                          {item.customInstructions && (
                            <p className="text-[10px] text-amber-700 bg-amber-50/50 p-1 rounded font-sans mt-0.5 max-w-[200px] truncate" title={item.customInstructions}>
                              Notes: "{item.customInstructions}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-brand-rose">₹{item.price}</span>
                          <button
                            onClick={() => onRemoveItem(idx)}
                            className="text-brand-brown/30 hover:text-brand-rose p-1 rounded-lg hover:bg-brand-pink-light transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Details Entry Card */}
              <div className="border-t border-dashed border-orange-100/60 pt-5 space-y-4">
                <span className="text-[10px] uppercase font-bold text-brand-brown/50 tracking-wider block">
                  Delivery Details (Fulfillment)
                </span>

                {/* Recipient Name */}
                <div className="space-y-1">
                  <label htmlFor="checkout-name" className="text-[10px] font-bold text-brand-brown/70 flex items-center space-x-1">
                    <User className="w-3 h-3 text-brand-brown/40" />
                    <span>Customer Name *</span>
                  </label>
                  <input
                    type="text"
                    id="checkout-name"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Aiman Qureshi"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-brand-brown"
                  />
                </div>

                {/* WhatsApp Phone */}
                <div className="space-y-1">
                  <label htmlFor="checkout-phone" className="text-[10px] font-bold text-brand-brown/70 flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-brand-brown/40" />
                    <span>WhatsApp Mobile No. *</span>
                  </label>
                  <input
                    type="tel"
                    id="checkout-phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 93198 XXXXX"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-brand-brown"
                  />
                </div>

                {/* Full Address */}
                <div className="space-y-1">
                  <label htmlFor="checkout-address" className="text-[10px] font-bold text-brand-brown/70 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-brand-brown/40" />
                    <span>Complete Delivery Address *</span>
                  </label>
                  <textarea
                    id="checkout-address"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    placeholder="e.g. Near Jama Masjid, Civil Lines, Rampur"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink resize-none font-sans text-brand-brown"
                  />
                </div>

                {/* Date and Time selectors in Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="checkout-date" className="text-[10px] font-bold text-brand-brown/70 flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-brand-brown/40" />
                      <span>Delivery Date *</span>
                    </label>
                    <input
                      type="date"
                      id="checkout-date"
                      required
                      min={new Date().toISOString().split('T')[0]} // Min today
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink bg-white text-brand-brown font-semibold"
                    />
                    {deliveryDate && (() => {
                      const dateStatus = getSelectedDateStatus();
                      if (dateStatus) {
                        if (dateStatus.status === 'Unavailable') {
                          return (
                            <p className="text-[10px] text-brand-rose font-extrabold mt-1 text-left flex items-center space-x-1">
                              <span>🔴</span> <span>Delivery Unavailable {dateStatus.reason ? `(${dateStatus.reason})` : ''}</span>
                            </p>
                          );
                        } else {
                          return (
                            <p className="text-[10px] text-emerald-600 font-extrabold mt-1 text-left flex items-center space-x-1">
                              <span>🟢</span> <span>Delivery Available!</span>
                            </p>
                          );
                        }
                      } else {
                        return (
                          <p className="text-[10px] text-emerald-600 font-extrabold mt-1 text-left flex items-center space-x-1">
                            <span>🟢</span> <span>Delivery Available!</span>
                          </p>
                        );
                      }
                    })()}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="checkout-time-select" className="text-[10px] font-bold text-brand-brown/70 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-brand-brown/40" />
                      <span>Delivery Slot *</span>
                    </label>
                    <select
                      id="checkout-time-select"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full px-2 py-2 text-xs rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink bg-white text-brand-brown"
                    >
                      {deliveryTimes.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-1">
                  <label htmlFor="checkout-notes" className="text-[10px] font-bold text-brand-brown/70 flex items-center space-x-1">
                    <Notebook className="w-3 h-3 text-brand-brown/40" />
                    <span>Special Instructions / Landmark</span>
                  </label>
                  <input
                    type="text"
                    id="checkout-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Ring doorbell, call before leaving store"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink font-sans text-brand-brown"
                  />
                </div>

                {/* Secure Payment Option Toggle Selector */}
                <div className="border-t border-dashed border-orange-100/60 pt-5 space-y-2.5">
                  <span className="text-[10px] uppercase font-bold text-brand-brown/50 tracking-wider block">
                    Choose Order Settlement Method *
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Option A: Cash On Delivery */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethodChoice('COD')}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        paymentMethodChoice === 'COD'
                          ? 'bg-brand-pink/10 border-brand-pink text-brand-rose font-bold shadow-xs'
                          : 'bg-white border-orange-100/60 text-brand-brown/70 hover:bg-orange-50/40 hover:text-brand-brown'
                      }`}
                    >
                      <span className="text-xs font-bold font-sans">Cash On Delivery</span>
                      <span className="text-[8px] text-brand-brown/50 mt-1 font-normal font-sans">Pay Cash at your door</span>
                    </button>

                    {/* Option B: Online instant Pay */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethodChoice('Online')}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all cursor-pointer relative ${
                        paymentMethodChoice === 'Online'
                          ? 'bg-brand-pink/10 border-brand-pink text-brand-rose font-bold shadow-xs'
                          : 'bg-white border-orange-100/60 text-brand-brown/70 hover:bg-orange-50/40 hover:text-brand-brown'
                      }`}
                    >
                      <span className="text-xs font-bold font-sans flex items-center space-x-1 justify-center">
                        <span>Online Secure Pay</span>
                      </span>
                      <span className="text-[8px] text-brand-brown/50 mt-1 font-normal font-sans">GPAY/UPI/Credit Cards</span>
                      <span className="absolute -top-2 -right-1.5 bg-brand-rose text-white text-[7px] font-black tracking-wide px-1.5 py-0.2 rounded-full uppercase scale-90">
                        Secure
                      </span>
                    </button>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
 
        {/* Footer Payment block */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-orange-100/40 bg-brand-pink-light/35 space-y-4">
            <div className="space-y-1.5 text-xs font-semibold text-brand-brown/70">
              <div className="flex justify-between">
                <span>Cart Subtotal</span>
                <span className="font-mono text-brand-brown">₹{totalBill}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Packaging & Box Charge</span>
                <span className="text-emerald-700 font-bold">FREE (Complimentary)</span>
              </div>
              <div className="flex justify-between">
                <span>Standard Delivery</span>
                <span className="text-emerald-700 font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-base font-serif font-black text-brand-brown border-t border-dashed border-orange-200 pt-2">
                <span>Grand Total Price:</span>
                <span className="font-mono text-lg text-brand-rose">₹{totalBill}</span>
              </div>
            </div>
 
            {/* Ordering primary channel */}
            <div className="grid grid-cols-1 pt-2">
              {settings && !settings.isOpen ? (
                <div className="bg-brand-pink-light/70 border border-brand-pink/55 text-brand-rose text-center p-4 rounded-xl text-xs font-black font-sans leading-normal">
                  ⚠️ Fresh Bake Bookings Solicitations are Paused. (We are Closed)
                </div>
              ) : getSelectedDateStatus()?.status === 'Unavailable' ? (
                <div className="bg-orange-50 border border-orange-350 text-orange-850 text-center p-4 rounded-xl text-xs font-black font-sans leading-normal">
                  ⚠️ Delivery is NOT available on your selected date. Please pick another calendar day.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-sans font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Place Order</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
            <p className="text-[9px] text-brand-brown/50 text-center font-sans flex items-center justify-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Logged securely in local admin ledger. Fully encrypted checkout.</span>
            </p>
          </div>
        )}
      </>
    )}
      </div>

      {/* Online instant gateway payment processing portal context */}
      <PaymentGatewayModal
        isOpen={isPaymentGatewayOpen}
        onClose={() => setIsPaymentGatewayOpen(false)}
        totalAmount={totalBill}
        customerName={customerName}
        phone={phone}
        onPaymentSuccess={(method, txnId) => {
          setIsPaymentGatewayOpen(false);
          executeOrderPlacement(method, 'Paid', txnId);
        }}
      />
    </div>
  );
}
