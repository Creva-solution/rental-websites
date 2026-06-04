'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, Brain, Copy, RotateCw, Check, Compass, MessageSquare, Megaphone, FileText, Loader2 } from 'lucide-react';

export default function AIContentStudioPage() {
  const [tone, setTone] = useState('premium');
  const [prompt, setPrompt] = useState('"Admire Handmade Organic Lavender Soaps", handmade, raw citrus extracts, highly moisturizing');
  const [activePreset, setActivePreset] = useState('Product Description');
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('custom');
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .neq('subdomain', '__creva_saas_global_settings__')
        .single();

      if (storeData) {
        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeData.id)
          .order('created_at', { ascending: false });

        if (prodData) {
          setProducts(prodData);
        }
      }
    } catch (err) {
      console.error('Failed to load products for AI Content Studio:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const getPromptForProduct = (product: any, preset: string) => {
    let descText = '';
    try {
      if (product.description && product.description.startsWith('{')) {
        const parsed = JSON.parse(product.description);
        descText = parsed.description || '';
        
        // Append category, sizes, and colors if they exist
        const extraFeatures = [];
        if (parsed.category) extraFeatures.push(`Category: ${parsed.category}`);
        if (parsed.sizes && parsed.sizes.length > 0) extraFeatures.push(`Sizes: ${parsed.sizes.join(', ')}`);
        if (parsed.colors && parsed.colors.length > 0) extraFeatures.push(`Colors: ${parsed.colors.join(', ')}`);
        
        if (extraFeatures.length > 0) {
          descText += `, ${extraFeatures.join(', ')}`;
        }
      } else {
        descText = product.description || '';
      }
    } catch (e) {
      descText = product.description || '';
    }
    
    return `Write a highly compelling ${preset.toLowerCase()} for "${product.name}" listing, ${descText}`;
  };

  const parsePrompt = (text: string) => {
    let name = '';
    let features: string[] = [];

    // Try to find text in quotes
    const quoteMatch = text.match(/["']([^"']+)["']/);
    if (quoteMatch) {
      name = quoteMatch[1];
    }

    // Clean the text to find product name / features
    let cleanText = text
      .replace(/write a (highly )?compelling (product description|whatsapp broadcast|social ad copy|seo meta tags) for/gi, '')
      .replace(/listing\.\.\./gi, '')
      .replace(/listing/gi, '')
      .trim();

    // If no quote match, try to get the first sentence or first few words before comma as name
    if (!name) {
      const commaIndex = cleanText.indexOf(',');
      const newlineIndex = cleanText.indexOf('\n');
      const splitIndex = Math.min(
        commaIndex > -1 ? commaIndex : Infinity,
        newlineIndex > -1 ? newlineIndex : Infinity
      );
      
      if (splitIndex !== Infinity) {
        name = cleanText.substring(0, splitIndex).trim();
        cleanText = cleanText.substring(splitIndex + 1).trim();
      } else {
        const words = cleanText.split(/\s+/);
        if (words.length > 4) {
          name = words.slice(0, 3).join(' ');
          cleanText = words.slice(3).join(' ');
        } else {
          name = cleanText;
          cleanText = '';
        }
      }
    }

    // Clean name
    name = name.replace(/^(a|an|the)\s+/gi, '').trim();
    // Capitalize name
    if (name) {
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    if (!name || name.toLowerCase().includes('write a')) {
      name = 'Premium Retail Item';
    }

    // Extract features
    if (cleanText) {
      features = cleanText
        .split(/[,\n.]+/)
        .map(f => f.trim())
        .filter(f => f.length > 2 && !f.toLowerCase().includes('write a') && !f.toLowerCase().includes('compelling'));
    }

    // Fallback/Default features if none are specified
    if (features.length === 0) {
      if (name.toLowerCase().includes('soap') || name.toLowerCase().includes('admire')) {
        features = [
          '100% organic cold-cured botanical formula',
          'Rich moisturizing lather from lavender & coconut oil extracts',
          'Naturally harvested with zero chemicals or parabens',
          'Fully eco-friendly, zero-waste packaging'
        ];
      } else {
        features = [
          'Premium hand-curated ingredients & design',
          'Meticulous quality control & craftsmanship',
          'Sustainably sourced & eco-friendly packaging',
          'Designed to elevate your everyday rituals'
        ];
      }
    }

    return { name, features };
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      const { name, features } = parsePrompt(prompt);
      let result = '';

      if (activePreset === 'Product Description') {
        if (tone === 'premium') {
          result = `**Experience pure sensory luxury with ${name}.**\n\nCrafted for those who appreciate the finer things in life, ${name} is curated using exceptional methods to deliver unmatched satisfaction.\n\n*Key Benefits:*\n${features.map(f => `• ${f}`).join('\n')}\n\nElevate your rituals today with an investment in timeless quality.`;
        } else if (tone === 'friendly') {
          result = `**Say hello to your new favorite: ${name}!**\n\nWe are so excited to introduce ${name}! Designed to bring a little extra joy and ease to your everyday routine, it is crafted with love and care.\n\n*Why you'll love it:*\n${features.map(f => `✨ ${f}`).join('\n')}\n\nGive it a try today and feel the difference!`;
        } else if (tone === 'persuasive') {
          result = `**Unlock the full benefits of ${name} starting today.**\n\nWhy settle for average? ${name} is specifically designed to solve your everyday challenges while offering premium results that last. Do not miss out on the upgrade you deserve.\n\n*Why it is a must-have:*\n${features.map(f => `🔥 ${f}`).join('\n')}\n\nJoin our community of happy customers and order yours now!`;
        } else {
          result = `**Meet ${name} — the upgrade your daily routine didn't know it needed.**\n\nWe won't say ${name} will solve all your life's problems, but it definitely makes this part look effortless. Smart, sleek, and exceptionally good at its job.\n\n*The cool stuff:*\n${features.map(f => `😎 ${f}`).join('\n')}\n\nGo on, treat yourself. We promise not to tell anyone.`;
        }
      } else if (activePreset === 'WhatsApp Broadcast') {
        if (tone === 'premium') {
          result = `✨ *EXCLUSIVE PREVIEW* ✨\n\nDiscover the art of refined quality with *${name}*.\n\nHand-curated with:\n${features.map(f => `▫️ ${f}`).join('\n')}\n\nExperience luxury retail. Tap the link below to view our curated collection and claim complimentary shipping today.\n\n👉 [Link to Store]`;
        } else if (tone === 'friendly') {
          result = `Hey there! 👋\n\nExciting news! Our highly requested *${name}* is officially available! 🎉\n\nHere's what makes it so special:\n${features.map(f => `✅ ${f}`).join('\n')}\n\nWe have very limited stock, so grab yours today! Let us know if you need any help.\n\n👉 [Link to Store]`;
        } else if (tone === 'persuasive') {
          result = `🚨 *ALERT: Upgrade Your Everyday* 🚨\n\nReady for a better experience? Meet *${name}*!\n\nHere is why it is a complete game-changer:\n${features.map(f => `⚡ ${f}`).join('\n')}\n\nGet an exclusive *10% OFF* if you order within the next 24 hours. Use code: *UPGRADE10* at checkout.\n\n👉 Tap here to shop now: [Link to Store]`;
        } else {
          result = `Spotted: The legendary *${name}* is finally here! 🔎\n\nWarning: Side effects of owning this include increased happiness and extreme satisfaction.\n\nWhy it's awesome:\n${features.map(f => `🎯 ${f}`).join('\n')}\n\nBe the cool friend. Tap below to buy yours now.\n\n👉 [Link to Store]`;
        }
      } else if (activePreset === 'Social Ad Copy') {
        if (tone === 'premium') {
          result = `Define your standard. ✨\n\nIntroducing the all-new ${name}. Engineered for the discerning individual, designed to inspire.\n\n✔️ ${features.join('\n✔️ ')}\n\nIndulge in timeless design and exceptional performance. Shop the official collection today.\n\n#LuxuryLiving #PremiumQuality #Craftsmanship #Design`;
        } else if (tone === 'friendly') {
          result = `Looking for something special? We got you! 🥰\n\nMeet the ${name} – your absolute new go-to. Whether you're upgrading or treating a loved one, this is guaranteed to put a smile on your face.\n\n💖 Featuring:\n${features.map(f => `• ${f}`).join('\n')}\n\nSwipe up or click the link in bio to shop the drop! 🛍️\n\n#MustHave #EverydayEssentials #ShopLocal #HappyVibes`;
        } else if (tone === 'persuasive') {
          result = `THE WAIT IS OVER. 🔥\n\nIf you've been waiting for the perfect moment to upgrade, this is it. ${name} is here to deliver high performance without compromises.\n\nWhat are you waiting for?\n🚀 ${features.join('\n🚀 ')}\n\n👉 Click "Shop Now" and claim yours before stock runs out!\n\n#UpgradeNow #BestInClass #SmartShopping #NoCompromises`;
        } else {
          result = `Yes, you need this. No, we're not biased (okay, maybe a little). 😉\n\nSay hello to ${name}. It's basically the superhero of your daily routine, minus the cape.\n\nWhy you'll love it:\n⚡ ${features.join('\n⚡ ')}\n\nHit that link and thank us later. 👇\n\n#Unboxing #CoolProducts #TreatYourself #ShoppingSpree`;
        }
      } else { // SEO Meta Tags
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (tone === 'premium') {
          result = `🔍 **SEO Meta Tags for ${name}**\n\n**Meta Title:**\n${name} | Premium & Handcrafted Luxury Online\n\n**Meta Description (155 chars):**\nShop ${name}. Featuring ${features.slice(0, 2).join(' & ')}. Indulge in premium quality and fast shipping today.\n\n**Focus Keywords:**\n${name.toLowerCase()}, ${features.map(f => f.toLowerCase()).slice(0, 3).join(', ')}, buy online\n\n**Suggested URL Slug:**\n/products/${slug}`;
        } else if (tone === 'friendly') {
          result = `🔍 **SEO Meta Tags for ${name}**\n\n**Meta Title:**\n${name} | Shop Friendly & Cozy Quality\n\n**Meta Description (152 chars):**\nDiscover the friendly design of ${name}. Enjoy ${features.slice(0, 2).join(' & ')} at great prices with fast home delivery.\n\n**Focus Keywords:**\n${name.toLowerCase()}, ${features.map(f => f.toLowerCase()).slice(0, 3).join(', ')}, retail store\n\n**Suggested URL Slug:**\n/products/${slug}`;
        } else if (tone === 'persuasive') {
          result = `🔍 **SEO Meta Tags for ${name}**\n\n**Meta Title:**\n${name} | Buy High-Performance & Quality Now\n\n**Meta Description (158 chars):**\nGet the best deals on ${name}! Engineered with ${features.slice(0, 2).join(' & ')}. Direct shipping & satisfaction guaranteed.\n\n**Focus Keywords:**\n${name.toLowerCase()}, ${features.map(f => f.toLowerCase()).slice(0, 3).join(', ')}, shop online\n\n**Suggested URL Slug:**\n/products/${slug}`;
        } else {
          result = `🔍 **SEO Meta Tags for ${name}**\n\n**Meta Title:**\n${name} | The Upgrade You Actually Need\n\n**Meta Description (154 chars):**\nMeet ${name}. Loaded with ${features.slice(0, 2).join(' & ')}. It won't solve all your problems, but it sure makes shopping fun.\n\n**Focus Keywords:**\n${name.toLowerCase()}, ${features.map(f => f.toLowerCase()).slice(0, 3).join(', ')}, coolest item\n\n**Suggested URL Slug:**\n/products/${slug}`;
        }
      }

      setGeneratedText(result);
      setGenerating(false);
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-border/45">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#3C77C3] bg-[#3C77C3]/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Creva Websz AI Studio
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-3">
            AI Content Generation Studio
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Write high-converting product descriptions, WhatsApp copy, and SEO meta tags in seconds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Preset Cards & prompt input */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#3C77C3]" /> What are you creating today?
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Product Description', icon: FileText, desc: 'For e-commerce items' },
                { label: 'WhatsApp Broadcast', icon: MessageSquare, desc: 'Engage client groups' },
                { label: 'Social Ad Copy', icon: Megaphone, desc: 'Boost CTR & Conversions' },
                { label: 'SEO Meta Tags', icon: Compass, desc: 'Optimize Google rankings' }
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActivePreset(p.label);
                    if (selectedProductId !== 'custom') {
                      const selectedProd = products.find(prod => prod.id === selectedProductId);
                      if (selectedProd) {
                        setPrompt(getPromptForProduct(selectedProd, p.label));
                      }
                    } else if (!prompt.trim() || prompt.includes('Lavender Soaps')) {
                      setPrompt(`Write a highly compelling ${p.label.toLowerCase()} for "Admire Handmade Organic Lavender Soaps" listing, handmade, raw citrus extracts, highly moisturizing`);
                    }
                  }}
                  className={`p-4 border rounded-xl text-left transition-all space-y-2 group ${
                    activePreset === p.label
                      ? 'border-[#3C77C3] bg-[#3C77C3]/5 ring-1 ring-[#3C77C3]/30'
                      : 'border-border hover:border-[#3C77C3]/40 hover:bg-[#3C77C3]/5'
                  }`}
                >
                  <p.icon className={`w-5 h-5 transition-colors ${activePreset === p.label ? 'text-[#3C77C3]' : 'text-muted-foreground group-hover:text-[#3C77C3]'}`} />
                  <p className="font-bold text-xs text-foreground mt-1">{p.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-normal">{p.desc}</p>
                </button>
              ))}
            </div>

            {/* Product Selector Dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">
                Select product from your inventory (Optional)
              </label>
              {loadingProducts ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground h-11 px-3 bg-muted/20 border rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-[#3C77C3]" />
                  Loading your products...
                </div>
              ) : (
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    const prodId = e.target.value;
                    setSelectedProductId(prodId);
                    if (prodId === 'custom') {
                      setPrompt('');
                    } else {
                      const selectedProd = products.find(p => p.id === prodId);
                      if (selectedProd) {
                        setPrompt(getPromptForProduct(selectedProd, activePreset));
                      }
                    }
                  }}
                  className="w-full bg-background border rounded-xl h-11 px-3 text-xs outline-none focus:border-[#3C77C3] focus:ring-1 focus:ring-[#3C77C3]"
                >
                  <option value="custom">Custom / Type Manually...</option>
                  {products.map(prod => (
                    <option key={prod.id} value={prod.id}>
                      📦 {prod.name} (Price: {prod.price})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Describe your product or promotion</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={4}
                className="w-full bg-background border rounded-xl p-4 text-sm outline-none focus:border-[#3C77C3] focus:ring-1 focus:ring-[#3C77C3] leading-relaxed"
                placeholder="e.g., Admire Organic Soap, handmade, raw citrus extracts, highly moisturizing, cold process..."
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Tone Selection */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tone:</span>
                <div className="flex flex-wrap gap-1">
                  {['premium', 'friendly', 'persuasive', 'witty'].map(t => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                        tone === t
                          ? 'bg-[#3C77C3] border-[#3C77C3] text-white shadow-sm'
                          : 'bg-background hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="bg-[#3C77C3] hover:bg-[#3C77C3]/90 text-white font-bold uppercase tracking-widest text-[10px] px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#3C77C3]/20 disabled:opacity-50 transition-all"
              >
                {generating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Craft Content
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* AI Output Card */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full space-y-6">
          <div className="space-y-4 text-left">
            <div className="border-b pb-3 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">AI Generation Results</span>
              {generatedText && (
                <button
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 text-[10px] uppercase font-bold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            {generatedText ? (
              <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-3 bg-muted/20 p-4 rounded-xl border border-dashed whitespace-pre-line shadow-inner max-h-[300px] overflow-y-auto">
                {generatedText}
              </div>
            ) : (
              <div className="py-24 text-center text-muted-foreground space-y-2">
                <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto stroke-[1.2]" />
                <p className="font-bold text-xs uppercase tracking-widest">No text generated yet</p>
                <p className="text-[10px] max-w-[200px] mx-auto mt-1">Select a preset, write a prompt, and click Craft Content above!</p>
              </div>
            )}
          </div>

          <div className="bg-[#3C77C3]/5 rounded-xl border border-[#3C77C3]/10 p-4 text-[10px] text-muted-foreground leading-normal text-left">
            Generative text utilizes customized retail NLP templates mapped precisely to Creva storefront visual layouts.
          </div>
        </div>
      </div>
    </div>
  );
}
