'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plug, Settings, Check, CreditCard, Package, Truck,
  MessageSquare, BarChart3, X, Loader2, ToggleLeft, ToggleRight, Shield, Sparkles
} from 'lucide-react';

interface Integration {
  id: string;
  store_id: string;
  type: string;
  is_enabled: boolean;
  config: Record<string, string>;
  created_at: string;
}

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'password' | 'email';
  placeholder?: string;
  hint?: string;
}

interface CatalogItem {
  type: string;
  name: string;
  category: string;
  desc: string;
  icon: React.ElementType;
  fields: FieldDef[];
}

const CATALOG: CatalogItem[] = [
  {
    type: 'meta_ai',
    name: 'Meta AI (Llama)',
    category: 'AI Tools',
    desc: 'Power your AI Content Studio with Meta Llama-3 models for free.',
    icon: Sparkles,
    fields: [
      { key: 'api_key', label: 'Groq Cloud API Key', type: 'password', placeholder: 'gsk_...', hint: 'Get your 100% Free API Key from console.groq.com (No card required)' },
    ],
  },
  {
    type: 'razorpay',
    name: 'Razorpay',
    category: 'Payments',
    desc: 'Accept cards, UPI, and netbanking payments securely.',
    icon: CreditCard,
    fields: [
      { key: 'key_id', label: 'Key ID', type: 'text', placeholder: 'rzp_live_...', hint: 'From Razorpay Dashboard → Settings → API Keys' },
      { key: 'key_secret', label: 'Key Secret', type: 'password', placeholder: '••••••••••••' },
    ],
  },
  {
    type: 'phonepe',
    name: 'PhonePe',
    category: 'Payments',
    desc: 'Accept PhonePe UPI and card payments.',
    icon: CreditCard,
    fields: [
      { key: 'merchant_id', label: 'Merchant ID', type: 'text', placeholder: 'MID...' },
      { key: 'salt_key', label: 'Salt Key', type: 'password', placeholder: '••••••••••••' },
      { key: 'salt_index', label: 'Salt Index', type: 'text', placeholder: '1' },
    ],
  },
  {
    type: 'cashfree',
    name: 'Cashfree',
    category: 'Payments',
    desc: 'Instant payouts and advanced payment collection.',
    icon: CreditCard,
    fields: [
      { key: 'app_id', label: 'App ID', type: 'text', placeholder: 'CF...' },
      { key: 'secret_key', label: 'Secret Key', type: 'password', placeholder: '••••••••••••' },
    ],
  },
  {
    type: 'payu',
    name: 'PayU',
    category: 'Payments',
    desc: 'Process enterprise payments through PayU Biz.',
    icon: CreditCard,
    fields: [
      { key: 'merchant_key', label: 'Merchant Key', type: 'text', placeholder: 'Merchant Key...' },
      { key: 'merchant_salt', label: 'Merchant Salt', type: 'password', placeholder: '••••••••••••' },
    ],
  },
];

const CATEGORIES = ['Payments', 'AI Tools'];

