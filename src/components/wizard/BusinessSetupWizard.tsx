"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, CheckCircle2, Globe, FileText, Printer, Download, Edit3, Phone, Check, QrCode, Smartphone, Upload, Trash, X, Clipboard, HelpCircle, AlertTriangle } from 'lucide-react';

export default function BusinessSetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Subscription Plan & Signature states
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
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'app'>('qr');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim' | null>(null);
  const [isUpiSimulating, setIsUpiSimulating] = useState(false);
  const [upiSimulationStep, setUpiSimulationStep] = useState<number>(0);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<'minimal' | 'artisan' | 'bold' | 'luxe' | 'retro' | 'admire'>('minimal');

  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    category: '',
    logo: null as string | null,
    primaryColor: '#3B82F6',
    email: '',
    phone: '',
    currency: 'INR',
    authEmail: '',
    authPassword: '',
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
    
    hi: `1. सेवा के प्रावधान: क्रेवा ई-कॉमर्स सास प्लेटफॉर्म हस्ताक्षरकर्ता मर्चेंट को हमारे क्लाउड आर्किटेक्चर का उपयोग करके एक स्वचालित खुदरा स्टोरफ्रंट वेबसाइट संचालित करने का लाइसेंस प्रदान करता है। कस्टम डोमेन मैपिंग सदस्यता योजना स्तर के अधीन है।

2. योजना नवीनीकरण और पूछताछ प्रणाली: मर्चेंट समझता है कि प्लेटफॉर्म बिलिंग एक पूछताछ सक्रियण प्रणाली का उपयोग करती है। योजना की समाप्ति पर, सहायता बिक्री टीम से सीधे संपर्क करके नवीनीकरण न किए जाने तक स्टोरफ्रंट एक्सेस को निलंबित किया जा सकता है।

3. स्वीकार्य उपयोग और कानूनी सीमाएं: मर्चेंट केवल कानूनी रूप से अनुपालन करने वाले सामानों को सूचीबद्ध करने के लिए सहमत है। प्रतिबंधित, अवैध या अनधिकृत उत्पादों की बिक्री से बिना किसी रिफंड के इस लाइसेंस को तत्काल समाप्त कर दिया जाएगा।

4. सुरक्षा और गोपनीयता: प्लेटफॉर्म मर्चेंट डेटाबेस संपत्ति, कैटलॉग लिस्टिंग और कस्टम स्टाइलिंग की रक्षा करेगा। प्लेटफॉर्म ऑफ-साइट ग्राहक विवादों के लिए जिम्मेदार नहीं है।`,
    
    te: `1. సేవా నిబంధనలు: క్రెవా ఇ-కామర్స్ సాస్ ప్లాట్‌ఫారమ్ సంతకం చేసిన వ్యాపారికి మా క్లౌడ్ ఆర్కిటెక్చర్‌ని ఉపయోగించి స్వయంచాలక రిటైల్ స్టోర్‌ఫ్రంట్ వెబ్‌సైట్‌ను నిర్వహించడానికి లైసెన్స్ మంజూరు చేస్తుంది. కస్టమ్ డొమైన్ మ్యాపింగ్స్ సభ్యత్వ ప్లాన్ శాతం లోబడి ఉంటాయి.

2. ప్లాన్ పునరుద్ధరణలు & విచారణ వ్యవస్థ: ప్లాట్‌ఫారమ్ బిల్లింగ్ ఒక విచారణ యాక్టివేషన్ సిస్టమ్‌ను ఉపయోగిస్తుందని వ్యాపారి అర్థం చేసుకున్నారు. ప్లాన్ గడువు ముగిసిన తర్వాత, సేల్స్ టీమ్‌ని సంప్రదించి పునరుద్ధరించకపోతే స్టోర్‌ఫ్రంట్ యాక్సెస్ నిలిపివేయబడవచ్చు.

3. అనుమతించదగిన వినియోగం & చట్టపరమైన పరిమితులు: వ్యాపారి చట్టబద్ధమైన వస్తువులను మాత్రమే విక్రయించడానికి అంగీకరిస్తారు. నిషేధించబడిన, చట్టవిరుద్ధమైన లేదా అనధికారిక ఉత్పత్తుల విక్రయాలు ఎటువంటి రీఫండ్ లేకుండా ఈ లైసెన్స్‌ను వెంటనే రద్దు చేయడానికి దారితీస్తాయి.

4. భద్రత & డేటా గోప్యత: ప్లాట్‌ఫారమ్ వ్యాపారి డేటాబేస్ ఆస్తులు, కేటలాగ్ జాబితాలు మరియు కస్టమ్ స్టైలింగ్‌ను రక్షిస్తుంది. ఆఫ్-సైట్ కస్టమర్ వివాదాలకు ప్లాట్‌ఫారమ్ బాధ్యత వహించదు.`,
    
    ml: `1. സേവന വ്യവസ്ഥകൾ: ക്രെവ ഇ-കൊമേഴ്‌സ് സാസ് പ്ലാറ്റ്‌ഫോം ഒപ്പിട്ട വ്യാപാരിക്ക് ഞങ്ങളുടെ ക്ലൗഡ് ആർക്കിടെക്ചർ ഉപയോഗിച്ച് ഒരു ഓട്ടോമേറ്റഡ് റീട്ടെയിൽ സ്റ്റോർഫ്രണ്ട് വെബ്‌സൈറ്റ് പ്രവർത്തിപ്പിക്കാൻ ലൈസൻസ് നൽകുന്നു. കസ്റ്റം ഡൊമെയ്ൻ മാപ്പിംഗുകൾ സബ്‌സ്‌ക്രിപ്‌ഷൻ പ്ലാൻ ലെവലിന് വിധേയമാണ്.

2. പ്ലാൻ പുതുക്കലും അന്വേഷണ സംവിധാനവും: പ്ലാറ്റ്‌ഫോം ബില്ലിംഗ് ഒരു അന്വേഷണ സജീവമാക്കൽ സംവിധാനമാണ് ഉപയോഗിക്കുന്നതെന്ന് വ്യാപാരി മനസ്സിലാക്കുന്നു. പ്ലാൻ കാലഹരണപ്പെടുമ്പോൾ, സപ്പോർട്ട് ടീമുമായി നേരിട്ട് ബന്ധപ്പെട്ട് പുതുക്കിയില്ലെങ്കിൽ ആക്സസ് താൽക്കാലികമായി നിർത്താം.

3. സ്വീകാര്യമായ ഉപയോഗവും നിയമപരമായ പരിധികളും: നിയമപരമായി അനുസരിക്കുന്ന സാധനങ്ങൾ മാത്രം ലിസ്റ്റ് ചെയ്യാൻ വ്യാപാരി സമ്മതിക്കുന്നു. നിരോധിതമോ നിയമവിരുദ്ധമോ അനധികൃതമോ ആയ ഉൽപ്പന്നങ്ങളുടെ വിൽപ്പന റീഫണ്ട് ഇല്ലാതെ ഈ ലൈസൻസ് ഉടനടി റദ്ദാക്കാൻ ഇടയാക്കും.

4. സുരക്ഷയും ഡാറ്റാ സ്വകാര്യതയും: പ്ലാറ്റ്‌ഫോം വ്യാപാരിയുടെ ഡാറ്റാബേസ് അസറ്റുകൾ, ഉൽപ്പന്ന ലിസ്റ്റിംഗുകൾ, കസ്റ്റം സ്റ്റൈലിംഗ് എന്നിവ സംരക്ഷിക്കും. ഓഫ്-സൈറ്റ് ഉപഭോക്തൃ തർക്കങ്ങൾക്ക് പ്ലാറ്റ്‌ഫോം ഉത്തരവാദിയല്ല.`,
    
    kn: `1. ಸೇವಾ ನಿಬಂಧನೆಗಳು: ಕ್ರೆವಾ ಇ-ಕಾಮರ್ಸ್ ಸಾಸ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಸಹಿ ಮಾಡಿದ ವ್ಯಾಪಾರಿಗೆ ನಮ್ಮ ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಕ್ಲೌಡ್ ಆರ್ಕಿಟೆಕ್ಚರ್ ಬಳಸಿ ಸ್ವಯಂಚಾಲಿತ ಚಿಲ್ಲರೆ ಸ್ಟೋರ್‌ಫ್ರಂಟ್ ವೆಬ್‌ಸೈಟ್ ನಿರ್ವಹಿಸಲು ಪರವานಗಿ ನೀಡುತ್ತದೆ. ಕಸ್ಟಮ್ ಡೊಮೇನ್ ಮ್ಯಾಪಿಂಗ್‌ಗಳು ಚಂದಾದಾರಿಕೆ ಯೋಜನೆ ಮಟ್ಟಕ್ಕೆ ಒಳಪಟ್ಟಿರುತ್ತವೆ.

2. ಯೋಜನೆ ನವೀಕರಣಗಳು ಮತ್ತು ವಿಚಾರಣಾ ವ್ಯವಸ್ಥೆ: ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಬಿಲ್ಲಿಂಗ್ ವಿಚಾರಣಾ ಸಕ್ರಿಯಗೊಳಿಸುವ ವ್ಯವಸ್ಥೆಯನ್ನು ಬಳಸುತ್ತದೆ ಎಂದು ವ್ಯಾపಾರಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳುತ್ತಾರೆ. ಯೋಜನೆ ಅವಧಿ ಮುಗಿದ ನಂತರ, ಸಪೋರ್ಟ್ ಸೇಲ್ಸ್ ತಂಡವನ್ನು ನೇರವಾಗಿ ಸಂಪర్కಿಸಿ ನವೀಕರಿಸದಿದ್ದರೆ ಪ್ರವೇಶವನ್ನು ಅಮಾನತುಗೊಳಿಸಬಹುದು.

3. ಸ್ವೀಕಾರಾರ್ಹ ಬಳಕೆ ಮತ್ತು ಕಾನೂನು ಮಿತಿಗಳು: ವ್ಯಾಪಾರಿ ಕಾನೂನುಬದ್ಧ ಸರകുಗಳನ್ನು ಮಾತ್ರ ಪಟ್ಟಿ ಮಾಡಲು ಒಪ್ಪಿಕೊಳ್ಳುತ್ತಾರೆ. ನಿಷೇಧಿತ, ಅಕ್ರಮ ಅಥವಾ ಅನಧಿಕೃತ ಉತ್ಪನ್ನಗಳ ಮಾರಾಟವು ಯಾವುದೇ ಮರುಪಾವತಿ ಇಲ್ಲದೆ ಈ ಪರವಾನಗಿಯನ್ನು ತಕ್ಷಣವೇ ರದ್ದುಗೊಳಿಸಲು ಕಾರಣವಾಗುತ್ತದೆ.

4. ಸುರಕ್ಷತೆ ಮತ್ತು ಡೇಟಾ ಗೌಪ್ಯತೆ: ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ವ್ಯಾಪಾರಿಯ ಡೇಟಾಬೇಸ್ ಆಸ್ತಿಗಳು, ಕ್ಯಾಟಲಾಗ್ ಪಟ್ಟಿಗಳು ಮತ್ತು ಕಸ್ಟಮ್ ಶೈಲಿಯನ್ನು ರಕ್ಷಿಸುತ್ತದೆ. ಆಫ್-ಸೈಟ್ ಗ್ರಾಹಕ ವಿವಾದಗಳಿಗೆ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಜವಾಬ್ದಾರನಾಗಿರುವುದಿಲ್ಲ.`
  };

  const [agreementTemplates, setAgreementTemplates] = useState<Record<string, string>>(defaultTemplates);
  const [selectedAgreementLang, setSelectedAgreementLang] = useState<string>('en');
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
      } else if (tempParam === 'admire' || tempParam === '6') {
        setSelectedTemplate('admire');
        setFormData(prev => ({ ...prev, primaryColor: '#f2852a' }));
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

          if (parsed.agreementTemplates) {
            setAgreementTemplates(parsed.agreementTemplates);
            localStorage.setItem('saas_agreement_templates', JSON.stringify(parsed.agreementTemplates));
          } else if (parsed.agreementTemplate) {
            const migrated = { ...defaultTemplates, en: parsed.agreementTemplate };
            setAgreementTemplates(migrated);
            localStorage.setItem('saas_agreement_templates', JSON.stringify(migrated));
          }

          // Seed local storage with these global settings so print/agreement windows can access them
          if (parsed.brandName) localStorage.setItem('saas_brand_name', parsed.brandName);
          if (parsed.brandLogo) localStorage.setItem('saas_brand_logo', parsed.brandLogo);
          if (parsed.officers) localStorage.setItem('saas_licensing_officers', JSON.stringify(parsed.officers));
          if (parsed.agreementTemplate) localStorage.setItem('saas_agreement_template', parsed.agreementTemplate);
          if (parsed.plan30Price) localStorage.setItem('saas_plan_30_price', parsed.plan30Price);
          if (parsed.plan365Price) localStorage.setItem('saas_plan_365_price', parsed.plan365Price);
          if (parsed.planLifetimePrice) localStorage.setItem('saas_plan_lifetime_price', parsed.planLifetimePrice);
          if (parsed.disabledDefaultPackages) localStorage.setItem('saas_disabled_default_packages', JSON.stringify(parsed.disabledDefaultPackages));
          if (parsed.customPackages) localStorage.setItem('saas_custom_packages', JSON.stringify(parsed.customPackages));
        }
      } catch (err) {
        console.error("Failed to load global SaaS settings from DB:", err);
      }
    };
    loadGlobalSettings();
  }, []);

  // Helper to resolve plan amounts dynamically (strips currency/commas for UPI)
  const getSelectedPlanAmount = (): string => {
    let amount = '0';
    if (selectedPlan === '30') {
      amount = (globalSettings?.plan30Price || '499').toString();
    } else if (selectedPlan === '365') {
      amount = (globalSettings?.plan365Price || '3999').toString();
    } else if (selectedPlan === 'lifetime') {
      amount = (globalSettings?.planLifetimePrice || '9999').toString();
    } else {
      const customPkg = (globalSettings?.customPackages || []).find((pkg: any) => pkg.id === selectedPlan);
      amount = customPkg ? (customPkg.price || '0').toString() : '0';
    }
    return amount.replace(/[^0-9.]/g, '');
  };

  // Helper to resolve plan label dynamically
  const getSelectedPlanLabel = (): string => {
    if (selectedPlan === '30') return '1 Month (30 Days)';
    if (selectedPlan === '365') return '1 Year (365 Days)';
    if (selectedPlan === 'lifetime') return 'Lifetime Subscription';
    const customPkg = (globalSettings?.customPackages || []).find((pkg: any) => pkg.id === selectedPlan);
    return customPkg ? `${customPkg.name} (${customPkg.days} Days)` : 'Custom Subscription';
  };

  // Auto-select the first available plan when settings load (especially if '30' is disabled)
  useEffect(() => {
    if (globalSettings) {
      const defaultPlans = [
        { id: '30' },
        { id: '365' },
        { id: 'lifetime' }
      ].filter(plan => !(globalSettings?.disabledDefaultPackages || []).includes(plan.id));
      
      const customPlans = (globalSettings?.customPackages || []).map((pkg: any) => ({
        id: pkg.id
      }));
      
      const allAvailable = [...defaultPlans, ...customPlans];
      if (allAvailable.length > 0) {
        if (!allAvailable.some(p => p.id === selectedPlan)) {
          setSelectedPlan(allAvailable[0].id);
        }
      }
    }
  }, [globalSettings, selectedPlan]);

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
        alert("Please digitally sign the SaaS agreement and click 'Confirm & Lock Signature' below the canvas to proceed!");
        return;
      }
      if (!paymentScreenshotUrl) {
        alert("Please pay via scan QR code or UPI app, and upload your payment screenshot to proceed!");
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
    ctx.strokeStyle = '#000000';
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
      alert("Digital signature captured and locked successfully!");
    } else {
      alert("Error capturing signature. Please try drawing again.");
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

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo image is too large! Please choose a file under 2MB.");
        return;
      }
      await uploadLogo(file);
    }
  };

  const uploadLogo = async (file: File) => {
    setLogoUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `store-logos/${fileName}`;

      let publicUrl = '';
      
      const { data, error } = await supabase.storage
        .from('assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.warn("Upload logo to 'assets' bucket failed, attempting 'products'...", error);
        
        const { data: dataAlt, error: errorAlt } = await supabase.storage
          .from('products')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (errorAlt) throw errorAlt;
        
        if (dataAlt && dataAlt.path && (dataAlt.path.startsWith('http://') || dataAlt.path.startsWith('https://'))) {
          publicUrl = dataAlt.path;
        } else {
          const { data: { publicUrl: url } } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);
          publicUrl = url;
        }
      } else {
        if (data && data.path && (data.path.startsWith('http://') || data.path.startsWith('https://'))) {
          publicUrl = data.path;
        } else {
          const { data: { publicUrl: url } } = supabase.storage
            .from('assets')
            .getPublicUrl(filePath);
          publicUrl = url;
        }
      }

      setFormData(prev => ({ ...prev, logo: publicUrl }));

    } catch (err: any) {
      console.error("Storage logo upload failed, falling back to base64 encoding", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleScreenshotFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Screenshot image is too large! Please choose a file under 5MB.");
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
        
        if (dataAlt && dataAlt.path && (dataAlt.path.startsWith('http://') || dataAlt.path.startsWith('https://'))) {
          publicUrl = dataAlt.path;
        } else {
          const { data: { publicUrl: url } } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);
          publicUrl = url;
        }
      } else {
        if (data && data.path && (data.path.startsWith('http://') || data.path.startsWith('https://'))) {
          publicUrl = data.path;
        } else {
          const { data: { publicUrl: url } } = supabase.storage
            .from('assets')
            .getPublicUrl(filePath);
          publicUrl = url;
        }
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
    const planAmount = getSelectedPlanAmount();
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
    const activeTerms = agreementTemplates[selectedAgreementLang] || defaultTemplates[selectedAgreementLang];
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const planLabel = getSelectedPlanLabel();

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
            <div class="section-title">Terms &amp; Conditions of Service (${selectedAgreementLang.toUpperCase()})</div>
            <div class="terms">
              ${activeTerms
                .split('\n')
                .filter((line: string) => line.trim())
                .map((para: string) => `<p>${para.trim().replace(/&/g, '&amp;')}</p>`)
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
      } else if (selectedPlan === 'lifetime') {
        expiryDate = null;
      } else {
        const customPkg = (globalSettings?.customPackages || []).find((pkg: any) => pkg.id === selectedPlan);
        if (customPkg) {
          expiryDate = new Date(now.getTime() + Number(customPkg.days || 30) * 24 * 60 * 60 * 1000).toISOString();
        }
      }

      const contractDetails = {
        description: formData.businessDescription,
        contractSigned: true,
        contractSignedAt: new Date().toISOString(),
        contractSignature: signature,
        selectedLanguage: selectedAgreementLang,
        signedAgreementTerms: agreementTemplates[selectedAgreementLang] || defaultTemplates[selectedAgreementLang],
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
          logo_url: formData.logo,
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
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 md:p-8 bg-slate-900/60 text-slate-100 rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-800 backdrop-blur-md">
      {/* Progress Bar */}
      <div className="mb-8 relative">
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-600"
            initial={{ width: '0%' }}
            animate={{ width: `${((step - 1) / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="hidden md:flex justify-between mt-4 text-[10px] md:text-xs font-medium text-slate-400">
          <span className={step >= 1 ? "text-blue-500 font-bold" : ""}>1. Business</span>
          <span className={step >= 2 ? "text-blue-500 font-bold" : ""}>2. Branding</span>
          <span className={step >= 3 ? "text-blue-500 font-bold" : ""}>3. Contact</span>
          <span className={step >= 4 ? "text-blue-500 font-bold" : ""}>4. Preferences</span>
          <span className={step >= 5 ? "text-blue-500 font-bold" : ""}>5. Plan & Contract</span>
          <span className={step >= 6 ? "text-blue-500 font-bold" : ""}>6. Account</span>
        </div>
        <div className="flex md:hidden justify-between mt-3 text-[11px] font-black text-slate-450">
          <span>STEP {step} OF 6</span>
          <span className="text-blue-500 uppercase tracking-wider font-extrabold">
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
                  <label className="block text-sm font-medium mb-1.5 text-slate-350">Business Name *</label>
                  <input 
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:border-blue-500 outline-none transition-all placeholder:text-slate-650" 
                    placeholder="e.g. Handmade Soaps Co."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-350">Category *</label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="" className="bg-slate-950 text-slate-205">Select a category</option>
                    <option value="soap" className="bg-slate-950 text-slate-205">Handmade Soap</option>
                    <option value="fashion" className="bg-slate-950 text-slate-205">Fashion & Apparel</option>
                    <option value="food" className="bg-slate-950 text-slate-205">Food & Beverages</option>
                    <option value="decor" className="bg-slate-950 text-slate-205">Home Decor</option>
                    <option value="other" className="bg-slate-950 text-slate-205">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-350">Description *</label>
                  <textarea 
                    name="businessDescription"
                    value={formData.businessDescription}
                    onChange={handleChange}
                    className="w-full min-h-[100px] p-3.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:border-blue-500 outline-none transition-all placeholder:text-slate-650" 
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
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Choose Storefront Design Template</label>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { id: 'minimal', name: 'Minimal Elegance', defaultColor: '#000000', desc: 'Sleek luxury, high contrast, clean typography. Perfect for boutique brands.', defaultThumb: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600' },
                    { id: 'artisan', name: 'Artisan Craft', defaultColor: '#8B5A2B', desc: 'Warm cream tones, classical serif accents, hand-crafted organic feel.', defaultThumb: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=600' },
                    { id: 'bold', name: 'Bold Commerce', defaultColor: '#E11D48', desc: 'Vibrant, thick-bordered grid layouts, chunky shadows, high-impact details.', defaultThumb: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&q=80&w=600' },
                    { id: 'luxe', name: 'Dark Luxe', defaultColor: '#D4AF37', desc: 'Exclusive gold on pitch black premium layout. For luxury items & accessories.', defaultThumb: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600' },
                    { id: 'retro', name: 'Retro Grid', defaultColor: '#8B5CF6', desc: 'Space-grotesk flat shadow neon theme. Heavy borders, nostalgic retro aesthetics.', defaultThumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600' },
                    { id: 'admire', name: 'Admire Essence', defaultColor: '#f2852a', desc: 'Warm orange (#f2852a) and deep navy (#04113f) contrast with soft soap-bar rounded contours.', defaultThumb: 'https://images.unsplash.com/photo-1607006342411-91f11f6d021c?auto=format&fit=crop&q=80&w=600' }
                  ].map((tpl, idx) => {
                    const customThumbnail = globalSettings?.templateThumbnails?.[tpl.id];
                    const thumbnailUrl = customThumbnail || tpl.defaultThumb;

                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(tpl.id as any);
                          setFormData(prev => ({ ...prev, primaryColor: tpl.defaultColor }));
                        }}
                        className={`flex flex-col text-left rounded-xl border-2 overflow-hidden transition-all relative group ${
                          selectedTemplate === tpl.id
                            ? 'border-blue-500 bg-blue-500/10 shadow-md scale-[1.02]'
                            : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/40 hover:scale-[1.01]'
                        }`}
                      >
                        {/* Thumbnail image slot */}
                        <div className="w-full h-24 relative overflow-hidden bg-slate-950 border-b border-slate-850">
                          <img 
                            src={thumbnailUrl} 
                            alt={tpl.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>

                        {selectedTemplate === tpl.id && (
                          <span className="absolute top-2.5 right-2.5 bg-blue-600 text-white rounded-full p-0.5 z-10 shadow-sm">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                        
                        <div className="p-4 flex flex-col flex-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Template {idx + 1}</span>
                          <span className="text-sm font-black text-slate-100 mt-1">{tpl.name}</span>
                          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed flex-1">{tpl.desc}</p>
                          
                          {/* Theme color hint circle */}
                          <div className="mt-3.5 flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            <span className="w-3. h-3. rounded-full border border-slate-800" style={{ backgroundColor: tpl.defaultColor }} />
                            Apply Palette
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Logo</label>
                  <input 
                    type="file" 
                    ref={logoInputRef}
                    onChange={handleLogoFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {formData.logo ? (
                    <div className="relative border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-950/20">
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center p-2">
                        <img 
                          src={formData.logo} 
                          alt="Store Logo Preview" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, logo: null }))}
                        className="mt-3 text-xs text-red-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Remove Logo
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => logoInputRef.current?.click()}
                      className="border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-4">
                        {logoUploading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                        )}
                      </div>
                      <p className="text-sm font-medium mb-1 text-slate-355">
                        {logoUploading ? 'Uploading...' : 'Click to upload logo'}
                      </p>
                      <p className="text-xs text-slate-500">PNG, JPG up to 2MB. Square recommended.</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-350">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="w-10 h-10 rounded-xl border border-slate-800 cursor-pointer p-0 bg-transparent" 
                    />
                    <input 
                      type="text" 
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="flex-1 h-10 px-3.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:border-blue-500 outline-none uppercase" 
                    />
                  </div>
                  
                  {/* Preset Quick Previews */}
                  <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-slate-950/20">
                    <p className="text-xs font-semibold uppercase text-slate-500 mb-2.5 tracking-wider">Store Button Preview</p>
                    <button 
                      type="button"
                      className="w-full py-2.5 px-4 font-medium transition-all uppercase text-[10px] font-black tracking-widest"
                      style={{ 
                        backgroundColor: formData.primaryColor,
                        color: selectedTemplate === 'luxe' || selectedTemplate === 'retro' ? '#000000' : '#FFFFFF',
                        borderRadius: selectedTemplate === 'minimal' || selectedTemplate === 'retro' ? '0px' : selectedTemplate === 'luxe' ? '2px' : selectedTemplate === 'artisan' ? '9999px' : selectedTemplate === 'admire' ? '16px' : '8px',
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
                              ? 'GO RETRO'
                              : selectedTemplate === 'admire'
                                ? 'Shop Organic Essence'
                                : 'ADD TO CART'
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(() => {
                  const defaultPlans = [
                    { id: '30', name: '1 Month Plan', price: `₹${globalSettings?.plan30Price || '499'}`, desc: 'Best for trial storefronts' },
                    { id: '365', name: '1 Year Plan', price: `₹${Number(globalSettings?.plan365Price || 3999).toLocaleString()}`, desc: 'Most popular for small shops' },
                    { id: 'lifetime', name: 'Lifetime Plan', price: `₹${Number(globalSettings?.planLifetimePrice || 9999).toLocaleString()}`, desc: 'Ultimate professional pack' }
                  ].filter(plan => !(globalSettings?.disabledDefaultPackages || []).includes(plan.id));
                  
                  const customPlans = (globalSettings?.customPackages || []).map((pkg: any) => ({
                    id: pkg.id,
                    name: pkg.name,
                    price: `₹${Number(pkg.price || 0).toLocaleString()}`,
                    desc: `Custom Package • ${pkg.days} Days Access`
                  }));

                  return [...defaultPlans, ...customPlans].map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id as any)}
                      className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all relative ${
                        selectedPlan === plan.id
                          ? 'border-blue-500 bg-blue-500/10 shadow-md scale-[1.01]'
                          : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/40 hover:scale-[1.005]'
                      }`}
                    >
                      {selectedPlan === plan.id && (
                        <span className="absolute top-2.5 right-2.5 bg-blue-600 text-white rounded-full p-0.5 animate-in zoom-in">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span className="text-xs text-slate-400 uppercase font-black tracking-wider">{plan.name}</span>
                      <span className="text-2xl font-black text-white mt-1.5 font-mono">{plan.price}</span>
                      <span className="text-[10px] text-slate-400 mt-2 leading-relaxed">{plan.desc}</span>
                    </button>
                  ));
                })()}
              </div>

              {/* Inquiry Message Box */}
              <div className="bg-blue-950/20 border border-blue-900/40 text-blue-300 rounded-xl p-4 flex gap-3 text-xs leading-relaxed">
                <Phone className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                <div>
                  <strong className="block mb-0.5">Off-Platform Verification & Payment</strong>
                  After registering, our sales team will contact you directly via call or WhatsApp at <strong className="font-mono text-blue-400">{formData.phone || 'your phone number'}</strong> to activate your plan. No automatic credit card charges!
                </div>
              </div>

              {/* Legal Merchant Agreement Content */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                    Creva merchant licensing agreement
                  </label>
                  
                  {/* Language Selector Dropdown/Tabs */}
                  <div className="flex gap-1 p-0.5 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
                    {[
                      { code: 'en', label: 'EN' },
                      { code: 'ta', label: 'TA' },
                      { code: 'hi', label: 'HI' },
                      { code: 'te', label: 'TE' },
                      { code: 'ml', label: 'ML' },
                      { code: 'kn', label: 'KN' }
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setSelectedAgreementLang(lang.code)}
                        className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${
                          selectedAgreementLang === lang.code
                            ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-sm'
                            : 'text-slate-400 hover:text-slate-205'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-44 bg-slate-950/40 border border-slate-850 rounded-xl p-4 overflow-y-auto text-xs space-y-3 font-mono leading-relaxed text-slate-400 text-justify shadow-inner">
                  {(agreementTemplates[selectedAgreementLang] || defaultTemplates[selectedAgreementLang] || '')
                    .split('\n')
                    .filter((line: string) => line.trim())
                    .map((para: string, i: number) => (
                      <p key={i}>{para.trim()}</p>
                    ))
                  }
                </div>
              </div>

              {/* Signature Canvas Drawing Area */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                    Draw your digital signature here *
                  </label>
                  {signature && (
                    <button
                      type="button"
                      onClick={handlePrintContract}
                      className="text-[10px] font-bold text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print / Download signed copy
                    </button>
                  )}
                </div>

                <div className="relative border border-slate-800 rounded-xl overflow-hidden shadow-sm">
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
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-lg text-slate-355 transition-colors shadow-sm"
                    >
                      Clear Pad
                    </button>
                    <button
                      type="button"
                      onClick={confirmSig}
                      className={`${
                        isSignatureConfirmed 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
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
                <p className="text-[10px] text-slate-400 text-center">
                  Use your finger (on mobile) or mouse drag to sign in the box above, then click <strong>Confirm & Lock Signature</strong>.
                </p>
              </div>

              {/* Dynamic Payment Verification Section (Reveals only after Signature Locked) */}
              <AnimatePresence>
                {isSignatureConfirmed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-slate-800 pt-6 mt-6 space-y-6 overflow-hidden"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-bounce" />
                        Onboarding Fee & License Payment
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Please pay the onboarding setup fee below to instantly register your business in paused state. Our admin team will verify it.
                      </p>
                    </div>

                    {/* Cost summary card */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Plan Selected</span>
                        <span className="block text-sm font-bold text-slate-200 mt-0.5">
                          {(() => {
                            if (selectedPlan === '30') return '1 Month Plan';
                            if (selectedPlan === '365') return '1 Year Plan';
                            if (selectedPlan === 'lifetime') return 'Lifetime Plan';
                            const customPkg = (globalSettings?.customPackages || []).find((pkg: any) => pkg.id === selectedPlan);
                            return customPkg ? customPkg.name : 'SaaS Plan';
                          })()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Setup Price</span>
                        <span className="block text-xl font-black text-blue-500 mt-0.5 font-mono">
                          ₹{Number(getSelectedPlanAmount()).toLocaleString()}
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
                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                            : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:bg-slate-800/30'
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
                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                            : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:bg-slate-800/30'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        Pay via UPI Apps
                      </button>
                    </div>

                    {/* QR Code Scan Area */}
                    {paymentMethod === 'qr' && (
                      <div className="p-6 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-sm">
                        <div className="flex flex-col items-center gap-3 shrink-0">
                          {(() => {
                            const upiId = globalSettings?.platformUpi || 'creva@ybl';
                            const planAmount = getSelectedPlanAmount();
                            const merchantName = globalSettings?.brandName || 'StoreBuilder';
                            const upiIntent = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${planAmount}&cu=INR`;
                            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiIntent)}&margin=10`;

                            return (
                              <div className="bg-white p-3 rounded-xl border border-slate-800 shadow-inner relative group shrink-0">
                                <img 
                                  src={qrUrl} 
                                  alt="Real UPI Payment QR Code" 
                                  className="w-[150px] h-[150px] object-contain block transition-transform group-hover:scale-105 duration-300"
                                />
                                <div className="absolute inset-0 bg-black/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-[10px] text-slate-900 select-none">
                                  SCAN TO PAY
                                </div>
                              </div>
                            );
                          })()}
                          <div className="text-center space-y-1">
                            <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest block">Merchant VPA UPI ID</span>
                            <span className="inline-block text-[11px] font-black font-mono bg-slate-950 text-slate-200 border border-slate-800 px-3 py-1 rounded-xl shadow-sm select-all">
                              {globalSettings?.platformUpi || 'creva@ybl'}
                            </span>
                          </div>
                        </div>
 
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-200 block text-left">How to pay via QR Code:</span>
                          <ol className="text-xs text-slate-450 list-decimal pl-4 space-y-1.5 leading-relaxed text-left">
                            <li>Open Google Pay, PhonePe, Paytm, or any banking App on your mobile.</li>
                            <li>Scan the QR code displayed on the left or send to VPA ID: <strong className="text-blue-400 font-mono select-all bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800">{globalSettings?.platformUpi || 'creva@ybl'}</strong></li>
                            <li>Pay the designated plan amount (<strong className="text-blue-400 font-mono">₹{Number(getSelectedPlanAmount()).toLocaleString()}</strong>).</li>
                            <li>Take a clear screenshot of the transaction success page.</li>
                            <li>Upload the screenshot in the dropzone below to proceed.</li>
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* UPI App Selection Area */}
                    {paymentMethod === 'app' && (
                      <div className="space-y-4 w-full">
                        <div className="bg-amber-500/5 border border-amber-500/10 text-amber-350 rounded-2xl p-4 text-xs text-left leading-relaxed space-y-2">
                          <p className="flex items-start gap-1.5">
                            <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span>
                              <strong>Mobile UPI App Tip:</strong> If your app shows a <em>"Bank limit exceeded"</em> or a Google Pay security warning like <em>"This payment cannot be verified as safe" / "Unverified Merchant"</em>, do not worry! This is a standard Google/NPCI security warning for direct browser links when paying a new or personal UPI account.
                            </span>
                          </p>
                          <p className="flex items-start gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span>
                              <strong>Simple Fix:</strong> Click on the UPI ID below to copy it: <strong className="font-mono bg-slate-950/60 px-1.5 py-0.5 rounded select-all text-amber-200 border border-slate-800/80 cursor-pointer inline-flex items-center gap-1 hover:text-amber-100" title="Click to copy" onClick={() => { navigator.clipboard.writeText(globalSettings?.platformUpi || 'creva@ybl'); alert('Copied VPA ID: ' + (globalSettings?.platformUpi || 'creva@ybl')); }}>{globalSettings?.platformUpi || 'creva@ybl'} <Clipboard className="w-3 h-3 text-amber-400" /></strong>. Then open your GPay, PhonePe, or Paytm app directly and pay manually by pasting this UPI ID!
                            </span>
                          </p>
                        </div>
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
                            className={`flex items-center gap-3.5 p-4 rounded-2xl border border-slate-800 bg-slate-900/40 text-left text-xs font-bold transition-all hover:scale-102 hover:shadow-md ${app.color}`}
                          >
                            <div className="shrink-0">{app.icon}</div>
                            <div>
                              <span className="block font-bold text-slate-200 text-[13px]">{app.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Pay directly via instant deep link</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                    {/* Screenshot Upload Dropzone */}
                    <div className="space-y-2.5">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">
                        Upload Successful Payment Screenshot *
                      </label>

                      {!paymentScreenshot ? (
                        <div className="relative border-2 border-dashed border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-900/40 transition-colors animate-fade-in">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={screenshotUploading}
                          />
                          {screenshotUploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                              <p className="text-sm font-semibold text-slate-300">Uploading to secure storage...</p>
                            </div>
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-3">
                                <Upload className="w-6 h-6" />
                              </div>
                              <p className="text-xs font-medium text-slate-200 mb-0.5">Click or drag payment screenshot to upload</p>
                              <p className="text-[10px] text-slate-400">PNG, JPG, JPEG up to 5MB</p>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-800 bg-slate-950/60 shrink-0 shadow-inner">
                              <img
                                src={paymentScreenshot}
                                alt="Payment Screenshot"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="block text-xs font-bold text-slate-200 truncate">Screenshot Attached</span>
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
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
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
                <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">Create your account</h2>
                <p className="text-slate-400 text-xs mt-1">Last step! Set up your login for the admin panel.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input 
                    type="email"
                    name="authEmail"
                    value={formData.authEmail}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                  <input 
                    type="password"
                    name="authPassword"
                    value={formData.authPassword}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 text-red-400 text-xs rounded-xl border border-red-500/20 animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between">
        <button
          onClick={prevStep}
          disabled={step === 1 || loading}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 px-5 text-sm font-bold text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          Back
        </button>
        {step < 6 ? (
          <button
            onClick={nextStep}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-500/10 hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-sm font-black text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Store...
              </>
            ) : (
              <>
                Create My Store
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
