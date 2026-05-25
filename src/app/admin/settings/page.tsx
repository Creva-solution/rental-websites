'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Globe, Save, Upload, Building, Phone, Mail, Palette } from 'lucide-react';

export default function SettingsPage() {
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    store_name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    address: '', // Mock field for now
    primary_color: '#3B82F6',
    subdomain: '',
    custom_domain: '', // Mock field for now
  });

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', user.id)
      .single();
      
    if (storeData) {
      setStore(storeData);
      
      let descText = storeData.description || '';
      try {
        if (storeData.description && storeData.description.startsWith('{')) {
          const parsed = JSON.parse(storeData.description);
          descText = parsed.description || '';
        }
      } catch (e) {
        console.error("Failed to parse description JSON:", e);
      }

      setFormData({
        store_name: storeData.store_name || '',
        description: descText,
        contact_email: storeData.contact_email || '',
        contact_phone: storeData.contact_phone || '',
        address: '', // Currently not in DB schema
        primary_color: storeData.primary_color || '#3B82F6',
        subdomain: storeData.subdomain || '',
        custom_domain: '', // Currently not in DB schema
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      let finalDescription = formData.description;
      try {
        let existingData = {};
        if (store.description && store.description.startsWith('{')) {
          existingData = JSON.parse(store.description);
        }
        const merged = {
          ...existingData,
          description: formData.description,
        };
        finalDescription = JSON.stringify(merged);
      } catch (e) {
        console.error("Failed to construct merged description JSON:", e);
      }

      // Update the fields that exist in the database schema
      const { error } = await supabase
        .from('stores')
        .update({
          store_name: formData.store_name,
          description: finalDescription,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          primary_color: formData.primary_color,
        })
        .eq('id', store.id);

      if (error) throw error;
      
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      setMessage('Error saving settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Store Settings</h2>
        <p className="text-muted-foreground">Manage your store's configuration and preferences.</p>
      </div>

      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
        {/* General Settings */}
        <div className="p-6 border-b border-border space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Building className="w-5 h-5 text-primary" /> General Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Store Name</label>
              <input 
                type="text" 
                value={formData.store_name} 
                onChange={e => setFormData({...formData, store_name: e.target.value})}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Store Address</label>
              <input 
                type="text" 
                placeholder="123 Store Street, City"
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Store Description</label>
              <textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 rounded-md border border-input bg-background min-h-[100px] focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact Settings */}
        <div className="p-6 border-b border-border space-y-6 bg-muted/10">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Support Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input 
                  type="email" 
                  value={formData.contact_email} 
                  onChange={e => setFormData({...formData, contact_email: e.target.value})}
                  className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input 
                  type="tel" 
                  value={formData.contact_phone} 
                  onChange={e => setFormData({...formData, contact_phone: e.target.value})}
                  className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Domain Settings */}
        <div className="p-6 space-y-6 bg-muted/10">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Domains</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">StoreBuilder Subdomain</label>
              <div className="flex items-center">
                <input 
                  type="text" 
                  value={formData.subdomain}
                  readOnly
                  className="w-full max-w-[200px] h-10 px-3 rounded-l-md border border-input bg-muted text-muted-foreground outline-none"
                />
                <div className="h-10 px-3 flex items-center bg-muted border-y border-r border-input rounded-r-md text-muted-foreground text-sm font-semibold">
                  .crevasolution.in
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Subdomains cannot be changed after creation.</p>
            </div>
            
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Custom Domain</label>
                  <p className="text-sm text-muted-foreground">Connect your own domain (e.g., mystore.com) to your storefront.</p>
                </div>
                <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-semibold border border-primary/20">Pro Feature</span>
              </div>
              <div className="mt-3 flex gap-3">
                <input 
                  type="text" 
                  placeholder="www.yourdomain.com"
                  value={formData.custom_domain}
                  onChange={e => setFormData({...formData, custom_domain: e.target.value})}
                  className="flex-1 max-w-sm h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
                />
                <button 
                  onClick={() => alert("Domain verification is only available in the Pro Plan.")}
                  className="px-4 py-2 bg-secondary text-secondary-foreground border border-input rounded-md font-medium hover:bg-secondary/80 transition-colors"
                >
                  Verify & Connect
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-background flex items-center justify-between">
          <div className="text-sm font-medium">
            {message && (
              <span className={message.includes('Error') ? 'text-red-500' : 'text-green-600 flex items-center gap-2'}>
                {message.includes('Error') ? null : <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                {message}
              </span>
            )}
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
