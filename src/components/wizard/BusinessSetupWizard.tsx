"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, CheckCircle2, Globe, FileText, Printer, Download, Edit3, Phone, Check, QrCode, Smartphone, Upload, Trash, X } from 'lucide-react';

export default function BusinessSetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Subscription Plan & Signature states
  const [selectedPlan, setSelectedPlan] = useState<'30' | '365' | 'lifetime'>('30');
  const [signature, setSignature] = useState<string | null>(null);
  const [isDrawingSig, setIsDrawingSig] = useState(false);
  const [isSignatureConfirmed, setIsSignatureConfirmed] = useState(false);
  const [assignedOfficer, setAssignedOfficer] = useState<any>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Payment states
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<string | null>(null);
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'app'>('qr');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim' | null>(null);
  const [isUpiSimulating, setIsUpiSimulating] = useState(false);
  const [upiSimulationStep, setUpiSimulationStep] = useState<number>(0);

  const [selectedTemplate, setSelectedTemplate] = useState<'minimal' | 'artisan' | 'bold' | 'luxe' | 'retro'>('minimal');

  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    category: '',
    logo: null,
    primaryColor: '#3B82F6',
    email: '',
    phone: '',
    currency: 'INR',
    authEmail: '',
    authPassword: '',
  });

  const [globalSettings, setGlobalSettings] = useState<any>(null);

  // Pre-select template from URL query parameters if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tempParam = params.get('template');
      if (tempParam === 'minimal' || tempParam === '1') {
        setSelectedTemplate('minimal');
        setFormData(prev => ({ ...prev, primaryColor: '#000000' }));
      } else if (tempParam === 'artisan' || tempParam === '2') {
        setSelectedTemplate('artisan');
        setFormData(prev => ({ ...prev, primaryColor: '#8B5A2B' }));
      } else if (tempParam === 'bold' || tempParam === '3') {
        setSelectedTemplate('bold');
        setFormData(prev => ({ ...prev, primaryColor: '#E11D48' }));
      } else if (tempParam === 'luxe' || tempParam === '4') {
        setSelectedTemplate('luxe');
        setFormData(prev => ({ ...prev, primaryColor: '#D4AF37' }));
      } else if (tempParam === 'retro' || tempParam === '5') {
        setSelectedTemplate('retro');
        setFormData(prev => ({ ...prev, primaryColor: '#8B5CF6' }));
      }
    }
  }, []);

  // Fetch SaaS settings on mount
  useEffect(() => {
    const loadGlobalSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('description')
          .eq('subdomain', '__creva_saas_global_settings__')
          .maybeSingle();

        if (data && data.description) {
          const parsed = JSON.parse(data.description);
          setGlobalSettings(parsed);

          // Seed local storage with these global settings so print/agreement windows can access them
          if (parsed.brandName) localStorage.setItem('saas_brand_name', parsed.brandName);
          if (parsed.brandLogo) localStorage.setItem('saas_brand_logo', parsed.brandLogo);
          if (parsed.officers) localStorage.setItem('saas_licensing_officers', JSON.stringify(parsed.officers));
          if (parsed.agreementTemplate) localStorage.setItem('saas_agreement_template', parsed.agreementTemplate);
        }
      } catch (err) {
        console.error("Failed to load global SaaS settings from DB:", err);
      }
    };
    loadGlobalSettings();
  }, []);

  // Randomly assign one of 4 licensing officers when step 5 is active
  useEffect(() => {
    if (step === 5 && !assignedOfficer) {
      let officersList = [
        { id: 1, name: 'Kavin Kumar', title: 'Senior Licensing Officer', signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50" viewBox="0 0 150 50"><text x="10" y="35" font-family="Brush Script MT, cursive, sans-serif" font-size="28" fill="%230f172a">Kavin Kumar</text></svg>' },
        { id: 2, name: 'Abhishek Sharma', title: 'Executive Officer - Creva', signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50" viewBox="0 0 150 50"><text x="10" y="35" font-family="Brush Script MT, cursive, sans-serif" font-size="28" fill="%230f172a">Abhishek S.</text></svg>' },
        { id: 3, name: 'Preethi Rajan', title: 'Licensing Director', signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50" viewBox="0 0 150 50"><text x="10" y="35" font-family="Brush Script MT, cursive, sans-serif" font-size="28" fill="%230f172a">Preethi R.</text></svg>' },
        { id: 4, name: 'Sanjay Sen', title: 'Registrar of Merchants', signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50" viewBox="0 0 150 50"><text x="10" y="35" font-family="Brush Script MT, cursive, sans-serif" font-size="28" fill="%230f172a">Sanjay Sen</text></svg>' }
      ];

      if (globalSettings?.officers && globalSettings.officers.length > 0) {
        officersList = globalSettings.officers;
      } else if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('saas_licensing_officers');
        if (saved) {
          try {
            officersList = JSON.parse(saved);
          } catch (e) {}
        }
      }

      // Filter to only select officers who have a custom stamp/signature uploaded
      const officersWithStamp = officersList.filter(o => o.signature && o.signature.trim().length > 0);
      const finalSelectionList = officersWithStamp.length > 0 ? officersWithStamp : officersList;

      const random = finalSelectionList[Math.floor(Math.random() * finalSelectionList.length)];
      setAssignedOfficer(random);
    }
  }, [step, assignedOfficer, globalSettings]);

  // Canvas digital signature pad logic - Init once on step 5 mount
  useEffect(() => {
    if (step === 5) {
      const timer = setTimeout(() => {
        const canvas = sigCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Set pure white background for crisp, high-contrast, professional look when printed/downloaded
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const nextStep = () => {
    if (step === 5) {
      if (!signature || !isSignatureConfirmed) {
        alert("⚠️ Please digitally sign the SaaS agreement and click 'Confirm & Lock Signature' below the canvas to proceed!");
        return;
      }
      if (!paymentScreenshotUrl) {
        alert("⚠️ Please pay via scan QR code or UPI app, and upload your payment screenshot to proceed!");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 6));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const startDrawingSig = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawingSig(true);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Scale coordinates accurately to internal canvas dimension mapping
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

    // Scale coordinates accurately to internal canvas dimension mapping
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawingSig = () => {
    setIsDrawingSig(false);
  };

  const confirmSig = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setSignature(dataUrl);
      setIsSignatureConfirmed(true);
      alert("✅ Digital signature captured and locked successfully!");
    } else {
      alert("⚠️ Error capturing signature. Please try drawing again.");
    }
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

  const handleScreenshotFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("⚠️ Screenshot image is too large! Please choose a file under 5MB.");
        return;
      }
      await uploadScreenshot(file);
    }
  };

  const uploadScreenshot = async (file: File) => {
    setScreenshotUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `payment-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `payment-screenshots/${fileName}`;

      let publicUrl = '';
      
      // Try to upload to assets storage bucket first
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

      setPaymentScreenshotUrl(publicUrl);

      // Also set preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);

    } catch (err: any) {
      console.error("Storage upload failed, falling back to base64 encoding", err);
      // Base64 fallback if storage bucket has issue
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentScreenshot(reader.result as string);
        setPaymentScreenshotUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setScreenshotUploading(false);
    }
  };

  const handleSimulateUpiApp = (appName: 'gpay' | 'phonepe' | 'paytm' | 'bhim') => {
    // 1. Generate real UPI deep link!
    const upiId = globalSettings?.platformUpi || 'creva@ybl';
    const planAmount = selectedPlan === '30' ? '499' : selectedPlan === '365' ? '3999' : '9999';
    const merchantName = globalSettings?.brandName || 'StoreBuilder';
    const upiIntent = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${planAmount}&cu=INR`;

    // 2. If user is on a mobile device, try opening the real UPI deep link!
    if (typeof window !== 'undefined') {
      const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = upiIntent;
      } else {
        alert(`📲 Mobile Device Required:\nTo pay directly via ${appName === 'gpay' ? 'Mobile Payment' : appName === 'paytm' ? 'Paytm' : 'BHIM'}, please scan the QR Code on the left or open this page on your mobile device!`);
      }
    }
  };

  const handlePrintContract = () => {
    if (typeof window === 'undefined') return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const planLabel = selectedPlan === '30' ? '1 Month (30 Days)' :
                      selectedPlan === '365' ? '1 Year (365 Days)' : 'Lifetime Subscription';

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
          <title>Creva SaaS Storefront Agreement - ${formData.businessName}</title>
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
                <td>${formData.businessName}</td>
              </tr>
              <tr>
                <td class="label">Primary Subdomain</td>
                <td>${formData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.crevasolution.in</td>
              </tr>
              <tr>
                <td class="label">Contact Email</td>
                <td>${formData.email}</td>
              </tr>
              <tr>
                <td class="label">Contact Phone</td>
                <td>${formData.phone}</td>
              </tr>
              <tr>
                <td class="label">Subscription Tier</td>
                <td><span class="badge">${planLabel}</span></td>
              </tr>
              <tr>
                <td class="label">Date Signed</td>
                <td>${new Date().toLocaleDateString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Terms &amp; Conditions of Service</div>
            <div class="terms">
              ${(localStorage.getItem('saas_agreement_template') || '1. PROVISIONS OF SERVICE: The Creva E-Commerce SaaS platform grants the undersigned Merchant the license to operate an automated retail storefront website using our cloud architecture.\n2. PLAN RENEWALS: The Merchant understands that platform billing utilizes an inquiry activation system.')
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
              <div style="font-size: 11px; color: #64748b; margin-bottom: 5px;">Signed Digitally by Merchant</div>
              ${signature ? `<img class="sig-img" src="${signature}" alt="Merchant Signature" />` : '<div style="height: 70px;">[MISSING SIGNATURE]</div>'}
              <div style="font-size: 12px; font-weight: bold; border-top: 1px solid #cbd5e1; padding-top: 5px;">Merchant Signature</div>
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

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.authEmail,
        password: formData.authPassword,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create account. Please try again.');

      // 2. Create the store record with contract details and subscription expiry dates
      const subdomain = formData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      let expiryDate = null;
      const now = new Date();
      if (selectedPlan === '30') {
        expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (selectedPlan === '365') {
        expiryDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
      } // lifetime is null

      const contractDetails = {
        description: formData.businessDescription,
        contractSigned: true,
        contractSignedAt: new Date().toISOString(),
        contractSignature: signature,
        selectedPlan: selectedPlan,
        assignedOfficer: assignedOfficer,
        paymentScreenshotUrl: paymentScreenshotUrl,
        paymentStatus: 'pending', // Pending super admin verification
        selectedTemplate: selectedTemplate // Persisted storefront design template selection
      };

      const { error: storeError } = await supabase
        .from('stores')
        .insert([{
          owner_id: authData.user.id,
          store_name: formData.businessName,
          subdomain: subdomain,
          business_category: formData.category,
          description: JSON.stringify(contractDetails),
          primary_color: formData.primaryColor,
          currency: formData.currency,
          contact_email: formData.email,
          contact_phone: formData.phone,
          subscription_expires_at: expiryDate,
          custom_domain_enabled: false,
          is_paused: true // Started as paused until verified
        }]);

      if (storeError) throw storeError;

      // 3. Register the subdomain alias with Vercel automatically (runs securely on server-side)
      try {
        await fetch('/api/domains/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subdomain }),
        });
      } catch (domainErr) {
        console.error('Failed to register subdomain automatically on Vercel:', domainErr);
        // Continue transition since store record creation succeeded
      }

      // 4. Success! Redirect to dashboard
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 md:p-8 bg-card text-card-foreground rounded-xl sm:rounded-2xl shadow-xl border border-border/50 backdrop-blur-sm">
      {/* Progress Bar */}
      <div className="mb-8 relative">
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${((step - 1) / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="hidden md:flex justify-between mt-4 text-[10px] md:text-xs font-medium text-muted-foreground">
          <span className={step >= 1 ? "text-primary font-bold" : ""}>1. Business</span>
          <span className={step >= 2 ? "text-primary font-bold" : ""}>2. Branding</span>
          <span className={step >= 3 ? "text-primary font-bold" : ""}>3. Contact</span>
          <span className={step >= 4 ? "text-primary font-bold" : ""}>4. Preferences</span>
          <span className={step >= 5 ? "text-primary font-bold" : ""}>5. Plan & Contract</span>
          <span className={step >= 6 ? "text-primary font-bold" : ""}>6. Account</span>
        </div>
        <div className="flex md:hidden justify-between mt-3 text-[11px] font-black text-muted-foreground">
          <span>STEP {step} OF 6</span>
          <span className="text-primary uppercase tracking-wider font-extrabold">
            {step === 1 ? "Business Info" :
             step === 2 ? "Branding Design" :
             step === 3 ? "Contact Details" :
             step === 4 ? "Store Preferences" :
             step === 5 ? "Plan & Contract" : "Account Setup"}
          </span>
        </div>
      </div>

      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Tell us about your business</h2>
                <p className="text-muted-foreground">This information will be displayed on your storefront.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Business Name *</label>
                  <input 
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                    placeholder="e.g. Handmade Soaps Co."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select a category</option>
                    <option value="soap">Handmade Soap</option>
                    <option value="fashion">Fashion & Apparel</option>
                    <option value="food">Food & Beverages</option>
                    <option value="decor">Home Decor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea 
                    name="businessDescription"
                    value={formData.businessDescription}
                    onChange={handleChange}
                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                    placeholder="Tell your customers what makes your products special..."
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Design your brand & template</h2>
                <p className="text-muted-foreground">Select a high-end storefront template, upload your logo and customize your primary theme color.</p>
              </div>

              {/* Template Selection Section */}
              <div className="space-y-3">
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-wider">Choose Storefront Design Template</label>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[
                    { id: 'minimal', name: 'Minimal Elegance', defaultColor: '#000000', desc: 'Sleek luxury, high contrast, clean typography. Perfect for boutique brands.' },
                    { id: 'artisan', name: 'Artisan Craft', defaultColor: '#8B5A2B', desc: 'Warm cream tones, classical serif accents, hand-crafted organic feel.' },
                    { id: 'bold', name: 'Bold Commerce', defaultColor: '#E11D48', desc: 'Vibrant, thick-bordered grid layouts, chunky shadows, high-impact details.' },
                    { id: 'luxe', name: 'Dark Luxe', defaultColor: '#D4AF37', desc: 'Exclusive gold on pitch black premium layout. For luxury timepieces, jewelry and high-end accessories.' },
                    { id: 'retro', name: 'Retro Grid', defaultColor: '#8B5CF6', desc: 'Space-grotesk flat shadow neon theme. Heavy borders, nostalgic retro aesthetics.' }
                  ].map((tpl, idx) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(tpl.id as any);
                        setFormData(prev => ({ ...prev, primaryColor: tpl.defaultColor }));
                      }}
                      className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all relative ${
                        selectedTemplate === tpl.id
                          ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                          : 'border-border bg-card hover:bg-muted/30 hover:scale-[1.01]'
                      }`}
                    >
                      {selectedTemplate === tpl.id && (
                        <span className="absolute top-2.5 right-2.5 bg-primary text-primary-foreground rounded-full p-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">Template {idx + 1}</span>
                      <span className="text-sm font-black text-foreground mt-1">{tpl.name}</span>
                      <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed flex-1">{tpl.desc}</p>
                      
                      {/* Theme color hint circle */}
                      <div className="mt-3.5 flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: tpl.defaultColor }} />
                        Preset Active
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Logo</label>
                  <div className="border-2 border-dashed border-input rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    </div>
                    <p className="text-sm font-medium mb-1">Click to upload logo</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB. Square recommended.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="w-10 h-10 rounded-md border border-input cursor-pointer p-0" 
                    />
                    <input 
                      type="text" 
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring uppercase" 
                    />
                  </div>
                  
                  {/* Preset Quick Previews */}
                  <div className="mt-4 p-4 rounded-xl border border-border bg-background">
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2.5 tracking-wider">Store Button Preview</p>
                    <button 
                      type="button"
                      className="w-full py-2.5 px-4 font-medium transition-all uppercase text-[10px] font-black tracking-widest"
                      style={{ 
                        backgroundColor: formData.primaryColor,
                        color: selectedTemplate === 'luxe' || selectedTemplate === 'retro' ? '#000000' : '#FFFFFF',
                        borderRadius: selectedTemplate === 'minimal' || selectedTemplate === 'retro' ? '0px' : selectedTemplate === 'luxe' ? '2px' : selectedTemplate === 'artisan' ? '9999px' : '8px',
                        border: selectedTemplate === 'retro' ? '3px solid #000000' : selectedTemplate === 'bold' ? '2px solid #000000' : 'none',
                        boxShadow: selectedTemplate === 'retro' || selectedTemplate === 'bold' ? '3px 3px 0px 0px #000000' : 'none'
                      }}
                    >
                      {selectedTemplate === 'minimal' 
                        ? 'EXPLORE CATALOG' 
                        : selectedTemplate === 'artisan' 
                          ? 'Shop Handcrafted' 
                          : selectedTemplate === 'luxe'
                            ? 'DISCOVER LUXE'
                            : selectedTemplate === 'retro'
                              ? 'GO RETRO ⚡'
                              : 'ADD TO CART ⚡'
                      }
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">How can customers reach you?</h2>
                <p className="text-muted-foreground">Provide your contact details for customer support.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Support Email *</label>
                  <input 
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                    placeholder="support@yourstore.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number *</label>
                  <input 
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Store Preferences</h2>
                <p className="text-muted-foreground">Final details before we generate your store.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Currency *</label>
                  <select 
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                  </select>
                </div>
                <div className="pt-4 p-4 bg-muted/30 rounded-lg border border-border">
                  <h3 className="font-semibold text-sm mb-2">Your Subdomain</h3>
                  <div className="flex items-center">
                    <span className="font-mono text-sm bg-background border border-input rounded-l-md px-3 py-2 text-muted-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {formData.businessName ? formData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'your-store'}
                    </span>
                    <span className="font-mono text-sm bg-muted border border-l-0 border-input rounded-r-md px-3 py-2 text-muted-foreground">
                      .crevasolution.in
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-1">Subscription Plan & Digital Agreement</h2>
                <p className="text-muted-foreground text-sm">Select your subscription plan and digitally sign our storefront license agreement.</p>
              </div>

              {/* Sub Plans Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: '30', name: '1 Month Plan', price: `₹${globalSettings?.plan30Price || '499'}`, desc: 'Best for trial storefronts' },
                  { id: '365', name: '1 Year Plan', price: `₹${Number(globalSettings?.plan365Price || 3999).toLocaleString()}`, desc: 'Most popular for small shops' },
                  { id: 'lifetime', name: 'Lifetime Plan', price: `₹${Number(globalSettings?.planLifetimePrice || 9999).toLocaleString()}`, desc: 'Ultimate professional pack' }
                ].map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id as any)}
                    className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all relative ${
                      selectedPlan === plan.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    {selectedPlan === plan.id && (
                      <span className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground uppercase font-black tracking-wider">{plan.name}</span>
                    <span className="text-2xl font-black text-foreground mt-1.5">{plan.price}</span>
                    <span className="text-[10px] text-muted-foreground mt-2 leading-relaxed">{plan.desc}</span>
                  </button>
                ))}
              </div>

              {/* Inquiry Message Box */}
              <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 flex gap-3 text-xs leading-relaxed">
                <Phone className="w-4 h-4 shrink-0 text-blue-500 mt-0.5" />
                <div>
                  <strong className="block mb-0.5">Off-Platform Verification & Payment</strong>
                  After registering, our sales team will contact you directly via call or WhatsApp at <strong className="font-mono text-blue-900">{formData.phone || 'your phone number'}</strong> to activate your plan. No automatic credit card charges!
                </div>
              </div>

              {/* Legal Merchant Agreement Content */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-wider">Creva merchant licensing agreement</label>
                <div className="h-44 bg-muted/40 border border-border rounded-xl p-4 overflow-y-auto text-xs space-y-3 font-mono leading-relaxed text-muted-foreground text-justify shadow-inner">
                  <p className="font-bold text-foreground uppercase">1. SCOPE OF THE MERCHANT LICENSE</p>
                  <p>The Creva Platform grants the signing Merchant the right to operate an e-commerce storefront utilizing Creva's software architecture. Subscription activations are confirmed manually via our support verification team.</p>
                  <p className="font-bold text-foreground uppercase">2. COMPLIANCE & ACCEPTABLE USE POLICY</p>
                  <p>Merchant agrees to sell only products that comply with local guidelines. Selling illegal, counterfeit, or prohibited materials will result in immediate shop termination without any refunds.</p>
                  <p className="font-bold text-foreground uppercase">3. SUBSCRIPTION INQUIRY PAYMENT POLICY</p>
                  <p>Merchant agrees to pay the respective fees for the chosen tier. Expiry of the plan limits custom domains and features until renewed.</p>
                </div>
              </div>

              {/* Signature Canvas Drawing Area */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-primary" />
                    Draw your digital signature here *
                  </label>
                  {signature && (
                    <button
                      type="button"
                      onClick={handlePrintContract}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" />
                      Print / Download signed copy
                    </button>
                  )}
                </div>

                <div className="relative border border-input rounded-xl overflow-hidden shadow-sm">
                  <canvas
                    ref={sigCanvasRef}
                    width={500}
                    height={120}
                    onMouseDown={startDrawingSig}
                    onMouseMove={drawSig}
                    onMouseUp={stopDrawingSig}
                    onMouseLeave={stopDrawingSig}
                    onTouchStart={startDrawingSig}
                    onTouchMove={drawSig}
                    onTouchEnd={stopDrawingSig}
                    className="w-full h-[120px] bg-white cursor-crosshair touch-none"
                  />
                  
                  <div className="absolute right-3 bottom-3 flex gap-2">
                    <button
                      type="button"
                      onClick={clearSig}
                      className="bg-background border border-input hover:bg-muted text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                    >
                      Clear Pad
                    </button>
                    <button
                      type="button"
                      onClick={confirmSig}
                      className={`${
                        isSignatureConfirmed 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      } text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm flex items-center gap-1`}
                    >
                      {isSignatureConfirmed ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Signature Locked
                        </>
                      ) : (
                        'Confirm & Lock Signature'
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  👉 Use your finger (on mobile) or mouse drag to sign in the box above, then click <strong>Confirm & Lock Signature</strong>.
                </p>
              </div>

              {/* Dynamic Payment Verification Section (Reveals only after Signature Locked) */}
              <AnimatePresence>
                {isSignatureConfirmed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-border pt-6 mt-6 space-y-6 overflow-hidden"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-bounce" />
                        Onboarding Fee & License Payment
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Please pay the onboarding setup fee below to instantly register your business in paused state. Our admin team will verify it.
                      </p>
                    </div>

                    {/* Cost summary card */}
                    <div className="bg-muted/40 p-4 rounded-xl border border-border flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Plan Selected</span>
                        <span className="block text-sm font-bold text-foreground mt-0.5">
                          {selectedPlan === '30' ? '1 Month Plan' : selectedPlan === '365' ? '1 Year Plan' : 'Lifetime Plan'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Setup Price</span>
                        <span className="block text-xl font-black text-primary mt-0.5">
                          {selectedPlan === '30' ? '₹499' : selectedPlan === '365' ? '₹3,999' : '₹9,999'}
                        </span>
                      </div>
                    </div>

                    {/* Payment methods switchers */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('qr')}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          paymentMethod === 'qr'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        Scan UPI QR Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('app')}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          paymentMethod === 'app'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        Pay via UPI Apps
                      </button>
                    </div>

                    {/* QR Code Scan Area */}
                    {paymentMethod === 'qr' && (
                      <div className="p-6 bg-card border border-border rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-sm">
                        <div className="flex flex-col items-center gap-3 shrink-0">
                          {(() => {
                            const upiId = globalSettings?.platformUpi || 'creva@ybl';
                            const planAmount = selectedPlan === '30' 
                              ? (globalSettings?.plan30Price || '499') 
                              : selectedPlan === '365' 
                                ? (globalSettings?.plan365Price || '3999') 
                                : (globalSettings?.planLifetimePrice || '9999');
                            const merchantName = globalSettings?.brandName || 'StoreBuilder';
                            const upiIntent = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${planAmount}&cu=INR`;
                            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiIntent)}&margin=10`;

                            return (
                              <div className="bg-white p-3 rounded-xl border border-input shadow-inner relative group shrink-0">
                                <img 
                                  src={qrUrl} 
                                  alt="Real UPI Payment QR Code" 
                                  className="w-[150px] h-[150px] object-contain block transition-transform group-hover:scale-105 duration-300"
                                />
                                <div className="absolute inset-0 bg-black/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-[10px] text-foreground select-none">
                                  ⚡ SCAN TO PAY
                                </div>
                              </div>
                            );
                          })()}
                          <div className="text-center space-y-1">
                            <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest block">Merchant VPA UPI ID</span>
                            <span className="inline-block text-[11px] font-black font-mono bg-muted text-foreground border border-border px-3 py-1 rounded-xl shadow-sm select-all">
                              {globalSettings?.platformUpi || 'creva@ybl'}
                            </span>
                          </div>
                        </div>
 
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-foreground block text-left">How to pay via QR Code:</span>
                          <ol className="text-xs text-muted-foreground list-decimal pl-4 space-y-1.5 leading-relaxed text-left">
                            <li>Open Google Pay, PhonePe, Paytm, or any banking App on your mobile.</li>
                            <li>Scan the QR code displayed on the left or send to VPA ID: <strong className="text-primary font-mono select-all bg-muted/60 px-1.5 py-0.5 rounded border border-border">{globalSettings?.platformUpi || 'creva@ybl'}</strong></li>
                            <li>Pay the designated plan amount (<strong className="text-primary font-mono">{selectedPlan === '30' ? `₹${globalSettings?.plan30Price || '499'}` : selectedPlan === '365' ? `₹${Number(globalSettings?.plan365Price || 3999).toLocaleString()}` : `₹${Number(globalSettings?.planLifetimePrice || 9999).toLocaleString()}`}</strong>).</li>
                            <li>Take a clear screenshot of the transaction success page.</li>
                            <li>Upload the screenshot in the dropzone below to proceed.</li>
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* UPI App Selection Area */}
                    {paymentMethod === 'app' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { 
                            id: 'gpay', 
                            name: 'Mobile Payment', 
                            color: 'hover:border-indigo-500 hover:bg-indigo-500/5', 
                            icon: (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 shrink-0">
                                <rect width="24" height="24" rx="6" fill="#6366f1" />
                                <rect x="8" y="4" width="8" height="16" rx="2" stroke="#ffffff" strokeWidth="1.5" fill="none" />
                                <circle cx="12" cy="17" r="0.75" fill="#ffffff" />
                                <path d="M10 8h4M10 11h4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M10 14h2" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            ) 
                          },
                          { 
                            id: 'paytm', 
                            name: 'Paytm Wallet', 
                            color: 'hover:border-sky-500 hover:bg-sky-500/5', 
                            icon: (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 shrink-0">
                                <rect width="24" height="24" rx="6" fill="#002e6e" />
                                <text x="12" y="15" fill="#00baf2" fontStyle="italic" fontWeight="bold" fontSize="9" textAnchor="middle" fontFamily="sans-serif">paytm</text>
                              </svg>
                            ) 
                          },
                          { 
                            id: 'bhim', 
                            name: 'BHIM UPI', 
                            color: 'hover:border-orange-500 hover:bg-orange-500/5', 
                            icon: (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 shrink-0">
                                <rect width="24" height="24" rx="6" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                                <path d="M6 10l6-6 6 6-6 6-6-6z" fill="#097939" />
                                <path d="M12 4l6 6-6 6V4z" fill="#ed1c24" />
                                <text x="12" y="14" fill="#ffffff" fontWeight="black" fontSize="5" textAnchor="middle" fontFamily="sans-serif">BHIM</text>
                              </svg>
                            ) 
                          }
                        ].map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => handleSimulateUpiApp(app.id as any)}
                            className={`flex items-center gap-3.5 p-4 rounded-2xl border border-border bg-card text-left text-xs font-bold transition-all hover:scale-102 hover:shadow-md ${app.color}`}
                          >
                            <div className="shrink-0">{app.icon}</div>
                            <div>
                              <span className="block font-bold text-foreground text-[13px]">{app.name}</span>
                              <span className="text-[10px] text-muted-foreground font-normal block mt-0.5">Pay directly via instant deep link</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Screenshot Upload Dropzone */}
                    <div className="space-y-2.5">
                      <label className="block text-xs font-black text-muted-foreground uppercase tracking-wider">
                        Upload Successful Payment Screenshot *
                      </label>

                      {!paymentScreenshot ? (
                        <div className="relative border-2 border-dashed border-input rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors animate-fade-in">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={screenshotUploading}
                          />
                          {screenshotUploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-10 h-10 animate-spin text-primary" />
                              <p className="text-sm font-semibold">Uploading to secure storage...</p>
                            </div>
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
                                <Upload className="w-6 h-6" />
                              </div>
                              <p className="text-xs font-medium mb-0.5">Click or drag payment screenshot to upload</p>
                              <p className="text-[10px] text-muted-foreground">PNG, JPG, JPEG up to 5MB</p>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted shrink-0 shadow-inner">
                              <img
                                src={paymentScreenshot}
                                alt="Payment Screenshot"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="block text-xs font-bold text-foreground truncate">Screenshot Attached</span>
                              <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <Check className="w-3 h-3" />
                                Saved successfully
                              </span>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentScreenshot(null);
                              setPaymentScreenshotUrl(null);
                            }}
                            className="p-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors border border-destructive/20"
                            title="Remove Screenshot"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>


            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
                <p className="text-muted-foreground">Last step! Set up your login for the admin panel.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <input 
                    type="email"
                    name="authEmail"
                    value={formData.authEmail}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input 
                    type="password"
                    name="authPassword"
                    value={formData.authPassword}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-destructive/10 text-destructive text-xs rounded-md border border-destructive/20 animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-border flex justify-between">
        <button
          onClick={prevStep}
          disabled={step === 1 || loading}
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          Back
        </button>
        {step < 6 ? (
          <button
            onClick={nextStep}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-md bg-success px-8 text-sm font-medium text-primary-foreground shadow hover:bg-success/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Store...
              </>
            ) : (
              <>
                Create My Store ✨
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
