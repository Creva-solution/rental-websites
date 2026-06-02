'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, Menu, Search, X, Loader2, User, ChevronLeft, ChevronRight, 
  Truck, Shield, RefreshCw, ArrowRight, Heart, Star, Check, Eye, ArrowUpDown, 
  Sparkles, Package, ShoppingBag, EyeOff, Calendar, Clock, Instagram, Facebook, Twitter, Youtube, Linkedin, MessageCircle
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

const renderBenefitIcon = (iconName: string) => {
  const cn = "w-8 h-8 text-purple-600 stroke-[1.25] flex-shrink-0";
  switch (iconName) {
    case 'Shield': return <Shield className={cn} />;
    case 'RefreshCw': return <RefreshCw className={cn} />;
    case 'Heart': return <Heart className={cn} />;
    case 'Star': return <Star className={cn} />;
    case 'Sparkles': return <Sparkles className={cn} />;
    case 'Package': return <Package className={cn} />;
    case 'ShoppingBag': return <ShoppingBag className={cn} />;
    case 'Clock': return <Clock className={cn} />;
    case 'Truck':
    default:
      return <Truck className={cn} />;
  }
};

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;
  
  // Handle shorts e.g. youtube.com/shorts/ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([^/?#]+)/);
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  }
  
  // Handle watch?v=ID
  const watchMatch = url.match(/[?&]v=([^&#]+)/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  
  // Handle youtu.be/ID
  const beMatch = url.match(/youtu\.be\/([^/?#]+)/);
  if (beMatch && beMatch[1]) {
    return `https://www.youtube.com/embed/${beMatch[1]}`;
  }
  
  return url;
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

  const [globalSettings, setGlobalSettings] = useState<any>(null);

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const { data } = await supabase
          .from('stores')
          .select('description')
          .eq('subdomain', '__creva_saas_global_settings__')
          .maybeSingle();
        if (data && data.description) {
          setGlobalSettings(JSON.parse(data.description));
        }
      } catch (e) {
        console.error("Failed to load global settings:", e);
      }
    };
    fetchGlobalSettings();
  }, []);

  // Parse custom metadata for banner slideshow & announcement bar message
  let parsedDesc = store.description || '';
  let customBanners = [];
  let announcementText = `✨ EXCLUSIVE SPRING SALE: FREE SHIPPING ON ALL ORDERS OVER ${currencySymbol}500 ✨`;
  let socialLinks = { instagram: '', facebook: '', twitter: '', youtube: '', linkedin: '' };
  let flashAd: any = null;
  let selectedTemplate: 'minimal' | 'artisan' | 'bold' | 'luxe' | 'retro' | 'admire' = 'minimal';
  let benefits = {
    enabled: true,
    items: [
      {
        icon: 'Truck',
        title: 'Free Global Shipping',
        subtitle: `Complimentary shipping on orders over ${currencySymbol}500`
      },
      {
        icon: 'Shield',
        title: 'End-to-End Secure',
        subtitle: 'Shop safely and checkout via encrypted WhatsApp'
      },
      {
        icon: 'RefreshCw',
        title: 'Hassle-Free Returns',
        subtitle: 'Complimentary 30-day return policy for peace of mind'
      }
    ]
  };

  let activeCoupons: any[] = [];
  let blogArticles: any[] = [];
  let customPages: any[] = [];
  let videoReels: any[] = [];

  try {
    if (store.description && store.description.startsWith('{')) {
      const data = JSON.parse(store.description);
      parsedDesc = data.description || '';
      customBanners = data.banners || [];
      if (data.announcement) {
        announcementText = data.announcement;
      }
      socialLinks = {
        instagram: data.instagram || '',
        facebook: data.facebook || '',
        twitter: data.twitter || '',
        youtube: data.youtube || '',
        linkedin: data.linkedin || ''
      };
      if (data.flashAd) {
        flashAd = data.flashAd;
      }
      if (data.selectedTemplate) {
        selectedTemplate = data.selectedTemplate;
      } else if (data.template) {
        selectedTemplate = data.template;
      }
      if (data.benefits) {
        benefits = {
          enabled: data.benefits.enabled !== false,
          items: data.benefits.items || benefits.items
        };
      }

      // Extract competitor features
      activeCoupons = data.discountCoupons || data.discounts || data.coupons || [];
      blogArticles = data.articles || data.blogPosts || data.blog || [];
      customPages = data.pages || data.staticPages || [];
      videoReels = data.videoCommerce || data.reels || data.videos || [];
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
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [artisanHeroError, setArtisanHeroError] = useState(false);
  const [luxeHeroError, setLuxeHeroError] = useState(false);

  // Active Coupon & Discount Codes States
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  // Blog & Pages Overlay States
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [selectedPage, setSelectedPage] = useState<any>(null);

  // Automatically trigger the Flash Advertisement Pop-up Modal on load EXACTLY ONCE per session
  useEffect(() => {
    if (flashAd && flashAd.enabled) {
      if (typeof window !== 'undefined') {
        const hasShownAd = sessionStorage.getItem(`shown_flash_ad_${store.id}`);
        if (!hasShownAd) {
          const timer = setTimeout(() => {
            setShowAdPopup(true);
            sessionStorage.setItem(`shown_flash_ad_${store.id}`, 'true');
          }, 1000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [flashAd, store.id]);

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

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
    if (carouselSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [carouselSlides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);

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

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    
    const value = Number(appliedCoupon.value || 0);
    const minLimit = Number(appliedCoupon.minPurchase || appliedCoupon.min_purchase || 0);
    
    // Re-validate threshold in case items were removed
    if (totalAmount < minLimit) {
      return 0;
    }
    
    if (appliedCoupon.type === 'percentage') {
      return Math.round((totalAmount * value) / 100);
    } else {
      // Fixed discount
      return Math.min(value, totalAmount);
    }
  }, [appliedCoupon, totalAmount]);

  const finalTotalAmount = Math.max(0, totalAmount - discountAmount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    
    if (!couponInput.trim()) {
      setCouponError('Please enter a valid coupon code.');
      return;
    }
    
    const cleanCode = couponInput.trim().toUpperCase();
    
    // Find the coupon in our list
    const found = activeCoupons.find(c => c.code.trim().toUpperCase() === cleanCode);
    
    if (!found || found.isActive === false) {
      setCouponError('Invalid coupon code. Please try another one.');
      setAppliedCoupon(null);
      return;
    }
    
    // Check minimum purchase limit
    const minLimit = Number(found.minPurchase || found.min_purchase || 0);
    if (totalAmount < minLimit) {
      setCouponError(`This coupon requires a minimum purchase of ${currencySymbol}${minLimit.toLocaleString()}.`);
      setAppliedCoupon(null);
      return;
    }
    
    // Applied successfully!
    setAppliedCoupon(found);
    setCouponError('');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

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
        total_amount: finalTotalAmount,
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
      
      if (appliedCoupon) {
        message += `\nSubtotal: ${currencySymbol}${totalAmount}\n`;
        message += `Discount Code: ${appliedCoupon.code} (-${appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `${currencySymbol}${appliedCoupon.value}`})\n`;
        message += `Discount Amount: -${currencySymbol}${discountAmount}\n`;
        message += `*Total Amount: ${currencySymbol}${finalTotalAmount}*\n\n`;
      } else {
        message += `\n*Total Amount: ${currencySymbol}${totalAmount}*\n\n`;
      }
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

  const renderAnnouncementBar = () => {
    if (selectedTemplate === 'bold') {
      return (
        <div className="announcement-bar-theme text-xs py-3.5 border-b-4 border-black bg-black text-white font-black uppercase tracking-[0.2em] relative overflow-hidden h-12 flex items-center">
          <div className="absolute whitespace-nowrap animate-marquee flex gap-10">
            <span>{announcementText}</span>
            <span>{announcementText}</span>
            <span>{announcementText}</span>
            <span>{announcementText}</span>
          </div>
        </div>
      );
    }
    return (
      <div className="announcement-bar-theme text-[10px] sm:text-xs py-3 px-4 text-center tracking-[0.25em] uppercase font-bold shadow-sm">
        {announcementText}
      </div>
    );
  };

  const renderHeader = () => {
    switch (selectedTemplate) {
      case 'retro':
        return (
          <>
            {/* Desktop Fixed Left Sidebar Header Navigation */}
            <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-80 bg-zinc-950 text-[#10B981] border-r-4 border-black p-6 z-40 overflow-y-auto font-mono">
              <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b-4 border-[#10B981]/30">
                <div className="w-16 h-16 rounded bg-[#10B981]/5 border-2 border-[#10B981] flex items-center justify-center text-[#10B981] font-black text-2xl overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.store_name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{store.store_name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h1 className="font-extrabold text-sm uppercase tracking-widest text-[#10B981] drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                    {store.store_name}
                  </h1>
                  <p className="text-[9px] text-[#10B981]/70 font-bold uppercase mt-1">SYSTEM ONLINE v1.99</p>
                </div>
              </div>

              {/* Digital Clock Display */}
              <div className="mt-4 p-3 bg-zinc-900/60 border border-[#10B981]/30 rounded text-center text-xs">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">LOCAL SYSTEM TIME</div>
                <div className="font-bold text-[#10B981] mt-1 tracking-widest font-mono">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>

              {/* Sidebar Menu Items */}
              <nav className="flex flex-col gap-4 mt-8 uppercase text-xs">
                <button onClick={() => setIsAboutOpen(true)} className="text-left py-2.5 px-3 border border-[#10B981]/20 hover:bg-[#10B981]/10 rounded transition-all text-[#10B981] font-bold">
                  [ ABOUT_SYSTEM ]
                </button>
                <a href="#catalog" className="text-left py-2.5 px-3 border border-[#10B981]/20 hover:bg-[#10B981]/10 rounded transition-all text-[#10B981] font-bold">
                  [ SHOP_CATALOG.EXE ]
                </a>
                <button onClick={() => { setIsTrackOpen(true); setIsCartOpen(false); }} className="text-left py-2.5 px-3 border border-[#10B981]/20 hover:bg-[#10B981]/10 rounded transition-all text-[#10B981] font-bold">
                  [ ORDER_TRACK.SYS ]
                </button>
              </nav>

              {/* Action buttons (Cart / Wishlist) */}
              <div className="mt-auto space-y-3 pt-6 border-t-2 border-[#10B981]/20">
                <button 
                  onClick={() => setIsWishlistOpen(true)} 
                  className="w-full py-2.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/25 border border-red-500 rounded text-red-500 text-[10px] font-black transition-all flex items-center justify-between px-4"
                >
                  <span>WISHLIST.SYS</span>
                  <span>({favorites.length})</span>
                </button>
                <button 
                  onClick={() => setIsCartOpen(true)} 
                  className="w-full py-3 bg-[#10B981] hover:bg-[#10B981]/90 active:scale-95 border-2 border-black text-black text-[10px] font-black transition-all flex items-center justify-between px-4 shadow-[3px_3px_0px_rgba(16,185,129,0.3)]"
                >
                  <span>RUN CART.EXE</span>
                  <span>({cartItemCount})</span>
                </button>
              </div>
            </aside>

            {/* Mobile Header Navigation for Retro */}
            <header className="header-theme sticky top-0 z-40 transition-all shadow-sm lg:hidden bg-zinc-950 text-[#10B981] border-b-4 border-black">
              <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-[#10B981] border-2 border-black bg-zinc-900 rounded shadow-[2px_2px_0_0_#000]">
                  <Menu className="w-5 h-5 stroke-[2.5]" />
                </button>
                <span className="font-extrabold text-sm uppercase tracking-tight text-[#10B981] flex items-center gap-2">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.store_name} className="h-6 w-auto object-contain" />
                  ) : (
                    store.store_name
                  )}
                </span>
                <button onClick={() => setIsCartOpen(true)} className="p-2 text-black border-2 border-black bg-[#10B981] rounded shadow-[2px_2px_0_0_#000] relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold border border-black animate-bounce">{cartItemCount}</span>
                  )}
                </button>
              </div>
            </header>
          </>
        );

      case 'artisan':
        return (
          <header className="header-theme sticky top-0 z-40 transition-all bg-[#FAF6F0] border-b border-[#E4DAC9]">
            {/* Row 1: Logo and Action Icons */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-[#2F1E12] hover:bg-[#F3EFE7] rounded-full transition-all md:hidden"
              >
                <Menu className="w-6 h-6 stroke-[1.5]" />
              </button>

              {/* Centered Brand Logo */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
                <Link href="/" className="flex flex-col items-center gap-0.5 group">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.store_name} className="h-10 w-auto object-contain" />
                  ) : (
                    <>
                      <span className="font-bold text-xl md:text-2xl tracking-widest text-[#2F1E12] uppercase font-serif">
                        {store.store_name}
                      </span>
                      <span className="text-[8px] tracking-[0.3em] font-semibold text-[#8B5A2B] uppercase block">HANDMADE APOTHECARY</span>
                    </>
                  )}
                </Link>
              </div>

              {/* Right Side: Quick Action Icons */}
              <div className="flex items-center gap-1.5 md:gap-3 ml-auto z-20">
                <button onClick={() => setIsSearchOverlayOpen(!isSearchOverlayOpen)} className="p-2 text-[#2F1E12] hover:bg-[#F3EFE7] rounded-full transition-all">
                  <Search className="w-5 h-5 stroke-[1.5]" />
                </button>
                <button onClick={() => setIsWishlistOpen(true)} className="p-2 text-[#2F1E12] hover:bg-[#F3EFE7] rounded-full transition-all relative">
                  <Heart className="w-5 h-5 text-rose-700/80 stroke-[1.5]" />
                  {favorites.length > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#8B5A2B] text-white rounded-full text-[8px] font-black flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                </button>
                <button onClick={() => setIsCartOpen(true)} className="p-2 text-[#2F1E12] hover:bg-[#F3EFE7] rounded-full transition-all relative">
                  <ShoppingCart className="w-5 h-5 stroke-[1.5]" />
                  {cartItemCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#8B5A2B] text-white rounded-full text-[8px] font-black flex items-center justify-center font-bold">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Row 2: Centered Desktop Links (Centered Navigation sub-row) */}
            <div className="hidden md:flex items-center justify-center h-10 border-t border-[#E4DAC9]/60 pb-1.5 pt-1.5 bg-[#FAF6F0]">
              <nav className="flex items-center gap-10 font-bold uppercase tracking-[0.2em] text-[9px] text-[#2F1E12]/80">
                <button onClick={() => setIsAboutOpen(true)} className="hover:text-[#8B5A2B] transition-colors">Our Craft</button>
                <a href="#catalog" className="hover:text-[#8B5A2B] transition-colors">Shop Pottery</a>
                <button onClick={() => { setIsTrackOpen(true); setIsCartOpen(false); }} className="hover:text-[#8B5A2B] transition-colors">Track Order</button>
              </nav>
            </div>

            {/* Premium Sliding Search Bar Overlay */}
            {isSearchOverlayOpen && (
              <div className="bg-[#FAF6F0] border-t border-[#E4DAC9] px-4 py-3.5 animate-in slide-in-from-top duration-300">
                <div className="max-w-3xl mx-auto relative">
                  <input 
                    type="text" 
                    placeholder="Search organic collection..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-10 bg-white border border-[#E4DAC9] rounded-none text-xs outline-none focus:border-[#8B5A2B]"
                    autoFocus
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5A2B]/60" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8B5A2B]">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </header>
        );

      case 'bold':
        return (
          <header className="header-theme sticky top-0 z-40 transition-all bg-white border-b-4 border-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
              {/* Left Aligned Heavy Brand Logo */}
              <div className="flex items-center gap-6">
                <Link href="/" className="group flex items-center">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.store_name} className="h-10 w-auto object-contain border-2 border-black shadow-[3px_3px_0px_#000] p-1 bg-white" />
                  ) : (
                    <span className="font-extrabold text-2xl tracking-tighter text-black uppercase font-sans border-2 border-black px-3.5 py-1 shadow-[3px_3px_0px_#000] group-hover:bg-yellow-300 transition-colors">
                      {store.store_name}
                    </span>
                  )}
                </Link>
                <nav className="hidden md:flex items-center gap-6 font-black uppercase text-[10px] tracking-widest text-black">
                  <button onClick={() => setIsAboutOpen(true)} className="hover:text-[#E11D48] transition-colors border-l-2 border-black pl-6 py-1">[ ABOUT SYSTEM ]</button>
                  <a href="#catalog" className="hover:text-[#E11D48] transition-colors border-l-2 border-black pl-6 py-1">[ SHOP ALL ]</a>
                  <button onClick={() => { setIsTrackOpen(true); setIsCartOpen(false); }} className="hover:text-[#E11D48] transition-colors border-l-2 border-black pl-6 py-1">[ TRACK ORDER ]</button>
                </nav>
              </div>

              {/* Right Side: Quick Action Icons */}
              <div className="flex items-center gap-2">
                <button onClick={() => setIsSearchOverlayOpen(!isSearchOverlayOpen)} className="p-2 border-2 border-black bg-white hover:bg-gray-100 rounded text-black transition-all">
                  <Search className="w-5 h-5 stroke-[2.5]" />
                </button>
                <button onClick={() => setIsWishlistOpen(true)} className="p-2 border-2 border-black bg-white hover:bg-gray-100 rounded text-black transition-all relative">
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                  {favorites.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-black text-white border-2 border-white rounded-full text-[8px] font-black w-4 h-4 flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className="p-2.5 border-2 border-black bg-[#E11D48] text-white hover:bg-[#be123c] rounded transition-all relative shadow-[2px_2px_0px_#000]"
                >
                  <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full text-[8px] font-black w-4 h-4 flex items-center justify-center border-2 border-white animate-bounce">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Sliding Search Bar Overlay */}
            {isSearchOverlayOpen && (
              <div className="bg-white border-t-2 border-b-2 border-black px-4 py-3.5 animate-in slide-in-from-top duration-300">
                <div className="max-w-3xl mx-auto relative">
                  <input 
                    type="text" 
                    placeholder="SEARCH BOLD COMMERCE..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-11 pr-10 bg-white border-2 border-black text-xs font-bold uppercase tracking-widest outline-none focus:bg-yellow-50"
                    autoFocus
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-black" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:scale-110">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </header>
        );

      case 'luxe':
        return (
          <header className="header-theme sticky top-0 z-40 transition-all bg-[#0A0A0A]/90 backdrop-blur-md border-b border-zinc-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative gap-4">
              {/* Hamburger Mobile */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-white hover:text-[#D4AF37] transition-colors md:hidden"
              >
                <Menu className="w-6 h-6 stroke-[1.2]" />
              </button>

              {/* Centered Logo with Gold Details */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
                <Link href="/" className="flex flex-col items-center gap-1 group">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.store_name} className="h-10 w-auto object-contain brightness-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
                  ) : (
                    <>
                      <span className="font-light text-2xl tracking-[0.25em] text-white uppercase font-serif drop-shadow-[0_2px_10px_rgba(212,175,55,0.15)] group-hover:text-[#D4AF37] transition-all">
                        {store.store_name}
                      </span>
                      <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent group-hover:w-20 transition-all duration-500"></div>
                    </>
                  )}
                </Link>
              </div>

              {/* Desktop links */}
              <nav className="hidden md:flex items-center gap-8 font-light uppercase text-[9px] tracking-[0.25em] text-[#D4AF37] absolute left-10">
                <button onClick={() => setIsAboutOpen(true)} className="hover:text-white transition-colors">THE HOUSE</button>
                <a href="#catalog" className="hover:text-white transition-colors">COLLECTIONS</a>
                <button onClick={() => { setIsTrackOpen(true); setIsCartOpen(false); }} className="hover:text-white transition-colors">TRACK ORDER</button>
              </nav>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 ml-auto z-20">
                <button onClick={() => setIsSearchOverlayOpen(!isSearchOverlayOpen)} className="p-2 text-zinc-400 hover:text-white transition-colors">
                  <Search className="w-5 h-5 stroke-[1.2]" />
                </button>
                <button onClick={() => setIsWishlistOpen(true)} className="p-2 text-zinc-400 hover:text-white transition-colors relative">
                  <Heart className="w-5 h-5 stroke-[1.2] text-[#D4AF37]/80" />
                  {favorites.length > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#D4AF37] text-black rounded-full text-[8px] font-black flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                </button>
                <button onClick={() => setIsCartOpen(true)} className="p-2 text-[#D4AF37] hover:text-white transition-colors relative">
                  <ShoppingCart className="w-5 h-5 stroke-[1.2]" />
                  {cartItemCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#D4AF37] text-black rounded-full text-[8px] font-black flex items-center justify-center font-bold shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Sliding Search Bar Overlay */}
            {isSearchOverlayOpen && (
              <div className="bg-[#0D0D0D] border-t border-b border-zinc-900 px-4 py-3.5 animate-in slide-in-from-top duration-300">
                <div className="max-w-3xl mx-auto relative">
                  <input 
                    type="text" 
                    placeholder="Search curated collection..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-10 bg-[#070707] border border-zinc-800 text-white rounded-none text-xs outline-none focus:border-[#D4AF37] tracking-wider"
                    autoFocus
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </header>
        );

      case 'admire':
        return (
          <header className="header-theme sticky top-0 z-40 bg-white border-b border-orange-100/40 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
              {/* Left: Mobile Menu Trigger & Desktop Navigation */}
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 -ml-2 text-[#04113f] hover:bg-orange-50 rounded-full transition-all md:hidden"
                >
                  <Menu className="w-6 h-6" />
                </button>
                
                {/* Desktop Left-side Navigation Link */}
                <nav className="hidden md:flex items-center gap-6 font-bold uppercase text-[11px] tracking-wider text-[#04113f]">
                  <button onClick={() => setIsAboutOpen(true)} className="hover:text-[#f2852a] transition-all">About Us</button>
                  <a href="#catalog" className="hover:text-[#f2852a] transition-all">Store Catalog</a>
                  <button onClick={() => { setIsTrackOpen(true); setIsCartOpen(false); }} className="hover:text-[#f2852a] transition-all">Track Order</button>
                </nav>
              </div>

              {/* Center: Brand Logo */}
              <div className="flex-1 md:flex-none flex items-center justify-center">
                <Link href="/" className="flex items-center gap-2 group">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.store_name} className="h-11 w-auto object-contain transition-transform group-hover:scale-102" />
                  ) : (
                    <span className="font-extrabold text-xl md:text-2xl tracking-tight text-[#04113f] group-hover:text-[#f2852a] transition-all font-theme-title">
                      🧼 {store.store_name}
                    </span>
                  )}
                </Link>
              </div>

              {/* Right: Search Bar, Sky-100 Avatar, Emerald-100 Cart Bag */}
              <div className="flex items-center gap-3">
                {/* Desktop Integrated Search Bar */}
                <div className="hidden lg:relative lg:flex items-center">
                  <input 
                    type="text" 
                    placeholder="Search handmade soaps..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-56 h-9 pl-9 pr-8 bg-zinc-50 border border-orange-100/60 rounded-full text-xs outline-none focus:border-[#f2852a] focus:ring-1 focus:ring-[#f2852a] focus:bg-white transition-all font-theme-body"
                  />
                  <Search className="absolute left-3 w-3.5 h-3.5 text-zinc-400" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 text-zinc-400 hover:text-zinc-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Mobile Search Button */}
                <button onClick={() => setIsSearchOverlayOpen(!isSearchOverlayOpen)} className="p-2 text-[#04113f] hover:bg-orange-50 rounded-full transition-all lg:hidden">
                  <Search className="w-5 h-5" />
                </button>

                {/* Sky-100 User Avatar Badge */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 text-sky-800 text-xs font-black shadow-inner border border-sky-200 cursor-default select-none">
                  {store.store_name?.charAt(0).toUpperCase() || 'S'}
                </div>

                {/* Emerald-100 Cart Bag Button */}
                <button 
                  onClick={() => setIsCartOpen(true)} 
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-all relative border border-emerald-200 animate-in fade-in"
                >
                  <ShoppingBag className="w-4 h-4 stroke-[2]" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-[#f2852a] text-white rounded-full text-[9px] font-black flex items-center justify-center font-bold border border-white animate-pulse">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Sliding Search Overlay for Mobile */}
            {isSearchOverlayOpen && (
              <div className="bg-[#FAF8F5] border-t border-orange-100/40 px-4 py-3 animate-in slide-in-from-top duration-300">
                <div className="max-w-3xl mx-auto relative">
                  <input 
                    type="text" 
                    placeholder="Search organic catalog..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-10 bg-white border border-orange-100/40 rounded-full text-xs outline-none focus:border-[#f2852a]"
                    autoFocus
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </header>
        );

      case 'minimal':
      default:
        return (
          <header className="header-theme sticky top-0 z-40 transition-all bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between relative gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-gray-900 hover:text-black transition-colors md:hidden"
              >
                <Menu className="w-6 h-6 stroke-[1.5]" />
              </button>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
                <Link href="/" className="flex items-center gap-2 group">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.store_name} className="h-9 w-auto object-contain" />
                  ) : (
                    <span className="font-light text-lg md:text-xl tracking-[0.2em] text-gray-950 uppercase font-sans">
                      {store.store_name}
                    </span>
                  )}
                </Link>
              </div>

              {/* Left-side Navigation Link for Copenhagen Minimal */}
              <nav className="hidden md:flex items-center gap-8 font-light uppercase text-[9px] tracking-[0.2em] text-gray-400 absolute left-8">
                <button onClick={() => setIsAboutOpen(true)} className="hover:text-black transition-colors">ABOUT</button>
                <a href="#catalog" className="hover:text-black transition-colors">CATALOG</a>
                <button onClick={() => { setIsTrackOpen(true); setIsCartOpen(false); }} className="hover:text-black transition-colors">TRACK ORDER</button>
              </nav>

              <div className="flex items-center gap-1.5 ml-auto z-20">
                <button onClick={() => setIsSearchOverlayOpen(!isSearchOverlayOpen)} className="p-2 text-gray-500 hover:text-black transition-all">
                  <Search className="w-5 h-5 stroke-[1.5]" />
                </button>
                <button onClick={() => setIsWishlistOpen(true)} className="p-2 text-gray-500 hover:text-black transition-all relative">
                  <Heart className="w-5 h-5 stroke-[1.5] text-rose-500" />
                  {favorites.length > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-black text-white rounded-full text-[8px] font-black flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                </button>
                <button onClick={() => setIsCartOpen(true)} className="p-2 text-gray-950 hover:text-black transition-all relative">
                  <ShoppingCart className="w-5 h-5 stroke-[1.5]" />
                  {cartItemCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-black text-white rounded-full text-[8px] font-black flex items-center justify-center font-bold">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Sliding Search Overlay */}
            {isSearchOverlayOpen && (
              <div className="bg-white border-t border-b border-gray-100 px-4 py-3.5 animate-in slide-in-from-top duration-300">
                <div className="max-w-3xl mx-auto relative">
                  <input 
                    type="text" 
                    placeholder="Search catalog..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-10 bg-[#FCFCFC] border border-gray-200 rounded-none text-xs outline-none focus:border-black font-light"
                    autoFocus
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </header>
        );
    }
  };

  const renderHero = () => {
    const mainBanner = banners[0];
    const secondBanner = banners[1] || banners[0];
    
    // Artisan
    const artisanHeroTitle = mainBanner?.title || "Meticulously Handcrafted Ceramics";
    const artisanHeroSubtitle = mainBanner?.subtitle || "\"We mold organic local earth with slowness, patience, and traditional kiln firings. Every single object carries tiny tactile traces of our hands, keeping the quiet spirit of craftsmanship alive in your daily home rituals.\"";
    const artisanHeroCTA = mainBanner?.cta || "DISCOVER EARTH COLLECTION";
    const artisanHeroImage = mainBanner?.image || "https://images.unsplash.com/photo-1565192647048-f997ed8799d4?auto=format&fit=crop&q=80&w=1200";

    // Luxe
    const luxeHeroTitle = mainBanner?.title || "Curated Timeless Masterpieces";
    const luxeHeroSubtitle = mainBanner?.subtitle || "Fine jewelry, hand-brushed luxury watches, and leather travel cases designed with exceptional dedication and finished in 18k premium gold.";
    const luxeHeroCTA = mainBanner?.cta || "ENTER THE SALON";
    const luxeHeroImage = mainBanner?.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1920";

    // Bold
    const boldTitle1 = mainBanner?.title || "WE MOVE WITHOUT LIMITS";
    const boldSubtitle1 = mainBanner?.subtitle || "Heavyweight double-mesh active gear, utility outercoats, and modular street essentials.";
    const boldCTA1 = mainBanner?.cta || "ACQUIRE GEAR NOW";
    
    const boldTitle2 = secondBanner?.title || "STREET STYLE GRID PARADIGM";
    const boldSubtitle2 = secondBanner?.subtitle || "Designed for heavy wear and maximum impact. Thick canvas overlays and solid metal accessories.";
    const boldCTA2 = secondBanner?.cta || "VIEW CATALOG [EX.DLL]";

    // Retro
    const retroTitle1 = mainBanner?.title || "WELCOME TO NEON RADICAL";
    const retroSubtitle1 = mainBanner?.subtitle || "SYSTEM REPORT: Nostalgia subagent fully online. All systems reporting retro green levels. Load complete. Hardware drops: lo-fi gadgets, vintage pocket cameras, pixel widgets.";
    const retroCTA1 = mainBanner?.cta || "EXECUTE SHOP_NOW";
    
    const retroTitle2 = secondBanner?.title || "90S SIMULATION ACTIVE";
    const retroSubtitle2 = secondBanner?.subtitle || "SYSTEM STATS: Neon Purple grids activated. Heavy shadows rendering... Flat shadow pixels initialized. CRT flicker: on. Radar: online. Radical lo-fi gear is back in folder.";
    const retroCTA2 = secondBanner?.cta || "LOAD SYSTEM.SYS";

    switch (selectedTemplate) {
      case 'artisan':
        return (
          <section className="relative px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-[#FAF6F0] p-6 sm:p-10 border border-[#E4DAC9] rounded-[24px]">
              {/* Left Side: organic image with rounded corners */}
              <div className="aspect-[4/3] w-full overflow-hidden rounded-[24px] border border-[#E4DAC9] bg-[#FAF6F0] flex items-center justify-center relative">
                {!artisanHeroError ? (
                  <img 
                    src={artisanHeroImage} 
                    alt="Artisan Craft Studio" 
                    className="w-full h-full object-cover"
                    onError={() => setArtisanHeroError(true)}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F0] to-[#E4DAC9]/40 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <svg className="w-16 h-16 text-[#8B5A2B]/60 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5v14M7 5v14M12 8a4 4 0 00-4 4v4a4 4 0 008 0v-4a4 4 0 00-4-4z" />
                    </svg>
                    <div>
                      <span className="text-[9px] tracking-[0.2em] font-black text-[#8B5A2B] uppercase block">THE ARTISAN WHEEL</span>
                      <span className="text-[10px] text-[#2F1E12]/60 italic font-serif mt-1 block">Est. 2026 • Mud, Water, & Patience</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: storytelling warm block */}
              <div className="space-y-6 lg:pl-6 text-[#2F1E12]">
                <span className="text-[10px] tracking-[0.3em] font-black text-[#8B5A2B] uppercase block">SINCE 2026 • THE WAY OF MUD & FIRE</span>
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-serif text-[#2F1E12] leading-tight">
                  {artisanHeroTitle}
                </h2>
                <p className="text-sm leading-relaxed text-[#2F1E12]/80 font-serif italic">
                  {artisanHeroSubtitle}
                </p>
                <div className="pt-4">
                  <a 
                    href="#catalog"
                    className="inline-block px-10 py-4 bg-[#8B5A2B] text-white hover:bg-[#6e4620] text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all duration-200 shadow-md hover:scale-[1.02]"
                  >
                    {artisanHeroCTA} →
                  </a>
                </div>
              </div>
            </div>
          </section>
        );

      case 'bold':
        return (
          <section className="px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hero Block 1 */}
              <div className="border-4 border-black p-8 bg-black text-white flex flex-col justify-between aspect-[16/10] shadow-[6px_6px_0px_#EF4444]">
                <div className="space-y-4">
                  <span className="inline-block bg-[#EF4444] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 border-2 border-white">
                    METROPOLIS V1 DROP
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                    {boldTitle1}
                  </h2>
                  <p className="text-xs text-zinc-400 font-bold max-w-sm uppercase tracking-wide leading-relaxed">
                    {boldSubtitle1}
                  </p>
                </div>
                <div className="pt-6">
                  <a 
                    href="#catalog" 
                    className="inline-block bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black px-8 py-3 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_#fff] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                  >
                    {boldCTA1} →
                  </a>
                </div>
              </div>

              {/* Hero Block 2 */}
              <div className="border-4 border-black p-8 bg-yellow-300 text-black flex flex-col justify-between aspect-[16/10] shadow-[6px_6px_0px_#000]">
                <div className="space-y-4">
                  <span className="inline-block bg-black text-white text-[9px] font-black uppercase tracking-widest px-3 py-1">
                    SEASON SPECIAL
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                    {boldTitle2}
                  </h2>
                  <p className="text-xs text-zinc-800 font-bold max-w-sm uppercase tracking-wide leading-relaxed">
                    {boldSubtitle2}
                  </p>
                </div>
                <div className="pt-6">
                  <a 
                    href="#catalog" 
                    className="inline-block bg-black hover:bg-[#EF4444] hover:text-white text-white border-2 border-black px-8 py-3 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                  >
                    {boldCTA2} →
                  </a>
                </div>
              </div>
            </div>
          </section>
        );

      case 'luxe':
        return (
          <section className="relative h-[65vh] w-full overflow-hidden bg-black flex items-center justify-center border-b border-zinc-900">
            {/* Dark elegant overlay and floating gold sparkles */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 z-10" />
            {!luxeHeroError ? (
              <img 
                src={luxeHeroImage} 
                alt="Luxury Collection" 
                className="absolute inset-0 w-full h-full object-cover opacity-45 scale-100 transition-transform duration-[10s]"
                onError={() => setLuxeHeroError(true)}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-[#121212] to-zinc-900 flex items-center justify-center opacity-70" />
            )}
            
            {/* Elegant luxury text */}
            <div className="relative z-20 text-center px-4 max-w-3xl mx-auto space-y-6 md:space-y-8 flex flex-col items-center">
              <span className="inline-block px-5 py-2 border border-[#D4AF37]/40 text-[#D4AF37] text-[9px] font-black uppercase tracking-[0.3em] rounded bg-black/45 backdrop-blur-sm animate-pulse">
                THE AURELIA CURATION
              </span>
              <h2 className="text-4xl sm:text-6xl font-light text-white tracking-[0.1em] uppercase font-serif leading-tight">
                {luxeHeroTitle}
              </h2>
              <p className="text-xs md:text-sm text-zinc-400 font-serif max-w-xl tracking-wider leading-relaxed">
                {luxeHeroSubtitle}
              </p>
              <div className="pt-2">
                <a 
                  href="#catalog"
                  className="inline-block px-12 py-4 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black hover:from-white hover:to-white text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.2)] rounded-sm hover:scale-[1.03]"
                >
                  {luxeHeroCTA}
                </a>
              </div>
            </div>
          </section>
        );

      case 'retro':
        return (
          <section className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto font-mono">
            {/* 90s Staggered computer windows grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              
              {/* Computer Window 1 */}
              <div className="border-4 border-black bg-zinc-900 text-white rounded overflow-hidden flex flex-col shadow-[6px_6px_0px_#8B5CF6]">
                {/* OS Title Bar */}
                <div className="bg-[#8B5CF6] text-black h-8 px-3.5 flex items-center justify-between font-black uppercase tracking-wider text-[10px] border-b-4 border-black">
                  <span>PROMO_V1.EXE</span>
                  <div className="flex gap-1.5">
                    <span className="w-3.5 h-3.5 bg-black text-[#8B5CF6] flex items-center justify-center font-bold text-[8px] border border-black cursor-pointer">_</span>
                    <span className="w-3.5 h-3.5 bg-black text-[#8B5CF6] flex items-center justify-center font-bold text-[8px] border border-black cursor-pointer">X</span>
                  </div>
                </div>
                
                {/* Inner lo-fi CRT screen */}
                <div className="p-6 space-y-4 flex-1 bg-zinc-950 text-[#10B981] flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">&gt; LOAD DATASET</div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-[#10B981]">
                      {retroTitle1}
                    </h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
                      &gt; {retroSubtitle1}
                    </p>
                  </div>
                  <div className="pt-6 border-t border-[#10B981]/20">
                    <a 
                      href="#catalog"
                      className="inline-block bg-[#10B981] text-black border-2 border-black px-6 py-2.5 text-[9px] font-black uppercase tracking-widest shadow-[3px_3px_0px_#8B5CF6] hover:translate-x-[-1.5px] hover:translate-y-[-1.5px] active:translate-x-[2px] active:translate-y-[2px] transition-all"
                    >
                      [ {retroCTA1} ]
                    </a>
                  </div>
                </div>
              </div>

              {/* Computer Window 2 */}
              <div className="border-4 border-black bg-zinc-900 text-white rounded overflow-hidden flex flex-col shadow-[6px_6px_0px_#10B981]">
                {/* OS Title Bar */}
                <div className="bg-[#10B981] text-black h-8 px-3.5 flex items-center justify-between font-black uppercase tracking-wider text-[10px] border-b-4 border-black">
                  <span>WIDGET.SYS</span>
                  <div className="flex gap-1.5">
                    <span className="w-3.5 h-3.5 bg-black text-[#10B981] flex items-center justify-center font-bold text-[8px] border border-black cursor-pointer">_</span>
                    <span className="w-3.5 h-3.5 bg-black text-[#10B981] flex items-center justify-center font-bold text-[8px] border border-black cursor-pointer">X</span>
                  </div>
                </div>
                
                {/* Lofi CRT display */}
                <div className="p-6 space-y-4 flex-1 bg-zinc-950 text-[#8B5CF6] flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">&gt; STATUS REPORT</div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-[#8B5CF6]">
                      {retroTitle2}
                    </h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
                      &gt; {retroSubtitle2}
                    </p>
                  </div>
                  <div className="pt-6 border-t border-[#8B5CF6]/20">
                    <button 
                      onClick={() => setIsAboutOpen(true)}
                      className="inline-block bg-[#8B5CF6] text-black border-2 border-black px-6 py-2.5 text-[9px] font-black uppercase tracking-widest shadow-[3px_3px_0px_#10B981] hover:translate-x-[-1.5px] hover:translate-y-[-1.5px] active:translate-x-[2px] active:translate-y-[2px] transition-all"
                    >
                      [ {retroCTA2} ]
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </section>
        );

      case 'admire':
        return (
          <section className="relative px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white p-6 sm:p-10 border border-orange-100/40 rounded-[24px] shadow-sm">
              
              {/* Left Column: Storytelling warm text block */}
              <div className="space-y-6 lg:pr-6 text-left order-2 lg:order-1">
                <span className="text-[10px] tracking-[0.25em] font-black text-[#f2852a] uppercase block font-theme-body">
                  ✨ Cold Processed • 100% Organic Essence
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#04113f] leading-tight font-theme-title">
                  {mainBanner?.title || "Nourish Your Skin with Pure Organic Soaps"}
                </h2>
                <p className="text-sm leading-relaxed text-[#04113f]/85 font-theme-body">
                  {mainBanner?.subtitle || "Handcrafted in small batches using premium plant botanicals, nourishing cold-pressed organic oils, and pure therapeutic essential oils. Free from synthetic fragrances, palm oil, and harsh toxic chemicals."}
                </p>
                <div className="pt-2 flex flex-wrap gap-4">
                  <a 
                    href="#catalog"
                    className="inline-block px-8 py-3.5 bg-[#f2852a] hover:bg-[#04113f] text-white hover:text-white text-xs font-bold uppercase tracking-wider rounded-[12px] transition-all duration-200 shadow-sm hover:scale-[1.02]"
                  >
                    {mainBanner?.cta || "🧼 Explore Handmade Soaps"}
                  </a>
                  <button 
                    onClick={() => setIsAboutOpen(true)}
                    className="inline-block px-8 py-3.5 bg-sky-100 hover:bg-sky-200 text-sky-900 text-xs font-bold uppercase tracking-wider rounded-[12px] transition-all duration-200 hover:scale-[1.02]"
                  >
                    Our Story
                  </button>
                </div>
              </div>

              {/* Right Column: Visual slideshow with soap-bar rounded corners */}
              <div className="aspect-[4/3] w-full overflow-hidden rounded-[20px] border border-orange-100/30 bg-[#FAF8F5] relative order-1 lg:order-2">
                <div className="absolute inset-0 bg-black/5 z-10 pointer-events-none" />
                <img 
                  src={mainBanner?.image || "https://images.unsplash.com/photo-1607006342411-91f11f6d021c?auto=format&fit=crop&q=80&w=1200"} 
                  alt="Organic Handmade Soaps" 
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-103"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-amber-100', 'to-orange-50');
                  }}
                />
              </div>

            </div>
          </section>
        );

      case 'minimal':
      default:
        return (
          <section className="relative h-[50vh] sm:h-[60vh] w-full overflow-hidden bg-[#F3F4F6]">
            {carouselSlides.map((banner, index) => (
              <div 
                key={banner.id || index}
                className={`absolute inset-0 transition-all duration-[1000ms] ease-in-out ${index === currentSlide ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'}`}
              >
                <div className="absolute inset-0 bg-black/10 z-10"></div>
                <img 
                  src={banner.image} 
                  alt={banner.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-zinc-800', 'to-zinc-950');
                  }}
                />
                
                {/* Minimal Centered Typography Overlay */}
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto space-y-4">
                  <h2 className="text-3xl sm:text-5xl md:text-6xl font-light text-white tracking-tight leading-none uppercase font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                    {banner.title}
                  </h2>
                  <p className="text-[10px] sm:text-xs md:text-sm text-white/90 max-w-xl leading-relaxed tracking-widest font-light uppercase">
                    {banner.subtitle}
                  </p>
                  <div className="pt-4">
                    <a 
                      href="#catalog"
                      className="inline-block px-10 py-3.5 bg-black text-white hover:opacity-85 text-[9px] font-black uppercase tracking-[0.2em] rounded-none transition-all"
                    >
                      EXPLORE ALL
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {/* Carousel navigation arrows */}
            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-25 w-9 h-9 rounded-full bg-white/60 hover:bg-white/90 flex items-center justify-center text-black shadow-sm transition-all">
              <ChevronLeft className="w-5 h-5 stroke-[1.5]" />
            </button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-25 w-9 h-9 rounded-full bg-white/60 hover:bg-white/90 flex items-center justify-center text-black shadow-sm transition-all">
              <ChevronRight className="w-5 h-5 stroke-[1.5]" />
            </button>
          </section>
        );
    }
  };

  const renderCatalog = () => {
    // Shared parameters
    const displayCatalogTitle = () => {
      switch (selectedTemplate) {
        case 'artisan':
          return "Our Curated Earth Goods";
        case 'bold':
          return "ACQUIRE HARDWARE CO.";
        case 'luxe':
          return "The Salon Curations";
        case 'retro':
          return "FOLDER: ALL_ITEMS.DIR";
        case 'minimal':
        default:
          return "Copenhagen Collection";
      }
    };

    switch (selectedTemplate) {
      case 'retro':
        return (
          <section id="catalog" className="px-4 sm:px-6 lg:px-8 py-12 font-mono text-[#10B981]">
            <div className="border-4 border-black p-4 mb-8 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[4px_4px_0_0_#8B5CF6]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase">
                <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
                <span>STATUS: RETRO_CATALOG_LOADED.EXE</span>
              </div>
              
              {/* Category Pills inside Retro */}
              <div className="flex flex-wrap gap-2">
                {categoriesList.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 border-2 border-black rounded text-[9px] font-bold uppercase tracking-wider ${
                      selectedCategory === cat 
                        ? 'bg-[#10B981] text-black shadow-[2px_2px_0px_#8B5CF6]'
                        : 'bg-zinc-900 text-[#10B981] hover:bg-[#10B981]/25'
                    }`}
                  >
                    {cat === 'All' ? 'ALL_FILTERS' : `${cat.toUpperCase()}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Windows Grid */}
            {processedProducts.length === 0 ? (
              <div className="text-center py-20 bg-zinc-950 border-4 border-black rounded shadow-[4px_4px_0_0_#EF4444] text-red-500 font-bold uppercase tracking-widest text-xs">
                [ ERROR_404: NO PRODUCTS FOUND ]
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {processedProducts.map((product, idx) => {
                  const isLiked = favorites.includes(product.id);
                  let originalPrice = Number(product.price);
                  let displayPrice = originalPrice;
                  let hasActiveOffer = false;
                  let offerPercent = 0;
                  let timeLeftText = '';

                  try {
                    if (product.description && product.description.startsWith('{')) {
                      const parsed = JSON.parse(product.description);
                      if (parsed.offer_ends_at && parsed.offer_price) {
                        const endTime = new Date(parsed.offer_ends_at).getTime();
                        const now = Date.now();
                        if (endTime > now) {
                          hasActiveOffer = true;
                          displayPrice = Number(parsed.offer_price);
                          offerPercent = Number(parsed.offer_percent) || 50;
                          
                          const diffMs = endTime - now;
                          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                          const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
                          if (diffHrs > 0) {
                            timeLeftText = `${diffHrs}h ${diffMins}m`;
                          } else if (diffMins > 0) {
                            timeLeftText = `${diffMins}m ${diffSecs}s`;
                          } else {
                            timeLeftText = `${diffSecs}s`;
                          }
                        }
                      }
                    }
                  } catch (e) {}

                  return (
                    <div key={product.id} className="border-4 border-black bg-zinc-900 rounded overflow-hidden flex flex-col justify-between shadow-[4px_4px_0px_#8B5CF6] hover:shadow-[6px_6px_0px_#10B981] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]">
                      {/* OS Folder Window Header */}
                      <div className="bg-black text-[#10B981] h-7 px-3 flex items-center justify-between border-b-4 border-black text-[9px] font-black tracking-wider uppercase">
                        <span>ITEM_{idx + 1 < 10 ? '0' + (idx + 1) : idx + 1}.SYS</span>
                        <div className="flex gap-1">
                          <span onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }} className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-bold text-[8px] cursor-pointer ${isLiked ? 'bg-red-500 text-white' : 'bg-zinc-800 text-[#10B981]'}`}>
                            ♥
                          </span>
                          <span className="w-3.5 h-3.5 bg-[#8B5CF6] text-black flex items-center justify-center font-bold text-[8px] border border-black cursor-pointer">X</span>
                        </div>
                      </div>

                      {/* Image Frame */}
                      <div className="aspect-square relative w-full bg-black overflow-hidden border-b-4 border-black group cursor-pointer" onClick={() => setSelectedProduct(product)}>
                        {getProductImage(product) ? (
                          <img 
                            src={getProductImage(product)} 
                            alt={product.name} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-bold text-4xl">?</div>
                        )}
                        
                        {/* Neon retro badges */}
                        {hasActiveOffer && (
                          <span className="absolute top-2 left-2 bg-[#10B981] text-black border-2 border-black font-black uppercase text-[8px] px-2 py-0.5 shadow-[2px_2px_0px_#000] animate-pulse">
                            PROMO: -{offerPercent}%
                          </span>
                        )}
                        {product.is_new && !hasActiveOffer && (
                          <span className="absolute top-2 left-2 bg-yellow-300 text-black border-2 border-black font-black uppercase text-[8px] px-2 py-0.5 shadow-[2px_2px_0px_#000]">
                            HOT!
                          </span>
                        )}
                      </div>

                      {/* Info Frame */}
                      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between bg-zinc-950">
                        <div className="space-y-1">
                          <span className="text-[8px] text-[#8B5CF6] font-bold tracking-widest uppercase block">&gt; {getProductCategory(product).toUpperCase()}</span>
                          <h4 
                            onClick={() => setSelectedProduct(product)}
                            className="font-bold text-[#10B981] text-xs hover:underline cursor-pointer uppercase tracking-wider line-clamp-2 min-h-[2rem]"
                          >
                            {product.name}
                          </h4>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-1 font-bold text-[9px] text-zinc-500">
                            <span>STABILITY: [100%]</span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                            <div className="flex flex-col">
                              {hasActiveOffer ? (
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-[#10B981] text-sm block">
                                    {currencySymbol}{displayPrice.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 line-through block font-bold leading-none">
                                    {currencySymbol}{originalPrice.toLocaleString()}
                                  </span>
                                  <span className="text-[8px] text-red-500 font-extrabold block uppercase tracking-wider animate-pulse leading-none mt-0.5">
                                    ⚡ PROMO: {timeLeftText}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-extrabold text-white text-sm">
                                  {currencySymbol}{displayPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                            <button 
                              onClick={() => addToCart(product, 1)}
                              className="w-full sm:w-auto text-center px-3 py-1.5 bg-[#10B981] hover:bg-[#8B5CF6] hover:text-black text-black border-2 border-black font-black uppercase text-[8px] shadow-[2px_2px_0px_rgba(16,185,129,0.3)] transition-all"
                            >
                              [ LOAD ]
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );

      case 'artisan':
        return (
          <section id="catalog" className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto text-[#2F1E12]">
            {/* Story highlights above catalog */}
            <div className="mb-14 text-center">
              <span className="text-[10px] tracking-[0.3em] font-black text-[#8B5A2B] uppercase block mb-3">OUR BRAND DIARIES</span>
              <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight font-serif text-[#2F1E12]">Visual Stories From The Pottery</h3>
              
              <div className="flex justify-start sm:justify-center items-center gap-6 sm:gap-8 mt-8 overflow-x-auto py-2 px-4 scrollbar-none max-w-full">
                {[
                  { title: "Sourcing Clay", desc: "We dig local terracotta directly from the pristine riverbed clay veins, retaining rich iron and granular silica textures.", img: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=150" },
                  { title: "The Pottery Wheel", desc: "Every piece is carefully shaped on a slow kickwheel, where natural variations in finger pressure leave organic ripples.", img: "https://images.unsplash.com/photo-1565192647048-f997ed8799d4?auto=format&fit=crop&q=80&w=150" },
                  { title: "Kiln Firing", desc: "We wood-fire our stoneware continuously for over 36 hours at 2,300°F. The falling ash creates soft, toasted gradients.", img: "https://images.unsplash.com/photo-1595435934249-5df7ed86b1c0?auto=format&fit=crop&q=80&w=150" },
                  { title: "Our Artisans", desc: "A tight-knit community of 6 master potters bringing ancient techniques into contemporary functional modern tableware.", img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=150" }
                ].map((story, i) => (
                  <div 
                    key={i} 
                    onClick={() => alert(`🌾 ${story.title}:\n\n${story.desc}`)}
                    className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#E4DAC9] group-hover:border-[#8B5A2B] transition-all p-1 bg-white relative flex items-center justify-center">
                      <img 
                        src={story.img} 
                        alt={story.title} 
                        className="w-full h-full object-cover rounded-full" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent && !parent.querySelector('.fallback-letter')) {
                            parent.classList.add('bg-gradient-to-br', 'from-[#FAF6F0]', 'to-[#E4DAC9]', 'flex', 'items-center', 'justify-center');
                            const textNode = document.createElement('span');
                            textNode.className = 'fallback-letter font-serif text-[12px] font-black text-[#8B5A2B]';
                            textNode.innerText = story.title.charAt(0);
                            parent.appendChild(textNode);
                          }
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#2F1E12] mt-2.5 group-hover:text-[#8B5A2B] transition-colors">{story.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#E4DAC9] pt-12 flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
              <h4 className="text-xl font-bold font-serif text-[#2F1E12] tracking-wide uppercase">{displayCatalogTitle()}</h4>
              
              <div className="flex flex-wrap gap-2.5 items-center justify-center">
                {categoriesList.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                      selectedCategory === cat 
                        ? 'bg-[#8B5A2B] border-[#8B5A2B] text-white'
                        : 'bg-white border-[#E4DAC9] text-[#2F1E12]/70 hover:border-[#8B5A2B]'
                    }`}
                  >
                    {cat === 'All' ? 'ALL ESSENTIALS' : cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Asymmetrical Staggered Pottery Grid */}
            {processedProducts.length === 0 ? (
              <div className="text-center py-20 bg-[#FDFBF7] border border-dashed border-[#E4DAC9] rounded-[24px] text-gray-500 font-serif italic text-sm">
                No organic goods in this category. Check back soon.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
                {processedProducts.map((product, idx) => {
                  const isLiked = favorites.includes(product.id);
                  let originalPrice = Number(product.price);
                  let displayPrice = originalPrice;
                  let hasActiveOffer = false;
                  let offerPercent = 0;
                  let timeLeftText = '';

                  try {
                    if (product.description && product.description.startsWith('{')) {
                      const parsed = JSON.parse(product.description);
                      if (parsed.offer_ends_at && parsed.offer_price) {
                        const endTime = new Date(parsed.offer_ends_at).getTime();
                        const now = Date.now();
                        if (endTime > now) {
                          hasActiveOffer = true;
                          displayPrice = Number(parsed.offer_price);
                          offerPercent = Number(parsed.offer_percent) || 50;
                          
                          const diffMs = endTime - now;
                          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                          const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
                          if (diffHrs > 0) {
                            timeLeftText = `${diffHrs}h ${diffMins}m`;
                          } else if (diffMins > 0) {
                            timeLeftText = `${diffMins}m ${diffSecs}s`;
                          } else {
                            timeLeftText = `${diffSecs}s`;
                          }
                        }
                      }
                    }
                  } catch (e) {}
                  
                  // Introduce dynamic height class for true staggered layout look
                  const isStaggered = idx % 3 === 1;

                  return (
                    <div 
                      key={product.id} 
                      className={`card-theme flex flex-col bg-[#FDFBF7] border border-[#E4DAC9] rounded-[24px] overflow-hidden group shadow-sm transition-all duration-300 hover:shadow-md ${isStaggered ? 'md:translate-y-8' : ''}`}
                    >
                      <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(product)}>
                        {getProductImage(product) ? (
                          <img 
                            src={getProductImage(product)} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center font-bold text-[#E4DAC9] text-3xl">P</div>
                        )}
                        
                        {/* Organic Badge */}
                        {hasActiveOffer ? (
                          <span className="absolute top-3 left-3 bg-[#8B5A2B] text-[#FAF6F0] border border-[#E4DAC9] text-[7.5px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full">
                            🏺 SAVE {offerPercent}% NOW
                          </span>
                        ) : (
                          <span className="absolute top-3 left-3 bg-[#FAF6F0] text-[#8B5A2B] border border-[#E4DAC9] text-[7.5px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full">
                            🌱 100% ORGANIC STONEWARE
                          </span>
                        )}

                        {/* Heart Button */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                          className="absolute top-3 right-3 p-2.5 rounded-full bg-[#FAF6F0]/95 text-zinc-500 hover:text-red-500 transition-colors z-20 border border-[#E4DAC9]"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-700 text-rose-700' : 'text-gray-400'}`} />
                        </button>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between bg-[#FDFBF7] space-y-4">
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-[#8B5A2B] tracking-[0.25em] uppercase block">{getProductCategory(product)}</span>
                          <h4 
                            onClick={() => setSelectedProduct(product)}
                            className="font-bold text-[#2F1E12] text-sm hover:underline cursor-pointer font-serif leading-tight line-clamp-2 min-h-[2.5rem]"
                          >
                            {product.name}
                          </h4>
                          <p className="text-[10px] text-zinc-400 font-serif italic mt-0.5 line-clamp-2 leading-relaxed">
                            {getProductDescription(product) || 'A tactile, functional stoneware perfect for organic home accents.'}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#E4DAC9]/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex flex-col">
                            {hasActiveOffer ? (
                              <div className="space-y-0.5">
                                <span className="font-bold text-[#8B5A2B] font-serif text-base block">
                                  {currencySymbol}{displayPrice.toLocaleString()}
                                </span>
                                <span className="text-xs text-zinc-400 font-serif line-through block leading-none">
                                  {currencySymbol}{originalPrice.toLocaleString()}
                                </span>
                                <span className="text-[9px] text-[#8B5A2B] font-serif italic block mt-0.5">
                                  * Ends in {timeLeftText}
                                </span>
                              </div>
                            ) : (
                              <span className="font-bold text-[#8B5A2B] font-serif text-base">
                                {currencySymbol}{displayPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => addToCart(product, 1)}
                            className="w-full sm:w-auto text-center px-5 py-2 bg-[#8B5A2B] hover:bg-[#6e4620] text-white text-[9px] font-black uppercase tracking-[0.15em] rounded-full transition-colors"
                          >
                            Add To Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );

      case 'bold':
        return (
          <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-black">
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-black mb-10 border-b-4 border-black pb-4">
              {displayCatalogTitle()}
            </h3>

            {/* Desktop Sticky Left Sidebar Filter and 4-column brutalist catalog */}
            <div className="flex flex-col lg:flex-row gap-10 items-stretch">
              
              {/* Sticky Left Sidebar filter on desktop */}
              <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-28 self-start border-4 border-black p-5 bg-white shadow-[4px_4px_0_0_#000]">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-widest text-black border-b-2 border-black pb-2 mb-3">
                      SYSTEM CATEGORIES
                    </h4>
                    <div className="flex flex-col gap-2.5 font-black text-[10px] tracking-wider">
                      {categoriesList.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`text-left uppercase py-1 border-b border-gray-100 hover:text-[#E11D48] transition-colors flex items-center justify-between ${
                            selectedCategory === cat ? 'text-[#E11D48]' : 'text-black'
                          }`}
                        >
                          <span>{cat === 'All' ? 'ALL GEAR' : cat}</span>
                          {selectedCategory === cat && <span className="w-2 h-2 rounded-full bg-[#E11D48]"></span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-black">
                    <h4 className="font-black text-xs uppercase tracking-widest text-black mb-3">
                      SORT ENGINE
                    </h4>
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-2 border-2 border-black text-[10px] font-black uppercase outline-none cursor-pointer"
                    >
                      <option value="Featured">Featured</option>
                      <option value="Price: Low to High">Low to High</option>
                      <option value="Price: High to Low">High to Low</option>
                      <option value="Popularity">Stars (High)</option>
                    </select>
                  </div>
                </div>
              </aside>

              {/* Products content */}
              <div className="flex-1">
                {/* Mobile horizontal category scrolling */}
                <div className="flex lg:hidden gap-2 overflow-x-auto pb-4 mb-6">
                  {categoriesList.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 border-2 border-black text-[9px] font-black uppercase tracking-widest rounded-none ${
                        selectedCategory === cat ? 'bg-[#E11D48] text-white shadow-[2px_2px_0_0_#000]' : 'bg-white text-black'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {processedProducts.length === 0 ? (
                  <div className="text-center py-20 border-4 border-black bg-gray-50 text-black font-black uppercase tracking-widest text-xs shadow-[4px_4px_0_0_#000]">
                    [ DATABASE EMPTY ]
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {processedProducts.map((product) => {
                      const isLiked = favorites.includes(product.id);
                      let originalPrice = Number(product.price);
                      let displayPrice = originalPrice;
                      let hasActiveOffer = false;
                      let offerPercent = 0;
                      let timeLeftText = '';

                      try {
                        if (product.description && product.description.startsWith('{')) {
                          const parsed = JSON.parse(product.description);
                          if (parsed.offer_ends_at && parsed.offer_price) {
                            const endTime = new Date(parsed.offer_ends_at).getTime();
                            const now = Date.now();
                            if (endTime > now) {
                              hasActiveOffer = true;
                              displayPrice = Number(parsed.offer_price);
                              offerPercent = Number(parsed.offer_percent) || 50;
                              
                              const diffMs = endTime - now;
                              const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                              const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                              const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
                              if (diffHrs > 0) {
                                timeLeftText = `${diffHrs}h ${diffMins}m`;
                              } else if (diffMins > 0) {
                                timeLeftText = `${diffMins}m ${diffSecs}s`;
                              } else {
                                timeLeftText = `${diffSecs}s`;
                              }
                            }
                          }
                        }
                      } catch (e) {}

                      return (
                        <div key={product.id} className="border-4 border-black bg-white rounded-none flex flex-col justify-between group shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#E11D48] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] overflow-hidden">
                          <div className="relative aspect-square w-full bg-gray-50 overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(product)}>
                            {getProductImage(product) ? (
                              <img 
                                src={getProductImage(product)} 
                                alt={product.name} 
                                className="w-full h-full object-cover transition-all group-hover:scale-105 duration-300"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center font-bold text-gray-400">B</div>
                            )}

                            {/* Heavy Bold Tags */}
                            {hasActiveOffer ? (
                              <span className="absolute top-2 left-2 bg-yellow-300 text-black border-2 border-black font-black uppercase text-[8px] px-2 py-0.5 tracking-wider shadow-[2px_2px_0px_#000]">
                                FLASH: -{offerPercent}%
                              </span>
                            ) : (
                              <span className="absolute top-2 left-2 bg-[#E11D48] text-white border-2 border-black font-black uppercase text-[8px] px-2 py-0.5 tracking-wider">
                                FAST RELEASE
                              </span>
                            )}

                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                              className="absolute top-2 right-2 p-2 border-2 border-black bg-white text-black hover:bg-yellow-300 transition-colors z-20 shadow-[2px_2px_0_0_#000]"
                            >
                              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                            </button>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between space-y-4 border-t-4 border-black bg-white">
                            <div className="space-y-1">
                              <span className="inline-block bg-yellow-300 text-black border border-black font-black uppercase text-[7px] px-1.5 py-0.5">{getProductCategory(product)}</span>
                              <h4 
                                onClick={() => setSelectedProduct(product)}
                                className="font-extrabold text-black text-xs sm:text-sm hover:underline cursor-pointer uppercase tracking-tight block line-clamp-2 min-h-[2.5rem] mt-1"
                              >
                                {product.name}
                              </h4>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                              <div className="flex flex-col">
                                {hasActiveOffer ? (
                                  <div className="space-y-1">
                                    <span className="font-black text-[#E11D48] text-sm sm:text-base block">
                                      {currencySymbol}{displayPrice.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 line-through block font-black leading-none border-b-2 border-dashed border-zinc-300 w-fit">
                                      {currencySymbol}{originalPrice.toLocaleString()}
                                    </span>
                                    <span className="text-[7.5px] font-black uppercase tracking-widest text-[#E11D48] block leading-none">
                                      🔥 -{offerPercent}% OFF (ENDS: {timeLeftText})
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-black text-black text-sm sm:text-base">
                                    {currencySymbol}{displayPrice.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <button 
                                onClick={() => addToCart(product, 1)}
                                className="w-full sm:w-auto text-center px-3.5 py-2 bg-black text-white hover:bg-[#E11D48] border-2 border-black font-black text-[8px] uppercase tracking-widest shadow-[2px_2px_0_0_#fff]"
                              >
                                BUY [EX]
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </section>
        );

      case 'luxe':
        return (
          <section id="catalog" className="bg-[#0A0A0A] px-4 sm:px-6 lg:px-8 py-16 text-white max-w-7xl mx-auto">
            {/* Curated Masterpieces Horizontal Carousel Slider */}
            <div className="mb-20">
              <span className="text-[9px] tracking-[0.3em] font-black text-[#D4AF37] uppercase block mb-3 text-center">CURATED SHOWCASE</span>
              <h3 className="text-2xl md:text-3xl font-light tracking-[0.15em] uppercase text-white font-serif text-center mb-10">House Masterpieces</h3>
              
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
                {displayProducts.slice(0, 3).map((prod, i) => (
                  <div 
                    key={prod.id || i}
                    onClick={() => setSelectedProduct(prod)}
                    className="w-[85vw] sm:w-[500px] flex-shrink-0 snap-start bg-[#0E0E0E] border border-zinc-900 rounded-[4px] overflow-hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 items-center cursor-pointer hover:border-[#D4AF37] transition-all group"
                  >
                    <div className="aspect-[4/5] bg-black overflow-hidden rounded-[2px]">
                      <img src={getProductImage(prod)} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4 space-y-4">
                      <span className="text-[8px] font-black text-[#D4AF37] tracking-[0.25em] uppercase block">EXCLUSIVE NO.0{i+1}</span>
                      <h4 className="text-sm font-light text-white uppercase tracking-wider font-serif leading-tight">{prod.name}</h4>
                      <p className="text-[10px] text-[#D4AF37] font-serif leading-relaxed line-clamp-3">{prod.description || 'A timeless addition crafted for fine aesthetic appreciation.'}</p>
                      <div className="text-[#D4AF37] font-serif text-sm font-bold pt-2">{currencySymbol}{Number(prod.price).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Luxury Catalog Grid */}
            <div className="border-t border-zinc-900 pt-16 flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
              <h4 className="text-lg font-light tracking-[0.2em] uppercase text-white font-serif">{displayCatalogTitle()}</h4>
              
              <div className="flex flex-wrap gap-2 justify-center">
                {categoriesList.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 border rounded-none text-[8px] font-black tracking-[0.2em] uppercase transition-all ${
                      selectedCategory === cat 
                        ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                        : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-[#D4AF37] hover:text-[#D4AF37]'
                    }`}
                  >
                    {cat === 'All' ? 'ALL HOUSE LINES' : cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {processedProducts.length === 0 ? (
              <div className="text-center py-20 bg-[#0E0E0E] border border-zinc-900 rounded-[4px] text-zinc-500 font-serif text-xs uppercase tracking-[0.15em]">
                Curations Empty. Under Preparation.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
                {processedProducts.map((product) => {
                  const isLiked = favorites.includes(product.id);
                  let originalPrice = Number(product.price);
                  let displayPrice = originalPrice;
                  let hasActiveOffer = false;
                  let offerPercent = 0;
                  let timeLeftText = '';

                  try {
                    if (product.description && product.description.startsWith('{')) {
                      const parsed = JSON.parse(product.description);
                      if (parsed.offer_ends_at && parsed.offer_price) {
                        const endTime = new Date(parsed.offer_ends_at).getTime();
                        const now = Date.now();
                        if (endTime > now) {
                          hasActiveOffer = true;
                          displayPrice = Number(parsed.offer_price);
                          offerPercent = Number(parsed.offer_percent) || 50;
                          
                          const diffMs = endTime - now;
                          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                          const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
                          if (diffHrs > 0) {
                            timeLeftText = `${diffHrs}h ${diffMins}m`;
                          } else if (diffMins > 0) {
                            timeLeftText = `${diffMins}m ${diffSecs}s`;
                          } else {
                            timeLeftText = `${diffSecs}s`;
                          }
                        }
                      }
                    }
                  } catch (e) {}

                  return (
                    <div key={product.id} className="bg-[#0E0E0E] border border-zinc-900 rounded-[4px] overflow-hidden flex flex-col justify-between group hover:border-[#D4AF37] transition-all duration-300 shadow-md">
                      <div className="relative aspect-square bg-black overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(product)}>
                        {getProductImage(product) ? (
                          <img 
                            src={getProductImage(product)} 
                            alt={product.name} 
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-zinc-800 font-serif text-3xl">L</div>
                        )}
                        
                        {hasActiveOffer ? (
                          <span className="absolute top-3 left-3 bg-black border border-[#D4AF37] text-[#D4AF37] text-[7px] font-black uppercase tracking-[0.25em] px-2.5 py-1 shadow-[0_2px_10px_rgba(212,175,55,0.2)]">
                            EXCLUSIVE: -{offerPercent}%
                          </span>
                        ) : (
                          <span className="absolute top-3 left-3 bg-[#0A0A0A] border border-[#D4AF37]/50 text-[#D4AF37] text-[7px] font-black uppercase tracking-[0.25em] px-2.5 py-1">
                            AURELIA CLASSIC
                          </span>
                        )}

                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                          className="absolute top-3 right-3 p-2 bg-black/80 text-zinc-500 hover:text-white hover:border-[#D4AF37] transition-all z-20 border border-zinc-900 rounded"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-zinc-500'}`} />
                        </button>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between bg-[#0E0E0E] space-y-4">
                        <div className="space-y-1">
                          <span className="text-[8px] font-black text-[#D4AF37] tracking-[0.2em] uppercase block">{getProductCategory(product)}</span>
                          <h4 
                            onClick={() => setSelectedProduct(product)}
                            className="font-light text-white text-sm hover:text-[#D4AF37] cursor-pointer font-serif leading-tight line-clamp-2 min-h-[2.5rem]"
                          >
                            {product.name}
                          </h4>
                          <p className="text-[10px] text-[#D4AF37] font-serif leading-relaxed line-clamp-2">
                            {getProductDescription(product) || 'A curated masterpiece designed with fine detailing and high-end materials.'}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex flex-col">
                            {hasActiveOffer ? (
                              <div className="space-y-0.5">
                                <span className="font-bold text-[#D4AF37] font-serif text-sm block">
                                  {currencySymbol}{displayPrice.toLocaleString()}
                                </span>
                                <span className="text-xs text-zinc-500 font-serif line-through block leading-none">
                                  {currencySymbol}{originalPrice.toLocaleString()}
                                </span>
                                <span className="text-[8px] text-[#D4AF37] font-serif uppercase tracking-widest block mt-0.5 opacity-90">
                                  👑 FLASH CURATION ({timeLeftText})
                                </span>
                              </div>
                            ) : (
                              <span className="font-bold text-[#D4AF37] font-serif text-sm">
                                {currencySymbol}{displayPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => addToCart(product, 1)}
                            className="w-full sm:w-auto text-center px-5 py-2 bg-[#D4AF37] text-black hover:bg-white text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-300 rounded-[2px] border border-transparent"
                          >
                            ORDER NOW
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );

      case 'minimal':
      default:
        return (
          <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-gray-950 flex-1">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b border-gray-100">
              <h3 className="text-2xl md:text-3xl font-light tracking-[0.2em] uppercase text-gray-950">
                {displayCatalogTitle()}
              </h3>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap gap-1">
                  {categoriesList.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider border transition-all ${
                        selectedCategory === cat 
                          ? 'bg-black border-black text-white'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-black hover:text-black'
                      }`}
                    >
                      {cat === 'All' ? 'ALL FILTERS' : cat.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 border border-gray-200 rounded-none px-3 py-1.5 bg-white shadow-sm ml-auto">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-[9px] bg-transparent outline-none border-none font-bold uppercase tracking-wider text-gray-600 cursor-pointer"
                  >
                    <option value="Featured">Featured</option>
                    <option value="Price: Low to High">Price: Low to High</option>
                    <option value="Price: High to Low">Price: High to Low</option>
                    <option value="Popularity">Popularity</option>
                  </select>
                </div>
              </div>
            </div>

            {processedProducts.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 border border-dashed border-gray-200">
                <EyeOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">No Products</h3>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                {processedProducts.map((product) => {
                  const isLiked = favorites.includes(product.id);
                  let originalPrice = Number(product.price);
                  let displayPrice = originalPrice;
                  let hasActiveOffer = false;
                  let offerPercent = 0;
                  let timeLeftText = '';

                  try {
                    if (product.description && product.description.startsWith('{')) {
                      const parsed = JSON.parse(product.description);
                      if (parsed.offer_ends_at && parsed.offer_price) {
                        const endTime = new Date(parsed.offer_ends_at).getTime();
                        const now = Date.now();
                        if (endTime > now) {
                          hasActiveOffer = true;
                          displayPrice = Number(parsed.offer_price);
                          offerPercent = Number(parsed.offer_percent) || 50;
                          
                          const diffMs = endTime - now;
                          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                          const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
                          if (diffHrs > 0) {
                            timeLeftText = `${diffHrs}h ${diffMins}m`;
                          } else if (diffMins > 0) {
                            timeLeftText = `${diffMins}m ${diffSecs}s`;
                          } else {
                            timeLeftText = `${diffSecs}s`;
                          }
                        }
                      }
                    }
                  } catch (e) {}

                  return (
                    <div key={product.id} className="flex flex-col group relative bg-white border border-gray-100 p-3 hover:border-gray-300 transition-all">
                      <div className="relative aspect-[4/5] w-full bg-gray-50 overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(product)}>
                        {getProductImage(product) ? (
                          <img 
                            src={getProductImage(product)} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-3xl font-light">M</div>
                        )}

                        {hasActiveOffer && (
                          <span className="absolute top-2.5 left-2.5 bg-black text-white text-[7.5px] font-black uppercase tracking-[0.2em] px-2.5 py-1">
                            SALE: -{offerPercent}%
                          </span>
                        )}

                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                          className="absolute top-2.5 right-2.5 p-2 bg-white text-gray-400 hover:text-red-500 shadow-sm transition-colors z-20"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-black text-black' : 'text-gray-400'}`} />
                        </button>
                      </div>

                      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between bg-white mt-2">
                        <div className="space-y-1">
                          <span className="text-[8px] font-black text-gray-400 tracking-[0.2em] uppercase block">{getProductCategory(product)}</span>
                          <h4 
                            onClick={() => setSelectedProduct(product)}
                            className="font-light text-gray-950 text-xs md:text-sm hover:underline cursor-pointer tracking-wider line-clamp-2 min-h-[2.2rem]"
                          >
                            {product.name}
                          </h4>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-t border-gray-100 pt-2.5">
                          <div className="flex flex-col">
                            {hasActiveOffer ? (
                              <div className="space-y-0.5">
                                <span className="font-extrabold text-black text-xs md:text-sm block">
                                  {currencySymbol}{displayPrice.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-gray-400 line-through block leading-none font-medium">
                                  {currencySymbol}{originalPrice.toLocaleString()}
                                </span>
                                <span className="text-[8px] text-red-500 font-black uppercase tracking-[0.1em] block leading-none mt-1">
                                  🔥 SALE ({timeLeftText})
                                </span>
                              </div>
                            ) : (
                              <span className="font-extrabold text-black text-xs md:text-sm">
                                {currencySymbol}{displayPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => addToCart(product, 1)}
                            className="w-full sm:w-auto text-center px-3.5 py-2 bg-black hover:opacity-85 text-white text-[8.5px] font-black uppercase tracking-[0.15em] rounded-none transition-all"
                          >
                            ADD TO BAG
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
    }
  };

  return (
    <div className="font-theme-body bg-theme-main selection:bg-purple-600 selection:text-white min-h-screen flex flex-col transition-colors duration-300">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;0,800;0,900;1,400&display=swap');

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

        /* Dynamic Template Typography Overrides */
        .font-theme-body {
          font-family: ${
            selectedTemplate === 'admire'
              ? "'Outfit', system-ui, -apple-system, sans-serif"
              : selectedTemplate === 'artisan' || selectedTemplate === 'luxe'
                ? "'Georgia', Cambria, 'Times New Roman', Times, serif"
                : selectedTemplate === 'retro'
                  ? "'Space Grotesk', 'Plus Jakarta Sans', monospace, sans-serif"
                  : selectedTemplate === 'bold'
                    ? "'Plus Jakarta Sans', -apple-system, sans-serif"
                    : "system-ui, -apple-system, sans-serif"
          } !important;
        }
        
        .font-theme-title {
          font-family: ${
            selectedTemplate === 'admire'
              ? "'Playfair Display', 'Georgia', serif"
              : selectedTemplate === 'artisan' || selectedTemplate === 'luxe'
                ? "'Georgia', Cambria, 'Times New Roman', Times, serif"
                : selectedTemplate === 'retro'
                  ? "'Space Grotesk', 'Plus Jakarta Sans', monospace, sans-serif"
                  : selectedTemplate === 'bold'
                    ? "'Plus Jakarta Sans', -apple-system, sans-serif"
                    : "system-ui, -apple-system, sans-serif"
          } !important;
          font-weight: ${selectedTemplate === 'bold' ? '900' : selectedTemplate === 'retro' ? '850' : selectedTemplate === 'admire' ? '800' : selectedTemplate === 'artisan' ? '800' : selectedTemplate === 'luxe' ? '400' : '700'} !important;
          letter-spacing: ${selectedTemplate === 'minimal' ? '-0.03em' : selectedTemplate === 'luxe' ? '0.02em' : 'normal'} !important;
        }

        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 25s linear infinite;
        }

        /* Responsive Custom Banners and Card styling details */
        .header-theme {
          background-color: ${
            selectedTemplate === 'retro'
              ? '#09090b'
              : selectedTemplate === 'luxe'
                ? '#0A0A0A'
                : selectedTemplate === 'artisan'
                  ? '#FAF6F0'
                  : '#FFFFFF'
          } !important;
          color: ${
            selectedTemplate === 'retro'
              ? '#10B981'
              : selectedTemplate === 'luxe'
                ? '#FFFFFF'
                : '#04113f'
          } !important;
          border-bottom: ${
            selectedTemplate === 'bold'
              ? '4px solid #000000'
              : selectedTemplate === 'retro'
                ? '4px solid #000000'
                : selectedTemplate === 'luxe'
                  ? '1px solid #1f2937'
                  : selectedTemplate === 'artisan'
                    ? '1px solid #E4DAC9'
                    : selectedTemplate === 'admire'
                      ? '1px solid rgba(242, 133, 42, 0.12)'
                      : '1px solid #F3F4F6'
          } !important;
        }

        .announcement-bar-theme {
          background-color: ${
            selectedTemplate === 'bold'
              ? '#000000'
              : selectedTemplate === 'retro'
                ? '#8B5CF6'
                : selectedTemplate === 'luxe'
                  ? '#111111'
                  : selectedTemplate === 'artisan'
                    ? '#8B5A2B'
                    : selectedTemplate === 'admire'
                      ? '#f2852a'
                      : 'var(--store-primary)'
          } !important;
          color: ${
            selectedTemplate === 'retro' || selectedTemplate === 'bold'
              ? '#FFFFFF'
              : selectedTemplate === 'luxe'
                ? '#D4AF37'
                : '#FFFFFF'
          } !important;
          border-bottom: ${selectedTemplate === 'bold' ? '4px solid #000000' : 'none'} !important;
        }

        .bg-theme-main {
          background-color: ${
            selectedTemplate === 'retro'
              ? '#09090b'
              : selectedTemplate === 'luxe'
                ? '#0A0A0A'
                : selectedTemplate === 'artisan'
                  ? '#FAF6F0'
                  : selectedTemplate === 'admire'
                    ? '#FAF8F5'
                    : '#FCFCFC'
          } !important;
        }

        .card-theme {
          background-color: ${
            selectedTemplate === 'retro'
              ? '#09090b'
              : selectedTemplate === 'luxe'
                ? '#0E0E0E'
                : selectedTemplate === 'artisan'
                  ? '#FDFBF7'
                  : '#FFFFFF'
          } !important;
          border: ${
            selectedTemplate === 'bold'
              ? '4px solid #000000'
              : selectedTemplate === 'retro'
                ? '4px solid #000000'
                : selectedTemplate === 'luxe'
                  ? '1px solid #1c1c1e'
                  : selectedTemplate === 'artisan'
                    ? '1px solid #E4DAC9'
                    : selectedTemplate === 'admire'
                      ? '1px solid rgba(242, 133, 42, 0.12)'
                      : '1px solid #F3F4F6'
          } !important;
          border-radius: ${
            selectedTemplate === 'artisan'
              ? '24px'
              : selectedTemplate === 'admire'
                ? '16px'
                : selectedTemplate === 'minimal' || selectedTemplate === 'luxe'
                  ? '4px'
                  : '0px'
          } !important;
          box-shadow: ${
            selectedTemplate === 'bold'
              ? '4px 4px 0px 0px #000000'
              : selectedTemplate === 'retro'
                ? '4px 4px 0px 0px #8B5CF6'
                : 'none'
          } !important;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .card-theme:hover {
          border-color: ${selectedTemplate === 'luxe' ? '#D4AF37' : selectedTemplate === 'retro' ? '#10B981' : selectedTemplate === 'admire' ? '#f2852a' : 'inherit'} !important;
          box-shadow: ${
            selectedTemplate === 'bold'
              ? '6px 6px 0px 0px #E11D48'
              : selectedTemplate === 'retro'
                ? '6px 6px 0px 0px #10B981'
                : selectedTemplate === 'admire'
                  ? '0 10px 25px -5px rgba(242, 133, 42, 0.2), 0 8px 10px -6px rgba(242, 133, 42, 0.2)'
                  : 'none'
          } !important;
        }

        .btn-theme-primary {
          background-color: ${
            selectedTemplate === 'bold'
              ? '#000000'
              : selectedTemplate === 'retro'
                ? '#10B981'
                : selectedTemplate === 'luxe'
                  ? '#D4AF37'
                  : selectedTemplate === 'artisan'
                    ? '#8B5A2B'
                    : selectedTemplate === 'admire'
                      ? '#f2852a'
                      : 'var(--store-primary)'
          } !important;
          color: ${
            selectedTemplate === 'retro' || selectedTemplate === 'luxe' || selectedTemplate === 'bold'
              ? '#000000'
              : '#FFFFFF'
          } !important;
          font-weight: ${selectedTemplate === 'admire' ? '700' : '900'} !important;
          border: ${
            selectedTemplate === 'bold' || selectedTemplate === 'retro'
              ? '2px solid #000000'
              : 'none'
          } !important;
          border-radius: ${
            selectedTemplate === 'artisan'
              ? '9999px'
              : selectedTemplate === 'admire'
                ? '12px'
                : selectedTemplate === 'minimal' || selectedTemplate === 'luxe'
                  ? '2px'
                  : '0px'
          } !important;
          box-shadow: ${
            selectedTemplate === 'bold'
              ? '3px 3px 0px 0px #000000'
              : selectedTemplate === 'retro'
                ? '3px 3px 0px 0px #8B5CF6'
                : 'none'
          } !important;
          transition: all 0.2s ease !important;
          letter-spacing: ${selectedTemplate === 'minimal' ? '0.15em' : selectedTemplate === 'luxe' ? '0.2em' : 'normal'} !important;
        }

        .btn-theme-primary:hover {
          background-color: ${selectedTemplate === 'luxe' ? '#FFFFFF' : selectedTemplate === 'admire' ? '#04113f' : 'var(--store-primary-dark)'} !important;
          color: ${selectedTemplate === 'luxe' ? '#000000' : 'inherit'} !important;
          transform: ${
            selectedTemplate === 'bold'
              ? 'translate(-1px, -1px)'
              : selectedTemplate === 'retro'
                ? 'translate(-1.5px, -1.5px)'
                : 'scale-[1.02]'
          } !important;
          box-shadow: ${
            selectedTemplate === 'bold'
              ? '5px 5px 0px 0px #000000'
              : selectedTemplate === 'retro'
                ? '5.5px 5.5px 0px 0px #000000'
                : 'none'
          } !important;
        }

        .btn-theme-primary:active {
          transform: ${
            selectedTemplate === 'bold'
              ? 'translate(2px, 2px)'
              : selectedTemplate === 'retro'
                ? 'translate(3px, 3px)'
                : 'scale-[0.98]'
          } !important;
          box-shadow: ${
            selectedTemplate === 'bold' || selectedTemplate === 'retro'
              ? '2px 2px 0px 0px #000000'
              : 'none'
          } !important;
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
      
      {/* Dynamic Announcement Bar */}
      {renderAnnouncementBar()}

      <div className={selectedTemplate === 'retro' ? 'flex flex-col lg:flex-row min-h-screen relative w-full' : ''}>
        {/* Dynamic Sticky Header Navigation */}
        {renderHeader()}

        <div className={`flex-1 flex flex-col ${selectedTemplate === 'retro' ? 'lg:pl-80' : ''}`}>
          {/* Dynamic Hero Banner */}
          {renderHero()}

          {/* Dynamic Shoppable Video Reels Carousel */}
          {videoReels.length > 0 && (
            <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 text-left">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#f2852a] bg-orange-50 px-3 py-1 rounded-full font-theme-body">
                    🎥 Shop the Look
                  </span>
                  <h3 className="text-xl md:text-2xl font-black text-[#04113f] tracking-tight mt-2 font-theme-title">
                    Shoppable Video Reels
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-theme-body">Watch our latest handcrafted reels and buy tagged catalog products instantly!</p>
                </div>
              </div>

              {/* Reels Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {videoReels.map((reel: any, idx: number) => {
                  const embedUrl = getYouTubeEmbedUrl(reel.videoUrl || reel.url);
                  const taggedProd = displayProducts.find(p => p.id === reel.productId);
                  
                  return (
                    <div key={idx} className="card-theme overflow-hidden flex flex-col justify-between h-[450px] relative bg-white shadow-sm">
                      {/* Video Player Frame */}
                      <div className="relative w-full h-[320px] bg-black">
                        <iframe 
                          src={embedUrl}
                          title={reel.title || `Reel ${idx + 1}`}
                          className="absolute inset-0 w-full h-full border-none"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                      
                      {/* Tagged Product Checkout Banner */}
                      <div className="p-4 bg-white flex flex-col justify-between flex-grow border-t border-gray-100">
                        <div className="text-left flex flex-col justify-between h-full">
                          <h4 className="font-extrabold text-[#04113f] text-xs line-clamp-1 font-theme-title">{reel.title || "Organic Soap Story"}</h4>
                          {taggedProd ? (
                            <div className="mt-1.5 flex items-center justify-between gap-2 bg-orange-50/50 p-2 rounded-lg border border-orange-100/30">
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-gray-900 truncate font-theme-body">{taggedProd.name}</p>
                                <p className="text-[10px] font-black text-[#f2852a] mt-0.5 font-theme-body">{currencySymbol}{Number(taggedProd.price).toLocaleString()}</p>
                              </div>
                              <button 
                                onClick={() => addToCart(taggedProd, 1)}
                                className="px-2.5 py-1 bg-[#f2852a] hover:bg-[#04113f] text-white text-[9px] font-black uppercase tracking-wider rounded transition-colors font-theme-body shrink-0"
                              >
                                Buy
                              </button>
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-400 mt-2 font-theme-body">No product tagged</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Dynamic Product Display Catalog */}
          {renderCatalog()}

          {/* Dynamic Blog Storyteller Showcase */}
          {blogArticles.length > 0 && (
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-gray-100">
              <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#f2852a] bg-orange-50 px-3 py-1 rounded-full font-theme-body">
                  📖 The Storyteller
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#04113f] tracking-tight font-theme-title">
                  Articles, Recipes, & Lore
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto font-theme-body">Read about our natural botanical harvests, cold process crafting methodologies, and healthy skin tips.</p>
              </div>

              {/* Story Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogArticles.map((article: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="card-theme group cursor-pointer flex flex-col h-full bg-white shadow-sm hover:scale-[1.01]"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden bg-gray-50 border-b border-gray-100 relative">
                      {article.image ? (
                        <img 
                          src={article.image} 
                          alt={article.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-50 to-amber-50 flex items-center justify-center text-4xl">
                          🌿
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 flex flex-col justify-between flex-grow text-left">
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-[#f2852a] uppercase tracking-widest block font-theme-body">
                          {article.category || 'Lore & Harvest'}
                        </span>
                        <h4 className="font-bold text-gray-950 text-base line-clamp-2 leading-snug font-theme-title group-hover:text-[#f2852a] transition-all">
                          {article.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 font-theme-body">
                          {article.content ? article.content.replace(/<[^>]*>/g, '') : ''}
                        </p>
                      </div>
                      
                      <div className="pt-5 border-t border-gray-50 mt-5 flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-[#04113f] font-theme-body">
                        <span>Read Story</span>
                        <span>→</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

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
                {/* Coupon Validation Form */}
                <div className="border-b border-gray-100 pb-4">
                  {appliedCoupon ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between shadow-sm animate-in zoom-in-95">
                      <div className="text-left">
                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">Coupon Applied!</span>
                        <span className="text-xs font-bold text-emerald-950 mt-0.5">{appliedCoupon.code} (-{appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `${currencySymbol}${appliedCoupon.value}`})</span>
                      </div>
                      <button 
                        onClick={handleRemoveCoupon}
                        className="text-[10px] uppercase font-black tracking-wider text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          placeholder="PROMO CODE" 
                          value={couponInput}
                          onChange={e => {
                            setCouponInput(e.target.value);
                            setCouponError('');
                          }}
                          className="w-full h-10 px-3.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-purple-600 uppercase font-bold tracking-wider"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="h-10 px-4 bg-gray-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors"
                      >
                        Apply
                      </button>
                    </form>
                  )}
                  {couponError && (
                    <p className="text-[10px] font-bold text-rose-600 text-left mt-1.5 animate-in fade-in">{couponError}</p>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-950">{currencySymbol}{totalAmount.toLocaleString()}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-emerald-600 font-medium">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-${currencySymbol}{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Shipping</span>
                    <span className="text-green-600 font-extrabold uppercase text-[10px] tracking-widest">FREE</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-gray-900 font-bold uppercase tracking-wider">
                    <span>Total Amount</span>
                    <span className="font-black text-xl text-purple-700">{currencySymbol}{finalTotalAmount.toLocaleString()}</span>
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
                    className="w-full py-4 btn-theme-primary text-white font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2"
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
                  className="w-full py-3.5 btn-theme-primary text-white font-black uppercase text-xs tracking-[0.2em]"
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

      {/* Premium Luxury Storefront Flash Advertisement Pop-up Modal */}
      {flashAd && flashAd.enabled && showAdPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-gray-950 text-white rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-white/10 flex flex-col items-center p-8 md:p-10 animate-in zoom-in-95 duration-350 ease-out text-center">
            
            {/* Elegant Close Icon Button */}
            <button 
              onClick={() => setShowAdPopup(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all duration-250 border border-white/5 z-20 group"
              aria-label="Dismiss Advertisement"
            >
              <X className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
            </button>

            {/* Glowing Accent Ambient Lights */}
            <div className="absolute -left-10 -top-10 w-48 h-48 rounded-full bg-purple-600/20 blur-[60px] pointer-events-none" />
            <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-rose-600/20 blur-[60px] pointer-events-none" />

            {/* Image Section inside Modal */}
            {flashAd.image && (
              <div className="relative w-full h-52 rounded-2xl overflow-hidden mb-6 border border-white/5 shadow-inner group">
                <img 
                  src={flashAd.image} 
                  alt={flashAd.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
                
                {/* Floating promo badge */}
                <div className="absolute bottom-4 left-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase bg-gradient-to-r from-purple-500 via-rose-500 to-pink-500 text-white shadow-lg">
                    🔥 SPECIAL OFFER
                  </span>
                </div>
              </div>
            )}

            {/* Content Section */}
            <div className="space-y-4 relative z-10 w-full">
              {!flashAd.image && (
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-gradient-to-r from-purple-500 via-rose-500 to-pink-500 text-white shadow-lg animate-pulse mb-2">
                  🔥 EXCLUSIVE LIMITED OFFER
                </span>
              )}
              
              <h3 className="text-2xl md:text-3xl font-black uppercase font-luxury-sans tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-400">
                {flashAd.title}
              </h3>
              
              <p className="text-xs text-gray-300 font-light leading-relaxed px-2">
                {flashAd.subtitle}
              </p>
              
              <div className="pt-4 flex flex-col sm:flex-row gap-3 w-full">
                {/* CTA Action button */}
                <a 
                  href={flashAd.link || '#catalog'} 
                  onClick={() => setShowAdPopup(false)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs font-black uppercase tracking-widest bg-white text-gray-950 hover:bg-gray-100 transition-all transform hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(255,255,255,0.15)] shadow-lg"
                >
                  {flashAd.cta || 'Claim Offer'}
                  <ArrowRight className="w-3.5 h-3.5 text-gray-950" />
                </a>

                {/* Dismiss text button */}
                <button
                  onClick={() => setShowAdPopup(false)}
                  className="px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all text-gray-400 hover:text-white"
                >
                  No Thanks
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Trust Benefits Section placed directly above the Footer */}
      {benefits.enabled && (
        <section className="bg-white border-t border-b border-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`grid grid-cols-1 md:grid-cols-${Math.min(3, benefits.items.length)} gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100 text-center`}>
              {benefits.items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-center gap-4 px-4 py-4 md:py-0">
                  {renderBenefitIcon(item.icon)}
                  <div className="text-left">
                    <h4 className="font-bold text-gray-950 text-xs tracking-wider uppercase">{item.title}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
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
              
              {/* Dynamic Social Media Links */}
              {(socialLinks.instagram || socialLinks.facebook || socialLinks.twitter || socialLinks.youtube || socialLinks.linkedin) && (
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all duration-200 border border-white/5" aria-label="Instagram">
                      <Instagram className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {socialLinks.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all duration-200 border border-white/5" aria-label="Facebook">
                      <Facebook className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all duration-200 border border-white/5" aria-label="Twitter">
                      <Twitter className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all duration-200 border border-white/5" aria-label="YouTube">
                      <Youtube className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all duration-200 border border-white/5" aria-label="LinkedIn">
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4 text-left">
              <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-300">Quick Links</h4>
              <ul className="space-y-2.5 text-xs text-gray-400 font-light">
                <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#catalog" className="hover:text-white transition-colors">Catalog Collection</a></li>
                <li><button onClick={() => { setIsTrackOpen(true); setIsCartOpen(false); }} className="hover:text-white transition-colors">Order Tracking</button></li>
                <li><button onClick={() => setIsAboutOpen(true)} className="hover:text-white text-left transition-colors">About Business</button></li>
                {customPages.map((page: any, idx: number) => (
                  <li key={idx}>
                    <button 
                      onClick={() => setSelectedPage(page)} 
                      className="hover:text-white text-left transition-colors capitalize font-theme-body"
                    >
                      {page.title.toLowerCase()}
                    </button>
                  </li>
                ))}
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

      {/* Premium Glassmorphic About Business Modal */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-gray-100 max-w-lg w-full shadow-2xl rounded-3xl relative overflow-hidden p-8 animate-in zoom-in-95 duration-300">
            {/* Top Right Close Button */}
            <button 
              onClick={() => setIsAboutOpen(false)} 
              className="absolute top-5 right-5 p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo / Badge section */}
            <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-gray-100">
              {store.logo_url ? (
                <img 
                  src={store.logo_url} 
                  alt={store.store_name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 shadow-md"
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-xl bg-gradient-to-tr from-purple-600 to-rose-500 shadow-md"
                >
                  {store.store_name?.charAt(0).toUpperCase()}
                </div>
              )}
              
              <div>
                <span className="text-[9px] font-black text-purple-600 tracking-[0.25em] uppercase bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                  VERIFIED CREVA MERCHANT
                </span>
                <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase mt-2 font-luxury-sans">
                  {store.store_name}
                </h3>
              </div>
            </div>

            {/* Story / About description */}
            <div className="py-6 space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
                Our Story & Purpose
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                {parsedDesc || 'Experience the future of premium retail. Hand-curated items created for a timeless, beautiful lifestyle.'}
              </p>
            </div>

            {/* Verification & Support Outlets */}
            <div className="bg-gray-50 rounded-2xl p-5 space-y-3.5 border border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Business Type</span>
                <span className="font-extrabold text-gray-900 uppercase tracking-widest text-[9px]">{store.business_category || 'Retail Outlet'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Helpline Support</span>
                <span className="font-extrabold text-purple-700 text-xs">{store.contact_phone || 'WhatsApp Live Support'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Domain Service</span>
                <span className="font-mono text-[9px] text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded">
                  {store.custom_domain || `${store.subdomain}.crevasolution.in`}
                </span>
              </div>
            </div>

            {/* Bottom fulfillment tags */}
            <div className="pt-6 flex justify-center gap-3">
              <button 
                onClick={() => setIsAboutOpen(false)}
                className="w-full py-3.5 bg-gradient-to-r from-purple-700 to-rose-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-full hover:opacity-90 active:scale-95 shadow-md transition-all text-center"
              >
                Start Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Glassmorphic Blog Article Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-orange-100/40 max-w-2xl w-full shadow-2xl rounded-3xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 font-sans">
            
            {/* Cover Image or Gradient header */}
            <div className="relative aspect-[21/9] w-full bg-gray-100 overflow-hidden shrink-0 border-b border-orange-50">
              {selectedArticle.image ? (
                <img 
                  src={selectedArticle.image} 
                  alt={selectedArticle.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-100 to-amber-50 flex items-center justify-center text-5xl">
                  🌿
                </div>
              )}
              {/* Blur Overlay & Category Badge */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
                <span className="text-[10px] font-black text-white bg-[#f2852a] px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm font-theme-body">
                  {selectedArticle.category || 'Lore & Harvest'}
                </span>
              </div>
              
              {/* Close Button on image */}
              <button 
                onClick={() => setSelectedArticle(null)} 
                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all backdrop-blur-sm border border-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-left">
              {/* Meta details */}
              <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100 pb-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#f2852a]" />
                  <span>{selectedArticle.publishedAt ? new Date(selectedArticle.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'June 2, 2026'}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#f2852a]" />
                  <span>{selectedArticle.readTime || '5 Min Read'}</span>
                </div>
                <span>•</span>
                <span className="text-[#04113f]">BY CREVA BOTANICALS</span>
              </div>

              {/* Title */}
              <h3 className="text-2xl sm:text-3xl font-black text-[#04113f] tracking-tight leading-tight font-theme-title">
                {selectedArticle.title}
              </h3>

              {/* Content body */}
              <div className="prose prose-sm max-w-none text-xs sm:text-sm text-gray-600 leading-relaxed font-medium space-y-4 font-theme-body">
                {selectedArticle.content ? (
                  // Map raw HTML/Text paragraphs cleanly
                  selectedArticle.content.split('\n').map((para: string, idx: number) => {
                    const cleanPara = para.trim();
                    if (!cleanPara) return null;
                    return (
                      <p key={idx} className="mb-4" dangerouslySetInnerHTML={{ __html: cleanPara }} />
                    );
                  })
                ) : (
                  <p>No content available for this article.</p>
                )}
              </div>

              {/* Storyteller Quote highlight banner */}
              <div className="bg-orange-50/50 border-l-4 border-[#f2852a] rounded-r-2xl p-5 space-y-2 mt-6">
                <span className="text-[9px] font-black text-[#f2852a] uppercase tracking-widest block font-theme-body">CREVA HOLISTIC HARVESTS</span>
                <p className="text-xs italic text-gray-700 leading-relaxed font-theme-body">
                  "Our handmade soap blends are cold-cured for a minimum of six weeks to retain natural botanical glycerin and wild organic wellness essences."
                </p>
              </div>
            </div>

            {/* Sticky Bottom Actions footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
              <button 
                onClick={() => setSelectedArticle(null)}
                className="w-full py-3 bg-[#04113f] hover:bg-[#f2852a] text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl active:scale-[0.99] transition-all text-center"
              >
                Close Story Reader
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Premium Glassmorphic Static Page Reader Modal */}
      {selectedPage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-gray-100 max-w-xl w-full shadow-2xl rounded-3xl relative overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300 font-sans">
            
            {/* Top Close Button */}
            <button 
              onClick={() => setSelectedPage(null)} 
              className="absolute top-5 right-5 p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-full transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header section with page title */}
            <div className="px-8 pt-8 pb-5 border-b border-gray-100 text-left shrink-0">
              <span className="text-[9px] font-black text-purple-600 tracking-[0.25em] uppercase bg-purple-50 px-3 py-1 rounded-full border border-purple-100 inline-block mb-3">
                OFFICIAL STORE DOCUMENT
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase leading-tight font-theme-title">
                {selectedPage.title}
              </h3>
            </div>

            {/* Scrollable Page Content */}
            <div className="flex-1 overflow-y-auto p-8 text-left space-y-5 leading-relaxed text-xs sm:text-sm text-gray-600 font-medium font-theme-body max-h-[50vh]">
              {selectedPage.content ? (
                selectedPage.content.split('\n').map((para: string, idx: number) => {
                  const cleanPara = para.trim();
                  if (!cleanPara) return null;
                  return (
                    <p key={idx} className="mb-4" dangerouslySetInnerHTML={{ __html: cleanPara }} />
                  );
                })
              ) : (
                <p>No content available for this page.</p>
              )}
            </div>

            {/* Bottom Outlets / Terms Notice */}
            <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 shrink-0 text-left">
              <p className="text-[10px] text-gray-400 leading-normal font-medium">
                This document is officially binding for all digital orders placed on this storefront. Hand-packaged with utmost precision and care by your local artisan retailer.
              </p>
            </div>

            {/* Close Button */}
            <div className="p-4 bg-white border-t border-gray-50 flex gap-3 shrink-0">
              <button 
                onClick={() => setSelectedPage(null)}
                className="w-full py-3 bg-gradient-to-r from-purple-700 to-rose-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:opacity-90 active:scale-95 shadow-md transition-all text-center"
              >
                Accept & Close Page
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Floating Click-to-Chat WhatsApp Widget */}
      {(() => {
        // WhatsApp settings parsing
        let whatsappNumber = '';
        let whatsappEnabled = true;
        let whatsappWelcomeMessage = '';
        let selectedPlan = '30';

        try {
          if (store.description && store.description.startsWith('{')) {
            const data = JSON.parse(store.description);
            whatsappNumber = data.whatsappNumber || '';
            whatsappEnabled = data.whatsappEnabled !== false;
            whatsappWelcomeMessage = data.whatsappWelcomeMessage || '';
            selectedPlan = data.selectedPlan || '30';
          }
        } catch (e) {}

        const isGloballyEnabled = globalSettings?.whatsappEnabledGlobal !== false;
        const plansCtc = globalSettings?.whatsappPlansEnabled || ['30', '365', 'lifetime'];
        const hasClickToChat = isGloballyEnabled && plansCtc.includes(selectedPlan);
        const isWidgetVisible = hasClickToChat && whatsappEnabled && whatsappNumber.trim().length > 0;

        if (!isWidgetVisible) return null;

        const cleanNumber = whatsappNumber.replace(/\D/g, '');
        const messageToSend = whatsappWelcomeMessage.trim() || globalSettings?.whatsappDefaultWelcome || "Hi! I would like to query about your products.";
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageToSend)}`;

        return (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Chat with us on WhatsApp"
            className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group overflow-hidden border border-emerald-400/20"
            style={{
              boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 8px 10px -6px rgba(16, 185, 129, 0.4)'
            }}
          >
            {/* Pulsing glow spot */}
            <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-0 group-hover:animate-ping group-hover:opacity-20 pointer-events-none" />
            
            <MessageCircle className="w-6 h-6 animate-pulse" />
            
            {/* Tooltip */}
            <span className="absolute right-16 bg-slate-900 text-white font-bold tracking-wider text-[9px] uppercase px-3 py-1.5 rounded-lg opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap shadow-md pointer-events-none">
              Chat with us
            </span>
          </a>
        );
      })()}

    </div>
  );
}