export default function IntegrationsPage() {
  const [store, setStore] = useState<any>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingType, setTogglingType] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<CatalogItem | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: storeData } = await supabase.from('stores').select('*').eq('owner_id', user.id).maybeSingle();
      if (!storeData) return;
      setStore(storeData);
      const { data } = await supabase.from('integrations').select('*').eq('store_id', storeData.id);
      setIntegrations(data || []);
    } finally {
      setLoading(false);
    }
  };

  const getIntegration = (type: string) => integrations.find(i => i.type === type);

  const isEnabled = (type: string) => getIntegration(type)?.is_enabled ?? false;
  const isConfigured = (type: string) => {
    const existing = getIntegration(type);
    if (!existing?.config) return false;
    const catalog = CATALOG.find(c => c.type === type);
    return catalog?.fields.every(f => !!existing.config[f.key]) ?? false;
  };

  const openConfigure = (item: CatalogItem) => {
    const existing = getIntegration(item.type);
    const defaults: Record<string, string> = {};
    item.fields.forEach(f => { defaults[f.key] = existing?.config?.[f.key] || ''; });
    setConfigForm(defaults);
    setMessage('');
    setActiveItem(item);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    setSaving(true);
    setMessage('');
    try {
      const { error } = await supabase.from('integrations').insert([{
        store_id: store.id,
        type: activeItem.type,
        is_enabled: true,
        config: configForm,
      }]);
      if (error) throw error;
      setActiveItem(null);
      await fetchData();
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (type: string) => {
    const existing = getIntegration(type);
    setTogglingType(type);
    try {
      if (existing) {
        const { error } = await supabase.from('integrations').update({ is_enabled: !existing.is_enabled }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('integrations').insert([{
          store_id: store.id,
          type,
          is_enabled: true,
          config: {},
        }]);
        if (error) throw error;
      }
      await fetchData();
    } catch (e: any) {
      setMessage('Failed to toggle: ' + e.message);
    } finally {
      setTogglingType(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mb-2">
          <Plug className="w-3.5 h-3.5" /> Integrations Hub
        </span>
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Plug className="w-6 h-6 text-primary" />
          Integrations & Plugins
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Connect payment gateways, shipping couriers, and analytics to your store.</p>
      </div>

      {message && (
        <div className={`text-sm px-4 py-3 rounded-xl border font-medium ${message.startsWith('Error') || message.startsWith('Failed') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {message}
        </div>
      )}

      {CATEGORIES.map(category => {
        const items = CATALOG.filter(c => c.category === category);
        return (
          <div key={category} className="space-y-4">
            <h3 className="text-base font-black text-foreground border-b border-border pb-2">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(item => {
                const enabled = isEnabled(item.type);
                const configured = isConfigured(item.type);
                const toggling = togglingType === item.type;
                const Icon = item.icon;
                return (
                  <div
                    key={item.type}
                    className={`bg-background border rounded-2xl p-5 flex flex-col gap-4 transition-all ${enabled ? 'border-primary/30 shadow-sm shadow-primary/5' : 'border-border'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        enabled
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : configured
                            ? 'bg-muted text-muted-foreground border-border'
                            : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {enabled ? 'Active' : configured ? 'Configured' : 'Not connected'}
                      </span>
                    </div>

                    <div className="flex-1">
                      <p className="font-bold text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <button
                        onClick={() => openConfigure(item)}
                        className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        {configured ? 'Update keys' : 'Configure'}
                      </button>
                      <button
                        onClick={() => handleToggle(item.type)}
                        disabled={toggling || (!configured && !enabled)}
                        className="focus:outline-none disabled:opacity-40 transition-all"
                        title={!configured && !enabled ? 'Configure credentials first' : enabled ? 'Disable' : 'Enable'}
                      >
                        {toggling ? (
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        ) : enabled ? (
                          <ToggleRight className="w-9 h-9 text-primary" strokeWidth={1.5} />
                        ) : (
                          <ToggleLeft className="w-9 h-9 text-muted-foreground" strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex items-start gap-3 bg-muted/30 border border-border rounded-2xl p-4">
        <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          API credentials are stored encrypted and never exposed in your storefront code. Only enable integrations you actively use.
        </p>
      </div>

      {activeItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Configuration</p>
                <h3 className="font-black text-base mt-0.5">Set up {activeItem.name}</h3>
              </div>
              <button onClick={() => setActiveItem(null)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
              {activeItem.fields.map(field => (
                <div key={field.key}>
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">{field.label} *</label>
                  <input
                    type={field.type}
                    required
                    value={configForm[field.key] || ''}
                    onChange={e => setConfigForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background"
                  />
                  {field.hint && <p className="text-[10px] text-muted-foreground mt-1">{field.hint}</p>}
                </div>
              ))}

              {message && <p className={`text-xs font-medium ${message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>{message}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="flex-1 border border-border rounded-xl py-2.5 text-sm font-bold hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
