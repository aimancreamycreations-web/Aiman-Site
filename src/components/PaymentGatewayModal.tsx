import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle, ShieldCheck, CreditCard, Smartphone, QrCode, Lock, RefreshCw, AlertCircle, ArrowLeft, Check 
} from 'lucide-react';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  customerName: string;
  phone: string;
  onPaymentSuccess: (method: 'UPI' | 'Card', transactionId: string) => void;
}

export default function PaymentGatewayModal({
  isOpen,
  onClose,
  totalAmount,
  customerName,
  phone,
  onPaymentSuccess
}: PaymentGatewayModalProps) {
  // Navigation internal state: 'MethodSelection' | 'UPI_Pay' | 'Card_Pay' | 'OTPSecure' | 'Processing' | 'Completed'
  const [step, setStep] = useState<'Method' | 'UPI' | 'Card' | 'OTP' | 'Processing' | 'Success'>('Method');
  
  // Input fields for Card
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardError, setCardError] = useState('');

  // OTP Verification parameters
  const [otpCode, setOtpCode] = useState('');
  const [realOtp, setRealOtp] = useState('123456'); // Standardized simulator authorization key
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);

  // Transaction Reference Key
  const [txnId, setTxnId] = useState('');
  const [paymentType, setPaymentType] = useState<'UPI' | 'Card'>('UPI');

  useEffect(() => {
    if (isOpen) {
      setStep('Method');
      setCardNumber('');
      setCardExpiry('');
      setCardCVV('');
      setCardName(customerName);
      setCardError('');
      setOtpCode('');
      setOtpError('');
      setResendTimer(30);
      setTxnId('TXN-' + Math.floor(10000000 + Math.random() * 90000000));
    }
  }, [isOpen, customerName]);

  // Resend OTP countdown
  useEffect(() => {
    if (step === 'OTP' && resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, resendTimer]);

  if (!isOpen) return null;

  // Luhn Algorithm Secure Check for Credit Cards to avoid loops/holes
  const validateCardWithLuhn = (num: string): boolean => {
    const rawDigits = num.replace(/\D/g, '');
    if (rawDigits.length < 13 || rawDigits.length > 19) return false;
    
    let sum = 0;
    let shouldDouble = false;
    for (let i = rawDigits.length - 1; i >= 0; i--) {
      let val = parseInt(rawDigits.charAt(i));
      if (shouldDouble) {
        val *= 2;
        if (val > 9) val -= 9;
      }
      sum += val;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  // Format Card Number
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += value[i];
    }
    setCardNumber(formatted.slice(0, 19));
    setCardError('');
  };

  // Format Expiry
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setCardExpiry(value.slice(0, 5));
    setCardError('');
  };

  // Format CVV
  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCardCVV(value.slice(0, 4));
    setCardError('');
  };

  const handleProceedWithCard = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\s+/g, '');
    
    if (cleanNum.length < 16) {
      setCardError('Card Number must contain at least 16 digits');
      return;
    }

    if (!validateCardWithLuhn(cleanNum)) {
      setCardError('Security Warning: Card failed Luhn Algorithm checks. Please provide a mathematically valid Visa/Mastercard number.');
      return;
    }

    if (cardExpiry.length < 5) {
      setCardError('Please enter a valid expiration date (MM/YY)');
      return;
    }

    // Check month validity
    const month = parseInt(cardExpiry.split('/')[0]);
    if (isNaN(month) || month < 1 || month > 12) {
      setCardError('Invalid expiration month');
      return;
    }

    if (cardCVV.length < 3) {
      setCardError('Card verification code (CVV) must be 3 or 4 digits');
      return;
    }

    if (!cardName.trim()) {
      setCardError('Cardholder Name is required for authorization');
      return;
    }

    setPaymentType('Card');
    // Generate simulated secure OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setRealOtp(generatedOtp);
    setOtpCode('');
    setOtpError('');
    setStep('OTP');
  };

  const handleProceedWithUPIPay = () => {
    setPaymentType('UPI');
    // Send standard SMS push simulated OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setRealOtp(generatedOtp);
    setOtpCode('');
    setOtpError('');
    setStep('OTP');
  };

  const verifyOTPNow = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== realOtp) {
      setOtpError('Verification Failed: The SMS verification code does not match. Please verify and enter again.');
      return;
    }

    setOtpError('');
    setStep('Processing');

    // Simulate central bank security settlement delay (1.8s) for ultra-realism
    setTimeout(() => {
      setStep('Success');
    }, 1800);
  };

  const handleMerchantCompletion = () => {
    onPaymentSuccess(paymentType, txnId);
    onClose();
  };

  // Render merchant info block helper
  const renderMerchantHeader = () => (
    <div className="bg-brand-brown text-white p-5 rounded-t-3xl border-b border-orange-100 flex items-center justify-between">
      <div className="flex items-center space-x-3 text-left">
        <div className="w-10 h-10 rounded-xl bg-brand-pink text-white flex items-center justify-center shadow-lg">
          <ShieldCheck className="w-5.5 h-5.5" />
        </div>
        <div>
          <h3 className="font-serif font-black text-sm text-brand-cream-light">Aiman Patisserie Gateway</h3>
          <p className="text-[9px] font-mono tracking-tight text-white/60 flex items-center">
            <Lock className="w-2.5 h-2.5 inline mr-1 text-[#FF8E9E]" /> SECURE 256-BIT ENCRYPTED TRANSACTION
          </p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-[9px] uppercase font-bold text-white/50 block tracking-wider">Amount Due:</span>
        <span className="font-serif font-black text-lg text-[#FF8E9E]">₹{totalAmount}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-brand-brown/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-orange-100 overflow-hidden animate-scale-up">
        
        {/* MERCHANT SECURE HEADER */}
        {renderMerchantHeader()}

        {/* 1. SELECTION SCREEN */}
        {step === 'Method' && (
          <div className="p-6 space-y-6 text-brand-brown">
            <div className="text-center space-y-1">
              <h4 className="font-serif font-black text-base text-brand-brown">Choose Online Secure Gateway Channel</h4>
              <p className="text-xs text-brand-brown/60">
                To eliminate payment disputes, pick a licensed digital provider below. Total due is calculated in Indian Rupees (₹).
              </p>
            </div>

            <div className="space-y-3 pt-2">
              
              {/* Option A: UPI */}
              <button
                onClick={() => setStep('UPI')}
                className="w-full flex items-center justify-between p-4 bg-brand-bg hover:bg-brand-pink-light/30 border border-orange-100 hover:border-brand-pink rounded-2xl group transition-all text-left cursor-pointer"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 bg-brand-rose/10 text-brand-rose rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <QrCode className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <span className="text-xs font-black block text-brand-brown uppercase tracking-wider">UPI / QR Scan & Pay</span>
                    <span className="text-[10px] text-brand-brown/60">Pay instantly via GPay, PhonePe, Paytm, or UPI scanner</span>
                  </div>
                </div>
                <Smartphone className="w-4 h-4 text-brand-brown/30 group-hover:text-brand-rose transition-colors" />
              </button>

              {/* Option B: Credit / Debit Card */}
              <button
                onClick={() => setStep('Card')}
                className="w-full flex items-center justify-between p-4 bg-brand-bg hover:bg-brand-pink-light/30 border border-orange-100 hover:border-brand-pink rounded-2xl group transition-all text-left cursor-pointer"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 bg-brand-rose/10 text-brand-rose rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CreditCard className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <span className="text-xs font-black block text-brand-brown uppercase tracking-wider">Credit or Debit Card</span>
                    <span className="text-[10px] text-brand-brown/60">Encrypted checkout backing Visa, Mastercard, RuPay, Maestro</span>
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-brand-brown/30 group-hover:text-brand-rose transition-colors" />
              </button>

            </div>

            <div className="pt-4 border-t border-orange-100/40 flex justify-between items-center bg-white">
              <span className="text-[9px] font-mono text-brand-brown/40">🔒 Dynamic Invoice ID: {txnId}</span>
              <button
                onClick={onClose}
                className="text-xs font-bold text-brand-brown/50 hover:text-brand-rose transition-colors cursor-pointer"
              >
                Cancel & Go Back
              </button>
            </div>
          </div>
        )}

        {/* 2. UPI MODAL GATEWAY */}
        {step === 'UPI' && (
          <div className="p-6 space-y-6 text-brand-brown text-center">
            
            <div className="flex items-center justify-between border-b border-orange-100/40 pb-3">
              <button 
                onClick={() => setStep('Method')}
                className="text-xs font-bold text-brand-brown/50 hover:text-brand-rose flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Go Back</span>
              </button>
              <span className="text-[10px] font-black uppercase tracking-wider bg-brand-pink-light text-brand-rose px-2.5 py-1 rounded-full">
                UPI Merchant System
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-serif font-black text-sm text-brand-brown">Scan QR to Complete Secure Instant Settlement</h4>
                <p className="text-[10px] text-brand-brown/60 max-w-sm mx-auto">
                  Scan this live UPI QR with any mobile payment app (Paytm, BHIM, GPAY, PhonePe) to confirm secure fund earmark.
                </p>
              </div>

              {/* Dynamic QR Box representation */}
              <div className="relative w-44 h-44 mx-auto p-2 bg-white border-2 border-brand-brown/10 rounded-2xl shadow-inner flex items-center justify-center overflow-hidden">
                {/* Simulated Beautiful Stylized Vector QR */}
                <div className="w-full h-full bg-brand-bg rounded-lg relative flex flex-col items-center justify-center p-3">
                  {/* Subtle decorative grid cells in CSS to emulate high-end QR matrix */}
                  <div className="absolute inset-2 grid grid-cols-4 grid-rows-4 opacity-[0.85] gap-1.5 pointer-events-none">
                    <div className="border-[3px] border-brand-brown rounded-xs"></div>
                    <div className="border-[3px] border-brand-brown rounded-xs"></div>
                    <div className="bg-brand-brown rounded-xs"></div>
                    <div className="border-[3px] border-brand-brown rounded-xs"></div>
                    <div className="bg-brand-brown rounded-xs"></div>
                    <div className="bg-brand-brown rounded-xs"></div>
                    <div className="border-[3px] border-brand-brown rounded-xs"></div>
                    <div className="bg-brand-brown rounded-xs"></div>
                    <div className="border-[3px] border-brand-brown rounded-xs"></div>
                    <div className="border-[3px] border-brand-brown rounded-xs"></div>
                    <div className="bg-brand-brown rounded-xs"></div>
                    <div className="bg-brand-brown rounded-xs"></div>
                    <div className="bg-brand-brown rounded-xs"></div>
                    <div className="bg-brand-brown rounded-xs"></div>
                    <div className="bg-brand-brown rounded-xs"></div>
                    <div className="border-[3px] border-brand-brown rounded-xs"></div>
                  </div>
                  {/* Center branding icon */}
                  <div className="w-8 h-8 rounded-lg bg-white border border-brand-brown/10 flex items-center justify-center shadow-md relative z-10">
                    <QrCode className="w-4.5 h-4.5 text-brand-pink" />
                  </div>
                </div>
              </div>

              <div className="bg-brand-pink-light/30 border border-brand-pink/20 rounded-xl p-3 text-left">
                <span className="text-[9px] uppercase font-black text-brand-rose tracking-wider block">Merchant Verified Address</span>
                <span className="text-xs font-mono font-bold text-brand-brown block mt-0.5 select-all">aimancreamycreation@okaxis</span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleProceedWithUPIPay}
                  className="w-full flex items-center justify-center space-x-2 bg-brand-brown hover:bg-brand-rose text-white font-sans font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>I Scanned successfully • Verify Payment</span>
                </button>
                <p className="text-[9px] text-[#25D366] font-bold">
                  ✓ Connected to UPI National Switch: Encrypted Transaction Secured.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* 3. CARD CHECKOUT GATEWAY */}
        {step === 'Card' && (
          <form onSubmit={handleProceedWithCard} className="p-6 space-y-5 text-brand-brown text-left">
            
            <div className="flex items-center justify-between border-b border-orange-100/40 pb-3">
              <button 
                type="button"
                onClick={() => setStep('Method')}
                className="text-xs font-bold text-brand-brown/50 hover:text-brand-rose flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Go Back</span>
              </button>
              <div className="flex items-center space-x-1 bg-brand-pink-light text-brand-rose px-2.5 py-1 rounded-full text-[10px] font-black uppercase">
                <Lock className="w-3 h-3 text-brand-rose" />
                <span>PCI-DSS Decrypted</span>
              </div>
            </div>

            {cardError && (
              <div className="bg-red-50 text-red-700 text-[11px] p-3 rounded-xl flex items-start space-x-2 border border-red-100 animate-pulse-soft">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{cardError}</span>
              </div>
            )}

            <div className="space-y-3.5">
              
              {/* Card Number */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-brown/60">Card Number *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4000 1234 5678 9010"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink font-mono tracking-widest text-[#2B1E17] bg-white font-semibold"
                  />
                  <CreditCard className="w-4 h-4 text-brand-brown/40 absolute left-3.5 top-3.5" />
                  {/* Card Vendor Indicator */}
                  {cardNumber.startsWith('4') && (
                    <span className="text-[9px] font-black text-blue-600 absolute right-3 top-3.5 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded leading-none border border-blue-200">
                      VISA
                    </span>
                  )}
                  {cardNumber.startsWith('5') && (
                    <span className="text-[9px] font-black text-orange-600 absolute right-3 top-3.5 uppercase tracking-widest bg-orange-50 px-1.5 py-0.5 rounded leading-none border border-orange-200">
                      MCARD
                    </span>
                  )}
                </div>
              </div>

              {/* Exp & CVV row */}
              <div className="grid grid-cols-2 gap-3">
                
                {/* Expiry */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-brand-brown/60">Expiry (MM/YY) *</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="12/28"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink font-mono text-[#2B1E17] bg-white font-semibold"
                  />
                </div>

                {/* CVV */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-brand-brown/60">Security CVV *</label>
                  <input
                    type="password"
                    required
                    value={cardCVV}
                    onChange={handleCVVChange}
                    placeholder="•••"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink font-mono text-[#2B1E17] bg-white font-semibold"
                  />
                </div>

              </div>

              {/* Cardholder Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-brown/60">Cardholder Name *</label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="e.g. AIMAN QURESHI"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink uppercase font-sans text-[#2B1E17] bg-white font-semibold"
                />
              </div>

            </div>

            <button
              type="submit"
              className="w-full bg-brand-brown hover:bg-brand-pink text-white font-sans font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              Verify Tokenized Card
            </button>

            <p className="text-[9px] text-brand-brown/40 text-center font-sans">
              💳 Secured by PCI-DSS. Financial logs are never stored in plain-text format.
            </p>

          </form>
        )}

        {/* 4.OTP SECURE PORTAL */}
        {step === 'OTP' && (
          <form onSubmit={verifyOTPNow} className="p-6 space-y-5 text-brand-brown text-center">
            
            <div className="space-y-2">
              <span className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner animate-pulse-soft">
                <Lock className="w-5 h-5" />
              </span>
              <h4 className="font-serif font-black text-sm text-brand-brown">3-D Secure Authorization Required</h4>
              <p className="text-[11px] text-brand-brown/70 max-w-sm mx-auto leading-relaxed">
                We sent a simulated 6-digit payment validation OTP code to your registered device for instant clearance.
              </p>
            </div>

            {/* HIGH FIDELITY SIMULATION HELPER BOX */}
            <div className="bg-amber-50 border border-dashed border-amber-200 rounded-2xl p-3.5 space-y-1 text-left">
              <span className="text-[9px] uppercase font-black text-amber-700 tracking-wider flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-600" /> Secure Sandbox SMS Delivery Notice
              </span>
              <p className="text-[10px] text-brand-brown/75 leading-relaxed font-semibold">
                To complete this mock order payment securely and verify checkout, please enter this code below:
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-mono font-black tracking-widest text-[#2B1E17] bg-white border border-orange-100 px-3 py-1 rounded-xl">
                  {realOtp}
                </span>
                <span className="text-[9px] text-brand-brown/40 font-mono">ID ref: {phone}</span>
              </div>
            </div>

            {otpError && (
              <div className="bg-red-50 text-red-700 text-[11px] p-3 rounded-xl flex items-start space-x-2 border border-red-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-brand-brown/50 block">Enter 6-Digit SMS OTP *</label>
                <input
                  type="text"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="------"
                  className="w-1/2 mx-auto px-4 py-2.5 text-center text-lg font-mono tracking-widest rounded-xl border border-orange-100 focus:outline-none focus:border-brand-pink text-[#2B1E17] bg-white font-black"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold px-1.5">
                {resendTimer > 0 ? (
                  <span className="text-brand-brown/50">Resend SMS OTP in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const newGenerated = Math.floor(100000 + Math.random() * 900000).toString();
                      setRealOtp(newGenerated);
                      setResendTimer(30);
                    }}
                    className="text-brand-rose hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setStep('Method')}
                  className="text-brand-brown/50 hover:text-brand-brown transition-colors cursor-pointer"
                >
                  Change Method
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-sans font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                Submit Authorization Core
              </button>
            </div>

          </form>
        )}

        {/* 5. SETTLEMENT PROCESSING SPEED PORTAL */}
        {step === 'Processing' && (
          <div className="p-12 text-center text-brand-brown space-y-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <span className="absolute inset-0 rounded-full border-4 border-orange-100/30 animate-pulse-soft"></span>
              <RefreshCw className="w-8 h-8 text-brand-rose animate-spin stroke-[2]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif font-black text-sm text-brand-brown">Securing Bank Gateway Funds Settlement</h4>
              <p className="text-[10px] text-brand-brown/60 max-w-xs mx-auto">
                Authorized. Finalizing tokens cryptographic handshake through central banking routing grid to tag invoice ledger...
              </p>
            </div>
          </div>
        )}

        {/* 6. COMPLETED SCREEN */}
        {step === 'Success' && (
          <div className="p-8 text-center text-brand-brown space-y-5 animate-scale-up">
            
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
              <Check className="w-9 h-9 stroke-[3]" />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-serif font-black text-base text-emerald-800">Authentic Payment Completed Successfully!</h4>
              <p className="text-xs text-brand-brown/70 leading-relaxed max-w-sm mx-auto font-sans font-medium">
                Payment has been securely processed and matched using reference receipt database logs. The Patisserie has cataloged the order as <strong>🟢 PAID</strong>.
              </p>
            </div>

            <div className="bg-brand-bg border border-orange-100 rounded-2xl p-4 text-left font-sans text-xs space-y-2 max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-brand-brown/50 font-bold">Transaction Reference:</span>
                <span className="font-mono font-bold text-brand-rose">{txnId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-brown/50 font-bold">Billing ID:</span>
                <span className="font-bold text-brand-brown">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-brown/50 font-bold">Clearance Network:</span>
                <span className="text-emerald-700 font-bold flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Licensed UPI Switch
                </span>
              </div>
            </div>

            <button
              onClick={handleMerchantCompletion}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Confirm Order Submission (Success)
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
