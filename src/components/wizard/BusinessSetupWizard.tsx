'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, Lock, CheckCircle2, Globe, FileText, Printer, Download, 
  Phone, Check, QrCode, Smartphone, Upload, Trash, X, Clipboard, 
  HelpCircle, AlertTriangle, Eye, EyeOff, ChevronRight, Sparkles, Bot, MessageSquare
} from 'lucide-react';

interface TemplateOption {
  id: 'minimal' | 'artisan' | 'bold' | 'luxe' | 'retro' | 'admire';
  name: string;
  category: string;
  desc: string;
  color: string;
  thumb: string;
}

export default function BusinessSetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Progress & Resume
  const [welcomeBack, setWelcomeBack] = useState(false);

  // Subscription Plan & Signature
  const [selectedPlan, setSelectedPlan] = useState<string>('30');
  const [signature, setSignature] = useState<string | null>(null);
  const [isDrawingSig, setIsDrawingSig] = useState(false);
  const [isSignatureConfirmed, setIsSignatureConfirmed] = useState(false);
  const [assignedOfficer, setAssignedOfficer] = useState<any>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Payment states
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<string | null>(null);
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<'minimal' | 'artisan' | 'bold' | 'luxe' | 'retro' | 'admire'>('minimal');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [showAuthConfirmPassword, setShowAuthConfirmPassword] = useState(false);
  
  // Custom Webz AI Onboarding Assistant state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    { sender: 'ai', text: "Hello! I am Webz AI. I am here to guide you through setting up your CrevaWebs online store. What can I help you with?" }
  ]);

  // Form errors & domain checker
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [domainChecked, setDomainChecked] = useState(false);
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [advancedColor, setAdvancedColor] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    category: 'Fashion',
    logo: null as string | null,
    primaryColor: '#3B82F6',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    currency: 'INR',
    authEmail: '',
    authPassword: '',
    authConfirmPassword: '',
  });

  const defaultTemplates: Record<string, string> = {
    en: `1. PROVISIONS OF SERVICE: The Creva E-Commerce SaaS platform grants the undersigned Merchant the license to operate an automated retail storefront website using our cloud architecture. Custom domain mappings are active permissions subject to the subscription plan level.
2. PLAN RENEWALS & INQUIRY SYSTEM: The Merchant understands that platform billing utilizes an inquiry activation system. Upon plan expiration, storefront access may be suspended unless renewed by contacting the support sales team directly.
3. ACCEPTABLE USAGE & LEGAL LIMITS: The Merchant agrees to list only legally compliant goods. Sales of prohibited, illegal, counterfeited, or unauthorized products will lead to instant termination of this license without refund.
4. SECURITY & DATA PRIVACY: The platform will protect merchant database assets, catalog listings, and custom styling. The platform is not responsible for off-site customer disputes.`,
    ta: `1. சேவைகளின் விதிகள்: கிரெவா ஈ-காமர்ஸ் சாஸ் தளம், கையொப்பமிட்ட வணிகருக்கு எங்கள் கிளவுட் கட்டமைப்பைப் பயன்படுத்தி ஒரு தானியங்கி சில்லறை விற்பனை இணையதளத்தை இயக்க உரிமம் வழங்குகிறது. தனிப்பயன் டொமேன் இணைப்புகள் சந்தா திட்ட நிலைக்கு உட்பட்டது.
2. புதுப்பித்தல் மற்றும் விசாரிக்கும் முறை: வணிகர் தளம் கட்டணம் செலுத்தும் விசாரணை முறையை பயன்படுத்துகிறது என்பதை புரிந்து கொள்கிறார். சந்தா காலம் முடிந்ததும், ஆதரவு விற்பனை குழுவை நேரடியாக தொடர்பு கொண்டு புதுப்பிக்காவிட்டால் அணுகல் நிறுத்தப்படலாம்.
3. ஏற்கத்தக்க பயன்பாடு மற்றும் சட்ட வரம்புகள்: வணிகர் சட்டப்பூர்வமான பொருட்களை மட்டுமே பட்டியலிட ஒப்புக்கொள்கிறார். தடைசெய்யப்பட்ட, சட்டவிரோதமான அல்லது அங்கீகரிக்கப்படாத தயாரிப்புகளை விற்பனை செய்வது பணத்தைத் திரும்பப்பெறாமல் உடனடியாக இந்த உரிமத்தை ரத்து செய்ய வழிவகுக்கும்.
4. பாதுகாப்பு மற்றும் தரவு தனியுரிமை: இந்த தளம் வணிகர் தரவுத்தள சொத்துக்கள், தயாரிப்பு பட்டியல்கள் மற்றும் தனிப்பயன் பாணிகளைப் பாதுகாக்கும். தளம் சாராத வாடிக்கையாளர் தகராறுகளுக்கு இந்த தளம் பொறுப்பல்ல.`,
    hi: `1. सेवा के प्रावधान: क्रेवा ई-कॉमर्स सास प्लेटफॉर्म मर्चेंट को हमारे क्लाउड आर्किटेक्चर का उपयोग करके एक खुदरा स्टोर संचालित करने का लाइसेंस प्रदान करता है।
2. योजना नवीनीकरण: मर्चेंट समझता है कि प्लेटफॉर्म बिलिंग पूछताछ प्रणाली का उपयोग करती है। नवीनीकरण न किए जाने तक स्टोरफ्रंट निलंबित किया जा सकता है।
3. स्वीकार्य उपयोग: मर्चेंट केवल कानूनी रूप से अनुपालन करने वाले सामानों को सूचीबद्ध करने के लिए सहमत है। प्रतिबंधित उत्पादों की बिक्री पर तत्काल लाइसेंस रद्द कर दिया जाएगा।
4. सुरक्षा और गोपनीयता: प्लेटफॉर्म मर्चेंट डेटाबेस संपत्ति, कैटलॉग लिस्टिंग और कस्टम स्टाइलिंग की रक्षा करेगा।`
  };

  const [agreementTemplates] = useState<Record<string, string>>(defaultTemplates);
  const [selectedAgreementLang, setSelectedAgreementLang] = useState<string>('en');
  const [globalSettings, setGlobalSettings] = useState<any>(null);

  // Resume state if exists in localstorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('creva_onboarding_draft');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(prev => ({ ...prev, ...parsed.data }));
          setStep(parsed.step || 1);
          setWelcomeBack(true);
        } catch(e) {}
      }
    }
  }, []);

  // Save progress changes
  const saveProgress = (nextStepNum: number) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('creva_onboarding_draft', JSON.stringify({
        step: nextStepNum,
        data: formData
      }));
    }
  };

  // Pre-select template from URL
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
      } else if (tempParam === 'admire' || tempParam === '6') {
        setSelectedTemplate('admire');
        setFormData(prev => ({ ...prev, primaryColor: '#f2852a' }));
      }
    }
  }, []);

  // Fetch settings
  useEffect(() => {
    const loadGlobalSettings = async () => {
      try {
        const { data } = await supabase
          .from('stores')
          .select('description')
          .eq('subdomain', '__creva_saas_global_settings__')
          .maybeSingle();

        if (data && data.description) {
          const parsed = JSON.parse(data.description);
          setGlobalSettings(parsed);
        }
      } catch (err) {}
    };
    loadGlobalSettings();
  }, []);

  // Set licensing officer
  useEffect(() => {
    if (step === 5 && !assignedOfficer) {
      const officersList = [
        { id: 1, name: 'Kavin Kumar', title: 'Senior Licensing Officer', signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50" viewBox="0 0 150 50"><text x="10" y="35" font-family="Brush Script MT, cursive" font-size="26" fill="%230f172a">Kavin Kumar</text></svg>' },
        { id: 2, name: 'Preethi Rajan', title: 'Licensing Director', signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50" viewBox="0 0 150 50"><text x="10" y="35" font-family="Brush Script MT, cursive" font-size="26" fill="%230f172a">Preethi R.</text></svg>' }
      ];
      setAssignedOfficer(officersList[Math.floor(Math.random() * officersList.length)]);
    }
  }, [step, assignedOfficer]);

  // Init canvas signature pad
  useEffect(() => {
    if (step === 5) {
      const timer = setTimeout(() => {
        const canvas = sigCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const validateStep = (s: number): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!formData.businessName.trim()) errs.businessName = 'Please enter your business name.';
      else if (formData.businessName.trim().length < 3) errs.businessName = 'Business name must be at least 3 characters.';
      if (!formData.category) errs.category = 'Business category is required.';
      if (!formData.businessDescription.trim()) errs.businessDescription = 'Please provide a short description.';
    }
    if (s === 3) {
      if (!formData.ownerName.trim()) errs.ownerName = 'Please enter your full name.';
      if (!formData.email.trim()) errs.email = 'Email address is required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errs.email = 'Please enter a valid email address.';
      if (!formData.phone.trim()) errs.phone = 'Phone number is required.';
      else if (formData.phone.replace(/\D/g, '').length < 10) errs.phone = 'Phone number must be at least 10 digits.';
      if (!formData.address.trim()) errs.address = 'Business address is required.';
      if (!formData.city.trim()) errs.city = 'City is required.';
      if (!formData.state.trim()) errs.state = 'State is required.';
      if (!formData.pincode.trim()) errs.pincode = 'Pincode is required.';
    }
    return errs;
  };

  const nextStep = () => {
    setErrors({});
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    
    if (step === 4 && !domainChecked) {
      alert("Please check subdomain availability to proceed.");
      return;
    }
    if (step === 4 && !domainAvailable) {
      alert("Subdomain address is not available. Please try another name.");
      return;
    }

    if (step === 5) {
      if (!signature || !isSignatureConfirmed) {
        alert("Please draw and confirm your signature to continue.");
        return;
      }
      if (!paymentScreenshotUrl) {
        alert("Please upload your payment verification screenshot.");
        return;
      }
    }

    const nextStepNum = Math.min(step + 1, 6);
    setStep(nextStepNum);
    saveProgress(nextStepNum);
  };

  const prevStep = () => {
    const prevStepNum = Math.max(step - 1, 1);
    setStep(prevStepNum);
    saveProgress(prevStepNum);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'businessName') {
      setDomainChecked(false);
      setDomainAvailable(null);
    }
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  // Logo upload
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo must be under 2MB.");
        return;
      }
      setLogoUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `logo-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `store-logos/${fileName}`;

        const { data, error } = await supabase.storage
          .from('products')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
        setFormData(prev => ({ ...prev, logo: publicUrl }));
      } catch (err: any) {
        console.error(err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, logo: reader.result as string }));
        };
        reader.readAsDataURL(file);
      } finally {
        setLogoUploading(false);
      }
    }
  };

  // Screenshot upload
  const handleScreenshotFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Screenshot must be under 5MB.");
        return;
      }
      setScreenshotUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `payment-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `payment-screenshots/${fileName}`;

        const { data, error } = await supabase.storage
          .from('products')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
        setPaymentScreenshotUrl(publicUrl);
        setPaymentScreenshot(publicUrl);
      } catch (err: any) {
        console.error(err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPaymentScreenshot(reader.result as string);
          setPaymentScreenshotUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setScreenshotUploading(false);
      }
    }
  };

  // Subdomain checker
  const handleCheckDomain = async () => {
    const slug = formData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').trim();
    if (!slug) {
      alert("Please enter a business name first.");
      return;
    }
    setCheckingDomain(true);
    try {
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('subdomain', slug)
        .maybeSingle();

      setDomainAvailable(!data);
      setDomainChecked(true);
    } catch(e) {
      setDomainAvailable(true);
      setDomainChecked(true);
    } finally {
      setCheckingDomain(false);
    }
  };

  // Signature drawing pad
  const startDrawingSig = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawingSig(true);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
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

  const stopDrawingSig = () => setIsDrawingSig(false);

  const confirmSig = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
      setIsSignatureConfirmed(true);
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

  const getSelectedPlanAmount = (): string => {
    if (selectedPlan === '30') return '499';
    if (selectedPlan === '365') return '3999';
    return '9999';
  };

  const getSelectedPlanLabel = (): string => {
    if (selectedPlan === '30') return '1 Month (₹499)';
    if (selectedPlan === '365') return '1 Year (₹3,999)';
    return 'Lifetime (₹9,999)';
  };

  // Submit and create account
  const handleSubmit = async () => {
    setErrors({});
    if (!formData.authEmail.trim() || !formData.authPassword) {
      alert("Please enter login credentials.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.authEmail,
        password: formData.authPassword,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Account creation failed.');

      const subdomain = formData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').trim();
      const contractDetails = {
        signedName: formData.ownerName,
        signatureUrl: signature,
        signedDate: new Date().toLocaleDateString('en-IN'),
        termsText: agreementTemplates[selectedAgreementLang],
        selectedPlan,
        assignedOfficer,
        paymentScreenshotUrl,
        paymentStatus: 'pending',
        selectedTemplate
      };

      const now = new Date();
      const expiryDate = selectedPlan === '30' 
        ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        : selectedPlan === '365'
          ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
          : new Date(now.getTime() + 99999 * 24 * 60 * 60 * 1000);

      const { error: storeError } = await supabase
        .from('stores')
        .insert([{
          owner_id: authData.user.id,
          store_name: formData.businessName,
          subdomain,
          business_category: formData.category,
          description: JSON.stringify(contractDetails),
          primary_color: formData.primaryColor,
          logo_url: formData.logo,
          currency: formData.currency,
          contact_email: formData.email,
          contact_phone: formData.phone,
          subscription_expires_at: expiryDate,
          custom_domain_enabled: false,
          is_paused: true
        }]);

      if (storeError) throw storeError;

      // Register domains
      try {
        await fetch('/api/domains/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subdomain }),
        });
      } catch (domainErr) {}

      // Clean local storage draft
      localStorage.removeItem('creva_onboarding_draft');

      // Success routing
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  // Assistant chatbot parser
  const handleAssistantAction = (query: string) => {
    setAiMessages(prev => [...prev, { sender: 'user', text: query }]);
    
    let aiText = "I can help guide you on this step! Let me know if you need assistance with inputs.";
    if (query === 'Explain this step') {
      if (step === 1) aiText = "On this step, we collect your business name, a short description for your shop, and category settings.";
      if (step === 2) aiText = "Here, select your website theme layout, upload a brand logo, and customize button highlight colors.";
      if (step === 3) aiText = "Provide your contact number, support email, and store coordinates for invoice generations.";
      if (step === 4) aiText = "Define your unique storefront subdomain (e.g. yourname.crevawebs.in) and preferred sales currency.";
      if (step === 5) aiText = "Choose a billing plan, draw your license signature, scan the UPI QR, and upload verification screenshots.";
      if (step === 6) aiText = "Define your admin login credentials (email and password parameters).";
    } else if (query === 'Help me choose a template') {
      aiText = "If you sell beauty or clothes, 'Minimal' or 'Bold' themes provide excellent layouts. Natural products look fantastic with 'Artisan'!";
    } else if (query === 'What is a subdomain?') {
      aiText = "A subdomain is your free digital address. e.g. entering 'myorganicsoaps' creates 'myorganicsoaps.crevawebs.in'. You can map a custom commercial domain later.";
    }

    setTimeout(() => {
      setAiMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
    }, 600);
  };

  // Templates options list
  const templatesList: TemplateOption[] = [
    { id: 'minimal', name: 'Minimal Elegance', category: 'Fashion & Boutique', desc: 'Sleek borders, white spaces, and high contrast layout.', color: '#000000', thumb: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=300' },
    { id: 'artisan', name: 'Artisan Craft', category: 'Natural Goods', desc: 'Warm tones, soft neutral grids, and comfortable borders.', color: '#8B5A2B', thumb: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=300' },
    { id: 'bold', name: 'Bold Commerce', category: 'Electronics & Retail', desc: 'Dark outlines, uppercase headers, and solid action boxes.', color: '#E11D48', thumb: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=300' },
    { id: 'luxe', name: 'Dark Luxe', category: 'Luxury & Jewelry', desc: 'Elegant typography, gold color highlights, premium grids.', color: '#D4AF37', thumb: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col justify-between min-h-[500px]">
      
      {/* Dynamic horizontal step indicator (Desktop) */}
      <div className="hidden md:flex items-center justify-between border-b border-slate-100 pb-6 mb-8 text-[11px] font-black uppercase tracking-wider text-slate-400 select-none">
        {[
          { num: 1, label: 'Business' },
          { num: 2, label: 'Branding' },
          { num: 3, label: 'Contact' },
          { num: 4, label: 'Preferences' },
          { num: 5, label: 'Plan & Pay' },
          { num: 6, label: 'Account' }
        ].map((s) => {
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <div key={s.num} className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : isDone 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'bg-slate-50 text-slate-400'
              }`}>
                {isDone ? '✓' : s.num}
              </span>
              <span className={isActive ? 'text-slate-900 font-extrabold' : isDone ? 'text-slate-650' : ''}>
                {s.label}
              </span>
              {s.num < 6 && <ChevronRight className="w-3.5 h-3.5 text-slate-350" />}
            </div>
          );
        })}
      </div>

      {/* Mobile Step details */}
      <div className="md:hidden flex flex-col gap-2 mb-6 text-left">
        <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Step {step} of 6</span>
          <span>{Math.round((step / 6) * 100)}% Complete</span>
        </div>
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(step / 6) * 100}%` }} />
        </div>
      </div>

      {/* Welcome Back Banner */}
      {welcomeBack && (
        <div className="p-3 mb-6 bg-blue-50 border border-blue-150 rounded-xl text-xs text-blue-800 text-left font-semibold flex items-center justify-between">
          <span>👋 Welcome back! Your onboarding setup is draft saved and successfully restored.</span>
          <button onClick={() => setWelcomeBack(false)} className="p-1 hover:bg-blue-100 rounded-lg"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Steps Main Content Panels */}
      <div className="bg-white text-slate-800 flex-1">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: BUSINESS INFORMATION */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left"
            >
              <div>
                <h2 className="text-2xl font-black text-slate-900">Tell us about your business</h2>
                <p className="text-slate-500 text-xs mt-1">Let's start with a few basic details to personalize your online store.</p>
              </div>

              <div className="space-y-4 max-w-xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-650 uppercase tracking-wider block">Business Name *</label>
                  <input 
                    type="text" 
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="e.g. Handmade Soaps Co."
                    className={`w-full bg-white border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 transition-colors shadow-sm placeholder:text-slate-350 ${
                      errors.businessName ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                  {errors.businessName && <span className="text-[10px] text-red-500 font-bold block">{errors.businessName}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-650 uppercase tracking-wider block">Business Category *</label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 transition-colors shadow-sm cursor-pointer"
                  >
                    <option value="Fashion">Fashion & Boutique</option>
                    <option value="Food & Grocery">Food & Grocery</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Beauty">Beauty & Cosmetics</option>
                    <option value="Home & Lifestyle">Home & Lifestyle</option>
                    <option value="Services">Services</option>
                    <option value="Handmade">Handmade & Crafts</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-650 uppercase tracking-wider block">About your business *</label>
                    <span className="text-[10px] text-slate-400 font-semibold">{formData.businessDescription.length} / 300</span>
                  </div>
                  <textarea 
                    name="businessDescription"
                    value={formData.businessDescription}
                    onChange={handleChange}
                    maxLength={300}
                    placeholder="Tell customers what your business offers..."
                    rows={4}
                    className={`w-full bg-white border rounded-xl p-4 text-xs outline-none focus:border-blue-500 text-slate-800 resize-none transition-colors shadow-sm placeholder:text-slate-350 ${
                      errors.businessDescription ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                  {errors.businessDescription && <span className="text-[10px] text-red-500 font-bold block">{errors.businessDescription}</span>}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: BRANDING CUSTOMIZER */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 text-left"
            >
              <div>
                <h2 className="text-2xl font-black text-slate-900">Make your store look like your brand</h2>
                <p className="text-slate-500 text-xs mt-1">Choose a design layout and add your logo coordinates. You can edit this later.</p>
              </div>

              {/* Template gallery selection */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-650 uppercase tracking-wider block">Select Storefront Template Theme</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {templatesList.map((t) => {
                    const isSelected = selectedTemplate === t.id;
                    return (
                      <div 
                        key={t.id}
                        onClick={() => {
                          setSelectedTemplate(t.id);
                          setFormData(prev => ({ ...prev, primaryColor: t.color }));
                        }}
                        className={`border rounded-2xl overflow-hidden bg-white cursor-pointer transition-all hover:scale-102 hover:shadow-md flex flex-col ${
                          isSelected ? 'border-blue-600 shadow-sm ring-1 ring-blue-500/20' : 'border-slate-200 hover:border-slate-350'
                        }`}
                      >
                        <div className="aspect-[4/3] bg-slate-50 border-b border-slate-100 overflow-hidden relative">
                          <img src={t.thumb} alt={t.name} className="w-full h-full object-cover" />
                          {isSelected && (
                            <span className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1 shadow-sm"><Check className="w-3.5 h-3.5" /></span>
                          )}
                        </div>
                        <div className="p-3 text-left flex-1 flex flex-col justify-between gap-1">
                          <div>
                            <h4 className="font-bold text-xs text-slate-950">{t.name}</h4>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">{t.category}</span>
                            <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">{t.desc}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upload logo drag drop & Brand Color pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-2">
                
                {/* Logo upload card */}
                <div className="space-y-3 flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-650 uppercase tracking-wider block">Add your logo</span>
                  
                  {!formData.logo ? (
                    <div className="relative border border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50/50 transition-colors h-[120px]">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={logoUploading}
                      />
                      {logoUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-slate-400 mb-2" />
                          <span className="text-xs font-semibold text-slate-700 block">Drag & drop logo here, or choose file</span>
                          <span className="text-[9px] text-slate-400 mt-0.5 block">PNG, JPG, SVG up to 2MB</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img src={formData.logo} alt="Logo" className="w-14 h-14 rounded-lg object-contain border bg-white" />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Store Logo Attached</span>
                          <span className="text-[9px] text-emerald-600 font-bold uppercase mt-0.5 block">✓ Configured</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, logo: null }))}
                        className="p-2 bg-white hover:bg-red-50 text-red-650 rounded-xl border border-slate-200 hover:border-red-200 transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Color Picker with live preview */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-650 uppercase tracking-wider block">Choose your brand color</span>
                    <div className="flex flex-wrap gap-2.5 select-none">
                      {['#3B82F6', '#8B5A2B', '#E11D48', '#D4AF37', '#8B5CF6', '#10B981', '#F59E0B', '#000000'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, primaryColor: color }))}
                          className={`w-7 h-7 rounded-full border transition-all ${
                            formData.primaryColor === color ? 'ring-2 ring-blue-500 scale-105 border-white' : 'border-slate-200'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <button 
                        type="button"
                        onClick={() => setAdvancedColor(!advancedColor)}
                        className="text-[10px] font-bold text-blue-600 border border-blue-200 bg-blue-50/50 px-2.5 py-1.5 rounded-xl"
                      >
                        {advancedColor ? 'Simple Colors' : 'Advanced HEX'}
                      </button>
                    </div>

                    {advancedColor && (
                      <input 
                        type="text"
                        name="primaryColor"
                        value={formData.primaryColor}
                        onChange={handleChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-blue-500 text-slate-800"
                        placeholder="#HEX color value"
                      />
                    )}
                  </div>

                  {/* Live preview component */}
                  <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Live Button Preview:</span>
                    <button 
                      type="button"
                      className="px-5 py-2.5 rounded-xl text-white font-bold text-[10px] uppercase tracking-wider shadow-md pointer-events-none transition-colors"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      Explore Catalog →
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 3: CONTACT DETAILS */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left"
            >
              <div>
                <h2 className="text-2xl font-black text-slate-900">How can customers reach you?</h2>
                <p className="text-slate-500 text-xs mt-1">Add your merchant contact details so clients know how to get in touch.</p>
              </div>

              <div className="space-y-6">
                
                {/* Contact information group */}
                <div className="space-y-4 max-w-xl">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider block border-b pb-1">Contact Information</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase block">Full Name *</label>
                      <input 
                        type="text" 
                        name="ownerName"
                        value={formData.ownerName}
                        onChange={handleChange}
                        className={`w-full bg-white border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 ${
                          errors.ownerName ? 'border-red-400' : 'border-slate-200'
                        }`}
                      />
                      {errors.ownerName && <span className="text-[10px] text-red-500 font-bold block">{errors.ownerName}</span>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase block">Phone Number *</label>
                      <div className="flex gap-2">
                        <span className="px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center text-xs font-bold text-slate-450 select-none">+91</span>
                        <input 
                          type="text" 
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="98765 43210"
                          className={`w-full bg-white border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 ${
                            errors.phone ? 'border-red-400' : 'border-slate-200'
                          }`}
                        />
                      </div>
                      {errors.phone && <span className="text-[10px] text-red-500 font-bold block">{errors.phone}</span>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase block">Email Address *</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full bg-white border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 ${
                        errors.email ? 'border-red-400' : 'border-slate-200'
                      }`}
                    />
                    {errors.email && <span className="text-[10px] text-red-500 font-bold block">{errors.email}</span>}
                  </div>
                </div>

                {/* Address information group */}
                <div className="space-y-4 max-w-xl">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider block border-b pb-1">Business Address</span>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase block">Street Address *</label>
                    <input 
                      type="text" 
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`w-full bg-white border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 ${
                        errors.address ? 'border-red-400' : 'border-slate-200'
                      }`}
                    />
                    {errors.address && <span className="text-[10px] text-red-500 font-bold block">{errors.address}</span>}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase block">City *</label>
                      <input 
                        type="text" 
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 ${
                          errors.city ? 'border-red-400' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase block">State *</label>
                      <input 
                        type="text" 
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 ${
                          errors.state ? 'border-red-400' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 uppercase block">Pincode *</label>
                      <input 
                        type="text" 
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 ${
                          errors.pincode ? 'border-red-400' : 'border-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                  {(errors.city || errors.state || errors.pincode) && <span className="text-[10px] text-red-500 font-bold block">Please fill in all address parameters.</span>}
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 4: STORE PREFERENCES */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left"
            >
              <div>
                <h2 className="text-2xl font-black text-slate-900">Set up your store preferences</h2>
                <p className="text-slate-500 text-xs mt-1">Configure your domain mapping details and currency options.</p>
              </div>

              <div className="space-y-5 max-w-xl">
                
                {/* Subdomain Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-650 uppercase tracking-wider block">Choose your store address</label>
                  <div className="flex gap-2">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 flex-1 focus-within:border-blue-500 transition-colors">
                      <span className="text-xs font-bold text-slate-400 select-none">https://</span>
                      <input 
                        type="text" 
                        name="businessName"
                        value={formData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}
                        onChange={handleChange}
                        placeholder="your-store-name"
                        className="bg-transparent border-none outline-none pl-1 py-3 text-xs font-bold text-slate-800 w-full placeholder:text-slate-350"
                      />
                      <span className="text-xs font-bold text-slate-400 select-none">.crevawebs.in</span>
                    </div>
                    <button 
                      type="button"
                      onClick={handleCheckDomain}
                      disabled={checkingDomain || !formData.businessName.trim()}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider px-5 py-3 rounded-xl transition-all disabled:opacity-50 shrink-0"
                    >
                      {checkingDomain ? 'Checking...' : 'Check Availability'}
                    </button>
                  </div>

                  {domainChecked && (
                    <div className="pt-1 text-xs">
                      {domainAvailable ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">✓ Available! Your online storefront will launch at this address.</span>
                      ) : (
                        <span className="text-red-500 font-bold flex items-center gap-1">✕ This address name is already taken. Please customize your business name input.</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Currency selector */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-slate-650 uppercase tracking-wider block">Store currency</label>
                  <select 
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 shadow-sm cursor-pointer"
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">United States Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block mt-1">You can change your storefront sales currency later from settings.</span>
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 5: PLANS, SIGNATURE, PAYMENTS */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left"
            >
              <div>
                <h2 className="text-2xl font-black text-slate-900">Choose your plan & complete setup</h2>
                <p className="text-slate-500 text-xs mt-1">Complete your licensing agreement and pay setup fees to activate your store.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Plans & Agreement Signing */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Plan Cards */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-650 uppercase tracking-wider block">Select Platform Plan</span>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: '30', name: 'Starter', price: '499', days: '30' },
                        { id: '365', name: 'Growth', price: '3,999', days: '1 Year' },
                        { id: 'lifetime', name: 'Lifetime', price: '9,999', days: 'Permanent' }
                      ].map((p) => {
                        const isSel = selectedPlan === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPlan(p.id)}
                            className={`p-4 border rounded-xl bg-white text-left cursor-pointer transition-all ${
                              isSel ? 'border-blue-600 bg-blue-50/10' : 'border-slate-200 hover:border-slate-350'
                            }`}
                          >
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{p.name}</span>
                            <span className="text-lg font-black text-slate-950 mt-1 block">₹{p.price}</span>
                            <span className="text-[9px] text-slate-400 block mt-1">{p.days}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Licensing Agreement Sign block */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-650 uppercase tracking-wider">Merchant Licensing Agreement</span>
                      <button 
                        type="button"
                        onClick={() => setShowAgreementModal(true)}
                        className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5"
                      >
                        Read Full License →
                      </button>
                    </div>

                    {/* Signature Canvas */}
                    <div className="space-y-2">
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner">
                        <canvas
                          ref={sigCanvasRef}
                          width={350}
                          height={120}
                          onMouseDown={startDrawingSig}
                          onMouseMove={drawSig}
                          onMouseUp={stopDrawingSig}
                          onMouseLeave={stopDrawingSig}
                          onTouchStart={startDrawingSig}
                          onTouchMove={drawSig}
                          onTouchEnd={stopDrawingSig}
                          className="w-full h-[120px] block cursor-crosshair"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={confirmSig}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold shadow-sm"
                        >
                          Confirm & Lock Signature
                        </button>
                        <button 
                          type="button" 
                          onClick={clearSig}
                          className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-lg text-[10px] font-semibold"
                        >
                          Clear
                        </button>
                      </div>

                      {isSignatureConfirmed && (
                        <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 pt-1">
                          ✓ Digital signature recorded and verified.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: UPI Scan QR Payment */}
                <div className="lg:col-span-6 border border-slate-200/80 rounded-2xl p-6 bg-slate-55 flex flex-col gap-5 justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">UPI SCAN PAYMENT</span>
                    <h4 className="font-bold text-xs text-slate-850 mt-1">Setup fee: ₹{getSelectedPlanAmount()}</h4>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="w-28 h-28 bg-white border border-slate-200 p-2 rounded-xl shrink-0 shadow-sm">
                      {/* Simple visual vector QR code simulation */}
                      <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                        <path d="M5 5h30v30H5zm45 0h30v30H50zM5 50h30v30H5zm45 10h10v10H50zm10-10h10v10h-10zm20 20h10v10H80zm-10-10h10v10h-10z" fill="currentColor" />
                        <rect x="12" y="12" width="16" height="16" fill="currentColor" />
                        <rect x="57" y="12" width="16" height="16" fill="currentColor" />
                        <rect x="12" y="57" width="16" height="16" fill="currentColor" />
                      </svg>
                    </div>
                    
                    <div className="text-left space-y-2 text-[11px] text-slate-500 leading-relaxed">
                      <p>1. Scan the QR code using Google Pay, PhonePe, or Paytm.</p>
                      <p>2. Send the exact setup fee of <strong>₹{getSelectedPlanAmount()}</strong>.</p>
                      <p>3. Capture and upload your payment confirmation receipt screenshot.</p>
                    </div>
                  </div>

                  {/* Screenshot Dropzone */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-650 uppercase block">Upload screenshot confirmation *</span>
                    
                    {!paymentScreenshot ? (
                      <div className="relative border border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors h-[90px]">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleScreenshotFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={screenshotUploading}
                        />
                        {screenshotUploading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-slate-400 mb-1" />
                            <span className="text-[10px] font-semibold text-slate-700">Choose file or drag & drop</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <img src={paymentScreenshot} alt="Receipt" className="w-10 h-10 object-cover rounded border" />
                          <div>
                            <span className="text-[10px] font-bold text-slate-800 block">Screenshot Attached</span>
                            <span className="text-[9px] text-emerald-600 font-bold block">✓ Ready</span>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => { setPaymentScreenshot(null); setPaymentScreenshotUrl(null); }}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg border border-red-200"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 6: ACCOUNT CREATION */}
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-left"
            >
              <div className="text-center max-w-sm mx-auto space-y-3 py-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-150 mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Create your login credentials</h2>
                  <p className="text-slate-500 text-xs mt-1">Set up your owner details to log in to the admin panel dashboard later.</p>
                </div>
              </div>

              <div className="space-y-4 max-w-sm mx-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-650 uppercase tracking-wider block">Email Address *</label>
                  <input 
                    type="email" 
                    name="authEmail"
                    value={formData.authEmail}
                    onChange={handleChange}
                    placeholder="you@domain.com"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-650 uppercase tracking-wider block">Password *</label>
                  <div className="relative">
                    <input 
                      type={showAuthPassword ? "text" : "password"} 
                      name="authPassword"
                      value={formData.authPassword}
                      onChange={handleChange}
                      placeholder="Min 8 chars, uppercase, number"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthPassword(!showAuthPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {formData.authPassword.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${formData.authPassword.length >= 8 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400'}`}>8+ Chars</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${/[A-Z]/.test(formData.authPassword) ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400'}`}>Uppercase</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${/[0-9]/.test(formData.authPassword) ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400'}`}>Number</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-650 uppercase tracking-wider block">Confirm Password *</label>
                  <div className="relative">
                    <input 
                      type={showAuthConfirmPassword ? "text" : "password"} 
                      name="authConfirmPassword"
                      value={formData.authConfirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs outline-none focus:border-blue-500 text-slate-800 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthConfirmPassword(!showAuthConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showAuthConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-650 text-xs rounded-xl border border-red-200 text-left font-semibold">
          ⚠ {error}
        </div>
      )}

      {/* Onboarding Wizard Footer Navigation Controls */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between select-none">
        <button
          onClick={prevStep}
          disabled={step === 1 || loading}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 hover:border-slate-350 bg-white px-6 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
        >
          ← Back
        </button>
        {step < 6 ? (
          <button
            onClick={nextStep}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 px-8 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-500/10 transition-colors cursor-pointer"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-550 hover:to-indigo-550 px-8 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-blue-500/10 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Launching Store...
              </>
            ) : (
              'Launch My Store →'
            )}
          </button>
        )}
      </div>

      {/* Licensing Terms & Conditions Agreement Full Modal Drawer */}
      <AnimatePresence>
        {showAgreementModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Licensing Agreement Full Terms</span>
                <button onClick={() => setShowAgreementModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-500 leading-relaxed text-left space-y-4">
                <div className="flex gap-2 mb-2 select-none">
                  <button onClick={() => setSelectedAgreementLang('en')} className={`px-3 py-1 rounded text-[10px] font-bold ${selectedAgreementLang==='en' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'border'}`}>English</button>
                  <button onClick={() => setSelectedAgreementLang('ta')} className={`px-3 py-1 rounded text-[10px] font-bold ${selectedAgreementLang==='ta' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'border'}`}>Tamil</button>
                </div>
                <p className="whitespace-pre-line bg-slate-50 p-4 border rounded-xl font-mono text-[10.5px]">
                  {agreementTemplates[selectedAgreementLang] || defaultTemplates[selectedAgreementLang]}
                </p>
              </div>
              <div className="p-4 border-t border-slate-100 flex justify-end">
                <button onClick={() => setShowAgreementModal(false)} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase rounded-xl">Accept & Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 14. DYNAMIC INTEGRATED WEBZ AI WIZARD HELPER */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
        {aiOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-80 h-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left font-sans"
          >
            <div className="bg-slate-900 text-white p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-slate-800 rounded-lg"><Bot className="w-4 h-4" /></div>
                <div>
                  <h4 className="font-extrabold text-[10px] uppercase tracking-wider">Webz AI Setup Helper</h4>
                  <span className="text-[8px] text-slate-400 block font-semibold">Online Assistant</span>
                </div>
              </div>
              <button onClick={() => setAiOpen(false)} className="p-1 hover:bg-slate-800 rounded text-slate-450"><X className="w-3.5 h-3.5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-slate-50/20">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                  <div className={`p-2.5 rounded-2xl text-[11px] leading-relaxed border ${
                    msg.sender === 'user' ? 'bg-blue-600 text-white border-blue-650' : 'bg-white text-slate-800 border-slate-200'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-slate-100 bg-white flex flex-col gap-2 shrink-0">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Choose Helper Prompt</span>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 select-none">
                <button 
                  onClick={() => handleAssistantAction('Explain this step')}
                  className="px-2.5 py-1 text-[9px] bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-600 whitespace-nowrap cursor-pointer hover:bg-slate-100"
                >
                  💡 Explain Step
                </button>
                {step === 2 && (
                  <button 
                    onClick={() => handleAssistantAction('Help me choose a template')}
                    className="px-2.5 py-1 text-[9px] bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-600 whitespace-nowrap cursor-pointer hover:bg-slate-100"
                  >
                    🎨 Suggest Theme
                  </button>
                )}
                {step === 4 && (
                  <button 
                    onClick={() => handleAssistantAction('What is a subdomain?')}
                    className="px-2.5 py-1 text-[9px] bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-600 whitespace-nowrap cursor-pointer hover:bg-slate-100"
                  >
                    🌐 What is a domain?
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <button
          onClick={() => setAiOpen(!aiOpen)}
          className="bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-full shadow-lg flex items-center justify-center cursor-pointer"
        >
          <Bot className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}
