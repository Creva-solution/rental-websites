import { supabase } from './supabase';

export interface AIIntegration {
  provider: 'openai' | 'groq' | 'anthropic_claude' | '';
  providerName: string;
  apiKey: string;
  isConnected: boolean;
  isVerified: boolean;
  isEnabled: boolean;
  lastVerifiedAt: string | null;
}

const LOCAL_STORAGE_KEY = 'creva_ai_integration';

// Utility to mask the API key safely: ••••••••••••••••abcd
export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 4) return '••••••••••••••••';
  return '••••••••••••••••' + key.slice(-4);
}

// Get the current AI integration state from Supabase or localStorage fallback
export async function getAiIntegration(storeId?: string): Promise<AIIntegration> {
  const defaultState: AIIntegration = {
    provider: '',
    providerName: '',
    apiKey: '',
    isConnected: false,
    isVerified: false,
    isEnabled: false,
    lastVerifiedAt: null
  };

  // Try reading from localStorage first as instant cache
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.isConnected) {
          return parsed;
        }
      } catch (e) {
        // ignore parsing errors
      }
    }
  }

  if (!storeId) {
    return defaultState;
  }

  try {
    const { data: ints } = await supabase
      .from('integrations')
      .select('*')
      .eq('store_id', storeId)
      .in('type', ['openai', 'meta_ai', 'anthropic_claude']);

    if (ints && ints.length > 0) {
      // Find the enabled/active integration, or fallback to any verified one
      let active = ints.find((i: any) => i.is_enabled && i.config?.verified === true);
      if (!active) {
        active = ints.find((i: any) => i.config?.verified === true);
      }
      if (!active) {
        active = ints[0];
      }

      if (active) {
        const apiKey = active.config?.api_key || '';
        const state: AIIntegration = {
          provider: active.type === 'meta_ai' ? 'groq' : active.type,
          providerName: active.type === 'openai' ? 'OpenAI' : active.type === 'anthropic_claude' ? 'Anthropic Claude' : 'Meta Llama (Groq)',
          apiKey,
          isConnected: !!apiKey,
          isVerified: active.config?.verified === true,
          isEnabled: active.is_enabled === true,
          lastVerifiedAt: active.config?.last_verified_at || null
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
        }
        return state;
      }
    }
  } catch (e) {
    console.error('Error fetching AI integration:', e);
  }

  // Clear if not in DB
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
  return defaultState;
}

// Save & Activate AI integration state
export async function saveAiIntegration(
  storeId: string,
  provider: 'openai' | 'groq' | 'anthropic_claude',
  apiKey: string,
  isEnabled: boolean = true
): Promise<AIIntegration> {
  const dbType = provider === 'groq' ? 'meta_ai' : provider;
  const providerName = provider === 'openai' ? 'OpenAI' : provider === 'anthropic_claude' ? 'Anthropic Claude' : 'Meta Llama (Groq)';
  const lastVerifiedAt = new Date().toISOString();

  const finalConfig = {
    api_key: apiKey,
    verified: true,
    last_verified_at: lastVerifiedAt
  };

  // Ensure single AI provider model: Delete other types
  const { data: existingInts } = await supabase
    .from('integrations')
    .select('*')
    .eq('store_id', storeId)
    .in('type', ['openai', 'meta_ai', 'anthropic_claude']);

  if (existingInts) {
    for (const item of existingInts) {
      if (item.type !== dbType) {
        await supabase.from('integrations').delete().eq('id', item.id);
      }
    }
  }

  const existing = existingInts?.find((i: any) => i.type === dbType);

  if (existing) {
    await supabase
      .from('integrations')
      .update({
        is_enabled: isEnabled,
        config: finalConfig
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('integrations')
      .insert([{
        store_id: storeId,
        type: dbType,
        is_enabled: isEnabled,
        config: finalConfig
      }]);
  }

  const state: AIIntegration = {
    provider,
    providerName,
    apiKey,
    isConnected: true,
    isVerified: true,
    isEnabled,
    lastVerifiedAt
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('ai-integration-changed', { detail: state }));
  }

  return state;
}

// Disconnect AI provider
export async function disconnectAiIntegration(storeId: string): Promise<AIIntegration> {
  if (storeId) {
    try {
      await supabase
        .from('integrations')
        .delete()
        .eq('store_id', storeId)
        .in('type', ['openai', 'meta_ai', 'anthropic_claude']);
    } catch (e) {
      console.error('Error disconnecting AI integration:', e);
    }
  }

  const defaultState: AIIntegration = {
    provider: '',
    providerName: '',
    apiKey: '',
    isConnected: false,
    isVerified: false,
    isEnabled: false,
    lastVerifiedAt: null
  };

  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('ai-integration-changed', { detail: defaultState }));
  }

  return defaultState;
}
