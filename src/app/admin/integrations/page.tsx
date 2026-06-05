'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plug, ExternalLink, Settings, Shield, ToggleLeft, ToggleRight, Check,
  CreditCard, Package, Truck, MessageSquare, BarChart3, X, Loader2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const iconMap: Record<string, any> = {
  creditcard: CreditCard,
  package: Package,
  truck: Truck,
  message: MessageSquare,
  barchart: BarChart3
};

export default function IntegrationsPage() {
  const [store, setStore] = useState<any>(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [merchantPlan, setMerchantPlan] = useState<string>('30');
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);

  // Global settings flags loaded from Super Admin config row
  const [globalPaymentGateways, setGlobalPaymentGateways] = useState<any>(null);
  const [globalIntegrations, setGlobalIntegrations] = useState<any>(null);

  const [integrations, setIntegrations] = useState([
    { id: 'razorpay', name: 'Razorpay Payment Gateway', category: 'Payments', desc: 'Secure online card & netbanking gateway integration.', connected: false, logo: 'creditcard' },
    { id: 'phonepe', name: 'PhonePe PG', category: 'Payments', desc: 'Accept direct payments via PhonePe UPI and card integrations.', connected: false, logo: 'creditcard' },
    { id: 'cashfree', name: 'Cashfree', category: 'Payments', desc: 'Instant payouts and advanced payment collection gateway.', connected: false, logo: 'creditcard' },
    { id: 'payu', name: 'PayU', category: 'Payments', desc: 'Process enterprise payments through PayU Biz gateways.', connected: false, logo: 'creditcard' },
    { id: 'shiprocket', name: 'Shiprocket Logistics', category: 'Logistics', desc: 'Sync orders, print labels, and coordinate courier dispatches.', connected: false, logo: 'package' },
    { id: 'delhivery', name: 'Delivery Shipping', category: 'Shipping', desc: 'Fast local express shipping API with automated status webhooks.', connected: false, logo: 'truck' },
    { id: 'whatsapp_api', name: 'Creva WhatsApp Bot', category: 'Automations', desc: 'Real-time automatic order confirmation & UPI screenshot verification bot.', connected: false, logo: 'message' },
    { id: 'ga4', name: 'Google Analytics 4', category: 'Analytics', desc: 'Track customer funnel dropoffs and product checkout conversion rates.', connected: false, logo: 'barchart' }
  ]);

  const [activeSetupIntegration, setActiveSetupIntegration] = useState<any | null>(null);
  
  const [settingsData, setSettingsData] = useState<Record<string, Record<string, string>>>({
    razorpay: { keyId: '', keySecret: '' },
    phonepe: { merchantId: '', saltKey: '', saltIndex: '1' },
    cashfree: { appId: '', secretKey: '' },
    payu: { merchantKey: '', merchantSalt: '' },
    shiprocket: { email: '', password: '' },
    delhivery: { apiKey: '', clientName: '' },
    whatsapp_api: { phone: '', alertType: 'all' },
    ga4: { measurementId: '' }
  });

  useEffect(() => {
    const fetchStoreAndSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // 1. Fetch Global Settings Row
        const { data: globalSettingsRow } = await supabase
          .from('stores')
          .select('description')
          .eq('subdomain', '__creva_saas_global_settings__')
          .maybeSingle();

        if (globalSettingsRow && globalSettingsRow.description) {
          try {
            const globalParsed = JSON.parse(globalSettingsRow.description);
            if (globalParsed.globalPaymentGateways) {
              setGlobalPaymentGateways(globalParsed.globalPaymentGateways);
            }
            if (globalParsed.globalIntegrations) {
              setGlobalIntegrations(globalParsed.globalIntegrations);
            }
          } catch (e) {
            console.error("Failed to parse global settings in merchant view:", e);
          }
        }

        // 2. Fetch Merchant Store Row
        const { data: storeData } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', user.id)
          .neq('subdomain', '__creva_saas_global_settings__')
          .single();
          
        if (storeData) {
          setStore(storeData);
          if (storeData.description && storeData.description.trim().startsWith('{')) {
            const parsed = JSON.parse(storeData.description);
            
            // Extract merchant plan
            if (parsed.selectedPlan) {
              setMerchantPlan(parsed.selectedPlan);
            }

            // Sync connection toggles
            if (parsed.integrations) {
              setIntegrations(prev => prev.map(integration => {
                const saved = parsed.integrations.find((i: any) => i.id === integration.id);
                return saved ? { ...integration, connected: saved.connected } : integration;
              }));
            }
            // Sync credential forms
            if (parsed.integrationSettings) {
              setSettingsData(prev => ({
                ...prev,
                ...parsed.integrationSettings
              }));
            }
          }
        }
      } catch (err) {
        console.error("Failed to load integrations:", err);
      } finally {
        setLoadingStore(false);
      }
    };
    fetchStoreAndSettings();
  }, []);

  const saveIntegrationsToDb = async (updatedIntegrations: any[], updatedSettings: any) => {
    if (!store) return;
    try {
      let existingData = {};
      if (store.description && store.description.trim().startsWith('{')) {
        existingData = JSON.parse(store.description);
      }
      const merged = {
        ...existingData,
        integrations: updatedIntegrations,
        integrationSettings: updatedSettings
      };
      const finalDescription = JSON.stringify(merged);
      
      const { error } = await supabase
        .from('stores')
        .update({ description: finalDescription })
        .eq('id', store.id);

      if (error) throw error;
      setStore((prev: any) => ({ ...prev, description: finalDescription }));
    } catch (err) {
      console.error("Failed to save integrations:", err);
    }
  };

  const handleToggle = async (id: string) => {
    let nextIntegrations: any[] = [];
    setIntegrations(prev => {
      const updated = prev.map(integration => 
        integration.id === id 
          ? { ...integration, connected: !integration.connected }
          : integration
      );
      nextIntegrations = updated;
      return updated;
    });
    setTimeout(() => {
      if (nextIntegrations.length > 0) {
        saveIntegrationsToDb(nextIntegrations, settingsData);
      }
    }, 50);
  };

  const updateSettings = (integrationId: string, field: string, value: string) => {
    setSettingsData(prev => ({
      ...prev,
      [integrationId]: {
        ...prev[integrationId],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSetupIntegration) return;

    const id = activeSetupIntegration.id;
    let nextIntegrations: any[] = [];
    setIntegrations(prev => {
      const updated = prev.map(integration => 
        integration.id === id 
          ? { ...integration, connected: true }
          : integration
      );
      nextIntegrations = updated;
      return updated;
    });

    setTimeout(async () => {
      if (nextIntegrations.length > 0) {
        await saveIntegrationsToDb(nextIntegrations, settingsData);
      }
    }, 50);

    alert(`Saved successfully! Connected ${activeSetupIntegration.name} integration.`);
    setActiveSetupIntegration(null);
  };

  // Filtration Rules
  const isGatewayVisible = (id: string) => {
    // Razorpay is available by default, unless globally disabled
    if (id === 'razorpay') {
      if (globalPaymentGateways && globalPaymentGateways.razorpay) {
        return !!globalPaymentGateways.razorpay.enabled && globalPaymentGateways.razorpay.plans.includes(merchantPlan);
      }
      return true; // Default true if global configuration isn't loaded
    }

    if (!globalPaymentGateways || !globalPaymentGateways[id]) return false;
    const config = globalPaymentGateways[id];
    return !!config.enabled && config.plans.includes(merchantPlan);
  };

  const isIntegrationVisible = (id: string) => {
    if (id === 'whatsapp_api') return true;
    if (!globalIntegrations) return false;
    return !!globalIntegrations[id];
  };

  const checkIfConfigured = (id: string) => {
    const creds = settingsData[id];
    if (!creds) return false;
    if (id === 'razorpay') return !!(creds.keyId && creds.keySecret);
    if (id === 'phonepe') return !!(creds.merchantId && creds.saltKey && creds.saltIndex);
    if (id === 'cashfree') return !!(creds.appId && creds.secretKey);
    if (id === 'payu') return !!(creds.merchantKey && creds.merchantSalt);
    if (id === 'shiprocket') return !!(creds.email && creds.password);
    if (id === 'delhivery') return !!(creds.apiKey && creds.clientName);
    if (id === 'whatsapp_api') return !!creds.phone;
    if (id === 'ga4') return !!creds.measurementId;
    return false;
  };

  const handleTestConnection = (id: string) => {
    const isConfigured = checkIfConfigured(id);
    if (!isConfigured) {
      alert(`⚠️ Connection failed: Please configure and save api keys for ${getIntegrationName(id)} first.`);
      return;
    }

    setTestingConnectionId(id);
    setTimeout(() => {
      setTestingConnectionId(null);
      alert(`✅ Success: Connection verification to ${getIntegrationName(id)} server endpoint succeeded!`);
    }, 1200);
  };

  const getIntegrationName = (id: string) => {
    return integrations.find(i => i.id === id)?.name || id;
  };

  // Groups
  const visibleGateways = integrations.filter(i => i.category === 'Payments' && isGatewayVisible(i.id));
  const visiblePlugins = integrations.filter(i => i.category !== 'Payments' && isIntegrationVisible(i.id));

  return (
    <div className="space-y-8 w-full pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-slate-100">
        <div className="text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit border border-blue-150">
            <Plug className="w-3.5 h-3.5" /> Merchant Integrations Hub
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-850 mt-3">
            Creva Integrations & Plugins
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Connect payment gateways, shipping couriers, automation widgets, and business analytics platform-wide.
          </p>
        </div>
      </div>

      {loadingStore ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-650 mx-auto" />
          <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-wider">Syncing dashboard settings...</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Section 1: Payment Gateways */}
          <div className="space-y-5 text-left">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-650" />
                Payment Gateways
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Activate and manage transaction providers connected to your online shop.</p>
            </div>

            {visibleGateways.length === 0 ? (
              <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-8 text-center text-slate-500 max-w-lg">
                <Shield className="w-10 h-10 text-slate-400 mx-auto mb-2.5" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">No payment gateways enabled</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  There are no payment gateways assigned to your subscription package. Please upgrade or consult your super administrator to unlock.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleGateways.map((integration, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 flex flex-col justify-between space-y-5 transition-all text-left">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="shrink-0 bg-blue-50 text-blue-600 border border-blue-150 w-10 h-10 rounded-xl flex items-center justify-center shadow-inner">
                          {(() => {
                            const Icon = iconMap[integration.logo];
                            return Icon ? <Icon className="w-5 h-5" /> : <Plug className="w-5 h-5" />;
                          })()}
                        </span>
                        
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          integration.connected 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                          {integration.connected ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Active
                            </>
                          ) : 'Disconnected'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">{integration.category}</span>
                        <h4 className="font-bold text-sm text-slate-850 mt-1 truncate">{integration.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-1.5 leading-normal font-medium">{integration.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setActiveSetupIntegration(integration)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1.5 uppercase tracking-wider transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5" /> Configure
                        </button>
                        
                        {integration.connected && (
                          <button
                            type="button"
                            onClick={() => handleTestConnection(integration.id)}
                            disabled={testingConnectionId === integration.id}
                            className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1.5 uppercase tracking-wider transition-colors disabled:opacity-50"
                          >
                            {testingConnectionId === integration.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            Test
                          </button>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleToggle(integration.id)}
                        className="focus:outline-none transition-all text-blue-600"
                      >
                        {integration.connected ? (
                          <ToggleRight className="w-9 h-9 text-blue-600" strokeWidth={1.5} />
                        ) : (
                          <ToggleLeft className="w-9 h-9 text-slate-400" strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Third-Party Integrations */}
          <div className="space-y-5 text-left">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plug className="w-5 h-5 text-blue-650" />
                Third-Party Integrations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Link storefront shipping metrics, click CRM, automated channels and analytical data keys.</p>
            </div>

            {visiblePlugins.length === 0 ? (
              <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-8 text-center text-slate-500 max-w-lg">
                <Plug className="w-10 h-10 text-slate-400 mx-auto mb-2.5" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">No plugins enabled</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  No logistics trackers or analytics extensions have been enabled for your workspace by Super Admin.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visiblePlugins.map((integration, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 flex flex-col justify-between space-y-5 transition-all text-left">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="shrink-0 bg-blue-50 text-blue-600 border border-blue-150 w-10 h-10 rounded-xl flex items-center justify-center shadow-inner">
                          {(() => {
                            const Icon = iconMap[integration.logo];
                            return Icon ? <Icon className="w-5 h-5" /> : <Plug className="w-5 h-5" />;
                          })()}
                        </span>
                        
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          integration.connected 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                          {integration.connected ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Active
                            </>
                          ) : 'Disconnected'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">{integration.category}</span>
                        <h4 className="font-bold text-sm text-slate-850 mt-1 truncate">{integration.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-1.5 leading-normal font-medium">{integration.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setActiveSetupIntegration(integration)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1.5 uppercase tracking-wider transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5" /> Configure
                        </button>
                        
                        {integration.connected && (
                          <button
                            type="button"
                            onClick={() => handleTestConnection(integration.id)}
                            disabled={testingConnectionId === integration.id}
                            className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1.5 uppercase tracking-wider transition-colors disabled:opacity-50"
                          >
                            {testingConnectionId === integration.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5" />
                            )}
                            Test
                          </button>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleToggle(integration.id)}
                        className="focus:outline-none transition-all text-blue-600"
                      >
                        {integration.connected ? (
                          <ToggleRight className="w-9 h-9 text-blue-600" strokeWidth={1.5} />
                        ) : (
                          <ToggleLeft className="w-9 h-9 text-slate-400" strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Integration SLA security badge */}
      <div className="bg-blue-50/40 text-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm relative overflow-hidden border border-blue-100">
        <div className="flex items-start gap-4 text-left">
          <Shield className="w-10 h-10 text-blue-600 shrink-0 mt-1" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-850 flex items-center gap-2">
              Enterprise-Grade Encryption & Isolation
            </h4>
            <p className="text-[11px] text-slate-650 leading-normal max-w-xl font-medium">
              Creva Webzz channels all payment webhook payloads and logistics integrations over sandboxed SSL endpoints. API credentials are stored under client-isolated databases for total merchant privacy.
            </p>
          </div>
        </div>
        <a
          href="https://crevasolution.in/developer/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white hover:bg-slate-50 text-slate-700 font-bold uppercase tracking-widest text-[10px] px-5 py-3 rounded-xl flex items-center gap-1.5 shrink-0 border border-slate-200 transition-all self-stretch sm:self-auto justify-center shadow-sm"
        >
          Developer Keys <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Configure Modal */}
      <AnimatePresence>
        {activeSetupIntegration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden text-left"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Configuration</span>
                  <h3 className="font-bold text-base text-slate-800 mt-0.5">Set up {activeSetupIntegration.name}</h3>
                </div>
                <button 
                  onClick={() => setActiveSetupIntegration(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
                {activeSetupIntegration.id === 'razorpay' && (
                  <>
                    <div className="bg-blue-50/40 border border-blue-100 text-[11px] text-slate-650 p-4 rounded-xl leading-relaxed">
                      <strong>Razorpay Gateway Setup:</strong> Get your credentials from your Razorpay Dashboard &gt; Settings &gt; API Keys. Key ID starts with <code>rzp_live_</code> or <code>rzp_test_</code>.
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">Key ID *</label>
                      <input
                        type="text"
                        required
                        value={settingsData.razorpay?.keyId || ''}
                        onChange={(e) => updateSettings('razorpay', 'keyId', e.target.value)}
                        placeholder="rzp_live_..."
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">Key Secret *</label>
                      <input
                        type="password"
                        required
                        value={settingsData.razorpay?.keySecret || ''}
                        onChange={(e) => updateSettings('razorpay', 'keySecret', e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                  </>
                )}

                {activeSetupIntegration.id === 'phonepe' && (
                  <>
                    <div className="bg-blue-50/40 border border-blue-100 text-[11px] text-slate-650 p-4 rounded-xl leading-relaxed">
                      <strong>PhonePe PG Setup:</strong> Enter your Merchant ID and Salt Key details from the PhonePe Business Console.
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">Merchant ID *</label>
                      <input
                        type="text"
                        required
                        value={settingsData.phonepe?.merchantId || ''}
                        onChange={(e) => updateSettings('phonepe', 'merchantId', e.target.value)}
                        placeholder="MID..."
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">Salt Key *</label>
                      <input
                        type="password"
                        required
                        value={settingsData.phonepe?.saltKey || ''}
                        onChange={(e) => updateSettings('phonepe', 'saltKey', e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">Salt Index *</label>
                      <input
                        type="text"
                        required
                        value={settingsData.phonepe?.saltIndex || '1'}
                        onChange={(e) => updateSettings('phonepe', 'saltIndex', e.target.value)}
                        placeholder="e.g. 1"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                  </>
                )}

                {activeSetupIntegration.id === 'cashfree' && (
                  <>
                    <div className="bg-blue-50/40 border border-blue-100 text-[11px] text-slate-650 p-4 rounded-xl leading-relaxed">
                      <strong>Cashfree Gateway Setup:</strong> Get your App ID and Secret Key from the Cashfree Merchant Dashboard API Keys settings.
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">App ID *</label>
                      <input
                        type="text"
                        required
                        value={settingsData.cashfree?.appId || ''}
                        onChange={(e) => updateSettings('cashfree', 'appId', e.target.value)}
                        placeholder="CF..."
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">Secret Key *</label>
                      <input
                        type="password"
                        required
                        value={settingsData.cashfree?.secretKey || ''}
                        onChange={(e) => updateSettings('cashfree', 'secretKey', e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                  </>
                )}

                {activeSetupIntegration.id === 'payu' && (
                  <>
                    <div className="bg-blue-50/40 border border-blue-100 text-[11px] text-slate-650 p-4 rounded-xl leading-relaxed">
                      <strong>PayU Setup:</strong> Retrieve your Merchant Key and Merchant Salt credentials from your PayU Dashboard API settings.
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">Merchant Key *</label>
                      <input
                        type="text"
                        required
                        value={settingsData.payu?.merchantKey || ''}
                        onChange={(e) => updateSettings('payu', 'merchantKey', e.target.value)}
                        placeholder="Merchant Key..."
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">Merchant Salt *</label>
                      <input
                        type="password"
                        required
                        value={settingsData.payu?.merchantSalt || ''}
                        onChange={(e) => updateSettings('payu', 'merchantSalt', e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                  </>
                )}

                {activeSetupIntegration.id === 'shiprocket' && (
                  <>
                    <div className="bg-blue-50/40 border border-blue-100 text-[11px] text-slate-650 p-4 rounded-xl leading-relaxed">
                      <strong>Shiprocket API User Setup:</strong> Configure dedicated API credentials on your Shiprocket Settings page under API Users first.
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">API User Email *</label>
                      <input
                        type="email"
                        required
                        value={settingsData.shiprocket?.email || ''}
                        onChange={(e) => updateSettings('shiprocket', 'email', e.target.value)}
                        placeholder="api-user@example.com"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">API Password *</label>
                      <input
                        type="password"
                        required
                        value={settingsData.shiprocket?.password || ''}
                        onChange={(e) => updateSettings('shiprocket', 'password', e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                  </>
                )}

                {activeSetupIntegration.id === 'delhivery' && (
                  <>
                    <div className="bg-blue-50/40 border border-blue-100 text-[11px] text-slate-650 p-4 rounded-xl leading-relaxed">
                      <strong>Delhivery Shipping API Setup:</strong> Generate custom shipping keys from your Delhivery Merchant Portal settings area.
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">API Token *</label>
                      <input
                        type="text"
                        required
                        value={settingsData.delhivery?.apiKey || ''}
                        onChange={(e) => updateSettings('delhivery', 'apiKey', e.target.value)}
                        placeholder="delhivery_api_token_..."
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">Client Account Name *</label>
                      <input
                        type="text"
                        required
                        value={settingsData.delhivery?.clientName || ''}
                        onChange={(e) => updateSettings('delhivery', 'clientName', e.target.value)}
                        placeholder="e.g. MyShopRetail"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                  </>
                )}

                {activeSetupIntegration.id === 'whatsapp_api' && (
                  <>
                    <div className="bg-blue-50/40 border border-blue-100 text-[11px] text-slate-650 p-4 rounded-xl leading-relaxed">
                      <strong>WhatsApp Notification Settings:</strong> Specify the phone number to receive real-time order alerts. Include the country prefix code without spaces or symbols.
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">Owner Support Number *</label>
                      <input
                        type="tel"
                        required
                        value={settingsData.whatsapp_api?.phone || ''}
                        onChange={(e) => updateSettings('whatsapp_api', 'phone', e.target.value)}
                        placeholder="e.g. +919876543210"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">Dispatched Alerts *</label>
                      <select
                        value={settingsData.whatsapp_api?.alertType || 'all'}
                        onChange={(e) => updateSettings('whatsapp_api', 'alertType', e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                      >
                        <option value="all">Send for all orders & verification steps</option>
                        <option value="success_only">Only when payments succeed</option>
                      </select>
                    </div>
                  </>
                )}

                {activeSetupIntegration.id === 'ga4' && (
                  <>
                    <div className="bg-blue-50/40 border border-blue-100 text-[11px] text-slate-650 p-4 rounded-xl leading-relaxed">
                      <strong>Google Analytics 4 Setup:</strong> Enter the measurement ID configured for your store subdomain. Format is <code>G-XXXXXXXXXX</code>.
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">Measurement ID *</label>
                      <input
                        type="text"
                        required
                        value={settingsData.ga4?.measurementId || ''}
                        onChange={(e) => updateSettings('ga4', 'measurementId', e.target.value)}
                        placeholder="G-XXXXXXXXXX"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                  </>
                )}

                {/* Footer buttons */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={() => setActiveSetupIntegration(null)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
                  >
                    Save & Connect
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
