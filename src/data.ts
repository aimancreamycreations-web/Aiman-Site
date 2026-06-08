import { Product } from './types';

export const FLAVORS = [
  'Chocolate Fudge',
  'Red Velvet Cream',
  'Pineapple Cream Classic',
  'Classic Butterscotch',
  'Vanilla Strawberry Bliss',
  'Black Forest Original',
  'Mango Cardamom (Seasonal)',
  'Oreo Cookies & Cream'
];

export const CATEGORIES = [
  'Cakes',
  'Pastries',
  'Cookies',
  'Cupcakes'
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Royale Chocolate Fudge Cake',
    description: 'Indulge in layers of rich, moist chocolate sponge smothered in gourmet dark chocolate fudge ganache and topped with handcrafted chocolate curls.',
    pricePerPound: 450, // Approx pricing in INR / units
    pricePerKg: 900,
    category: 'Cakes',
    image: '/src/assets/images/chocolate_fudge_cake_1780504054428.png',
    flavors: ['Chocolate Fudge', 'Black Forest Original', 'Oreo Cookies & Cream'],
    popular: true
  },
  {
    id: '2',
    name: 'Signature Velvet Crimson Cake',
    description: 'Gorgeous layers of striking red velvet sponge paired with velvety smooth premium cream cheese frosting and sprinkled with delicate crimson crumbs.',
    pricePerPound: 550,
    pricePerKg: 1100,
    category: 'Cakes',
    image: '/src/assets/images/red_velvet_cake_1780504069170.png',
    flavors: ['Red Velvet Cream', 'Vanilla Strawberry Bliss'],
    popular: true
  },
  {
    id: '3',
    name: 'Glazed Strawberry Pastry',
    description: 'Crisp, flaky French puff pastry layered with organic vanilla bean custard and topped with fresh, glazed ruby strawberries. Perfect individual treat!',
    pricePerPound: 90,
    category: 'Pastries',
    image: '/src/assets/images/strawberry_pastry_1780504084368.png',
    flavors: ['Vanilla Strawberry Bliss', 'Pineapple Cream Classic'],
    popular: false
  },
  {
    id: '4',
    name: 'Warm Belgian Chocolate Chip Cookies',
    description: 'Freshly baked buttery cookies loaded with premium Belgian dark, milk, and white chocolate chunks. Soft on the inside, golden-crisp on the edges.',
    pricePerPound: 45, // unit price
    category: 'Cookies',
    image: '/src/assets/images/chocolate_chip_cookies_1780504098487.png',
    flavors: ['Chocolate Fudge'],
    popular: true
  }
];
