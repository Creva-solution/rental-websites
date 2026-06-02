'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, Globe, ShieldAlert, ShieldCheck, Play, Pause, 
  Search, RefreshCw, Copy, Check, Database, HelpCircle,
  Infinity, Calendar, Clock, Zap, Plus, FileText, X, Printer, Send, Upload, Trash2, Smartphone, Layers
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [newStoreAlert, setNewStoreAlert] = useState<any>(null);
  const [knownPendingCount, setKnownPendingCount] = useState<number | null>(null);

  const playNotificationChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // First note: G5 (783.99 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime);
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);
      
      // Second note: C6 (1046.50 Hz) - delayed
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Audio Context failed to play chime:", e);
    }
  };

  // States for Invoicing and Brand settings
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [billPlan, setBillPlan] = useState<string>('90');
  const [billPrice, setBillPrice] = useState<string>('1299');
  const [brandName, setBrandName] = useState<string>('Creva Webzz');
  const [brandLogo, setBrandLogo] = useState<string>('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80');
  const [platformUpi, setPlatformUpi] = useState<string>('creva@ybl');
  const [plan30Price, setPlan30Price] = useState<string>('499');
  const [plan365Price, setPlan365Price] = useState<string>('3999');
  const [planLifetimePrice, setPlanLifetimePrice] = useState<string>('9999');
  const [customDomainUnlockPrice, setCustomDomainUnlockPrice] = useState<string>('1499');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [modalTab, setModalTab] = useState<'billing' | 'profile' | 'contract' | 'payment'>('billing');
  
  // Advanced filters and branding dashboard states
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isBrandingOpen, setIsBrandingOpen] = useState<boolean>(false);
  const [activeSettingTab, setActiveSettingTab] = useState<'branding' | 'pricing' | 'officers' | 'agreement' | 'templates'>('branding');

  // Custom storefront templates thumbnail state
  const [templateThumbnails, setTemplateThumbnails] = useState<Record<string, string>>({
    minimal: '',
    artisan: '',
    bold: '',
    luxe: '',
    retro: ''
  });

  // Custom subscription packages states
  const [customPackages, setCustomPackages] = useState<any[]>([]);
  const [disabledDefaultPackages, setDisabledDefaultPackages] = useState<string[]>([]);
  const [newPkgName, setNewPkgName] = useState<string>('');
  const [newPkgDuration, setNewPkgDuration] = useState<string>('3');
  const [newPkgDurationType, setNewPkgDurationType] = useState<'day' | 'month' | 'year'>('month');
  const [newPkgPrice, setNewPkgPrice] = useState<string>('');

  // States for Image Cropping tool
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 4 Licensing Officers States
  const [officers, setOfficers] = useState<any[]>([
    { id: 1, name: 'Kavin Kumar', title: 'Senior Licensing Officer', signature: '' },
    { id: 2, name: 'Abhishek Sharma', title: 'Executive Officer - Creva', signature: '' },
    { id: 3, name: 'Preethi Rajan', title: 'Licensing Director', signature: '' },
    { id: 4, name: 'Sanjay Sen', title: 'Registrar of Merchants', signature: '' }
  ]);

  // Agreement Template state
  const defaultTemplate = `1. PROVISIONS OF SERVICE: The Creva E-Commerce SaaS platform grants the undersigned Merchant the license to operate an automated retail storefront website using our cloud architecture. Custom domain mappings are active permissions subject to the subscription plan level.

2. PLAN RENEWALS & INQUIRY SYSTEM: The Merchant understands that platform billing utilizes an inquiry activation system. Upon plan expiration, storefront access may be suspended unless renewed by contacting the support sales team directly.

3. ACCEPTABLE USAGE & LEGAL LIMITS: The Merchant agrees to list only legally compliant goods. Sales of prohibited, illegal, counterfeited, or unauthorized products will lead to instant termination of this license without refund.

4. SECURITY & DATA PRIVACY: The platform will protect merchant database assets, catalog listings, and custom styling. The platform is not responsible for off-site customer disputes.`;
  const [agreementTemplate, setAgreementTemplate] = useState<string>(defaultTemplate);

  useEffect(() => {
    const savedBrand = localStorage.getItem('saas_brand_name');
    const savedLogo = localStorage.getItem('saas_brand_logo');
    const savedOfficers = localStorage.getItem('saas_licensing_officers');
    const savedTemplate = localStorage.getItem('saas_agreement_template');
    const savedPlan30 = localStorage.getItem('saas_plan_30_price');
    const savedPlan365 = localStorage.getItem('saas_plan_365_price');
    const savedPlanLifetime = localStorage.getItem('saas_plan_lifetime_price');
    const savedCustomDomainUnlock = localStorage.getItem('saas_custom_domain_unlock_price');
    const savedTemplateThumbnails = localStorage.getItem('saas_template_thumbnails');
    const savedCustomPackages = localStorage.getItem('saas_custom_packages');
    const savedDisabledDefaultPlans = localStorage.getItem('saas_disabled_default_packages');

    if (savedBrand) setBrandName(savedBrand);
    if (savedLogo) setBrandLogo(savedLogo);
    if (savedOfficers) {
      try { setOfficers(JSON.parse(savedOfficers)); } catch (e) {}
    }
    if (savedTemplate) setAgreementTemplate(savedTemplate);
    if (savedPlan30) setPlan30Price(savedPlan30);
    if (savedPlan365) setPlan365Price(savedPlan365);
    if (savedPlanLifetime) setPlanLifetimePrice(savedPlanLifetime);
    if (savedCustomDomainUnlock) setCustomDomainUnlockPrice(savedCustomDomainUnlock);
    if (savedTemplateThumbnails) {
      try { setTemplateThumbnails(JSON.parse(savedTemplateThumbnails)); } catch (e) {}
    }
    if (savedCustomPackages) {
      try { setCustomPackages(JSON.parse(savedCustomPackages)); } catch (e) {}
    }
    if (savedDisabledDefaultPlans) {
      try { setDisabledDefaultPackages(JSON.parse(savedDisabledDefaultPlans)); } catch (e) {}
    }
  }, []);

  // Handle officer stamp image upload
  const handleOfficerStampUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      alert('⚠️ Stamp image too large. Please upload under 1.5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const updated = [...officers];
        updated[index].signature = ev.target.result as string;
        setOfficers(updated);
        setActionStatus('Stamp uploaded for ' + updated[index].name + '!');
        setTimeout(() => setActionStatus(null), 2500);
      }
    };
    reader.readAsDataURL(file);
  };

  // HTML5 Canvas cropping renderer (renders full view background + highlighted circle crop overlay)
  useEffect(() => {
    if (!rawImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = rawImage;
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw dark indicator background
      ctx.fillStyle = "#0c101b"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const center = canvas.width / 2;
      const cropRadius = center * 0.75; // 75% of the radius is the cropping circular frame

      // Calculate sizes maintaining aspect ratio
      const aspectRatio = img.width / img.height;
      let drawWidth = canvas.width * cropZoom;
      let drawHeight = canvas.height * cropZoom;

      if (aspectRatio > 1) {
        drawWidth = canvas.height * aspectRatio * cropZoom;
      } else {
        drawHeight = (canvas.width / aspectRatio) * cropZoom;
      }
      
      const dx = (canvas.width - drawWidth) / 2 + cropX;
      const dy = (canvas.height - drawHeight) / 2 + cropY;

      // 1. Draw entire logo normally but with transparent dimmed background opacity
      ctx.globalAlpha = 0.25;
      ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
      ctx.globalAlpha = 1.0; // Reset opacity

      // 2. Clip the central frame so we draw the 100% visible active crop inside
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, cropRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw the highlighted crop area
      ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
      ctx.restore();

      // 3. Draw a glowing circular boundary line
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(center, center, cropRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Draw a subtle dashed grid/crosshair inside the crop area
      ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      
      // Horizontal crosshair line
      ctx.beginPath();
      ctx.moveTo(center - cropRadius, center);
      ctx.lineTo(center + cropRadius, center);
      ctx.stroke();

      // Vertical crosshair line
      ctx.beginPath();
      ctx.moveTo(center, center - cropRadius);
      ctx.lineTo(center, center + cropRadius);
      ctx.stroke();

      ctx.setLineDash([]); // Reset dashed lines
    };
  }, [rawImage, cropZoom, cropX, cropY]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropX, y: e.clientY - cropY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setCropX(e.clientX - dragStart.x);
    setCropY(e.clientY - dragStart.y);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - cropX, y: touch.clientY - cropY });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setCropX(touch.clientX - dragStart.x);
    setCropY(touch.clientY - dragStart.y);
  };

  const handleApplyCrop = () => {
    if (!canvasRef.current || !rawImage) return;

    // Create a high-quality temporary offscreen canvas to capture ONLY the clipped circle region
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 200;
    exportCanvas.height = 200;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    const img = new Image();
    img.src = rawImage;
    img.onload = () => {
      // Circular crop clip on the export canvas
      const radius = 100;
      exportCtx.beginPath();
      exportCtx.arc(radius, radius, radius, 0, Math.PI * 2);
      exportCtx.closePath();
      exportCtx.clip();

      // Map dynamic offsets from interactive 220px canvas to 200px square frame
      // Interactive canvas crop circle radius is 75% of half-width (110 * 0.75 = 82.5px)
      const interactiveRadius = 220 / 2;
      const interactiveCropRadius = interactiveRadius * 0.75;
      const scale = 100 / interactiveCropRadius;

      const aspectRatio = img.width / img.height;
      let drawWidth = 220 * cropZoom;
      let drawHeight = 220 * cropZoom;

      if (aspectRatio > 1) {
        drawWidth = 220 * aspectRatio * cropZoom;
      } else {
        drawHeight = (220 / aspectRatio) * cropZoom;
      }

      const exportDrawWidth = drawWidth * scale;
      const exportDrawHeight = drawHeight * scale;
      
      const dx = (200 - exportDrawWidth) / 2 + (cropX * scale);
      const dy = (200 - exportDrawHeight) / 2 + (cropY * scale);

      exportCtx.drawImage(img, dx, dy, exportDrawWidth, exportDrawHeight);

      const croppedUrl = exportCanvas.toDataURL('image/png');
      setBrandLogo(croppedUrl);
      setRawImage(null); // Close crop panel modal
      setActionStatus("Logo cropped successfully!");
      setTimeout(() => setActionStatus(null), 2000);
    };
  };

  const handleOpenBilling = (store: any) => {
    setSelectedStore(store);
    setInvoiceNumber(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
    setBillPlan('90');
    setBillPrice('1299');
    setModalTab('billing');
  };

  const persistPackages = async (updatedPackages: any[], updatedDisabledDefaults: string[]) => {
    setCustomPackages(updatedPackages);
    setDisabledDefaultPackages(updatedDisabledDefaults);
    localStorage.setItem('saas_custom_packages', JSON.stringify(updatedPackages));
    localStorage.setItem('saas_disabled_default_packages', JSON.stringify(updatedDisabledDefaults));

    try {
      const settingsData = {
        brandName,
        brandLogo,
        officers,
        agreementTemplate,
        platformUpi,
        plan30Price,
        plan365Price,
        planLifetimePrice,
        customDomainUnlockPrice,
        templateThumbnails,
        customPackages: updatedPackages,
        disabledDefaultPackages: updatedDisabledDefaults
      };

      // Check if global settings row exists in Supabase
      const { data: existingRow } = await supabase
        .from('stores')
        .select('id')
        .eq('subdomain', '__creva_saas_global_settings__')
        .maybeSingle();

      if (existingRow) {
        await supabase
          .from('stores')
          .update({
            description: JSON.stringify(settingsData)
          })
          .eq('subdomain', '__creva_saas_global_settings__');
      } else {
        const { data: authData } = await supabase.auth.getUser();
        await supabase
          .from('stores')
          .insert([{
            owner_id: authData?.user?.id || null,
            store_name: 'Creva SaaS Settings',
            subdomain: '__creva_saas_global_settings__',
            business_category: 'SaaS Config',
            description: JSON.stringify(settingsData),
            primary_color: '#3B82F6',
            currency: 'INR',
            custom_domain_enabled: false
          }]);
      }
    } catch (err: any) {
      console.error("Autosave custom packages failed:", err);
    }
  };

  const handleAddCustomPackage = () => {
    if (!newPkgName.trim() || !newPkgPrice.trim()) {
      alert("⚠️ Please provide both package name and price.");
      return;
    }
    
    const days = newPkgDurationType === 'day' 
      ? Number(newPkgDuration) 
      : newPkgDurationType === 'month' 
        ? Number(newPkgDuration) * 30 
        : Number(newPkgDuration) * 365;

    if (isNaN(days) || days <= 0) {
      alert("⚠️ Please enter a valid duration.");
      return;
    }

    const newPkg = {
      id: `plan_custom_${Date.now()}`,
      name: newPkgName,
      duration: Number(newPkgDuration),
      durationType: newPkgDurationType,
      days: days,
      price: newPkgPrice
    };

    const updated = [...customPackages, newPkg];
    persistPackages(updated, disabledDefaultPackages);

    setNewPkgName('');
    setNewPkgPrice('');
    setActionStatus('Custom subscription package created!');
    setTimeout(() => setActionStatus(null), 2500);
  };

  const handleDeleteCustomPackage = (id: string) => {
    const updated = customPackages.filter(p => p.id !== id);
    persistPackages(updated, disabledDefaultPackages);
    setActionStatus('Custom package deleted.');
    setTimeout(() => setActionStatus(null), 2500);
  };

  const handleSaveBrandSettings = async () => {
    setActionStatus('Saving settings to cloud...');
    try {
      localStorage.setItem('saas_brand_name', brandName);
      localStorage.setItem('saas_brand_logo', brandLogo);
      localStorage.setItem('saas_licensing_officers', JSON.stringify(officers));
      localStorage.setItem('saas_agreement_template', agreementTemplate);
      localStorage.setItem('saas_platform_upi', platformUpi);
      localStorage.setItem('saas_plan_30_price', plan30Price);
      localStorage.setItem('saas_plan_365_price', plan365Price);
      localStorage.setItem('saas_plan_lifetime_price', planLifetimePrice);
      localStorage.setItem('saas_custom_domain_unlock_price', customDomainUnlockPrice);
      localStorage.setItem('saas_template_thumbnails', JSON.stringify(templateThumbnails));
      localStorage.setItem('saas_custom_packages', JSON.stringify(customPackages));
      localStorage.setItem('saas_disabled_default_packages', JSON.stringify(disabledDefaultPackages));

      const settingsData = {
        brandName,
        brandLogo,
        officers,
        agreementTemplate,
        platformUpi,
        plan30Price,
        plan365Price,
        planLifetimePrice,
        customDomainUnlockPrice,
        templateThumbnails,
        customPackages,
        disabledDefaultPackages
      };

      // Check if global settings row exists
      const { data: existingRow } = await supabase
        .from('stores')
        .select('id')
        .eq('subdomain', '__creva_saas_global_settings__')
        .maybeSingle();

      if (existingRow && existingRow.id) {
        const { error } = await supabase
          .from('stores')
          .update({
            store_name: 'Creva SaaS Settings',
            description: JSON.stringify(settingsData)
          })
          .eq('id', existingRow.id);
        if (error) throw error;
      } else {
        const { data: authData } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('stores')
          .insert([{
            owner_id: authData?.user?.id || null,
            store_name: 'Creva SaaS Settings',
            subdomain: '__creva_saas_global_settings__',
            business_category: 'SaaS Config',
            description: JSON.stringify(settingsData),
            primary_color: '#3B82F6',
            currency: 'INR',
            custom_domain_enabled: false
          }]);
        if (error) throw error;
      }

      setActionStatus('Settings saved to database!');
      setTimeout(() => setActionStatus(null), 2500);
    } catch (err: any) {
      console.error("Error syncing brand settings:", err);
      alert(`⚠️ Cloud sync failed: ${err.message}. Saved locally as fallback.`);
      setActionStatus(null);
    }
  };

  const handlePrintContractForStore = (storeData: any, contractData: any) => {
    if (!contractData || typeof window === 'undefined') return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const planLabel = contractData.selectedPlan === '30' ? '1 Month (30 Days)' :
                      contractData.selectedPlan === '365' ? '1 Year (365 Days)' : 'Lifetime Subscription';

    const assignedOfficer = contractData.assignedOfficer;
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
          <title>Creva SaaS Storefront Agreement - ${storeData.store_name}</title>
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
                <td>${storeData.store_name}</td>
              </tr>
              <tr>
                <td class="label">Primary Subdomain</td>
                <td>${storeData.subdomain}.crevasolution.in</td>
              </tr>
              <tr>
                <td class="label">Contact Email</td>
                <td>${storeData.contact_email || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Contact Phone</td>
                <td>${storeData.contact_phone || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Subscription Tier</td>
                <td><span class="badge">${planLabel}</span></td>
              </tr>
              <tr>
                <td class="label">Date Signed</td>
                <td>${contractData.contractSignedAt ? new Date(contractData.contractSignedAt).toLocaleDateString('en-IN') : 'N/A'}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Terms &amp; Conditions of Service</div>
            <div class="terms">
              ${(localStorage.getItem('saas_agreement_template') || defaultTemplate)
                .split('\n')
                .filter((line: string) => line.trim())
                .map((para: string) => `<p>${para.trim().replace(/&/g, '&amp;')}</p>`)
                .join('\n')}
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
              ${contractData.contractSignature ? `<img class="sig-img" src="${contractData.contractSignature}" alt="Merchant Signature" />` : '<div style="height: 70px;">[MISSING SIGNATURE]</div>'}
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) {
        alert("⚠️ Logo image size is too large! Please choose a file under 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRawImage(event.target.result as string);
          setCropZoom(1);
          setCropX(0);
          setCropY(0);
          setActionStatus("Logo loaded. Please adjust crop!");
          setTimeout(() => setActionStatus(null), 2000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // SQL code for setting up custom columns in Supabase
  const sqlCommand = `-- Run this in your Supabase SQL Editor to add the new management columns:
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS custom_domain_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;`;

  const fetchStores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allRows = data || [];
      const globalSettingsRow = allRows.find((s: any) => s.subdomain === '__creva_saas_global_settings__');
      if (globalSettingsRow && globalSettingsRow.description) {
        try {
          const parsed = JSON.parse(globalSettingsRow.description);
          if (parsed.brandName) {
            setBrandName(parsed.brandName);
            localStorage.setItem('saas_brand_name', parsed.brandName);
          }
          if (parsed.brandLogo) {
            setBrandLogo(parsed.brandLogo);
            localStorage.setItem('saas_brand_logo', parsed.brandLogo);
          }
          if (parsed.officers) {
            setOfficers(parsed.officers);
            localStorage.setItem('saas_licensing_officers', JSON.stringify(parsed.officers));
          }
          if (parsed.agreementTemplate) {
            setAgreementTemplate(parsed.agreementTemplate);
            localStorage.setItem('saas_agreement_template', parsed.agreementTemplate);
          }
          if (parsed.platformUpi) {
            setPlatformUpi(parsed.platformUpi);
            localStorage.setItem('saas_platform_upi', parsed.platformUpi);
          }
          if (parsed.plan30Price) {
            setPlan30Price(parsed.plan30Price);
            localStorage.setItem('saas_plan_30_price', parsed.plan30Price);
          }
          if (parsed.plan365Price) {
            setPlan365Price(parsed.plan365Price);
            localStorage.setItem('saas_plan_365_price', parsed.plan365Price);
          }
          if (parsed.planLifetimePrice) {
            setPlanLifetimePrice(parsed.planLifetimePrice);
            localStorage.setItem('saas_plan_lifetime_price', parsed.planLifetimePrice);
          }
          if (parsed.customDomainUnlockPrice) {
            setCustomDomainUnlockPrice(parsed.customDomainUnlockPrice);
            localStorage.setItem('saas_custom_domain_unlock_price', parsed.customDomainUnlockPrice);
          }
          if (parsed.templateThumbnails) {
            setTemplateThumbnails(parsed.templateThumbnails);
            localStorage.setItem('saas_template_thumbnails', JSON.stringify(parsed.templateThumbnails));
          }
          if (parsed.customPackages) {
            setCustomPackages(parsed.customPackages);
            localStorage.setItem('saas_custom_packages', JSON.stringify(parsed.customPackages));
          }
          if (parsed.disabledDefaultPackages) {
            setDisabledDefaultPackages(parsed.disabledDefaultPackages);
            localStorage.setItem('saas_disabled_default_packages', JSON.stringify(parsed.disabledDefaultPackages));
          }
        } catch (e) {
          console.error("Failed to parse global settings from DB:", e);
        }
      }

      const activeMerchantStores = allRows.filter((s: any) => s.subdomain !== '__creva_saas_global_settings__');
      setStores(activeMerchantStores);
      
      const pendingStoresCount = activeMerchantStores.filter((s: any) => {
        try {
          if (s.description && s.description.trim().startsWith('{')) {
            const parsed = JSON.parse(s.description);
            return parsed.paymentStatus === 'pending';
          }
        } catch (e) {}
        return false;
      }).length;
      setKnownPendingCount(pendingStoresCount);
    } catch (err: any) {
      console.error('Error loading stores:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    // Polling interval to auto-refresh stores and check for pending verifications
    const interval = setInterval(async () => {
      try {
        const { data: latestStores } = await supabase
          .from('stores')
          .select('*')
          .order('created_at', { ascending: false });

        if (latestStores && Array.isArray(latestStores)) {
          const merchantStores = latestStores.filter((s: any) => s.subdomain !== '__creva_saas_global_settings__');
          
          // Count pending verifications
          const pendingStores = merchantStores.filter((s: any) => {
            try {
              if (s.description && s.description.trim().startsWith('{')) {
                const parsed = JSON.parse(s.description);
                return parsed.paymentStatus === 'pending';
              }
            } catch (e) {}
            return false;
          });

          if (knownPendingCount !== null && pendingStores.length > knownPendingCount) {
            // New pending verification request!
            const newPendingStore = pendingStores[0];
            setNewStoreAlert(newPendingStore);
            playNotificationChime();
          }

          setKnownPendingCount(pendingStores.length);
          setStores(merchantStores);
        }
      } catch (err) {
        console.warn("Real-time stores sync check failed:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [knownPendingCount]);

  const handleTogglePause = async (storeId: string, currentStatus: boolean) => {
    setActionStatus(`Updating store...`);
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('stores')
        .update({ is_paused: newStatus })
        .eq('id', storeId);

      if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          alert('⚠️ Columns missing! Please run the SQL command at the top of the dashboard in your Supabase SQL editor first.');
          return;
        }
        throw error;
      }

      setStores(stores.map(s => s.id === storeId ? { ...s, is_paused: newStatus } : s));
      setActionStatus(`Shop status updated successfully!`);
      setTimeout(() => setActionStatus(null), 3000);
    } catch (err: any) {
      alert(`Error updating store: ${err.message}`);
      setActionStatus(null);
    }
  };

  const handleToggleCustomDomain = async (storeId: string, currentStatus: boolean) => {
    setActionStatus(`Updating custom domain permission...`);
    try {
      const newStatus = currentStatus === false ? true : false;
      const { error } = await supabase
        .from('stores')
        .update({ custom_domain_enabled: newStatus })
        .eq('id', storeId);

      if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          alert('⚠️ Columns missing! Please run the SQL command at the top of the dashboard in your Supabase SQL editor first.');
          return;
        }
        throw error;
      }

      setStores(stores.map(s => s.id === storeId ? { ...s, custom_domain_enabled: newStatus } : s));
      setActionStatus(`Custom domain permission updated!`);
      setTimeout(() => setActionStatus(null), 3000);
    } catch (err: any) {
      alert(`Error updating domain permission: ${err.message}`);
      setActionStatus(null);
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedStore) return;
    let contract = null;
    try {
      contract = JSON.parse(selectedStore.description);
    } catch (e) {}
    if (!contract) return;

    setActionStatus("Verifying payment...");
    try {
      const updatedContract = {
        ...contract,
        paymentStatus: 'verified'
      };

      const { error: updateError } = await supabase
        .from('stores')
        .update({
          description: JSON.stringify(updatedContract),
          is_paused: false // Automatically activate the store when payment is verified!
        })
        .eq('id', selectedStore.id);

      if (updateError) throw updateError;

      // Update state
      const updatedStore = {
        ...selectedStore,
        description: JSON.stringify(updatedContract),
        is_paused: false
      };
      setSelectedStore(updatedStore);
      setStores(stores.map(s => s.id === selectedStore.id ? updatedStore : s));

      setActionStatus("Payment verified & Store activated!");
      setTimeout(() => setActionStatus(null), 2500);
      alert("Success: Payment verified. The storefront has been marked active and unpaused!");
    } catch (err: any) {
      console.error(err);
      alert(`Failed to verify payment: ${err.message}`);
      setActionStatus(null);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedStore) return;
    let contract = null;
    try {
      contract = JSON.parse(selectedStore.description);
    } catch (e) {}
    if (!contract) return;

    if (!confirm("Are you sure you want to REJECT this merchant's payment verification?")) return;

    setActionStatus("Rejecting payment...");
    try {
      const updatedContract = {
        ...contract,
        paymentStatus: 'rejected'
      };

      const { error: updateError } = await supabase
        .from('stores')
        .update({
          description: JSON.stringify(updatedContract),
          is_paused: true // Automatically lock/close the storefront when rejected!
        })
        .eq('id', selectedStore.id);

      if (updateError) throw updateError;

      // Update state
      const updatedStore = {
        ...selectedStore,
        description: JSON.stringify(updatedContract),
        is_paused: true
      };
      setSelectedStore(updatedStore);
      setStores(stores.map(s => s.id === selectedStore.id ? updatedStore : s));

      setActionStatus("Payment rejected & storefront locked!");
      setTimeout(() => setActionStatus(null), 2500);
      alert("Merchant payment rejected successfully. Storefront is locked and merchant is notified via their dashboard.");
    } catch (err: any) {
      console.error(err);
      alert(`Failed to reject payment: ${err.message}`);
      setActionStatus(null);
    }
  };

  const handleVerifyDomainPayment = async () => {
    if (!selectedStore) return;
    let contract = null;
    try {
      contract = JSON.parse(selectedStore.description);
    } catch (e) {}
    if (!contract) return;

    setActionStatus("Verifying domain payment...");
    try {
      const updatedContract = {
        ...contract,
        domainPaymentStatus: 'verified'
      };

      const { error: updateError } = await supabase
        .from('stores')
        .update({
          description: JSON.stringify(updatedContract),
          custom_domain_enabled: true // Unlock custom domain permission!
        })
        .eq('id', selectedStore.id);

      if (updateError) throw updateError;

      // Update state
      const updatedStore = {
        ...selectedStore,
        description: JSON.stringify(updatedContract),
        custom_domain_enabled: true
      };
      setSelectedStore(updatedStore);
      setStores(stores.map(s => s.id === selectedStore.id ? updatedStore : s));

      setActionStatus("Domain unlocked successfully!");
      setTimeout(() => setActionStatus(null), 2500);
      alert("Success: Custom Domain payment verified & features successfully unlocked!");
    } catch (err: any) {
      console.error(err);
      alert(`Failed to verify domain payment: ${err.message}`);
      setActionStatus(null);
    }
  };

  const handleRejectDomainPayment = async () => {
    if (!selectedStore) return;
    let contract = null;
    try {
      contract = JSON.parse(selectedStore.description);
    } catch (e) {}
    if (!contract) return;

    if (!confirm("Are you sure you want to REJECT this merchant's Custom Domain payment verification?")) return;

    setActionStatus("Rejecting domain payment...");
    try {
      const updatedContract = {
        ...contract,
        domainPaymentStatus: 'rejected'
      };

      const { error: updateError } = await supabase
        .from('stores')
        .update({
          description: JSON.stringify(updatedContract),
          custom_domain_enabled: false
        })
        .eq('id', selectedStore.id);

      if (updateError) throw updateError;

      // Update state
      const updatedStore = {
        ...selectedStore,
        description: JSON.stringify(updatedContract),
        custom_domain_enabled: false
      };
      setSelectedStore(updatedStore);
      setStores(stores.map(s => s.id === selectedStore.id ? updatedStore : s));

      setActionStatus("Domain payment rejected!");
      setTimeout(() => setActionStatus(null), 2500);
      alert("Merchant's custom domain payment has been rejected successfully.");
    } catch (err: any) {
      console.error(err);
      alert(`Failed to reject domain payment: ${err.message}`);
      setActionStatus(null);
    }
  };

  const handleDeleteScreenshot = async () => {
    if (!selectedStore) return;
    let contract = null;
    try {
      contract = JSON.parse(selectedStore.description);
    } catch (e) {}
    if (!contract || !contract.paymentScreenshotUrl) return;

    if (!confirm("Are you sure you want to permanently delete this payment screenshot from cloud storage?")) return;

    setActionStatus("Deleting screenshot...");
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
        // Remove query parameters or hash from path if any
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
        .eq('id', selectedStore.id);

      if (updateError) throw updateError;

      // Update state
      const updatedStore = {
        ...selectedStore,
        description: JSON.stringify(updatedContract)
      };
      setSelectedStore(updatedStore);
      setStores(stores.map(s => s.id === selectedStore.id ? updatedStore : s));

      setActionStatus("Payment screenshot successfully deleted!");
      setTimeout(() => setActionStatus(null), 2500);
      alert("Payment screenshot permanently deleted from S3-compatible cloud storage.");
    } catch (err: any) {
      console.error(err);
      alert(`Failed to delete screenshot: ${err.message}`);
      setActionStatus(null);
    }
  };

  const handleDeleteDomainScreenshot = async () => {
    if (!selectedStore) return;
    let contract = null;
    try {
      contract = JSON.parse(selectedStore.description);
    } catch (e) {}
    if (!contract || !contract.domainPaymentScreenshotUrl) return;

    if (!confirm("Are you sure you want to permanently delete this domain payment screenshot from cloud storage?")) return;

    setActionStatus("Deleting screenshot...");
    try {
      const imageUrl = contract.domainPaymentScreenshotUrl;
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
        // Remove query parameters or hash from path if any
        filePath = filePath.split('?')[0];
        const { error: storageError } = await supabase.storage
          .from(bucket)
          .remove([filePath]);
        if (storageError) console.error("Failed to delete file from bucket:", storageError);
      }

      // Update the database description field
      const updatedContract = {
        ...contract,
        domainPaymentScreenshotUrl: null,
        domainPaymentStatus: 'none'
      };

      const { error: updateError } = await supabase
        .from('stores')
        .update({
          description: JSON.stringify(updatedContract)
        })
        .eq('id', selectedStore.id);

      if (updateError) throw updateError;

      // Update state
      const updatedStore = {
        ...selectedStore,
        description: JSON.stringify(updatedContract)
      };
      setSelectedStore(updatedStore);
      setStores(stores.map(s => s.id === selectedStore.id ? updatedStore : s));

      setActionStatus("Domain screenshot successfully deleted!");
      setTimeout(() => setActionStatus(null), 2500);
      alert("Domain screenshot permanently deleted from cloud storage.");
    } catch (err: any) {
      console.error(err);
      alert(`Failed to delete domain screenshot: ${err.message}`);
      setActionStatus(null);
    }
  };

  const handleExtendSubscription = async (
    storeId: string, 
    type: 'days' | 'ms' | 'lifetime', 
    amount: number | null
  ) => {
    setActionStatus(`Updating subscription...`);
    try {
      const store = stores.find(s => s.id === storeId);
      if (!store) return;

      if (type === 'lifetime') {
        // Set to Lifetime
        const { error } = await supabase
          .from('stores')
          .update({ subscription_expires_at: null })
          .eq('id', storeId);

        if (error) {
          if (error.message.includes('column') && error.message.includes('does not exist')) {
            alert('⚠️ subscription_expires_at column missing! Run the updated SQL query first.');
            return;
          }
          throw error;
        }

        setStores(stores.map(s => s.id === storeId ? { ...s, subscription_expires_at: null } : s));
        setActionStatus(`Subscription set to Lifetime!`);
        setTimeout(() => setActionStatus(null), 3000);
        return;
      }

      let baseDate = new Date();
      let newExpiry: Date;

      if (type === 'days') {
        // If store has an active subscription in the future, extend from that expiry date
        if (store.subscription_expires_at) {
          const currentExpiry = new Date(store.subscription_expires_at);
          if (currentExpiry > new Date()) {
            baseDate = currentExpiry;
          }
        }
        newExpiry = new Date(baseDate.getTime() + (amount || 0) * 24 * 60 * 60 * 1000);
      } else {
        // For custom milliseconds (trial period), start immediately from NOW
        newExpiry = new Date(new Date().getTime() + (amount || 0));
      }

      const { error } = await supabase
        .from('stores')
        .update({ subscription_expires_at: newExpiry.toISOString() })
        .eq('id', storeId);

      if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          alert('⚠️ subscription_expires_at column missing! Run the updated SQL query first.');
          return;
        }
        throw error;
      }

      setStores(stores.map(s => s.id === storeId ? { ...s, subscription_expires_at: newExpiry.toISOString() } : s));
      setActionStatus(type === 'ms' ? `Trial activated successfully!` : `Subscription extended successfully!`);
      setTimeout(() => setActionStatus(null), 3000);
    } catch (err: any) {
      alert(`Error updating subscription: ${err.message}`);
      setActionStatus(null);
    }
  };

  const handleDeleteStore = async (storeId: string, storeName: string) => {
    const confirmText1 = `⚠️ WARNING: Are you absolutely sure you want to delete the store "${storeName}"?\n\nThis will completely delete the store and all of its associated database records!`;
    if (!confirm(confirmText1)) return;

    const confirmText2 = `🚨 FINAL CONFIRMATION: Type the store name "${storeName}" to permanently delete it:`;
    const doubleConfirm = prompt(confirmText2);
    if (doubleConfirm !== storeName) {
      alert("Store deletion cancelled. The store name did not match.");
      return;
    }

    setActionStatus(`Deleting store and cleaning up all associated records...`);
    try {
      // 1. Fetch all products to clean up their images in storage
      const { data: productsData, error: prodFetchError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId);

      if (!prodFetchError && productsData) {
        setActionStatus(`Deleting product images from S3 storage...`);
        for (const product of productsData) {
          let imageUrl = '';
          try {
            if (product.description && product.description.startsWith('{')) {
              const parsed = JSON.parse(product.description);
              imageUrl = parsed.image_url || '';
            } else {
              imageUrl = product.image_url || '';
            }
          } catch (e) {}

          if (imageUrl && imageUrl.includes('/storage/v1/object/public/')) {
            try {
              const parts = imageUrl.split('/storage/v1/object/public/');
              if (parts.length >= 2) {
                const pathParts = parts[1].split('/');
                const bucket = pathParts[0];
                const filePath = pathParts.slice(1).join('/');
                if (bucket && filePath) {
                  await supabase.storage.from(bucket).remove([filePath]);
                }
              }
            } catch (e) {
              console.error("Failed to delete image for product:", product.id, e);
            }
          }
        }
      }

      // 2. Fetch all orders to delete their order items
      setActionStatus(`Deleting order history and sales records...`);
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id')
        .eq('store_id', storeId);

      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map((o: any) => o.id);
        
        // Delete order items
        await supabase
          .from('order_items')
          .delete()
          .in('order_id', orderIds);
      }

      // 3. Delete orders
      await supabase
        .from('orders')
        .delete()
        .eq('store_id', storeId);

      // 4. Delete products
      setActionStatus(`Deleting product catalog...`);
      await supabase
        .from('products')
        .delete()
        .eq('store_id', storeId);

      // 5. Delete the store itself
      setActionStatus(`Removing store from database...`);
      const { error: storeDeleteError } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (storeDeleteError) throw storeDeleteError;

      // Update state
      setStores(stores.filter(s => s.id !== storeId));
      setActionStatus(`Store "${storeName}" successfully deleted!`);
      setTimeout(() => setActionStatus(null), 3000);
      alert(`🎉 Success: Store "${storeName}" and all associated data have been permanently deleted.`);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to delete store: ${err.message}`);
      setActionStatus(null);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(sqlCommand);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const filteredStores = stores.filter(store => {
    // 1. First apply search query filter
    const matchesSearch = store.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         store.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (store.contact_phone && store.contact_phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (store.contact_email && store.contact_email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    const contract = (() => {
      if (!store.description || !store.description.trim().startsWith('{')) return {};
      try {
        return JSON.parse(store.description);
      } catch (e) {
        return {};
      }
    })();

    // 2. Apply advanced category tab filters
    if (activeFilter === 'subscription_pending') {
      return contract.paymentStatus === 'pending';
    }
    if (activeFilter === 'domain_pending') {
      return contract.domainPaymentStatus === 'pending';
    }
    if (activeFilter === 'all') return true;
    if (activeFilter === 'paused') return store.is_paused === true;
    if (activeFilter === 'custom_domain') return store.custom_domain_enabled !== false;
    if (activeFilter === 'subdomain') return store.custom_domain_enabled === false;
    
    const expiryDate = store.subscription_expires_at ? new Date(store.subscription_expires_at) : null;
    const isExpired = expiryDate ? expiryDate < new Date() : false;
    
    if (activeFilter === 'lifetime') return expiryDate === null;
    if (activeFilter === 'expired') return expiryDate !== null && isExpired;

    // Active plan range groupings in days remaining
    if (expiryDate && !isExpired) {
      const diffDays = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (activeFilter === '1month') return diffDays > 0 && diffDays <= 30;
      if (activeFilter === '3months') return diffDays > 30 && diffDays <= 90;
      if (activeFilter === '6months') return diffDays > 90 && diffDays <= 180;
      if (activeFilter === '1year') return diffDays > 180 && diffDays <= 365;
    }

    return false;
  });

  // Dynamic statistics calculations
  const totalStores = stores.length;
  const pausedStores = stores.filter(s => s.is_paused === true).length;
  const activeStores = totalStores - pausedStores;
  const customDomainStores = stores.filter(s => s.custom_domain_enabled !== false).length;

  // Real-time tab indicators counts
  const totalStoresCount = stores.length;
  const pausedStoresCount = stores.filter(s => s.is_paused === true).length;
  const customDomainStoresCount = stores.filter(s => s.custom_domain_enabled !== false).length;
  const subdomainStoresCount = stores.filter(s => s.custom_domain_enabled === false).length;
  const lifetimeStoresCount = stores.filter(s => s.subscription_expires_at === null).length;

  const subscriptionPendingCount = stores.filter(s => {
    if (!s.description || !s.description.trim().startsWith('{')) return false;
    try {
      return JSON.parse(s.description).paymentStatus === 'pending';
    } catch (e) { return false; }
  }).length;

  const domainPendingCount = stores.filter(s => {
    if (!s.description || !s.description.trim().startsWith('{')) return false;
    try {
      return JSON.parse(s.description).domainPaymentStatus === 'pending';
    } catch (e) { return false; }
  }).length;
  
  const expiredStoresCount = stores.filter(s => {
    const expiry = s.subscription_expires_at ? new Date(s.subscription_expires_at) : null;
    return expiry !== null && expiry < new Date();
  }).length;

  const getActivePlanCount = (minDays: number, maxDays: number) => {
    return stores.filter(s => {
      const expiry = s.subscription_expires_at ? new Date(s.subscription_expires_at) : null;
      if (!expiry || expiry < new Date()) return false;
      const diffDays = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > minDays && diffDays <= maxDays;
    }).length;
  };

  const oneMonthCount = getActivePlanCount(0, 30);
  const threeMonthsCount = getActivePlanCount(30, 90);
  const sixMonthsCount = getActivePlanCount(90, 180);
  const oneYearCount = getActivePlanCount(180, 365);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-6 sm:p-8">
      {/* Brutalist Flash Screen Alert for New Verification Requests */}
      {newStoreAlert && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 font-mono select-none">
          {/* Cyan/indigo neon ambient behind */}
          <div className="absolute w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative bg-zinc-950 text-indigo-400 border-4 border-indigo-500 shadow-[10px_10px_0px_#4f46e5] w-full max-w-md p-6 space-y-6 text-center animate-in zoom-in-95 duration-300">
            {/* Corner retro brackets */}
            <div className="absolute top-2 left-2 text-[10px] text-indigo-600 font-black">&lt;SYS_ALERT&gt;</div>
            <div className="absolute top-2 right-2 text-[10px] text-indigo-600 font-black">&lt;ONLINE&gt;</div>
            
            <div className="w-16 h-16 bg-indigo-950/80 border-2 border-indigo-400 rounded-none flex items-center justify-center mx-auto text-indigo-400 shadow-[4px_4px_0px_rgba(79,70,229,0.3)] animate-pulse">
              <Building2 className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <div className="inline-block bg-indigo-950 border border-indigo-800 text-indigo-300 text-[9px] font-black uppercase tracking-widest px-3 py-1">
                &gt;&gt; DETECTED_NEW_REQUEST_SECURE
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white mt-1">🏪 NEW VERIFICATION FOUND</h2>
              <p className="text-2xs text-zinc-400 uppercase tracking-wider">Store uploaded a payment receipt for audit verification.</p>
            </div>
            
            <div className="bg-zinc-900 border-2 border-zinc-800 p-4 space-y-3 text-left shadow-inner">
              <div>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">&gt;&gt; REGISTERED_STORE_NAME</p>
                <p className="text-sm font-black text-white mt-0.5">{newStoreAlert.store_name}</p>
              </div>
              <div className="h-0.5 bg-zinc-800 w-full" />
              <div>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">&gt;&gt; SUBDOMAIN_ADDRESS</p>
                <p className="text-xs font-black text-indigo-400 select-all mt-0.5">{newStoreAlert.subdomain}.crevasolution.in</p>
              </div>
            </div>
            
            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setNewStoreAlert(null)} 
                className="bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:text-white px-4 py-2.5 font-black text-xs uppercase tracking-widest transition-all duration-150 cursor-pointer shadow-[3px_3px_0px_#27272a] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 flex-1"
              >
                [ ACK ]
              </button>
              <button 
                onClick={() => {
                  setNewStoreAlert(null);
                  setSelectedStore(newStoreAlert);
                  setModalTab('payment');
                }} 
                className="bg-indigo-650 hover:bg-indigo-700 text-white border-2 border-indigo-400 px-4 py-2.5 font-black text-xs uppercase tracking-widest transition-all duration-150 cursor-pointer shadow-[3px_3px_0px_#4f46e5] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 flex-1"
              >
                [ AUDIT_NOW ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upper header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Super Admin Control Panel
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage platform stores, pause storefronts, and grant custom domain permissions.
            </p>
          </div>
          <button 
            onClick={fetchStores}
            className="flex items-center gap-2 self-start bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-700 text-sm font-medium transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-gray-800 border border-gray-700/60 rounded-xl p-5 shadow-sm">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total registered shops</div>
            <div className="text-3xl font-extrabold text-white mt-1 flex items-baseline gap-2">
              {totalStores}
              <span className="text-xs font-normal text-blue-400">stores</span>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700/60 rounded-xl p-5 shadow-sm">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Active stores</div>
            <div className="text-3xl font-extrabold text-green-400 mt-1 flex items-baseline gap-2">
              {activeStores}
              <span className="text-xs font-normal text-green-500">running</span>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700/60 rounded-xl p-5 shadow-sm">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Paused stores</div>
            <div className="text-3xl font-extrabold text-red-400 mt-1 flex items-baseline gap-2">
              {pausedStores}
              <span className="text-xs font-normal text-red-500">paused</span>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700/60 rounded-xl p-5 shadow-sm">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">With Custom Domain</div>
            <div className="text-3xl font-extrabold text-indigo-400 mt-1 flex items-baseline gap-2">
              {customDomainStores}
              <span className="text-xs font-normal text-indigo-500">connected</span>
            </div>
          </div>
        </div>

        {/* Controls and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700/60">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by store name, subdomain, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700/80 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {actionStatus && (
              <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 animate-pulse border border-blue-500/20 mr-2">
                {actionStatus}
              </div>
            )}
            <button 
              onClick={() => setIsBrandingOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md flex-shrink-0"
            >
              <Zap className="w-4 h-4" />
              Billing Settings
            </button>
          </div>
        </div>

        {/* Scrolling Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {[
            { id: 'subscription_pending', name: 'Subscription Approvals', count: subscriptionPendingCount, isAlert: true, badgeColor: 'bg-rose-500 text-white animate-pulse' },
            { id: 'domain_pending', name: 'Custom Domain Approvals', count: domainPendingCount, isAlert: true, badgeColor: 'bg-amber-500 text-slate-950 font-black animate-pulse' },
            { id: 'all', name: 'All Shops', count: totalStoresCount },
            { id: 'paused', name: 'Paused', count: pausedStoresCount },
            { id: 'custom_domain', name: 'Custom Domain', count: customDomainStoresCount },
            { id: 'subdomain', name: 'Subdomain', count: subdomainStoresCount },
            { id: '1month', name: '1 Month active', count: oneMonthCount },
            { id: '3months', name: '3 Months active', count: threeMonthsCount },
            { id: '6months', name: '6 Months active', count: sixMonthsCount },
            { id: '1year', name: '1 Year active', count: oneYearCount },
            { id: 'lifetime', name: 'Lifetime Plan', count: lifetimeStoresCount },
            { id: 'expired', name: 'Expired Plan', count: expiredStoresCount }
          ].map((tab) => {
            const hasAlertCount = tab.isAlert && tab.count > 0;
            const isSelected = activeFilter === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0 ${
                  isSelected
                    ? tab.id === 'subscription_pending'
                      ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                      : tab.id === 'domain_pending'
                        ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-md'
                        : 'bg-blue-600 border-blue-500 text-white shadow-md scale-102'
                    : hasAlertCount
                      ? tab.id === 'subscription_pending'
                        ? 'bg-rose-950/40 border-rose-900/50 text-rose-400 hover:bg-rose-900/10'
                        : 'bg-amber-950/40 border-amber-900/50 text-amber-400 hover:bg-amber-900/10'
                      : 'bg-gray-800/40 border-gray-750 text-gray-400 hover:bg-gray-800'
                }`}
              >
                <span>{tab.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : hasAlertCount
                      ? tab.badgeColor
                      : 'bg-gray-750 text-gray-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table list of stores */}
        <div className="bg-gray-800 border border-gray-700/60 rounded-xl overflow-hidden shadow-md">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span>Loading registered stores...</span>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Building2 className="w-12 h-12 text-gray-600" />
              <span className="font-medium text-gray-500">No stores found matching your search.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-700/80 text-gray-400 text-xs font-bold uppercase bg-gray-900/40">
                    <th className="px-6 py-4">Shop details</th>
                    <th className="px-6 py-4">Subdomain / Domain</th>
                    <th className="px-6 py-4 text-center">Custom Domain Permission</th>
                    <th className="px-6 py-4 text-center">Subscription Plan</th>
                    <th className="px-6 py-4 text-center">Storefront Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredStores.map((store) => {
                    const domainAllowed = store.custom_domain_enabled !== false;
                    const isPaused = store.is_paused === true;
                    
                    const expiryDate = store.subscription_expires_at ? new Date(store.subscription_expires_at) : null;
                    const isExpired = expiryDate ? expiryDate < new Date() : false;
                    const daysRemaining = expiryDate 
                      ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : null;

                    return (
                      <tr key={store.id} className="hover:bg-gray-700/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-gray-200 font-extrabold text-sm border border-gray-600 flex-shrink-0">
                              {store.store_name?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-white truncate max-w-[180px]">{store.store_name}</div>
                              <div className="text-[10px] text-gray-500 font-mono mt-0.5 truncate max-w-[185px]">{store.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-xs text-blue-400 font-mono font-medium">
                              {store.subdomain}.crevasolution.in
                            </div>
                            {store.custom_domain ? (
                              <div className="text-xs text-indigo-400 font-mono font-semibold flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5" />
                                {store.custom_domain}
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-500 font-normal">No custom domain linked</span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleToggleCustomDomain(store.id, domainAllowed)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                domainAllowed 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
                              }`}
                            >
                              {domainAllowed ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Domain Access: ALLOWED
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  Domain Access: RESTRICTED
                                </>
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center gap-2">
                            {/* Subscription Status Display */}
                            {expiryDate === null ? (
                              <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                <Infinity className="w-3.5 h-3.5" />
                                Lifetime Plan
                              </div>
                            ) : isExpired ? (
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                                  <Clock className="w-3.5 h-3.5" />
                                  Expired
                                </div>
                                <span className="text-[10px] text-gray-500 mt-1 font-mono">
                                  End: {expiryDate.toLocaleDateString()} {expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {(() => {
                                    const diffMs = expiryDate.getTime() - new Date().getTime();
                                    if (diffMs < 60 * 1000) return 'Less than 1 min left';
                                    if (diffMs < 60 * 60 * 1000) {
                                      const mins = Math.ceil(diffMs / (60 * 1000));
                                      return `${mins} min left`;
                                    }
                                    if (diffMs < 24 * 60 * 60 * 1000) {
                                      const hrs = Math.ceil(diffMs / (60 * 60 * 1000));
                                      return `${hrs} hr left`;
                                    }
                                    const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
                                    return `${days} days left`;
                                  })()}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 font-mono">
                                  Ends: {expiryDate.toLocaleDateString()} {expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}

                            {/* Quick Extend Buttons */}
                            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1 border-t border-gray-700/60 pt-2 w-full max-w-[210px]">
                              <button
                                onClick={() => handleExtendSubscription(store.id, 'days', 30)}
                                title="Add 30 Days (1 Month)"
                                className="px-1 py-0.5 rounded bg-gray-900 hover:bg-gray-700 text-[10px] font-semibold text-gray-300 border border-gray-700 transition-colors"
                              >
                                +30d
                              </button>
                              <button
                                onClick={() => handleExtendSubscription(store.id, 'days', 90)}
                                title="Add 90 Days (3 Months)"
                                className="px-1 py-0.5 rounded bg-gray-900 hover:bg-gray-700 text-[10px] font-semibold text-gray-300 border border-gray-700 transition-colors"
                              >
                                +90d
                              </button>
                              <button
                                onClick={() => handleExtendSubscription(store.id, 'days', 180)}
                                title="Add 6 Months"
                                className="px-1 py-0.5 rounded bg-gray-900 hover:bg-gray-700 text-[10px] font-semibold text-gray-300 border border-gray-700 transition-colors"
                              >
                                +6 Mo
                              </button>
                              <button
                                onClick={() => handleExtendSubscription(store.id, 'days', 365)}
                                title="Add 365 Days (1 Year)"
                                className="px-1 py-0.5 rounded bg-gray-900 hover:bg-gray-700 text-[10px] font-semibold text-gray-300 border border-gray-700 transition-colors"
                              >
                                +365d
                              </button>
                              <button
                                onClick={() => handleExtendSubscription(store.id, 'lifetime', null)}
                                title="Set to Lifetime"
                                className="px-1 py-0.5 rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-[10px] font-bold text-yellow-400 border border-yellow-500/20 transition-colors"
                              >
                                Lifetime
                              </button>
                            </div>

                            {/* Custom Trial Setup */}
                            <div className="flex items-center gap-1 mt-2 border-t border-gray-700/40 pt-2 w-full max-w-[210px]">
                              <input
                                type="number"
                                min="1"
                                defaultValue="5"
                                id={`trial-val-${store.id}`}
                                className="w-10 bg-gray-900 border border-gray-700 rounded px-1 py-0.5 text-center text-xs text-white focus:outline-none"
                              />
                              <select
                                id={`trial-unit-${store.id}`}
                                className="bg-gray-900 border border-gray-700 rounded px-1 py-0.5 text-[9px] text-gray-300 focus:outline-none"
                              >
                                <option value="min">Min</option>
                                <option value="hr">Hour</option>
                                <option value="day">Day</option>
                              </select>
                              <button
                                onClick={() => {
                                  const valEl = document.getElementById(`trial-val-${store.id}`) as HTMLInputElement;
                                  const unitEl = document.getElementById(`trial-unit-${store.id}`) as HTMLSelectElement;
                                  if (!valEl || !unitEl) return;
                                  const val = parseInt(valEl.value) || 1;
                                  const unit = unitEl.value;
                                  let ms = val * 60 * 1000;
                                  if (unit === 'hr') ms = val * 60 * 60 * 1000;
                                  if (unit === 'day') ms = val * 24 * 60 * 60 * 1000;
                                  handleExtendSubscription(store.id, 'ms', ms);
                                }}
                                className="px-2 py-0.5 rounded bg-blue-500 hover:bg-blue-600 text-[10px] font-bold text-white transition-colors flex-1"
                              >
                                Set Trial
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <button
                              onClick={() => handleTogglePause(store.id, isPaused)}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition-all shadow-sm w-full max-w-[120px] justify-center ${
                                isPaused 
                                  ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              }`}
                            >
                              {isPaused ? (
                                <>
                                  <Pause className="w-3.5 h-3.5 fill-red-400" />
                                  PAUSED
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 fill-emerald-400" />
                                  ACTIVE
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleOpenBilling(store)}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-all shadow-sm w-full max-w-[120px] justify-center"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              INVOICE
                            </button>

                            <button
                              onClick={() => handleDeleteStore(store.id, store.store_name)}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/30 transition-all shadow-sm w-full max-w-[120px] justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              DELETE SHOP
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invoice & Shop Details Modal */}
      {selectedStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 overflow-y-auto backdrop-blur-sm">
          {/* Custom style for absolute print control */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                display: none !important;
              }
              #invoice-print-area, #invoice-print-area * {
                display: block !important;
                visibility: visible !important;
              }
              #invoice-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
                color: black !important;
                padding: 30px !important;
                box-shadow: none !important;
                border: none !important;
              }
            }
          `}} />

          <div className="relative w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-none text-left">
            
            {/* Left Panel: Customize details */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-800 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Billing & Shop Profile
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Manage store records and generate subscription receipts</p>
                </div>
                <button 
                  onClick={() => setSelectedStore(null)}
                  className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Advanced Tab Switchers */}
              <div className="flex border-b border-gray-850 gap-4">
                <button
                  type="button"
                  onClick={() => setModalTab('billing')}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    modalTab === 'billing'
                      ? 'border-blue-500 text-blue-400 font-extrabold'
                      : 'border-transparent text-gray-500 hover:text-gray-400'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  INVOICE GENERATOR
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('profile')}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    modalTab === 'profile'
                      ? 'border-blue-500 text-blue-400 font-extrabold'
                      : 'border-transparent text-gray-500 hover:text-gray-400'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  SHOP PROFILE
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('contract')}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    modalTab === 'contract'
                      ? 'border-blue-500 text-blue-400 font-extrabold'
                      : 'border-transparent text-gray-500 hover:text-gray-400'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  MERCHANT CONTRACT
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('payment')}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    modalTab === 'payment'
                      ? 'border-blue-500 text-blue-400 font-extrabold'
                      : 'border-transparent text-gray-500 hover:text-gray-400'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  PAYMENT VERIFICATION
                </button>
              </div>

              {modalTab === 'profile' ? (
                <div className="space-y-6">
                  {/* General Branding & Identity */}
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Shop Identity</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-950 p-4 rounded-xl border border-gray-850">
                        <span className="text-[9px] text-gray-500 uppercase block font-semibold">Store Category</span>
                        <span className="text-sm font-bold text-white mt-1 block">{selectedStore.business_category || 'General Store'}</span>
                      </div>
                      <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-gray-500 uppercase block font-semibold">Theme Primary Color</span>
                          <span className="text-sm font-mono font-bold text-white mt-1 block">{selectedStore.primary_color || '#3B82F6'}</span>
                        </div>
                        <div 
                          className="w-8 h-8 rounded-full border border-gray-800 shadow-inner"
                          style={{ backgroundColor: selectedStore.primary_color || '#3B82F6' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Settings and Currency */}
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Platform & Currency Settings</h3>
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 space-y-4">
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase block font-semibold font-sans">Active Currency Symbol</span>
                        <span className="text-sm font-bold text-white mt-1 block">{selectedStore.currency || 'INR (₹)'}</span>
                      </div>
                      {selectedStore.description && (
                        <div className="border-t border-gray-850 pt-3">
                          <span className="text-[9px] text-gray-500 uppercase block font-semibold">Store Description / Tagline</span>
                          <p className="text-xs text-gray-300 mt-1 leading-relaxed">{selectedStore.description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Created timelines */}
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Timeline & Status</h3>
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase block font-semibold">Date Registered</span>
                        <span className="text-xs font-bold text-gray-300 mt-1 block">
                          {selectedStore.created_at ? new Date(selectedStore.created_at).toLocaleString('en-IN', {
                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase block font-semibold">Custom Domain Access</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold mt-1 ${
                          selectedStore.custom_domain_enabled !== false 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {selectedStore.custom_domain_enabled !== false ? 'ALLOWED' : 'REVOKED'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : modalTab === 'contract' ? (
                <div className="space-y-6">
                  {(() => {
                    let contract = null;
                    try {
                      if (selectedStore.description && selectedStore.description.trim().startsWith('{')) {
                        contract = JSON.parse(selectedStore.description);
                      }
                    } catch (e) {}

                    if (!contract || !contract.contractSigned) {
                      return (
                        <div className="bg-gray-950 p-6 rounded-xl border border-gray-850 text-center space-y-3">
                          <ShieldAlert className="w-12 h-12 text-yellow-500 mx-auto" />
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">No Signed Agreement Found</h4>
                          <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                            This store is either a legacy storefront or registered before the digital contract onboarding was enforced.
                          </p>
                        </div>
                      );
                    }

                    const planLabel = contract.selectedPlan === '30' ? '1 Month (₹499)' :
                                      contract.selectedPlan === '365' ? '1 Year (₹3,999)' : 'Lifetime Subscription (₹9,999)';

                    return (
                      <div className="space-y-6 text-left">
                        {/* Legal Status Header */}
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                            <div>
                              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">CONTRACT STATUS</span>
                              <span className="text-xs font-bold text-white">Digitally Signed & Verified successfully</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handlePrintContractForStore(selectedStore, contract)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print Contract
                          </button>
                        </div>

                        {/* Metadata grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-950 p-4 rounded-xl border border-gray-850">
                          <div>
                            <span className="text-[9px] text-gray-500 uppercase block font-semibold">Selected Onboarding Plan</span>
                            <span className="text-xs font-black text-indigo-400 mt-1 block">{planLabel}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 uppercase block font-semibold font-sans">Signature Timestamp</span>
                            <span className="text-xs font-bold text-gray-300 mt-1 block font-mono">
                              {new Date(contract.contractSignedAt).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Double Signature box */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Signature Pad display */}
                          <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 space-y-3">
                            <span className="text-[9px] text-gray-500 uppercase block font-semibold font-sans">Merchant Digital Signature</span>
                            {contract.contractSignature ? (
                              <div className="bg-white border border-gray-800 rounded-lg p-2.5 inline-block">
                                <img 
                                  src={contract.contractSignature} 
                                  alt="Merchant drawn signature" 
                                  className="max-h-[50px] object-contain invert"
                                />
                              </div>
                            ) : (
                              <span className="text-xs text-red-400 block font-bold">Signature image data is missing!</span>
                            )}
                          </div>

                          {/* Assigned Officer Signature Display */}
                          <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 space-y-3">
                            <span className="text-[9px] text-gray-500 uppercase block font-semibold font-sans">Assigned Licensing Officer</span>
                            {contract.assignedOfficer ? (
                              <div className="flex items-center gap-3">
                                {contract.assignedOfficer.signature && (
                                  <div className="bg-white border border-gray-800 rounded-lg p-2 inline-block">
                                    <img 
                                      src={contract.assignedOfficer.signature} 
                                      alt="Officer signature stamp" 
                                      className="max-h-[40px] object-contain"
                                    />
                                  </div>
                                )}
                                <div>
                                  <span className="text-xs font-bold text-white block">{contract.assignedOfficer.name}</span>
                                  <span className="text-[9px] text-gray-500 block">{contract.assignedOfficer.title}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="font-mono text-[10px] font-black text-gray-500 border border-gray-850 rounded px-2 py-1 bg-gray-900 uppercase">CREVA OFFICIAL STAMP</div>
                                <span className="text-[9px] text-gray-500 block">Default authorized signee</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Terms copy block */}
                        <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 space-y-2">
                          <span className="text-[9px] text-gray-500 uppercase block font-semibold">Agreement Content Summary</span>
                          <p className="text-[11px] text-gray-400 leading-relaxed text-justify">
                            Merchant signed: "The Creva Platform grants the signing Merchant the right to operate an e-commerce storefront utilizing Creva's software architecture. Merchant agrees to sell only products that comply with local guidelines. Selling illegal, counterfeit, or prohibited materials will result in immediate shop termination without any refunds."
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : modalTab === 'payment' ? (
                <div className="space-y-6 text-left">
                  {(() => {
                    let contract = null;
                    try {
                      if (selectedStore.description && selectedStore.description.trim().startsWith('{')) {
                        contract = JSON.parse(selectedStore.description);
                      }
                    } catch (e) {}

                    if (!contract) {
                      return (
                        <div className="bg-gray-950 p-6 rounded-xl border border-gray-850 text-center space-y-3">
                          <ShieldAlert className="w-12 h-12 text-yellow-500 mx-auto" />
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">No Payment Details Found</h4>
                          <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                            This store is either a legacy storefront or registered before the payment upload workflow was added.
                          </p>
                        </div>
                      );
                    }

                    const isVerified = contract.paymentStatus === 'verified';
                    const hasScreenshot = !!contract.paymentScreenshotUrl;

                    return (
                      <div className="space-y-6">
                        {/* 1. Subscription Onboarding Payment Section */}
                        {(!contract.contractSigned && !contract.paymentStatus && !contract.paymentScreenshotUrl) ? (
                          <div className="border border-gray-800 p-4 rounded-xl bg-gray-950/20 space-y-2">
                            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5" />
                              1. Platform Subscription Payment
                            </h4>
                            <p className="text-xs text-gray-500 italic">This store is manually activated or a legacy storefront without subscription payment proof.</p>
                          </div>
                        ) : (
                          <div className="border border-gray-800 p-4 rounded-xl bg-gray-950/20 space-y-4">
                            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5" />
                              1. Platform Subscription Payment
                            </h4>

                            <div className={`border rounded-xl p-4 flex items-center justify-between ${
                              isVerified
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}>
                              <div className="flex items-center gap-3">
                                {isVerified ? (
                                  <ShieldCheck className="w-6 h-6" />
                                ) : (
                                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                                )}
                                <div>
                                  <span className="text-[10px] font-black uppercase tracking-widest block">PAYMENT VERIFICATION</span>
                                  <span className="text-xs font-bold text-white">
                                    {isVerified ? 'Payment Verified & Storefront Active' : 'Pending Verification Review'}
                                  </span>
                                </div>
                              </div>

                              {!isVerified && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={handleRejectPayment}
                                    className="bg-red-650 hover:bg-red-750 text-white text-[11px] font-black px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 border border-red-800/30"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Reject Payment
                                  </button>
                                  <button
                                    onClick={handleVerifyPayment}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Verify & Approve
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Payment summary grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-950 p-4 rounded-xl border border-gray-850">
                              <div>
                                <span className="text-[9px] text-gray-500 uppercase block font-semibold">Subscribed Plan</span>
                                <span className="text-xs font-black text-indigo-400 mt-1 block">
                                  {contract.selectedPlan === '30' ? '1 Month' :
                                   contract.selectedPlan === '365' ? '1 Year' : 'Lifetime'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] text-gray-500 uppercase block font-semibold font-sans">Payment Mode</span>
                                <span className="text-xs font-bold text-gray-300 mt-1 block font-mono">UPI Transfer</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-gray-500 uppercase block font-semibold">Verify Status</span>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold mt-1 ${
                                  isVerified
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {contract.paymentStatus?.toUpperCase() || 'PENDING'}
                                </span>
                              </div>
                            </div>

                            {/* Payment Screenshot Display */}
                            <div className="bg-gray-950 p-6 rounded-xl border border-gray-850 text-center space-y-4">
                              <span className="text-[9px] text-gray-500 uppercase block font-semibold tracking-wider text-left">
                                Transaction Screenshot Uploaded
                              </span>

                              {hasScreenshot ? (
                                <div className="space-y-4">
                                  <div className="relative group max-w-sm mx-auto border border-gray-800 rounded-xl overflow-hidden shadow-2xl bg-gray-900">
                                    <img
                                      src={contract.paymentScreenshotUrl}
                                      alt="Merchant Payment Screenshot"
                                      className="w-full h-auto max-h-[300px] object-contain mx-auto"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <a
                                        href={contract.paymentScreenshotUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md"
                                      >
                                        View Fullsize 🌐
                                      </a>
                                    </div>
                                  </div>

                                  <button
                                    onClick={handleDeleteScreenshot}
                                    className="bg-red-600 hover:bg-red-750 text-white text-[11px] font-black px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 mx-auto border border-red-800/35"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Screenshot (S3 Storage)
                                  </button>
                                </div>
                              ) : (
                                <div className="py-8 flex flex-col items-center justify-center text-gray-400 gap-2">
                                  <ShieldAlert className="w-10 h-10 text-gray-650" />
                                  <p className="text-xs font-bold text-gray-500">No payment screenshot attached to this storefront.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="border border-gray-800 p-4 rounded-xl bg-gray-950/20 space-y-4">
                          <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 animate-pulse" />
                            2. Custom Domain Unlock Verification
                          </h4>

                          {(() => {
                            const domainStatus = contract.domainPaymentStatus || 'none';
                            const domainScreenshot = contract.domainPaymentScreenshotUrl;
                            const customDomainName = selectedStore.custom_domain || '';

                            if (domainStatus === 'none' && !domainScreenshot) {
                              return (
                                <p className="text-xs text-gray-500 italic">Merchant has not requested or uploaded proof for unlocking custom domains yet.</p>
                              );
                            }

                            const isDomainVerified = domainStatus === 'verified';

                            return (
                              <div className="space-y-4">
                                <div className={`border rounded-xl p-4 flex items-center justify-between ${
                                  isDomainVerified
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                }`}>
                                  <div className="flex items-center gap-3">
                                    {isDomainVerified ? (
                                      <ShieldCheck className="w-6 h-6" />
                                    ) : (
                                      <ShieldAlert className="w-6 h-6 animate-pulse" />
                                    )}
                                    <div>
                                      <span className="text-[10px] font-black uppercase tracking-widest block">DOMAIN UNLOCK STATUS</span>
                                      <span className="text-xs font-bold text-white">
                                        {isDomainVerified ? 'Unlocked & Active' : 'Pending Domain Verification'}
                                      </span>
                                    </div>
                                  </div>

                                  {!isDomainVerified && (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={handleRejectDomainPayment}
                                        className="bg-red-650 hover:bg-red-750 text-white text-[11px] font-black px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 border border-red-800/30"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                        Reject
                                      </button>
                                      <button
                                        onClick={handleVerifyDomainPayment}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        Approve & Unlock
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-950 p-4 rounded-xl border border-gray-850">
                                  <div>
                                    <span className="text-[9px] text-gray-500 uppercase block font-semibold">Desired Custom Domain</span>
                                    <span className="text-xs font-black text-indigo-400 mt-1 block font-mono">
                                      {customDomainName || 'No domain linked yet'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-gray-500 uppercase block font-semibold">Status Code</span>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold mt-1 ${
                                      isDomainVerified
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    }`}>
                                      {domainStatus.toUpperCase()}
                                    </span>
                                  </div>
                                </div>

                                {domainScreenshot ? (
                                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 text-center space-y-4">
                                    <span className="text-[9px] text-gray-500 uppercase block font-semibold tracking-wider text-left">
                                      Domain Payment Proof Screenshot
                                    </span>
                                    <div className="relative group max-w-sm mx-auto border border-gray-800 rounded-xl overflow-hidden shadow-2xl bg-gray-900">
                                      <img
                                        src={domainScreenshot}
                                        alt="Custom Domain Payment Proof"
                                        className="w-full h-auto max-h-[250px] object-contain mx-auto"
                                      />
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <a
                                          href={domainScreenshot}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md"
                                        >
                                          View Fullsize 🌐
                                        </a>
                                      </div>
                                    </div>

                                    <button
                                      onClick={handleDeleteDomainScreenshot}
                                      className="bg-red-650 hover:bg-red-750 text-white text-[11px] font-black px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 mx-auto border border-red-800/35"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Delete Screenshot (S3 Storage)
                                    </button>
                                  </div>
                                ) : (
                                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 text-center text-xs text-gray-500 italic">
                                    No screenshot proof uploaded for domain purchase.
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Owner Details */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Store Owner Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase">Store Name</label>
                        <div className="bg-gray-950 border border-gray-850 rounded-lg px-3 py-2 text-sm text-white font-medium mt-1">
                          {selectedStore.store_name}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase">Subdomain Alias</label>
                        <div className="bg-gray-950 border border-gray-850 rounded-lg px-3 py-2 text-sm text-blue-400 font-mono mt-1">
                          {selectedStore.subdomain}.crevasolution.in
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase">WhatsApp / Contact Phone</label>
                        <input 
                          type="text"
                          value={selectedStore.contact_phone || ''}
                          onChange={(e) => {
                            setSelectedStore({ ...selectedStore, contact_phone: e.target.value });
                          }}
                          placeholder="e.g. 9876543210"
                          className="w-full bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white mt-1 transition-all animate-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 uppercase">Contact Email</label>
                        <input 
                          type="email"
                          value={selectedStore.contact_email || ''}
                          onChange={(e) => {
                            setSelectedStore({ ...selectedStore, contact_email: e.target.value });
                          }}
                          placeholder="owner@email.com"
                          className="w-full bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white mt-1 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Plan & Price details */}
                  <div className="space-y-4 border-t border-gray-850 pt-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Renewal Plan & Price</h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { days: '30', name: '1 Month', price: '499' },
                        { days: '90', name: '3 Months', price: '1299' },
                        { days: '180', name: '6 Months', price: '2299' },
                        { days: '365', name: '1 Year', price: '3999' }
                      ].map((plan) => (
                        <button
                          type="button"
                          key={plan.days}
                          onClick={() => {
                            setBillPlan(plan.days);
                            setBillPrice(plan.price);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                            billPlan === plan.days
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500'
                              : 'bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-900'
                          }`}
                        >
                          {plan.name}
                        </button>
                      ))}
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase">Billing Price (₹)</label>
                      <input 
                        type="number"
                        value={billPrice}
                        onChange={(e) => setBillPrice(e.target.value)}
                        className="w-full max-w-[200px] bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white mt-1 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel: Invoice Preview */}
            <div className="w-full md:w-[360px] bg-gray-950 p-6 sm:p-8 flex flex-col items-center justify-between gap-6 overflow-y-auto">
              <div className="w-full">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">Receipt Invoice Preview</h3>
                
                {/* Printable Invoice Container */}
                <div 
                  id="invoice-print-area"
                  className="bg-white text-gray-900 border border-gray-200 rounded-xl p-5 shadow-xl font-mono text-xs flex flex-col gap-4 w-full"
                >
                  {/* Logo header */}
                  <div className="flex items-start justify-between border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-2">
                      {brandLogo && (
                        <img 
                          src={brandLogo} 
                          alt="Logo" 
                          className="w-8 h-8 rounded-full border border-gray-250 object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <span className="font-extrabold text-sm tracking-tight">{brandName}</span>
                        <p className="text-[8px] text-gray-500 font-sans mt-0.5">Creva Platform billing</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-[10px] text-blue-600 block">TAX INVOICE</span>
                      <span className="text-[9px] text-gray-500 block mt-0.5">{invoiceNumber}</span>
                    </div>
                  </div>

                  {/* Bill to metadata */}
                  <div className="flex flex-col gap-1 text-[10px] border-b border-gray-150 pb-3">
                    <span className="text-gray-400 uppercase font-sans font-bold text-[8px]">Bill To:</span>
                    <span className="font-bold text-gray-800">{selectedStore.store_name}</span>
                    {selectedStore.contact_phone && (
                      <span className="text-gray-600">Ph: {selectedStore.contact_phone}</span>
                    )}
                    {selectedStore.contact_email && (
                      <span className="text-gray-600">Email: {selectedStore.contact_email}</span>
                    )}
                    <span className="text-gray-500 font-sans text-[8px] mt-1">Date: {new Date().toLocaleDateString('en-IN')}</span>
                  </div>

                  {/* Items list */}
                  <div className="flex flex-col gap-2 border-b border-gray-200 pb-3">
                    <div className="flex justify-between font-bold text-[9px] text-gray-400 uppercase font-sans">
                      <span>Description</span>
                      <span>Total</span>
                    </div>
                    <div className="flex justify-between gap-4 text-gray-850">
                      <div className="min-w-0">
                        <span className="font-semibold block truncate">SaaS Storefront Subscription</span>
                        <span className="text-[9px] text-gray-500 block mt-0.5 font-sans">
                          Validity: {billPlan} Days ({billPlan === '30' ? '1 Mo' : billPlan === '90' ? '3 Mo' : billPlan === '180' ? '6 Mo' : '1 Yr'})
                        </span>
                      </div>
                      <span className="font-bold shrink-0">₹{billPrice}.00</span>
                    </div>
                  </div>

                  {/* Total summary */}
                  <div className="flex flex-col gap-1.5 align-end self-end text-right w-full max-w-[150px]">
                    <div className="flex justify-between text-gray-500 font-sans text-[10px]">
                      <span>Subtotal:</span>
                      <span className="font-bold text-gray-800">₹{billPrice}.00</span>
                    </div>
                    <div className="flex justify-between font-black text-gray-900 border-t border-gray-200 pt-1.5 text-xs">
                      <span>Total:</span>
                      <span>₹{billPrice}.00</span>
                    </div>
                  </div>

                  {/* Expiry / Footer section */}
                  <div className="border-t border-gray-200 pt-3 text-center flex flex-col gap-2">
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider inline-block self-center">
                      PAID & ACTIVE ✅
                    </div>
                    
                    <div className="text-[9px] text-gray-500 leading-relaxed font-sans mt-1">
                      <span>Your storefront is active from </span>
                      <strong className="text-gray-800 font-mono">{new Date().toLocaleDateString('en-IN')}</strong>
                      <span> to </span>
                      <strong className="text-gray-800 font-mono">
                        {new Date(new Date().getTime() + parseInt(billPlan) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="w-full space-y-2 mt-auto">
                <button
                  onClick={() => {
                    const planName = billPlan === '30' ? '1 Month (30 Days)' :
                                     billPlan === '90' ? '3 Months (90 Days)' :
                                     billPlan === '180' ? '6 Months (180 Days)' : '1 Year (365 Days)';
                    const startDate = new Date().toLocaleDateString('en-IN');
                    const endDate = new Date(new Date().getTime() + parseInt(billPlan) * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN');
                    
                    const text = `*INVOICE FROM ${brandName.toUpperCase()}* 🚀\n-----------------------------------\n*Store Name:* ${selectedStore.store_name}\n*Subdomain:* ${selectedStore.subdomain}.crevasolution.in\n*Invoice No:* ${invoiceNumber}\n*Date:* ${startDate}\n\n*Subscription Details:*\n-----------------------------------\n*Plan Duration:* ${planName}\n*Validity Period:* ${startDate} to ${endDate}\n*Amount Paid:* ₹${billPrice}\n*Status:* PAID & ACTIVE ✅\n\nThank you for choosing *${brandName}* to power your online shop! Your online storefront has been recharged and is fully active. 🌟`;
                    
                    let phone = selectedStore.contact_phone || '';
                    phone = phone.replace(/\D/g, '');
                    if (phone.length === 10) {
                      phone = '91' + phone;
                    }
                    
                    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  <Send className="w-4 h-4" />
                  Send via WhatsApp
                </button>

                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl text-xs font-bold border border-gray-700 transition-all"
                >
                  <Printer className="w-4 h-4 text-blue-400" />
                  Print / Save as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global SaaS Billing Settings Modal */}
      {isBrandingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-850 p-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="text-blue-400 w-5 h-5" />
                  SaaS Platform Global Settings
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Configure platform branding, package pricing, custom domain upgrades, and legal terms.</p>
              </div>
              <button 
                onClick={() => setIsBrandingOpen(false)}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Content Area with Categorized Tabs */}
            <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
              
              {/* Sidebar Navigation */}
              <div className="w-full md:w-60 bg-gray-950/60 border-b md:border-b-0 md:border-r border-gray-850 p-4 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto whitespace-nowrap md:whitespace-normal">
                <button
                  type="button"
                  onClick={() => setActiveSettingTab('branding')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all w-full text-left ${
                    activeSettingTab === 'branding'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-gray-400 hover:text-white hover:bg-gray-850'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  General Branding
                </button>
                
                <button
                  type="button"
                  onClick={() => setActiveSettingTab('pricing')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all w-full text-left ${
                    activeSettingTab === 'pricing'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-gray-400 hover:text-white hover:bg-gray-850'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  Pricing & UPI Payments
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSettingTab('officers')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all w-full text-left ${
                    activeSettingTab === 'officers'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-gray-400 hover:text-white hover:bg-gray-850'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Licensing Officers
                </button>

                 <button
                  type="button"
                  onClick={() => setActiveSettingTab('agreement')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all w-full text-left ${
                    activeSettingTab === 'agreement'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-gray-400 hover:text-white hover:bg-gray-850'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Legal Agreement Terms
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSettingTab('templates')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all w-full text-left ${
                    activeSettingTab === 'templates'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-gray-400 hover:text-white hover:bg-gray-850'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Template Thumbnails
                </button>
              </div>

              {/* Tab Panels Content */}
              <div className="flex-1 p-6 overflow-y-auto bg-gray-900 space-y-6">
                
                {/* 1. GENERAL BRANDING TAB */}
                {activeSettingTab === 'branding' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-white">General Branding Settings</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Define your core brand identity and storefront settings.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Branding / SaaS Name</label>
                        <input 
                          type="text"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="e.g. Creva Solutions"
                          className="w-full bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2.5 text-sm text-white transition-all"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Agreement Top Logo</label>
                        <div className="flex flex-col gap-3">
                          <label 
                            htmlFor="global-logo-upload"
                            className="flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-gray-800 hover:border-blue-500 bg-gray-950 hover:bg-gray-950/70 cursor-pointer text-xs font-bold text-gray-400 hover:text-white transition-all text-center"
                          >
                            <Upload className="w-4 h-4 text-blue-500" />
                            <span>Click to Upload Logo Image File</span>
                          </label>
                          <input 
                            type="file"
                            accept="image/*"
                            id="global-logo-upload"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />

                          <div className="relative">
                            <span className="text-[9px] text-gray-500 uppercase font-sans tracking-wide block mb-1">Or paste logo image link URL:</span>
                            <input 
                              type="text"
                              value={brandLogo}
                              onChange={(e) => setBrandLogo(e.target.value)}
                              placeholder="e.g. https://..."
                              className="w-full bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-white transition-all font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {brandLogo && (
                        <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 flex items-center gap-3">
                          <img 
                            src={brandLogo} 
                            alt="Preview" 
                            className="w-12 h-12 rounded-full object-cover border border-gray-800"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div>
                            <span className="text-xs font-extrabold text-white block">{brandName}</span>
                            <span className="text-[10px] text-gray-500 block">Default branding live preview</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. PRICING & UPI PAYMENTS TAB */}
                {activeSettingTab === 'pricing' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-white">Pricing & UPI Payments Settings</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Manage transaction UPI endpoints, billing thresholds, and unlock charges.</p>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Platform UPI VPA ID (For Registration QR)</label>
                        <input 
                          type="text"
                          value={platformUpi}
                          onChange={(e) => setPlatformUpi(e.target.value)}
                          placeholder="e.g. creva@ybl"
                          className="w-full bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2.5 text-sm text-white transition-all font-mono"
                        />
                      </div>

                      {/* Package Plan Prices Setting Section */}
                      <div className="border border-gray-800 p-5 rounded-xl bg-gray-950/40 space-y-4">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-indigo-450" />
                          <span className="text-xs font-bold text-gray-200">Store Subscription Package Prices</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* 1 Month Plan */}
                          <div className={`p-3 rounded-lg border transition-all ${
                            disabledDefaultPackages.includes('30') 
                              ? 'border-red-950/30 bg-red-950/5 opacity-60' 
                              : 'border-gray-850 bg-gray-900/30'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">1 Month Plan</label>
                              {disabledDefaultPackages.includes('30') ? (
                                <button
                                  type="button"
                                  onClick={() => persistPackages(customPackages, disabledDefaultPackages.filter(x => x !== '30'))}
                                  className="text-[8px] bg-indigo-950 hover:bg-indigo-900 text-indigo-400 font-bold px-1.5 py-0.5 rounded transition-all animate-pulse"
                                >
                                  RESTORE +
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => persistPackages(customPackages, [...disabledDefaultPackages, '30'])}
                                  className="p-1 bg-red-950 hover:bg-red-900 text-red-450 rounded transition-all"
                                  title="Delete 1 Month Plan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            {!disabledDefaultPackages.includes('30') ? (
                              <div className="flex items-center">
                                <span className="h-9 px-2 flex items-center bg-gray-950 border-y border-l border-gray-850 rounded-l-md text-gray-500 font-mono text-xs">₹</span>
                                <input 
                                  type="number"
                                  value={plan30Price}
                                  onChange={(e) => setPlan30Price(e.target.value)}
                                  placeholder="499"
                                  className="w-full h-9 bg-gray-950 border border-gray-850 focus:border-indigo-500 focus:outline-none rounded-r-md px-2 text-xs text-white font-mono"
                                />
                              </div>
                            ) : (
                              <div className="text-[10px] text-red-400 font-mono italic h-9 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3 text-red-500" />
                                Deleted / Hidden
                              </div>
                            )}
                          </div>

                          {/* 1 Year Plan */}
                          <div className={`p-3 rounded-lg border transition-all ${
                            disabledDefaultPackages.includes('365') 
                              ? 'border-red-950/30 bg-red-950/5 opacity-60' 
                              : 'border-gray-850 bg-gray-900/30'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">1 Year Plan</label>
                              {disabledDefaultPackages.includes('365') ? (
                                <button
                                  type="button"
                                  onClick={() => persistPackages(customPackages, disabledDefaultPackages.filter(x => x !== '365'))}
                                  className="text-[8px] bg-indigo-950 hover:bg-indigo-900 text-indigo-400 font-bold px-1.5 py-0.5 rounded transition-all animate-pulse"
                                >
                                  RESTORE +
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => persistPackages(customPackages, [...disabledDefaultPackages, '365'])}
                                  className="p-1 bg-red-950 hover:bg-red-900 text-red-450 rounded transition-all"
                                  title="Delete 1 Year Plan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            {!disabledDefaultPackages.includes('365') ? (
                              <div className="flex items-center">
                                <span className="h-9 px-2 flex items-center bg-gray-950 border-y border-l border-gray-850 rounded-l-md text-gray-500 font-mono text-xs">₹</span>
                                <input 
                                  type="number"
                                  value={plan365Price}
                                  onChange={(e) => setPlan365Price(e.target.value)}
                                  placeholder="3999"
                                  className="w-full h-9 bg-gray-950 border border-gray-850 focus:border-indigo-500 focus:outline-none rounded-r-md px-2 text-xs text-white font-mono"
                                />
                              </div>
                            ) : (
                              <div className="text-[10px] text-red-400 font-mono italic h-9 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3 text-red-500" />
                                Deleted / Hidden
                              </div>
                            )}
                          </div>

                          {/* Lifetime Plan */}
                          <div className={`p-3 rounded-lg border transition-all ${
                            disabledDefaultPackages.includes('lifetime') 
                              ? 'border-red-950/30 bg-red-950/5 opacity-60' 
                              : 'border-gray-850 bg-gray-900/30'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Lifetime Plan</label>
                              {disabledDefaultPackages.includes('lifetime') ? (
                                <button
                                  type="button"
                                  onClick={() => persistPackages(customPackages, disabledDefaultPackages.filter(x => x !== 'lifetime'))}
                                  className="text-[8px] bg-indigo-950 hover:bg-indigo-900 text-indigo-400 font-bold px-1.5 py-0.5 rounded transition-all animate-pulse"
                                >
                                  RESTORE +
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => persistPackages(customPackages, [...disabledDefaultPackages, 'lifetime'])}
                                  className="p-1 bg-red-950 hover:bg-red-900 text-red-455 rounded transition-all"
                                  title="Delete Lifetime Plan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            {!disabledDefaultPackages.includes('lifetime') ? (
                              <div className="flex items-center">
                                <span className="h-9 px-2 flex items-center bg-gray-950 border-y border-l border-gray-850 rounded-l-md text-gray-500 font-mono text-xs">₹</span>
                                <input 
                                  type="number"
                                  value={planLifetimePrice}
                                  onChange={(e) => setPlanLifetimePrice(e.target.value)}
                                  placeholder="9999"
                                  className="w-full h-9 bg-gray-950 border border-gray-850 focus:border-indigo-500 focus:outline-none rounded-r-md px-2 text-xs text-white font-mono"
                                />
                              </div>
                            ) : (
                              <div className="text-[10px] text-red-400 font-mono italic h-9 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3 text-red-500" />
                                Deleted / Hidden
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Custom Subscription Packages Section */}
                      <div className="border border-gray-800 p-5 rounded-xl bg-gray-950/40 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-850 pb-2.5">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold text-gray-250">Dynamic Custom Packages</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">Total Packages: {customPackages.length}</span>
                        </div>

                        {/* Existing Custom Packages list */}
                        {customPackages.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                            {customPackages.map((pkg) => (
                              <div key={pkg.id} className="bg-gray-900/60 border border-gray-850 p-3 rounded-lg flex items-center justify-between transition-all hover:bg-gray-900/95 hover:border-gray-800">
                                <div className="space-y-1">
                                  <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                                    {pkg.name}
                                    <span className="text-[9px] bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded font-mono">
                                      {pkg.days} Days
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-mono">Price: <span className="text-emerald-450 font-bold">₹{pkg.price}</span></div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomPackage(pkg.id)}
                                  className="p-1.5 bg-red-950/40 hover:bg-red-950 text-red-400 rounded-lg transition-colors border border-red-900/30"
                                  title="Delete Package"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="border border-dashed border-gray-850 rounded-lg p-5 text-center text-gray-500 text-xs">
                            No custom subscription packages configured yet. Use the tool below to add.
                          </div>
                        )}

                        {/* Inline Package Creator Form */}
                        <div className="bg-gray-900/30 border border-gray-850/50 p-4 rounded-xl space-y-3.5 mt-2">
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Add New Subscription Package</span>
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-4">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Package Display Name</label>
                              <input 
                                type="text"
                                value={newPkgName}
                                onChange={(e) => setNewPkgName(e.target.value)}
                                placeholder="e.g. 3 Months Plan"
                                className="w-full h-9 bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 text-xs text-white"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Duration Count</label>
                              <input 
                                type="number"
                                value={newPkgDuration}
                                onChange={(e) => setNewPkgDuration(e.target.value)}
                                placeholder="3"
                                className="w-full h-9 bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 text-xs text-white font-mono"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Duration Unit</label>
                              <select 
                                value={newPkgDurationType}
                                onChange={(e) => setNewPkgDurationType(e.target.value as any)}
                                className="w-full h-9 bg-gray-950 border border-gray-850 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 text-xs text-white"
                              >
                                <option value="day">Days</option>
                                <option value="month">Months</option>
                                <option value="year">Years</option>
                              </select>
                            </div>
                            <div className="sm:col-span-3">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Package Price (₹)</label>
                              <div className="flex items-center">
                                <span className="h-9 px-2 flex items-center bg-gray-950 border-y border-l border-gray-850 rounded-l-lg text-gray-500 font-mono text-xs">₹</span>
                                <input 
                                  type="number"
                                  value={newPkgPrice}
                                  onChange={(e) => setNewPkgPrice(e.target.value)}
                                  placeholder="1299"
                                  className="w-full h-9 bg-gray-950 border border-gray-850 focus:border-indigo-500 focus:outline-none rounded-r-lg px-2.5 text-xs text-white font-mono"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={handleAddCustomPackage}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
                            >
                              Add Package +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Custom Domain Settings Section */}
                      <div className="border border-gray-800 p-5 rounded-xl bg-gray-950/40 space-y-4">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-emerald-450" />
                          <span className="text-xs font-bold text-gray-200">🌐 Custom Domain Upgrade Cost</span>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase">One-Time Domain Unlock Fee</label>
                          <div className="flex items-center mt-1 max-w-[200px]">
                            <span className="h-9 px-2 flex items-center bg-gray-950 border-y border-l border-gray-850 rounded-l-md text-gray-500 font-mono text-xs">₹</span>
                            <input 
                              type="number"
                              value={customDomainUnlockPrice}
                              onChange={(e) => setCustomDomainUnlockPrice(e.target.value)}
                              placeholder="1499"
                              className="w-full h-9 bg-gray-950 border border-gray-850 focus:border-emerald-500 focus:outline-none rounded-r-md px-2 text-xs text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. LICENSING OFFICERS TAB */}
                {activeSettingTab === 'officers' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-white">Licensing Officers Settings</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Upload signature stamp images for each officer. One is randomly chosen per new agreement.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {officers.map((officer, index) => (
                        <div key={officer.id} className="bg-gray-950 border border-gray-850 rounded-xl overflow-hidden shadow-sm">
                          {/* Officer Header Row */}
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-950/90 border-b border-gray-850">
                            <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-black text-blue-400">#{officer.id}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate">{officer.name || `Officer #${officer.id}`}</p>
                              <p className="text-[9px] text-gray-400 truncate">{officer.title || 'No title set'}</p>
                            </div>
                            {officer.signature && (
                              <div className="bg-white rounded p-1 border border-gray-700 shrink-0">
                                <img src={officer.signature} alt="stamp" className="h-6 w-auto object-contain" />
                              </div>
                            )}
                          </div>

                          {/* Editable Fields */}
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Full Name</label>
                                <input
                                  type="text"
                                  value={officer.name}
                                  onChange={(e) => {
                                    const updated = [...officers];
                                    updated[index].name = e.target.value;
                                    setOfficers(updated);
                                  }}
                                  placeholder="Officer full name"
                                  className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-white transition-all placeholder:text-gray-600"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Role / Title</label>
                                <input
                                  type="text"
                                  value={officer.title}
                                  onChange={(e) => {
                                    const updated = [...officers];
                                    updated[index].title = e.target.value;
                                    setOfficers(updated);
                                  }}
                                  placeholder="e.g. Licensing Director"
                                  className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-white transition-all placeholder:text-gray-600"
                                />
                              </div>
                            </div>

                            {/* Stamp Upload */}
                            <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Signature / Stamp Image</label>
                              <label
                                htmlFor={`officer-stamp-${index}`}
                                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-700 hover:border-blue-500 bg-gray-900 cursor-pointer transition-all group"
                              >
                                <div className="flex items-center gap-2">
                                  <Upload className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-300" />
                                  <span className="text-[10px] font-semibold text-gray-400 group-hover:text-white transition-colors">
                                    {officer.signature ? 'Replace stamp image' : 'Upload signature stamp (PNG/JPG)'}
                                  </span>
                                </div>
                                {officer.signature && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const updated = [...officers];
                                      updated[index].signature = '';
                                      setOfficers(updated);
                                    }}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </label>
                              <input
                                type="file"
                                id={`officer-stamp-${index}`}
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(e) => handleOfficerStampUpload(e, index)}
                                className="hidden"
                              />
                              {officer.signature && (
                                <div className="mt-2 bg-white rounded-lg p-2 border border-gray-700 inline-flex items-center gap-2">
                                  <img src={officer.signature} alt="Stamp preview" className="max-h-8 max-w-[120px] object-contain" />
                                  <span className="text-[9px] text-gray-550 font-bold">Stamp preview</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. LEGAL & AGREEMENT TAB */}
                {activeSettingTab === 'agreement' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-white">Legal Agreement Terms Settings</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Customize the terms & conditions printed in every merchant contract agreement.</p>
                    </div>

                    <div className="space-y-4">
                      <textarea
                        value={agreementTemplate}
                        onChange={(e) => setAgreementTemplate(e.target.value)}
                        rows={12}
                        placeholder="Enter agreement terms & conditions..."
                        className="w-full bg-gray-950 border border-gray-800 focus:border-amber-500/50 focus:outline-none rounded-xl px-3.5 py-3 text-xs text-gray-300 leading-relaxed resize-y transition-all font-mono placeholder:text-gray-600"
                      />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">HTML tags are not recommended. Standard layout styling will wrap your raw texts.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAgreementTemplate(defaultTemplate);
                            setActionStatus('Template reset to default!');
                            setTimeout(() => setActionStatus(null), 2000);
                          }}
                          className="text-[10px] text-amber-550 hover:text-amber-400 font-bold transition-colors underline underline-offset-2"
                        >
                          Reset to default template
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. STOREFRONT TEMPLATES TAB */}
                {activeSettingTab === 'templates' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-blue-400" />
                        Storefront Templates Thumbnails Management
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">Customize representative thumbnails for storefront templates shown in the Setup Wizard.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {[
                        { id: 'minimal', name: 'Minimal Elegance', defaultThumb: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600', desc: 'Sleek luxury black and white boutique design.' },
                        { id: 'artisan', name: 'Artisan Craft', defaultThumb: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=600', desc: 'Warm organic pottery serif template.' },
                        { id: 'bold', name: 'Bold Commerce', defaultThumb: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&q=80&w=600', desc: 'Vibrant grid design with chunky shadows.' },
                        { id: 'luxe', name: 'Dark Luxe', defaultThumb: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600', desc: 'Premium gold on pitch black luxury design.' },
                        { id: 'retro', name: 'Retro Grid', defaultThumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600', desc: 'Grotesk neon shadows flat retro theme.' }
                      ].map((tpl) => {
                        const customThumb = templateThumbnails[tpl.id] || '';
                        const currentThumb = customThumb || tpl.defaultThumb;

                        return (
                          <div key={tpl.id} className="bg-gray-950 border border-gray-850 rounded-xl overflow-hidden flex flex-col justify-between group shadow-sm transition-all hover:border-gray-800">
                            {/* Visual Header */}
                            <div className="w-full h-32 relative overflow-hidden bg-gray-900 border-b border-gray-850">
                              <img 
                                src={currentThumb} 
                                alt={tpl.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-black/60 rounded-full text-[9px] font-black text-white tracking-widest uppercase border border-white/10 backdrop-blur-md">
                                {tpl.id}
                              </div>
                              {!customThumb && (
                                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-blue-500/80 rounded text-[8px] font-bold text-white uppercase tracking-wider">
                                  Default Stock
                                </div>
                              )}
                              {customThumb && (
                                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-emerald-500/80 rounded text-[8px] font-bold text-white uppercase tracking-wider">
                                  Custom Active
                                </div>
                              )}
                            </div>

                            {/* Details & Action Controls */}
                            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                              <div className="space-y-1">
                                <h4 className="text-xs font-black text-white">{tpl.name}</h4>
                                <p className="text-[10px] text-gray-500 leading-normal">{tpl.desc}</p>
                              </div>

                              <div className="space-y-3 pt-2">
                                {/* Direct File Upload */}
                                <div>
                                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Upload Custom Thumbnail File</label>
                                  <label
                                    htmlFor={`thumbnail-file-${tpl.id}`}
                                    className="flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-gray-850 hover:border-blue-500 bg-gray-900 hover:bg-gray-900/60 cursor-pointer text-[10px] font-bold text-gray-400 hover:text-white transition-all text-center"
                                  >
                                    <Upload className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Choose Image File</span>
                                  </label>
                                  <input 
                                    type="file"
                                    accept="image/*"
                                    id={`thumbnail-file-${tpl.id}`}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      if (file.size > 2 * 1024 * 1024) {
                                        alert('⚠️ Thumbnail image too large. Please upload under 2MB.');
                                        return;
                                      }
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        const res = ev.target?.result;
                                        if (res) {
                                          setTemplateThumbnails(prev => ({
                                            ...prev,
                                            [tpl.id]: res as string
                                          }));
                                          setActionStatus(`Thumbnail uploaded for ${tpl.name}!`);
                                          setTimeout(() => setActionStatus(null), 2500);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                    className="hidden"
                                  />
                                </div>

                                {/* URL Textbox */}
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Or Paste Thumbnail Image URL</label>
                                  <input 
                                    type="text"
                                    value={customThumb.startsWith('data:') ? '[Base64 Uploaded File]' : customThumb}
                                    disabled={customThumb.startsWith('data:')}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setTemplateThumbnails(prev => ({
                                        ...prev,
                                        [tpl.id]: val
                                      }));
                                    }}
                                    placeholder="e.g. https://images.unsplash.com/..."
                                    className="w-full bg-gray-900 border border-gray-850 hover:border-gray-800 focus:border-blue-500 focus:outline-none rounded-lg px-2.5 py-1.5 text-[10px] text-white transition-all font-mono placeholder:text-gray-750 disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </div>

                                {/* Reset button */}
                                {customThumb && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTemplateThumbnails(prev => {
                                        const next = { ...prev };
                                        delete next[tpl.id];
                                        return next;
                                      });
                                      setActionStatus(`Reset ${tpl.name} thumbnail to Stock default.`);
                                      setTimeout(() => setActionStatus(null), 2500);
                                    }}
                                    className="text-[9px] text-red-400 hover:text-red-300 font-bold transition-all text-left flex items-center gap-1.5"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Reset to Default Preset Stock
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center gap-3 p-6 border-t border-gray-850 justify-end bg-gray-950/40">
              <button
                type="button"
                onClick={() => setIsBrandingOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveBrandSettings();
                  setIsBrandingOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors shadow-md shadow-blue-600/10 flex items-center gap-1.5"
              >
                Save Settings
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Drawing popup removed - now using stamp upload */}

      {/* Dynamic Logo Image Cropper Sub-Modal */}
      {rawImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6 shadow-2xl text-left animate-none">
            
            <div className="flex items-center justify-between border-b border-gray-850 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-400" />
                  Crop & Adjust SaaS Logo
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Reposition and scale your logo to fit perfectly</p>
              </div>
              <button 
                onClick={() => setRawImage(null)}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Canvas Crop Area */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative bg-gray-950 p-6 rounded-2xl border border-gray-850 shadow-inner flex items-center justify-center">
                <canvas 
                  ref={canvasRef} 
                  width={220} 
                  height={220}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUpOrLeave}
                  className="cursor-move rounded-full shadow-lg border border-gray-800"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-sans text-center">
                👉 <strong>Drag directly</strong> inside the circle above to reposition your logo
              </p>
            </div>

            {/* Sliders Controls */}
            <div className="space-y-4 bg-gray-950/50 p-4 rounded-xl border border-gray-850">
              {/* Zoom Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  <span>Zoom / Scale</span>
                  <span className="font-mono text-blue-400">{cropZoom.toFixed(1)}x</span>
                </div>
                <input 
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Advanced Fine-Tuning offsets */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Horizontal Offset (X)</label>
                  <input 
                    type="range"
                    min="-150"
                    max="150"
                    step="1"
                    value={cropX}
                    onChange={(e) => setCropX(parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Vertical Offset (Y)</label>
                  <input 
                    type="range"
                    min="-150"
                    max="150"
                    step="1"
                    value={cropY}
                    onChange={(e) => setCropY(parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 justify-end pt-4 border-t border-gray-850">
              <button
                type="button"
                onClick={() => setRawImage(null)}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-750 text-xs font-semibold text-white transition-colors shadow-md flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Apply Circular Crop
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
