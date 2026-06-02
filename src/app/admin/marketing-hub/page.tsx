'use client';

import { useState } from 'react';
import { Megaphone, Users, Target, Send, Smartphone, Tag, ArrowUpRight, BarChart3, AlertCircle } from 'lucide-react';

export default function MarketingHubPage() {
  const [broadcastTarget, setBroadcastTarget] = useState('all');
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSentCount(248);
      setSending(false);
      setMsgText('');
      alert("WhatsApp Broadcast sent successfully to 248 customers!");
    }, 2000);
  };

  return (
    <div className="space-y-8 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-border/45">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#3C77C3] bg-[#3C77C3]/10 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Megaphone className="w-3.5 h-3.5" /> Creva Marketing Suite
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-3">
            Marketing Hub & Broadcasts
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Grow your store sales using automated WhatsApp campaigns, abandoned cart triggers, and discount broadcasts.
          </p>
        </div>
      </div>

      {/* Overview Analytics row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-card p-5 border rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#3C77C3]/10 text-[#3C77C3] flex items-center justify-center shrink-0 border border-[#3C77C3]/10">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total WhatsApps Sent</span>
            <span className="text-xl font-black text-foreground mt-0.5 block">1,842</span>
          </div>
        </div>

        <div className="bg-card p-5 border rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/10">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Average Open Rate</span>
            <span className="text-xl font-black text-foreground mt-0.5 block">98.4%</span>
          </div>
        </div>

        <div className="bg-card p-5 border rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 border border-purple-500/10">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Campaign Revenue</span>
            <span className="text-xl font-black text-foreground mt-0.5 block">₹42,890</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Campaign Builder Card */}
        <div className="lg:col-span-2 bg-card border rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b pb-3">
            <Smartphone className="w-5 h-5 text-[#3C77C3]" /> Launch instant WhatsApp Broadcast
          </h3>

          <form onSubmit={handleBroadcast} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Select Recipient Segment</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: 'All Customers', count: 248 },
                  { id: 'vip', label: 'VIP Spendors', count: 42 },
                  { id: 'cart', label: 'Cart Abandoned', count: 87 }
                ].map(segment => (
                  <button
                    key={segment.id}
                    type="button"
                    onClick={() => setBroadcastTarget(segment.id)}
                    className={`p-3 border rounded-xl text-left transition-all ${
                      broadcastTarget === segment.id
                        ? 'border-[#3C77C3] bg-[#3C77C3]/5 shadow-sm'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    <p className="font-bold text-xs text-foreground capitalize">{segment.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{segment.count} verified numbers</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">WhatsApp Campaign Text Message</label>
              <textarea
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                rows={5}
                required
                className="w-full bg-background border rounded-xl p-4 text-sm outline-none focus:border-[#3C77C3] focus:ring-1 focus:ring-[#3C77C3] leading-relaxed font-sans"
                placeholder="Hi {name}! Check out our new 'Admire Handmade Orange Soaps' available now. Use code OFFER10 at checkout for 10% off! Shop here: {store_url}"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">Use variables: `{"{name}"}` for customer name, `{"{store_url}"}` for your storefront link.</p>
            </div>

            <button
              type="submit"
              disabled={sending || !msgText.trim()}
              className="w-full bg-[#3C77C3] hover:bg-[#3C77C3]/90 text-white font-bold uppercase tracking-widest text-[10px] py-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#3C77C3]/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {sending ? 'Broadcasting message...' : 'Send WhatsApp Campaign Now'}
            </button>
          </form>
        </div>

        {/* Marketing automation triggers */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b pb-3">
              <Target className="w-5 h-5 text-amber-500" /> Automated Triggers
            </h3>

            <div className="space-y-4 text-left">
              {[
                { title: 'Abandoned Cart Recovery', desc: 'Auto-sends WhatsApp discount reminder 2 hours after cart exit.', enabled: true },
                { title: 'Shipping Confirmation Alert', desc: 'Auto-sends tracking number WhatsApp when order status hits Shipped.', enabled: true },
                { title: 'Birthday Loyalty Banners', desc: 'Automates voucher code releases to customers during birthday month.', enabled: false }
              ].map((auto, idx) => (
                <div key={idx} className="p-3 bg-muted/20 border rounded-xl flex items-start gap-3 shadow-inner">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={auto.enabled}
                      readOnly
                      className="w-4 h-4 rounded border-gray-300 text-[#3C77C3] focus:ring-[#3C77C3] accent-[#3C77C3]"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground">{auto.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">{auto.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex gap-3 text-[10px] leading-relaxed text-amber-800 text-left shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="block mb-0.5 text-amber-950 font-bold">Campaign Compliance SLA</strong>
              Ensure customer lists have opted in to receive WhatsApp notifications. Automated alerts abide by global messaging policies.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
