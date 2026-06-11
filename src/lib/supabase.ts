// Creva Webzz API Client
// Custom HTTP client that connects Next.js to the Laravel PHP + PostgreSQL backend.

const RENDER_URL = 'https://rentalwebsite-backend-vn40.onrender.com/api';
// In the browser use a same-origin Next.js proxy (/api/backend/*) so CORS never fires.
// On the server (SSR/build) call Render directly — no browser CORS applies.
const API_BASE_URL = typeof window !== 'undefined' ? '/api/backend' : RENDER_URL;

// ─── Token Management ────────────────────────────────────────────────────────
// Tokens are stored in localStorage for cross-tab persistence.
// Auth is JWT Bearer token only — no cookies are used or set by the backend.

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('creva_token');
}

function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('creva_token', token);
}

function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('creva_token');
  localStorage.removeItem('creva_user');
  // Legacy key cleanup
  localStorage.removeItem('mock_supabase_token');
  localStorage.removeItem('mock_supabase_user');
}

function getStoredUser(): any {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('creva_user') || localStorage.getItem('mock_supabase_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: any): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('creva_user', JSON.stringify(user));
}

// ─── Base Fetch Helper ───────────────────────────────────────────────────────

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken() || (typeof window !== 'undefined' ? localStorage.getItem('mock_supabase_token') : null);
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store', // Always fetch fresh data — prevents Next.js SSR fetch cache stale hits
  });
}

// ─── Query Builder ────────────────────────────────────────────────────────────

class QueryBuilder {
  private tableName: string;
  private filters: Record<string, any> = {};
  private excludeFilters: { field: string; value: any }[] = [];
  private sortField: string | null = null;
  private sortAscending = true;
  private isSingle = false;
  private limitCount: number | null = null;
  private offsetCount: number | null = null;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private actionData: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(_fields = '*') {
    if (this.action !== 'insert' && this.action !== 'update' && this.action !== 'delete') {
      this.action = 'select';
    }
    return this;
  }

  eq(field: string, value: any) {
    this.filters[field] = value;
    return this;
  }

  neq(field: string, value: any) {
    this.excludeFilters.push({ field, value });
    return this;
  }

