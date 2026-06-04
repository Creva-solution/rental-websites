'use client';

import { useState } from 'react';
import { 
  Plug, ExternalLink, Settings, Shield, ToggleLeft, ToggleRight, Check,
  CreditCard, Package, Truck, MessageSquare, BarChart3, X
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
  const [integrations, setIntegrations] = useState([
    { id: 'razorpay', name: 'Razorpay PG', category: 'Payments', desc: 'Secure online card & netbanking gateway integration.', connected: true, logo: 'creditcard' },
    { id: 'shiprocket', name: 'Shiprocket logistics', category: 'Shipping', desc: 'Sync orders, print labels, and coordinate automatic courier dispatches.', connected: true, logo: 'package' },
    { id: 'delhivery', name: 'Delhivery Shipping', category: 'Shipping', desc: 'Fast local express shipping API with automated status webhooks.', connected: false, logo: 'truck' },
    { id: 'whatsapp_api', name: 'Creva WhatsApp Bot', category: 'Automations', desc: 'Real-time automatic order confirmation & UPI screenshot verification bot.', connected: true, logo: 'message' },
    { id: 'ga4', name: 'Google Analytics 4', category: 'Analytics', desc: 'Track customer funnel dropoffs and product checkout conversion rates.', connected: false, logo: 'barchart' }
  ]);

  const [activeSetupIntegration, setActiveSetupIntegration] = useState<any | null>(null);
  
  const [settingsData, setSettingsData] = useState<Record<string, Record<string, string>>>({
    razorpay: { keyId: 'rzp_live_8f0a2839d', keySecret: '••••••••••••' },
    shiprocket: { email: 'creva-shipping@solution.com', password: '••••••••••••' },
    delhivery: { apiKey: '', clientName: '' },
    whatsapp_api: { phone: '+918489371766', alertType: 'all' },
    ga4: { measurementId: '' }
  });

  const handleToggle = (id: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === id 
        ? { ...integration, connected: !integration.connected }
        : integration
    ));
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

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSetupIntegration) return;

    // Simulate saving settings and auto-connecting
    const id = activeSetupIntegration.id;
    setIntegrations(prev => prev.map(integration => 
      integration.id === id 
        ? { ...integration, connected: true }
        : integration
    ));

    alert(`Saved successfully! Connected ${activeSetupIntegration.name} integration.`);
    setActiveSetupIntegration(null);
  };

  return (
    <div className="space-y-8 w-full pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-slate-100">
        <div className="text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit border border-blue-150">
            <Plug className="w-3.5 h-3.5" /> Core Integrations Store
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-850 mt-3">
            Creva Integrations & Plugins
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Connect third-party payment gateways, direct express delivery couriers, and automated customer bots.
          </p>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 flex flex-col justify-between space-y-5 transition-all text-left">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="shrink-0 bg-blue-50 text-blue-600 border border-blue-150 w-10 h-10 rounded-xl flex items-center justify-center shadow-inner">
                  {(() => {
                    const Icon = iconMap[integration.logo];
                    return Icon ? <Icon className="w-5 h-5" /> : <Plug className="w-5 h-5" />;
                  })()}
                </span>
                
                {/* Connection Badge */}
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
              <button
                type="button"
                onClick={() => setActiveSetupIntegration(integration)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1.5 uppercase tracking-wider"
              >
                <Settings className="w-3.5 h-3.5" /> Configure
              </button>
              
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
                        value={settingsData.razorpay.keyId}
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
                        value={settingsData.razorpay.keySecret}
                        onChange={(e) => updateSettings('razorpay', 'keySecret', e.target.value)}
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
                        value={settingsData.shiprocket.email}
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
                        value={settingsData.shiprocket.password}
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
                        value={settingsData.delhivery.apiKey}
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
                        value={settingsData.delhivery.clientName}
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
                        value={settingsData.whatsapp_api.phone}
                        onChange={(e) => updateSettings('whatsapp_api', 'phone', e.target.value)}
                        placeholder="e.g. +919876543210"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider">Dispatched Alerts *</label>
                      <select
                        value={settingsData.whatsapp_api.alertType}
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
                        value={settingsData.ga4.measurementId}
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
