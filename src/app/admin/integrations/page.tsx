'use client';

import { useState } from 'react';
import { 
  Plug, ExternalLink, Settings, Shield, ToggleLeft, ToggleRight, Check,
  CreditCard, Package, Truck, MessageSquare, BarChart3 
} from 'lucide-react';

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

  const handleToggle = (id: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === id 
        ? { ...integration, connected: !integration.connected }
        : integration
    ));
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-border/45">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#3C77C3] bg-[#3C77C3]/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Plug className="w-3.5 h-3.5" /> Core Integrations Store
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-3">
            Creva Integrations & Plugins
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect third-party payment gateways, direct express delivery couriers, and automated customer bots.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration, idx) => (
          <div key={idx} className="bg-card border rounded-2xl p-5 shadow-sm hover:border-[#3C77C3]/20 flex flex-col justify-between space-y-5 transition-all text-left">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="shrink-0 bg-[#3C77C3]/10 text-[#3C77C3] border border-[#3C77C3]/20 w-10 h-10 rounded-xl flex items-center justify-center shadow-inner">
                  {(() => {
                    const Icon = iconMap[integration.logo];
                    return Icon ? <Icon className="w-5 h-5" /> : <Plug className="w-5 h-5" />;
                  })()}
                </span>
                
                {/* Connection Badge */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  integration.connected 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}>
                  {integration.connected ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Active
                    </>
                  ) : 'Disconnected'}
                </span>
              </div>

              <div>
                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">{integration.category}</span>
                <h4 className="font-bold text-sm text-foreground mt-1 truncate">{integration.name}</h4>
                <p className="text-[10px] text-muted-foreground mt-1.5 leading-normal">{integration.desc}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <button
                type="button"
                className="text-[10px] font-bold text-[#3C77C3] hover:text-[#3C77C3]/80 flex items-center gap-1 uppercase tracking-wider"
              >
                <Settings className="w-3.5 h-3.5" /> Setup Setup
              </button>
              
              <button
                type="button"
                onClick={() => handleToggle(integration.id)}
                className="focus:outline-none transition-all text-[#3C77C3]"
              >
                {integration.connected ? (
                  <ToggleRight className="w-9 h-9 text-[#3C77C3]" strokeWidth={1.5} />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-muted-foreground" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Integration SLA security badge */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg relative overflow-hidden border border-slate-800">
        <div className="absolute w-72 h-72 bg-blue-500/5 rounded-full blur-3xl -translate-x-16 -translate-y-16 pointer-events-none" />
        <div className="flex items-start gap-4 text-left">
          <Shield className="w-10 h-10 text-[#3C77C3] shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              Enterprise-Grade Encryption & Isolation
            </h4>
            <p className="text-[11px] text-slate-400 leading-normal max-w-xl">
              Creva Websz channels all payment webhook payloads and logistics integrations over sandboxed SSL endpoints. API credentials are stored under client-isolated databases for total merchant privacy.
            </p>
          </div>
        </div>
        <a
          href="https://crevasolution.in/developer/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-800 hover:bg-slate-750 text-white font-bold uppercase tracking-widest text-[10px] px-5 py-3 rounded-xl flex items-center gap-1.5 shrink-0 border border-slate-700/80 transition-all self-stretch sm:self-auto justify-center"
        >
          Developer Keys <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