  in(field: string, values: any[]) {
    this.filters[field] = values.join(',');
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.sortField = field;
    this.sortAscending = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  or(filterString: string) {
    const match = filterString.match(/custom_domain\.eq\.([^,)]+)/);
    if (match?.[1]) this.filters['custom_domain'] = match[1];
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  insert(dataArray: any[]) {
    this.action = 'insert';
    this.actionData = dataArray;
    return this;
  }

  update(dataObject: any) {
    this.action = 'update';
    this.actionData = dataObject;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  async then(onfulfilled?: (value: any) => any, _onrejected?: (reason: any) => any) {
    try {
      let url = `/${this.tableName}`;
      let response: Response;

      if (this.action === 'select') {
        const params = new URLSearchParams();
        Object.entries(this.filters).forEach(([k, v]) => params.append(k, String(v)));
        if (this.sortField) {
          params.append('_sort', this.sortField);
          params.append('_order', this.sortAscending ? 'asc' : 'desc');
        }
        if (this.limitCount !== null) params.append('_limit', String(this.limitCount));
        if (this.offsetCount !== null) params.append('_offset', String(this.offsetCount));
        const qs = params.toString();
        response = await apiFetch(`${url}${qs ? '?' + qs : ''}`);
      } else if (this.action === 'insert') {
        const body = Array.isArray(this.actionData) ? (this.actionData[0] || {}) : this.actionData;
        if (!body.id) {
          body.id = this.tableName.substring(0, 4) + '_' + Math.random().toString(36).substring(2, 11);
        }
        response = await apiFetch(url, { method: 'POST', body: JSON.stringify(body) });
      } else if (this.action === 'update') {
        let targetId = this.filters['id'];
        if (!targetId) {
          try {
            const params = new URLSearchParams();
            Object.entries(this.filters).forEach(([k, v]) => params.append(k, String(v)));
            const res = await apiFetch(`${url}?${params.toString()}`);
            if (res.ok) {
              const rows = await res.json();
              const row = Array.isArray(rows) ? rows[0] : rows;
              if (row?.id) targetId = row.id;
            }
          } catch (e) {
            console.warn('Auto-resolve ID failed:', e);
          }
        }
        if (!targetId) throw new Error("Updates must target a specific ID via .eq('id', value)");
        response = await apiFetch(`${url}/${targetId}`, { method: 'PUT', body: JSON.stringify(this.actionData) });
      } else {
        const targetId = this.filters['id'];
        if (targetId) {
          response = await apiFetch(`${url}/${targetId}`, { method: 'DELETE' });
        } else {
          const params = new URLSearchParams();
          Object.entries(this.filters).forEach(([k, v]) => params.append(k, String(v)));
          response = await apiFetch(`${url}?${params.toString()}`, { method: 'DELETE' });
        }
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status}`);
      }

      let data = await response.json();

      if (this.action === 'select' && Array.isArray(data)) {
        this.excludeFilters.forEach(({ field, value }) => {
          data = data.filter((item: any) => item[field] !== value);
        });
        if (this.isSingle) data = data[0] ?? null;
      } else if (this.action === 'select' && this.isSingle && !Array.isArray(data)) {
        // already single object
      }

      const result = { data, error: null };
      return onfulfilled ? onfulfilled(result) : result;
    } catch (err: any) {
      console.error(`API Error [${this.tableName}/${this.action}]:`, err.message);
      const result = { data: null, error: { message: err.message || String(err) } };
      return onfulfilled ? onfulfilled(result) : result;
    }
  }
}

// ─── Auth Client ───────────────────────────────────────────────────────────────

class AuthClient {
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Invalid email or password');
      }
      const data = await response.json();
      const user = data.user || (data.id ? data : null);
      setStoredToken(data.session.access_token);
      setStoredUser(user);
      return { data: { ...data, user }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || String(err) } };
    }
  }

  async signUp({ email, password, options }: { email: string; password: string; options?: any }) {
    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name: options?.data?.full_name }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Registration failed');
      }
      const data = await response.json();
      const user = data.user || (data.id ? data : null);
      setStoredToken(data.session.access_token);
      setStoredUser(user);
      return { data: { ...data, user }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || String(err) } };
    }
  }

  async signOut() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    clearStoredToken();
    return { error: null };
  }

  async getUser() {
    try {
      if (typeof window === 'undefined') return { data: { user: null }, error: null };

      const token = getStoredToken() || localStorage.getItem('mock_supabase_token');
      if (!token) return { data: { user: null }, error: null };

      // Always fetch from API so role changes in DB are reflected immediately.
      // localStorage is only a fallback if the network call fails.
      const response = await apiFetch('/auth/user');
      if (response.ok) {
        const resData = await response.json();
        const user = resData.user || (resData.id ? resData : null);
        setStoredUser(user); // keep cache in sync
        return { data: { user }, error: null };
      }

      // Token rejected by server — clear stale session
      clearStoredToken();
      return { data: { user: null }, error: null };
    } catch {
      // Network offline — fall back to cached user
      const stored = getStoredUser();
      return { data: { user: stored ?? null }, error: null };
    }
  }

  async getSession() {
    try {
      if (typeof window === 'undefined') return { data: { session: null }, error: null };

      let token = getStoredToken() || localStorage.getItem('mock_supabase_token');
      let user = getStoredUser();

      // Check URL for token from password reset link
      if (!token) {
        const hash = window.location.hash;
        const search = window.location.search;
        let urlToken: string | null = null;

        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          urlToken = params.get('access_token');
        }
        if (!urlToken && search) {
          const params = new URLSearchParams(search);
          urlToken = params.get('token') || params.get('access_token');
        }

        if (urlToken) {
          const res = await apiFetch('/auth/verify-token', {
            method: 'POST',
            body: JSON.stringify({ token: urlToken }),
          });
          if (res.ok) {
            const verifyData = await res.json();
            const verifiedUser = verifyData.user || (verifyData.id ? verifyData : null);
            if (verifiedUser) {
              token = urlToken;
              user = verifiedUser;
              setStoredToken(urlToken);
              setStoredUser(verifiedUser);
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        }
      }

      if (!token || !user) return { data: { session: null }, error: null };

      return {
        data: { session: { access_token: token, user } },
        error: null,
      };
    } catch {
      return { data: { session: null }, error: null };
    }
  }

  async resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
    try {
      const response = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email, redirectTo: options?.redirectTo }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send reset link');
      }
      const data = await response.json();
      // SECURITY: Never expose reset tokens to browser globals
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || String(err) } };
    }
  }

  async updateUser({ password }: { password?: string }) {
    try {
      const token = getStoredToken();
      const response = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ password, token }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update password');
      }
      return { data: await response.json(), error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || String(err) } };
    }
  }

  async changePassword({ currentPassword, newPassword }: { currentPassword?: string; newPassword?: string }) {
    try {
      const response = await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to change password');
      }
      return { data: await response.json(), error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || String(err) } };
    }
  }
}

// ─── Storage Client ────────────────────────────────────────────────────────────

class StorageBucket {
  constructor(_bucketName: string) {}

  async upload(filePath: string, file: any, _options?: any) {
    try {
      if (typeof file === 'string' && file.startsWith('data:image/')) {
        const response = await apiFetch('/storage/upload', {
          method: 'POST',
          body: JSON.stringify({ base64: file }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Base64 upload failed');
        return { data: { path: data.url || data.publicUrl }, error: null };
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('filePath', filePath);

      const token = getStoredToken() || (typeof window !== 'undefined' ? localStorage.getItem('mock_supabase_token') : null);
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${RENDER_URL}/storage/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      return { data: { path: data.url || data.publicUrl }, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || String(err) } };
    }
  }

  getPublicUrl(filePath: string) {
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return { data: { publicUrl: filePath } };
    }
    const cleanPath = filePath.startsWith('uploads/') ? filePath : `uploads/${filePath}`;
    const base = RENDER_URL.replace('/api', '');
    return { data: { publicUrl: `${base}/${cleanPath}` } };
  }

  async remove(filePaths: string[]) {
    try {
      for (const path of filePaths) {
        if (!path) continue;
        let cleanPath = path;
        if (path.startsWith('http://') || path.startsWith('https://')) {
          try {
            cleanPath = new URL(path).pathname.substring(1);
          } catch {
            cleanPath = path;
          }
        }
        await apiFetch('/storage/delete', {
          method: 'POST',
          body: JSON.stringify({ filePath: cleanPath }),
        });
      }
      return { data: filePaths, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || String(err) } };
    }
  }
}

class StorageClient {
  from(bucketName: string) {
    return new StorageBucket(bucketName);
  }
}

// ─── Platform Settings Helper ─────────────────────────────────────────────────

export async function getPlatformSettings(): Promise<Record<string, any>> {
  try {
    const res = await apiFetch('/platform-settings');
    if (!res.ok) return {};
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.reduce((acc: any, row: any) => {
        try { acc[row.key] = JSON.parse(row.value); } catch { acc[row.key] = row.value; }
        return acc;
      }, {});
    }
    return data;
  } catch {
    return {};
  }
}

export async function setPlatformSetting(key: string, value: any): Promise<void> {
  await apiFetch(`/platform-settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value: JSON.stringify(value) }),
  });
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export const supabase = {
  from(tableName: string) {
    return new QueryBuilder(tableName);
  },
  auth: new AuthClient(),
  storage: new StorageClient(),
};
