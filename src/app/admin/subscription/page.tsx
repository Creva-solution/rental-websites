'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard, Loader2, Phone, Calendar, Clock, Infinity, ShieldCheck, FileText, Printer, ShieldAlert, Upload, Trash2, Lock, X
} from 'lucide-react';

export default function SubscriptionPage() {
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reuploadSuccess, setReuploadSuccess] = useState(false);
  const [customPackages, setCustomPackages] = useState<any[]>([]);

  // Interactive Merchant Signature States
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isDrawingSig, setIsDrawingSig] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSignatureConfirmed, setIsSignatureConfirmed] = useState(false);

  const getOfficerSignatureUrl = (officer: any) => {
    if (officer?.signature && officer.signature.trim().length > 0) {
      return officer.signature;
    }
    
    // Fallbacks with gorgeous handwriting SVGs for the 4 platform officers based on ID/Name
    const name = officer?.name || 'Kavin Kumar';
    if (name.includes('Kavin')) {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60" viewBox="0 0 160 60"><path d="M15,25 C40,5 60,45 80,20 C100,5 120,40 145,15 M30,45 C70,35 110,45 135,35" fill="none" stroke="%230284c7" stroke-width="2" stroke-linecap="round"/><circle cx="80" cy="30" r="25" fill="none" stroke="%230284c7" stroke-width="1" stroke-dasharray="3,2" opacity="0.4"/><text x="58" y="33" font-family="sans-serif" font-size="7" font-weight="black" fill="%230284c7" opacity="0.6">VERIFIED</text></svg>`;
    } else if (name.includes('Abhishek')) {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60" viewBox="0 0 160 60"><path d="M10,35 C30,15 45,5 65,30 C85,55 105,10 125,25 C135,32 145,15 150,10" fill="none" stroke="%230f172a" stroke-width="2" stroke-linecap="round"/><rect x="45" y="15" width="70" height="30" rx="3" fill="none" stroke="%233b82f6" stroke-width="1" stroke-dasharray="4,2" opacity="0.4"/><text x="56" y="32" font-family="sans-serif" font-size="7" font-weight="black" fill="%233b82f6" opacity="0.6">LICENSED</text></svg>`;
    } else if (name.includes('Preethi')) {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60" viewBox="0 0 160 60"><path d="M20,15 C45,45 55,5 75,25 C95,45 115,15 140,30" fill="none" stroke="%2310b981" stroke-width="2.5" stroke-linecap="round"/><circle cx="80" cy="30" r="24" fill="none" stroke="%2310b981" stroke-width="1.2" stroke-dasharray="2,3" opacity="0.4"/><text x="58" y="33" font-family="sans-serif" font-size="7" font-weight="black" fill="%2310b981" opacity="0.6">DIRECTOR</text></svg>`;
    } else if (name.includes('Sanjay')) {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60" viewBox="0 0 160 60"><path d="M15,40 C35,10 65,15 85,35 C105,55 125,5 145,25" fill="none" stroke="%236366f1" stroke-width="2" stroke-linecap="round"/><circle cx="80" cy="30" r="26" fill="none" stroke="%236366f1" stroke-width="1" stroke-dasharray="3,1" opacity="0.4"/><text x="58" y="33" font-family="sans-serif" font-size="7" font-weight="black" fill="%236366f1" opacity="0.6">REGISTRAR</text></svg>`;
    }
    
    // Default fallback
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60" viewBox="0 0 160 60"><path d="M15,25 C40,5 60,45 80,20 C100,5 120,40 145,15 M30,45 C70,35 110,45 135,35" fill="none" stroke="%230284c7" stroke-width="2" stroke-linecap="round"/><circle cx="80" cy="30" r="25" fill="none" stroke="%230284c7" stroke-width="1" stroke-dasharray="3,2" opacity="0.4"/><text x="58" y="33" font-family="sans-serif" font-size="7" font-weight="black" fill="%230284c7" opacity="0.6">VERIFIED</text></svg>`;
  };

  const startDrawingSig = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawingSig(true);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawSig = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSig) return;
    e.preventDefault();
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawingSig = () => {
    setIsDrawingSig(false);
  };

  const clearSig = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignature(null);
    setIsSignatureConfirmed(false);
  };

  const handleConfirmSignature = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setSignature(dataUrl);
      setIsSignatureConfirmed(true);
    } else {
      alert("⚠️ Error capturing signature. Please try drawing again.");
    }
  };

  const handleSubmitSignedAgreement = async () => {
    if (!signature || !isSignatureConfirmed) {
      alert("⚠️ Please digitally sign the SaaS agreement and click 'Confirm & Lock Signature' below the canvas first!");
      return;
    }

    try {
      setUploading(true);

      const officersList = [
        { id: 1, name: 'Kavin Kumar', title: 'Senior Licensing Officer', signature: '' },
        { id: 2, name: 'Abhishek Sharma', title: 'Executive Officer - Creva', signature: '' },
        { id: 3, name: 'Preethi Rajan', title: 'Licensing Director', signature: '' },
        { id: 4, name: 'Sanjay Sen', title: 'Registrar of Merchants', signature: '' }
      ];
      
      const savedOfficers = typeof window !== 'undefined' ? localStorage.getItem('saas_licensing_officers') : null;
      let chosenOfficer = officersList[0];
      if (savedOfficers) {
        try {
          const parsed = JSON.parse(savedOfficers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            chosenOfficer = parsed[Math.floor(Math.random() * parsed.length)];
          }
        } catch(e) {}
      }

      let currentScreenshotUrl = null;
      let currentPaymentStatus = 'pending';
      
      if (store.description && store.description.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(store.description);
          currentScreenshotUrl = parsed.paymentScreenshotUrl || null;
          currentPaymentStatus = parsed.paymentStatus || 'pending';
        } catch(e) {}
      }

      const contractDetails = {
        description: store.description && !store.description.startsWith('{') ? store.description : '',
        contractSigned: true,
        contractSignedAt: new Date().toISOString(),
        contractSignature: signature,
        selectedPlan: '30',
        assignedOfficer: chosenOfficer,
        paymentScreenshotUrl: currentScreenshotUrl,
        paymentStatus: currentPaymentStatus,
        selectedTemplate: 'minimal'
      };

      const { error } = await supabase
        .from('stores')
        .update({
          description: JSON.stringify(contractDetails)
        })
        .eq('id', store.id);

      if (error) throw error;

      setStore({
        ...store,
        description: JSON.stringify(contractDetails)
      });

      setIsSignModalOpen(false);
      alert("🎉 Success: Your merchant storefront licensing agreement has been digitally signed and registered successfully!");
    } catch (err: any) {
      console.error(err);
      alert(`⚠️ Failed to submit signature: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchStore();
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saas_custom_packages');
      if (saved) {
        try { setCustomPackages(JSON.parse(saved)); } catch (e) {}
      }
    }
  }, []);

  const fetchStore = async () => {
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
          if (parsed.plan30Price) localStorage.setItem('saas_plan_30_price', parsed.plan30Price);
          if (parsed.plan365Price) localStorage.setItem('saas_plan_365_price', parsed.plan365Price);
          if (parsed.planLifetimePrice) localStorage.setItem('saas_plan_lifetime_price', parsed.planLifetimePrice);
          if (parsed.disabledDefaultPackages) localStorage.setItem('saas_disabled_default_packages', JSON.stringify(parsed.disabledDefaultPackages));
          if (parsed.customPackages) {
            localStorage.setItem('saas_custom_packages', JSON.stringify(parsed.customPackages));
            setCustomPackages(parsed.customPackages);
          }
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
      ? `1 Month Plan (₹${typeof window !== 'undefined' ? localStorage.getItem('saas_plan_30_price') || '499' : '499'}/mo)` 
      : contract?.selectedPlan === '365'
        ? `1 Year Plan (₹${typeof window !== 'undefined' ? Number(localStorage.getItem('saas_plan_365_price') || 3999).toLocaleString() : '3,999'}/yr)`
        : (() => {
            const customPkg = (customPackages || []).find((pkg: any) => pkg.id === contract?.selectedPlan);
            return customPkg ? `${customPkg.name} (₹${Number(customPkg.price).toLocaleString()})` : 'SaaS Active Plan';
          })();

  const planLabel = contract?.selectedPlan === '30' ? '1 Month (30 Days)' :
                    contract?.selectedPlan === '365' ? '1 Year (365 Days)' :
                    contract?.selectedPlan === 'lifetime' ? 'Lifetime Subscription' :
                    (() => {
                      const customPkg = (customPackages || []).find((pkg: any) => pkg.id === contract?.selectedPlan);
                      return customPkg ? `${customPkg.name} (${customPkg.days} Days)` : 'Custom Active Plan';
                    })();

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

      // If storage succeeded, use the returned path if it is an absolute URL, otherwise fall back to getPublicUrl
      if (storageData && storageData.path && (storageData.path.startsWith('http://') || storageData.path.startsWith('https://'))) {
        uploadedUrl = storageData.path;
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('assets')
          .getPublicUrl(filePath);
        uploadedUrl = publicUrl;
      }
      
      await updateStoreDescriptionWithScreenshot(uploadedUrl);

    } catch (err: any) {
      console.error(err);
      alert(`⚠️ Failed to upload file: ${err.message}`);
      setUploading(false);
    }
  };

  const handleDeleteScreenshot = async () => {
    if (!contract || !contract.paymentScreenshotUrl) return;

    if (!confirm("Are you sure you want to permanently delete your payment screenshot from cloud storage?")) return;

    setUploading(true);
    try {
      const imageUrl = contract.paymentScreenshotUrl;
      // Extract bucket and file path from URL
      let filePath = '';
      let bucket = 'assets';

      if (imageUrl.includes('/products/')) {
        bucket = 'products';
        filePath = imageUrl.split('/products/').pop() || '';
      } else if (imageUrl.includes('/assets/')) {
        bucket = 'assets';
        filePath = imageUrl.split('/assets/').pop() || '';
      }

      // If it's a valid storage file path, remove it from Supabase Storage bucket!
      if (filePath && !filePath.startsWith('data:')) {
        filePath = filePath.split('?')[0];
        const { error: storageError } = await supabase.storage
          .from(bucket)
          .remove([filePath]);
        if (storageError) console.error("Failed to delete file from bucket:", storageError);
      }

      // Update the database description field
      const updatedContract = {
        ...contract,
        paymentScreenshotUrl: null,
        paymentStatus: 'pending'
      };

      const { error: updateError } = await supabase
        .from('stores')
        .update({
          description: JSON.stringify(updatedContract)
        })
        .eq('id', store.id);

      if (updateError) throw updateError;

      // Update state
      setStore({
        ...store,
        description: JSON.stringify(updatedContract)
      });

      alert("Payment screenshot successfully deleted.");
    } catch (err: any) {
      console.error(err);
      alert(`Failed to delete screenshot: ${err.message}`);
    } finally {
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
                <div className="space-y-3">
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

                  <button
                    onClick={handleDeleteScreenshot}
                    disabled={uploading}
                    className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-black px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 border border-red-800/35"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Screenshot
                  </button>
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

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {(() => {
              const defaultPlans = [
                { id: '30', name: '1 Month Plan', price: `₹${localStorage.getItem('saas_plan_30_price') || '499'} / Month`, desc: 'Standard merchant package' },
                { id: '365', name: '1 Year Plan', price: `₹${Number(localStorage.getItem('saas_plan_365_price') || 3999).toLocaleString()} / Year`, desc: 'Best deal for retail brands' },
                { id: 'lifetime', name: 'Lifetime Plan', price: `₹${Number(localStorage.getItem('saas_plan_lifetime_price') || 9999).toLocaleString()} / Lifetime`, desc: 'Unlimited professional features' }
              ].filter(plan => !(typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('saas_disabled_default_packages') || '[]') : []).includes(plan.id));

              const customPlans = (customPackages || []).map((pkg: any) => ({
                id: pkg.id,
                name: pkg.name,
                price: `₹${Number(pkg.price || 0).toLocaleString()} / ${pkg.duration} ${pkg.durationType}s`,
                desc: `Custom Package • ${pkg.days} Days Access`
              }));

              return [...defaultPlans, ...customPlans].map((plan) => (
                <div 
                  key={plan.id} 
                  className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-bold">{plan.name}</h4>
                    <span className="text-[10px] text-primary font-bold block mt-0.5">{plan.price}</span>
                    <span className="text-[9px] text-muted-foreground block mt-0.5">{plan.desc}</span>
                  </div>
                  <button
                    onClick={() => handleWhatsAppInquiry(plan.name)}
                    className="flex items-center gap-1 bg-success hover:bg-success/90 text-primary-foreground text-[10px] font-black px-3 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <Phone className="w-3 h-3" />
                    ENQUIRE NOW
                  </button>
                </div>
              ));
            })()}
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
                          className="max-h-[50px] object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-muted/30 p-4 rounded-xl border border-border text-center space-y-3">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto animate-pulse" />
                <p className="text-xs text-muted-foreground font-medium">No signed agreement found on your storefront record.</p>
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(true)}
                  className="mx-auto mt-1 flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-black px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer uppercase tracking-widest"
                >
                  ✍️ Sign Licensing Agreement Now
                </button>
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

      {/* Visual Live Document Agreement Section */}
      {contract && contract.contractSigned && (
        <div className="bg-card text-card-foreground rounded-xl border border-border/50 p-6 shadow-sm space-y-6">
          <div className="text-left border-b pb-4 border-border/40">
            <h3 className="font-bold text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Live Merchant Licensing Agreement Document
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review your digitally signed contract, licensing terms, and regulatory stamps in real-time below.
            </p>
          </div>

          <div className="relative bg-white text-slate-800 rounded-xl p-8 md:p-12 border border-slate-200 shadow-md font-sans text-left max-w-3xl mx-auto overflow-hidden">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <span className="text-9xl font-black rotate-[25deg]">CREVA</span>
            </div>

            {/* Document Header */}
            <div className="relative border-b-2 border-slate-350 pb-6 mb-8 text-center">
              {(() => {
                const logoUrl = localStorage.getItem('saas_brand_logo') || '';
                return logoUrl ? (
                  <img src={logoUrl} alt="Platform Logo" className="max-h-[50px] max-w-[170px] mx-auto mb-4 block" />
                ) : (
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                );
              })()}
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide text-slate-900">Creva SaaS Storefront Agreement</h2>
              <span className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest font-black block mt-1">Official Licensing & Merchant Operations Contract</span>
            </div>

            {/* Document Meta Section */}
            <div className="space-y-4 mb-8">
              <h4 className="text-xs font-bold text-slate-900 border-l-4 border-primary pl-2 uppercase tracking-wide">1. Merchant & Subdomain Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                <div className="space-y-2">
                  <div className="text-[11px]"><strong className="text-slate-500">Merchant Store:</strong> <span className="font-bold text-slate-800">{store.store_name}</span></div>
                  <div className="text-[11px]"><strong className="text-slate-500">Registered Subdomain:</strong> <span className="font-mono font-bold text-primary select-all">{store.subdomain}.crevasolution.in</span></div>
                  <div className="text-[11px]"><strong className="text-slate-500">Licensing Tier:</strong> <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono text-[9px] font-black rounded-full uppercase tracking-wider">{planLabel}</span></div>
                </div>
                <div className="space-y-2">
                  <div className="text-[11px]"><strong className="text-slate-500">Contact Email:</strong> <span className="text-slate-700">{store.contact_email || 'N/A'}</span></div>
                  <div className="text-[11px]"><strong className="text-slate-500">Contact Phone:</strong> <span className="text-slate-700 font-mono">{store.contact_phone || 'N/A'}</span></div>
                  <div className="text-[11px]"><strong className="text-slate-500">Date Signed:</strong> <span className="text-slate-700">{contract.contractSignedAt ? new Date(contract.contractSignedAt).toLocaleDateString('en-IN') : 'N/A'}</span></div>
                </div>
              </div>
            </div>

            {/* Document Terms Section */}
            <div className="space-y-3 mb-8">
              <h4 className="text-xs font-bold text-slate-900 border-l-4 border-primary pl-2 uppercase tracking-wide">2. Provisions & Licensing Terms</h4>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-[11px] text-slate-650 leading-relaxed text-justify max-h-[220px] overflow-y-auto font-sans shadow-inner scrollbar-thin">
                {(() => {
                  const savedTemplate = localStorage.getItem('saas_agreement_template') || '1. PROVISIONS OF SERVICE: The Creva E-Commerce SaaS platform grants the undersigned Merchant the license to operate an automated retail storefront website using our cloud architecture.';
                  return savedTemplate.split('\n').filter(l => l.trim()).map((para, i) => (
                    <p key={i} className="mb-2 last:mb-0">{para.trim()}</p>
                  ));
                })()}
              </div>
            </div>

            {/* Document Signatures Section */}
            <div className="flex flex-col sm:flex-row gap-6 justify-between items-stretch mt-10 relative pt-6 border-t border-slate-200">
              {/* Officer stamp block */}
              <div className="flex-1 border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between items-center text-center">
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2">{contract.assignedOfficer?.title || 'Licensing Authority'}</div>
                <img 
                  src={getOfficerSignatureUrl(contract.assignedOfficer)} 
                  alt="Officer stamp" 
                  className="max-h-[60px] object-contain block mix-blend-multiply mb-2" 
                />
                <div className="border-t border-slate-300 pt-1.5 w-full">
                  <span className="text-xs font-bold text-slate-800 block">{contract.assignedOfficer?.name || 'Creva Representative'}</span>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-widest mt-0.5">Authorized Signatory</span>
                </div>
              </div>

              {/* Merchant stamp block */}
              <div className="flex-1 border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between items-center text-center">
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2">Registered Store Owner</div>
                {contract.contractSignature ? (
                  <img src={contract.contractSignature} alt="Merchant signature" className="max-h-[60px] object-contain block mix-blend-multiply mb-2" />
                ) : (
                  <div className="h-[60px] flex items-center justify-center text-[10px] text-slate-400 font-mono italic">
                    [MISSING DIGITIZED SIGNATURE]
                  </div>
                )}
                <div className="border-t border-slate-300 pt-1.5 w-full">
                  <span className="text-xs font-bold text-slate-800 block">{store.store_name} Representative</span>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-widest mt-0.5">Digital Signatory</span>
                </div>
              </div>
            </div>

            {/* Document Footer Verification Seal */}
            <div className="mt-8 text-center text-[9px] text-slate-400 font-mono border-t border-slate-100 pt-4 flex items-center justify-center gap-1.5">
              <span className="flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-slate-400" />
                Cryptographically Signed & Secured via Creva SaaS Engine
              </span>
              <span>•</span>
              <span className="font-bold text-slate-500 uppercase tracking-widest">ID: store_{store.id.slice(0,8)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Licensing Agreement Signature Modal */}
      {isSignModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-2xl w-full max-w-2xl p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4 border-border/40">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Sign Merchant Licensing Contract
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Please review terms and sign digitally inside the canvas.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="p-1.5 hover:bg-muted rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / Scrollable Agreement */}
            <div className="space-y-4 overflow-y-auto pr-2 flex-1 scrollbar-thin">
              <div className="bg-muted/40 border border-border rounded-xl p-4 text-xs leading-relaxed text-muted-foreground max-h-[160px] overflow-y-auto select-text">
                <p className="font-bold text-foreground mb-3 uppercase tracking-wider text-[10px]">Merchant Storefront Licensing Terms:</p>
                <div className="whitespace-pre-line text-left">
                  {localStorage.getItem('saas_agreement_template') || `1. PROVISIONS OF SERVICE: The Creva E-Commerce SaaS platform grants the undersigned Merchant the license to operate an automated retail storefront website using our cloud architecture. Custom domain mappings are active permissions subject to the subscription plan level.

2. PLAN RENEWALS & INQUIRY SYSTEM: The Merchant understands that platform billing utilizes an inquiry activation system. Upon plan expiration, storefront access may be suspended unless renewed by contacting the support sales team directly.

3. ACCEPTABLE USAGE & LEGAL LIMITS: The Merchant agrees to list only legally compliant goods. Sales of prohibited, illegal, counterfeited, or unauthorized products will lead to instant termination of this license without refund.

4. SECURITY & DATA PRIVACY: The platform will protect merchant database assets, catalog listings, and custom styling. The platform is not responsible for off-site customer disputes.`}
                </div>
              </div>

              {/* Signature Canvas Drawing Area */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground text-left">Digitized Signature Canvas *</label>
                <div className="border border-border rounded-xl p-3 bg-muted/20 relative">
                  <canvas
                    ref={sigCanvasRef}
                    width={500}
                    height={150}
                    onMouseDown={startDrawingSig}
                    onMouseMove={drawSig}
                    onMouseUp={stopDrawingSig}
                    onMouseLeave={stopDrawingSig}
                    onTouchStart={startDrawingSig}
                    onTouchMove={drawSig}
                    onTouchEnd={stopDrawingSig}
                    className="w-full bg-white border border-border/80 rounded-lg cursor-crosshair touch-none"
                    style={{ height: '150px' }}
                  />
                  {isSignatureConfirmed && (
                    <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px] rounded-xl flex items-center justify-center border-2 border-emerald-500/30">
                      <span className="bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 animate-bounce">
                        <ShieldCheck className="w-4 h-4" /> Signature Locked
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground text-left">
                  👉 Use your finger (on mobile) or mouse drag to sign in the white box above, then click <strong>Confirm & Lock Signature</strong>.
                </p>
              </div>

              {/* Signature Confirm/Reset Actions */}
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={clearSig}
                  className="bg-muted hover:bg-muted/80 text-muted-foreground border px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Clear Pad
                </button>
                {!isSignatureConfirmed && (
                  <button
                    type="button"
                    onClick={handleConfirmSignature}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground px-4.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
                  >
                    Confirm & Lock Signature
                  </button>
                )}
              </div>
            </div>

            {/* Modal Footer Submit */}
            <div className="border-t pt-4 border-border/40 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="bg-muted hover:bg-muted/80 text-muted-foreground px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isSignatureConfirmed || uploading}
                onClick={handleSubmitSignedAgreement}
                className="bg-success hover:bg-success/95 text-white disabled:opacity-40 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-md"
              >
                {uploading ? 'Registering...' : 'Lock & Register Signature'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
