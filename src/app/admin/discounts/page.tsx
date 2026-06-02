'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Tag, Trash2, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase: number;
  isActive: boolean;
}

export default function DiscountsPage() {
  const [store, setStore] = useState<any>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Coupon States
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState(10);
  const [minPurchase, setMinPurchase] = useState(0);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .neq('subdomain', '__creva_saas_global_settings__')
        .single();

      if (storeData) {
        setStore(storeData);
        
        // Extract coupons from store description metadata
        try {
          if (storeData.description && storeData.description.startsWith('{')) {
            const parsed = JSON.parse(storeData.description);
            if (parsed.discountCoupons && Array.isArray(parsed.discountCoupons)) {
              setCoupons(parsed.discountCoupons);
            }
          }
        } catch (e) {
          console.warn("Failed to parse coupons list from store description:", e);
        }
      }
    } catch (err) {
      console.error("Failed to load discount settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const persistCoupons = async (updatedCoupons: Coupon[]) => {
    setSaving(true);
    try {
      setCoupons(updatedCoupons);

      let currentDesc = {};
      try {
        if (store.description && store.description.startsWith('{')) {
          currentDesc = JSON.parse(store.description);
        }
      } catch (e) {}

      const updatedDesc = {
        ...currentDesc,
        discountCoupons: updatedCoupons
      };

      const { error } = await supabase
        .from('stores')
        .update({ description: JSON.stringify(updatedDesc) })
        .eq('id', store.id);

      if (error) throw error;
      setStore({ ...store, description: JSON.stringify(updatedDesc) });
    } catch (err: any) {
      console.error(err);
      alert("Failed to save coupon: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = code.toUpperCase().replace(/\s+/g, '').trim();
    if (!formattedCode) return;

    if (coupons.some(c => c.code === formattedCode)) {
      alert("⚠️ A coupon with this code already exists!");
      return;
    }

    const newCoupon: Coupon = {
      code: formattedCode,
      type,
      value: Number(value),
      minPurchase: Number(minPurchase),
      isActive: true
    };

    const updated = [...coupons, newCoupon];
    await persistCoupons(updated);

    // Reset fields
    setCode('');
    setValue(10);
    setMinPurchase(0);
    alert(`🎉 Coupon "${formattedCode}" created successfully!`);
  };

  const handleDeleteCoupon = async (couponCode: string) => {
    if (!confirm(`Are you sure you want to delete coupon code "${couponCode}"?`)) return;
    const updated = coupons.filter(c => c.code !== couponCode);
    await persistCoupons(updated);
  };

  const handleToggleCoupon = async (couponCode: string) => {
    const updated = coupons.map(c => 
      c.code === couponCode ? { ...c, isActive: !c.isActive } : c
    );
    await persistCoupons(updated);
  };

  const currencySymbol = store?.currency === 'USD' ? '$' : '₹';

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-border/40">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Promotion Center
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-3">
            🏷️ Discounts & Coupons
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure custom discount coupon codes to let customers apply them in their cart checkouts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Create Coupon Card */}
        <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border/50 shadow-md space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b pb-3">
            <Tag className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Create Coupon</h3>
          </div>

          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Coupon Code</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. SOAPLOVE20"
                className="w-full h-10 px-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none text-xs font-mono uppercase"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Discount Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none text-xs"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ({currencySymbol})</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Discount Value</label>
              <input
                type="number"
                value={value}
                onChange={e => setValue(Number(e.target.value))}
                min={0}
                max={type === 'percentage' ? 100 : 100000}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Minimum Purchase ({currencySymbol})</label>
              <input
                type="number"
                value={minPurchase}
                onChange={e => setMinPurchase(Number(e.target.value))}
                min={0}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none text-xs"
              />
              <span className="text-[10px] text-muted-foreground block">Optional threshold to unlock discount.</span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Create Discount Code
            </button>
          </form>
        </div>

        {/* Right: Active Coupons Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                Active Promotions
              </h3>
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-black font-mono">
                {coupons.length} Active Codes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coupons.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-muted-foreground text-xs italic">
                  No promotional coupon codes created yet. Create one to drive conversions!
                </div>
              ) : (
                coupons.map((c, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 relative shadow-sm ${
                      c.isActive 
                        ? 'bg-amber-50/10 border-amber-500/20' 
                        : 'bg-muted/30 border-border/60 opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-xl text-xs font-black tracking-widest font-mono">
                          {c.code}
                        </span>
                        <h4 className="font-black text-sm text-foreground mt-2">
                          {c.type === 'percentage' ? `${c.value}% Off` : `${currencySymbol}${c.value} Off`}
                        </h4>
                        {c.minPurchase > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Min. purchase: {currencySymbol}{c.minPurchase}</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleCoupon(c.code)}
                        className="text-muted-foreground hover:text-foreground transition-all"
                        title={c.isActive ? 'Deactivate coupon' : 'Activate coupon'}
                      >
                        {c.isActive ? (
                          <ToggleRight className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                        )}
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-border/50">
                      <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                        Status: {c.isActive ? 'Active' : 'Paused'}
                      </span>
                      <button
                        onClick={() => handleDeleteCoupon(c.code)}
                        disabled={saving}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        title="Delete coupon code"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
