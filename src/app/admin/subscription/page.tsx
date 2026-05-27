'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard, Loader2, Phone, Calendar, Clock, Infinity, ShieldCheck, FileText, Printer, ShieldAlert, Upload
} from 'lucide-react';

export default function SubscriptionPage() {
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reuploadSuccess, setReuploadSuccess] = useState(false);

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .single();
        
      if (storeData) {
        setStore(storeData);
      }

      // Sync global settings from Supabase
      const { data: globalSettingsRow } = await supabase
        .from('stores')
        .select('description')
        .eq('subdomain', '__creva_saas_global_settings__')
        .maybeSingle();

      if (globalSettingsRow && globalSettingsRow.description) {
        try {
          const parsed = JSON.parse(globalSettingsRow.description);
          if (parsed.brandName) localStorage.setItem('saas_brand_name', parsed.brandName);
          if (parsed.brandLogo) localStorage.setItem('saas_brand_logo', parsed.brandLogo);
          if (parsed.officers) localStorage.setItem('saas_licensing_officers', JSON.stringify(parsed.officers));
          if (parsed.agreementTemplate) localStorage.setItem('saas_agreement_template', parsed.agreementTemplate);
        } catch (e) {
          console.error("Failed to parse global settings in subscription page:", e);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) return null;

  // Check subscription details
  const expiryDate = store.subscription_expires_at ? new Date(store.subscription_expires_at) : null;
  const isExpired = expiryDate ? expiryDate < new Date() : false;

  // Parse contract details from description if JSON
  let contract = null;
  try {
    if (store.description && store.description.trim().startsWith('{')) {
      contract = JSON.parse(store.description);
    }
  } catch (e) {}

  const activePlanLabel = expiryDate === null 
    ? 'Lifetime Subscription' 
    : contract?.selectedPlan === '30' 
      ? '1 Month Plan (₹499/mo)' 
      : contract?.selectedPlan === '365'
        ? '1 Year Plan (₹3,999/yr)'
        : 'SaaS Active Plan';

  const handleWhatsAppInquiry = (planName: string) => {
    const text = encodeURIComponent(
      `Hi Creva Support team,\n\nI want to renew or upgrade my storefront subscription!\n\nStore Name: ${store.store_name}\nSubdomain: ${store.subdomain}.crevasolution.in\nSelected Upgrade Plan: ${planName}`
    );
    window.open(`https://wa.me/919876543210?text=${text}`, '_blank');
  };

  const handlePrintContract = () => {
    if (!contract || typeof window === 'undefined') return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const planLabel = contract.selectedPlan === '30' ? '1 Month (30 Days)' :
                      contract.selectedPlan === '365' ? '1 Year (365 Days)' : 'Lifetime Subscription';

    const assignedOfficer = contract.assignedOfficer;
    const logoUrl = localStorage.getItem('saas_brand_logo') || '';
    const logoHtml = logoUrl 
      ? `<img src="${logoUrl}" style="max-height: 55px; max-width: 180px; display: block; margin: 0 auto 15px auto;" />`
      : `<svg width="50" height="50" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto 15px auto;">
           <circle cx="50" cy="50" r="45" stroke="#1e3a8a" stroke-width="3" fill="#f8fafc"/>
           <path d="M50 20 L75 40 L65 75 L35 75 L25 40 Z" fill="#1e3a8a"/>
           <text x="50" y="58" font-family="'Georgia', serif" font-weight="bold" font-size="24" fill="#ffffff" text-anchor="middle">C</text>
         </svg>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Creva SaaS Storefront Agreement - ${store.store_name}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
            .title { font-size: 22px; font-weight: 850; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; margin-top: 5px; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 3px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 10px; border-left: 4px solid #3b82f6; padding-left: 10px; text-transform: uppercase; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .meta-table td { padding: 9px; border: 1px solid #e2e8f0; font-size: 13px; }
            .meta-table td.label { font-weight: bold; background-color: #f8fafc; width: 30%; }
            .terms { background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 8px; font-size: 11px; max-height: 250px; overflow-y: auto; text-align: justify; }
            .signature-area { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; }
            .sig-box { border-bottom: 1px solid #000; width: 45%; text-align: center; padding-bottom: 10px; }
            .sig-img { max-height: 60px; max-width: 100%; display: block; margin: 0 auto 5px auto; }
            .badge { display: inline-block; padding: 4px 10px; background: #e0f2fe; color: #0369a1; font-weight: bold; font-size: 11px; border-radius: 9999px; text-transform: uppercase; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoHtml}
            <div class="title">Creva SaaS Storefront Agreement</div>
            <div class="subtitle">Official Digital Merchant & Licensing Contract</div>
          </div>

          <div class="section">
            <div class="section-title">Merchant & Storefront Details</div>
            <table class="meta-table">
              <tr>
                <td class="label">Merchant Name</td>
                <td>${store.store_name}</td>
              </tr>
              <tr>
                <td class="label">Primary Subdomain</td>
                <td>${store.subdomain}.crevasolution.in</td>
              </tr>
              <tr>
                <td class="label">Contact Email</td>
                <td>${store.contact_email || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Contact Phone</td>
                <td>${store.contact_phone || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Subscription Tier</td>
                <td><span class="badge">${planLabel}</span></td>
              </tr>
              <tr>
                <td class="label">Date Signed</td>
                <td>${contract.contractSignedAt ? new Date(contract.contractSignedAt).toLocaleDateString('en-IN') : 'N/A'}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Terms &amp; Conditions of Service</div>
            <div class="terms">
              ${(localStorage.getItem('saas_agreement_template') || '1. PROVISIONS OF SERVICE: The Creva E-Commerce SaaS platform grants the undersigned Merchant the license to operate an automated retail storefront website using our cloud architecture.')
                .split('\n')
                .filter((line: string) => line.trim())
                .map((para: string) => `<p>${para.trim()}</p>`)
                .join('')
              }
            </div>
          </div>

          <div class="signature-area">
            <div class="sig-box">
              <div style="font-size: 10px; color: #64748b; margin-bottom: 5px;">${assignedOfficer?.title || 'Creva Licensing Officer'}</div>
              ${assignedOfficer?.signature 
                ? `<img class="sig-img" src="${assignedOfficer.signature}" alt="${assignedOfficer.name}" />` 
                : `<div style="font-family: 'Courier New', monospace; font-weight: bold; font-size: 13px; margin-bottom: 12px; letter-spacing: 1px;">CREVA OFFICIAL STAMP</div>`
              }
              <div style="font-size: 11px; font-weight: bold; border-top: 1px solid #cbd5e1; padding-top: 5px;">${assignedOfficer?.name || 'Authorized Signature'}</div>
            </div>
            <div class="sig-box">
              <div style="font-size: 10px; color: #64748b; margin-bottom: 5px;">Signed Digitally by Merchant</div>
              ${contract.contractSignature ? `<img class="sig-img" src="${contract.contractSignature}" alt="Merchant Signature" />` : '<div style="height: 70px;">[MISSING SIGNATURE]</div>'}
              <div style="font-size: 11px; font-weight: bold; border-top: 1px solid #cbd5e1; padding-top: 5px;">Merchant Signature</div>
            </div>
          </div>

          <div style="text-align: center; margin-top: 40px;" class="no-print">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
              🖨️ Print or Save as PDF
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleScreenshotReupload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("⚠️ File size must be under 5MB!");
      return;
    }

    setUploading(true);
    try {
      let uploadedUrl = '';
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${store.id}_reupload_${Date.now()}.${fileExt}`;
      const filePath = `payment_verification/${fileName}`;

      // Try uploading to 'assets' bucket first
      const { data: storageData, error: storageError } = await supabase.storage
        .from('assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (storageError) {
        console.warn("Storage upload failed, falling back to base64 reader:", storageError.message);
        // Fallback to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          uploadedUrl = reader.result as string;
          await updateStoreDescriptionWithScreenshot(uploadedUrl);
        };
        reader.readAsDataURL(file);
        return;
      }

      // If storage succeeded, get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      uploadedUrl = publicUrl;
      await updateStoreDescriptionWithScreenshot(uploadedUrl);

    } catch (err: any) {
      console.error(err);
      alert(`⚠️ Failed to upload file: ${err.message}`);
      setUploading(false);
    }
  };

  const updateStoreDescriptionWithScreenshot = async (url: string) => {
    try {
      // Decode existing description JSON
      let contractDetails = {
        selectedPlan: '30',
        contractSigned: true,
        contractSignedAt: new Date().toISOString(),
        contractSignature: '',
        assignedOfficer: null,
      };

      try {
        if (store.description && store.description.trim().startsWith('{')) {
          contractDetails = JSON.parse(store.description);
        }
      } catch (e) {}

      // Update details
      const updatedContract = {
        ...contractDetails,
        paymentScreenshotUrl: url,
        paymentStatus: 'pending' // Reset status to pending for superadmin approval!
      };

      const { error } = await supabase
        .from('stores')
        .update({
          description: JSON.stringify(updatedContract),
          is_paused: true // Keep store paused until re-verified!
        })
        .eq('id', store.id);

      if (error) throw error;

      // Update state
      setStore({
        ...store,
        description: JSON.stringify(updatedContract),
        is_paused: true
      });

      setReuploadSuccess(true);
      setTimeout(() => setReuploadSuccess(false), 3000);
      alert("🎉 Success: Payment screenshot successfully re-uploaded! Your store is now awaiting superadmin re-verification.");
    } catch (err: any) {
      console.error(err);
      alert(`⚠️ Failed to update store payment info: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Expiry Header Banner */}
      {isExpired ? (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-5 flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm">Your Subscription Has Expired!</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your store domain permissions and automated e-commerce storefront features may be restricted. Please renew immediately to avoid interruptions.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card text-card-foreground border border-border/50 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="space-y-1 text-left">
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Current SaaS License status</span>
              <h2 className="text-xl font-bold">{activePlanLabel}</h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono mt-0.5">
                {expiryDate === null ? (
                  <>
                    <Infinity className="w-3.5 h-3.5 text-yellow-500" />
                    Lifetime Plan (Unlimited access)
                  </>
                ) : (
                  <>
                    <Calendar className="w-3.5 h-3.5" />
                    Expires on: {expiryDate.toLocaleDateString()} {expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              expiryDate === null 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400' 
                : 'bg-emerald-100 text-emerald-850 dark:bg-emerald-500/10 dark:text-emerald-400'
            }`}>
              {expiryDate === null ? 'ACTIVE (LIFETIME)' : 'ACTIVE (PAID)'}
            </span>
          </div>
        </div>
      )}

      {contract && (
        <div className="bg-card text-card-foreground rounded-xl border border-border/50 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-border/40">
            <div className="text-left">
              <h3 className="font-bold text-base">Payment & Onboarding Status</h3>
              <p className="text-xs text-muted-foreground mt-0.5 font-sans">Verify your payment verification timeline and uploaded screenshot.</p>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider ${
              contract.paymentStatus === 'verified'
                ? 'bg-emerald-100 text-emerald-850 dark:bg-emerald-500/10 dark:text-emerald-400'
                : contract.paymentStatus === 'rejected'
                  ? 'bg-red-100 text-red-850 dark:bg-red-500/10 dark:text-red-400'
                  : 'bg-amber-100 text-amber-850 dark:bg-amber-500/10 dark:text-amber-400'
            }`}>
              STATUS: {contract.paymentStatus?.toUpperCase() || 'PENDING'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side: Upload Screenshot display */}
            <div className="space-y-4 text-left">
              <span className="text-[10px] text-muted-foreground uppercase font-black block tracking-wider">Uploaded Screenshot proof</span>
              {contract.paymentScreenshotUrl ? (
                <div className="relative group max-w-xs border border-border rounded-xl overflow-hidden shadow-md bg-muted/20">
                  <img 
                    src={contract.paymentScreenshotUrl} 
                    alt="Payment screenshot proof" 
                    className="max-h-[180px] w-full object-contain mx-auto p-2"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a 
                      href={contract.paymentScreenshotUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-primary text-primary-foreground text-[10px] font-black px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      View Fullsize 🌐
                    </a>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground bg-muted/10">
                  <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold">No screenshot found on file</p>
                </div>
              )}
            </div>

            {/* Right side: Reupload dropzone if pending or rejected */}
            <div className="space-y-4 flex flex-col justify-center text-left">
              <span className="text-[10px] text-muted-foreground uppercase font-black block tracking-wider">Submit/Re-upload payment receipt</span>
              
              {contract.paymentStatus === 'verified' ? (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 text-emerald-800 dark:text-emerald-350 text-xs leading-relaxed space-y-1">
                  <span className="font-bold block">✨ Payment Verification Confirmed!</span>
                  Your payment has been manually approved by the super administration. Your e-commerce storefront is active and open to customers.
                </div>
              ) : (
                <div className="space-y-4">
                  {contract.paymentStatus === 'rejected' && (
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-red-800 dark:text-red-350 text-xs leading-relaxed">
                      <strong className="block font-bold">🚨 Verification Compliance Notice:</strong>
                      Your previous payment proof was rejected. Please transfer the setup fee and upload a clear screenshot of the UPI transaction receipt below.
                    </div>
                  )}

                  <label className="relative border border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-muted/20 hover:bg-muted/30">
                    <Upload className="w-6 h-6 text-muted-foreground mb-2 animate-bounce" />
                    <span className="text-xs font-bold text-foreground">
                      {uploading ? 'Uploading Transaction Screenshot...' : 'Click to Upload Receipt'}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1 block">Supports PNG, JPG (Max 5MB)</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleScreenshotReupload}
                      disabled={uploading}
                      className="hidden" 
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid: Plan renewal options and Digital Contract info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Subscription Renewal Inquiries */}
        <div className="bg-card text-card-foreground rounded-xl border border-border/50 p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="font-bold text-base">Renew / Upgrade Plan</h3>
            <p className="text-xs text-muted-foreground mt-1">Select an upgrade plan below to connect directly with our support team.</p>
          </div>

          <div className="space-y-3">
            {[
              { id: '1 Month Plan', price: '₹499 / Month', desc: 'Standard merchant package' },
              { id: '1 Year Plan', price: '₹3,999 / Year', desc: 'Best deal for retail brands' },
              { id: 'Lifetime Plan', price: '₹9,999 / Lifetime', desc: 'Unlimited professional features' }
            ].map((plan) => (
              <div 
                key={plan.id} 
                className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold">{plan.id}</h4>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">{plan.desc}</span>
                </div>
                <button
                  onClick={() => handleWhatsAppInquiry(plan.id)}
                  className="flex items-center gap-1 bg-success hover:bg-success/90 text-primary-foreground text-[10px] font-black px-3 py-2 rounded-lg transition-colors shadow-sm"
                >
                  <Phone className="w-3 h-3" />
                  ENQUIRE NOW
                </button>
              </div>
            ))}
          </div>

          <div className="bg-muted/40 p-4 rounded-xl text-[11px] text-muted-foreground border leading-relaxed">
            💡 <strong>How does it work?</strong> Our platform supports off-platform payments for maximum safety. Once you click <strong>Enquire</strong>, our team will receive your message and call you to process payment off-site.
          </div>
        </div>

        {/* Card 2: Merchant Contract & Signed Copy */}
        <div className="bg-card text-card-foreground rounded-xl border border-border/50 p-6 space-y-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-base">Your Merchant Agreement</h3>
              <p className="text-xs text-muted-foreground mt-1">View or print your digitally signed storefront licensing contract.</p>
            </div>

            {contract && contract.contractSigned ? (
              <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-xs font-bold">Verified Signed Contract</span>
                </div>
                <div className="text-[11px] text-muted-foreground space-y-2 text-left">
                  <p>
                    <strong>Signed on:</strong> {new Date(contract.contractSignedAt).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Registered Subdomain:</strong> {store.subdomain}.crevasolution.in
                  </p>
                  {contract.contractSignature && (
                    <div className="pt-2">
                      <span className="text-[9px] uppercase font-bold block mb-1.5 text-muted-foreground">Captured Signature:</span>
                      <div className="bg-white p-2 border rounded inline-block">
                        <img 
                          src={contract.contractSignature} 
                          alt="Merchant signature" 
                          className="max-h-[50px] object-contain invert"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-muted/30 p-4 rounded-xl border border-border text-center space-y-2">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground font-medium">No signed agreement found on your storefront record.</p>
              </div>
            )}
          </div>

          {contract && contract.contractSigned && (
            <button
              onClick={handlePrintContract}
              className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              DOWNLOAD / PRINT SIGNED CONTRACT
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
