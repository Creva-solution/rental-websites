'use client';

import { useState } from 'react';
import { Sparkles, Brain, Copy, RotateCw, Check, Compass, MessageSquare, Megaphone, FileText } from 'lucide-react';

export default function AIContentStudioPage() {
  const [tone, setTone] = useState('premium');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      let result = '';
      if (prompt.toLowerCase().includes('soap') || prompt.toLowerCase().includes('admire')) {
        result = `**Experience Pure botanical wellness with our handmade soaps.**\n\nIndulge in a premium cold-cured recipe crafted to retain raw botanical oils and organic wellness essences. Naturally scented with fresh lavender, raw citrus peels, and creamy coconut cream to deliver an incredibly soft, moisturized soap-glow. Ideal for sensitive skin types seeking raw luxury.\n\n*Key Benefits: 100% natural harvesting, 6-week cure duration, fully zero waste, chemical-free.*`;
      } else {
        result = `**Elevate your everyday rituals with Creva Websz.**\n\nIntroducing our newest hand-curated addition, crafted meticulously with raw ingredients and modern sustainability. Every purchase is verified, packaged carefully by local artisan hands, and shipped in full eco-friendly luxury packaging.\n\n*Buy now to experience a truly timeless, beautiful lifestyle upgrade.*`;
      }
      setGeneratedText(result);
      setGenerating(false);
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
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
                  onClick={() => setPrompt(`Write a highly compelling ${p.label.toLowerCase()} for "Admire Handmade Organic Lavender Soaps" listing...`)}
                  className="p-4 border rounded-xl hover:border-[#3C77C3]/40 hover:bg-[#3C77C3]/5 text-left transition-all space-y-2 group"
                >
                  <p.icon className="w-5 h-5 text-muted-foreground group-hover:text-[#3C77C3]" />
                  <p className="font-bold text-xs text-foreground mt-1">{p.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-normal">{p.desc}</p>
                </button>
              ))}
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
              <div className="text-xs sm:text-sm text-gray-700 leading-relaxed space-y-3 bg-muted/20 p-4 rounded-xl border border-dashed whitespace-pre-line shadow-inner max-h-[300px] overflow-y-auto">
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
