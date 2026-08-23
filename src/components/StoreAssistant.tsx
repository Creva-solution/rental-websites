'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, X, Minimize2, Maximize2, Send, Sparkles, BookOpen, 
  Bot, Phone, FileText, ChevronRight, CheckCircle2, ArrowLeft, Loader2,
  Layout, CreditCard, ShoppingBag, Landmark, Clipboard, AlertTriangle, UserCheck, Check, Trash2, ArrowUpRight
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Fetch all live settings on mount
  useEffect(() => {
    fetchStoreStatus();
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

  const parseUserCommand = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = text.toLowerCase();

      // COMMAND: Create / Add Product
      if (lower.includes('create product') || lower.includes('add product') || lower.includes('new product')) {
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: "I can help you add a new product. Please fill in the details below:",
          timestamp: new Date(),
          actionType: 'create_product'
        }]);
        setIsTyping(false);
        return;
      }

      // COMMAND: Show Products
      if (lower.includes('show products') || lower.includes('view products') || lower.includes('list products')) {
        if (productsList.length === 0) {
          setMessages(prev => [...prev, {
            sender: 'ai',
            text: "You currently have no products listed. Type *'add product'* to create one!",
            timestamp: new Date()
          }]);
        } else {
          const listText = productsList.slice(0, 5).map(p => `• **${p.name}** (₹${p.price}) - Stock: ${p.inventory_quantity}`).join('\n');
          setMessages(prev => [...prev, {
            sender: 'ai',
            text: `You have **${productsList.length} products** in your catalog. Here are the recent ones:\n\n${listText}\n\n[View All Products →](/admin/products)`,
            timestamp: new Date()
          }]);
        }
        setIsTyping(false);
        return;
      }

      // COMMAND: Update Price (Change price of [Name] to [Price])
      const priceMatch = lower.match(/(?:change|update|edit) price of (.+?) to (?:rs\.?|₹)?(\d+)/i);
      if (priceMatch && priceMatch[1] && priceMatch[2]) {
        const prodSearchName = priceMatch[1].trim();
        const newPrice = Number(priceMatch[2]);

        const matchedProd = productsList.find(p => p.name.toLowerCase().includes(prodSearchName));
        if (matchedProd) {
          setMessages(prev => [...prev, {
            sender: 'ai',
            text: `I found matching product **${matchedProd.name}**.\n\n**Current Price:** ₹${matchedProd.price}\n**New Price:** ₹${newPrice}\n\nConfirm update?`,
            timestamp: new Date(),
            actionType: 'confirm_update',
            actionData: { id: matchedProd.id, price: newPrice, name: matchedProd.name }
          }]);
        } else {
          setMessages(prev => [...prev, {
            sender: 'ai',
            text: `Sorry, I couldn't find any product matching "${prodSearchName}" in your catalog.`,
            timestamp: new Date()
          }]);
        }
        setIsTyping(false);
        return;
      }

      // COMMAND: Delete Product (Delete [Name])
      const deleteMatch = lower.match(/delete (.+)/i);
      if (deleteMatch && deleteMatch[1]) {
        const prodSearchName = deleteMatch[1].trim();
        const matchedProd = productsList.find(p => p.name.toLowerCase().includes(prodSearchName));

        if (matchedProd) {
          setMessages(prev => [...prev, {
            sender: 'ai',
            text: `Are you sure you want to delete **${matchedProd.name}**?\n\n⚠ Warning: This action will permanently remove this product from your catalog.`,
            timestamp: new Date(),
            actionType: 'confirm_delete',
            actionData: { id: matchedProd.id, name: matchedProd.name }
          }]);
        } else {
          setMessages(prev => [...prev, {
            sender: 'ai',
            text: `Sorry, I couldn't find any product matching "${prodSearchName}" to delete.`,
            timestamp: new Date()
          }]);
        }
        setIsTyping(false);
        return;
      }

      // Default Help Fallback
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `I can help you manage products and check setups!\n\nTry commands like:\n• *"Add product"* to open inline creation.\n• *"Show products"* to view catalog.\n• *"Change price of [product name] to [price]"*\n• *"Delete [product name]"*\n• *"Analyze store"* to run health check.`,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 800);
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
                <h3 className="font-extrabold text-xs uppercase tracking-widest text-white">CrevaWebs Assistant</h3>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Store Assistant • Online</span>
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
                  { id: 'ticket', label: 'Support', icon: Phone }
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

                          {/* Action Render: Create Product Form inline */}
                          {m.sender === 'ai' && m.actionType === 'create_product' && (
                            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm w-full max-w-[280px]">
                              <span className="text-[9px] uppercase font-bold text-slate-400">Add New Product</span>
                              <input 
                                type="text" 
                                placeholder="Product Name (e.g. Lavender Soap)"
                                value={newProductName}
                                onChange={e => setNewProductName(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-800"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input 
                                  type="number" 
                                  placeholder="Price (₹)"
                                  value={newProductPrice}
                                  onChange={e => setNewProductPrice(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-800"
                                />
                                <input 
                                  type="number" 
                                  placeholder="Stock"
                                  value={newProductStock}
                                  onChange={e => setNewProductStock(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 text-slate-800"
                                />
                              </div>
                              <textarea 
                                placeholder="Short description details..."
                                rows={2}
                                value={newProductDesc}
                                onChange={e => setNewProductDesc(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-blue-500 text-slate-800 resize-none"
                              />
                              <button
                                onClick={handleCreateProductInline}
                                disabled={actionLoading || !newProductName.trim() || !newProductPrice.trim()}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                              >
                                {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create Product'}
                              </button>
                            </div>
                          )}

                          {/* Action Render: Confirm price update */}
                          {m.sender === 'ai' && m.actionType === 'confirm_update' && m.actionData && (
                            <div className="flex gap-2 pt-1.5">
                              <button
                                onClick={() => handleUpdatePrice(m.actionData.id, m.actionData.price, m.actionData.name)}
                                disabled={actionLoading}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] rounded-lg shadow-sm"
                              >
                                {actionLoading ? 'Updating...' : 'Confirm Update'}
                              </button>
                              <button
                                onClick={() => setMessages(prev => [...prev, { sender: 'ai', text: 'Cancelled update.', timestamp: new Date() }])}
                                className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[10px] rounded-lg"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {/* Action Render: Confirm Delete */}
                          {m.sender === 'ai' && m.actionType === 'confirm_delete' && m.actionData && (
                            <div className="flex gap-2 pt-1.5">
                              <button
                                onClick={() => handleDeleteProductConfirm(m.actionData.id, m.actionData.name)}
                                disabled={actionLoading}
                                className="px-3.5 py-1.5 bg-red-650 hover:bg-red-500 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> {actionLoading ? 'Deleting...' : 'Delete Product'}
                              </button>
                              <button
                                onClick={() => setMessages(prev => [...prev, { sender: 'ai', text: 'Cancelled deletion.', timestamp: new Date() }])}
                                className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[10px] rounded-lg"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

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
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="font-semibold text-slate-700">Store Name Set</span>
                          </span>
                        </div>

                        <div className="py-2.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            {storeData?.logo_url 
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : <AlertTriangle className="w-4 h-4 text-amber-500" />
                            }
                            <span className="font-semibold text-slate-700">Branding Logo</span>
                          </span>
                          {!storeData?.logo_url && (
                            <Link href="/admin/appearance" className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                              Add Logo <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>

                        <div className="py-2.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            {storeData?.description 
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : <AlertTriangle className="w-4 h-4 text-amber-500" />
                            }
                            <span className="font-semibold text-slate-700">Store Description</span>
                          </span>
                          {!storeData?.description && (
                            <Link href="/admin/settings" className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                              Add Description <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>

                        <div className="py-2.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            {productsList.length > 0 
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : <AlertTriangle className="w-4 h-4 text-amber-500" />
                            }
                            <span className="font-semibold text-slate-700">Products Listing ({productsList.length})</span>
                          </span>
                          {productsList.length === 0 && (
                            <Link href="/admin/products" className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                              Add Product <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>

                        <div className="py-2.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            {integrationsList.length > 0 
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : <AlertTriangle className="w-4 h-4 text-amber-500" />
                            }
                            <span className="font-semibold text-slate-700">Payment integrations</span>
                          </span>
                          {integrationsList.length === 0 && (
                            <Link href="/admin/integrations" className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                              Connect UPI <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>

                        <div className="py-2.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            {!storeData?.is_paused 
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              : <AlertTriangle className="w-4 h-4 text-amber-500" />
                            }
                            <span className="font-semibold text-slate-700">Store Published</span>
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
                    {[
                      { title: 'Store Setup Guide', content: 'Create your inventory catalog categories first, then list products with descriptions, pricing metrics, and image links.' },
                      { title: 'Offline UPI Setup', content: 'Navigate to Business Operations > Integrations. Add your merchant UPI address and save to allow checkout scans.' },
                      { title: 'WhatsApp Integration', content: 'Checkout triggers pre-structured messaging templates. Deliver order updates directly to customer phones.' }
                    ].map((kb, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 mb-1.5">
                          <BookOpen className="w-4 h-4 text-blue-600" /> {kb.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{kb.content}</p>
                      </div>
                    ))}
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
