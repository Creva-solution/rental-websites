'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  MessageSquare, X, Minimize2, Maximize2, Send, Sparkles, BookOpen, 
  Bot, Phone, FileText, ChevronRight, CheckCircle2, ArrowLeft, Loader2,
  Layout, CreditCard, ShoppingBag, Landmark, Clipboard, AlertTriangle, UserCheck, Check, Trash2, ArrowUpRight, Upload, Headphones, Globe
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
  actionType?: 'create_product' | 'confirm_update' | 'confirm_delete';
  actionData?: any;
}

interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  subtitle?: string;
  timestamp: Date;
}

export default function StoreAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge' | 'checklist' | 'ticket'>('chat');
  const [input, setInput] = useState('');
  
  // Real database states
  const [storeData, setStoreData] = useState<any>(null);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [integrationsList, setIntegrationsList] = useState<any[]>([]);
  const isAIConnected = useMemo(() => {
    return integrationsList.some((i: any) =>
      ['meta_ai', 'meta_llama', 'openai', 'anthropic_claude'].includes(i.type) &&
      i.is_enabled === true &&
      i.config?.verified === true
    );
  }, [integrationsList]);

  const connectedAIProviderName = useMemo(() => {
    const active = integrationsList.find((i: any) =>
      ['meta_ai', 'meta_llama', 'openai', 'anthropic_claude'].includes(i.type) &&
      i.is_enabled === true &&
      i.config?.verified === true
    );
    if (!active) return '';
    if (active.type === 'openai') return 'OpenAI';
    if (active.type === 'anthropic_claude') return 'Anthropic Claude';
    return 'Groq / Llama';
  }, [integrationsList]);

  const activeAIConfig = useMemo(() => {
    const active = integrationsList.find((i: any) =>
      ['meta_ai', 'meta_llama', 'openai', 'anthropic_claude'].includes(i.type) &&
      i.is_enabled === true &&
      i.config?.verified === true
    );
    if (!active) return null;
    return {
      type: active.type,
      apiKey: active.config?.api_key || active.config?.apiKey || '',
      providerName: active.type === 'openai' ? 'OpenAI' : active.type === 'anthropic_claude' ? 'Anthropic Claude' : 'Groq / Llama'
    };
  }, [integrationsList]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [storeHealth, setStoreHealth] = useState<'Good' | 'Needs Attention' | 'Almost Ready'>('Needs Attention');
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Dynamic notifications stack
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  // Inline action forms states
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('10');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Ticket form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketStatus, setTicketStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [guideSearch, setGuideSearch] = useState('');

  // Conversational state machine for interactive actions
  const [assistantState, setAssistantState] = useState<{
    activeIntent: 'ADD_LOGO' | 'ADD_PRODUCT' | 'EDIT_PRODUCT' | 'DELETE_PRODUCT' | 'PAYMENT_GATEWAY' | 'UPI' | 'DOMAIN' | 'ANALYZE_STORE' | null;
    currentStep: number;
    collectedData: Record<string, any>;
    pendingConfirmation: boolean;
  }>({
    activeIntent: null,
    currentStep: 0,
    collectedData: {},
    pendingConfirmation: false
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Fetch all live settings on mount and listen to AI configuration changes
  useEffect(() => {
    fetchStoreStatus();

    const handleAIChange = () => {
      fetchStoreStatus();
    };
    window.addEventListener('ai-integration-changed', handleAIChange);
    return () => window.removeEventListener('ai-integration-changed', handleAIChange);
  }, []);

  // Listen to global activity notifications broadcasted from other admin pages
  useEffect(() => {
    const handleGlobalActivity = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { type, message, subtitle } = customEvent.detail;
        addNotification(type || 'info', message || 'Action completed', subtitle || '');
        // Refresh store status details to dynamically recalculate progress
        fetchStoreStatus();
      }
    };
    window.addEventListener('store_activity', handleGlobalActivity);
    return () => window.removeEventListener('store_activity', handleGlobalActivity);
  }, []);

  const addNotification = (type: 'success' | 'info' | 'warning' | 'error', message: string, subtitle?: string) => {
    const newNotif: ToastNotification = {
      id: Math.random().toString(36).substring(2) + Date.now(),
      type,
      message,
      subtitle,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Auto-remove success/info notifications after 5 seconds
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        dismissNotification(newNotif.id);
      }, 5000);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchStoreStatus = async () => {
    try {
      setLoadingStatus(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get store
      const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .neq('subdomain', '__creva_saas_global_settings__')
        .maybeSingle();

      if (store) {
        setStoreData(store);

        // Get products
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id);
        const prods = products || [];
        setProductsList(prods);

        // Get categories
        const { data: categories } = await supabase
          .from('categories')
          .select('*')
          .eq('store_id', store.id);
        setCategoriesList(categories || []);

        // Get integrations
        const { data: integrations } = await supabase
          .from('integrations')
          .select('*')
          .eq('store_id', store.id);
        const ints = integrations || [];
        setIntegrationsList(ints);

        // Calculate progress percentage
        let score = 0;
        if (store.store_name) score += 10;
        if (store.logo_url) score += 10;
        if (store.description) score += 10;
        if (store.contact_phone || store.contact_email) score += 10;
        if (store.primary_color) score += 10;
        if (prods.length > 0) score += 15;
        
        // Product image checklist score
        const hasProductImage = prods.some((p: any) => {
          try {
            const desc = JSON.parse(p.description);
            return desc.image_url !== '';
          } catch(e) {
            return false;
          }
        });
        if (hasProductImage) score += 10;

        if (categories && categories.length > 0) score += 5;
        if (ints.length > 0) score += 10;
        if (!store.is_paused) score += 10;

        setCompletionPercentage(score);

        // Set store health status
        if (!store.is_paused && prods.length > 0 && ints.length > 0) {
          setStoreHealth('Good');
        } else if (prods.length > 0 || ints.length > 0) {
          setStoreHealth('Almost Ready');
        } else {
          setStoreHealth('Needs Attention');
        }

        // Initialize welcome message with real data
        if (messages.length === 0) {
          let ownerName = 'Ruth';
          if (store.description) {
            try {
              const desc = JSON.parse(store.description);
              if (desc.signedName) {
                ownerName = desc.signedName.trim().split(' ')[0];
              }
            } catch (e) {}
          }
          setMessages([
            {
              sender: 'ai',
              text: `Welcome back, ${ownerName} 👋\n\nI have analyzed your store setup.\nYour storefront configuration is currently ${score}% complete.\n\n${
                !store.logo_url 
                  ? "⚠ Store logo is missing.\nAdding a logo will make your storefront feel more complete and professional." 
                  : "✓ Your logo and branding properties are all set."
              }`,
              timestamp: new Date()
            }
          ]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch store status helper:", e);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleCreateProductInline = async () => {
    if (!newProductName.trim() || !newProductPrice.trim()) return;

    try {
      setActionLoading(true);
      const descData = {
        description: newProductDesc,
        category: 'Fashion',
        sizes: ['S', 'M', 'L'],
        colors: ['Black', 'White'],
        image_url: ''
      };

      const { error } = await supabase.from('products').insert([{
        store_id: storeData.id,
        name: newProductName.trim(),
        price: Number(newProductPrice),
        sku: 'SKU-' + Math.floor(Math.random()*10000),
        description: JSON.stringify(descData),
        is_active: true,
        inventory_quantity: Number(newProductStock)
      }]);

      if (error) throw error;

      // Add success response
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `✓ **Product Created Successfully!**\n\n**Name:** ${newProductName}\n**Price:** ₹${newProductPrice}\n**Stock:** ${newProductStock} units`,
        timestamp: new Date()
      }]);

      addNotification('success', 'Product created successfully', newProductName);

      // Clean form and reload
      setNewProductName('');
      setNewProductPrice('');
      setNewProductDesc('');
      setNewProductStock('10');
      fetchStoreStatus();
    } catch (err: any) {
      console.error(err);
      addNotification('error', 'Product creation failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePrice = async (prodId: string, newPrice: number, prodName: string) => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('products')
        .update({ price: newPrice })
        .eq('id', prodId);

      if (error) throw error;

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `✓ **Price Updated!**\n\nUpdated *${prodName}* price successfully to **₹${newPrice}**.`,
        timestamp: new Date()
      }]);

      addNotification('success', 'Price updated successfully', `${prodName} • ₹${newPrice}`);
      fetchStoreStatus();
    } catch (err: any) {
      console.error(err);
      addNotification('error', 'Update price failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProductConfirm = async (prodId: string, prodName: string) => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', prodId);

      if (error) throw error;

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `✓ **Product Deleted!**\n\nRemoved *${prodName}* from your catalog.`,
        timestamp: new Date()
      }]);

      addNotification('success', 'Product deleted successfully', prodName);
      fetchStoreStatus();
    } catch (err: any) {
      console.error(err);
      addNotification('error', 'Delete product failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Local knowledge base for Level 1 - Smart Help Assistant
  const LOCAL_KNOWLEDGE_BASE = [
    {
      id: 'create_store',
      keywords: ['create store', 'new store', 'build store', 'store eppadi', 'store create', 'கடை', 'दुकान'],
      response: 'To create your store, follow our onboarding wizard step-by-step to enter your business name, branding details, and preferences.',
      action: { label: 'Open Settings', route: '/admin/settings' }
    },
    {
      id: 'change_store_name',
      keywords: ['change store name', 'rename store', 'store name change', 'peyar', 'பெயர்', 'नाम'],
      response: 'Go to Settings → Store Profile. Edit your Store Name field, then scroll down and click Save changes.',
      action: { label: 'Open Settings', route: '/admin/settings' }
    },
    {
      id: 'add_logo',
      keywords: ['add logo', 'upload logo', 'logo add', 'logo epdi', 'logo ippati', 'branding logo', 'லோகோ', 'लोगो'],
      response: 'Go to Store Setup → Branding Design → Logo. Upload your PNG or JPG logo, then click Save Changes.',
      action: { label: 'Open Branding Design', route: '/admin/appearance' }
    },
    {
      id: 'change_brand_color',
      keywords: ['change brand color', 'color change', 'brand color', 'theme color', 'வண்ணம்', 'रंग'],
      response: 'Go to Store Setup → Appearance → Theme Settings. Select your primary brand color or drag the color picker, then click Save.',
      action: { label: 'Open Appearance Settings', route: '/admin/appearance' }
    },
    {
      id: 'select_template',
      keywords: ['select template', 'change theme', 'template select', 'theme select', 'வார்ப்புரு', 'टैम्पलेट'],
      response: 'Go to Store Setup → Appearance → Choose Template. Select one of our premium templates and click Apply to update your storefront.',
      action: { label: 'Open Templates Gallery', route: '/admin/appearance' }
    },
    {
      id: 'change_domain',
      keywords: ['change domain', 'custom domain', 'subdomain', 'domain set', 'டொமைன்', 'डोमेन'],
      response: 'Go to Settings → Store Address. Enter your preferred subdomain slug or connect your custom domain pointing to Creva webs servers, then click Update.',
      action: { label: 'Open Store Address', route: '/admin/settings' }
    },
    {
      id: 'add_product',
      keywords: ['add product', 'create product', 'new product', 'product add', 'பொருள்', 'उत्पाद'],
      response: 'Go to Products → Add Product. Enter your product name, price, category, stock count, and upload an image.',
      action: { label: 'Open Add Product', route: '/admin/products' }
    },
    {
      id: 'edit_product',
      keywords: ['edit product', 'update product', 'product edit', 'modify product'],
      response: 'Go to Products → View Catalog. Click the edit edit icon on the product row to update descriptions, details, or categories.',
      action: { label: 'Open Catalog', route: '/admin/products' }
    },
    {
      id: 'delete_product',
      keywords: ['delete product', 'remove product', 'product delete'],
      response: 'Go to Products → View Catalog. Click the red trash delete icon next to the product you wish to delete and confirm.',
      action: { label: 'Open Catalog', route: '/admin/products' }
    },
    {
      id: 'add_product_image',
      keywords: ['add product image', 'product photo', 'product image'],
      response: 'Go to Products → View Catalog → Edit Product. Under the Product Media section, upload your images and click save.',
      action: { label: 'Open Catalog', route: '/admin/products' }
    },
    {
      id: 'manage_stock',
      keywords: ['manage stock', 'update stock', 'inventory', 'stock manage', 'இருப்பு', 'स्टॉक'],
      response: 'Go to Products → View Catalog. You can directly edit the inventory numbers in the Stock column of each item.',
      action: { label: 'Open Catalog', route: '/admin/products' }
    },
    {
      id: 'change_product_price',
      keywords: ['change product price', 'update price', 'price update', 'விலை', 'कीमत'],
      response: 'Go to Products → View Catalog. Click the price field on any product row, edit the value directly, and save.',
      action: { label: 'Open Catalog', route: '/admin/products' }
    },
    {
      id: 'see_orders',
      keywords: ['see orders', 'view orders', 'order check', 'where order', 'ஆர்டர்', 'ऑर्डर'],
      response: 'Go to Orders tab in your sidebar dashboard. You can view pending, shipped, paid, and completed order list logs.',
      action: { label: 'Open Orders Dashboard', route: '/admin/orders' }
    },
    {
      id: 'update_order_status',
      keywords: ['update order status', 'order status', 'change status'],
      response: 'Go to Orders, click the Inspect button on the order row, and use the status dropdown in the timeline drawer to select processing, shipped, or completed.',
      action: { label: 'Open Orders', route: '/admin/orders' }
    },
    {
      id: 'mark_order_delivered',
      keywords: ['mark order delivered', 'delivered', 'complete order'],
      response: 'Go to Orders, click Inspect on the order drawer, and select "completed" or "delivered" status from the timeline stepper to mark it done.',
      action: { label: 'Open Orders', route: '/admin/orders' }
    },
    {
      id: 'add_payment_gateway',
      keywords: ['add payment gateway', 'payment gateway', 'connect gateway', 'வழிகள்', 'गेटवे'],
      response: 'Go to Settings → Integrations. Here you can configure credentials for payment gateways like Razorpay, Stripe, PhonePe, and Cashfree.',
      action: { label: 'Open Integrations', route: '/admin/integrations' }
    },
    {
      id: 'configure_razorpay',
      keywords: ['configure razorpay', 'razorpay setup', 'connect razorpay'],
      response: 'Go to Settings → Integrations. Click Configure on Razorpay card, enter Key ID and Key Secret from Razorpay settings dashboard, test, and save.',
      action: { label: 'Open Integrations', route: '/admin/integrations' }
    },
    {
      id: 'configure_cashfree',
      keywords: ['configure cashfree', 'cashfree setup', 'connect cashfree'],
      response: 'Go to Settings → Integrations. Click Configure on Cashfree card, enter App ID and Secret Key from Cashfree merchant console, and click save.',
      action: { label: 'Open Integrations', route: '/admin/integrations' }
    },
    {
      id: 'configure_phonepe',
      keywords: ['configure phonepe', 'phonepe setup', 'connect phonepe'],
      response: 'Go to Settings → Integrations. Click Configure on PhonePe card, enter your Merchant ID and Salt Key details, and click connect.',
      action: { label: 'Open Integrations', route: '/admin/integrations' }
    },
    {
      id: 'create_coupons',
      keywords: ['create coupons', 'add coupon', 'discount code', 'குப்பன்', 'कूपन'],
      response: 'Go to Marketing Hub → Discount Coupons. Click Add Coupon, configure coupon code, percentage/flat rate discount rules, validity, and click save.',
      action: { label: 'Open Discounts', route: '/admin/discounts' }
    },
    {
      id: 'create_discount',
      keywords: ['create discount', 'add discount', 'discount create', 'தள்ளுபடி', 'छूट'],
      response: 'Go to Marketing Hub → Discount Coupons. Create flat rate discounts, percentage deductions, or free shipping rules and save.',
      action: { label: 'Open Discounts', route: '/admin/discounts' }
    },
    {
      id: 'share_store',
      keywords: ['share store', 'share website', 'store link', 'பகிர்', 'शेयर'],
      response: 'Copy your storefront subdomain link from the header banner or store address settings, and send it to your WhatsApp users or customers.',
      action: { label: 'Open Settings', route: '/admin/settings' }
    },
    {
      id: 'update_contact_details',
      keywords: ['update contact details', 'change email', 'change phone', 'contact update', 'தொடர்பு', 'संपर्क'],
      response: 'Go to Settings → Contact Details. Edit your store contact phone number, address, support email, and save.',
      action: { label: 'Open Settings', route: '/admin/settings' }
    },
    {
      id: 'change_currency',
      keywords: ['change currency', 'currency update', 'rupee', 'நாணயம்', 'முद्रा'],
      response: 'Go to Settings → Preferences. Select your shop currency symbol (INR ₹, USD $, etc.) from the dropdown and save.',
      action: { label: 'Open Settings', route: '/admin/settings' }
    },
    {
      id: 'configure_delivery',
      keywords: ['configure delivery', 'shipping settings', 'delivery configure', 'விநியோகம்', 'वितरण'],
      response: 'Go to Settings → Delivery / Shipping. Enter shipping costs, zone rules, or delivery guidelines details, and save changes.',
      action: { label: 'Open Settings', route: '/admin/settings' }
    }
  ];

  // Intents Dictionary configuration supporting English, Tamil, Tanglish, Hindi, Malayalam, Telugu, Kannada
  const intents = {
    add_logo: {
      keywords: [
        "add logo", "logo add", "upload logo", "logo update", "logo change", "logo pannanum", "logo add pannum", "logo add panna", "logo change panna",
        "லோகோ", "लोगो", "ലോഗോ", "లోగో", "ಲೋಗೋ"
      ],
      action: "ADD_LOGO"
    },
    add_product: {
      keywords: [
        "add product", "create product", "product add", "new product", "product add pannum", "product add pannanum",
        "உருவாக்கு", "தயாரிப்பு", "प्रोडक्ट", "ഉൽപ്പന്നം", "ఉత్పత్తి", "ಉತ್ಪನ್ನ"
      ],
      action: "ADD_PRODUCT"
    },
    payment_gateway: {
      keywords: [
        "payment gateway", "add payment", "payment setup", "razorpay", "cashfree", "stripe", "payment gateway add pannum", "gateway setup",
        "பேமெண்ட்", "पेमेंट", "പേയ്‌മെന്റ്", "పేమెంట్", "ಪೇಮೆಂಟ್"
      ],
      action: "PAYMENT_GATEWAY"
    },
    upi: {
      keywords: [
        "upi add", "add upi", "upi payment", "upi config", "upi setup", "upi add pannum"
      ],
      action: "UPI"
    },
    change_price: {
      keywords: [
        "change price", "update price", "price change", "price update", "விலை", "कीमत", "വില", "ధర", "ಬೆಲೆ", "price change pannanum"
      ],
      action: "EDIT_PRODUCT"
    },
    delete_product: {
      keywords: [
        "delete product", "remove product", "delete panna", "remove pannanum"
      ],
      action: "DELETE_PRODUCT"
    },
    domain: {
      keywords: [
        "domain", "subdomain", "domain change", "custom domain", "domain set", "domain set pannanum"
      ],
      action: "DOMAIN"
    },
    analyze_store: {
      keywords: [
        "analyze store", "check store", "store analysis", "en store analyze", "store check pannu", "analyze", "பகுப்பாய்வு", "বিশ্লেষণ"
      ],
      action: "ANALYZE_STORE"
    }
  };

  const resetWizard = () => {
    setAssistantState({
      activeIntent: null,
      currentStep: 0,
      collectedData: {},
      pendingConfirmation: false
    });
  };

  const startWizardFlow = (intent: any) => {
    setAssistantState({
      activeIntent: intent,
      currentStep: 1,
      collectedData: {},
      pendingConfirmation: false
    });

    let greeting = '';
    if (intent === 'ADD_LOGO') {
      if (storeData?.logo_url) {
        greeting = 'Your store already has a logo. Would you like to replace it? Please select an action below.';
      } else {
        greeting = 'Sure. Please upload your store logo.';
      }
    } else if (intent === 'ADD_PRODUCT') {
      greeting = "Sure. Let's add a new product. What is the product name?";
    } else if (intent === 'EDIT_PRODUCT') {
      greeting = 'Which product would you like to update? Please enter or select the product name below.';
    } else if (intent === 'DELETE_PRODUCT') {
      greeting = 'Which product would you like to delete? Please enter or select the product name below.';
    } else if (intent === 'PAYMENT_GATEWAY') {
      greeting = 'Sure. Which payment provider would you like to connect? Choose Razorpay, Cashfree, Stripe, or UPI.';
    } else if (intent === 'UPI') {
      greeting = 'Enter your UPI ID (e.g. merchant@okaxis):';
    } else if (intent === 'DOMAIN') {
      greeting = 'Would you like to use a CrevaWebs subdomain or your own custom domain? Select an option below.';
    } else if (intent === 'ANALYZE_STORE') {
      greeting = `Store Setup Analysis
Setup Completion Score: ${completionPercentage}% Complete

Completed Tasks:
✓ Business Information
✓ Branding Logo
✓ Contact Details

Needs Attention:
○ Payment Gateway Setup
○ Subdomain / Domain Setup
○ Account Verification Setup

Recommended Next Step:
Set up your payment method to start receiving online payments.`;
      resetWizard();
    }

    setMessages(prev => [...prev, {
      sender: 'ai',
      text: greeting,
      timestamp: new Date()
    }]);
    setIsTyping(false);
  };

  const handleWizardStepInput = (text: string) => {
    const { activeIntent, currentStep } = assistantState;
    const collectedData = assistantState.collectedData as any;
    if (!activeIntent) return;

    if (activeIntent === 'ADD_PRODUCT') {
      if (currentStep === 1) {
        setAssistantState(prev => ({
          ...prev,
          currentStep: 2,
          collectedData: { ...prev.collectedData, name: text }
        }));
        setMessages(prev => [...prev, { sender: 'ai', text: 'What is the product price (in ₹)?', timestamp: new Date() }]);
      } else if (currentStep === 2) {
        const price = parseFloat(text);
        if (isNaN(price)) {
          setMessages(prev => [...prev, { sender: 'ai', text: 'Please enter a valid price number.', timestamp: new Date() }]);
          setIsTyping(false);
          return;
        }
        setAssistantState(prev => ({
          ...prev,
          currentStep: 3,
          collectedData: { ...prev.collectedData, price }
        }));
        setMessages(prev => [...prev, { sender: 'ai', text: 'What is the category for this product?', timestamp: new Date() }]);
      } else if (currentStep === 3) {
        setAssistantState(prev => ({
          ...prev,
          currentStep: 4,
          collectedData: { ...prev.collectedData, category: text }
        }));
        setMessages(prev => [...prev, { sender: 'ai', text: 'Enter a brief description for this product:', timestamp: new Date() }]);
      } else if (currentStep === 4) {
        setAssistantState(prev => ({
          ...prev,
          currentStep: 5,
          collectedData: { ...prev.collectedData, description: text }
        }));
        setMessages(prev => [...prev, { sender: 'ai', text: 'Add an optional image URL or upload a file for the product:', timestamp: new Date() }]);
      } else if (currentStep === 5) {
        setAssistantState(prev => ({
          ...prev,
          currentStep: 6,
          collectedData: { ...prev.collectedData, image_url: text }
        }));
        setMessages(prev => [...prev, { sender: 'ai', text: 'Enter the available stock quantity:', timestamp: new Date() }]);
      } else if (currentStep === 6) {
        const stock = parseInt(text);
        if (isNaN(stock)) {
          setMessages(prev => [...prev, { sender: 'ai', text: 'Please enter a valid stock quantity.', timestamp: new Date() }]);
          setIsTyping(false);
          return;
        }
        const updatedData = { ...collectedData, stock };
        setAssistantState(prev => ({
          ...prev,
          currentStep: 7,
          collectedData: updatedData,
          pendingConfirmation: true
        }));
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: `Here is your product details:
Product Name: ${updatedData.name}
Price: ₹${updatedData.price}
Category: ${updatedData.category}
Description: ${updatedData.description}
Stock: ${updatedData.stock} units

Would you like to create this product?`,
          timestamp: new Date()
        }]);
      }
      setIsTyping(false);
    } 
    else if (activeIntent === 'EDIT_PRODUCT') {
      if (currentStep === 1) {
        const match = productsList.find(p => p.name.toLowerCase().includes(text.toLowerCase()));
        if (!match) {
          setMessages(prev => [...prev, { sender: 'ai', text: `Sorry, I couldn't find any product matching "${text}". Please enter or select a valid name.`, timestamp: new Date() }]);
          setIsTyping(false);
          return;
        }
        setAssistantState(prev => ({
          ...prev,
          currentStep: 2,
          collectedData: { ...prev.collectedData, selectedProduct: match }
        }));
        setMessages(prev => [...prev, { sender: 'ai', text: `Current price: ₹${match.price}\nWhat should be the new price?`, timestamp: new Date() }]);
      } else if (currentStep === 2) {
        const newPrice = parseFloat(text);
        if (isNaN(newPrice)) {
          setMessages(prev => [...prev, { sender: 'ai', text: 'Please enter a valid price number.', timestamp: new Date() }]);
          setIsTyping(false);
          return;
        }
        const updatedData = { ...collectedData, newPrice };
        setAssistantState(prev => ({
          ...prev,
          currentStep: 3,
          collectedData: updatedData,
          pendingConfirmation: true
        }));
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: `Product: ${collectedData.selectedProduct.name}
Old Price: ₹${collectedData.selectedProduct.price}
New Price: ₹${newPrice}

Would you like to update the price?`,
          timestamp: new Date()
        }]);
      }
      setIsTyping(false);
    }
    else if (activeIntent === 'DELETE_PRODUCT') {
      if (currentStep === 1) {
        const match = productsList.find(p => p.name.toLowerCase().includes(text.toLowerCase()));
        if (!match) {
          setMessages(prev => [...prev, { sender: 'ai', text: `Sorry, I couldn't find any product matching "${text}". Please enter or select a valid name.`, timestamp: new Date() }]);
          setIsTyping(false);
          return;
        }
        setAssistantState(prev => ({
          ...prev,
          currentStep: 2,
          collectedData: { selectedProduct: match },
          pendingConfirmation: true
        }));
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: `Are you sure you want to delete ${match.name}?\n\nThis action cannot be undone.`,
          timestamp: new Date()
        }]);
      }
      setIsTyping(false);
    }
    else if (activeIntent === 'PAYMENT_GATEWAY') {
      if (currentStep === 2) {
        setAssistantState(prev => ({
          ...prev,
          currentStep: 3,
          collectedData: { ...prev.collectedData, keyId: text }
        }));
        setMessages(prev => [...prev, { sender: 'ai', text: `Enter key secret details for ${collectedData.provider}:`, timestamp: new Date() }]);
      } else if (currentStep === 3) {
        const updatedData = { ...collectedData, keySecret: text };
        setAssistantState(prev => ({
          ...prev,
          currentStep: 4,
          collectedData: updatedData,
          pendingConfirmation: true
        }));

        const maskedKey = updatedData.keyId.length > 8 
          ? `${updatedData.keyId.substring(0, 8)}****${updatedData.keyId.substring(updatedData.keyId.length - 4)}` 
          : '••••••••••••';

        setMessages(prev => [...prev, {
          sender: 'ai',
          text: `Provider: ${collectedData.provider}
Key ID: ${maskedKey}
Key Secret: ••••••••••••
Status: Ready to Connect

Would you like to save and activate ${collectedData.provider}?`,
          timestamp: new Date()
        }]);
      }
      setIsTyping(false);
    }
    else if (activeIntent === 'UPI') {
      if (currentStep === 1) {
        if (!text.includes('@')) {
          setMessages(prev => [...prev, { sender: 'ai', text: 'Please enter a valid UPI ID format (containing @).', timestamp: new Date() }]);
          setIsTyping(false);
          return;
        }
        setAssistantState(prev => ({
          ...prev,
          currentStep: 2,
          collectedData: { ...prev.collectedData, upiId: text }
        }));
        setMessages(prev => [...prev, { sender: 'ai', text: 'Enter the account holder name:', timestamp: new Date() }]);
      } else if (currentStep === 2) {
        const updatedData = { ...collectedData, holderName: text };
        setAssistantState(prev => ({
          ...prev,
          currentStep: 3,
          collectedData: updatedData,
          pendingConfirmation: true
        }));
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: `UPI ID: ${updatedData.upiId}
Holder Name: ${updatedData.holderName}

Would you like to save and connect this UPI configuration?`,
          timestamp: new Date()
        }]);
      }
      setIsTyping(false);
    }
    else {
      setIsTyping(false);
    }
  };

  const handleSaveLogoWizard = async (logoUrl: string) => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('stores')
        .update({ logo_url: logoUrl })
        .eq('id', storeData.id);
      if (error) throw error;
      setMessages(prev => [...prev, { sender: 'ai', text: 'Your store logo has been updated successfully.', timestamp: new Date() }]);
      addNotification('success', 'Logo updated successfully', storeData.store_name);
      fetchStoreStatus();
    } catch (e: any) {
      addNotification('error', 'Failed to save logo', e.message);
    } finally {
      setActionLoading(false);
      resetWizard();
    }
  };

  const handleCreateProductWizard = async () => {
    try {
      setActionLoading(true);
      const data = assistantState.collectedData;
      const descData = {
        description: data.description || '',
        category: data.category || 'General',
        sizes: [],
        colors: [],
        image_url: data.image_url || ''
      };
      const { error } = await supabase.from('products').insert([{
        store_id: storeData.id,
        name: data.name,
        price: Number(data.price),
        sku: 'SKU-' + Math.floor(Math.random() * 10000),
        description: JSON.stringify(descData),
        is_active: true,
        inventory_quantity: Number(data.stock || 10)
      }]);
      if (error) throw error;
      setMessages(prev => [...prev, { sender: 'ai', text: 'Product created successfully!', timestamp: new Date() }]);
      addNotification('success', 'Product created successfully', data.name);
      fetchStoreStatus();
    } catch (e: any) {
      addNotification('error', 'Failed to create product', e.message);
    } finally {
      setActionLoading(false);
      resetWizard();
    }
  };

  const handleUpdatePriceWizard = async () => {
    try {
      setActionLoading(true);
      const { selectedProduct, newPrice } = assistantState.collectedData;
      const { error } = await supabase
        .from('products')
        .update({ price: newPrice })
        .eq('id', selectedProduct.id);
      if (error) throw error;
      setMessages(prev => [...prev, { sender: 'ai', text: `Updated ${selectedProduct.name} price successfully to ₹${newPrice}.`, timestamp: new Date() }]);
      addNotification('success', 'Price updated successfully', selectedProduct.name);
      fetchStoreStatus();
    } catch (e: any) {
      addNotification('error', 'Failed to update price', e.message);
    } finally {
      setActionLoading(false);
      resetWizard();
    }
  };

  const handleDeleteProductWizard = async () => {
    try {
      setActionLoading(true);
      const { selectedProduct } = assistantState.collectedData;
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id);
      if (error) throw error;
      setMessages(prev => [...prev, { sender: 'ai', text: `Removed ${selectedProduct.name} from your catalog.`, timestamp: new Date() }]);
      addNotification('success', 'Product deleted successfully', selectedProduct.name);
      fetchStoreStatus();
    } catch (e: any) {
      addNotification('error', 'Failed to delete product', e.message);
    } finally {
      setActionLoading(false);
      resetWizard();
    }
  };

  const handleSaveGatewayWizard = async () => {
    try {
      setActionLoading(true);
      const { provider, keyId, keySecret } = assistantState.collectedData;
      const config = { keyId, keySecret };
      const typeVal = provider.toLowerCase();
      
      const { data: existing } = await supabase
        .from('integrations')
        .select('id')
        .eq('store_id', storeData.id)
        .eq('type', typeVal)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('integrations')
          .update({
            is_enabled: true,
            config: JSON.stringify(config)
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('integrations')
          .insert([{
            store_id: storeData.id,
            type: typeVal,
            is_enabled: true,
            config: JSON.stringify(config)
          }]);
        if (error) throw error;
      }

      setMessages(prev => [...prev, { sender: 'ai', text: `${provider} has been connected and activated successfully.`, timestamp: new Date() }]);
      addNotification('success', `${provider} activated`, storeData.store_name);
      fetchStoreStatus();
    } catch (e: any) {
      addNotification('error', 'Failed to connect gateway', e.message);
    } finally {
      setActionLoading(false);
      resetWizard();
    }
  };

  const handleSaveUPIWizard = async () => {
    try {
      setActionLoading(true);
      const { upiId, holderName } = assistantState.collectedData;
      const config = { upiId, holderName };

      const { data: existing } = await supabase
        .from('integrations')
        .select('id')
        .eq('store_id', storeData.id)
        .eq('type', 'upi')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('integrations')
          .update({
            is_enabled: true,
            config: JSON.stringify(config)
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('integrations')
          .insert([{
            store_id: storeData.id,
            type: 'upi',
            is_enabled: true,
            config: JSON.stringify(config)
          }]);
        if (error) throw error;
      }

      setMessages(prev => [...prev, { sender: 'ai', text: 'UPI payments connected successfully.', timestamp: new Date() }]);
      addNotification('success', 'UPI Connected', upiId);
      fetchStoreStatus();
    } catch (e: any) {
      addNotification('error', 'Failed to connect UPI', e.message);
    } finally {
      setActionLoading(false);
      resetWizard();
    }
  };

  const handleSaveSubdomainWizard = async (subdomain: string) => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('stores')
        .update({ subdomain })
        .eq('id', storeData.id);
      if (error) throw error;
      setMessages(prev => [...prev, { sender: 'ai', text: `Store address updated successfully to ${subdomain}.crevawebs.in.`, timestamp: new Date() }]);
      addNotification('success', 'Subdomain updated', `${subdomain}.crevawebs.in`);
      fetchStoreStatus();
    } catch (e: any) {
      addNotification('error', 'Failed to set address', e.message);
    } finally {
      setActionLoading(false);
      resetWizard();
    }
  };

  const parseUserCommand = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);

    setTimeout(async () => {
      const lower = text.toLowerCase().trim();

      // If active flow is running, route directly to the step handler
      if (assistantState.activeIntent) {
        if (!isAIConnected) {
          setMessages(prev => [...prev, {
            sender: 'ai',
            text: `AI features require a connected AI provider. Please connect an AI provider to enable advanced assistant capabilities. [ Connect AI ]`,
            timestamp: new Date()
          }]);
          setIsTyping(false);
          resetWizard();
          return;
        }
        handleWizardStepInput(text);
        return;
      }

      // Check intent mapping match (for wizards)
      let detectedIntent: any = null;
      for (const [key, intentObj] of Object.entries(intents)) {
        if (intentObj.keywords.some(kw => lower.includes(kw))) {
          detectedIntent = intentObj.action;
          break;
        }
      }

      if (detectedIntent) {
        if (!isAIConnected) {
          let responseText = '';
          if (detectedIntent === 'ADD_PRODUCT') {
            responseText = 'To add a product, go to Products → Add Product.';
          } else if (detectedIntent === 'ADD_LOGO') {
            responseText = 'To upload your store logo, go to Theme Settings → Store Branding.';
          } else if (detectedIntent === 'PAYMENT_GATEWAY') {
            responseText = 'To connect a payment gateway, go to Settings → Integrations.';
          } else if (detectedIntent === 'UPI') {
            responseText = 'To connect UPI payments, go to Settings → Integrations → UPI.';
          } else if (detectedIntent === 'DOMAIN') {
            responseText = 'To configure your custom domain or subdomain, go to Settings → Store Address.';
          } else if (detectedIntent === 'EDIT_PRODUCT') {
            responseText = 'To update product pricing, go to Products → View Catalog and select a product.';
          } else if (detectedIntent === 'DELETE_PRODUCT') {
            responseText = 'To remove a product, go to Products → View Catalog and click delete.';
          } else {
            responseText = 'AI features require a connected AI provider.';
          }

          setMessages(prev => [...prev, {
            sender: 'ai',
            text: `${responseText}\n\nAI features require a connected AI provider. [ Connect AI ]`,
            timestamp: new Date()
          }]);
          setIsTyping(false);
        } else {
          startWizardFlow(detectedIntent);
        }
        return;
      }

      // Check Local Knowledge Base for help navigation matches (Level 1)
      const matchedHelp = LOCAL_KNOWLEDGE_BASE.find(item =>
        item.keywords.some(kw => lower.includes(kw))
      );

      if (matchedHelp) {
        const textResponse = matchedHelp.action 
          ? `${matchedHelp.response}\n\n[ Route Action ]:${matchedHelp.action.label}:${matchedHelp.action.route}`
          : matchedHelp.response;

        setMessages(prev => [...prev, {
          sender: 'ai',
          text: textResponse,
          timestamp: new Date()
        }]);
        setIsTyping(false);
        return;
      }

      // Level 2: AI provider querying if connected
      if (isAIConnected && activeAIConfig) {
        try {
          const isOpenAI = activeAIConfig.type === 'openai';
          const isClaude = activeAIConfig.type === 'anthropic_claude';
          const endpoint = isOpenAI 
            ? 'https://api.openai.com/v1/chat/completions' 
            : isClaude
              ? 'https://api.anthropic.com/v1/messages'
              : 'https://api.groq.com/openai/v1/chat/completions';
          
          const modelName = isOpenAI ? 'gpt-4o-mini' : isClaude ? 'claude-3-haiku-20240307' : 'llama3-8b-8192';

          const requestBody = isClaude ? {
            model: modelName,
            max_tokens: 1024,
            messages: [{ role: 'user', content: text }]
          } : {
            model: modelName,
            messages: [
              {
                role: 'system',
                content: 'You are an intelligent AI e-commerce assistant. Help the merchant build and manage their online shop on CrevaWebs.'
              },
              {
                role: 'user',
                content: text
              }
            ]
          };

          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };
          if (isClaude) {
            headers['x-api-key'] = activeAIConfig.apiKey;
            headers['anthropic-version'] = '2023-06-01';
            headers['anthropic-dangerous-direct-browser-access'] = 'true';
          } else {
            headers['Authorization'] = `Bearer ${activeAIConfig.apiKey}`;
          }

          const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
          });

          if (response.ok) {
            const json = await response.json();
            const replyText = isClaude ? json.content?.[0]?.text : json.choices?.[0]?.message?.content;
            if (replyText) {
              setMessages(prev => [...prev, {
                sender: 'ai',
                text: replyText.trim(),
                timestamp: new Date()
              }]);
              setIsTyping(false);
              return;
            }
          }
        } catch (err) {
          console.warn('AI provider API call failed, falling back to smart assistance:', err);
        }
      }

      // Level 1 Fallback Response
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `I can help you with your CrevaWebs store. Try asking about:\n• Adding products\n• Uploading logo\n• Managing orders\n• Payment setup\n• Store settings\n\n[ View Guides ]`,
        timestamp: new Date()
      }]);
      setIsTyping(false);

    }, 600);
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setTicketStatus('submitting');
    setTimeout(() => {
      setTicketStatus('success');
      setTicketSubject('');
      setTicketMessage('');
      
      addNotification('success', 'Support Ticket Submitted', ticketSubject);
    }, 1500);
  };

  const renderMessageContent = (text: string) => {
    const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');
    const lines = cleanText.split('\n');
    return lines.map((line, i) => {
      let icon = null;
      let displayLine = line;
      
      // Parse leading indicators for clean Lucide representation
      if (line.trim().startsWith('⚠')) {
        icon = <AlertTriangle className="inline-block w-3.5 h-3.5 text-amber-500 mr-1.5 align-middle shrink-0" />;
        displayLine = line.trim().substring(1).trim();
      } else if (line.trim().startsWith('✓')) {
        icon = <CheckCircle2 className="inline-block w-3.5 h-3.5 text-emerald-500 mr-1.5 align-middle shrink-0" />;
        displayLine = line.trim().substring(1).trim();
      }

      if (displayLine.includes('[ Connect AI ]')) {
        const parts = displayLine.split('[ Connect AI ]');
        return (
          <div key={i} className="min-h-[18px] flex flex-col items-start gap-1.5 my-1.5 w-full">
            <span>{parts[0]}</span>
            <Link href="/admin/integrations" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-550 text-white rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer">
              <Sparkles className="w-3.5 h-3.5" /> Connect AI Provider
            </Link>
            {parts[1] && <span>{parts[1]}</span>}
          </div>
        );
      }

      if (displayLine.includes('[ Route Action ]:')) {
        const parts = displayLine.split('[ Route Action ]:');
        const [label, route] = parts[1].trim().split(':');
        return (
          <div key={i} className="min-h-[18px] flex flex-col items-start gap-1.5 my-1.5 w-full">
            <span>{parts[0]}</span>
            <Link href={route} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-550 text-white rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer">
              {label}
            </Link>
          </div>
        );
      }

      if (displayLine.includes('[ View Guides ]')) {
        const parts = displayLine.split('[ View Guides ]');
        return (
          <div key={i} className="min-h-[18px] flex flex-col items-start gap-1.5 my-1.5 w-full">
            <span>{parts[0]}</span>
            <button
              type="button"
              onClick={() => setActiveTab('knowledge')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3 h-3 text-white" /> View Guides
            </button>
            {parts[1] && <span>{parts[1]}</span>}
          </div>
        );
      }
      
      return (
        <div key={i} className="min-h-[18px] flex items-center flex-wrap">
          {icon}
          <span>{displayLine}</span>
        </div>
      );
    });
  };

  return (
    <>
      {/* 11. BOTTOM ACTIVITY NOTIFICATION TOAST STACK */}
      <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-3 max-w-sm w-[90vw] pointer-events-none">
        <AnimatePresence>
          {notifications.map((notif) => {
            const notifColors = {
              success: { bg: 'bg-white border-emerald-150', text: 'text-slate-900', icon: CheckCircle2, iconColor: 'text-emerald-500 bg-emerald-50' },
              info: { bg: 'bg-white border-blue-150', text: 'text-slate-900', icon: Bot, iconColor: 'text-blue-500 bg-blue-50' },
              warning: { bg: 'bg-white border-amber-150', text: 'text-slate-900', icon: AlertTriangle, iconColor: 'text-amber-500 bg-amber-50' },
              error: { bg: 'bg-white border-red-150', text: 'text-slate-900', icon: AlertTriangle, iconColor: 'text-red-500 bg-red-50' }
            };
            const config = notifColors[notif.type] || notifColors.info;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`p-4 border rounded-2xl shadow-lg flex items-start gap-3 pointer-events-auto ${config.bg}`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${config.iconColor}`}>
                  <config.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <h4 className={`font-bold text-xs ${config.text} truncate`}>{notif.message}</h4>
                  {notif.subtitle && <span className="text-[10px] text-slate-500 block truncate mt-0.5">{notif.subtitle}</span>}
                </div>
                <button 
                  onClick={() => dismissNotification(notif.id)}
                  className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-650 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-[90] bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 group cursor-pointer"
        >
          <div className="relative">
            <Bot className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-blue-600" />
          </div>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out font-black text-[9px] uppercase tracking-widest pl-0 group-hover:pl-2 text-white block whitespace-nowrap">
            Store Assistant
          </span>
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div 
          className={`fixed z-[95] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col font-sans transition-all duration-300 
            ${isMinimized 
              ? 'bottom-6 right-6 w-72 h-16 shrink-0' 
              : 'bottom-6 right-6 w-[380px] sm:w-[400px] h-[550px] max-h-[85vh] max-w-[95vw]'
            }
          `}
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="p-1.5 bg-slate-800 rounded-xl">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900 animate-pulse" />
              </div>
              <div className="text-left">
                {isAIConnected ? (
                  <>
                    <h3 className="font-extrabold text-xs uppercase tracking-widest text-white">CrevaWebs AI Assistant</h3>
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">● AI POWERED • {connectedAIProviderName}</span>
                  </>
                ) : (
                  <>
                    <h3 className="font-extrabold text-xs uppercase tracking-widest text-white">CrevaWebs Smart Help</h3>
                    <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider block">● SMART HELP MODE</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body content if not minimized */}
          {!isMinimized && (
            <>
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 text-[10px] font-black uppercase tracking-wider text-slate-500 select-none">
                {[
                  { id: 'chat', label: 'CrevaWebs', icon: MessageSquare },
                  { id: 'checklist', label: 'Setup Status', icon: CheckCircle2 },
                  { id: 'knowledge', label: 'Guides', icon: BookOpen },
                  { id: 'ticket', label: 'Support', icon: Headphones }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-3.5 flex flex-col items-center justify-center gap-1 border-b-2 transition-all cursor-pointer ${
                      activeTab === tab.id 
                        ? 'border-blue-600 text-blue-600 bg-white font-bold' 
                        : 'border-transparent text-slate-500 hover:text-blue-600 hover:bg-slate-50/50'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Scrollable Content Container */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50/40 min-h-0">
                {activeTab === 'chat' && (
                  <div className="space-y-4">
                    {/* Connection Banner card */}
                    {!isAIConnected && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-3.5 space-y-2.5 text-left mb-4 shadow-sm shrink-0">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-800">Smart Help Mode</span>
                        </div>
                        <p className="text-[10px] text-slate-505 leading-normal font-medium">
                          CrevaWebs Assistant can help you navigate and manage your store. Connect an AI provider to unlock:
                        </p>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-slate-600 font-bold">
                          <div>✨ Content Generation</div>
                          <div>✨ SEO Writing</div>
                          <div>✨ Product Descriptions</div>
                          <div>✨ Smart Recommendations</div>
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                          <Link href="/admin/integrations" className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-550 text-white rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer">
                            Connect AI
                          </Link>
                        </div>
                      </div>
                    )}
                    {/* Message stream */}
                    {messages.map((m, idx) => (
                      <div 
                        key={idx} 
                        className={`flex gap-2.5 max-w-[85%] ${
                          m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] ${
                          m.sender === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-100 text-slate-650 border border-slate-200'
                        }`}>
                          {m.sender === 'user' ? 'ME' : 'AI'}
                        </div>
                        <div className="space-y-2 text-left">
                          <div className={`p-3 rounded-2xl text-[11px] sm:text-xs leading-relaxed whitespace-pre-line shadow-sm border ${
                            m.sender === 'user' 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/5' 
                              : 'bg-white text-slate-800 border-slate-200/80'
                          }`}>
                            {renderMessageContent(m.text)}
                          </div>

                        </div>
                      </div>
                    ))}

                    {/* Interactive Step Wizards */}
                    {assistantState.activeIntent && (
                      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs space-y-3 w-full max-w-[320px] mr-auto">
                        <div className="flex items-center justify-between border-b pb-1.5 mb-1 bg-slate-50 px-2 py-1 -mx-4 -mt-4 rounded-t-2xl">
                          <span className="font-black text-[9px] uppercase tracking-wider text-slate-500">
                            {assistantState.activeIntent.replace('_', ' ')}
                          </span>
                          <button onClick={resetWizard} className="p-1 hover:bg-slate-200 rounded text-slate-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* ADD_LOGO Wizard */}
                        {assistantState.activeIntent === 'ADD_LOGO' && (
                          <div className="space-y-3">
                            {assistantState.currentStep === 1 && (
                              <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Upload Store Logo</label>
                                <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer relative transition-colors">
                                  <input 
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg"
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          setAssistantState(prev => ({
                                            ...prev,
                                            currentStep: 2,
                                            collectedData: { ...prev.collectedData, logoPreview: event.target?.result }
                                          }));
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                  <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1.5" />
                                  <span className="block text-[10px] text-slate-500 font-bold">Click to upload file</span>
                                  <span className="block text-[9px] text-slate-400 mt-0.5">Supports PNG, JPG, JPEG</span>
                                </div>
                              </div>
                            )}
                            {assistantState.currentStep === 2 && (
                              <div className="space-y-3">
                                <div className="p-2 border rounded-xl bg-slate-50 flex items-center justify-center">
                                  <img src={assistantState.collectedData.logoPreview} className="max-h-20 object-contain rounded" alt="Logo Preview" />
                                </div>
                                <span className="block text-[10px] text-slate-555 leading-relaxed">This logo will be used for your storefront branding.</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveLogoWizard(assistantState.collectedData.logoPreview)}
                                    disabled={actionLoading}
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-550 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save Logo'}
                                  </button>
                                  <button
                                    onClick={resetWizard}
                                    className="px-3.5 py-2 border rounded-xl hover:bg-slate-50 text-slate-650 cursor-pointer font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ADD_PRODUCT Wizard */}
                        {assistantState.activeIntent === 'ADD_PRODUCT' && (
                          <div className="space-y-3">
                            {assistantState.currentStep === 1 && (
                              <div className="space-y-2">
                                <label className="block text-[9px] uppercase font-bold text-slate-400">Product Name</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. Handmade Soap"
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-800"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleWizardStepInput((e.target as HTMLInputElement).value);
                                  }}
                                />
                                <span className="text-[9px] text-slate-400 font-medium">Press Enter to continue</span>
                              </div>
                            )}
                            {assistantState.currentStep === 2 && (
                              <div className="space-y-2">
                                <label className="block text-[9px] uppercase font-bold text-slate-400">Product Price (₹)</label>
                                <input 
                                  type="number" 
                                  placeholder="e.g. 299"
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-800"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleWizardStepInput((e.target as HTMLInputElement).value);
                                  }}
                                />
                                <span className="text-[9px] text-slate-400 font-medium">Press Enter to continue</span>
                              </div>
                            )}
                            {assistantState.currentStep === 3 && (
                              <div className="space-y-2">
                                <label className="block text-[9px] uppercase font-bold text-slate-400 font-black">Category</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {['Fashion', 'Electronics', 'Handcrafted', 'Groceries', 'Services'].map((cat) => (
                                    <button
                                      key={cat}
                                      onClick={() => handleWizardStepInput(cat)}
                                      className="py-1.5 border rounded-lg hover:border-blue-500 hover:bg-blue-50/20 text-slate-700 font-semibold text-[10px] text-center cursor-pointer"
                                    >
                                      {cat}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {assistantState.currentStep === 4 && (
                              <div className="space-y-2">
                                <label className="block text-[9px] uppercase font-bold text-slate-400">Product Description</label>
                                <textarea 
                                  placeholder="Brief description of product features..."
                                  rows={2}
                                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-blue-500 text-slate-800 resize-none"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleWizardStepInput((e.target as HTMLTextAreaElement).value);
                                    }
                                  }}
                                />
                                <span className="text-[9px] text-slate-400 font-medium">Press Enter to continue</span>
                              </div>
                            )}
                            {assistantState.currentStep === 5 && (
                              <div className="space-y-2">
                                <label className="block text-[9px] uppercase font-bold text-slate-400">Product Image URL</label>
                                <input 
                                  type="text" 
                                  placeholder="https://example.com/image.jpg"
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-800"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleWizardStepInput((e.target as HTMLInputElement).value);
                                  }}
                                />
                                <span className="text-[9px] text-slate-400 font-medium">Press Enter to continue</span>
                              </div>
                            )}
                            {assistantState.currentStep === 6 && (
                              <div className="space-y-2">
                                <label className="block text-[9px] uppercase font-bold text-slate-400">Available Stock Quantity</label>
                                <input 
                                  type="number" 
                                  placeholder="10"
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-800"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleWizardStepInput((e.target as HTMLInputElement).value);
                                  }}
                                />
                                <span className="text-[9px] text-slate-400 font-medium">Press Enter to continue</span>
                              </div>
                            )}
                            {assistantState.currentStep === 7 && assistantState.pendingConfirmation && (
                              <div className="flex gap-2">
                                <button
                                  onClick={handleCreateProductWizard}
                                  disabled={actionLoading}
                                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-550 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create Product'}
                                </button>
                                <button
                                  onClick={() => setAssistantState(prev => ({ ...prev, currentStep: 1, pendingConfirmation: false }))}
                                  className="px-3.5 py-2 border rounded-xl hover:bg-slate-50 text-slate-655 cursor-pointer font-bold"
                                >
                                  Edit Details
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* EDIT_PRODUCT Wizard */}
                        {assistantState.activeIntent === 'EDIT_PRODUCT' && (
                          <div className="space-y-3">
                            {assistantState.currentStep === 1 && (
                              <div className="space-y-2">
                                <label className="block text-[9px] uppercase font-bold text-slate-400">Select Product to Edit</label>
                                <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1">
                                  {productsList.map((p) => (
                                    <button
                                      key={p.id}
                                      onClick={() => {
                                        setAssistantState(prev => ({
                                          ...prev,
                                          currentStep: 2,
                                          collectedData: { ...prev.collectedData, selectedProduct: p }
                                        }));
                                        setMessages(prev => [...prev, { sender: 'ai', text: `Current price: ₹${p.price}\nWhat should be the new price?`, timestamp: new Date() }]);
                                      }}
                                      className="w-full p-2 border border-slate-100 hover:border-blue-500 rounded-lg text-left text-[11px] font-semibold text-slate-700 bg-slate-50 flex justify-between items-center cursor-pointer"
                                    >
                                      <span>{p.name}</span>
                                      <span className="text-slate-400 font-bold">₹{p.price}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {assistantState.currentStep === 2 && (
                              <div className="space-y-2">
                                <label className="block text-[9px] uppercase font-bold text-slate-400">New Price (₹)</label>
                                <input 
                                  type="number" 
                                  placeholder="e.g. 599"
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-800"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleWizardStepInput((e.target as HTMLInputElement).value);
                                  }}
                                />
                                <span className="text-[9px] text-slate-400 font-medium">Press Enter to continue</span>
                              </div>
                            )}
                            {assistantState.currentStep === 3 && assistantState.pendingConfirmation && (
                              <div className="flex gap-2">
                                <button
                                  onClick={handleUpdatePriceWizard}
                                  disabled={actionLoading}
                                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-550 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Update Price'}
                                </button>
                                <button
                                  onClick={resetWizard}
                                  className="px-3.5 py-2 border rounded-xl hover:bg-slate-50 text-slate-655 cursor-pointer font-bold"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* DELETE_PRODUCT Wizard */}
                        {assistantState.activeIntent === 'DELETE_PRODUCT' && (
                          <div className="space-y-3">
                            {assistantState.currentStep === 1 && (
                              <div className="space-y-2">
                                <label className="block text-[9px] uppercase font-bold text-slate-400">Select Product to Delete</label>
                                <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1">
                                  {productsList.map((p) => (
                                    <button
                                      key={p.id}
                                      onClick={() => {
                                        setAssistantState(prev => ({
                                          ...prev,
                                          currentStep: 2,
                                          collectedData: { selectedProduct: p },
                                          pendingConfirmation: true
                                        }));
                                        setMessages(prev => [...prev, { sender: 'ai', text: `Are you sure you want to delete ${p.name}?\n\nThis action cannot be undone.`, timestamp: new Date() }]);
                                      }}
                                      className="w-full p-2 border border-slate-100 hover:border-red-400 rounded-lg text-left text-[11px] font-semibold text-slate-700 bg-slate-50 flex justify-between items-center cursor-pointer"
                                    >
                                      <span>{p.name}</span>
                                      <span className="text-red-550 font-bold hover:underline">Delete</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {assistantState.currentStep === 2 && assistantState.pendingConfirmation && (
                              <div className="flex gap-2">
                                <button
                                  onClick={handleDeleteProductWizard}
                                  disabled={actionLoading}
                                  className="flex-1 py-2 bg-red-650 hover:bg-red-550 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete Product'}
                                </button>
                                <button
                                  onClick={resetWizard}
                                  className="px-3.5 py-2 border rounded-xl hover:bg-slate-50 text-slate-655 cursor-pointer font-bold"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* PAYMENT_GATEWAY Wizard */}
                        {assistantState.activeIntent === 'PAYMENT_GATEWAY' && (
                          <div className="space-y-3">
                            {assistantState.currentStep === 1 && (
                              <div className="space-y-2">
                                <label className="block text-[9px] uppercase font-bold text-slate-400 font-black">Select Payment Provider</label>
                                <div className="grid grid-cols-2 gap-2">
                                  {['Razorpay', 'Cashfree', 'Stripe', 'UPI'].map((prov) => (
                                    <button
                                      key={prov}
                                      onClick={() => {
                                        if (prov === 'UPI') {
                                          setAssistantState({
                                            activeIntent: 'UPI',
                                            currentStep: 1,
                                            collectedData: {},
                                            pendingConfirmation: false
                                          });
                                          setMessages(prev => [...prev, { sender: 'ai', text: 'Enter your UPI ID (e.g. merchant@okaxis):', timestamp: new Date() }]);
                                        } else {
                                          setAssistantState(prev => ({
                                            ...prev,
                                            currentStep: 2,
                                            collectedData: { provider: prov }
                                          }));
                                          setMessages(prev => [...prev, { sender: 'ai', text: `Enter Key ID details for ${prov}:`, timestamp: new Date() }]);
                                        }
                                      }}
                                      className="p-3 border border-slate-200 hover:border-blue-500 rounded-xl bg-white font-bold text-slate-700 text-center text-[10px] shadow-sm flex flex-col items-center gap-1 cursor-pointer"
                                    >
                                      <CreditCard className="w-4 h-4 text-blue-650" />
                                      <span>{prov}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {assistantState.currentStep === 2 && (
                              <div className="space-y-2">
                                <label className="block text-[9px] uppercase font-bold text-slate-400">Key ID</label>
                                <input 
                                  type="text" 
                                  placeholder="rzp_live_****1234"
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-800"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleWizardStepInput((e.target as HTMLInputElement).value);
                                  }}
                                />
                                <span className="text-[9px] text-slate-400 font-medium">Press Enter to continue</span>
                              </div>
                            )}
                            {assistantState.currentStep === 3 && (
                              <div className="space-y-2">
                                <label className="block text-[9px] uppercase font-bold text-slate-400">Key Secret</label>
                                <input 
                                  type="password" 
                                  placeholder="••••••••••••"
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-800"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleWizardStepInput((e.target as HTMLInputElement).value);
                                  }}
                                />
                                <span className="text-[9px] text-slate-400 font-medium">Press Enter to continue</span>
                              </div>
                            )}
                            {assistantState.currentStep === 4 && assistantState.pendingConfirmation && (
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveGatewayWizard}
                                  disabled={actionLoading}
                                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-550 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save & Activate'}
                                </button>
                                <button
                                  onClick={resetWizard}
                                  className="px-3.5 py-2 border rounded-xl hover:bg-slate-50 text-slate-655 cursor-pointer font-bold"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* UPI Wizard */}
                        {assistantState.activeIntent === 'UPI' && (
                          <div className="space-y-3">
                            {assistantState.currentStep === 1 && (
                              <div className="space-y-2">
                                <label className="block text-[9px] uppercase font-bold text-slate-400">UPI ID</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. merchant@upi"
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-800"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleWizardStepInput((e.target as HTMLInputElement).value);
                                  }}
                                />
                                <span className="text-[9px] text-slate-400 font-medium">Press Enter to continue</span>
                              </div>
                            )}
                            {assistantState.currentStep === 2 && (
                              <div className="space-y-2">
                                <label className="block text-[9px] uppercase font-bold text-slate-400">Account Holder Name</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. Ruth"
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-800"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleWizardStepInput((e.target as HTMLInputElement).value);
                                  }}
                                />
                                <span className="text-[9px] text-slate-400 font-medium">Press Enter to continue</span>
                              </div>
                            )}
                            {assistantState.currentStep === 3 && assistantState.pendingConfirmation && (
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveUPIWizard}
                                  disabled={actionLoading}
                                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-550 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save UPI'}
                                </button>
                                <button
                                  onClick={resetWizard}
                                  className="px-3.5 py-2 border rounded-xl hover:bg-slate-50 text-slate-655 cursor-pointer font-bold"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* DOMAIN Wizard */}
                        {assistantState.activeIntent === 'DOMAIN' && (
                          <div className="space-y-3">
                            {assistantState.currentStep === 1 && (
                              <div className="space-y-2">
                                <label className="block text-[9px] uppercase font-bold text-slate-400 font-black">Select Domain Type</label>
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => {
                                      setAssistantState(prev => ({
                                        ...prev,
                                        currentStep: 2,
                                        collectedData: { domainType: 'subdomain' }
                                      }));
                                      setMessages(prev => [...prev, { sender: 'ai', text: 'Please enter your preferred store subdomain address:', timestamp: new Date() }]);
                                    }}
                                    className="p-3 border rounded-xl text-left bg-slate-50 hover:border-blue-500 hover:bg-blue-50/20 font-bold text-slate-700 text-xs flex justify-between items-center cursor-pointer"
                                  >
                                    <span>CrevaWebs Subdomain</span>
                                    <Globe className="w-4 h-4 text-blue-650" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setAssistantState(prev => ({
                                        ...prev,
                                        currentStep: 3,
                                        collectedData: { domainType: 'custom' }
                                      }));
                                      setMessages(prev => [...prev, { sender: 'ai', text: 'Please enter your custom domain name (e.g. mystore.com):', timestamp: new Date() }]);
                                    }}
                                    className="p-3 border rounded-xl text-left bg-slate-50 hover:border-blue-500 hover:bg-blue-50/20 font-bold text-slate-700 text-xs flex justify-between items-center cursor-pointer"
                                  >
                                    <span>Custom Domain Mapping</span>
                                    <Globe className="w-4 h-4 text-slate-400" />
                                  </button>
                                </div>
                              </div>
                            )}
                            {assistantState.currentStep === 2 && (
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-black">Choose your store address</label>
                                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-500">
                                    <input 
                                      type="text"
                                      placeholder="example-store"
                                      id="wizard-subdomain-input"
                                      className="flex-1 px-3 py-2 text-xs outline-none text-slate-800 bg-white"
                                    />
                                    <span className="px-3 py-2 bg-slate-100 border-l text-[11px] font-bold text-slate-455 select-none">.crevawebs.in</span>
                                  </div>
                                </div>
                                <button
                                  onClick={async () => {
                                    const inputVal = (document.getElementById('wizard-subdomain-input') as HTMLInputElement)?.value?.trim()?.toLowerCase()?.replace(/\s+/g, '-');
                                    if (!inputVal) return;
                                    setActionLoading(true);
                                    
                                    setTimeout(() => {
                                      setActionLoading(false);
                                      const isTaken = ['admin', 'login', 'dashboard', 'api', 'support', 'www', 'store', 'shop'].includes(inputVal);
                                      if (isTaken) {
                                        setMessages(prev => [...prev, {
                                          sender: 'ai',
                                          text: `${inputVal}.crevawebs.in is unavailable. Try alternatives like ${inputVal}-shop or ${inputVal}-brand.`,
                                          timestamp: new Date()
                                        }]);
                                      } else {
                                        setAssistantState(prev => ({
                                          ...prev,
                                          currentStep: 4,
                                          collectedData: { ...prev.collectedData, subdomainName: inputVal }
                                        }));
                                        setMessages(prev => [...prev, {
                                          sender: 'ai',
                                          text: `${inputVal}.crevawebs.in is available. Would you like to map this store address?`,
                                          timestamp: new Date()
                                        }]);
                                      }
                                    }, 800);
                                  }}
                                  disabled={actionLoading}
                                  className="w-full py-2 bg-blue-600 hover:bg-blue-550 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Check Availability'}
                                </button>
                              </div>
                            )}
                            {assistantState.currentStep === 4 && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveSubdomainWizard(assistantState.collectedData.subdomainName)}
                                  disabled={actionLoading}
                                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-550 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Use This Address'}
                                </button>
                                <button
                                  onClick={resetWizard}
                                  className="px-3.5 py-2 border rounded-xl hover:bg-slate-50 text-slate-655 cursor-pointer font-bold"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Typing status */}
                    {isTyping && (
                      <div className="flex gap-2.5 mr-auto max-w-[85%]">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-650 border border-slate-250 shrink-0 flex items-center justify-center font-bold text-[10px]">
                          AI
                        </div>
                        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-100" />
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* 3. SETUP CHECKLIST TAB */}
                {activeTab === 'checklist' && (
                  <div className="space-y-6 text-left">
                    {/* Real-time Setup progress circular SVG loader */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                      <div className="relative flex items-center justify-center shrink-0">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle cx="32" cy="32" r="28" stroke="currentColor" className="text-slate-100" strokeWidth="4.5" fill="transparent" />
                          <circle cx="32" cy="32" r="28" stroke="currentColor" className="text-blue-600 transition-all duration-300" strokeWidth="4.5" fill="transparent"
                            strokeDasharray={175.9}
                            strokeDashoffset={175.9 - (175.9 * completionPercentage) / 100}
                          />
                        </svg>
                        <span className="absolute text-sm font-black text-slate-900">{completionPercentage}%</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">Store Setup Progress</h4>
                        <span className="text-[10px] text-slate-500 block">Overall Setup Complete</span>
                          <div className="text-[10px] text-slate-650 flex items-center gap-1.5 mt-1 font-bold">
                          <span>Health Status:</span>
                          <span className={`px-2 py-0.5 rounded ${
                            storeHealth === 'Good' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : storeHealth === 'Almost Ready'
                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {storeHealth}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Setup Checklist list */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest pl-1">Configuration Checklist</span>
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 divide-y divide-slate-100 shadow-sm">
                        
                        <div className="py-2.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            {storeData?.store_name 
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : <AlertTriangle className="w-4 h-4 text-amber-500" />
                            }
                            <span className="font-semibold text-slate-700">Business Information — {storeData?.store_name ? 'Completed' : 'Missing'}</span>
                          </span>
                        </div>
 
                        <div className="py-2.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            {storeData?.logo_url 
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : <AlertTriangle className="w-4 h-4 text-amber-500" />
                            }
                            <span className="font-semibold text-slate-700">Branding — {storeData?.logo_url ? 'Completed' : 'Logo Missing'}</span>
                          </span>
                          {!storeData?.logo_url && (
                            <Link href="/admin/appearance" className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                              Add Logo <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
 
                        <div className="py-2.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            {storeData?.contact_phone 
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : <AlertTriangle className="w-4 h-4 text-amber-500" />
                            }
                            <span className="font-semibold text-slate-700">Contact Details — {storeData?.contact_phone ? 'Completed' : 'Missing'}</span>
                          </span>
                          {!storeData?.contact_phone && (
                            <Link href="/admin/settings" className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                              Add Details <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
 
                        <div className="py-2.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            {integrationsList.length > 0 
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : <AlertTriangle className="w-4 h-4 text-amber-500" />
                            }
                            <span className="font-semibold text-slate-700">Payment Setup — {integrationsList.length > 0 ? 'Connected' : 'Not Configured'}</span>
                          </span>
                          {integrationsList.length === 0 && (
                            <Link href="/admin/integrations" className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                              Connect UPI <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
 
                        <div className="py-2.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            {storeData?.subdomain && !storeData.subdomain.startsWith('__')
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : <AlertTriangle className="w-4 h-4 text-amber-500" />
                            }
                            <span className="font-semibold text-slate-700">Preferences (Subdomain) — {storeData?.subdomain ? 'Connected' : 'Missing'}</span>
                          </span>
                        </div>

                        <div className="py-2.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            {storeData?.billing_plan 
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : <AlertTriangle className="w-4 h-4 text-amber-500" />
                            }
                            <span className="font-semibold text-slate-700">Plan & Contract — {storeData?.billing_plan ? 'Completed' : 'Missing'}</span>
                          </span>
                        </div>

                        <div className="py-2.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            {!storeData?.is_paused 
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : <AlertTriangle className="w-4 h-4 text-amber-500" />
                            }
                            <span className="font-semibold text-slate-700">Account Setup — {!storeData?.is_paused ? 'Completed' : 'Missing'}</span>
                          </span>
                          {storeData?.is_paused && (
                            <Link href="/admin/settings" className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                              Go Live <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'knowledge' && (
                  <div className="space-y-3 text-left">
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest pl-1">Onboarding Help Guides</span>
                    
                    {/* Search Input Box */}
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search setup guides..."
                        value={guideSearch}
                        onChange={e => setGuideSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-800"
                      />
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {[
                        { title: 'How to add a logo', content: 'Go to Storefront → Theme Design. Upload a high-quality PNG logo with a transparent background.' },
                        { title: 'How to add products', content: 'Navigate to Products tab, click Create Product. Fill in name, price, stock quantity, description, and save.' },
                        { title: 'How to change price', content: 'Open the product from the catalog list, update the pricing input field, and confirm update changes.' },
                        { title: 'How to manage orders', content: 'All incoming customer transactions appear in the Orders Dashboard. Use this screen to update shipping statuses.' },
                        { title: 'How to connect payment gateway', content: 'Go to Settings → Integrations. Choose Razorpay, Cashfree, or Stripe, input API Keys, and save.' },
                        { title: 'How to set up UPI', content: 'Add your UPI VPA ID and merchant name under Settings → Integrations → UPI to configure instant scan-to-pay checkouts.' },
                        { title: 'How to connect domain', content: 'Update your subdomain label in settings or configure custom DNS records (CNAME/A) mapping to point your custom domain.' },
                        { title: 'How to change store template', content: 'Visit Storefront → Appearance, choose from premium themes, and customize primary accent colors.' }
                      ].filter(kb => 
                        kb.title.toLowerCase().includes(guideSearch.toLowerCase()) || 
                        kb.content.toLowerCase().includes(guideSearch.toLowerCase())
                      ).map((kb, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                          <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 mb-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-blue-650" /> {kb.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed">{kb.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'ticket' && (
                  <div className="space-y-4 text-left">
                    {ticketStatus === 'success' ? (
                      <div className="text-center py-8 space-y-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                        <h4 className="font-bold text-sm text-slate-800">Support Ticket Logged!</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">Our tech desk will reply to your registered merchant email address shortly.</p>
                        <button
                          onClick={() => {
                            setTicketStatus('idle');
                            setActiveTab('chat');
                          }}
                          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Return to Chat
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-blue-50/45 border border-blue-100 p-4 rounded-xl space-y-1.5 text-xs">
                          <h4 className="font-bold text-slate-850 flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-blue-650" /> direct Helplines
                          </h4>
                          <p className="text-slate-500 leading-relaxed">
                            Call us at <span className="font-bold text-slate-700">084893 71766</span> or click to WhatsApp at <a href="https://wa.me/9108489371766" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline">wa.me/9108489371766</a>.
                          </p>
                        </div>

                        <form onSubmit={handleSubmitTicket} className="space-y-3 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                          <h4 className="font-bold text-xs text-slate-900">Submit Support Ticket</h4>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400">Subject</label>
                            <input 
                              type="text"
                              value={ticketSubject}
                              onChange={e => setTicketSubject(e.target.value)}
                              placeholder="e.g. Domain mapping query"
                              required
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-800"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400">Issue Details</label>
                            <textarea 
                              rows={3}
                              value={ticketMessage}
                              onChange={e => setTicketMessage(e.target.value)}
                              placeholder="Describe details here..."
                              required
                              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-blue-500 text-slate-800 resize-none"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-[9px] rounded-xl flex items-center justify-center gap-1 shadow-md shadow-blue-500/10 transition-all cursor-pointer"
                          >
                            Send Ticket
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Input Field if on Copilot Tab */}
              {activeTab === 'chat' && (
                <div className="p-3 border-t border-slate-100 bg-white flex flex-col gap-2 shrink-0">
                  {/* Contextual Quick Action triggers */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 select-none">
                    <button 
                      onClick={() => parseUserCommand('add product')}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] bg-slate-50 border border-slate-200 hover:border-slate-350 rounded-lg font-bold text-slate-650 whitespace-nowrap cursor-pointer shrink-0"
                    >
                      <Upload className="w-3 h-3 text-slate-500" />
                      <span>Add Product</span>
                    </button>
                    <button 
                      onClick={() => parseUserCommand('show products')}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] bg-slate-50 border border-slate-200 hover:border-slate-350 rounded-lg font-bold text-slate-650 whitespace-nowrap cursor-pointer shrink-0"
                    >
                      <ShoppingBag className="w-3 h-3 text-slate-500" />
                      <span>View Catalog</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('checklist')}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] bg-slate-50 border border-slate-200 hover:border-slate-350 rounded-lg font-bold text-slate-650 whitespace-nowrap cursor-pointer shrink-0"
                    >
                      <CheckCircle2 className="w-3 h-3 text-slate-500" />
                      <span>Check Progress</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && parseUserCommand(input)}
                      placeholder="Ask copilot to update products, set prices..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 transition-all"
                    />
                    <button
                      onClick={() => parseUserCommand(input)}
                      disabled={!input.trim()}
                      className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors shadow-sm disabled:opacity-40 cursor-pointer shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Minimized Quick Bar */}
          {isMinimized && (
            <button
              onClick={() => setIsMinimized(false)}
              className="flex-1 flex items-center justify-between px-4 h-full w-full bg-white border border-slate-200 font-medium text-xs text-slate-800 cursor-pointer hover:bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-bold text-[9px] uppercase tracking-widest text-slate-450">Assistant Minimized</span>
              </div>
              <div className="text-[9px] text-blue-600 font-black uppercase tracking-wider flex items-center gap-0.5">
                Expand <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          )}
        </div>
      )}
    </>
  );
}
