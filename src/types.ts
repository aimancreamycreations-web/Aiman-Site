export interface Product {
  id: string;
  name: string;
  description: string;
  pricePerPound: number; // Base price for 1 pound/item
  pricePerKg?: number; // Optional price per kg (especially for cakes)
  weightPrices?: { [weightKey: string]: number }; // e.g. {"0.25kg": 250, "0.5kg": 450, "1kg": 800}
  category: string; // "Cakes" | "Pastries" | "Cookies" | "Cupcakes"
  image: string; // Base64 or URL
  flavors: string[]; // Options e.g., Chocolate Fudge, Red Velvet, Vanilla, Butterscotch
  popular?: boolean;
}

export interface OrderItem {
  productId?: string;
  productName: string;
  category: string;
  quantity: number;
  pound: number; // For cakes: 1, 1.5, 2, 3, etc. For non-cakes: 1
  weightUnit?: 'lb' | 'kg'; // Custom weight unit e.g. lb or kg
  flavor: string;
  messageOnCake?: string;
  customInstructions?: string;
  eggless: boolean;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  deliveryDate: string;
  deliveryTime: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'Pending' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  createdAt: string;
  notes?: string;
  isCustomOrder?: boolean;
  customDesignImage?: string; // If custom design was uploaded by user
  paymentMethod: 'COD' | 'UPI' | 'Card';
  paymentStatus: 'Pending' | 'Paid' | 'Refunded';
}

export interface BlockedDate {
  date: string; // "YYYY-MM-DD"
  status: 'Available' | 'Unavailable';
  reason?: string;
}

export interface ShopSettings {
  isOpen: boolean;
  supportPhone: string;
  studioAddress: string;
  blockedDates: BlockedDate[];
  customCakePricePerLb?: number;
  customCakePricePerKg?: number;
  whatsappNumber?: string;
  instagramUrl?: string;
}

