'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, Globe, ShieldAlert, ShieldCheck, Play, Pause, 
  Search, RefreshCw, Copy, Check, Database, HelpCircle,
  Infinity, Calendar, Clock, Zap, Plus
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

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
      setStores(data || []);
    } catch (err: any) {
      console.error('Error loading stores:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

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

  const handleExtendSubscription = async (storeId: string, days: number | null) => {
    setActionStatus(`Extending subscription...`);
    try {
      const store = stores.find(s => s.id === storeId);
      if (!store) return;

      let baseDate = new Date();
      
      if (days === null) {
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

      // If store has an active subscription in the future, extend from that expiry date
      if (store.subscription_expires_at) {
        const currentExpiry = new Date(store.subscription_expires_at);
        if (currentExpiry > new Date()) {
          baseDate = currentExpiry;
        }
      }

      const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
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
      setActionStatus(`Subscription extended successfully!`);
      setTimeout(() => setActionStatus(null), 3000);
    } catch (err: any) {
      alert(`Error updating subscription: ${err.message}`);
      setActionStatus(null);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(sqlCommand);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const filteredStores = stores.filter(store => 
    store.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (store.custom_domain && store.custom_domain.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalStores = stores.length;
  const pausedStores = stores.filter(s => s.is_paused === true).length;
  const activeStores = totalStores - pausedStores;
  const customDomainStores = stores.filter(s => s.custom_domain).length;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-6 sm:p-8">
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
        {/* SQL Setup Required Alert Box */}
        <div className="bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-500/30 rounded-xl p-5 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-indigo-300 flex items-center gap-2">
                  Supabase Database Setup Required
                  <span className="text-xs font-normal text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">First Time Setup</span>
                </h3>
                <button 
                  onClick={copySql}
                  className="flex items-center gap-1.5 text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium transition-all"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy SQL
                    </>
                  )}
                </button>
              </div>
              <p className="text-gray-300 text-xs mt-1 leading-relaxed">
                Before toggling pause or domain options, copy this SQL and run it in your **Supabase SQL Editor** to add new columns to your table. If columns already exist, you can skip this!
              </p>
              <pre className="mt-3 bg-black/40 border border-black/50 text-[10px] sm:text-xs text-indigo-200 font-mono p-3 rounded-lg overflow-x-auto">
                {sqlCommand}
              </pre>
            </div>
          </div>
        </div>

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
              placeholder="Search by store name, subdomain, custom domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700/80 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          {actionStatus && (
            <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 animate-pulse border border-blue-500/20">
              {actionStatus}
            </div>
          )}
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
                                  End: {expiryDate.toLocaleDateString()}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {daysRemaining} days left
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 font-mono">
                                  Ends: {expiryDate.toLocaleDateString()}
                                </span>
                              </div>
                            )}

                            {/* Quick Extend Buttons */}
                            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1 border-t border-gray-700/60 pt-2 w-full max-w-[200px]">
                              <button
                                onClick={() => handleExtendSubscription(store.id, 30)}
                                title="Add 1 Month"
                                className="px-1.5 py-0.5 rounded bg-gray-900 hover:bg-gray-700 text-[10px] font-semibold text-gray-300 border border-gray-700 transition-colors"
                              >
                                +30d
                              </button>
                              <button
                                onClick={() => handleExtendSubscription(store.id, 90)}
                                title="Add 3 Months"
                                className="px-1.5 py-0.5 rounded bg-gray-900 hover:bg-gray-700 text-[10px] font-semibold text-gray-300 border border-gray-700 transition-colors"
                              >
                                +90d
                              </button>
                              <button
                                onClick={() => handleExtendSubscription(store.id, 365)}
                                title="Add 1 Year"
                                className="px-1.5 py-0.5 rounded bg-gray-900 hover:bg-gray-700 text-[10px] font-semibold text-gray-300 border border-gray-700 transition-colors"
                              >
                                +365d
                              </button>
                              <button
                                onClick={() => handleExtendSubscription(store.id, null)}
                                title="Set to Lifetime"
                                className="px-1.5 py-0.5 rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-[10px] font-bold text-yellow-400 border border-yellow-500/20 transition-colors"
                              >
                                Lifetime
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleTogglePause(store.id, isPaused)}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition-all shadow-sm ${
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
    </div>
  );
}
