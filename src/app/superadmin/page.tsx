'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import SuperAdminIamView from '@/components/superadmin/SuperAdminIamView';
import { 
  Building2, Globe, ShieldAlert, ShieldCheck, Play, Pause, 
  Search, RefreshCw, Copy, Check, Database, HelpCircle,
  Infinity, Calendar, Clock, Zap, Plus, FileText, X, Printer, Send, Upload, Trash2, Smartphone, Layers,
  ToggleLeft, ToggleRight, MessageSquare, Plug, Key, Loader2,
  Maximize2, Minimize2, Bell, ChevronDown, User, LogOut, Menu
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [newStoreAlert, setNewStoreAlert] = useState<any>(null);
  const [knownPendingCount, setKnownPendingCount] = useState<number | null>(null);

  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push('/superadmin/login');
          return;
        }
        // SECURITY: Enforce superadmin or staff role — any merchant who navigates here is redirected
        if (authUser.role !== 'superadmin' && authUser.role !== 'staff') {
          router.push('/admin');
          return;
        }
        setUser(authUser);
      } catch (e) {
        console.error("Auth check failed:", e);
        router.push('/superadmin/login');
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.header-dropdown-trigger') || target.closest('.header-dropdown-container')) {
        return;
      }
      setShowProfileDropdown(false);
      setShowNotifications(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/superadmin/login');
  };

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
  const [onboardVideoUrl, setOnboardVideoUrl] = useState<string>('https://www.youtube.com/embed/7V2eS8W1cCc');
  const [modalTab, setModalTab] = useState<'billing' | 'profile' | 'contract' | 'payment'>('billing');
  
  // Password Reset Modal States
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetStore, setResetStore] = useState<any | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  
  // Main view toggle: stores vs support tickets
  const [mainView, setMainView] = useState<'stores' | 'support' | 'iam'>('stores');

  // Support Tickets
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [supportTicketsLoading, setSupportTicketsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [supportSearch, setSupportSearch] = useState('');
  const [supportStatusFilter, setSupportStatusFilter] = useState('all');
  const [ticketReply, setTicketReply] = useState('');
  const [ticketReplyLoading, setTicketReplyLoading] = useState(false);

  // Advanced filters and branding dashboard states
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isBrandingOpen, setIsBrandingOpen] = useState<boolean>(false);
  const [activeSettingTab, setActiveSettingTab] = useState<'branding' | 'pricing' | 'officers' | 'agreement' | 'templates' | 'whatsapp' | 'integrations'>('branding');
  const [whatsappEnabledGlobal, setWhatsappEnabledGlobal] = useState<boolean>(true);
  const [whatsappPlansEnabled, setWhatsappPlansEnabled] = useState<string[]>(['30', '365', 'lifetime']);
  const [whatsappPlansOrderUpdatesEnabled, setWhatsappPlansOrderUpdatesEnabled] = useState<string[]>(['365', 'lifetime']);
  const [whatsappDefaultWelcome, setWhatsappDefaultWelcome] = useState<string>('Hi, I would like to query about your products!');

  const [globalPaymentGateways, setGlobalPaymentGateways] = useState<Record<string, { enabled: boolean, plans: string[] }>>({
    razorpay: { enabled: true, plans: ['30', '365', 'lifetime'] },
    phonepe: { enabled: false, plans: ['365', 'lifetime'] },
    cashfree: { enabled: false, plans: ['365', 'lifetime'] },
    payu: { enabled: false, plans: ['365', 'lifetime'] }
  });

  const [globalIntegrations, setGlobalIntegrations] = useState<Record<string, boolean>>({
    shiprocket: false,
    delhivery: false,
    ga4: false
  });

  // Custom storefront templates thumbnail state
  const [templateThumbnails, setTemplateThumbnails] = useState<Record<string, string>>({
    minimal: '',
    artisan: '',
    bold: '',
    luxe: '',
    retro: '',
    admire: ''
  });

  // Custom subscription packages states (legacy — kept for backwards compat in save)
  const [customPackages, setCustomPackages] = useState<any[]>([]);
  const [disabledDefaultPackages, setDisabledDefaultPackages] = useState<string[]>([]);
  const [newPkgName, setNewPkgName] = useState<string>('');
  const [newPkgDuration, setNewPkgDuration] = useState<string>('3');
  const [newPkgDurationType, setNewPkgDurationType] = useState<'day' | 'month' | 'year'>('month');
  const [newPkgPrice, setNewPkgPrice] = useState<string>('');

  // Unified subscription plans (new format)
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([
    { id: 'plan_30', name: '1 Month Plan', price: '499', days: 30, description: 'Best for trial storefronts', badge: '', isActive: true, displayOrder: 1 },
    { id: 'plan_365', name: '1 Year Plan', price: '3999', days: 365, description: 'Most popular for small shops', badge: 'Most Popular', isActive: true, displayOrder: 2 },
    { id: 'plan_lifetime', name: 'Lifetime Plan', price: '9999', days: 99999, description: 'Ultimate professional pack', badge: 'Best Value', isActive: true, displayOrder: 3 },
  ]);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState({ name: '', price: '', days: '', description: '', badge: '', isActive: true, displayOrder: 0 });
  const [templateThumbnailsUpdatedAt, setTemplateThumbnailsUpdatedAt] = useState<Record<string, number>>({});

  // States for Image Cropping tool
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const msgEndRef = useRef<HTMLDivElement | null>(null);

  // 4 Licensing Officers States
  const [officers, setOfficers] = useState<any[]>([
    { id: 1, name: 'Kavin Kumar', title: 'Senior Licensing Officer', signature: '' },
    { id: 2, name: 'Abhishek Sharma', title: 'Executive Officer - Creva', signature: '' },
    { id: 3, name: 'Preethi Rajan', title: 'Licensing Director', signature: '' },
    { id: 4, name: 'Sanjay Sen', title: 'Registrar of Merchants', signature: '' }
  ]);

  // Agreement Template state
  const defaultTemplates: Record<string, string> = {
    en: `1. PROVISIONS OF SERVICE: The Creva E-Commerce SaaS platform grants the undersigned Merchant the license to operate an automated retail storefront website using our cloud architecture. Custom domain mappings are active permissions subject to the subscription plan level.

2. PLAN RENEWALS & INQUIRY SYSTEM: The Merchant understands that platform billing utilizes an inquiry activation system. Upon plan expiration, storefront access may be suspended unless renewed by contacting the support sales team directly.

3. ACCEPTABLE USAGE & LEGAL LIMITS: The Merchant agrees to list only legally compliant goods. Sales of prohibited, illegal, counterfeited, or unauthorized products will lead to instant termination of this license without refund.

4. SECURITY & DATA PRIVACY: The platform will protect merchant database assets, catalog listings, and custom styling. The platform is not responsible for off-site customer disputes.`,
    
    ta: `1. சேவைகளின் விதிகள்: கிரெவா ஈ-காமர்ஸ் சாஸ் தளம், கையொப்பமிட்ட வணிகருக்கு எங்கள் கிளவுட் கட்டமைப்பைப் பயன்படுத்தி ஒரு தானியங்கி சில்லறை விற்பனை இணையதளத்தை இயக்க உரிமம் வழங்குகிறது. தனிப்பயன் டொಮೇன் இணைப்புகள் சந்தா திட்ட நிலைக்கு உட்பட்டது.

2. புதுப்பித்தல் மற்றும் விசாரிக்கும் முறை: வணிகர் தளம் கட்டணம் செலுத்தும் விசாரணை முறையை பயன்படுத்துகிறது என்பதை புரிந்து கொள்கிறார். சந்தா காலம் முடிந்ததும், ஆதரவு விற்பனை குழுவை நேரடியாக தொடர்பு கொண்டு புதுப்பிக்காவிட்டால் அணுகல் நிறுத்தப்படலாம்.

3. ஏற்கத்தக்க பயன்பாடு மற்றும் சட்ட வரம்புகள்: வணிகர் சட்டப்பூர்வமான பொருட்களை மட்டுமே பட்டியலிட ஒப்புக்கொಳ್கிறார். தடைசெய்யப்பட்ட, சட்டவிரோதமான அல்லது அங்கீகரிக்கப்படாத தயாரிப்புகளை விற்பனை செய்வது பணத்தைத் திரும்பப்பெறாமல் உடனடியாக இந்த உரிமத்தை ரத்து செய்ய வழிவகுக்கும்.

4. பாதுகாப்பு மற்றும் தரவு தனியுரிமை: இந்த தளம் வணிகர் தரவுத்தள சொத்துக்கள், தயாரிப்பு பட்டியல்கள் மற்றும் தனிப்பயன் பாணிகளைப் பாதுகாக்கும். தளம் சாராத வாடிக்கையாளர் தகராறுகளுக்கு இந்த தளம் பொறுப்பல்ல.`,
    
    hi: `1. सेवा के प्रावधान: क्रेवा ई-कॉमर्स सास प्लेटफॉर्म हस्ताक्षरकर्ता मर्चेंट को हमारे क्लाउड आर्किटेक्चर का उपयोग करके एक स्वचालित खुदरा स्टोरफ्रंट वेबसाइट संचालित करने का लाइसेंस प्रदान करता है। कस्टम डोमेन मैपिंग सदस्यता योजना स्तर के अधीन है।

2. योजना नवीनीकरण और पूछताछ प्रणाली: मर्चेंट समझता है कि प्लेटफॉर्म बिलिंग एक पूछताछ सक्रियण प्रणाली का उपयोग करती है। योजना की समाप्ति पर, सहायता बिक्री टीम से सीधे संपर्क करके नवीनीकरण न किए जाने तक स्टोरफ्रंट एक्सेस को निलंबित किया जा सकता है।

3. स्वीकार्य उपयोग और कानूनी सीमाएं: मर्चेंट केवल कानूनी रूप से अनुपालन करने वाले सामानों को सूचीबद्ध करने के लिए सहमत है। प्रतिबंधित, अवैध या अनधिकृत उत्पादों की बिक्री से बिना किसी रिफंड के इस लाइसेंस को तत्काल समाप्त कर दिया जाएगा।

4. सुरक्षा और गोपनीयता: प्लेटफॉर्म मर्चेंट डेटाबेस संपत्ति, कैटलॉग लिस्टिंग और कस्टम स्टाइलिंग की रक्षा करेगा। प्लेटफॉर्म ऑफ-साइट ग्राहक विवादों के लिए जिम्मेदार नहीं है।`,
    
    te: `1. సేవా నిబంధనలు: క్రెవా ఇ-కామర్స్ సాస్ ప్లాట్‌ఫారమ్ సంతకం చేసిన వ్యాపారికి మా క్ಲౌడ్ ఆర్కిటెక్చర్‌ని ఉపయోగించి స్వయంచಾಲక రిటైಲ್ స్టోర్‌ಫ్రంట్ వెబ్‌సైట్‌ను నిర్వహించడానికి లైసెన్స్ మంజూరు చేస్తుంది. కస్టమ్ డొమైన్ మ్యాపింగ్స్ సభ్యత్వ ప్లాన్ స్థాయికి లోబడి ఉంటాయి.

2. ప్లాన్ పుನರುద్ధరణలు & విచారణ వ్యవస్థ: ప్లాట్‌ఫారమ్ బిల్లింగ్ ఒక విచారణ యాక్టివేషన్ సిస్టమ్‌ను ఉపയോಗಿಸ್ತುందని వ్యాపారి అర్థం చేసుకున్నారు. ప్లాన్ గಡುవు ముಗಿసిన తర్వాత, సేల్స్ టీమ్‌ని సంప్రదించి పుನರುద్ధరించకపోతే స్టోర్‌ಫ్రంట్ యాక్సెస్ నిలిపివేయబడవచ్చు.

3. అనుమతించదగిన వినియోగం & చట్టపరమైన పరిమితులు: వ్యాపారి చಟ್ಟబದ್ಧమైన వస్తువులను మాత్రమే విక్రయించడానికి అಂಗీకరిస్తారు. నిషేధಿಸಬడిన, చట్టవిరుద్ధమైన లేదా అనధికారిక ఉత్పత్తుల విక్రయాలు ఎటువంటి రీಫండ్ లేకుండా ఈ లైసెన్స్‌ను వెంటనే రద్దు చేయడానికి దಾರితీస్తాయి.

4. భద్రత & డేటా గోप్యత: ప్లాట్‌ఫారమ్ వ్యాపారి డేటాబేస్ ఆస్తులు, కేటలాగ్ జాబಿತాలు మరియు కಸ್ಟಮ್ స్టೈಲಿంగ్‌ను రಕ್ಷಿಸುತ್ತದೆ. ఆఫ్-సైట్ కస్టమర్ వివాదాలకు ప్లాట్‌ఫారమ్ బాಧ್ಯత వಹಿಸದು.`,
    
    ml: `1. സേവന വ്യവസ്ഥകൾ: ക്രെവ ഇ-കൊമേഴ്‌സ് സാസ് പ്ലാറ്റ്‌ഫോം ഒപ്പിട്ട വ്യാപാരിക്ക് ഞങ്ങളുടെ ക്ലൗഡ് ആർക്കിടെക്ചർ ഉപയോഗിച്ച് ഒരു ഓട്ടോമേറ്റഡ് റീട്ടെയിൽ സ്റ്റോർഫ്രണ്ട് വെബ്‌സൈറ്റ് പ്രവർത്തിപ്പിക്കാൻ ലൈസൻസ് നൽകുന്നു. കസ്റ്റം ഡൊമെയ്ൻ മാപ്പിംഗുകൾ സബ്‌സ്‌ക്രിപ്‌ഷൻ പ്ലാൻ ലെവലിന് വിധേയമാണ്.

2. പ്ലാൻ പുതുക്കലും അന്വേഷണ സംവിധാനവും: പ്ലാറ്റ്‌ഫോം ബില്ലിംഗ് ഒരു അന്വേഷണ സജീവമാക്കൽ സംവിധാനമാണ് ഉപയോഗിക്കുന്നതെന്ന് വ്യാപാരി മനസ്സിലാക്കുന്നു. പ്ലാൻ കാലഹരണപ്പെടുമ്പോൾ, സപ്പോർട്ട് ടീമുമായി നേരിട്ട് ബന്ധപ്പെട്ട് പുതുക്കിയില്ലെങ്കിൽ ആക്സസ് താൽക്കാലികമായി നിർത്താം.

3. സ്വീകാര്യമായ ഉപയോഗവും നിയമപരമായ പരിധികളും: നിയമപരമായി അനുസരിക്കുന്ന സാധനങ്ങൾ മാത്രം ലിസ്റ്റ് ചെയ്യാൻ വ്യാപാരി സമ്മതിക്കുന്നു. നിരോധിതമോ നിയമവിരുദ്ധമോ അനധികൃതമോ ആയ ഉൽപ്പന്നങ്ങളുടെ വിൽപ്പന റീഫണ്ട് ഇല്ലാതെ ഈ ലൈസൻസ് ഉടനടി റദ്ദാക്കാൻ ഇടയാക്കും.

4. സുരക്ഷയും ഡാറ്റാ സ്വകാര്യതയും: പ്ലാറ്റ്‌ഫോം വ്യാപാരിയുടെ ഡാറ്റാബേസ് അസറ്റുകൾ, ഉൽപ്പന്ന ലിസ്റ്റിംഗുകൾ, കസ്റ്റം സ്റ്റൈലിംഗ് എന്നിവ സംരക്ഷിക്കും. ഓഫ്-സൈറ്റ് ഉപഭೋക്തൃ തർക്കങ്ങൾക്ക് പ്ലാറ്റ്‌ഫോം ഉത്തരവാദിയല്ല.`,
    
    kn: `1. ಸೇವಾ ನಿಬಂಧನೆಗಳು: ಕ್ರೆವಾ ಇ-ಕಾಮರ್ಸ್ ಸಾಸ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಸಹಿ ಮಾಡಿದ ವ್ಯಾಪಾರಿಗೆ ನಮ್ಮ ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಕ್ಲೌಡ್ ಆರ್ಕಿಟೆಕ್ಚರ್ ಬಳಸಿ ಸ್ವಯಂಚಾಲಿತ ಚಿಲ್ಲರೆ ಸ್ಟೋರ್‌ಫ್ರಂಟ್ ವೆಬ್‌ಸೈಟ್ ನಿರ್ವಹಿಸಲು ಪರವಾನಗಿ ನೀಡುತ್ತದೆ. ಕಸ್ಟಮ್ ಡೊಮೇನ್ ಮ್ಯಾಪಿಂಗ್‌ಗಳು ಚಂದಾದಾರಿಕೆ ಯೋಜನೆ ಮಟ್ಟಕ್ಕೆ ಒಳಪಟ್ಟಿರುತ್ತವೆ.

2. ಯೋಜನೆ ನವೀಕರಣಗಳು ಮತ್ತು ವಿಚಾರಣಾ ವ್ಯವಸ್ಥೆ: ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಬಿಲ್ಲಿಂಗ್ ವಿಚಾರಣಾ ಸಕ್ರಿಯಗೊಳಿಸುವ ವ್ಯವಸ್ಥೆಯನ್ನು ಬಳಸುತ್ತದೆ ಎಂದು ವ್ಯಾಪಾರಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳುತ್ತಾರೆ. ಯೋಜನೆ ಅವಧಿ ಮುಗಿದ ನಂತರ, ಸಪೋರ್ಟ್ ಸೇಲ್ಸ್ ತಂಡವನ್ನು ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ ನವೀಕರಿಸದಿದ್ದರೆ ಪ್ರವೇಶವನ್ನು ಅಮಾನತುಗೊಳಿಸಬಹುದು.

3. ಸ್ವೀಕಾರಾರ್ಹ ಬಳಕೆ ಮತ್ತು ಕಾನೂನು ಮಿತಿಗಳು: ವ್ಯಾಪಾರಿ ಕಾನೂನುಬದ್ಧ ಸರಕುಗಳನ್ನು ಮಾತ್ರ ಪಟ್ಟಿ ಮಾಡಲು ಒಪ್ಪಿಕೊಳ್ಳುತ್ತಾರೆ. ನಿಷೇಧಿತ, ಅಕ್ರಮ ಅಥವಾ ಅನಧಿಕೃತ ಉತ್ಪನ್ನಗಳ ಮಾರಾಟವು ಯಾವುದೇ ಮರುಪಾವತಿ ಇಲ್ಲದೆ ಈ ಪರವಾನಗಿಯನ್ನು ತಕ್ಷಣವೇ ರದ್ದುಗೊಳಿಸಲು ಕಾರಣವಾಗುತ್ತದೆ.

4. ಸುರಕ್ಷತೆ ಮತ್ತು ಡೇಟಾ ಗೌಪ್ಯತೆ: ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ವ್ಯಾಪಾರಿಯ ಡೇಟಾಬೇಸ್ ಆಸ್ತಿಗಳು, ಕ್ಯಾಟಲಾಗ್ ಪಟ್ಟಿಗಳು ಮತ್ತು ಕಸ್ಟಮ್ ಶೈಲಿಯನ್ನು ರಕ್ಷಿಸುತ್ತದೆ. ಆಫ್-ಸೈಟ್ ಗ್ರಾಹಕ ವಿವಾದಗಳಿಗೆ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಜವಾಬ್ದಾರನಾಗಿರುವುದಿಲ್ಲ.`
  };

  const [agreementTemplates, setAgreementTemplates] = useState<Record<string, string>>(defaultTemplates);
  const [agreementTemplate, setAgreementTemplate] = useState<string>(defaultTemplates.en);
  const [selectedLanguageTab, setSelectedLanguageTab] = useState<string>('en');

  useEffect(() => {
    const savedBrand = localStorage.getItem('saas_brand_name');
    const savedLogo = localStorage.getItem('saas_brand_logo');
    const savedOfficers = localStorage.getItem('saas_licensing_officers');
    const savedTemplate = localStorage.getItem('saas_agreement_template');
    const savedTemplates = localStorage.getItem('saas_agreement_templates');
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
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        setAgreementTemplates(parsed);
      } catch (e) {}
    }
    if (savedTemplate) {
      setAgreementTemplate(savedTemplate);
    }
    const savedVideoUrl = localStorage.getItem('saas_onboard_video_url');
    if (savedVideoUrl) {
      setOnboardVideoUrl(savedVideoUrl);
    }
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

    const savedWaGlobal = localStorage.getItem('saas_wa_enabled_global');
    const savedWaPlans = localStorage.getItem('saas_wa_plans_enabled');
    const savedWaOrderUpdates = localStorage.getItem('saas_wa_plans_order_updates_enabled');
    const savedWaWelcome = localStorage.getItem('saas_wa_default_welcome');
    if (savedWaGlobal) setWhatsappEnabledGlobal(savedWaGlobal === 'true');
    if (savedWaPlans) {
      try { setWhatsappPlansEnabled(JSON.parse(savedWaPlans)); } catch(e) {}
    }
    if (savedWaOrderUpdates) {
      try { setWhatsappPlansOrderUpdatesEnabled(JSON.parse(savedWaOrderUpdates)); } catch(e) {}
    }
    if (savedWaWelcome) setWhatsappDefaultWelcome(savedWaWelcome);

    const savedGlobalPaymentGateways = localStorage.getItem('saas_global_payment_gateways');
    const savedGlobalIntegrations = localStorage.getItem('saas_global_integrations');
    if (savedGlobalPaymentGateways) {
      try { setGlobalPaymentGateways(JSON.parse(savedGlobalPaymentGateways)); } catch(e) {}
    }
    if (savedGlobalIntegrations) {
      try { setGlobalIntegrations(JSON.parse(savedGlobalIntegrations)); } catch(e) {}
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
        agreementTemplates,
        onboardVideoUrl,
        platformUpi,
        plan30Price,
        plan365Price,
        planLifetimePrice,
        customDomainUnlockPrice,
        templateThumbnails,
        customPackages: updatedPackages,
        disabledDefaultPackages: updatedDisabledDefaults,
        whatsappEnabledGlobal,
        whatsappPlansEnabled,
        whatsappPlansOrderUpdatesEnabled,
        whatsappDefaultWelcome
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

  // ── Subscription Plans CRUD ───────────────────────────────────────────────
  const handleAddPlan = () => {
    if (!newPlan.name.trim() || !newPlan.price.trim() || !newPlan.days.trim()) return;
    const plan = {
      id: 'plan_' + Math.random().toString(36).substring(2, 9),
      name: newPlan.name.trim(),
      price: newPlan.price.trim(),
      days: parseInt(newPlan.days) || 30,
      description: newPlan.description.trim(),
      badge: newPlan.badge.trim(),
      isActive: newPlan.isActive,
      displayOrder: newPlan.displayOrder || subscriptionPlans.length + 1,
    };
    setSubscriptionPlans(prev => [...prev, plan].sort((a, b) => a.displayOrder - b.displayOrder));
    setNewPlan({ name: '', price: '', days: '', description: '', badge: '', isActive: true, displayOrder: 0 });
    setActionStatus('Plan added. Click Save Settings to persist.');
    setTimeout(() => setActionStatus(null), 3000);
  };

  const handleUpdatePlan = (id: string, field: string, value: any) => {
    setSubscriptionPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleDeletePlan = (id: string) => {
    setSubscriptionPlans(prev => prev.filter(p => p.id !== id));
    if (editingPlanId === id) setEditingPlanId(null);
    setActionStatus('Plan removed. Click Save Settings to persist.');
    setTimeout(() => setActionStatus(null), 3000);
  };

  const handleSaveBrandSettings = async () => {
    setActionStatus('Saving settings to cloud...');
    try {
      localStorage.setItem('saas_brand_name', brandName);
      localStorage.setItem('saas_brand_logo', brandLogo);
      localStorage.setItem('saas_licensing_officers', JSON.stringify(officers));
      localStorage.setItem('saas_agreement_template', agreementTemplate);
      localStorage.setItem('saas_agreement_templates', JSON.stringify(agreementTemplates));
      localStorage.setItem('saas_onboard_video_url', onboardVideoUrl);
      localStorage.setItem('saas_platform_upi', platformUpi);
      localStorage.setItem('saas_plan_30_price', plan30Price);
      localStorage.setItem('saas_plan_365_price', plan365Price);
      localStorage.setItem('saas_plan_lifetime_price', planLifetimePrice);
      localStorage.setItem('saas_custom_domain_unlock_price', customDomainUnlockPrice);
      localStorage.setItem('saas_template_thumbnails', JSON.stringify(templateThumbnails));
      localStorage.setItem('saas_custom_packages', JSON.stringify(customPackages));
      localStorage.setItem('saas_disabled_default_packages', JSON.stringify(disabledDefaultPackages));
      localStorage.setItem('saas_subscription_plans', JSON.stringify(subscriptionPlans));
      localStorage.setItem('saas_wa_enabled_global', String(whatsappEnabledGlobal));
      localStorage.setItem('saas_wa_plans_enabled', JSON.stringify(whatsappPlansEnabled));
      localStorage.setItem('saas_wa_plans_order_updates_enabled', JSON.stringify(whatsappPlansOrderUpdatesEnabled));
      localStorage.setItem('saas_wa_default_welcome', whatsappDefaultWelcome);
      localStorage.setItem('saas_global_payment_gateways', JSON.stringify(globalPaymentGateways));
      localStorage.setItem('saas_global_integrations', JSON.stringify(globalIntegrations));

      // Derive backwards-compat legacy plan fields from subscriptionPlans
      const legacyPlan30 = subscriptionPlans.find(p => p.days === 30);
      const legacyPlan365 = subscriptionPlans.find(p => p.days === 365);
      const legacyLifetime = subscriptionPlans.find(p => p.days >= 99999);
      const legacyCustom = subscriptionPlans.filter(p => p.days !== 30 && p.days !== 365 && p.days < 99999);

      const settingsData = {
        brandName,
        brandLogo,
        officers,
        agreementTemplate,
        agreementTemplates,
        onboardVideoUrl,
        platformUpi,
        // New unified format
        subscriptionPlans,
        templateThumbnailsUpdatedAt,
        // Legacy fields kept for backwards compat
        plan30Price: legacyPlan30?.price || plan30Price,
        plan365Price: legacyPlan365?.price || plan365Price,
        planLifetimePrice: legacyLifetime?.price || planLifetimePrice,
        customDomainUnlockPrice,
        templateThumbnails,
        customPackages: legacyCustom.map(p => ({ id: p.id, name: p.name, days: p.days, price: p.price, duration: p.days, durationType: 'day' })),
        disabledDefaultPackages: [
          ...(legacyPlan30 && !legacyPlan30.isActive ? ['30'] : []),
          ...(legacyPlan365 && !legacyPlan365.isActive ? ['365'] : []),
          ...(legacyLifetime && !legacyLifetime.isActive ? ['lifetime'] : []),
        ],
        whatsappEnabledGlobal,
        whatsappPlansEnabled,
        whatsappPlansOrderUpdatesEnabled,
        whatsappDefaultWelcome,
        globalPaymentGateways,
        globalIntegrations
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
    const activeTerms = contractData.signedAgreementTerms || 
                        localStorage.getItem('saas_agreement_template') || 
                        defaultTemplates.en;
    const langSuffix = contractData.selectedLanguage ? ` (${contractData.selectedLanguage.toUpperCase()})` : '';
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
            <div class="section-title">Terms &amp; Conditions of Service${langSuffix}</div>
            <div class="terms">
              ${activeTerms
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
          if (parsed.agreementTemplates) {
            setAgreementTemplates(parsed.agreementTemplates);
            localStorage.setItem('saas_agreement_templates', JSON.stringify(parsed.agreementTemplates));
          } else if (parsed.agreementTemplate) {
            const migrated = { ...defaultTemplates, en: parsed.agreementTemplate };
            setAgreementTemplates(migrated);
            localStorage.setItem('saas_agreement_templates', JSON.stringify(migrated));
          }
          if (parsed.agreementTemplate) {
            setAgreementTemplate(parsed.agreementTemplate);
            localStorage.setItem('saas_agreement_template', parsed.agreementTemplate);
          }
          if (parsed.onboardVideoUrl) {
            setOnboardVideoUrl(parsed.onboardVideoUrl);
            localStorage.setItem('saas_onboard_video_url', parsed.onboardVideoUrl);
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
          if (Array.isArray(parsed.subscriptionPlans) && parsed.subscriptionPlans.length > 0) {
            setSubscriptionPlans(parsed.subscriptionPlans);
          } else {
            // Migrate old plan fields → new unified format
            const disabled: string[] = parsed.disabledDefaultPackages || [];
            const migrated: any[] = [];
            if (parsed.plan30Price) migrated.push({ id: 'plan_30', name: '1 Month Plan', price: parsed.plan30Price, days: 30, description: 'Best for trial storefronts', badge: '', isActive: !disabled.includes('30'), displayOrder: 1 });
            if (parsed.plan365Price) migrated.push({ id: 'plan_365', name: '1 Year Plan', price: parsed.plan365Price, days: 365, description: 'Most popular for small shops', badge: 'Most Popular', isActive: !disabled.includes('365'), displayOrder: 2 });
            if (parsed.planLifetimePrice) migrated.push({ id: 'plan_lifetime', name: 'Lifetime Plan', price: parsed.planLifetimePrice, days: 99999, description: 'Ultimate professional pack', badge: 'Best Value', isActive: !disabled.includes('lifetime'), displayOrder: 3 });
            if (Array.isArray(parsed.customPackages)) {
              parsed.customPackages.forEach((pkg: any, i: number) => {
                migrated.push({ id: pkg.id, name: pkg.name, price: pkg.price, days: pkg.days, description: `${pkg.days} Days Access`, badge: '', isActive: true, displayOrder: 10 + i });
              });
            }
            if (migrated.length > 0) setSubscriptionPlans(migrated);
          }
          if (parsed.templateThumbnailsUpdatedAt) {
            setTemplateThumbnailsUpdatedAt(parsed.templateThumbnailsUpdatedAt);
          }
          if (parsed.whatsappEnabledGlobal !== undefined) {
            setWhatsappEnabledGlobal(parsed.whatsappEnabledGlobal);
            localStorage.setItem('saas_wa_enabled_global', String(parsed.whatsappEnabledGlobal));
          }
          if (parsed.whatsappPlansEnabled) {
            setWhatsappPlansEnabled(parsed.whatsappPlansEnabled);
            localStorage.setItem('saas_wa_plans_enabled', JSON.stringify(parsed.whatsappPlansEnabled));
          }
          if (parsed.whatsappPlansOrderUpdatesEnabled) {
            setWhatsappPlansOrderUpdatesEnabled(parsed.whatsappPlansOrderUpdatesEnabled);
            localStorage.setItem('saas_wa_plans_order_updates_enabled', JSON.stringify(parsed.whatsappPlansOrderUpdatesEnabled));
          }
          if (parsed.whatsappDefaultWelcome) {
            setWhatsappDefaultWelcome(parsed.whatsappDefaultWelcome);
            localStorage.setItem('saas_wa_default_welcome', parsed.whatsappDefaultWelcome);
          }
          if (parsed.globalPaymentGateways) {
            setGlobalPaymentGateways(parsed.globalPaymentGateways);
            localStorage.setItem('saas_global_payment_gateways', JSON.stringify(parsed.globalPaymentGateways));
          }
          if (parsed.globalIntegrations) {
            setGlobalIntegrations(parsed.globalIntegrations);
            localStorage.setItem('saas_global_integrations', JSON.stringify(parsed.globalIntegrations));
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

  const handleOpenPasswordReset = (store: any) => {
    setResetStore(store);
    setResetPasswordVal('');
    setResetError(null);
    setResetSuccess(null);
    setResetModalOpen(true);
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetStore) return;
    if (!resetPasswordVal || resetPasswordVal.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('creva_token') || localStorage.getItem('mock_supabase_token')) : null;
      const response = await fetch(`/api/backend/auth/superadmin-reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          userId: resetStore.owner_id,
          password: resetPasswordVal
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to reset password');
      }

      setResetSuccess(`Password reset successfully for ${resetStore.store_name}!`);
      setTimeout(() => {
        setResetModalOpen(false);
      }, 2000);
    } catch (err: any) {
      setResetError(err.message || 'An unexpected error occurred.');
    } finally {
      setResetLoading(false);
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
      // Send approval email to store owner (fire-and-forget)
      if (selectedStore.contact_email) {
        fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'approval',
            to: selectedStore.contact_email,
            ownerName: contract.ownerName || selectedStore.store_name,
            storeName: selectedStore.store_name,
            subdomain: selectedStore.subdomain,
            plan: contract.selectedPlan || '',
          }),
        }).catch(() => {});
      }
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
      // Send rejection email to store owner (fire-and-forget)
      if (selectedStore.contact_email) {
        fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'rejection',
            to: selectedStore.contact_email,
            ownerName: contract.ownerName || selectedStore.store_name,
            storeName: selectedStore.store_name,
          }),
        }).catch(() => {});
      }
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

  // ─── Support Ticket Helpers ───────────────────────────────────────────────
  const supportApiFetch = async (path: string, options: RequestInit = {}) => {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('creva_token') || localStorage.getItem('mock_supabase_token'))
      : null;
    const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api/backend${path}`, { ...options, headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const loadSupportTickets = async () => {
    setSupportTicketsLoading(true);
    try {
      const data = await supportApiFetch('/support-tickets');
      setSupportTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load support tickets:', e);
    } finally {
      setSupportTicketsLoading(false);
    }
  };

  const selectTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    setTicketMessages([]);
    setTicketReply('');
    try {
      const data = await supportApiFetch(`/support-tickets/${ticket.id}`);
      setTicketMessages(data.messages || []);
    } catch (e) {
      console.error('Failed to load ticket messages:', e);
    }
  };

  const sendSupportReply = async () => {
    if (!ticketReply.trim() || !selectedTicket || ticketReplyLoading) return;
    setTicketReplyLoading(true);
    try {
      const msg = await supportApiFetch(`/support-tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          sender_id: user?.id || 'superadmin',
          sender_role: 'superadmin',
          sender_name: 'Support Team',
          message: ticketReply.trim(),
          attachments: [],
        }),
      });
      setTicketMessages(prev => [...prev, msg]);
      setTicketReply('');
      if (selectedTicket.status === 'open') {
        await updateSupportTicketStatus(selectedTicket.id, 'in_progress');
      }
    } catch (e) {
      console.error('Failed to send reply:', e);
    } finally {
      setTicketReplyLoading(false);
    }
  };

  const updateSupportTicketStatus = async (ticketId: string, status: string) => {
    try {
      await supportApiFetch(`/support-tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
      if (selectedTicket?.id === ticketId) setSelectedTicket((prev: any) => ({ ...prev, status }));
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const updateSupportTicketPriority = async (ticketId: string, priority: string) => {
    try {
      await supportApiFetch(`/support-tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ priority }),
      });
      setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, priority } : t));
      if (selectedTicket?.id === ticketId) setSelectedTicket((prev: any) => ({ ...prev, priority }));
    } catch (e) {
      console.error('Failed to update priority:', e);
    }
  };

  // Load support tickets when switching to that view + refresh every 30s
  useEffect(() => {
    if (mainView !== 'support') return;
    loadSupportTickets();
    const interval = setInterval(loadSupportTickets, 30000);
    return () => clearInterval(interval);
  }, [mainView]);

  // Auto-refresh messages every 10 seconds while a ticket is open
  useEffect(() => {
    if (!selectedTicket) return;
    const interval = setInterval(async () => {
      try {
        const data = await supportApiFetch(`/support-tickets/${selectedTicket.id}`);
        setTicketMessages(data.messages || []);
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedTicket?.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticketMessages]);

  // ─── Superadmin Notification Helpers ─────────────────────────────────────
  const loadSuperAdminNotifications = async () => {
    try {
      const data = await supportApiFetch('/notifications?for_role=superadmin');
      const arr = Array.isArray(data) ? data : [];
      const fmt = (ts: string) => {
        if (!ts) return '';
        const diff = Date.now() - new Date(ts).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return 'Just now';
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
      };
      setNotifications(arr.map((n: any) => ({
        id: n.id,
        title: n.title,
        description: n.body || '',
        time: fmt(n.created_at),
        read: !!n.is_read,
        ticket_id: n.ticket_id,
      })));
    } catch (e) {
      console.error('Failed to load superadmin notifications:', e);
    }
  };

  const markSuperAdminNotifRead = async (id: string | number) => {
    try {
      await supportApiFetch(`/notifications/${id}`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error('Failed to mark notification read:', e);
    }
  };

  const markAllSuperAdminNotifsRead = async () => {
    try {
      await supportApiFetch('/notifications/all', {
        method: 'DELETE',
        body: JSON.stringify({ for_role: 'superadmin' }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      // Fallback: just update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  // Load superadmin notifications on mount and refresh every 30s
  useEffect(() => {
    loadSuperAdminNotifications();
    const interval = setInterval(loadSuperAdminNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      {/* Redesigned Top SaaS Header Navigation */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-gray-800 bg-gray-950 flex-shrink-0 select-none z-40">
        {/* Left section: Controls & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="hidden sm:block text-base sm:text-lg font-bold capitalize truncate">
            Super Admin
          </h1>
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700 shrink-0">
            <button
              onClick={() => setMainView('stores')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${mainView === 'stores' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Stores
            </button>
            <button
              onClick={() => setMainView('support')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${mainView === 'support' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Support
              {supportTickets.filter(t => t.status === 'open').length > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none">
                  {supportTickets.filter(t => t.status === 'open').length}
                </span>
              )}
            </button>
            {user?.role === 'superadmin' && (
              <button
                onClick={() => setMainView('iam')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${mainView === 'iam' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                <User className="w-3.5 h-3.5" />
                Staff & IAM
              </button>
            )}
          </div>
        </div>

        {/* Right section: Profile, Visit Store, Notifications, Fullscreen */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Full Screen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors shrink-0 header-dropdown-trigger"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4.5 h-4.5" />
            ) : (
              <Maximize2 className="w-4.5 h-4.5" />
            )}
          </button>

          {/* Notifications Bell with Popover Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifications(prev => !prev);
                setShowProfileDropdown(false);
              }}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors relative header-dropdown-trigger"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white text-gray-900 shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200 text-left header-dropdown-container"
              >
                <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#3C77C3]">Notifications</span>
                  <button
                    onClick={markAllSuperAdminNotifsRead}
                    className="text-[10px] text-gray-400 hover:text-[#3C77C3] transition-colors uppercase font-black tracking-widest"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-gray-400">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => { if (!n.read) markSuperAdminNotifRead(n.id); if (n.ticket_id) { setMainView('support'); setShowNotifications(false); } }}
                        className={`px-4 py-3 hover:bg-blue-50/50 transition-colors text-left cursor-pointer ${n.read ? 'opacity-60' : ''}`}
                      >
                        <p className="text-xs font-bold text-gray-800 leading-snug">{n.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.description}</p>
                        <span className="text-[9px] text-gray-400 mt-1.5 block font-mono">{n.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Visit Store globe button */}
          <a 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs flex items-center gap-1.5 text-[#3C77C3] border border-[#3C77C3]/20 bg-[#3C77C3]/5 hover:bg-[#3C77C3]/10 px-3 py-1.5 rounded-lg transition-colors shrink-0 font-bold uppercase tracking-wider"
            title="Visit Platform Portal"
          >
            <Globe className="w-4 h-4 text-[#3C77C3]" />
            <span>Visit Store</span>
          </a>

          {/* Vertical Separator */}
          <span className="h-6 w-px bg-gray-200 shrink-0" />

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileDropdown(prev => !prev);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 text-left header-dropdown-trigger"
            >
              <div className="w-8 h-8 rounded-full bg-[#3C77C3]/10 text-[#3C77C3] flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                SA
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-gray-800 truncate max-w-[120px]">
                  Super Admin
                </span>
                <span className="text-[10px] text-gray-500 truncate max-w-[120px]">
                  {user?.email || 'admin@crevasolution.in'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            </button>

            {showProfileDropdown && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white text-gray-900 shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200 text-left header-dropdown-container"
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-black text-gray-900 truncate">Platform Administrator</p>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                </div>

                <div className="p-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Logout Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main scrollable content view */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
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

      {mainView === 'stores' && (<>
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
            {user?.role !== 'staff' && (
              <button 
                onClick={() => setIsBrandingOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md flex-shrink-0"
              >
                <Zap className="w-4 h-4" />
                Billing Settings
              </button>
            )}
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
                              onClick={() => handleOpenPasswordReset(store)}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all shadow-sm w-full max-w-[120px] justify-center"
                            >
                              <Key className="w-3.5 h-3.5" />
                              RESET PASS
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
      </>)}

      {mainView === 'support' && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Support Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Support Tickets
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Manage merchant support requests, reply to tickets, and update resolutions.
              </p>
            </div>
            <button
              onClick={loadSupportTickets}
              className="flex items-center gap-2 self-start bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-700 text-sm font-medium transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${supportTicketsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Tickets', count: supportTickets.length, color: 'text-white' },
              { label: 'Open', count: supportTickets.filter((t: any) => t.status === 'open').length, color: 'text-blue-400' },
              { label: 'In Progress', count: supportTickets.filter((t: any) => t.status === 'in_progress').length, color: 'text-amber-400' },
              { label: 'Resolved', count: supportTickets.filter((t: any) => t.status === 'resolved').length, color: 'text-green-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-800 border border-gray-700/60 rounded-xl p-4 shadow-sm">
                <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{stat.label}</div>
                <div className={`text-2xl font-extrabold ${stat.color} mt-1`}>{stat.count}</div>
              </div>
            ))}
          </div>

          {/* Search & Status Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-800 p-4 rounded-xl border border-gray-700/60">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ticket #, subject, or store..."
                value={supportSearch}
                onChange={(e) => setSupportSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700/80 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
              {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
                <button
                  key={s}
                  onClick={() => setSupportStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0 ${
                    supportStatusFilter === s
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                      : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Two-Panel Layout */}
          <div className="flex gap-4" style={{ minHeight: 600 }}>
            {/* Ticket List */}
            <div className="w-full md:w-80 lg:w-96 bg-gray-800 border border-gray-700/60 rounded-xl overflow-hidden flex flex-col shrink-0">
              <div className="px-4 py-3 border-b border-gray-700/60 bg-gray-900/40">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tickets</span>
              </div>
              {supportTicketsLoading ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (() => {
                const filtered = supportTickets.filter((t: any) => {
                  const q = supportSearch.toLowerCase();
                  const matchSearch = !q ||
                    t.subject?.toLowerCase().includes(q) ||
                    t.ticket_number?.toLowerCase().includes(q) ||
                    t.store_name?.toLowerCase().includes(q);
                  const matchStatus = supportStatusFilter === 'all' || t.status === supportStatusFilter;
                  return matchSearch && matchStatus;
                });
                if (filtered.length === 0) return (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-2 p-6">
                    <MessageSquare className="w-10 h-10 text-gray-600" />
                    <span className="text-sm text-center">No tickets found</span>
                  </div>
                );
                const priorityDot: Record<string, string> = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-blue-400', low: 'bg-gray-500' };
                const statusColor: Record<string, string> = { open: 'text-blue-400', in_progress: 'text-amber-400', waiting_for_customer: 'text-purple-400', resolved: 'text-green-400', closed: 'text-gray-400' };
                const statusLabel: Record<string, string> = { open: 'Open', in_progress: 'In Progress', waiting_for_customer: 'Waiting', resolved: 'Resolved', closed: 'Closed' };
                return (
                  <div className="flex-1 overflow-y-auto divide-y divide-gray-700/40">
                    {filtered.map((ticket: any) => (
                      <button
                        key={ticket.id}
                        onClick={() => selectTicket(ticket)}
                        className={`w-full text-left px-4 py-3.5 transition-colors border-l-2 ${selectedTicket?.id === ticket.id ? 'bg-blue-900/30 border-blue-500' : 'hover:bg-gray-700/30 border-transparent'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[ticket.priority] || 'bg-gray-500'}`} />
                              <span className="text-[10px] font-mono text-gray-500">{ticket.ticket_number}</span>
                            </div>
                            <p className="text-sm font-semibold text-white truncate leading-snug">{ticket.subject}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{ticket.store_name || ticket.owner_email}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className={`text-[10px] font-bold uppercase ${statusColor[ticket.status] || 'text-gray-400'}`}>
                              {statusLabel[ticket.status] || ticket.status}
                            </span>
                            <p className="text-[10px] text-gray-600 mt-1">{new Date(ticket.created_at).toLocaleDateString('en-IN')}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Ticket Detail / Chat Panel */}
            <div className="flex-1 bg-gray-800 border border-gray-700/60 rounded-xl overflow-hidden flex flex-col min-w-0">
              {!selectedTicket ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3 p-8">
                  <div className="w-16 h-16 bg-gray-700/40 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-sm">Select a ticket to view the conversation</p>
                </div>
              ) : (
                <>
                  {/* Ticket Header */}
                  <div className="p-4 border-b border-gray-700/60 bg-gray-900/30 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-mono text-gray-400">{selectedTicket.ticket_number}</span>
                          <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full capitalize">{selectedTicket.category}</span>
                        </div>
                        <h2 className="text-base font-bold text-white leading-snug">{selectedTicket.subject}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {selectedTicket.store_name && <span className="font-semibold text-gray-300">{selectedTicket.store_name}</span>}
                          {selectedTicket.owner_email && <span> · {selectedTicket.owner_email}</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => { setSelectedTicket(null); setTicketMessages([]); setTicketReply(''); }}
                        className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Status / Priority controls */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Status</span>
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => updateSupportTicketStatus(selectedTicket.id, e.target.value)}
                          className="bg-gray-950 border border-gray-700 text-xs text-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 transition-colors"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="waiting_for_customer">Waiting for Customer</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Priority</span>
                        <select
                          value={selectedTicket.priority}
                          onChange={(e) => updateSupportTicketPriority(selectedTicket.id, e.target.value)}
                          className="bg-gray-950 border border-gray-700 text-xs text-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 transition-colors"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      {selectedTicket.owner_email && (
                        <a
                          href={`mailto:${selectedTicket.owner_email}?subject=Re: [${selectedTicket.ticket_number}] ${selectedTicket.subject}`}
                          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Email Customer
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Messages Thread */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {ticketMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 py-8">
                        <MessageSquare className="w-8 h-8 text-gray-600" />
                        <span className="text-sm">No messages yet. Be the first to reply.</span>
                      </div>
                    ) : (
                      ticketMessages.map((msg: any) => {
                        const isAdmin = msg.sender_role === 'superadmin';
                        let attachments: any[] = [];
                        try { attachments = JSON.parse(msg.attachments || '[]'); } catch {}
                        return (
                          <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${isAdmin ? 'bg-blue-700 text-white rounded-br-sm' : 'bg-gray-700/70 border border-gray-600/60 text-gray-100 rounded-bl-sm'}`}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={`text-[10px] font-bold ${isAdmin ? 'text-blue-200' : 'text-gray-400'}`}>
                                  {msg.sender_name || (isAdmin ? 'Support Team' : 'Customer')}
                                </span>
                                <span className={`text-[9px] ${isAdmin ? 'text-blue-300' : 'text-gray-500'}`}>
                                  {new Date(msg.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              </div>
                              {msg.message && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
                              {attachments.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                  {attachments.map((att: any, i: number) => (
                                    <div key={i}>
                                      {att.type?.startsWith('image/') ? (
                                        <img src={att.url || att.data} alt={att.name || 'Image'} className="max-w-full rounded-lg max-h-48 object-cover mt-1 border border-white/10" />
                                      ) : att.type?.startsWith('audio/') ? (
                                        <audio controls src={att.url || att.data} className="mt-1 w-full" style={{ maxWidth: 280 }} />
                                      ) : att.type?.startsWith('video/') ? (
                                        <video controls src={att.url || att.data} className="mt-1 rounded-lg max-h-48 w-full" />
                                      ) : (
                                        <a href={att.url || att.data} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs underline opacity-80 hover:opacity-100 mt-1">
                                          <FileText className="w-3.5 h-3.5 shrink-0" />
                                          {att.name || 'Download File'}
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={msgEndRef} />
                  </div>

                  {/* Reply Box */}
                  <div className="p-4 border-t border-gray-700/60 bg-gray-900/20">
                    <div className="flex gap-3 items-end">
                      <textarea
                        value={ticketReply}
                        onChange={(e) => setTicketReply(e.target.value)}
                        placeholder="Type your reply... (Ctrl+Enter to send)"
                        rows={3}
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none transition-colors"
                        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendSupportReply(); }}
                      />
                      <button
                        onClick={sendSupportReply}
                        disabled={!ticketReply.trim() || ticketReplyLoading}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shrink-0"
                      >
                        {ticketReplyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Send
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1.5">Replying as Support Team · Status auto-updates to "In Progress" on first reply</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {mainView === 'iam' && user?.role === 'superadmin' && (
        <SuperAdminIamView currentUser={user} />
      )}

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
                                  className="max-h-[50px] object-contain"
                                />
                              </div>
                            ) : (
                              <span className="text-xs text-red-400 block font-bold">Signature image data is missing!</span>
                            )}
                          </div>

                          {/* Assigned Officer Signature Display */}
                          <div className="bg-gray-950 p-4 rounded-xl border border-gray-850 space-y-3">
                            <span className="text-[9px] text-gray-500 uppercase block font-semibold font-sans">Assigned Licensing Officer</span>
                            <div className="flex items-center gap-3">
                              <div className="bg-white border border-gray-800 rounded-lg p-2 inline-block">
                                <img 
                                  src={getOfficerSignatureUrl(contract.assignedOfficer)} 
                                  alt="Officer signature stamp" 
                                  className="max-h-[40px] object-contain"
                                />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-white block">{contract.assignedOfficer?.name || 'Kavin Kumar'}</span>
                                <span className="text-[9px] text-gray-500 block">{contract.assignedOfficer?.title || 'Senior Licensing Officer'}</span>
                              </div>
                            </div>
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
      {isBrandingOpen && user?.role !== 'staff' && (
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

                 <button
                  type="button"
                  onClick={() => setActiveSettingTab('whatsapp')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all w-full text-left ${
                    activeSettingTab === 'whatsapp'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-gray-400 hover:text-white hover:bg-gray-850'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp Integration
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSettingTab('integrations')}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all w-full text-left ${
                    activeSettingTab === 'integrations'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-gray-400 hover:text-white hover:bg-gray-850'
                  }`}
                >
                  <Plug className="w-4 h-4" />
                  Integrations Config
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

                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Merchant Onboarding Training Video Link (YouTube Embed URL)</label>
                        <input 
                          type="text"
                          value={onboardVideoUrl}
                          onChange={(e) => setOnboardVideoUrl(e.target.value)}
                          placeholder="e.g. https://www.youtube.com/embed/7V2eS8W1cCc"
                          className="w-full bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2.5 text-sm text-white transition-all font-mono"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">This video is embedded in the merchant tutorials dashboard checklist and the welcome dashboard splash guides.</p>
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

                      {/* Subscription Plans Manager (new unified format) */}
                      <div className="border border-gray-800 p-5 rounded-xl bg-gray-950/40 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-850 pb-3">
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold text-gray-200">Subscription Plans</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">{subscriptionPlans.length} plan{subscriptionPlans.length !== 1 ? 's' : ''}</span>
                        </div>
                        {/* Plans list */}
                        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                          {subscriptionPlans.length === 0 && (
                            <div className="border border-dashed border-gray-850 rounded-lg p-5 text-center text-gray-500 text-xs">
                              No plans configured. Add one below.
                            </div>
                          )}
                          {subscriptionPlans.map((plan) => (
                            <div key={plan.id} className={`border rounded-xl transition-all ${plan.isActive ? 'border-gray-800 bg-gray-900/40' : 'border-gray-850 bg-gray-950/30 opacity-60'}`}>
                              {editingPlanId === plan.id ? (
                                /* Inline edit form */
                                <div className="p-4 space-y-3">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div className="col-span-2">
                                      <label className="text-[9px] font-bold text-gray-400 uppercase">Plan Name</label>
                                      <input type="text" value={plan.name} onChange={(e) => handleUpdatePlan(plan.id, 'name', e.target.value)}
                                        className="w-full h-8 bg-gray-950 border border-gray-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 text-xs text-white mt-0.5" />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-bold text-gray-400 uppercase">Price (₹)</label>
                                      <input type="number" value={plan.price} onChange={(e) => handleUpdatePlan(plan.id, 'price', e.target.value)}
                                        className="w-full h-8 bg-gray-950 border border-gray-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 text-xs text-white font-mono mt-0.5" />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-bold text-gray-400 uppercase">Days</label>
                                      <input type="number" value={plan.days} onChange={(e) => handleUpdatePlan(plan.id, 'days', parseInt(e.target.value) || 30)}
                                        className="w-full h-8 bg-gray-950 border border-gray-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 text-xs text-white font-mono mt-0.5" />
                                    </div>
                                    <div className="col-span-2">
                                      <label className="text-[9px] font-bold text-gray-400 uppercase">Description</label>
                                      <input type="text" value={plan.description} onChange={(e) => handleUpdatePlan(plan.id, 'description', e.target.value)}
                                        className="w-full h-8 bg-gray-950 border border-gray-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 text-xs text-white mt-0.5" />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-bold text-gray-400 uppercase">Badge Label</label>
                                      <input type="text" value={plan.badge} onChange={(e) => handleUpdatePlan(plan.id, 'badge', e.target.value)}
                                        placeholder="e.g. Most Popular"
                                        className="w-full h-8 bg-gray-950 border border-gray-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 text-xs text-white mt-0.5" />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-bold text-gray-400 uppercase">Display Order</label>
                                      <input type="number" value={plan.displayOrder} onChange={(e) => handleUpdatePlan(plan.id, 'displayOrder', parseInt(e.target.value) || 0)}
                                        className="w-full h-8 bg-gray-950 border border-gray-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 text-xs text-white font-mono mt-0.5" />
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                      <button type="button" onClick={() => handleUpdatePlan(plan.id, 'isActive', !plan.isActive)}
                                        className={`w-8 h-4 rounded-full transition-colors ${plan.isActive ? 'bg-emerald-600' : 'bg-gray-700'}`}>
                                        <span className={`block w-3 h-3 bg-white rounded-full mx-auto transition-transform ${plan.isActive ? 'translate-x-2' : '-translate-x-2'}`} />
                                      </button>
                                      <span className="text-[10px] text-gray-400">{plan.isActive ? 'Active' : 'Inactive'}</span>
                                    </label>
                                    <button type="button" onClick={() => setEditingPlanId(null)}
                                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all">
                                      Done
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* Collapsed view */
                                <div className="p-3 flex items-center gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[11px] font-bold text-white">{plan.name}</span>
                                      {plan.badge && <span className="text-[8px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded-full font-black uppercase">{plan.badge}</span>}
                                      {!plan.isActive && <span className="text-[8px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded-full font-black uppercase">Inactive</span>}
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5">
                                      <span className="text-[10px] text-emerald-400 font-mono font-bold">₹{Number(plan.price).toLocaleString()}</span>
                                      <span className="text-[10px] text-gray-500 font-mono">{plan.days >= 99999 ? 'Lifetime' : `${plan.days} days`}</span>
                                      {plan.description && <span className="text-[10px] text-gray-500 truncate">{plan.description}</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button type="button" onClick={() => handleUpdatePlan(plan.id, 'isActive', !plan.isActive)}
                                      className={`p-1.5 rounded-lg transition-colors border text-[9px] font-bold ${plan.isActive ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400 hover:bg-emerald-950' : 'bg-gray-900 border-gray-850 text-gray-400 hover:bg-gray-850'}`}
                                      title={plan.isActive ? 'Disable plan' : 'Enable plan'}>
                                      {plan.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                                    </button>
                                    <button type="button" onClick={() => setEditingPlanId(plan.id)}
                                      className="p-1.5 bg-blue-950/40 hover:bg-blue-950 text-blue-400 rounded-lg transition-colors border border-blue-900/30" title="Edit plan">
                                      <Zap className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" onClick={() => handleDeletePlan(plan.id)}
                                      className="p-1.5 bg-red-950/40 hover:bg-red-950 text-red-400 rounded-lg transition-colors border border-red-900/30" title="Delete plan">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add New Plan Form */}
                        <div className="bg-gray-900/30 border border-gray-850/50 p-4 rounded-xl space-y-3 mt-2">
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Add New Plan</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="col-span-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Plan Name</label>
                              <input type="text" value={newPlan.name} onChange={(e) => setNewPlan(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. 3 Months Plan"
                                className="w-full h-8 bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 text-xs text-white mt-0.5" />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Price (₹)</label>
                              <input type="number" value={newPlan.price} onChange={(e) => setNewPlan(p => ({ ...p, price: e.target.value }))}
                                placeholder="1299"
                                className="w-full h-8 bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 text-xs text-white font-mono mt-0.5" />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Days</label>
                              <input type="number" value={newPlan.days} onChange={(e) => setNewPlan(p => ({ ...p, days: e.target.value }))}
                                placeholder="90"
                                className="w-full h-8 bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 text-xs text-white font-mono mt-0.5" />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Description</label>
                              <input type="text" value={newPlan.description} onChange={(e) => setNewPlan(p => ({ ...p, description: e.target.value }))}
                                placeholder="Short description for customers"
                                className="w-full h-8 bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 text-xs text-white mt-0.5" />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Badge (optional)</label>
                              <input type="text" value={newPlan.badge} onChange={(e) => setNewPlan(p => ({ ...p, badge: e.target.value }))}
                                placeholder="Most Popular"
                                className="w-full h-8 bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 text-xs text-white mt-0.5" />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Display Order</label>
                              <input type="number" value={newPlan.displayOrder || ''} onChange={(e) => setNewPlan(p => ({ ...p, displayOrder: parseInt(e.target.value) || 0 }))}
                                placeholder={String(subscriptionPlans.length + 1)}
                                className="w-full h-8 bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 text-xs text-white font-mono mt-0.5" />
                            </div>
                          </div>
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={handleAddPlan}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Plan
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
                      <p className="text-xs text-gray-400 mt-0.5">Customize the terms & conditions printed in every merchant contract agreement per language.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Premium Language Tab Bar Selector */}
                      <div className="flex flex-wrap gap-1.5 p-1 bg-gray-900/50 border border-gray-800 rounded-xl">
                        {[
                          { code: 'en', label: 'English', native: 'English' },
                          { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
                          { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
                          { code: 'te', label: 'Telugu', native: 'తెలుగు' },
                          { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
                          { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' }
                        ].map((lang) => {
                          const isActive = selectedLanguageTab === lang.code;
                          return (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => setSelectedLanguageTab(lang.code)}
                              className={`flex-1 min-w-[90px] px-3 py-2 text-2xs font-black uppercase tracking-wider rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 border ${
                                isActive 
                                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-400 shadow-md' 
                                  : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/40'
                              }`}
                            >
                              <span>{lang.label}</span>
                              <span className="text-[8px] font-normal normal-case tracking-normal opacity-60">{lang.native}</span>
                            </button>
                          );
                        })}
                      </div>

                      <textarea
                        value={agreementTemplates[selectedLanguageTab] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAgreementTemplates(prev => {
                            const next = { ...prev, [selectedLanguageTab]: val };
                            localStorage.setItem('saas_agreement_templates', JSON.stringify(next));
                            return next;
                          });
                          if (selectedLanguageTab === 'en') {
                            setAgreementTemplate(val);
                            localStorage.setItem('saas_agreement_template', val);
                          }
                        }}
                        rows={12}
                        placeholder={`Enter agreement terms & conditions in ${selectedLanguageTab.toUpperCase()}...`}
                        className="w-full bg-gray-950 border border-gray-800 focus:border-amber-500/50 focus:outline-none rounded-xl px-3.5 py-3 text-xs text-gray-300 leading-relaxed resize-y transition-all font-mono placeholder:text-gray-600"
                      />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">HTML tags are not recommended. Standard layout styling will wrap your raw texts.</span>
                        <button
                          type="button"
                          onClick={() => {
                            const defVal = defaultTemplates[selectedLanguageTab];
                            setAgreementTemplates(prev => {
                              const next = { ...prev, [selectedLanguageTab]: defVal };
                              localStorage.setItem('saas_agreement_templates', JSON.stringify(next));
                              return next;
                            });
                            if (selectedLanguageTab === 'en') {
                              setAgreementTemplate(defVal);
                              localStorage.setItem('saas_agreement_template', defVal);
                            }
                            setActionStatus(`Template reset to default for ${selectedLanguageTab.toUpperCase()}!`);
                            setTimeout(() => setActionStatus(null), 2000);
                          }}
                          className="text-[10px] text-amber-550 hover:text-amber-400 font-bold transition-colors underline underline-offset-2"
                        >
                          Reset to default ({selectedLanguageTab.toUpperCase()})
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
                        { id: 'retro', name: 'Retro Grid', defaultThumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600', desc: 'Grotesk neon shadows flat retro theme.' },
                        { id: 'admire', name: 'Admire Organic Essence', defaultThumb: 'https://images.unsplash.com/photo-1607006342411-91f11f6d021c?auto=format&fit=crop&q=80&w=600', desc: 'Warm orange (#f2852a) and deep navy (#04113f) contrast with soft soap-bar rounded contours.' }
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
                                          setTemplateThumbnails(prev => ({ ...prev, [tpl.id]: res as string }));
                                          setTemplateThumbnailsUpdatedAt(prev => ({ ...prev, [tpl.id]: Date.now() }));
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
                                      setTemplateThumbnails(prev => ({ ...prev, [tpl.id]: val }));
                                      setTemplateThumbnailsUpdatedAt(prev => ({ ...prev, [tpl.id]: Date.now() }));
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

                {/* 6. WHATSAPP INTEGRATION TAB */}
                {activeSettingTab === 'whatsapp' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-450" />
                        WhatsApp Integration Settings
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">Globally configure storefront click-to-chat widgets, order alert campaigns, and subscription plan limits.</p>
                    </div>

                    <div className="border border-gray-800 p-5 rounded-xl bg-gray-950/40 space-y-5 text-left">
                      {/* Global Enable Switch */}
                      <div className="flex items-center justify-between pb-4 border-b border-gray-850">
                        <div>
                          <h4 className="text-xs font-bold text-white">Global WhatsApp Module Activation</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">Activate or deactivate the WhatsApp suite (storefront widgets and admin triggers) platform-wide.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setWhatsappEnabledGlobal(!whatsappEnabledGlobal)}
                          className="focus:outline-none transition-all"
                        >
                          {whatsappEnabledGlobal ? (
                            <ToggleRight className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
                          ) : (
                            <ToggleLeft className="w-10 h-10 text-gray-600" strokeWidth={1.5} />
                          )}
                        </button>
                      </div>

                      {/* Default Welcome Message Input */}
                      <div className="space-y-2 pb-4 border-b border-gray-850">
                        <div>
                          <h4 className="text-xs font-bold text-white">Default Storefront Welcome Message</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">This greeting message is automatically loaded when a storefront customer clicks the WhatsApp widget if the store owner hasn't customized their message.</p>
                        </div>
                        <input
                          type="text"
                          value={whatsappDefaultWelcome}
                          onChange={(e) => setWhatsappDefaultWelcome(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-850 focus:border-emerald-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-white transition-all font-medium placeholder:text-gray-700"
                          placeholder="e.g. Hi, I would like to query about your products!"
                        />
                      </div>

                      {/* Plan Permissions List */}
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-xs font-bold text-white">Subscription Plans Permission Settings</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">Check plans authorized to display the storefront chat widget and process outgoing order status notifications.</p>
                        </div>

                        <div className="overflow-hidden border border-gray-850 rounded-lg">
                          <table className="w-full text-[11px] text-left">
                            <thead className="bg-gray-900 text-gray-400 uppercase text-[9px] font-black tracking-wider border-b border-gray-850">
                              <tr>
                                <th className="px-4 py-3">Plan Name</th>
                                <th className="px-4 py-3 text-center">Click-To-Chat Widget</th>
                                <th className="px-4 py-3 text-center">Order Update Alerts</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-850">
                              {(() => {
                                const defaultPlans = [
                                  { id: '30', name: '1 Month Plan (Basic)' },
                                  { id: '365', name: '1 Year Plan (Standard)' },
                                  { id: 'lifetime', name: 'Lifetime Plan (Premium)' }
                                ].filter(plan => !disabledDefaultPackages.includes(plan.id));

                                const customPlans = customPackages.map(pkg => ({
                                  id: pkg.id,
                                  name: `${pkg.name} (Custom)`
                                }));

                                const allPlans = [...defaultPlans, ...customPlans];

                                if (allPlans.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                                        No subscription packages created yet.
                                      </td>
                                    </tr>
                                  );
                                }

                                return allPlans.map(plan => {
                                  const isCtcEnabled = whatsappPlansEnabled.includes(plan.id);
                                  const isOuaEnabled = whatsappPlansOrderUpdatesEnabled.includes(plan.id);

                                  return (
                                    <tr key={plan.id} className="hover:bg-gray-900/40">
                                      <td className="px-4 py-3 font-bold text-white">{plan.name}</td>
                                      <td className="px-4 py-3 text-center">
                                        <input
                                          type="checkbox"
                                          checked={isCtcEnabled}
                                          onChange={() => setWhatsappPlansEnabled(prev =>
                                            prev.includes(plan.id)
                                              ? prev.filter(x => x !== plan.id)
                                              : [...prev, plan.id]
                                          )}
                                          className="w-4 h-4 rounded border-gray-800 text-emerald-650 bg-gray-950 focus:ring-emerald-500/20 accent-emerald-500 cursor-pointer"
                                        />
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <input
                                          type="checkbox"
                                          checked={isOuaEnabled}
                                          onChange={() => setWhatsappPlansOrderUpdatesEnabled(prev =>
                                            prev.includes(plan.id)
                                              ? prev.filter(x => x !== plan.id)
                                              : [...prev, plan.id]
                                          )}
                                          className="w-4 h-4 rounded border-gray-800 text-emerald-650 bg-gray-950 focus:ring-emerald-500/20 accent-emerald-500 cursor-pointer"
                                        />
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 7. INTEGRATIONS CONFIG TAB */}
                {activeSettingTab === 'integrations' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Plug className="w-4 h-4 text-blue-500" />
                        Integrations & Gateways Config
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">Globally configure payment gateways and third-party integrations, and assign plan availability.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Section 1: Payment Gateways Control */}
                      <div className="border border-gray-850 p-5 rounded-xl bg-gray-950/40 space-y-5 text-left">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider text-blue-400 border-b border-gray-850 pb-2">Payment Gateways</h4>
                        
                        <div className="space-y-6">
                          {[
                            { id: 'razorpay', name: 'Razorpay Payment Gateway' },
                            { id: 'phonepe', name: 'PhonePe PG' },
                            { id: 'cashfree', name: 'Cashfree' },
                            { id: 'payu', name: 'PayU' }
                          ].map((gateway) => {
                            const config = globalPaymentGateways[gateway.id] || { enabled: false, plans: [] };
                            
                            return (
                              <div key={gateway.id} className="space-y-3 pb-4 border-b border-gray-850/60 last:border-b-0 last:pb-0">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-xs font-bold text-white">{gateway.name}</span>
                                    <span className="text-[10px] text-gray-500 block">Globally enable or disable this gateway</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setGlobalPaymentGateways(prev => ({
                                      ...prev,
                                      [gateway.id]: {
                                        ...config,
                                        enabled: !config.enabled
                                      }
                                    }))}
                                    className="focus:outline-none transition-all"
                                  >
                                    {config.enabled ? (
                                      <ToggleRight className="w-9 h-9 text-blue-500" strokeWidth={1.5} />
                                    ) : (
                                      <ToggleLeft className="w-9 h-9 text-gray-600" strokeWidth={1.5} />
                                    )}
                                  </button>
                                </div>

                                {config.enabled && (
                                  <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-850 space-y-2">
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Authorized Subscription Plans</span>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                      {(() => {
                                        const defaultPlans = [
                                          { id: '30', name: '1 Month' },
                                          { id: '365', name: '1 Year' },
                                          { id: 'lifetime', name: 'Lifetime' }
                                        ].filter(plan => !disabledDefaultPackages.includes(plan.id));

                                        const customPlans = customPackages.map(pkg => ({
                                          id: pkg.id,
                                          name: pkg.name
                                        }));

                                        const allPlans = [...defaultPlans, ...customPlans];

                                        if (allPlans.length === 0) {
                                          return <span className="text-[10px] text-gray-500">No subscription plans available</span>;
                                        }

                                        return allPlans.map(plan => {
                                          const checked = config.plans.includes(plan.id);
                                          return (
                                            <label key={plan.id} className="flex items-center gap-1.5 text-[10px] text-gray-300 font-medium cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => setGlobalPaymentGateways(prev => {
                                                  const oldConfig = prev[gateway.id] || { enabled: false, plans: [] };
                                                  const newPlans = checked 
                                                    ? oldConfig.plans.filter(p => p !== plan.id)
                                                    : [...oldConfig.plans, plan.id];
                                                  return {
                                                    ...prev,
                                                    [gateway.id]: { ...oldConfig, plans: newPlans }
                                                  };
                                                })}
                                                className="w-3.5 h-3.5 rounded border-gray-800 text-blue-650 bg-gray-950 focus:ring-blue-500/20 accent-blue-500 cursor-pointer"
                                              />
                                              {plan.name}
                                            </label>
                                          );
                                        });
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 2: Integrations Control */}
                      <div className="border border-gray-850 p-5 rounded-xl bg-gray-950/40 space-y-5 text-left">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider text-blue-400 border-b border-gray-850 pb-2">Third-Party Integrations</h4>
                        
                        <div className="space-y-4">
                          {[
                            { id: 'shiprocket', name: 'Shiprocket Logistics', desc: 'Allow store owners to sync courier shipments.' },
                            { id: 'delhivery', name: 'Delivery Shipping', desc: 'Allow store owners to integrate Delhivery API.' },
                            { id: 'ga4', name: 'Google Analytics 4', desc: 'Allow tracking checkouts and traffic metrics.' }
                          ].map((integration) => {
                            const isEnabled = !!globalIntegrations[integration.id];
                            
                            return (
                              <div key={integration.id} className="flex items-center justify-between pb-4 border-b border-gray-850/60 last:border-b-0 last:pb-0">
                                <div>
                                  <span className="text-xs font-bold text-white block">{integration.name}</span>
                                  <span className="text-[10px] text-gray-500 block leading-tight mt-0.5">{integration.desc}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setGlobalIntegrations(prev => ({
                                    ...prev,
                                    [integration.id]: !prev[integration.id]
                                  }))}
                                  className="focus:outline-none transition-all shrink-0"
                                >
                                  {isEnabled ? (
                                    <ToggleRight className="w-9 h-9 text-blue-500" strokeWidth={1.5} />
                                  ) : (
                                    <ToggleLeft className="w-9 h-9 text-gray-600" strokeWidth={1.5} />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
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

      {/* Manual Password Reset Modal */}
      {resetModalOpen && resetStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-gray-900 border border-gray-850 rounded-2xl shadow-2xl overflow-hidden p-6 text-left space-y-6">
            <div className="flex items-center justify-between border-b border-gray-850 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Reset Merchant Password</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Shop: {resetStore.store_name}</p>
                </div>
              </div>
              <button
                onClick={() => setResetModalOpen(false)}
                className="p-1.5 rounded-lg bg-gray-850 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">New Password</label>
              <input
                type="text"
                placeholder="Enter new temporary password"
                value={resetPasswordVal}
                onChange={(e) => setResetPasswordVal(e.target.value)}
                className="w-full h-10 px-3 bg-gray-950 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors placeholder:text-gray-650"
              />
              <p className="text-[9px] text-gray-500">Must be at least 6 characters long. Give this password to the merchant.</p>
            </div>

            <div className="flex items-center gap-3 justify-end pt-4 border-t border-gray-850">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-850 hover:bg-gray-800 text-xs font-semibold text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPasswordSubmit}
                disabled={resetLoading || !resetPasswordVal}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-xs font-semibold text-black transition-colors shadow-md flex items-center gap-1.5"
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    Confirm Reset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
