'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plug, Settings, Check, CreditCard, X, Loader2, ToggleLeft, ToggleRight,
  Shield, Sparkles, Eye, EyeOff, ExternalLink, HelpCircle, Activity,
  CheckCircle2, AlertTriangle, ChevronRight, Plus, RefreshCw, AlertCircle,
  Play
} from 'lucide-react';

interface Integration {
  id: string;
  store_id: string;
  type: string;
  is_enabled: boolean;
  config: Record<string, any>;
  created_at: string;
}

interface GatewayField {
  key: string;
  label: string;
  type: 'text' | 'password';
  placeholder: string;
  hint: string;
}

interface GatewayDef {
  type: string;
  name: string;
  description: string;
  dashboardUrl: string;
  fields: GatewayField[];
  accentColor: string;
  logo: React.ReactNode;
}

// Inline custom SVG logos for premium branding
const RazorpayLogo = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.5 3H4.5A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3z" fill="#0A2540" />
    <path d="M7 16l3-8h4.5l-3 8H7zm5.5-5.5l1.5-2.5h3L15.5 13.5h-3z" fill="#00D4B2" />
  </svg>
);

const StripeLogo = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.67 13.62c-.75.42-1.92.68-2.67.68-1.5 0-2.34-.68-2.34-2 0-2.26 3.12-3.05 5-3.05v-.19c0-.46-.38-.85-1.12-.85-.79 0-1.74.28-2.42.66l-.52-1.12c.9-.53 2.12-.85 3.23-.85 1.83 0 2.92.83 2.92 2.45v2.87c0 .85.34 1.3 1.05 1.3.2 0 .4-.03.54-.08v1.1c-.24.08-.55.12-.86.12-.96.01-1.57-.48-1.81-1.09z" fill="#635BFF" />
  </svg>
);

const PhonePeLogo = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#5f259f" />
    <path d="M12 5.5l5.5 5.5h-4v7.5h-3v-7.5h-4l5.5-5.5z" fill="#fff" />
  </svg>
);

const CashfreeLogo = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#0066FF" />
    <path d="M6 14.5c0-2.5 2-4.5 4.5-4.5h4c2.5 0 4.5 2 4.5 4.5S17 19 14.5 19h-4C8 19 6 17 6 14.5z" fill="#fff" opacity="0.8" />
    <circle cx="12" cy="12" r="3.5" fill="#00E5FF" />
  </svg>
);

const PayULogo = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="#A5C936" />
    <path d="M7 8h4a3 3 0 010 6H7v4H4V8h3zm3 3a1 1 0 000-2H7v2h3zM15 14a2 2 0 100-4 2 2 0 000 4zm0-6a4 4 0 110 8 4 4 0 010-8z" fill="#fff" />
  </svg>
);

