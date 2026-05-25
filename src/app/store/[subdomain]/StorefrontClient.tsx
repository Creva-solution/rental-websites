'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, Menu, Search, X, Loader2, User, ChevronLeft, ChevronRight, 
  Truck, Shield, RefreshCw, ArrowRight, Heart, Star, Check, Eye, ArrowUpDown, 
  Sparkles, Package, ShoppingBag, EyeOff, Clock
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// High-end sample products to show if store database products are empty
const SAMPLE_PRODUCTS = [
  {
    id: 'sample-1',
    name: 'Signature Wool Overcoat',
    price: 249.00,
    category: 'Fashion',
    image_url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=800',
    description: 'Exquisitely crafted from 100% organic virgin wool. Features a modern custom fit, peak lapels, and custom double-stitch tailoring.',
    rating: 4.9,
    popularity: 98,
    is_new: true
  },
  {
    id: 'sample-2',
    name: 'Signature Minimalist Gold Watch',
    price: 189.00,
    category: 'Accessories',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    description: 'Minimalist statement time-piece. Engineered with high-precision Japanese quartz movement, finished in 18k brushed gold plating.',
    rating: 4.8,
    popularity: 92,
    is_new: false
  },
  {
    id: 'sample-3',
    name: 'Noise-Canceling Wireless Headphones',
    price: 299.00,
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800',
    description: 'Immersive sound quality with active hybrid noise canceling. Over 40 hours of continuous high-fidelity battery playback.',
    rating: 5.0,
    popularity: 99,
    is_new: true
  },
  {
    id: 'sample-4',
    name: 'Eco-Friendly Dinnerware Set',
    price: 45.00,
    category: 'Home',
    image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800',
    description: 'Fully biodegradable plates & bowls handcrafted from natural fallen Areca palm leaves. Strong, leak-proof, and micro-wavable.',
    rating: 4.7,
    popularity: 88,
    is_new: false
  },
  {
    id: 'sample-5',
    name: 'Ergonomic Premium Office Chair',
    price: 320.00,
    category: 'Home',
    image_url: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&q=80&w=800',
    description: 'Synchronous tilt mechanism with breathable double-mesh backing. Highly adjustable lumbar support, 3D armrests, and dynamic tension.',
    rating: 4.9,
    popularity: 91,
    is_new: false
  },
  {
    id: 'sample-6',
    name: 'Luxury Cotton Pullover Hoodie',
    price: 79.00,
    category: 'Fashion',
    image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800',
    description: 'Heavyweight organic French terry cotton. Exceptionally cozy double-lined hood, dropped shoulders, and brushed interior softness.',
    rating: 4.6,
    popularity: 85,
    is_new: true
  },
  {
    id: 'sample-7',
    name: 'Active Smart Sports Watch',
    price: 120.00,
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=800',
    description: 'A comprehensive fitness companion. Real-time optical heart sensor, blood oxygen tracker, sleep analysis, and built-in multi-sport GPS.',
    rating: 4.8,
    popularity: 93,
    is_new: false
  },
  {
    id: 'sample-8',
    name: 'Handcrafted Leather Duffle Bag',
    price: 150.00,
    category: 'Accessories',
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800',
    description: 'Spacious weekender cabin-bag handcrafted from full-grain vegetable-tanned leather. Heavy-duty solid brass hardware and YKK metal zippers.',
    rating: 4.9,
    popularity: 96,
    is_new: true
  }
];

const getProductImage = (product: any) => {
  try {
    if (product.description && product.description.startsWith('{')) {
      const parsed = JSON.parse(product.description);
      return parsed.image_url || '';
    }
  } catch (e) {}
  return product.image_url || '';
};

