'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Tag, Trash2, Edit, X, Check, Percent, IndianRupee } from 'lucide-react';

interface Discount {
  id: string;
  store_id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimum_order: number;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const emptyForm = {
  code: '',
  type: 'percentage' as 'percentage' | 'fixed',
  value: '',
  minimum_order: '',
  max_uses: '',
  is_active: true,
  expires_at: '',
};

export default function DiscountsPage() {
  const [store, setStore] = useState<any>(null);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: storeData } = await supabase.from('stores').select('*').eq('owner_id', user.id).maybeSingle();
      if (!storeData) return;
      setStore(storeData);
      const { data } = await supabase.from('discounts').select('*').eq('store_id', storeData.id).order('created_at', { ascending: false });
      setDiscounts(data || []);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingDiscount(null);
    setForm(emptyForm);
    setMessage('');
    setShowModal(true);
  };

  const openEdit = (d: Discount) => {
    setEditingDiscount(d);
    setForm({
      code: d.code,
      type: d.type,
      value: String(d.value),
      minimum_order: d.minimum_order ? String(d.minimum_order) : '',
      max_uses: d.max_uses ? String(d.max_uses) : '',
      is_active: d.is_active,
      expires_at: d.expires_at ? d.expires_at.split('T')[0] : '',
    });
    setMessage('');
    setShowModal(true);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setForm(f => ({ ...f, code }));
  };

  const handleSave = async () => {
    if (!form.code.trim()) { setMessage('Coupon code is required.'); return; }
    if (!form.value || parseFloat(form.value) <= 0) { setMessage('Discount value must be greater than 0.'); return; }
    if (form.type === 'percentage' && parseFloat(form.value) > 100) { setMessage('Percentage discount cannot exceed 100%.'); return; }

    setSaving(true);
    setMessage('');
    try {
      const payload: any = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        minimum_order: parseFloat(form.minimum_order) || 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        is_active: form.is_active,
        expires_at: form.expires_at || null,
      };

      if (editingDiscount) {
        const { error } = await supabase.from('discounts').update(payload).eq('id', editingDiscount.id);
        if (error) throw error;
        setMessage('Coupon updated successfully.');
      } else {
        const { error } = await supabase.from('discounts').insert([{ ...payload, store_id: store.id }]);
        if (error) throw error;
        setMessage('Coupon created successfully.');
      }
      setShowModal(false);
      await fetchData();
    } catch (e: any) {
      setMessage('Error: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon permanently?')) return;
    try {
      await supabase.from('discounts').delete().eq('id', id);
      await fetchData();
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    }
  };

  const toggleActive = async (d: Discount) => {
    await supabase.from('discounts').update({ is_active: !d.is_active }).eq('id', d.id);
    await fetchData();
  };

  const isExpired = (d: Discount) => d.expires_at && new Date(d.expires_at) < new Date();
  const isMaxed = (d: Discount) => d.max_uses !== null && d.uses_count >= d.max_uses;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-primary" />
            Offers & Coupons
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Create discount codes for your customers at checkout.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          New Coupon
        </button>
      </div>

      {message && !showModal && (
        <div className={`text-sm px-4 py-3 rounded-xl border font-medium ${message.startsWith('Error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {message}
        </div>
      )}

      {discounts.length === 0 ? (
        <div className="bg-muted/30 border border-border rounded-2xl p-12 text-center">
          <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="font-bold text-lg mb-2">No coupons yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Create discount codes to boost sales and reward customers.</p>
          <button onClick={openCreate} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create First Coupon
          </button>
        </div>
      ) : (
        <div className="bg-background border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {discounts.map((d) => {
            const expired = isExpired(d);
            const maxed = isMaxed(d);
            const inactive = !d.is_active || expired || maxed;
            return (
              <div key={d.id} className={`flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors ${inactive ? 'opacity-60' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${d.type === 'percentage' ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {d.type === 'percentage' ? <Percent className="w-5 h-5 text-blue-600" /> : <IndianRupee className="w-5 h-5 text-green-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm font-mono bg-muted px-2 py-0.5 rounded-lg border border-border">{d.code}</span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {d.type === 'percentage' ? `${d.value}% off` : `₹${d.value} off`}
                      {d.minimum_order > 0 ? ` · min ₹${d.minimum_order}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-muted-foreground">Used {d.uses_count}{d.max_uses ? `/${d.max_uses}` : ''} times</span>
                    {expired && <span className="text-[10px] text-red-600 font-bold">Expired</span>}
                    {maxed && <span className="text-[10px] text-orange-600 font-bold">Limit reached</span>}
                    {d.expires_at && !expired && <span className="text-[10px] text-muted-foreground">Expires {new Date(d.expires_at).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(d)}
                    className={`text-xs px-3 py-1 rounded-full font-bold border transition-colors ${
                      d.is_active && !expired && !maxed
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {d.is_active && !expired && !maxed ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => openEdit(d)} className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(d.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-lg">{editingDiscount ? 'Edit Coupon' : 'New Coupon'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-4">
              {/* Code */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Coupon Code *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="SUMMER20"
                    maxLength={30}
                    className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background"
                  />
                  <button onClick={generateCode} className="px-3 py-2 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors flex-shrink-0">
                    Generate
                  </button>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Discount Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['percentage', 'fixed'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                        form.type === t ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {t === 'percentage' ? <Percent className="w-4 h-4" /> : <IndianRupee className="w-4 h-4" />}
                      {t === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Discount Value * {form.type === 'percentage' ? '(%)' : '(₹)'}
                </label>
                <input
                  type="number"
                  min={0}
                  max={form.type === 'percentage' ? 100 : undefined}
                  step="0.01"
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === 'percentage' ? '20' : '100'}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background"
                />
              </div>

              {/* Min Order */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Minimum Order (₹)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.minimum_order}
                  onChange={e => setForm(f => ({ ...f, minimum_order: e.target.value }))}
                  placeholder="0 = no minimum"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background"
                />
              </div>

              {/* Max Uses */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Max Uses</label>
                <input
                  type="number"
                  min={1}
                  value={form.max_uses}
                  onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                  placeholder="Leave blank for unlimited"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background"
                />
              </div>

              {/* Expiry */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">Expiry Date</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Leave blank for no expiry.</p>
              </div>

              {/* Active */}
              <label className="flex items-center justify-between cursor-pointer bg-muted/30 rounded-xl px-4 py-3 border border-border">
                <div>
                  <p className="text-sm font-bold">Active</p>
                  <p className="text-xs text-muted-foreground">Inactive coupons cannot be redeemed</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.is_active ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </label>
            </div>

            {message && (
              <p className={`text-xs font-medium mt-4 ${message.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>{message}</p>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-bold hover:bg-muted transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Saving...' : editingDiscount ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
