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
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Custom Domain</label>
                  <p className="text-sm text-muted-foreground">Connect your own custom domain (e.g., punith.orepaltes.in) to your storefront.</p>
                </div>
                
                {/* Live Status Badge */}
                {formData.custom_domain && domainStatus && (
                  <div className="flex items-center gap-2">
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
              
              <div className="mt-3 flex gap-3">
                <input 
                  type="text" 
                  placeholder="e.g. punith.orepaltes.in"
                  value={formData.custom_domain}
                  onChange={e => setFormData({...formData, custom_domain: e.target.value})}
                  className="flex-1 max-w-sm h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
                />
                <button 
                  onClick={handleVerifyCustomDomain}
                  disabled={verifyingDomain}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/95 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {verifyingDomain && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verify & Connect
                </button>
              </div>              {/* DNS Instructions Block (Always visible & premium!) */}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* A Record Card */}
                  <div className="bg-muted/25 border border-border rounded-xl p-4 space-y-3 relative overflow-hidden text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-primary tracking-wider">DNS RECORD #1: A RECORD</span>
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">REQUIRED</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Point the primary root domain (naked domain) to the platform server IP.
                    </p>
                    <div className="grid grid-cols-3 gap-2 bg-background p-2.5 rounded-lg border text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase font-bold tracking-wide">Type</span>
                        <span className="font-bold block mt-0.5">A</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase font-bold tracking-wide">Host</span>
                        <span className="font-bold block mt-0.5">@</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase font-bold tracking-wide">Value (IP)</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-emerald-500 font-bold select-all">76.76.21.21</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText("76.76.21.21");
                              alert("IP Address 76.76.21.21 copied to clipboard!");
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy IP"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CNAME Record Card */}
                  <div className="bg-muted/25 border border-border rounded-xl p-4 space-y-3 relative overflow-hidden text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-primary tracking-wider">DNS RECORD #2: CNAME</span>
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">RECOMMENDED</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Point the WWW subdomain variation so it resolves seamlessly.
                    </p>
                    <div className="grid grid-cols-3 gap-2 bg-background p-2.5 rounded-lg border text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase font-bold tracking-wide">Type</span>
                        <span className="font-bold block mt-0.5">CNAME</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase font-bold tracking-wide">Host</span>
                        <span className="font-bold block mt-0.5">www</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase font-bold tracking-wide">Value (Target)</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-primary font-bold select-all">crevasolution.in</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText("crevasolution.in");
                              alert("Domain crevasolution.in copied to clipboard!");
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy target"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
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