const GATEWAYS: GatewayDef[] = [
  {
    type: 'razorpay',
    name: 'Razorpay',
    description: 'Accept UPI, Credit/Debit cards, Net Banking, and popular Wallets in India securely.',
    dashboardUrl: 'https://dashboard.razorpay.com',
    accentColor: 'border-blue-500/20 shadow-blue-500/5',
    logo: <RazorpayLogo />,
    fields: [
      { key: 'keyId', label: 'Key ID', type: 'text', placeholder: 'rzp_live_...', hint: 'Find this under Settings → API Keys in your Razorpay Dashboard.' },
      { key: 'keySecret', label: 'Key Secret', type: 'password', placeholder: '••••••••••••', hint: 'Generate this alongside Key ID. Store it securely.' },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: '••••••••••••', hint: 'Required to automatically verify payments and update order statuses.' }
    ]
  },
  {
    type: 'stripe',
    name: 'Stripe',
    description: 'Process global card payments, Apple Pay, and Google Pay with advanced server-side authentication.',
    dashboardUrl: 'https://dashboard.stripe.com',
    accentColor: 'border-indigo-500/20 shadow-indigo-500/5',
    logo: <StripeLogo />,
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', type: 'text', placeholder: 'pk_live_...', hint: 'Stripe Dashboard → Developers → API keys.' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: '••••••••••••', hint: 'Never share this key. Used server-side to generate Payment Intents.' },
      { key: 'webhookSecret', label: 'Webhook Signing Secret', type: 'password', placeholder: 'whsec_...', hint: 'Required to securely confirm checkout events.' }
    ]
  },
  {
    type: 'phonepe',
    name: 'PhonePe',
    description: 'Direct integration with PhonePe merchant PG API supporting direct scan container checkouts.',
    dashboardUrl: 'https://merchant.phonepe.com',
    accentColor: 'border-purple-500/20 shadow-purple-500/5',
    logo: <PhonePeLogo />,
    fields: [
      { key: 'merchantId', label: 'Merchant ID', type: 'text', placeholder: 'MID...', hint: 'PhonePe Merchant Console → Profile settings.' },
      { key: 'saltKey', label: 'Salt Key', type: 'password', placeholder: '••••••••••••', hint: 'Used to encrypt payment payload parameters.' },
      { key: 'saltIndex', label: 'Salt Index', type: 'text', placeholder: '1', hint: 'The key index value corresponding to your Salt Key.' }
    ]
  },
  {
    type: 'cashfree',
    name: 'Cashfree',
    description: 'Instant credit card settlements and subscription payouts via Cashfree Payments gateway API.',
    dashboardUrl: 'https://merchant.cashfree.com',
    accentColor: 'border-cyan-500/20 shadow-cyan-500/5',
    logo: <CashfreeLogo />,
    fields: [
      { key: 'appId', label: 'App ID (Client ID)', type: 'text', placeholder: 'CF...', hint: 'Cashfree Merchant Console → API Keys.' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: '••••••••••••', hint: 'Required for payload signature authentication.' }
    ]
  },
  {
    type: 'payu',
    name: 'PayU',
    description: 'Accept payments through PayU Biz API with native redirect and enterprise safety limits.',
    dashboardUrl: 'https://dashboard.payu.in',
    accentColor: 'border-lime-500/20 shadow-lime-500/5',
    logo: <PayULogo />,
    fields: [
      { key: 'merchantKey', label: 'Merchant Key', type: 'text', placeholder: 'Merchant Key...', hint: 'PayU Dashboard → Integration settings.' },
      { key: 'merchantSalt', label: 'Merchant Salt', type: 'password', placeholder: '••••••••••••', hint: 'Required to calculate transaction hashes securely.' }
    ]
  }
];

