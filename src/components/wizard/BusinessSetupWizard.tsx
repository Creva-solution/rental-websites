"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, CheckCircle2 } from 'lucide-react';

export default function BusinessSetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

      // 2. Create the store record
      const subdomain = formData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const { error: storeError } = await supabase
        .from('stores')
        .insert([{
          owner_id: authData.user.id,
          store_name: formData.businessName,
          subdomain: subdomain,
          business_category: formData.category,
          description: formData.businessDescription,
          primary_color: formData.primaryColor,
          currency: formData.currency,
          contact_email: formData.email,
          contact_phone: formData.phone
        }]);

      if (storeError) throw storeError;

      // 3. Success! Redirect to dashboard
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 md:p-8 bg-card text-card-foreground rounded-2xl shadow-xl border border-border/50 backdrop-blur-sm">
      {/* Progress Bar */}
      <div className="mb-8 relative">
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${((step - 1) / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-4 text-[10px] md:text-xs font-medium text-muted-foreground">
          <span className={step >= 1 ? "text-primary" : ""}>1. Business</span>
          <span className={step >= 2 ? "text-primary" : ""}>2. Branding</span>
          <span className={step >= 3 ? "text-primary" : ""}>3. Contact</span>
          <span className={step >= 4 ? "text-primary" : ""}>4. Preferences</span>
          <span className={step >= 5 ? "text-primary" : ""}>5. Account</span>
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
                <h2 className="text-2xl font-bold tracking-tight mb-2">Design your brand</h2>
                <p className="text-muted-foreground">Upload your logo and choose your brand colors.</p>
              </div>
              
              <div className="space-y-6">
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
                        .storebuilder.com
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
          {step < 5 ? (
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
