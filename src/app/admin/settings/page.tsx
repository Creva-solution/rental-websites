'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Globe, Save, Upload, Building, Phone, Mail, Palette, Check, X, ShieldAlert, ShieldCheck, Smartphone } from 'lucide-react';

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
    custom_domain: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    linkedin: '',
  });

  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [dnsStatus, setDnsStatus] = useState<any>(null);
  const [domainStatus, setDomainStatus] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const [customDomainNameInput, setCustomDomainNameInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'app'>('qr');

  useEffect(() => {
    fetchStore();
  }, []);

  const checkDomainStatus = async (domainName: string) => {
    if (!domainName) return;
    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/domains/status?domain=${encodeURIComponent(domainName)}`);
      if (res.ok) {
        const data = await res.json();
        setDomainStatus(data);
      }
    } catch (err) {
      console.error('Failed to check domain status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

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
      setCustomDomainNameInput(storeData.custom_domain || '');
      
      let descText = storeData.description || '';
      let facebookUrl = '';
      let instagramUrl = '';
      let twitterUrl = '';
      let youtubeUrl = '';
      let linkedinUrl = '';

      try {
        if (storeData.description && storeData.description.startsWith('{')) {
          const parsed = JSON.parse(storeData.description);
          descText = parsed.description || '';
          facebookUrl = parsed.facebook || '';
          instagramUrl = parsed.instagram || '';
          twitterUrl = parsed.twitter || '';
          youtubeUrl = parsed.youtube || '';
          linkedinUrl = parsed.linkedin || '';
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
        custom_domain: storeData.custom_domain || '',
        facebook: facebookUrl,
        instagram: instagramUrl,
        twitter: twitterUrl,
        youtube: youtubeUrl,
        linkedin: linkedinUrl,
      });

      if (storeData.custom_domain) {
        checkDomainStatus(storeData.custom_domain);
      }
    }

    // Fetch global SaaS settings
    try {
      const { data: globalData } = await supabase
        .from('stores')
        .select('description')
        .eq('subdomain', '__creva_saas_global_settings__')
        .maybeSingle();

      if (globalData && globalData.description) {
        setGlobalSettings(JSON.parse(globalData.description));
      }
    } catch (err) {
      console.error("Failed to fetch global settings:", err);
    }

    setLoading(false);
  };

  const handleDomainScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!customDomainNameInput.trim()) {
      alert("⚠️ Please enter your desired custom domain name first before uploading payment proof!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("⚠️ Screenshot is too large! Please choose a file under 5MB.");
      return;
    }

    setScreenshotUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `domain-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `payment-screenshots/${fileName}`;

      let publicUrl = '';
      
      const { data, error } = await supabase.storage
        .from('assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.warn("Upload to 'assets' bucket failed, attempting 'products'...", error);
        const { data: dataAlt, error: errorAlt } = await supabase.storage
          .from('products')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        if (errorAlt) throw errorAlt;
        
        const { data: { publicUrl: url } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);
        publicUrl = url;
      } else {
        const { data: { publicUrl: url } } = supabase.storage
          .from('assets')
          .getPublicUrl(filePath);
        publicUrl = url;
      }

      // Save to description contract JSON
      let existingDescription = {};
      try {
        if (store.description && store.description.startsWith('{')) {
          existingDescription = JSON.parse(store.description);
        }
      } catch (e) {}

      const updatedDescription = {
        ...existingDescription,
        domainPaymentScreenshotUrl: publicUrl,
        domainPaymentStatus: 'pending'
      };

      const { error: dbError } = await supabase
        .from('stores')
        .update({
          description: JSON.stringify(updatedDescription),
          custom_domain: customDomainNameInput.trim() // Save the desired custom domain name as well!
        })
        .eq('id', store.id);

      if (dbError) throw dbError;

      // Update local state
      setStore({
        ...store,
        description: JSON.stringify(updatedDescription),
        custom_domain: customDomainNameInput.trim()
      });
      setFormData(prev => ({
        ...prev,
        custom_domain: customDomainNameInput.trim()
      }));

      alert("🎉 Success: Custom Domain unlock payment proof uploaded successfully. Creva Super Admin has been notified for review!");
    } catch (err: any) {
      console.error(err);
      alert(`⚠️ Upload failed: ${err.message}`);
    } finally {
      setScreenshotUploading(false);
    }
  };

  const handleSimulateDomainUpi = (appName: string) => {
    const upiId = globalSettings?.platformUpi || 'creva@ybl';
    const domainPrice = globalSettings?.customDomainUnlockPrice || '1499';
    const merchantName = globalSettings?.brandName || 'Creva SaaS';
    const upiIntent = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${domainPrice}&cu=INR`;

    if (typeof window !== 'undefined') {
      const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = upiIntent;
      } else {
        alert(`📱 Simulated ${appName} launch!\nTo complete payment, please scan the QR code on your mobile device or send ₹${domainPrice} to ${upiId}.`);
      }
    }
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
          facebook: formData.facebook,
          instagram: formData.instagram,
          twitter: formData.twitter,
          youtube: formData.youtube,
          linkedin: formData.linkedin,
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
          custom_domain: formData.custom_domain ? formData.custom_domain.toLowerCase().trim() : null,
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

  const handleVerifyCustomDomain = async () => {
    if (!formData.custom_domain) {
      alert("Please enter a custom domain name.");
      return;
    }

    setVerifyingDomain(true);
    setMessage('');
    setDnsStatus(null);
    try {
      const cleanDomain = formData.custom_domain
        .replace(/https?:\/\//, '')
        .replace(/\/$/, '')
        .trim()
        .toLowerCase();
      
      const res = await fetch('/api/domains/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customDomain: cleanDomain }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to register domain with Vercel');
      }

      // Save custom domain in Supabase stores table
      const { error: dbErr } = await supabase
        .from('stores')
        .update({ custom_domain: cleanDomain })
        .eq('id', store.id);

      if (dbErr) throw dbErr;

      setDnsStatus({
        domain: cleanDomain,
        typeA: '76.76.21.21',
        typeCNAME: 'cname.vercel-dns.com',
      });

      await checkDomainStatus(cleanDomain);

      setMessage('Custom domain registered successfully! Please point your DNS records to Vercel. 🚀');
    } catch (err: any) {
      console.error(err);
      setMessage('Error connecting custom domain: ' + err.message);
    } finally {
      setVerifyingDomain(false);
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

        {/* Social Media Settings */}
        <div className="p-6 border-b border-border space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
            </svg>
            Social Media Profiles
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Connect your brand's social media platforms to showcase interactive links in your storefront footer.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Instagram URL</label>
              <input 
                type="url" 
                placeholder="https://instagram.com/yourbrand"
                value={formData.instagram} 
                onChange={e => setFormData({...formData, instagram: e.target.value})}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Facebook URL</label>
              <input 
                type="url" 
                placeholder="https://facebook.com/yourbrand"
                value={formData.facebook} 
                onChange={e => setFormData({...formData, facebook: e.target.value})}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Twitter / X URL</label>
              <input 
                type="url" 
                placeholder="https://x.com/yourbrand"
                value={formData.twitter} 
                onChange={e => setFormData({...formData, twitter: e.target.value})}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">YouTube URL</label>
              <input 
                type="url" 
                placeholder="https://youtube.com/@yourbrand"
                value={formData.youtube} 
                onChange={e => setFormData({...formData, youtube: e.target.value})}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">LinkedIn URL</label>
              <input 
                type="url" 
                placeholder="https://linkedin.com/company/yourbrand"
                value={formData.linkedin} 
                onChange={e => setFormData({...formData, linkedin: e.target.value})}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
              />
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
              {(() => {
                let contract = null;
                try {
                  if (store && store.description && store.description.startsWith('{')) {
                    contract = JSON.parse(store.description);
                  }
                } catch (e) {}

                const isUnlocked = store?.custom_domain_enabled === true;
                const domainStatus = contract?.domainPaymentStatus || 'none';
                const domainScreenshot = contract?.domainPaymentScreenshotUrl;
                const unlockPrice = globalSettings?.customDomainUnlockPrice || '1499';

                if (isUnlocked) {
                  return (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-foreground">Custom Domain</label>
                          <p className="text-sm text-muted-foreground">Connect your own custom domain (e.g., yourshopname.com or yourshopname.in) to your storefront.</p>
                        </div>
                        
                        {/* Live Status Badge */}
                        {formData.custom_domain && domainStatus && (
                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            {checkingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                            
                            {domainStatus.status === 'active' && (
                              <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold border border-emerald-200 flex items-center gap-1.5 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Active & SSL Secure
                              </span>
                            )}
                            {domainStatus.status === 'ssl_verifying' && (
                              <span className="bg-cyan-100 text-cyan-800 text-xs px-3 py-1 rounded-full font-bold border border-cyan-200 flex items-center gap-1.5 shadow-sm animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
                                Generating SSL Certificate
                              </span>
                            )}
                            {domainStatus.status === 'verifying' && (
                              <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-bold border border-amber-200 flex items-center gap-1.5 shadow-sm animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Verifying DNS Records
                              </span>
                            )}
                            {domainStatus.status === 'not_configured' && (
                              <span className="bg-rose-100 text-rose-800 text-xs px-3 py-1 rounded-full font-bold border border-rose-200 flex items-center gap-1.5 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                DNS Action Required
                              </span>
                            )}
                            {domainStatus.status === 'not_found' && (
                              <span className="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-full font-bold border border-slate-200">
                                Pending Connection
                              </span>
                            )}
                            
                            <button 
                              onClick={() => checkDomainStatus(formData.custom_domain)}
                              disabled={checkingStatus}
                              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-all"
                              title="Refresh status"
                            >
                              <svg className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M21 20v-5h-.581m0 0a8.003 8.003 0 01-15.357-2" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <input 
                          type="text" 
                          placeholder="e.g. yourshopname.com"
                          value={formData.custom_domain}
                          onChange={e => setFormData({...formData, custom_domain: e.target.value})}
                          className="w-full sm:flex-1 sm:max-w-sm h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
                        />
                        <button 
                          onClick={handleVerifyCustomDomain}
                          disabled={verifyingDomain}
                          className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/95 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {verifyingDomain && <Loader2 className="w-4 h-4 animate-spin" />}
                          Verify & Connect
                        </button>
                      </div>

                      {/* DNS Instructions Block */}
                      <div className="mt-6 p-6 bg-card border border-border/80 rounded-xl space-y-6 shadow-md">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                          <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary animate-pulse" />
                            <div>
                              <h4 className="font-bold text-sm text-foreground uppercase tracking-wider">
                                Storefront DNS Configuration Settings
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Configure these records on your domain registrar (GoDaddy, Namecheap, etc.) to link your custom domain.
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase">
                            Required Action
                          </span>
                        </div>

                        {/* Step-by-Step Registrar Tab View */}
                        <div className="bg-muted/10 border border-border/50 rounded-xl p-5 space-y-4 text-left">
                          <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">1</span>
                            <h5 className="font-bold text-xs">Log in to GoDaddy / Namecheap (Where you bought the domain)</h5>
                          </div>
                          
                          <div className="flex items-center gap-2 border-b border-border/40 pb-2 pt-1">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">2</span>
                            <h5 className="font-bold text-xs">Go to "DNS Settings" (or "Manage DNS")</h5>
                          </div>

                          <div className="space-y-4 pt-1">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">3</span>
                              <h5 className="font-bold text-xs">Add these new records exactly as shown below:</h5>
                            </div>

                            {/* Record #1 */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-primary tracking-wider block uppercase">Record #1: Root Domain (A Record)</span>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card border border-border p-4 rounded-lg shadow-sm">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Record Type</label>
                                  <div className="h-9 flex items-center px-3 bg-muted/50 border border-border rounded font-mono text-xs font-bold">A</div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Name (Host)</label>
                                  <div className="flex gap-1">
                                    <div className="h-9 flex-1 flex items-center px-3 bg-primary/10 border border-primary/20 rounded font-mono text-xs font-bold text-primary">@</div>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText("@");
                                        alert('Copied Host "@" to clipboard!');
                                      }}
                                      className="px-2 bg-secondary border border-border rounded text-[10px] font-medium hover:bg-secondary/80 transition-colors"
                                    >Copy</button>
                                  </div>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Value (Points to)</label>
                                  <div className="flex gap-1">
                                    <div className="h-9 flex-1 flex items-center px-3 bg-primary/10 border border-primary/20 rounded font-mono text-xs font-bold text-primary overflow-x-auto whitespace-nowrap">76.76.21.21</div>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText("76.76.21.21");
                                        alert('Copied Value "76.76.21.21" to clipboard!');
                                      }}
                                      className="px-2 bg-secondary border border-border rounded text-[10px] font-medium hover:bg-secondary/80 transition-colors"
                                    >Copy</button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Record #2 */}
                            <div className="space-y-1 pt-2">
                              <span className="text-[10px] font-bold text-primary tracking-wider block uppercase">Record #2: WWW Subdomain (CNAME Record)</span>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card border border-border p-4 rounded-lg shadow-sm">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Record Type</label>
                                  <div className="h-9 flex items-center px-3 bg-muted/50 border border-border rounded font-mono text-xs font-bold">CNAME</div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Name (Host)</label>
                                  <div className="flex gap-1">
                                    <div className="h-9 flex-1 flex items-center px-3 bg-primary/10 border border-primary/20 rounded font-mono text-xs font-bold text-primary">www</div>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText("www");
                                        alert('Copied Host "www" to clipboard!');
                                      }}
                                      className="px-2 bg-secondary border border-border rounded text-[10px] font-medium hover:bg-secondary/80 transition-colors"
                                    >Copy</button>
                                  </div>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Value (Points to)</label>
                                  <div className="flex gap-1">
                                    <div className="h-9 flex-1 flex items-center px-3 bg-primary/10 border border-primary/20 rounded font-mono text-xs font-bold text-primary overflow-x-auto whitespace-nowrap">cname.vercel-dns.com</div>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText("cname.vercel-dns.com");
                                        alert('Copied Value "cname.vercel-dns.com" to clipboard!');
                                      }}
                                      className="px-2 bg-secondary border border-border rounded text-[10px] font-medium hover:bg-secondary/80 transition-colors"
                                    >Copy</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted/40 p-4 rounded-xl text-[11px] text-muted-foreground border leading-relaxed text-left">
                          💡 <strong>Note on propagation:</strong> DNS propagation can take from 2 minutes to 24 hours depending on your registrar. Once configured correctly, Vercel will automatically obtain SSL certificates and active domain routing.
                        </div>
                      </div>
                    </div>
                  );
                }

                // LOCKED STATE - RENDER PREMIUM UPI VERIFICATION FLOW
                return (
                  <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Globe className="w-48 h-48 text-white" />
                      </div>

                      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 animate-pulse">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                            Unlock Custom Domain Premium Feature 🚀
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full font-mono">Premium</span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">Link a custom domain (e.g. <strong>yourname.com</strong>) with automated premium SSL routing.</p>
                        </div>
                      </div>

                      {domainStatus === 'pending' && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-amber-300 mb-6">
                          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                          <div>
                            <strong className="block mb-0.5 text-white font-extrabold">Domain Upgrade Request Pending Approval</strong>
                            We have received your custom domain unlock request for <strong className="font-mono text-white select-all bg-amber-500/20 px-1 py-0.5 rounded border border-amber-500/25">{store?.custom_domain || 'N/A'}</strong>. Our operations team is verifying the payment screenshot manually. The feature will unlock within a few hours. Thank you!
                          </div>
                        </div>
                      )}

                      {domainStatus === 'rejected' && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-red-300 mb-6">
                          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                          <div>
                            <strong className="block mb-0.5 text-white font-extrabold">Upgrade Proof Rejected</strong>
                            The previous screenshot proof for custom domain upgrade was rejected by admin. Please review payment guidelines, verify the transaction amount (₹{unlockPrice}), and submit a genuine success confirmation below.
                          </div>
                        </div>
                      )}

                      {domainStatus !== 'pending' && (
                        <div className="space-y-6 text-left">
                          {/* Domain Name Input */}
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">Enter Desired Custom Domain *</label>
                            <div className="flex gap-2 max-w-md">
                              <input 
                                type="text"
                                value={customDomainNameInput}
                                onChange={(e) => setCustomDomainNameInput(e.target.value)}
                                placeholder="e.g. yourbrand.com"
                                className="flex-1 h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-1">Please enter the exact custom domain name you wish to secure.</span>
                          </div>

                          {/* Pricing details and Payment Options */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border border-slate-800 bg-slate-950/60 p-4 rounded-xl space-y-4">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">One-Time Activation Fee</span>
                              <span className="text-3xl font-black text-white block">₹{Number(unlockPrice).toLocaleString()}</span>
                              <span className="text-[10px] text-slate-400 block leading-relaxed">Unlock lifetime domain configuration permission. No recurring fees or setup costs.</span>

                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setPaymentMethod('qr')}
                                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                                    paymentMethod === 'qr'
                                      ? 'bg-amber-500 border-amber-600 text-slate-950 font-black'
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Show Payment QR
                                </button>
                                <button 
                                  onClick={() => setPaymentMethod('app')}
                                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                                    paymentMethod === 'app'
                                      ? 'bg-amber-500 border-amber-600 text-slate-950 font-black'
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Pay via Apps
                                </button>
                              </div>
                            </div>

                            {/* QR Code and Instructions */}
                            {paymentMethod === 'qr' && (
                              <div className="border border-slate-800 bg-slate-950/60 p-4 rounded-xl flex items-center gap-4">
                                {(() => {
                                  const upiId = globalSettings?.platformUpi || 'creva@ybl';
                                  const merchantName = globalSettings?.brandName || 'Creva SaaS';
                                  const upiIntent = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${unlockPrice}&cu=INR`;
                                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiIntent)}&margin=10`;

                                  return (
                                    <>
                                      <div className="bg-white p-2 rounded-lg border border-slate-800 shrink-0">
                                        <img 
                                          src={qrUrl} 
                                          alt="UPI Payment QR Code" 
                                          className="w-[100px] h-[100px] object-contain block"
                                        />
                                      </div>
                                      <div className="space-y-1 min-w-0">
                                        <span className="text-[9px] uppercase font-black text-slate-500 block text-left">UPI VPA ID</span>
                                        <span className="block font-black font-mono text-[11px] text-amber-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 select-all truncate">{upiId}</span>
                                        <span className="text-[10px] text-slate-400 block mt-1 leading-relaxed text-left">Scan QR code using Google Pay, PhonePe, or Paytm on your mobile.</span>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            )}

                            {paymentMethod === 'app' && (
                              <div className="border border-slate-800 bg-slate-950/60 p-4 rounded-xl flex flex-col justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSimulateDomainUpi('GPay')}
                                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-800 hover:border-amber-500 bg-slate-900 text-left transition-all"
                                >
                                  <div className="flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-amber-500" />
                                    <span className="text-xs font-bold text-white">Instant Mobile Payment</span>
                                  </div>
                                  <span className="text-[9px] font-black text-amber-500 uppercase">Pay directly</span>
                                </button>
                                <span className="text-[9px] text-slate-500 block text-center mt-1">Deep links will auto-trigger on eligible mobile platforms.</span>
                              </div>
                            )}
                          </div>

                          {/* Upload Dropzone */}
                          <div className="space-y-2 border-t border-slate-800 pt-4">
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide text-left">Upload Payment Proof Screenshot *</label>
                            
                            <div className="relative border border-dashed border-slate-700 bg-slate-950 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-500 transition-colors">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleDomainScreenshotUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={screenshotUploading}
                              />
                              {screenshotUploading ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                                  <p className="text-xs font-semibold text-white">Uploading payment receipt...</p>
                                </div>
                              ) : (
                                <>
                                  <Upload className="w-6 h-6 text-amber-500 mb-2" />
                                  <p className="text-xs font-medium text-slate-200">Click or Drag screenshot proof to upload & submit</p>
                                  <p className="text-[9px] text-slate-500 mt-0.5">PNG, JPG or JPEG receipt image files under 5MB</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
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