export default function StorefrontClient({ store, products }: { store: any, products: any[] }) {
  const primaryColor = useMemo(() => {
    const raw = store.primary_color || '#3B82F6';
    let clean = raw.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map((char: string) => char + char).join('');
    }
    return '#' + clean;
  }, [store.primary_color]);

  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    const bigint = parseInt(cleanHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
  };

  const adjustColorBrightness = (hex: string, percent: number) => {
    let R = parseInt(hex.substring(1, 3), 16);
    let G = parseInt(hex.substring(3, 5), 16);
    let B = parseInt(hex.substring(5, 7), 16);

    R = Math.max(0, Math.min(255, R + percent));
    G = Math.max(0, Math.min(255, G + percent));
    B = Math.max(0, Math.min(255, B + percent));

    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  };

  const rgbString = useMemo(() => {
    try {
      return hexToRgb(primaryColor);
    } catch (e) {
      return '59, 130, 246'; // fallback to #3B82F6
    }
  }, [primaryColor]);

  const darkColor = useMemo(() => {
    try {
      return adjustColorBrightness(primaryColor, -30);
    } catch (e) {
      return '#2563EB';
    }
  }, [primaryColor]);

  const darkerColor = useMemo(() => {
    try {
      return adjustColorBrightness(primaryColor, -60);
    } catch (e) {
      return '#1D4ED8';
    }
  }, [primaryColor]);

  const lightColor = useMemo(() => {
    try {
      return adjustColorBrightness(primaryColor, 40);
    } catch (e) {
      return '#60A5FA';
    }
  }, [primaryColor]);

  const currencySymbol = store.currency === 'USD' ? '$' : '₹';

  // Parse custom metadata for banner slideshow & announcement bar message
  let parsedDesc = store.description || '';
  let customBanners = [];
  let announcementText = `✨ EXCLUSIVE SPRING SALE: FREE SHIPPING ON ALL ORDERS OVER ${currencySymbol}500 ✨`;
  try {
    if (store.description && store.description.startsWith('{')) {
      const data = JSON.parse(store.description);
      parsedDesc = data.description || '';
      customBanners = data.banners || [];
      if (data.announcement) {
        announcementText = data.announcement;
      }
    }
  } catch (e) {
    console.error("Failed to parse store metadata:", e);
  }

  const defaultBanners = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1920',
      title: 'The New Era of Apparel',
      subtitle: `Refined utilitarianism designed for modern metropolitan life. Experience premium style accents.`,
      cta: 'SHOP COLLECTION'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1920',
      title: 'Exquisite Summer Collection',
      subtitle: 'Indulge in our limited-edition handcrafted series. Up to 40% off online deals.',
      cta: 'EXPLORE ALL'
    }
  ];

  const banners = customBanners.length > 0 ? customBanners : defaultBanners;

  // Use actual store products if available, else inject beautiful premium sample products
  const displayProducts = useMemo(() => {
    return products && products.length > 0 ? products : SAMPLE_PRODUCTS;
  }, [products]);

  const [cart, setCart] = useState<{product: any, quantity: number, size?: string, color?: string}[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Modals & Sidebars States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showToast, setShowToast] = useState<{productName: string, quantity: number} | null>(null);

  // Dynamically update favicon in the browser tab based on the uploaded store logo
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const logo = store.logo_url;
    if (!logo) return;
    
    // Find or create standard favicon link element
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = logo;
    
    // Find or create apple touch icon link element
    let appleLink = document.querySelector("link[rel~='apple-touch-icon']") as HTMLLinkElement;
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.getElementsByTagName('head')[0].appendChild(appleLink);
    }
    appleLink.href = logo;
  }, [store.logo_url]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    if (selectedProduct) {
      const sizes = getProductSizes(selectedProduct);
      if (sizes.length > 0) {
        setSelectedSize(sizes[0]);
      } else {
        setSelectedSize('');
      }
      
      const colors = getProductColors(selectedProduct);
      if (colors.length > 0) {
        setSelectedColor(colors[0]);
      } else {
        setSelectedColor('');
      }
    }
  }, [selectedProduct]);
  
  // Real-time ticking state to update countdown timers every second
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getProductWithActivePrice = (product: any) => {
    if (!product) return product;
    try {
      if (product.description && product.description.startsWith('{')) {
        const parsed = JSON.parse(product.description);
        if (parsed.offer_ends_at && parsed.offer_price) {
          const endTime = new Date(parsed.offer_ends_at).getTime();
          if (endTime > Date.now()) {
            return {
              ...product,
              price: Number(parsed.offer_price),
              description: parsed.description || ''
            };
          }
        }
      }
    } catch (e) {
      // fallback
    }
    return product;
  };

  const getProductCategory = (product: any) => {
    if (!product) return 'Collection';
    try {
      if (product.description && product.description.startsWith('{')) {
        const parsed = JSON.parse(product.description);
        if (parsed.category) return parsed.category;
      }
    } catch (e) {}
    return product.category || 'Collection';
  };

  const getProductDescription = (product: any) => {
    if (!product) return '';
    try {
      if (product.description && product.description.startsWith('{')) {
        const parsed = JSON.parse(product.description);
        return parsed.description || '';
      }
    } catch (e) {}
    return product.description || '';
  };

  const getProductSizes = (product: any) => {
    if (!product) return [];
    let productSizes = [];
    try {
      if (product.description && product.description.startsWith('{')) {
        const parsed = JSON.parse(product.description);
        if (parsed.sizes && Array.isArray(parsed.sizes) && parsed.sizes.length > 0) {
          productSizes = parsed.sizes;
        }
      }
    } catch (e) {}

    const currentCategory = (product.category || '').toLowerCase();
    const parsedCategory = getProductCategory(product).toLowerCase();
    const isClothingCategory = currentCategory.includes('clothing') || currentCategory.includes('fashion') || currentCategory.includes('apparel') ||
                               parsedCategory.includes('clothing') || parsedCategory.includes('fashion') || parsedCategory.includes('apparel');
    
    if (productSizes.length === 0 && isClothingCategory) {
      return ['S', 'M', 'L', 'XL'];
    }
    return productSizes;
  };

  const getProductColors = (product: any) => {
    if (!product) return [];
    let productColors = [];
    try {
      if (product.description && product.description.startsWith('{')) {
        const parsed = JSON.parse(product.description);
        if (parsed.colors && Array.isArray(parsed.colors) && parsed.colors.length > 0) {
          productColors = parsed.colors;
        }
      }
    } catch (e) {}

    const currentCategory = (product.category || '').toLowerCase();
    const parsedCategory = getProductCategory(product).toLowerCase();
    const isClothingCategory = currentCategory.includes('clothing') || currentCategory.includes('fashion') || currentCategory.includes('apparel') ||
                               parsedCategory.includes('clothing') || parsedCategory.includes('fashion') || parsedCategory.includes('apparel');
    
    if (productColors.length === 0 && isClothingCategory && !product.id.startsWith('sample')) {
      return [];
    }
    
    if (productColors.length === 0 && product.id.startsWith('sample')) {
      return ['Black', 'Slate Blue', 'Purple'];
    }
    
    return productColors;
  };

  // Find the first product with an active flash sale offer to showcase on the hero banner
  const activePromoProduct = useMemo(() => {
    return displayProducts.find(product => {
      try {
        if (product.description && product.description.startsWith('{')) {
          const parsed = JSON.parse(product.description);
          if (parsed.offer_ends_at && parsed.offer_price) {
            return new Date(parsed.offer_ends_at).getTime() > Date.now();
          }
        }
      } catch (e) {}
      return false;
    });
  }, [displayProducts, tick]);

  const carouselSlides = useMemo(() => {
    const list = [...banners];
    if (activePromoProduct) {
      try {
        const parsed = JSON.parse(activePromoProduct.description);
        const originalPrice = Number(activePromoProduct.price);
        const offerPrice = Number(parsed.offer_price);
        const offerPercent = Number(parsed.offer_percent) || 50;
        const endTime = new Date(parsed.offer_ends_at).getTime();
        const now = Date.now();
        const diffMs = endTime - now;
        
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
        let timeLeftText = '';
        if (diffHrs > 0) {
          timeLeftText = `${diffHrs}h ${diffMins}m ${diffSecs}s`;
        } else if (diffMins > 0) {
          timeLeftText = `${diffMins}m ${diffSecs}s`;
        } else {
          timeLeftText = `${diffSecs}s`;
        }

        list.unshift({
          id: 'flash-sale-promo',
          isPromo: true,
          image: getProductImage(activePromoProduct) || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1200',
          title: activePromoProduct.name,
          subtitle: `🔥 LIMITED-TIME FLASH SALE: ${offerPercent}% OFF! Original: ${currencySymbol}${originalPrice.toLocaleString()} | Now: ${currencySymbol}${offerPrice.toLocaleString()}`,
          cta: `CLAIM OFFER IN ${timeLeftText}`,
          product: activePromoProduct
        });
      } catch (e) {}
    }
    return list;
  }, [banners, activePromoProduct, tick, currencySymbol]);

  // Custom Filters & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Featured');
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Checkout Form State
  const [isCheckout, setIsCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order Tracking State
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [trackPhone, setTrackPhone] = useState('');
  const [trackedOrders, setTrackedOrders] = useState<any[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);
  
  // Simulated Order Tracking State
  const [simulatedOrderId, setSimulatedOrderId] = useState('');
  const [simulatedOrder, setSimulatedOrder] = useState<any>(null);

  // Custom Detail Modal Variations State
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Midnight');

  // Automatic Banner Slideshow Carousel loop
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % banners.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);

  // Dynamic lists
  const categoriesList = useMemo(() => {
    const list = new Set(displayProducts.map(p => getProductCategory(p)));
    return ['All', ...Array.from(list)];
  }, [displayProducts]);

  // Core Filtering & Sorting Logic
  const processedProducts = useMemo(() => {
    let result = [...displayProducts];

    // 1. Search Query filter
    if (searchQuery.trim() !== '') {
      result = result.filter(p => {
        const pCat = getProductCategory(p);
        return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
               pCat.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // 2. Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(p => getProductCategory(p) === selectedCategory);
    }

    // 3. Sorting
    if (sortBy === 'Price: Low to High') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'Price: High to Low') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === 'Popularity') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'New Arrivals') {
      result.sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0));
    }

    return result;
  }, [displayProducts, searchQuery, selectedCategory, sortBy]);

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const addToCart = (product: any, quantity: number = 1, size: string = '', color: string = '') => {
    const pricedProduct = getProductWithActivePrice(product);
    setCart(prev => {
      const existing = prev.find(item => 
        item.product.id === pricedProduct.id && 
        (item.size || '') === size && 
        (item.color || '') === color
      );
      if (existing) {
        return prev.map(item => 
          (item.product.id === pricedProduct.id && (item.size || '') === size && (item.color || '') === color)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product: pricedProduct, quantity, size, color }];
    });
    setShowToast({ productName: pricedProduct.name, quantity });
  };

  const removeFromCart = (productId: string, size: string = '', color: string = '') => {
    setCart(prev => prev.filter(item => 
      !(item.product.id === productId && (item.size || '') === size && (item.color || '') === color)
    ));
  };

  const updateQuantity = (productId: string, delta: number, size: string = '', color: string = '') => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId && (item.size || '') === size && (item.color || '') === color) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Live Order Tracking Search from Supabase
  const handleTrackOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackPhone) return;
    setIsTracking(true);
    setHasTracked(true);
    setSimulatedOrder(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price_at_purchase,
            products (
              name
            )
          )
        `)
        .eq('store_id', store.id)
        .eq('customer_phone', trackPhone.trim())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTrackedOrders(data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to track orders.");
    } finally {
      setIsTracking(false);
    }
  };

  // Simulated Order Tracking Search (for instant Order ID demo)
  const handleSimulatedTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedOrderId) return;
    
    // Simulate active order states
    setHasTracked(true);
    setSimulatedOrder({
      id: simulatedOrderId.toUpperCase(),
      created_at: new Date().toISOString(),
      customer_name: 'Premium Customer',
      total_amount: 320.00,
      status: 'shipped', // placed -> processing -> shipped -> out_for_delivery -> delivered
      est_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
      items: [
        { name: 'Signature Wool Overcoat', quantity: 1, price: 249.00 },
        { name: 'Luxury Cotton Hoodie', quantity: 1, price: 71.00 }
      ]
    });
  };

  const handleWhatsAppCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Place actual order in Supabase
      const { data: orderData, error } = await supabase.from('orders').insert([{
        store_id: store.id,
        customer_name: customerName,
        customer_email: customerPhone + '@whatsapp.com',
        customer_phone: customerPhone,
        shipping_address: customerAddress,
        total_amount: totalAmount,
        status: 'pending'
      }]).select().single();
      
      if (error) throw error;

      if (orderData && cart.length > 0) {
        const orderItems = cart.map(item => ({
          order_id: orderData.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price_at_purchase: item.product.price
        }));
        
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) console.error("Failed to insert items:", itemsError);
      }

      const storePhone = store.contact_phone ? store.contact_phone.replace(/\D/g, '') : '';
      
      let message = `*New Order - ${store.store_name}*\n\n`;
      message += `*Customer Details:*\n`;
      message += `Name: ${customerName}\n`;
      message += `Phone: ${customerPhone}\n`;
      message += `Address: ${customerAddress}\n\n`;
      message += `*Order Summary:*\n`;
      
      cart.forEach(item => {
        const sizeInfo = item.size ? ` (Size: ${item.size})` : '';
        const colorInfo = item.color ? ` (Color: ${item.color})` : '';
        message += `${item.quantity}x ${item.product.name}${sizeInfo}${colorInfo} - ${currencySymbol}${Number(item.product.price) * item.quantity}\n`;
      });
      
      message += `\n*Total Amount: ${currencySymbol}${totalAmount}*\n\n`;
      message += `Please confirm my order.`;

      const encodedMessage = encodeURIComponent(message);
      
      setCart([]);
      setIsCartOpen(false);
      setIsCheckout(false);
      
      if (storePhone) {
        window.open(`https://wa.me/${storePhone}?text=${encodedMessage}`, '_blank');
      } else {
        alert("Order placed successfully! (Note: Store owner has not configured their WhatsApp number).");
      }
      
    } catch (err) {
      console.error(err);
      alert("Failed to process order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="font-luxury-sans selection:bg-purple-600 selection:text-white bg-[#FCFCFC] min-h-screen flex flex-col">
      <style>{`
        :root {
          --store-primary: ${primaryColor};
          --store-primary-dark: ${darkColor};
          --store-primary-darker: ${darkerColor};
          --store-primary-light: ${lightColor};
          --store-primary-rgb: ${rgbString};
        }

        /* Selection highlight color overlay */
        ::selection {
          background-color: rgba(var(--store-primary-rgb), 0.3) !important;
          color: #fff !important;
        }
        .selection-custom::selection {
          background-color: var(--store-primary) !important;
          color: #fff !important;
        }

        /* Base Tailwind purple overrides */
        .bg-purple-50 { background-color: rgba(var(--store-primary-rgb), 0.1) !important; }
        .bg-purple-100 { background-color: rgba(var(--store-primary-rgb), 0.15) !important; }
        .bg-purple-500 { background-color: var(--store-primary) !important; }
        .bg-purple-600 { background-color: var(--store-primary) !important; }
        .bg-purple-700 { background-color: var(--store-primary-dark) !important; }
        
        .text-purple-500 { color: var(--store-primary) !important; }
        .text-purple-600 { color: var(--store-primary) !important; }
        .text-purple-700 { color: var(--store-primary-dark) !important; }
        .text-purple-800 { color: var(--store-primary-darker) !important; }
        .text-violet-600 { color: var(--store-primary) !important; }
        
        .border-purple-200 { border-color: rgba(var(--store-primary-rgb), 0.2) !important; }
        .border-purple-500 { border-color: rgba(var(--store-primary-rgb), 0.5) !important; }
        .border-purple-600 { border-color: var(--store-primary) !important; }
        
        .hover\\:bg-purple-50:hover { background-color: rgba(var(--store-primary-rgb), 0.1) !important; }
        .hover\\:bg-purple-600:hover { background-color: var(--store-primary) !important; }
        .hover\\:bg-purple-700:hover { background-color: var(--store-primary-dark) !important; }
        .hover\\:text-purple-600:hover { color: var(--store-primary) !important; }
        .hover\\:text-purple-700:hover { color: var(--store-primary-dark) !important; }
        .hover\\:border-purple-600:hover { border-color: var(--store-primary) !important; }
        .focus\\:border-purple-600:focus { border-color: var(--store-primary) !important; }
        
        .ring-purple-100 { --tw-ring-color: rgba(var(--store-primary-rgb), 0.15) !important; }
        .ring-purple-600 { --tw-ring-color: var(--store-primary) !important; }
        .hover\\:ring-purple-600:hover { --tw-ring-color: var(--store-primary) !important; }

        /* Tailwind Gradient overrides */
        .from-purple-700 {
          --tw-gradient-from: var(--store-primary-dark) !important;
          --tw-gradient-to: rgba(var(--store-primary-rgb), 0) !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
        }
        .via-indigo-800 {
          --tw-gradient-to: rgba(var(--store-primary-rgb), 0.9) !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--store-primary) 50%, var(--tw-gradient-to) !important;
        }
        .to-rose-600 {
          --tw-gradient-to: var(--store-primary-darker) !important;
        }
        
        .from-purple-600 {
          --tw-gradient-from: var(--store-primary) !important;
          --tw-gradient-to: rgba(var(--store-primary-rgb), 0) !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
        }
        .from-violet-600 {
          --tw-gradient-from: var(--store-primary) !important;
          --tw-gradient-to: rgba(var(--store-primary-rgb), 0) !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
        }
        .to-rose-500 {
          --tw-gradient-to: var(--store-primary-dark) !important;
        }
        
        .from-purple-400 {
          --tw-gradient-from: var(--store-primary) !important;
          --tw-gradient-to: rgba(var(--store-primary-rgb), 0) !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
        }
        .to-rose-400 {
          --tw-gradient-to: var(--store-primary-light) !important;
        }
        
        .from-violet-600 {
          --tw-gradient-from: var(--store-primary) !important;
          --tw-gradient-to: rgba(var(--store-primary-rgb), 0) !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
        }
      `}</style>
      
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-800 to-rose-600 text-white text-[10px] md:text-xs py-3 px-4 text-center tracking-[0.25em] uppercase font-bold shadow-sm">
        {announcementText}
      </div>

      {/* Dynamic Sticky Header Navigation */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Left: Logo & Store Name */}
          <Link href={`/store/${store.subdomain}`} className="flex items-center gap-3 group flex-shrink-0">
            {store.logo_url ? (
              <img 
                src={store.logo_url} 
                alt={store.store_name} 
                className="w-10 h-10 rounded-full object-cover border border-purple-200 shadow-sm transition-transform group-hover:scale-105"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-tr from-purple-600 to-rose-500 shadow-sm transition-transform group-hover:scale-105"
              >
                {store.store_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-lg md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-rose-600 tracking-tighter uppercase font-luxury-sans">
              {store.store_name}
            </h1>
          </Link>
          
          {/* Center: Search Bar with search icon */}
          <div className="hidden md:flex items-center flex-1 max-w-md relative">
            <input 
              type="text" 
              placeholder="Search premium products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 outline-none text-xs focus:border-purple-600 focus:bg-white transition-all rounded-full shadow-inner"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Actions Menu */}
          <div className="flex items-center justify-end gap-1.5 md:gap-3 flex-shrink-0">
            
            {/* Desktop Quick Nav Links */}
            <nav className="hidden lg:flex items-center gap-6 text-[11px] font-bold text-gray-400 tracking-widest uppercase mr-4">
              <a href="#" className="hover:text-purple-600 transition-colors">Home</a>
              <a href="#catalog" className="hover:text-purple-600 transition-colors">Shop</a>
              
              {/* Category Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)}
                  className="hover:text-purple-600 transition-colors flex items-center gap-1.5 uppercase font-bold tracking-widest text-[11px]"
                >
                  Categories <span className="text-[8px]">▼</span>
                </button>
                {isCategoriesDropdownOpen && (
                  <div className="absolute top-8 left-0 bg-white border border-gray-100 shadow-xl py-2 min-w-[160px] animate-in fade-in duration-200">
                    {categoriesList.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsCategoriesDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-purple-50 hover:text-purple-700 font-semibold"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => { setIsTrackOpen(true); setIsCartOpen(false); }}
                className="hover:text-purple-600 transition-colors uppercase font-bold tracking-widest"
              >
                Track Order
              </button>
            </nav>

            <button 
              onClick={() => { setIsTrackOpen(true); setIsCartOpen(false); }}
              className="text-[10px] md:text-xs font-black uppercase tracking-[0.15em] px-4 py-2.5 border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white transition-all duration-300 shadow-sm"
            >
              Track Order
            </button>
            
            {/* Wishlist Icon Button */}
            <button 
              onClick={() => setIsWishlistOpen(true)}
              className="p-2 text-gray-900 hover:bg-gray-50 rounded-full transition-colors relative"
              title="View Wishlist"
            >
              <Heart className="w-5 h-5 text-rose-500" />
              {favorites.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border border-white">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button 
              className="p-2.5 text-gray-900 relative flex items-center gap-2 hover:bg-gray-50 rounded-full transition-colors" 
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="w-5 h-5 text-purple-700" />
              {cartItemCount > 0 && (
                <span 
                  className="absolute top-1 right-1 w-5 h-5 rounded-full text-[9px] text-white flex items-center justify-center font-black bg-rose-500 border-2 border-white shadow-md animate-bounce"
                >
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="md:hidden px-4 pb-4.5">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 outline-none text-xs focus:border-purple-600 rounded-full"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </header>

      {/* Hero Carousel Section */}
      <section className="relative h-[65vh] md:h-[85vh] w-full overflow-hidden bg-gray-950">
        {carouselSlides.map((banner, index) => (
          <div 
            key={banner.id || index}
            className={`absolute inset-0 transition-all duration-[1200ms] ease-in-out ${index === currentSlide ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-950/20 to-gray-950/40 z-10"></div>
            <img 
              src={banner.image} 
              alt={banner.title} 
              className="w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto space-y-6">
              {banner.isPromo ? (
                <span className="text-white text-[10px] md:text-xs font-black uppercase tracking-[0.4em] bg-red-600/80 px-4 py-1.5 rounded-full border border-red-500/50 backdrop-blur-sm shadow-lg animate-pulse flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} /> SPECIAL SCHEDULED OFFER
                </span>
              ) : (
                <span className="text-white text-[10px] md:text-xs font-black uppercase tracking-[0.4em] bg-purple-600/35 px-4 py-1.5 rounded-full border border-purple-500/30 backdrop-blur-sm shadow-inner">
                  ✨ PREMIUM SHAPES AND COLOR SWATCHES
                </span>
              )}
              
              {banner.isPromo ? (
                <h2 className="text-3xl md:text-7xl font-extrabold text-white tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-amber-400 to-red-500">
                  {banner.title}
                </h2>
              ) : (
                <h2 className="text-3xl md:text-7xl font-extrabold text-white tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-purple-200">
                  {banner.title}
                </h2>
              )}
              
              <p className="text-xs md:text-base text-gray-200/90 max-w-xl leading-relaxed tracking-wider">
                {banner.subtitle}
              </p>
              
              <div className="flex gap-4 pt-4">
                {banner.isPromo ? (
                  <button 
                    onClick={() => setSelectedProduct(banner.product)}
                    className="px-8 py-4 bg-gradient-to-r from-red-600 to-amber-500 text-white text-xs font-black uppercase tracking-[0.25em] hover:opacity-90 active:scale-95 transition-all shadow-lg rounded-full animate-pulse"
                  >
                    {banner.cta}
                  </button>
                ) : (
                  <a 
                    href="#catalog"
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-rose-500 text-white text-xs font-black uppercase tracking-[0.25em] hover:opacity-90 transition-all shadow-lg rounded-full"
                  >
                    {banner.cta || 'SHOP NOW'}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2.5">
          {carouselSlides.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-500 ${idx === currentSlide ? 'bg-purple-500 w-8 shadow-md' : 'bg-white/40 w-2'}`}
            />
          ))}
        </div>
      </section>

      {/* Trust Benefits */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100 text-center">
            <div className="flex items-center justify-center gap-4 px-4 py-4 md:py-0">
              <Truck className="w-8 h-8 text-purple-600 stroke-[1.25]" />
              <div className="text-left">
                <h4 className="font-bold text-gray-950 text-xs tracking-wider uppercase">Free Global Shipping</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Complimentary shipping on orders over {currencySymbol}500</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 px-4 py-4 md:py-0">
              <Shield className="w-8 h-8 text-purple-600 stroke-[1.25]" />
              <div className="text-left">
                <h4 className="font-bold text-gray-950 text-xs tracking-wider uppercase">End-to-End Secure</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Shop safely and checkout via encrypted WhatsApp</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 px-4 py-4 md:py-0">
              <RefreshCw className="w-8 h-8 text-purple-600 stroke-[1.25]" />
              <div className="text-left">
                <h4 className="font-bold text-gray-950 text-xs tracking-wider uppercase">Hassle-Free Returns</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Complimentary 30-day return policy for peace of mind</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Display Catalog Section */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex-1">
        
        {/* Title and Controls Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b border-gray-100">
          <div>
            <h3 className="text-2xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-rose-600 tracking-tight font-luxury-sans">
              Discover Our Collection
            </h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-1 font-semibold">
              Find handcrafted excellence in a high-end luxury interface.
            </p>
          </div>

          {/* Filtering Categories & Sorting controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category selection */}
            <div className="flex flex-wrap gap-1.5">
              {categoriesList.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
                    selectedCategory === cat 
                      ? 'bg-purple-600 border-purple-600 text-white shadow-md'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-purple-600 hover:text-purple-600'
                  }`}
                >
                  {cat === 'All' ? 'All Filters' : cat}
                </button>
              ))}
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 bg-white shadow-sm ml-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="text-[10px] bg-transparent outline-none border-none font-bold uppercase tracking-wider text-gray-600 cursor-pointer"
              >
                <option value="Featured">Featured</option>
                <option value="Price: Low to High">Price: Low to High</option>
                <option value="Price: High to Low">Price: High to Low</option>
                <option value="Popularity">Popularity (Stars)</option>
                <option value="New Arrivals">New Arrivals</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic products list rendering */}
        {processedProducts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
            <EyeOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-widest">No Products Found</h3>
            <p className="text-gray-400 text-xs mt-1 uppercase tracking-wider">Try clearing search filter or selecting another category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {processedProducts.map((product) => {
              const isLiked = favorites.includes(product.id);

              // Parse dynamic flash sale offer from product description JSON
              let descText = product.description || '';
              let hasActiveOffer = false;
              let displayPrice = Number(product.price);
              let originalPrice = Number(product.price);
              let offerPercent = 0;
              let timeLeftText = '';

              try {
                if (product.description && product.description.startsWith('{')) {
                  const parsed = JSON.parse(product.description);
                  descText = parsed.description || '';
                  if (parsed.offer_ends_at && parsed.offer_price) {
                    const endTime = new Date(parsed.offer_ends_at).getTime();
                    const now = Date.now();
                    if (endTime > now) {
                      hasActiveOffer = true;
                      displayPrice = Number(parsed.offer_price);
                      originalPrice = Number(product.price);
                      offerPercent = Number(parsed.offer_percent) || 50;
                      
                      const diffMs = endTime - now;
                      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
                      if (diffHrs > 0) {
                        timeLeftText = `${diffHrs}h ${diffMins}m ${diffSecs}s`;
                      } else if (diffMins > 0) {
                        timeLeftText = `${diffMins}m ${diffSecs}s`;
                      } else {
                        timeLeftText = `${diffSecs}s`;
                      }
                    }
                  }
                }
              } catch (e) {
                // fallback
              }

              return (
                <div key={product.id} className="group relative flex flex-col bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                  
                  {/* Square 1:1 image layout with overlay buttons */}
                  <div className="relative aspect-square w-full bg-gray-50 overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(product)}>
                    {getProductImage(product) ? (
                      <img 
                        src={getProductImage(product)} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 font-bold text-gray-300 text-3xl font-luxury-serif">
                        {product.name[0]}
                      </div>
                    )}

                    {/* Dynamic Flash Sale Badge or New Badge */}
                    {hasActiveOffer ? (
                      <span className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-amber-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 shadow-sm flex items-center gap-1 rounded-sm animate-pulse">
                        🔥 {offerPercent}% OFF ({timeLeftText})
                      </span>
                    ) : product.is_new ? (
                      <span className="absolute top-3 left-3 bg-purple-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 shadow-sm">
                        NEW
                      </span>
                    ) : null}

                    {/* Heart button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product.id);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 shadow-sm text-gray-500 hover:text-red-500 transition-colors z-20"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                    </button>

                    {/* Hover Quick View Eyeball button */}
                    <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                        className="p-3 bg-white text-gray-900 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
                        title="Quick View Details"
                      >
                        <Eye className="w-4 h-4 text-purple-700" />
                      </button>
                    </div>

                    {/* Quick Add Bottom Slide up */}
                    <div className="absolute bottom-3 left-3 right-3 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const sizes = getProductSizes(product);
                          if (sizes.length > 0) {
                            setSelectedProduct(product);
                          } else {
                            addToCart(product, 1);
                          }
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-rose-500 text-white font-black uppercase text-[9px] tracking-[0.2em] shadow-lg hover:opacity-90 transition-all"
                      >
                        Quick Add
                      </button>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black text-purple-600 tracking-widest uppercase block">{getProductCategory(product)}</span>
                      <h4 
                        onClick={() => setSelectedProduct(product)}
                        className="font-bold text-gray-950 text-xs md:text-sm hover:underline cursor-pointer line-clamp-1 mt-0.5"
                      >
                        {product.name}
                      </h4>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <div className="flex text-yellow-400">
                          <Star className="w-3 h-3 fill-current" />
                          <Star className="w-3 h-3 fill-current" />
                          <Star className="w-3 h-3 fill-current" />
                          <Star className="w-3 h-3 fill-current" />
                          <Star className="w-3 h-3 fill-current" />
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold">5.0</span>
                      </div>
                      
                      {hasActiveOffer ? (
                        <div className="flex items-baseline gap-2">
                          <span className="font-extrabold text-purple-700 text-sm md:text-base">
                            {currencySymbol}{displayPrice.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-gray-400 line-through font-bold">
                            {currencySymbol}{originalPrice.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <div className="font-extrabold text-purple-700 text-sm md:text-base">
                          {currencySymbol}{Number(product.price).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* Shopping Cart Drawer Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div className="absolute inset-0 bg-black/10 transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-950 tracking-tight uppercase">Your Shopping Cart</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Review selected choices before ordering.</p>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-400 hover:text-gray-950 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items container */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#FCFCFC] space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-7 h-7 text-purple-500 stroke-[1.2]" />
                  </div>
                  <p className="font-bold text-gray-950 uppercase tracking-widest text-xs">Your cart is empty</p>
                  <button onClick={() => setIsCartOpen(false)} className="px-6 py-3 bg-purple-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-purple-700 transition-colors">
                    Continue Shopping
                  </button>
                </div>
              ) : isCheckout ? (
                <form id="checkout-form" onSubmit={handleWhatsAppCheckout} className="space-y-4 bg-white p-5 border border-gray-100 shadow-sm rounded-none">
                  <h3 className="font-black text-gray-950 text-xs uppercase tracking-widest mb-3 border-b pb-2">Delivery Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Full Name *</label>
                      <input required type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full h-10 px-3 border border-gray-200 outline-none text-xs focus:border-purple-600 transition-colors" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">WhatsApp Mobile *</label>
                      <input required type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full h-10 px-3 border border-gray-200 outline-none text-xs focus:border-purple-600 transition-colors" placeholder="9876543210" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Shipping Address *</label>
                      <textarea required value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="w-full p-3 border border-gray-200 outline-none text-xs focus:border-purple-600 transition-colors min-h-[90px]" placeholder="Enter home address..." />
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-4 bg-white p-4 border border-gray-100 shadow-sm">
                      <div className="w-16 h-20 bg-gray-50 border border-gray-100 flex-shrink-0 relative">
                        {getProductImage(item.product) ? (
                          <img src={getProductImage(item.product)} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-300 bg-gray-100 text-lg">
                            {item.product.name[0]}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] font-black text-purple-600 tracking-wider uppercase block">{getProductCategory(item.product)}</span>
                              <h4 className="font-bold text-gray-950 text-xs line-clamp-1">{item.product.name}</h4>
                              {(item.size || item.color) && (
                                <span className="text-[9px] text-gray-400 font-bold block mt-0.5 uppercase tracking-wider">
                                  {item.size && `Size: ${item.size}`} {item.size && item.color && '|'} {item.color && `Color: ${item.color}`}
                                </span>
                              )}
                            </div>
                            <button onClick={() => removeFromCart(item.product.id, item.size, item.color)} className="text-gray-400 hover:text-red-500 p-1"><X className="w-3.5 h-3.5"/></button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-gray-100 bg-white">
                            <button onClick={() => updateQuantity(item.product.id, -1, item.size, item.color)} className="px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50">-</button>
                            <span className="px-2 py-0.5 font-bold text-xs text-gray-900">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, 1, item.size, item.color)} className="px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50">+</button>
                          </div>
                          <p className="font-extrabold text-purple-700 text-xs">{currencySymbol}{(Number(item.product.price) * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subtotals & Actions */}
            {cart.length > 0 && (
              <div className="border-t border-gray-100 p-6 bg-white space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-950">{currencySymbol}{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Shipping</span>
                    <span className="text-green-600 font-extrabold uppercase text-[10px] tracking-widest">FREE</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-gray-900 font-bold uppercase tracking-wider">
                    <span>Total Amount</span>
                    <span className="font-black text-xl text-purple-700">{currencySymbol}{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {isCheckout ? (
                  <div className="space-y-3">
                    <button 
                      type="submit" 
                      form="checkout-form"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-gradient-to-r from-purple-700 to-rose-500 text-white font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Order via WhatsApp'}
                    </button>
                    <button onClick={() => setIsCheckout(false)} className="w-full py-2.5 text-xs text-gray-400 font-bold uppercase tracking-widest hover:text-gray-900">
                      Back to Cart
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsCheckout(true)}
                    className="w-full py-4 bg-gradient-to-r from-purple-700 to-rose-500 text-white font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:opacity-90 shadow-md"
                  >
                    Proceed to Checkout <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wishlist Sidebar Drawer */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/10 transition-opacity" onClick={() => setIsWishlistOpen(false)} />
          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-950 tracking-tight uppercase flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-current" /> My Wishlist
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Your curated list of premium items.</p>
              </div>
              <button onClick={() => setIsWishlistOpen(false)} className="p-2 text-gray-400 hover:text-gray-950 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[#FCFCFC] space-y-4">
              {favorites.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 text-center">
                  <Heart className="w-10 h-10 text-gray-200 stroke-[1.2]" />
                  <p className="font-bold text-gray-950 uppercase tracking-widest text-xs">No favorites added yet</p>
                  <p className="text-[10px] text-gray-400 max-w-[200px] leading-relaxed">Save items by clicking the heart icon on cards.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favorites.map(id => {
                    const prod = displayProducts.find(p => p.id === id);
                    if (!prod) return null;
                    return (
                      <div key={prod.id} className="flex gap-4 bg-white p-3 border border-gray-100 shadow-sm items-center">
                        <div className="w-12 h-16 bg-gray-50 flex-shrink-0 relative">
                          {getProductImage(prod) ? (
                            <img src={getProductImage(prod)} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-300 text-xs">{prod.name[0]}</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-gray-950 truncate">{prod.name}</h4>
                          <span className="text-[10px] font-black text-purple-700 block mt-0.5">{currencySymbol}{prod.price}</span>
                        </div>
                        <button 
                          onClick={() => {
                            addToCart(prod, 1);
                            setIsWishlistOpen(false);
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-[9px] uppercase tracking-wider rounded"
                        >
                          Add to Cart
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Quick View Detail Modal popup */}
      {selectedProduct && (() => {
        const activeProduct = getProductWithActivePrice(selectedProduct);
        const hasOffer = Number(activeProduct.price) < Number(selectedProduct.price);
        const offerPercent = selectedProduct.description && selectedProduct.description.startsWith('{')
          ? JSON.parse(selectedProduct.description).offer_percent || 50
          : 50;

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/25 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 max-w-4xl w-full shadow-2xl relative overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute top-4 right-4 z-30 p-2 bg-white/90 hover:bg-white text-gray-950 rounded-full shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full md:w-1/2 bg-[#FCFCFC] p-6 flex flex-col justify-center items-center border-r border-gray-100">
              <div className="relative aspect-square w-full max-w-sm border border-gray-200 shadow-sm bg-white overflow-hidden">
                {getProductImage(selectedProduct) ? (
                  <img src={getProductImage(selectedProduct)} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-300 text-5xl bg-gray-100">
                    {selectedProduct.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-1/2 p-8 overflow-y-auto max-h-[85vh] md:max-h-full space-y-6">
              <div>
                <span className="text-[10px] font-black text-purple-600 tracking-[0.25em] uppercase block mb-1">
                  {getProductCategory(selectedProduct)}
                </span>
                <h2 className="text-xl md:text-2xl font-black text-gray-950 tracking-tight leading-tight">
                  {selectedProduct.name}
                </h2>
                
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex text-yellow-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="text-xs text-gray-500 font-bold">5.0 (Review Rating)</span>
                </div>
              </div>

              <div className="flex items-baseline gap-4 pt-1">
                {hasOffer ? (
                  <>
                    <span className="text-2xl font-black text-purple-700">
                      {currencySymbol}{Number(activeProduct.price).toLocaleString()}
                    </span>
                    <span className="text-base text-gray-400 line-through font-bold">
                      {currencySymbol}{Number(selectedProduct.price).toLocaleString()}
                    </span>
                    <span className="bg-red-100 text-red-700 text-[10px] font-black uppercase px-2 py-0.5 tracking-wider rounded-sm animate-pulse">
                      🔥 {offerPercent}% OFF FLASH SALE
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-black text-purple-700">
                    {currencySymbol}{Number(selectedProduct.price).toLocaleString()}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                {getProductDescription(selectedProduct) || 'Premium design with excellent attention to detail. Blending organic modern textures with ergonomic luxury to serve dynamic, fine retail experiences.'}
              </p>


              {(() => {
                const productColors = getProductColors(selectedProduct);
                if (productColors.length === 0) return null;
                
                const getColorHex = (colorName: string) => {
                  const c = colorName.trim().toLowerCase();
                  if (c.startsWith('#')) return c;
                  const map: Record<string, string> = {
                    black: '#121212',
                    white: '#FFFFFF',
                    gray: '#64748B',
                    grey: '#64748B',
                    purple: '#A855F7',
                    navy: '#1E3A8A',
                    blue: '#3B82F6',
                    red: '#EF4444',
                    green: '#10B981',
                    yellow: '#FBBF24',
                    orange: '#F97316',
                    pink: '#EC4899',
                    brown: '#78350F',
                    alabaster: '#F2EFE9',
                    cream: '#FFFDD0',
                    beige: '#F5F5DC',
                    'slate blue': '#64748B',
                    'midnight': '#1E293B'
                  };
                  return map[c] || c;
                };

                return (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">
                      COLOR: <span className="text-gray-950 font-black tracking-normal ml-1">{selectedColor.toUpperCase()}</span>
                    </span>
                    <div className="flex gap-3 items-center">
                      {productColors.map((color: string) => {
                        const hex = getColorHex(color);
                        const isSelected = selectedColor.trim().toLowerCase() === color.trim().toLowerCase();
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            style={{ backgroundColor: hex }}
                            className={`w-6 h-6 rounded-full border transition-all duration-300 relative ${
                              isSelected
                                ? 'ring-2 ring-purple-600 ring-offset-2 scale-110 border-transparent shadow-sm'
                                : 'border-gray-200 hover:scale-105 hover:ring-1 hover:ring-purple-600 hover:ring-offset-1'
                            }`}
                            title={color}
                          >
                            {color.toLowerCase() === 'white' && (
                              <span className="absolute inset-0 rounded-full border border-gray-200 pointer-events-none" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Size swatches */}
              {(() => {
                const productSizes = getProductSizes(selectedProduct);
                if (productSizes.length === 0) return null;
                return (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Select Size</span>
                    <div className="flex gap-2 flex-wrap">
                      {productSizes.map((size: string) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`w-9 h-9 text-[10px] font-bold border transition-all ${
                            selectedSize === size
                              ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-500 hover:border-purple-600 hover:text-purple-600'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={() => addToCart(selectedProduct, 1, selectedSize, selectedColor)}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-700 to-rose-500 text-white font-black uppercase text-xs tracking-[0.2em] shadow-md hover:opacity-95 transition-all"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Track Order Sidebar Modal (With gorgeous progress bar step tracker) */}
      {isTrackOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div className="absolute inset-0 bg-black/10 transition-opacity" onClick={() => setIsTrackOpen(false)} />
          <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-950 tracking-tight uppercase flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" /> Order Tracking Service
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Check real-time shipping progress & details.</p>
              </div>
              <button onClick={() => setIsTrackOpen(false)} className="p-2 text-gray-400 hover:text-gray-950 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col">
              
              {/* Database lookup search */}
              <form onSubmit={handleTrackOrders} className="space-y-4 bg-white p-5 border border-gray-200 shadow-sm mb-4">
                <h4 className="text-[10px] font-black text-gray-400 tracking-wider uppercase">Search by WhatsApp Mobile Number</h4>
                <div className="flex gap-2">
                  <input 
                    required 
                    type="tel" 
                    value={trackPhone} 
                    onChange={e => setTrackPhone(e.target.value)} 
                    className="flex-1 h-11 px-4 border border-gray-200 outline-none text-xs focus:border-purple-600 bg-white" 
                    placeholder="e.g. 9876543210" 
                  />
                  <button 
                    type="submit" 
                    disabled={isTracking}
                    className="px-5 bg-purple-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {isTracking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                  </button>
                </div>
              </form>

              {/* Simulated Order ID search */}
              <form onSubmit={handleSimulatedTracking} className="space-y-4 bg-white p-5 border border-gray-200 shadow-sm mb-6">
                <h4 className="text-[10px] font-black text-gray-400 tracking-wider uppercase">Simulate by Entering Order ID</h4>
                <div className="flex gap-2">
                  <input 
                    required 
                    type="text" 
                    value={simulatedOrderId} 
                    onChange={e => setSimulatedOrderId(e.target.value)} 
                    className="flex-1 h-11 px-4 border border-gray-200 outline-none text-xs focus:border-purple-600 bg-white" 
                    placeholder="e.g. ORDER-994" 
                  />
                  <button 
                    type="submit" 
                    className="px-5 bg-rose-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-colors"
                  >
                    Track ID
                  </button>
                </div>
              </form>

              {/* Order Results rendering */}
              <div className="flex-1 space-y-4 overflow-y-auto">
                {!hasTracked ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center py-12">
                    <Truck className="w-8 h-8 text-gray-300 mb-2 stroke-[1.2]" />
                    <p className="font-bold text-gray-950 uppercase tracking-widest text-[10px]">No active searches yet</p>
                    <p className="text-[10px] text-gray-400 max-w-[250px] mt-1">Enter your phone number or simulate with a custom Order ID above.</p>
                  </div>
                ) : simulatedOrder ? (
                  /* GORGEOUS STEP-BY-STEP PROGRESS BAR (Simulated / Instant Demo) */
                  <div className="bg-white p-6 border border-gray-200 shadow-sm space-y-6">
                    <div className="flex justify-between items-start border-b pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-black text-purple-600">ID: #{simulatedOrder.id}</span>
                        <div className="text-[10px] text-gray-400 mt-0.5">Est. Delivery: <span className="text-gray-900 font-bold">{simulatedOrder.est_delivery}</span></div>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 text-[9px] font-black tracking-wider uppercase bg-purple-50 text-purple-700 border border-purple-200">
                        {simulatedOrder.status}
                      </span>
                    </div>

                    {/* Progress checkpoints vertical bar */}
                    <div className="space-y-5 relative pl-7 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                      
                      {/* Step 1: Placed */}
                      <div className="relative">
                        <div className="absolute -left-[24px] top-1 w-[12px] h-[12px] rounded-full bg-purple-600 border-2 border-white ring-4 ring-purple-100 flex items-center justify-center" />
                        <h5 className="text-xs font-black text-gray-900">Order Placed</h5>
                        <p className="text-[10px] text-gray-400">Your order has been registered securely.</p>
                      </div>

                      {/* Step 2: Processing */}
                      <div className="relative">
                        <div className="absolute -left-[24px] top-1 w-[12px] h-[12px] rounded-full bg-purple-600 border-2 border-white ring-4 ring-purple-100 flex items-center justify-center" />
                        <h5 className="text-xs font-black text-gray-900">Processing</h5>
                        <p className="text-[10px] text-gray-400">Quality check and luxury packaging complete.</p>
                      </div>

                      {/* Step 3: Shipped */}
                      <div className="relative">
                        <div className="absolute -left-[24px] top-1 w-[12px] h-[12px] rounded-full bg-purple-600 border-2 border-white ring-4 ring-purple-100 flex items-center justify-center animate-ping" />
                        <div className="absolute -left-[24px] top-1 w-[12px] h-[12px] rounded-full bg-purple-600 border-2 border-white ring-4 ring-purple-100 flex items-center justify-center" />
                        <h5 className="text-xs font-black text-purple-700">Shipped</h5>
                        <p className="text-[10px] text-purple-600 font-semibold">In transit via DHL premium express courier.</p>
                      </div>

                      {/* Step 4: Out for Delivery */}
                      <div className="relative opacity-50">
                        <div className="absolute -left-[24px] top-1 w-[12px] h-[12px] rounded-full bg-gray-200 border-2 border-white flex items-center justify-center" />
                        <h5 className="text-xs font-bold text-gray-500">Out for Delivery</h5>
                        <p className="text-[10px] text-gray-400">Local courier will deliver to your doorstep today.</p>
                      </div>

                      {/* Step 5: Delivered */}
                      <div className="relative opacity-50">
                        <div className="absolute -left-[24px] top-1 w-[12px] h-[12px] rounded-full bg-gray-200 border-2 border-white flex items-center justify-center" />
                        <h5 className="text-xs font-bold text-gray-500">Delivered</h5>
                        <p className="text-[10px] text-gray-400">Delivered & confirmed by customer signature.</p>
                      </div>

                    </div>

                    <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-400 uppercase tracking-widest">Total Value</span>
                      <span className="font-black text-gray-950">{currencySymbol}{simulatedOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                ) : trackedOrders.length === 0 ? (
                  <div className="text-center p-6 bg-white border border-gray-100 rounded-none py-10">
                    <p className="font-bold text-gray-900 uppercase tracking-widest text-xs">No orders found</p>
                    <p className="text-[11px] text-gray-400 mt-1">No registered orders matching search parameters.</p>
                  </div>
                ) : (
                  /* Database results step tracker rendering */
                  <div className="space-y-4">
                    {trackedOrders.map((order) => {
                      const isProcessing = order.status === 'processing' || order.status === 'pending';
                      const isShipped = order.status === 'shipped';
                      const isDelivered = order.status === 'completed' || order.status === 'delivered';
                      
                      return (
                        <div key={order.id} className="bg-white p-5 border border-gray-200 shadow-sm space-y-5">
                          <div className="flex justify-between items-start border-b pb-3">
                            <div>
                              <span className="text-[10px] font-mono font-black text-purple-600">ID: #{order.id.substring(0, 8).toUpperCase()}</span>
                              <div className="text-[10px] text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleDateString()}</div>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase bg-purple-50 text-purple-700 border border-purple-200">
                              {order.status || 'pending'}
                            </span>
                          </div>

                          {/* Progress checkpoints vertical bar */}
                          <div className="space-y-4.5 relative pl-7 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                            
                            <div className="relative">
                              <div className="absolute -left-[24px] top-1 w-[12px] h-[12px] rounded-full bg-purple-600 border-2 border-white ring-4 ring-purple-100" />
                              <h5 className="text-xs font-black text-gray-900">Order Placed</h5>
                            </div>

                            <div className={`relative ${isProcessing || isShipped || isDelivered ? '' : 'opacity-40'}`}>
                              <div className={`absolute -left-[24px] top-1 w-[12px] h-[12px] rounded-full border-2 border-white ${isProcessing || isShipped || isDelivered ? 'bg-purple-600 ring-4 ring-purple-100' : 'bg-gray-200'}`} />
                              <h5 className="text-xs font-black text-gray-900">Processing</h5>
                            </div>

                            <div className={`relative ${isShipped || isDelivered ? '' : 'opacity-40'}`}>
                              <div className={`absolute -left-[24px] top-1 w-[12px] h-[12px] rounded-full border-2 border-white ${isShipped || isDelivered ? 'bg-purple-600 ring-4 ring-purple-100' : 'bg-gray-200'}`} />
                              <h5 className="text-xs font-black text-gray-900">Shipped</h5>
                            </div>

                            <div className={`relative ${isDelivered ? '' : 'opacity-40'}`}>
                              <div className={`absolute -left-[24px] top-1 w-[12px] h-[12px] rounded-full border-2 border-white ${isDelivered ? 'bg-purple-600 ring-4 ring-purple-100 animate-ping' : 'bg-gray-200'}`} />
                              <div className={`absolute -left-[24px] top-1 w-[12px] h-[12px] rounded-full border-2 border-white ${isDelivered ? 'bg-purple-600 ring-4 ring-purple-100' : 'bg-gray-200'}`} />
                              <h5 className="text-xs font-black text-gray-900">Delivered</h5>
                            </div>

                          </div>

                          <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-400 uppercase tracking-widest">Total Value</span>
                            <span className="font-black text-gray-950">{currencySymbol}{Number(order.total_amount).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Footer Area */}
      <footer id="contact" className="bg-gray-950 text-white border-t border-white/5 py-20 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            
            <div className="space-y-4">
              <h4 className="text-lg font-black tracking-tighter uppercase font-luxury-sans bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-rose-400">{store.store_name}</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-light">
                {parsedDesc || 'Experience the future of premium retail. Hand-curated elements created for a timeless, beautiful lifestyle.'}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-300">Quick Links</h4>
              <ul className="space-y-2.5 text-xs text-gray-400 font-light">
                <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#catalog" className="hover:text-white transition-colors">Catalog Collection</a></li>
                <li><button onClick={() => { setIsTrackOpen(true); setIsCartOpen(false); }} className="hover:text-white transition-colors">Order Tracking</button></li>
                <li><a href="#catalog" className="hover:text-white transition-colors">Featured Deals</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-300">Store Support</h4>
              <ul className="space-y-2.5 text-xs text-gray-400 font-light">
                <li><span>WhatsApp Helpdesk</span></li>
                <li><span>24/7 Fast Delivery Services</span></li>
                <li><span>Secure payments</span></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-300">Business Details</h4>
              <ul className="space-y-2.5 text-xs text-gray-400 font-light">
                <li className="flex flex-col"><span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Category</span><span>{store.business_category || 'Retail Outlet'}</span></li>
                <li className="flex flex-col"><span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Contact</span><span>{store.contact_phone || 'WhatsApp Support'}</span></li>
              </ul>
            </div>

          </div>

          <div className="border-t border-white/5 mt-16 pt-8 text-center text-[10px] text-gray-500 font-bold uppercase tracking-[0.25em]">
            &copy; {new Date().getFullYear()} {store.store_name}. Powered by Kadaikaran Luxe Engine. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Beautiful bottom toast when adding to cart */}
      {showToast && (
        <div 
          style={{ 
            position: 'fixed', 
            bottom: '32px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 99999 
          }}
          className="w-[92%] max-w-md bg-white/95 backdrop-blur-md text-gray-900 px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-between gap-4 border border-gray-100 rounded-2xl animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-violet-600 uppercase font-black tracking-widest font-luxury-sans">Added to Cart</p>
              <p className="text-xs font-bold truncate text-gray-900 mt-0.5">{showToast.productName} ({showToast.quantity}x)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button 
              onClick={() => {
                setIsCartOpen(true);
                setShowToast(null);
              }}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-rose-500 hover:opacity-90 active:scale-95 text-[10px] font-black uppercase tracking-widest text-white shadow-sm rounded-full transition-all duration-200"
            >
              View Cart
            </button>
            <button 
              onClick={() => setShowToast(null)} 
              className="p-1.5 text-gray-400 hover:text-gray-950 transition-colors rounded-full hover:bg-gray-100"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
