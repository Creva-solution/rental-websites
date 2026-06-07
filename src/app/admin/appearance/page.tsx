'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, Upload, Palette, Layers, Plus, Trash, Image as ImageIcon, SlidersHorizontal, Check, X, Move } from 'lucide-react';

export default function AppearancePage() {
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    store_name: '',
    primary_color: '#3B82F6',
  });

  const [selectedTemplate, setSelectedTemplate] = useState<'minimal' | 'artisan' | 'bold' | 'luxe' | 'retro' | 'admire'>('minimal');

  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [collectionTitle, setCollectionTitle] = useState('');
  const [banners, setBanners] = useState<any[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [flashAd, setFlashAd] = useState({
    enabled: false,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&q=80&w=1200',
    title: 'Limited Flash Deals',
    subtitle: 'Get up to 60% off on all premium handcrafted items. Order now!',
    cta: 'Claim Offer',
    link: '#catalog'
  });

  const [benefits, setBenefits] = useState({
    enabled: true,
    items: [
      {
        icon: 'Truck',
        title: 'Free Global Shipping',
        subtitle: 'Complimentary shipping on orders over ₹500'
      },
      {
        icon: 'Shield',
        title: 'End-to-End Secure',
        subtitle: 'Shop safely and checkout via encrypted WhatsApp'
      },
      {
        icon: 'RefreshCw',
        title: 'Hassle-Free Returns',
        subtitle: 'Complimentary 30-day return policy for peace of mind'
      }
    ]
  });

  // Drag and Crop Modal State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropType, setCropType] = useState<'logo' | 'banner' | 'flashAd'>('logo');
  const [cropBannerIndex, setCropBannerIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [cropImageObj, setCropImageObj] = useState<HTMLImageElement | null>(null);

  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchStore();
  }, []);

  // Real-time Crop Canvas Rendering
  useEffect(() => {
    if (!cropImageObj) return;
    
    const canvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const cropWidth = cropType === 'logo' ? 300 : 450;
    const cropHeight = cropType === 'logo' ? 300 : 188; // Square (1:1) vs Banner (2.4:1)
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    
    // Fill transparent regions with pure, clean white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, cropWidth, cropHeight);
    
    // Object-fit cover scaling
    const scaleX = cropWidth / cropImageObj.width;
    const scaleY = cropHeight / cropImageObj.height;
    const coverScale = Math.max(scaleX, scaleY);
    
    // final scale zoom (can zoom out down to 0.1x to fit small logos!)
    const finalScale = coverScale * zoom;
    
    const drawWidth = cropImageObj.width * finalScale;
    const drawHeight = cropImageObj.height * finalScale;
    
    // Center translation + drag panning offset
    const startX = (cropWidth - drawWidth) / 2 + offsetX;
    const startY = (cropHeight - drawHeight) / 2 + offsetY;
    
    ctx.drawImage(cropImageObj, startX, startY, drawWidth, drawHeight);
    
    // Draw guide outline overlay
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, cropWidth, cropHeight);
  }, [cropImageObj, zoom, offsetX, offsetY, cropType, cropModalOpen]);

  const fetchStore = async () => {
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
      setFormData({
        store_name: storeData.store_name || '',
        primary_color: storeData.primary_color || '#3B82F6',
      });
      setLogoUrl(storeData.logo_url || '');

      // Parse metadata from description column
      let descText = storeData.description || '';
      let bannerList = [];
      let announcementMsg = '';
      let parsedFlashAd = {
        enabled: false,
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&q=80&w=1200',
        title: 'Limited Flash Deals',
        subtitle: 'Get up to 60% off on all premium handcrafted items. Order now!',
        cta: 'Claim Offer',
        link: '#catalog'
      };
      let parsedBenefits = {
        enabled: true,
        items: [
          {
            icon: 'Truck',
            title: 'Free Global Shipping',
            subtitle: 'Complimentary shipping on orders over ₹500'
          },
          {
            icon: 'Shield',
            title: 'End-to-End Secure',
            subtitle: 'Shop safely and checkout via encrypted WhatsApp'
          },
          {
            icon: 'RefreshCw',
            title: 'Hassle-Free Returns',
            subtitle: 'Complimentary 30-day return policy for peace of mind'
          }
        ]
      };
      let tplVal = 'minimal';

      try {
        if (storeData.description && storeData.description.startsWith('{')) {
          const data = JSON.parse(storeData.description);
          descText = data.description || '';
          bannerList = data.banners || [];
          announcementMsg = data.announcement || '';
          if (data.flashAd) {
            parsedFlashAd = { ...parsedFlashAd, ...data.flashAd };
          }
          if (data.selectedTemplate) {
            tplVal = data.selectedTemplate;
          } else if (data.template) {
            tplVal = data.template;
          }
          if (data.benefits) {
            parsedBenefits = {
              enabled: data.benefits.enabled !== false,
              items: data.benefits.items || parsedBenefits.items
            };
          }
          if (data.collectionTitle !== undefined) {
            setCollectionTitle(data.collectionTitle);
          }
        }
      } catch (e) {
        console.error("Failed to parse store metadata description:", e);
      }
      setDescription(descText);
      if (!bannerList || bannerList.length === 0) {
        setBanners([
          {
            id: 1,
            image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1920',
            title: 'The New Era of Apparel',
            subtitle: 'Refined utilitarianism designed for modern metropolitan life. Experience premium style accents.',
            cta: 'SHOP COLLECTION',
            link: '#catalog'
          },
          {
            id: 2,
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1920',
            title: 'Exquisite Summer Collection',
            subtitle: 'Indulge in our limited-edition handcrafted series. Up to 40% off online deals.',
            cta: 'EXPLORE ALL',
            link: '#catalog'
          }
        ]);
      } else {
        setBanners(bannerList);
      }
      setAnnouncement(announcementMsg);
      setFlashAd(parsedFlashAd);
      setBenefits(parsedBenefits);
      setSelectedTemplate(tplVal as any);
    }
    setLoading(false);
  };

  // Drag Handlers for Canvas (Mouse Events)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offsetX,
      y: e.clientY - offsetY
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // Drag Handlers for Canvas (Touch Events for Mobile)
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - offsetX,
      y: e.touches[0].clientY - offsetY
    });
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffsetX(e.touches[0].clientX - dragStart.x);
    setOffsetY(e.touches[0].clientY - dragStart.y);
  };

  const handleCanvasTouchEnd = () => {
    setIsDragging(false);
  };

  // Trigger Visual Drag & Crop Modal for Logo & Banners
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner' | 'flashAd', bannerIndex: number | null = null) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        setCropImageObj(img);
        setCropType(type);
        setCropBannerIndex(bannerIndex);
        setZoom(1.0);
        setOffsetX(0);
        setOffsetY(0);
        setCropModalOpen(true);
      };
    };
  };

  const applyCrop = () => {
    if (!cropImageObj) return;

    const canvas = document.createElement('canvas');
    const cropWidth = cropType === 'logo' ? 400 : 1200;
    const cropHeight = cropType === 'logo' ? 400 : 500;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with pure white solid background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, cropWidth, cropHeight);

    // Dynamic resolution scaling logic
    const scaleMultiplier = cropType === 'logo' ? (400 / 300) : (1200 / 450);

    const scaleX = cropWidth / cropImageObj.width;
    const scaleY = cropHeight / cropImageObj.height;
    const coverScale = Math.max(scaleX, scaleY);

    const finalScale = coverScale * zoom;

    const drawWidth = cropImageObj.width * finalScale;
    const drawHeight = cropImageObj.height * finalScale;

    const startX = (cropWidth - drawWidth) / 2 + (offsetX * scaleMultiplier);
    const startY = (cropHeight - drawHeight) / 2 + (offsetY * scaleMultiplier);

    ctx.drawImage(cropImageObj, startX, startY, drawWidth, drawHeight);

    // Save as ultra-compressed WebP format
    const finalWebP = canvas.toDataURL('image/webp', cropType === 'logo' ? 0.9 : 0.75);

    if (cropType === 'logo') {
      setLogoUrl(finalWebP);
    } else if (cropType === 'banner' && cropBannerIndex !== null) {
      const newB = [...banners];
      newB[cropBannerIndex].image = finalWebP;
      setBanners(newB);
    } else if (cropType === 'flashAd') {
      setFlashAd(prev => ({ ...prev, image: finalWebP }));
    }

    // Reset and close
    setCropModalOpen(false);
    setCropImageObj(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    // Merge with existing store.description so other admin pages' settings are preserved
    let existingData: Record<string, any> = {};
    try {
      if (store.description && store.description.startsWith('{')) {
        existingData = JSON.parse(store.description);
      }
    } catch (e) {}

    const compiledDescription = JSON.stringify({
      ...existingData,
      description: description,
      banners: banners,
      announcement: announcement,
      flashAd: flashAd,
      selectedTemplate: selectedTemplate,
      benefits: benefits,
      collectionTitle: collectionTitle.trim(),
    });

    try {
      const { error } = await supabase
        .from('stores')
        .update({
          primary_color: formData.primary_color,
          description: compiledDescription,
          logo_url: logoUrl
        })
        .eq('id', store.id);

      if (error) throw error;
      
      setMessage('Appearance settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      setMessage('Error saving appearance: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Appearance Settings</h2>
        <p className="text-muted-foreground">Customize how your storefront looks to your customers.</p>
      </div>

      {/* Brand Branding Section */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2"><Palette className="w-5 h-5 text-primary" /> Branding</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Logo Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Store Logo</label>
              <div className="flex flex-col items-start gap-4">
                {logoUrl ? (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border border-border bg-white shadow-sm flex items-center justify-center">
                    <img src={logoUrl} alt="Store Logo" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div 
                    className="w-24 h-24 rounded-2xl flex items-center justify-center border-2 border-dashed border-border"
                    style={{ backgroundColor: `${formData.primary_color}15`, color: formData.primary_color }}
                  >
                    <span className="font-bold text-3xl">{formData.store_name?.[0]?.toUpperCase() || 'S'}</span>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="px-4 py-2 text-sm border border-input rounded-md font-medium hover:bg-muted transition-colors flex items-center gap-2 bg-background cursor-pointer w-fit shadow-sm">
                    <Upload className="w-4 h-4" /> Upload Logo
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'logo')}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">Includes Drag-to-Reposition & Zoom Out.</p>
                </div>
              </div>
            </div>

            {/* Color Section */}
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">Primary Theme Color</label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input 
                      type="color" 
                      value={formData.primary_color} 
                      onChange={e => setFormData({...formData, primary_color: e.target.value})}
                      className="w-12 h-12 p-1 rounded-md border border-input bg-background cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded border border-border uppercase block w-fit">
                      {formData.primary_color}
                    </span>
                    <p className="text-xs text-muted-foreground">Used for buttons, links, and accents.</p>
                  </div>
                </div>
              </div>

              {/* Preview Box */}
              <div className="mt-6 p-4 rounded-xl border border-border bg-background">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wider">Preview</p>
                <div className="space-y-3">
                  <button 
                    className="w-full py-2 px-4 rounded-md text-white font-medium shadow-sm transition-opacity hover:opacity-90"
                    style={{ backgroundColor: formData.primary_color }}
                  >
                    Primary Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Storefront Template Design Selection Card */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" /> Storefront Layout Template
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Select one of our five hand-crafted visual systems to instantly change the structure, colors, and layout of your customer storefront.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { 
              id: 'minimal', 
              name: 'Minimal Elegance', 
              desc: 'Clean black & white aesthetics, spacious layouts, razor sharp details, modern thin typography. Ideal for high-end boutique stores.',
              previewColor: '#000000',
              label: 'Template 1'
            },
            { 
              id: 'artisan', 
              name: 'Artisan Craft', 
              desc: 'Soft warm tone palettes, rounded accents, elegant vintage serif headings. Adds an authentic handcrafted warmth to your catalog.',
              previewColor: '#8B5A2B',
              label: 'Template 2'
            },
            { 
              id: 'bold', 
              name: 'Bold Commerce', 
              desc: 'High-contrast vibrant designs, thick bold solid borders, heavy flat shadows, eye-catching action labels. Demands attention.',
              previewColor: '#E11D48',
              label: 'Template 3'
            },
            { 
              id: 'luxe', 
              name: 'Dark Luxe', 
              desc: 'Premium dark mode system. Pitch black gold backgrounds, gold accents, luxurious Playfair serif headers. High-end luxury products.',
              previewColor: '#D4AF37',
              label: 'Template 4'
            },
            { 
              id: 'retro', 
              name: 'Retro Grid', 
              desc: 'Space-grotesk flat shadow neon creative system. Bold grids, light pastel lavender colors, pop art elements, chunky buttons.',
              previewColor: '#8B5CF6',
              label: 'Template 5'
            },
            { 
              id: 'admire', 
              name: 'Admire Organic Essence', 
              desc: 'Branded warm orange (#f2852a) and deep navy (#04113f) contrast. Soap-bar rounded contours, warm cream backgrounds, and premium aesthetics.',
              previewColor: '#f2852a',
              label: 'Template 6'
            }
          ].map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => {
                setSelectedTemplate(tpl.id as any);
                setFormData(prev => ({ ...prev, primary_color: tpl.previewColor }));
              }}
              className={`flex flex-col text-left p-5 rounded-xl border-2 transition-all relative ${
                selectedTemplate === tpl.id
                  ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                  : 'border-border bg-card hover:bg-muted/50 hover:scale-[1.01]'
              }`}
            >
              {selectedTemplate === tpl.id && (
                <span className="absolute top-3.5 right-3.5 bg-primary text-primary-foreground rounded-full p-0.5">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">{tpl.label}</span>
              <span className="text-base font-black text-foreground mt-1.5">{tpl.name}</span>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed flex-1">{tpl.desc}</p>
              
              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <span className="w-3.5 h-3.5 rounded-full border border-border" style={{ backgroundColor: tpl.previewColor }} />
                Apply Palette
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Collection Section Title */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" /> Product Collection Title
        </h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Collection Section Heading</label>
          <input
            type="text"
            value={collectionTitle}
            onChange={e => setCollectionTitle(e.target.value)}
            className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:ring-1 focus:ring-primary outline-none"
            placeholder="e.g. Featured Products, Best Sellers, Our Collection, Trending Now"
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground">
            This title appears above your product catalog on the storefront. Leave blank to use the template default (e.g. "Featured Products").
          </p>
        </div>
      </div>

      {/* Announcement Bar Settings Section */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" /> Announcement Bar Settings
        </h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Announcement Bar Text</label>
          <input
            type="text"
            value={announcement}
            onChange={e => setAnnouncement(e.target.value)}
            className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm focus:ring-1 focus:ring-primary outline-none"
            placeholder="e.g. EXCLUSIVE SPRING SALE: FREE SHIPPING ON ALL ORDERS OVER ₹500"
          />
          <p className="text-xs text-muted-foreground">This message is displayed at the very top of your store storefront announcement bar.</p>
        </div>
      </div>

      {/* Banner slideshow Settings */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" /> Homepage Banner Slideshow
          </h3>
          <button 
            onClick={() => {
              if (banners.length >= 5) {
                alert("Maximum 5 banners allowed.");
                return;
              }
              setBanners([...banners, {
                id: Date.now(),
                image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1920',
                title: 'New Slideshow Title',
                subtitle: 'Describe this collection in 1 sentence.',
                cta: 'Shop Now'
              }]);
            }}
            className="text-xs font-bold uppercase tracking-wider px-3.5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 rounded shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Slide
          </button>
        </div>

        {banners.length === 0 ? (
          <div className="text-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/20">
            <p className="text-sm text-muted-foreground">No custom banners configured. Storefront will use default slideshow templates.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {banners.map((banner, index) => (
              <div key={banner.id || index} className="p-5 border border-border rounded-xl bg-muted/10 space-y-4 relative shadow-sm">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Slide #{index + 1}</span>
                  <button 
                    onClick={() => setBanners(banners.filter((_, i) => i !== index))}
                    className="p-1 hover:text-red-500 hover:bg-red-50 rounded transition-colors text-muted-foreground"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                        <span>Banner Image</span>
                        <span className="text-[10px] text-primary capitalize font-bold">Auto WebP Compression Active</span>
                      </label>
                      <div className="flex gap-2 mt-1">
                        <input 
                          type="text" 
                          value={banner.image}
                          onChange={(e) => {
                            const newB = [...banners];
                            newB[index].image = e.target.value;
                            setBanners(newB);
                          }}
                          className="flex-1 h-10 px-3 rounded border border-input bg-background text-sm"
                          placeholder="Paste image link or upload"
                        />
                        <label className="h-10 px-3 border border-input rounded flex items-center justify-center bg-background hover:bg-muted cursor-pointer transition-colors text-xs font-semibold gap-1 flex-shrink-0 shadow-sm">
                          <Upload className="w-3.5 h-3.5" /> Upload File
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleFileChange(e, 'banner', index)}
                          />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</label>
                      <input 
                        type="text" 
                        value={banner.title}
                        onChange={(e) => {
                          const newB = [...banners];
                          newB[index].title = e.target.value;
                          setBanners(newB);
                        }}
                        className="w-full h-10 px-3 mt-1 rounded border border-input bg-background text-sm font-semibold"
                        placeholder="e.g. Festival Season Sale"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subtitle Description</label>
                      <input 
                        type="text" 
                        value={banner.subtitle}
                        onChange={(e) => {
                          const newB = [...banners];
                          newB[index].subtitle = e.target.value;
                          setBanners(newB);
                        }}
                        className="w-full h-10 px-3 mt-1 rounded border border-input bg-background text-sm"
                        placeholder="e.g. Get up to 50% discount"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CTA Button Label</label>
                      <input 
                        type="text" 
                        value={banner.cta}
                        onChange={(e) => {
                          const newB = [...banners];
                          newB[index].cta = e.target.value;
                          setBanners(newB);
                        }}
                        className="w-full h-10 px-3 mt-1 rounded border border-input bg-background text-sm"
                        placeholder="e.g. Shop Now"
                      />
                    </div>
                  </div>
                </div>

                {/* Banner Image Preview */}
                {banner.image && (
                  <div className="h-24 w-full rounded-lg overflow-hidden border border-border relative bg-muted mt-2 shadow-inner">
                    <img src={banner.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1920';
                    }} />
                    <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-3 text-white">
                      <h4 className="font-bold text-sm truncate">{banner.title}</h4>
                      <p className="text-xs opacity-85 truncate">{banner.subtitle}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Presets for Store Owners */}
        <div className="border-t border-border pt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Beautiful Banner Presets</label>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => {
                setBanners([
                  {
                    id: 1,
                    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1920',
                    title: 'Fresh & Healthy Organic Food',
                    subtitle: 'Premium quality items delivered right to your doorstep.',
                    cta: 'Order Now'
                  },
                  {
                    id: 2,
                    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1920',
                    title: 'Eco-Friendly Dinnerware Collection',
                    subtitle: 'Discover our biodegradable Areca leaf plates & bowls.',
                    cta: 'Explore Products'
                  }
                ]);
              }}
              className="text-xs px-3 py-1.5 border border-border rounded hover:bg-muted font-medium transition-colors bg-background shadow-sm"
            >
              Organic Plates & Food Presets
            </button>
            <button 
              onClick={() => {
                setBanners([
                  {
                    id: 1,
                    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1920',
                    title: 'New Fashion Trends Are Here',
                    subtitle: 'Style redefined with modern aesthetics. 30% Off.',
                    cta: 'Shop Clothes'
                  },
                  {
                    id: 2,
                    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1920',
                    title: 'Luxury Styles & Collections',
                    subtitle: 'Made from high-quality premium fabrics.',
                    cta: 'View Trends'
                  }
                ]);
              }}
              className="text-xs px-3 py-1.5 border border-border rounded hover:bg-muted font-medium transition-colors bg-background shadow-sm"
            >
              Premium Fashion Presets
            </button>
            <button 
              type="button"
              onClick={() => {
                setBanners([
                  {
                    id: 1,
                    image: 'https://images.unsplash.com/photo-1607006342411-91f11f6d021c?auto=format&fit=crop&q=80&w=1920',
                    title: 'Crafted by Hand, Perfected by Nature',
                    subtitle: 'Indulge in our exquisite collection of cold-processed artisan organic soap bars.',
                    cta: 'Browse Soaps'
                  },
                  {
                    id: 2,
                    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=1920',
                    title: 'Organic Essence for Radiant Skin',
                    subtitle: 'Enriched with high-grade pure essential oils and nourishing botanicals.',
                    cta: 'Shop Essentials'
                  }
                ]);
              }}
              className="text-xs px-3 py-1.5 border border-border rounded hover:bg-muted font-medium transition-colors bg-background shadow-sm"
            >
              Admire Handmade Soaps Presets
            </button>
          </div>
        </div>
      </div>

      {/* Trust Benefits Settings */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-primary" /> Store Trust Benefits Settings
            </h3>
            <p className="text-xs text-muted-foreground">Highlight custom service guarantees or benefits directly above your page footer.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={benefits.enabled}
              onChange={e => setBenefits(prev => ({ ...prev, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            <span className="ml-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{benefits.enabled ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>

        {benefits.enabled && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {benefits.items.map((item, index) => (
              <div key={index} className="p-5 border border-border rounded-xl bg-muted/10 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Benefit Item #{index + 1}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Select Icon</label>
                    <select
                      value={item.icon}
                      onChange={(e) => {
                        const newItems = [...benefits.items];
                        newItems[index].icon = e.target.value;
                        setBenefits(prev => ({ ...prev, items: newItems }));
                      }}
                      className="w-full h-10 px-3 mt-1.5 rounded border border-input bg-background text-sm cursor-pointer outline-none"
                    >
                      <option value="Truck">Shipping Truck</option>
                      <option value="Shield">Security Shield</option>
                      <option value="RefreshCw">Return Loop</option>
                      <option value="Heart">Heart / Love</option>
                      <option value="Star">Review Star</option>
                      <option value="Sparkles">Special Sparkles</option>
                      <option value="Package">Delivery Package</option>
                      <option value="ShoppingBag">Shopping Bag</option>
                      <option value="Clock">24/7 Clock</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Benefit Title</label>
                    <input 
                      type="text" 
                      value={item.title}
                      onChange={(e) => {
                        const newItems = [...benefits.items];
                        newItems[index].title = e.target.value;
                        setBenefits(prev => ({ ...prev, items: newItems }));
                      }}
                      className="w-full h-10 px-3 mt-1.5 rounded border border-input bg-background text-sm font-semibold outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g. Free Global Shipping"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Description Subtitle</label>
                    <input 
                      type="text" 
                      value={item.subtitle}
                      onChange={(e) => {
                        const newItems = [...benefits.items];
                        newItems[index].subtitle = e.target.value;
                        setBenefits(prev => ({ ...prev, items: newItems }));
                      }}
                      className="w-full h-10 px-3 mt-1.5 rounded border border-input bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g. Complimentary shipping over ₹500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flash Advertisement Settings */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-primary" /> Storefront Flash Advertisement
            </h3>
            <p className="text-xs text-muted-foreground">Highlight special sales or announcements with a high-fidelity visual promotion card.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={flashAd.enabled}
              onChange={e => setFlashAd(prev => ({ ...prev, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            <span className="ml-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{flashAd.enabled ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>

        {flashAd.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                  <span>Advertisement Banner Image</span>
                  <span className="text-[10px] text-primary capitalize font-bold">WebP Crop Active</span>
                </label>
                <div className="flex gap-2 mt-1">
                  <input 
                    type="text" 
                    value={flashAd.image}
                    onChange={e => setFlashAd(prev => ({ ...prev, image: e.target.value }))}
                    className="flex-1 h-10 px-3 rounded border border-input bg-background text-sm"
                    placeholder="Paste image link or upload"
                  />
                  <label className="h-10 px-3 border border-input rounded flex items-center justify-center bg-background hover:bg-muted cursor-pointer transition-colors text-xs font-semibold gap-1 flex-shrink-0 shadow-sm">
                    <Upload className="w-3.5 h-3.5" /> Upload File
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'flashAd')}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Advertisement Title</label>
                <input 
                  type="text" 
                  value={flashAd.title}
                  onChange={e => setFlashAd(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full h-10 px-3 mt-1 rounded border border-input bg-background text-sm font-semibold"
                  placeholder="e.g. Exclusive Weekend Flash Sale"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subtitle / Description</label>
                <textarea 
                  value={flashAd.subtitle}
                  onChange={e => setFlashAd(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full p-3 mt-1 rounded border border-input bg-background text-sm min-h-[80px]"
                  placeholder="e.g. Save 60% on all orders above ₹999. Use checkout code FLASH60."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CTA Label</label>
                  <input 
                    type="text" 
                    value={flashAd.cta}
                    onChange={e => setFlashAd(prev => ({ ...prev, cta: e.target.value }))}
                    className="w-full h-10 px-3 mt-1 rounded border border-input bg-background text-sm"
                    placeholder="e.g. Claim Offer"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CTA Action Link</label>
                  <input 
                    type="text" 
                    value={flashAd.link}
                    onChange={e => setFlashAd(prev => ({ ...prev, link: e.target.value }))}
                    className="w-full h-10 px-3 mt-1 rounded border border-input bg-background text-sm"
                    placeholder="e.g. #catalog or URL"
                  />
                </div>
              </div>
            </div>

            {/* Premium Live Visual Preview */}
            <div className="flex flex-col justify-center">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Live Storefront Preview</label>
              <div className="border border-border rounded-2xl overflow-hidden shadow-md bg-gray-950 text-white p-6 relative min-h-[220px] flex flex-col justify-between group">
                <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${flashAd.image})` }} />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/70 to-transparent" />
                <div className="relative z-10 space-y-4 max-w-[85%] my-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm">
                    🔥 Special Promotion
                  </span>
                  <h4 className="text-xl font-black uppercase font-luxury-sans tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200">
                    {flashAd.title || 'Limited Time Deals'}
                  </h4>
                  <p className="text-xs text-gray-400 font-light leading-relaxed line-clamp-3">
                    {flashAd.subtitle || 'Get premium hand-tailored pieces at exclusive discount pricing. Limited availability.'}
                  </p>
                  <button className="px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white text-gray-950 hover:bg-gray-100 transition-all transform hover:-translate-y-0.5 shadow-lg w-fit">
                    {flashAd.cta || 'Shop Offer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-muted/10 flex items-center justify-between border border-border rounded-xl bg-card shadow-sm">
        <div className="text-sm font-medium">
          {message && (
            <span className={message.includes('Error') ? 'text-red-500' : 'text-green-600 flex items-center gap-2'}>
              {message.includes('Error') ? null : <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
              {message}
            </span>
          )}
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Appearance Settings
        </button>
      </div>

      {/* Drag & Zoom Interactive Visual Crop Modal (For both Logo & Banners) */}
      {cropModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-sans select-none">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-primary" /> Crop & Adjust {cropType === 'logo' ? 'Logo' : 'Banner'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cropType === 'logo' ? 'Logo Shape: Square (1:1)' : 'Banner Shape: Landscape (2.4:1)'}
                </p>
              </div>
              <button 
                onClick={() => { setCropModalOpen(false); setCropImageObj(null); }}
                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Real-time Interactive Canvas Dragging */}
            <div className="p-6 bg-muted/30 flex flex-col items-center justify-center border-b border-border space-y-4">
              <p className="text-xs text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5" /> 💡 Drag directly on the image below to center/reposition
              </p>

              <div className="relative border-4 border-dashed border-border bg-black/10 overflow-hidden rounded-xl shadow-inner flex items-center justify-center p-2 min-h-[310px] w-full cursor-move">
                <canvas 
                  id="preview-canvas" 
                  className="max-w-full shadow-lg rounded select-none touch-none"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  onTouchStart={handleCanvasTouchStart}
                  onTouchMove={handleCanvasTouchMove}
                  onTouchEnd={handleCanvasTouchEnd}
                  style={{
                    aspectRatio: cropType === 'logo' ? '1/1' : '450/188',
                    width: cropType === 'logo' ? '260px' : '380px'
                  }}
                />
              </div>

              {/* Adjusting Zoom Slider (0.2x Zoom-Out allowed for fitting logos!) */}
              <div className="w-full space-y-4 px-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                    <span>ZOOM (Zoom-Out / Zoom-In)</span>
                    <span className="text-primary font-bold">{zoom.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.02"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0.2x (Zoomed Out)</span>
                    <span>1.0x (Default Fit)</span>
                    <span>3.0x (Zoomed In)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-muted/10 flex items-center justify-end gap-3">
              <button 
                onClick={() => { setCropModalOpen(false); setCropImageObj(null); }}
                className="px-4 py-2 border border-input text-sm rounded-md font-semibold bg-background hover:bg-muted transition-colors flex items-center gap-1.5"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button 
                onClick={applyCrop}
                className="px-5 py-2 bg-primary text-primary-foreground text-sm rounded-md font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-4 h-4" /> Apply Crop
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
