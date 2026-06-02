'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, X, Minimize2, Maximize2, Send, Sparkles, BookOpen, 
  HelpCircle, Bot, Phone, FileText, ChevronRight, CheckCircle, ArrowLeft, Loader2
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

export default function StoreAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge' | 'suggestions' | 'ticket'>('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: "👋 Hello! I am your Creva Store Assistant. I'm here to help you list products, set up payments, customize your website, or escalate requests to human support. What are you building today?",
      timestamp: new Date()
    }
  ]);
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

  const knowledgeBase = [
    {
      id: 'setup',
      title: 'Store Setup Guide',
      content: 'To start setting up your digital store: list your categories under Catalog > Categories, then navigate to Products to add items with pricing, description, and pictures. Visit settings to configure company names and branding logo details.'
    },
    {
      id: 'payment',
      title: 'Payment Setup Guide',
      content: 'Accept checkout payments by navigating to integrations. Enable UPI Transfer (for direct QR scans & screenshot checkout uploads), update your official Bank Details for wire transfers, or connect secure card processing gateways like Razorpay.'
    },
    {
      id: 'shipping',
      title: 'Shipping & Delivery Guide',
      content: 'Manage deliveries by configuring flat charges or regional options. You can communicate with clients directly via WhatsApp to coordinate custom delivery terms, tracking numbers, or local home delivery drop-offs.'
    },
    {
      id: 'customization',
      title: 'Website Customization Guide',
      content: 'Customize your storefront look: go to Appearance in styling to choose background colors, typography styles, and update headers. Add custom static pages (like FAQ or policies) under Content for absolute store completeness.'
    }
  ];

  const suggestions = [
    {
      title: 'Create Promo Discount',
      desc: 'Introduce a WELCOME10 coupon to drive higher storefront checkout conversion rates.',
      action: 'discounts'
    },
    {
      title: 'Update Hero Banner',
      desc: 'Customize the storefront theme banner with direct premium headings showcasing key stocks.',
      action: 'appearance'
    },
    {
      title: 'Add Best-Selling Soap',
      desc: 'Expand your catalog with high-demand organic soaps (e.g. Manjistha or Charcoal natural bars).',
      action: 'products'
    },
    {
      title: 'Check Pending Orders',
      desc: 'Review recent WhatsApp order checkouts and coordinate deliveries via custom client notifications.',
      action: 'orders'
    }
  ];

  const getAIResponse = (userText: string): string => {
    const text = userText.toLowerCase();
    if (text.includes('product') || text.includes('add') || text.includes('item') || text.includes('catalog')) {
      return `🛒 **How to Add Products:**\n1. Go to **Catalog & Sales > Products** in the sidebar.\n2. Click the **Add Product** button in the top right.\n3. Fill in the product details (Title, Price, Description, Images).\n4. Click **Save Product** to make it immediately active on your storefront.`;
    }
    if (text.includes('coupon') || text.includes('discount') || text.includes('offer') || text.includes('promo')) {
      return `🏷️ **How to Create Coupons:**\n1. Navigate to **Store Styling & Content > Offers & Coupons**.\n2. Click the **Create Coupon** button.\n3. Input your promo discount code (e.g., WELCOME15), discount type (percentage/fixed value), and constraints.\n4. Click **Create Coupon** to publish it.`;
    }
    if (text.includes('order') || text.includes('ship') || text.includes('invoice') || text.includes('delivery')) {
      return `📦 **How to Manage Orders & Invoices:**\n1. Navigate to **Catalog & Sales > Orders**.\n2. Review checkout details. Click **PDF Invoice** to generate printer-ready blue-themed invoices with automatic word amounts.\n3. Click the status button to update fulfillment tracking (Accepted, Shipped, Delivered).\n4. Click the chat button to initiate free WhatsApp client messages.`;
    }
    if (text.includes('website') || text.includes('appearance') || text.includes('color') || text.includes('logo') || text.includes('banner')) {
      return `🎨 **How to Customize Website Themes:**\n1. Go to **Store Styling & Content > Appearance**.\n2. Change your theme brand colors, upload header logos, and write custom hero headlines.\n3. Add dynamic text or policy pages under the **Content** tab.\n4. Click **Save Theme Configuration** to see storefront designs sync instantly.`;
    }
    if (text.includes('payment') || text.includes('bank') || text.includes('upi') || text.includes('razorpay')) {
      return `💳 **How to Connect Payment Gateways:**\n1. Go to **Business Operations > Integrations**.\n2. Enable standard payment options (UPI scan, direct wire transfers, or link payment credentials).\n3. Input your active VPA address or bank account numbers and click Save.\n4. For cards or netbanking, fill in client credentials for secure payment processors.`;
    }
    if (text.includes('support') || text.includes('help') || text.includes('call') || text.includes('human') || text.includes('whatsapp')) {
      return `📞 **Reach Customer Support:**\nIf you need custom assistance, I can redirect you to our human support team immediately.\n\n• **WhatsApp Support**: Chat at wa.me/9108489371766\n• **Customer Helpline**: 084893 71766\n\nAlternatively, switch to the **Support Ticket** tab in this window to leave a secure message, and our agents will respond back shortly!`;
    }

    return `🤖 I am here to help you list products, connect payments, customize your website design, or generate coupons!\n\nTry asking me:\n- *"How do I list products?"*\n- *"How do I connect UPI payment?"*\n- *"How to manage orders and print invoices?"*\n\nIf you need direct human support, you can switch to the **Support Ticket** tab above or type *"contact support"*.`;
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(text);
      setMessages(prev => [...prev, { sender: 'ai', text: response, timestamp: new Date() }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    setTicketStatus('submitting');
    setTimeout(() => {
      setTicketStatus('success');
      setTicketSubject('');
      setTicketMessage('');
      
      // Post notification to chat
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `🎟️ **Support Ticket Created Successfully!**\nYour query regarding *"${ticketSubject}"* has been sent to our tech desk. Our customer help desk will reach out within 2-4 business hours.`,
        timestamp: new Date()
      }]);
    }, 1500);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-50 bg-[#3C77C3] hover:bg-[#3C77C3]/90 text-white p-4 rounded-full shadow-[0_8px_30px_rgb(60,119,195,0.4)] flex items-center justify-center transition-all duration-300 hover:scale-105 group border border-[#3C77C3]/20 cursor-pointer animate-bounce"
        >
          <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out font-sans font-black text-[10px] uppercase tracking-widest pl-0 group-hover:pl-2 text-white block">
            Store Assistant
          </span>
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div 
          className={`fixed z-50 bg-background border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col font-sans transition-all duration-300 
            ${isMinimized 
              ? 'bottom-6 right-6 w-72 h-16 animate-out shrink-0' 
              : 'bottom-6 right-6 w-[380px] sm:w-[400px] h-[550px] max-h-[85vh] max-w-[95vw]'
            }
          `}
        >
          {/* Header */}
          <div className="bg-[#3C77C3] text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/10 rounded-xl">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-black text-xs uppercase tracking-widest text-white">Store Assistant</h3>
                <span className="text-[9px] text-blue-100 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> AI Agent Online
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body contents if not minimized */}
          {!isMinimized && (
            <>
              {/* Tab Navigation */}
              <div className="flex border-b border-border bg-muted/20 shrink-0 text-[10px] font-black uppercase tracking-wider text-muted-foreground select-none">
                {[
                  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
                  { id: 'knowledge', label: 'Guides', icon: BookOpen },
                  { id: 'suggestions', label: 'Tips', icon: Sparkles },
                  { id: 'ticket', label: 'Support', icon: Phone }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      if (tab.id === 'ticket') setTicketStatus('idle');
                    }}
                    className={`flex-1 py-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                      activeTab === tab.id 
                        ? 'border-[#3C77C3] text-[#3C77C3] bg-background' 
                        : 'border-transparent hover:text-foreground hover:bg-muted/30'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto p-4 bg-muted/5 min-h-0">
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
                            ? 'bg-[#3C77C3] text-white' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {m.sender === 'user' ? 'ME' : 'AI'}
                        </div>
                        <div className={`p-3 rounded-2xl text-[11px] sm:text-xs leading-relaxed text-left whitespace-pre-line shadow-sm border ${
                          m.sender === 'user' 
                            ? 'bg-[#3C77C3] text-white border-[#3C77C3]' 
                            : 'bg-background text-foreground border-border'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}

                    {/* Typing status */}
                    {isTyping && (
                      <div className="flex gap-2.5 mr-auto max-w-[85%]">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 shrink-0 flex items-center justify-center font-bold text-[10px]">
                          AI
                        </div>
                        <div className="bg-background text-foreground border border-border p-3 rounded-2xl flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-100" />
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />

                    {/* Starter Prompts / FAQ Buttons */}
                    {messages.length === 1 && (
                      <div className="space-y-1.5 pt-2 text-left">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-1">Suggested Questions</span>
                        <div className="flex flex-col gap-1">
                          {[
                            'How to add products?',
                            'How to create coupons?',
                            'How to manage orders?',
                            'How to customize website?',
                            'How to connect payment gateway?'
                          ].map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(q)}
                              className="text-left text-xs bg-background hover:bg-muted/50 border rounded-xl px-3.5 py-2 flex items-center justify-between group transition-all cursor-pointer font-medium border-border"
                            >
                              <span>{q}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'knowledge' && (
                  <div className="space-y-3 text-left">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-1">Knowledge Base Guides</span>
                    {knowledgeBase.map((kb) => (
                      <div key={kb.id} className="bg-background border border-border rounded-2xl p-4 shadow-sm hover:border-[#3C77C3]/30 transition-all">
                        <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 mb-1.5">
                          <BookOpen className="w-4 h-4 text-[#3C77C3]" /> {kb.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{kb.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'suggestions' && (
                  <div className="space-y-3 text-left">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-1 font-sans">Smart Suggestions</span>
                    {suggestions.map((s, idx) => (
                      <div key={idx} className="bg-background border border-border rounded-2xl p-4 shadow-sm flex flex-col justify-between h-fit hover:border-[#3C77C3]/30 transition-all gap-3">
                        <div>
                          <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-500" /> {s.title}
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{s.desc}</p>
                        </div>
                        <Link
                          href={`/admin/${s.action}`}
                          className="self-end text-[9px] font-black uppercase tracking-widest text-[#3C77C3] hover:text-[#3C77C3]/80 flex items-center gap-1 transition-all"
                        >
                          Launch Action <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'ticket' && (
                  <div className="space-y-4 text-left">
                    {ticketStatus === 'success' ? (
                      <div className="text-center py-8 space-y-3">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                        <h4 className="font-bold text-sm">Ticket Submitted!</h4>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">Your support request has been logged. We will get back to you shortly.</p>
                        <button
                          onClick={() => {
                            setTicketStatus('idle');
                            setActiveTab('chat');
                          }}
                          className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-muted/50 transition-all cursor-pointer"
                        >
                          Return to Chat
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Direct Contacts */}
                        <div className="bg-[#3C77C3]/5 border border-[#3C77C3]/10 p-4 rounded-2xl space-y-2">
                          <h4 className="font-bold text-xs text-gray-900 flex items-center gap-1">
                            <Phone className="w-4 h-4 text-[#3C77C3]" /> Platform Support Hotlines
                          </h4>
                          <div className="text-[11px] text-muted-foreground space-y-1">
                            <p>📞 Phone support: <span className="font-bold text-gray-900">084893 71766</span></p>
                            <p>💬 WhatsApp support: <a href="https://wa.me/9108489371766" target="_blank" rel="noopener noreferrer" className="font-bold text-[#3C77C3] hover:underline">Click to chat</a></p>
                          </div>
                        </div>

                        {/* Ticket form */}
                        <form onSubmit={handleSubmitTicket} className="space-y-3 bg-background border border-border p-4 rounded-2xl shadow-sm">
                          <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 mb-1">
                            <FileText className="w-4 h-4 text-[#3C77C3]" /> Submit Tech Support Ticket
                          </h4>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Subject</label>
                            <input 
                              type="text"
                              value={ticketSubject}
                              onChange={e => setTicketSubject(e.target.value)}
                              placeholder="e.g. Domain setup issue"
                              required
                              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-[#3C77C3]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Describe issue details</label>
                            <textarea 
                              rows={3}
                              value={ticketMessage}
                              onChange={e => setTicketMessage(e.target.value)}
                              placeholder="Describe your question or error details here..."
                              required
                              className="w-full bg-background border border-border rounded-xl p-3 text-xs outline-none focus:border-[#3C77C3] resize-none"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={ticketStatus === 'submitting'}
                            className="w-full py-2.5 bg-[#3C77C3] hover:bg-[#3C77C3]/90 text-white font-bold uppercase tracking-widest text-[9px] rounded-xl flex items-center justify-center gap-1 shadow-md shadow-[#3C77C3]/10 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {ticketStatus === 'submitting' ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting Ticket
                              </>
                            ) : (
                              'Send Support Ticket'
                            )}
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Input Field if on Chat Tab */}
              {activeTab === 'chat' && (
                <div className="p-3 border-t border-border bg-background flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend(input)}
                    placeholder="Type store question (e.g. listing items...)"
                    className="flex-1 bg-muted/30 border border-border/80 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#3C77C3] focus:bg-background transition-all"
                  />
                  <button
                    onClick={() => handleSend(input)}
                    disabled={!input.trim()}
                    className="p-2.5 bg-[#3C77C3] text-white rounded-xl hover:bg-[#3C77C3]/90 transition-colors shadow-sm disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Minimized Quick Bar */}
          {isMinimized && (
            <button
              onClick={() => setIsMinimized(false)}
              className="flex-1 flex items-center justify-between px-4 h-full w-full bg-background font-medium text-xs text-foreground cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-bold text-[10px] uppercase tracking-wider">Assistant Minimized</span>
              </div>
              <div className="text-[10px] text-[#3C77C3] font-black uppercase tracking-wider flex items-center gap-0.5">
                Expand <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          )}
        </div>
      )}
    </>
  );
}