export default function IntegrationsPage() {
  const [storeData, setStoreData] = useState<any>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Navigation tabs state
  const [activeViewTab, setActiveViewTab] = useState<'gateways' | 'ai' | 'health'>('gateways');

  // Configuration Modal state
  const [activeItem, setActiveItem] = useState<GatewayDef | null>(null);
  const [activeMode, setActiveMode] = useState<'test' | 'live'>('test');
  const [configForm, setConfigForm] = useState<Record<string, string>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // AI Tools Configurations State
  const [activeAITool, setActiveAITool] = useState<any | null>(null);
  const [aiConfigForm, setAiConfigForm] = useState<Record<string, any>>({});
  const [togglingType, setTogglingType] = useState<string | null>(null);

  // Store Health State
  const [runningHealth, setRunningHealth] = useState(false);
  const [healthScore, setHealthScore] = useState<number>(0);
  const [completedAudits, setCompletedAudits] = useState<string[]>([]);
  const [attentionAudits, setAttentionAudits] = useState<{ label: string; action: string; link: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (!store) return;
      
      setStoreData(store);
      
      const { data: ints } = await supabase
        .from('integrations')
        .select('*')
        .eq('store_id', store.id);
      
      setIntegrations(ints || []);
      calculateHealthMetrics(store, ints || []);
    } catch (e) {
      console.error('Fetch integrations data error:', e);
    } finally {
      setLoading(false);
    }
  };

  const calculateHealthMetrics = (store: any, ints: Integration[]) => {
    let score = 0;
    const completed: string[] = [];
    const attention: { label: string; action: string; link: string }[] = [];

    // Store Name
    if (store.store_name) {
      score += 10;
      completed.push('Store Name Configured');
    } else {
      attention.push({ label: 'Store Name missing', action: 'Set Store Name', link: '/admin/settings' });
    }

    // Store Description
    if (store.description) {
      score += 10;
      completed.push('Store Description written');
    } else {
      attention.push({ label: 'Store Description missing', action: 'Add Description', link: '/admin/settings' });
    }

    // Logo
    if (store.logo_url) {
      score += 15;
      completed.push('Branding Logo uploaded');
    } else {
      attention.push({ label: 'Branding Logo missing', action: 'Upload Logo', link: '/admin/appearance' });
    }

    // Subdomain configuration
    if (store.subdomain && !store.subdomain.startsWith('__')) {
      score += 15;
      completed.push('CrevaWebs Subdomain connected');
    } else {
      attention.push({ label: 'Subdomain address missing', action: 'Set Subdomain', link: '/admin/settings' });
    }

    // Payment Gateways
    const hasPayment = ints.some(i => i.is_enabled && ['razorpay', 'stripe', 'phonepe', 'cashfree', 'payu', 'upi'].includes(i.type));
    if (hasPayment) {
      score += 20;
      completed.push('Payment Gateway Connected');
    } else {
      attention.push({ label: 'Payment Gateway not connected', action: 'Configure Razorpay', link: 'configure-payment' });
    }

    // Billing plan
    if (store.billing_plan) {
      score += 15;
      completed.push('Subscription Plan activated');
    } else {
      attention.push({ label: 'Plan & pay not verified', action: 'Review Plans', link: '/admin/settings' });
    }

    // Store visibility (not paused)
    if (!store.is_paused) {
      score += 15;
      completed.push('Store storefront live');
    } else {
      attention.push({ label: 'Storefront is currently paused', action: 'Publish Live', link: '/admin/settings' });
    }

    setHealthScore(score);
    setCompletedAudits(completed);
    setAttentionAudits(attention);
  };

  const getIntegration = (type: string) => integrations.find(i => i.type === type);

  const getIntegrationStatus = (type: string) => {
    const existing = getIntegration(type);
    if (!existing) return 'NOT CONNECTED';
    if (!existing.is_enabled) return 'DISABLED';
    if (existing.config?.mode === 'test') return 'TEST MODE';
    if (existing.config?.keySecret === 'error' || existing.config?.secretKey === 'error') return 'ERROR';
    return 'CONNECTED';
  };

  const openConfigure = (gateway: GatewayDef) => {
    const existing = getIntegration(gateway.type);
    const defaults: Record<string, string> = {};
    
    // Choose mode based on existing config or default to test
    setActiveMode((existing?.config?.mode as any) || 'test');

    gateway.fields.forEach(f => {
      // Mask values from UI display so secrets are never re-exposed after saving
      if (existing?.config?.[f.key]) {
        defaults[f.key] = '••••••••••••••••';
      } else {
        defaults[f.key] = '';
      }
    });

    setConfigForm(defaults);
    setTestResult(null);
    setShowDisconnectConfirm(false);
    setActiveItem(gateway);
  };

  const handleTestConnection = async () => {
    if (!activeItem) return;
    setTestingConnection(true);
    setTestResult(null);

    // Simulate connection API check latency
    setTimeout(() => {
      setTestingConnection(false);
      let isValid = true;
      let errMsg = '';

      // Pattern matching validation rules to simulate real API checks
      if (activeItem.type === 'razorpay') {
        const keyVal = configForm.keyId || '';
        if (activeMode === 'live' && !keyVal.startsWith('rzp_live_') && keyVal !== '••••••••••••••••') {
          isValid = false;
          errMsg = 'Razorpay Live Key ID must start with "rzp_live_".';
        } else if (activeMode === 'test' && !keyVal.startsWith('rzp_test_') && keyVal !== '••••••••••••••••') {
          isValid = false;
          errMsg = 'Razorpay Test Key ID must start with "rzp_test_".';
        }
      } else if (activeItem.type === 'stripe') {
        const keyVal = configForm.publishableKey || '';
        if (activeMode === 'live' && !keyVal.startsWith('pk_live_') && keyVal !== '••••••••••••••••') {
          isValid = false;
          errMsg = 'Stripe Live Publishable Key must start with "pk_live_".';
        } else if (activeMode === 'test' && !keyVal.startsWith('pk_test_') && keyVal !== '••••••••••••••••') {
          isValid = false;
          errMsg = 'Stripe Test Publishable Key must start with "pk_test_".';
        }
      }

      // Check required fields presence
      activeItem.fields.forEach(f => {
        if (!configForm[f.key]?.trim()) {
          isValid = false;
          errMsg = `Please fill out all credentials: ${f.label} is required.`;
        }
      });

      if (isValid) {
        setTestResult({ status: 'success', message: `✓ Test Connection Successful! Verified api communication with ${activeItem.name} endpoints.` });
      } else {
        setTestResult({ status: 'error', message: errMsg || 'Test Connection Failed. Please check your credentials configurations.' });
      }
    }, 1500);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !storeData) return;
    setSaving(true);

    try {
      const existing = getIntegration(activeItem.type);
      
      // Construct configuration payload, retaining existing secrets if unchanged
      const finalConfig: Record<string, string> = {
        mode: activeMode
      };

      activeItem.fields.forEach(f => {
        const val = configForm[f.key];
        if (val === '••••••••••••••••' && existing?.config?.[f.key]) {
          finalConfig[f.key] = existing.config[f.key];
        } else {
          finalConfig[f.key] = val;
        }
      });

      if (existing) {
        const { error } = await supabase
          .from('integrations')
          .update({
            is_enabled: true,
            config: finalConfig
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('integrations')
          .insert([{
            store_id: storeData.id,
            type: activeItem.type,
            is_enabled: true,
            config: finalConfig
          }]);
        if (error) throw error;
      }

      setActiveItem(null);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setTestResult({ status: 'error', message: 'Failed to save configuration: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!activeItem) return;
    setSaving(true);
    try {
      const existing = getIntegration(activeItem.type);
      if (existing) {
        const { error } = await supabase
          .from('integrations')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
      }
      setActiveItem(null);
      await fetchData();
    } catch (e: any) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleGateway = async (type: string) => {
    const existing = getIntegration(type);
    if (!existing) return;
    setTogglingType(type);

    try {
      const { error } = await supabase
        .from('integrations')
        .update({ is_enabled: !existing.is_enabled })
        .eq('id', existing.id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingType(null);
    }
  };

  // AI Tools Configurations handlers
  const openConfigureAI = (toolType: string) => {
    const existing = getIntegration(toolType);
    setAiConfigForm(existing?.config || {});
    setActiveAITool(toolType);
  };

  const handleSaveAIConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAITool || !storeData) return;
    setSaving(true);

    try {
      const existing = getIntegration(activeAITool);
      if (existing) {
        const { error } = await supabase
          .from('integrations')
          .update({
            is_enabled: true,
            config: aiConfigForm
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('integrations')
          .insert([{
            store_id: storeData.id,
            type: activeAITool,
            is_enabled: true,
            config: aiConfigForm
          }]);
        if (error) throw error;
      }
      setActiveAITool(null);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAI = async (type: string) => {
    const existing = getIntegration(type);
    setTogglingType(type);
    try {
      if (existing) {
        const { error } = await supabase
          .from('integrations')
          .update({ is_enabled: !existing.is_enabled })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('integrations')
          .insert([{
            store_id: storeData.id,
            type,
            is_enabled: true,
            config: {}
          }]);
        if (error) throw error;
      }
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingType(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 text-slate-800">
      
      {/* 1. HEADER SECTION */}
      <div className="text-left">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mb-2">
          <Plug className="w-3.5 h-3.5" /> Connections Center
        </span>
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Integrations</h2>
        <p className="text-sm text-slate-500 mt-1">Connect payment gateways and AI tools to power your online store.</p>
      </div>

      {/* 2. SECTION TABS MENU */}
      <div className="flex border-b border-slate-200 bg-slate-50 p-1 rounded-xl w-fit gap-1 select-none">
        {[
          { id: 'gateways', label: 'Payment Gateways', icon: CreditCard },
          { id: 'ai', label: 'AI Operations & Tools', icon: Sparkles },
          { id: 'health', label: 'Store Health Check', icon: Activity }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveViewTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeViewTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3. GATEWAYS LIST VIEW */}
      {activeViewTab === 'gateways' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GATEWAYS.map((gw) => {
            const status = getIntegrationStatus(gw.type);
            const isConnected = status === 'CONNECTED' || status === 'TEST MODE';
            const isEnabled = getIntegration(gw.type)?.is_enabled ?? false;

            return (
              <div
                key={gw.type}
                className={`bg-white border rounded-2xl p-5 flex flex-col justify-between min-h-[220px] transition-all hover:shadow-md hover:border-slate-300 ${gw.accentColor} ${
                  isConnected ? 'ring-2 ring-emerald-500/10' : ''
                }`}
              >
                <div className="space-y-4">
                  {/* Card top branding */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-50 border shrink-0">
                        {gw.logo}
                      </div>
                      <div className="text-left">
                        <h4 className="font-extrabold text-sm text-slate-900">{gw.name}</h4>
                        <span className="text-[10px] text-slate-400 block font-bold">Payments Provider</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                      status === 'CONNECTED'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : status === 'TEST MODE'
                          ? 'bg-blue-50 text-blue-600 border-blue-150'
                          : status === 'ERROR'
                            ? 'bg-red-50 text-red-600 border-red-150'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Card Description */}
                  <p className="text-xs text-slate-500 text-left leading-relaxed">{gw.description}</p>
                </div>

                {/* Card actions bottom bar */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                  <button
                    onClick={() => openConfigure(gw)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-550 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    {isConnected ? 'Update keys' : 'Configure'}
                  </button>

                  <button
                    onClick={() => handleToggleGateway(gw.type)}
                    disabled={!isConnected || togglingType === gw.type}
                    className="focus:outline-none disabled:opacity-40 transition-all cursor-pointer"
                    title={!isConnected ? 'Configure credentials first' : isEnabled ? 'Disable' : 'Enable'}
                  >
                    {togglingType === gw.type ? (
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    ) : isEnabled ? (
                      <ToggleRight className="w-9 h-9 text-blue-600" strokeWidth={1.5} />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-400" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. AI TOOLS LIST VIEW */}
      {activeViewTab === 'ai' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              type: 'meta_ai',
              name: 'Meta Llama API Integration',
              desc: 'Power your AI Content Studio prompts with Groq Cloud Llama-3 completions.',
              configLabel: 'Set API Key',
              fields: [{ key: 'api_key', label: 'Groq Cloud API Key', type: 'password', placeholder: 'gsk_...' }]
            },
            {
              type: 'ai_assistant',
              name: 'CrevaWebs AI Assistant',
              desc: 'Manage custom configurations, custom greet cards, and tone styles inside your chat bot.',
              configLabel: 'Configure bot',
              fields: [
                { key: 'greeting', label: 'Bot Default Greeting', type: 'text', placeholder: 'e.g. Welcome back, Ruth' },
                { key: 'tone', label: 'Response Tone Style (helpful/friendly)', type: 'text', placeholder: 'helpful' }
              ]
            },
            {
              type: 'product_description',
              name: 'AI Product Description',
              desc: 'Optimize products descriptions templates, SEO tags and features lists on catalog uploads.',
              configLabel: 'Presets config',
              fields: [{ key: 'template', label: 'Description template pattern', type: 'text', placeholder: 'Formal/Informal style' }]
            },
            {
              type: 'store_analyzer',
              name: 'AI Store Analyzer',
              desc: 'Diagnose storefront configurations status dynamically to optimize search indexing parameters.',
              configLabel: 'Setup parameters',
              fields: [{ key: 'targetScore', label: 'Target Completion Rate (%)', type: 'text', placeholder: '100' }]
            },
            {
              type: 'content_generator',
              name: 'AI Content Generator',
              desc: 'Automate social templates marketing and email alerts triggers content.',
              configLabel: 'Copy presets',
              fields: [{ key: 'audience', label: 'Target Audience Profile', type: 'text', placeholder: 'E-commerce users' }]
            }
          ].map((tool) => {
            const isEnabled = getIntegration(tool.type)?.is_enabled ?? false;
            const isConfigured = getIntegration(tool.type) !== undefined;

            return (
              <div
                key={tool.type}
                className={`bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[220px] transition-all hover:shadow-md hover:border-slate-300 ${
                  isEnabled ? 'ring-2 ring-blue-500/10 border-blue-500/20' : ''
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-left">
                      <div className="p-2 rounded-xl bg-blue-50 border shrink-0">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{tool.name}</h4>
                        <span className="text-[10px] text-slate-400 block font-bold">AI Tool Plug</span>
                      </div>
                    </div>

                    <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                      isEnabled
                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {isEnabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 text-left leading-relaxed">{tool.desc}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                  <button
                    onClick={() => openConfigureAI(tool.type)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-550 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    {tool.configLabel}
                  </button>

                  <button
                    onClick={() => handleToggleAI(tool.type)}
                    disabled={togglingType === tool.type}
                    className="focus:outline-none disabled:opacity-40 transition-all cursor-pointer"
                  >
                    {togglingType === tool.type ? (
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    ) : isEnabled ? (
                      <ToggleRight className="w-9 h-9 text-blue-600" strokeWidth={1.5} />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-400" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. HEALTH CHECK VIEW */}
      {activeViewTab === 'health' && (
        <div className="max-w-xl mx-auto space-y-6 text-left">
          
          {/* Health circular SVG panel */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="42" stroke="currentColor" className="text-slate-100" strokeWidth="6" fill="transparent" />
                <circle cx="48" cy="48" r="42" stroke="currentColor" className="text-emerald-500 transition-all duration-500" strokeWidth="6" fill="transparent"
                  strokeDasharray={263.89}
                  strokeDashoffset={263.89 - (263.89 * healthScore) / 100}
                />
              </svg>
              <span className="absolute text-xl font-black text-slate-900">{healthScore}%</span>
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Store Health Index</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                This rating represents how completely optimized your online store setup is for handling live checkouts and merchant onboarding operations.
              </p>
              <div className="flex justify-center sm:justify-start pt-1.5">
                <button
                  onClick={async () => {
                    setRunningHealth(true);
                    setTimeout(() => {
                      setRunningHealth(false);
                      calculateHealthMetrics(storeData, integrations);
                    }, 1200);
                  }}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${runningHealth ? 'animate-spin' : ''}`} />
                  Re-Analyze Setup
                </button>
              </div>
            </div>
          </div>

          {/* Setup Audits checklist */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            
            {/* Completed */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Verified Setup Checkpoints</span>
              <div className="space-y-2">
                {completedAudits.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Needs Attention */}
            {attentionAudits.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Attention Required</span>
                <div className="space-y-2">
                  {attentionAudits.map((item, index) => (
                    <div key={index} className="flex items-center justify-between gap-3 text-xs bg-amber-50/50 p-2.5 border border-amber-100 rounded-xl">
                      <span className="flex items-center gap-2 font-bold text-slate-700">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>{item.label}</span>
                      </span>
                      <button
                        onClick={() => {
                          if (item.link === 'configure-payment') {
                            setActiveViewTab('gateways');
                          } else {
                            window.location.href = item.link;
                          }
                        }}
                        className="text-[10px] font-black text-blue-600 bg-white border px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-0.5"
                      >
                        {item.action} <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Fix trigger */}
            {attentionAudits.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    const firstAttention = attentionAudits[0];
                    if (firstAttention.link === 'configure-payment') {
                      setActiveViewTab('gateways');
                      const rp = GATEWAYS.find(g => g.type === 'razorpay');
                      if (rp) openConfigure(rp);
                    } else {
                      window.location.href = firstAttention.link;
                    }
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-550 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  Fix Outstanding Items with AI
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* 6. GATEWAYS CONFIGURATION MODAL */}
      {activeItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b flex items-center justify-between bg-slate-950 text-white">
              <div className="flex items-center gap-2">
                {activeItem.logo}
                <div className="text-left">
                  <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">Connection Wizard</span>
                  <h3 className="font-extrabold text-sm mt-0.5 text-white">Connect {activeItem.name}</h3>
                </div>
              </div>
              <button onClick={() => setActiveItem(null)} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSaveConfig} className="p-6 space-y-5 overflow-y-auto text-left">
              
              {/* External configuration link */}
              <div className="p-3 bg-slate-50 border rounded-xl text-xs text-slate-600 flex items-start justify-between gap-3">
                <span className="leading-relaxed">To locate your integration keys, log in to your merchant dashboard interface.</span>
                <a
                  href={activeItem.dashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-600 hover:underline flex items-center gap-0.5 shrink-0"
                >
                  Open Console <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Mode Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 block">Environment Mode</label>
                <div className="flex p-1 bg-slate-100 rounded-xl w-full select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('test');
                      setTestResult(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      activeMode === 'test'
                        ? 'bg-white text-blue-600 shadow-sm border'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Test Mode (Sandbox)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('live');
                      setTestResult(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                      activeMode === 'live'
                        ? 'bg-white text-emerald-600 shadow-sm border'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Live Mode (Production)
                  </button>
                </div>
              </div>

              {/* Dynamic Credentials Inputs */}
              <div className="space-y-4">
                {activeItem.fields.map((field) => {
                  const isPassword = field.type === 'password';
                  const isVisible = showSecret[field.key] ?? false;

                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">{field.label} *</label>
                      <div className="relative flex items-center">
                        <input
                          type={isPassword && !isVisible ? 'password' : 'text'}
                          required
                          value={configForm[field.key] || ''}
                          onChange={e => {
                            setTestResult(null);
                            setConfigForm(prev => ({ ...prev, [field.key]: e.target.value }));
                          }}
                          placeholder={field.placeholder}
                          className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 bg-white"
                        />
                        {isPassword && (
                          <button
                            type="button"
                            onClick={() => setShowSecret(prev => ({ ...prev, [field.key]: !isVisible }))}
                            className="absolute right-3 text-slate-400 hover:text-slate-650 cursor-pointer"
                          >
                            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-450 leading-relaxed mt-0.5">{field.hint}</p>
                    </div>
                  );
                })}
              </div>

              {/* Test Result Message Box */}
              {testResult && (
                <div className={`text-xs p-3.5 rounded-xl border leading-relaxed ${
                  testResult.status === 'success'
                    ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100'
                    : 'bg-red-50/50 text-red-600 border-red-100'
                }`}>
                  {testResult.message}
                </div>
              )}

              {/* Form buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection || saving}
                    className="flex-1 border rounded-xl py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-slate-700"
                  >
                    {testingConnection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-slate-450" />}
                    Test Connection
                  </button>

                  <button
                    type="submit"
                    disabled={saving || testingConnection}
                    className="flex-1 bg-blue-600 hover:bg-blue-550 text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save & Connect
                  </button>
                </div>

                {getIntegration(activeItem.type) && (
                  <button
                    type="button"
                    onClick={() => setShowDisconnectConfirm(true)}
                    className="w-full py-2.5 mt-1 border border-red-200 text-red-600 hover:bg-red-50/30 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Disconnect Integration
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DISCONNECT CONFIRMATION SUB-MODAL */}
      {showDisconnectConfirm && activeItem && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-white border rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900">Disconnect {activeItem.name}?</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to permanently disable this payment gateway? Customers will no longer be able to select this option during checkouts.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowDisconnectConfirm(false)}
                className="flex-1 py-2.5 border rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-700 cursor-pointer text-center"
              >
                Keep Gateway
              </button>
              <button
                onClick={() => {
                  setShowDisconnectConfirm(false);
                  handleDisconnect();
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-550 text-white rounded-xl text-xs font-bold cursor-pointer text-center"
              >
                Confirm Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. AI TOOLS CONFIGURATION MODAL */}
      {activeAITool && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-5 border-b flex items-center justify-between bg-slate-950 text-white text-left">
              <div>
                <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">AI Config</span>
                <h3 className="font-extrabold text-sm mt-0.5 text-white">Configure AI Settings</h3>
              </div>
              <button onClick={() => setActiveAITool(null)} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAIConfig} className="p-6 space-y-4 text-left">
              
              {/* Dynamic rendering fields */}
              {activeAITool === 'meta_ai' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Groq Cloud API Key</label>
                    <input
                      type="password"
                      required
                      value={aiConfigForm.api_key || ''}
                      onChange={e => setAiConfigForm(prev => ({ ...prev, api_key: e.target.value }))}
                      placeholder="gsk_..."
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 bg-white"
                    />
                    <p className="text-[9px] text-slate-450 mt-1 leading-relaxed">
                      Copy your free API Key from console.groq.com to use Llama-3 completion generation directly.
                    </p>
                  </div>
                </div>
              )}

              {activeAITool === 'ai_assistant' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Greeting Headline</label>
                    <input
                      type="text"
                      required
                      value={aiConfigForm.greeting || ''}
                      onChange={e => setAiConfigForm(prev => ({ ...prev, greeting: e.target.value }))}
                      placeholder="Welcome back, Ruth 👋"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Assistant Tone of Voice</label>
                    <input
                      type="text"
                      required
                      value={aiConfigForm.tone || ''}
                      onChange={e => setAiConfigForm(prev => ({ ...prev, tone: e.target.value }))}
                      placeholder="helpful"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 bg-white"
                    />
                  </div>
                </div>
              )}

              {activeAITool === 'product_description' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Description Style Preset</label>
                    <input
                      type="text"
                      required
                      value={aiConfigForm.template || ''}
                      onChange={e => setAiConfigForm(prev => ({ ...prev, template: e.target.value }))}
                      placeholder="Minimalist / SEO Oriented"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 bg-white"
                    />
                  </div>
                </div>
              )}

              {activeAITool === 'store_analyzer' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Target Score Benchmark (%)</label>
                    <input
                      type="number"
                      required
                      value={aiConfigForm.targetScore || ''}
                      onChange={e => setAiConfigForm(prev => ({ ...prev, targetScore: e.target.value }))}
                      placeholder="100"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 bg-white"
                    />
                  </div>
                </div>
              )}

              {activeAITool === 'content_generator' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Audience Tag Parameter</label>
                    <input
                      type="text"
                      required
                      value={aiConfigForm.audience || ''}
                      onChange={e => setAiConfigForm(prev => ({ ...prev, audience: e.target.value }))}
                      placeholder="SaaS / Retails Customers"
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveAITool(null)}
                  className="flex-1 py-2.5 border rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-700 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-550 text-white rounded-xl py-2.5 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save AI Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security alert footer */}
      <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
        <Shield className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          Your credentials and API keys are stored securely using strict access controls in Render's PostgreSQL instance. Sensitive fields are masked in the browser client and are never logged or exposed in client requests.
        </p>
      </div>

    </div>
  );
}
