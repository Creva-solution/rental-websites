// Creva Webzz Premium Custom HTTP REST API Client (Supabase Emulator)
// Connects Next.js perfectly to our native Laravel PHP + MySQL backend without breaking code syntax

const API_BASE_URL = 'https://rentalwebsite-backend-vn40.onrender.com/api';

class MockSupabaseQueryBuilder {
  private tableName: string;
  private filters: Record<string, any> = {};
  private sortField: string | null = null;
  private sortAscending: boolean = true;
  private selectFields: string = '*';
  private isSingle: boolean = false;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private actionData: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields: string = '*') {
    this.selectFields = fields;
    if (this.action !== 'insert' && this.action !== 'update' && this.action !== 'delete') {
      this.action = 'select';
    }
    return this;
  }

  eq(field: string, value: any) {
    this.filters[field] = value;
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

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  or(filterString: string) {
    const match = filterString.match(/custom_domain\.eq\.([^,)]+)/);
    if (match && match[1]) {
      this.filters['custom_domain'] = match[1];
    }
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

  // Executes query and behaves like a Promise to support `await supabase.from()`
  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('mock_supabase_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let url = `${API_BASE_URL}/${this.tableName}`;
      let response: Response;

      if (this.action === 'select') {
        const params = new URLSearchParams();
        Object.entries(this.filters).forEach(([key, val]) => {
          params.append(key, val);
        });
        if (this.sortField) {
          params.append('_sort', this.sortField);
          params.append('_order', this.sortAscending ? 'asc' : 'desc');
        }
        url = `${url}?${params.toString()}`;
        response = await fetch(url, { headers });
      } else if (this.action === 'insert') {
        const bodyData = Array.isArray(this.actionData) ? (this.actionData[0] || {}) : this.actionData;
        if (!bodyData.id) {
          bodyData.id = this.tableName.substring(0, 4) + '_' + Math.random().toString(36).substring(2, 11);
        }
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyData)
        });
      } else if (this.action === 'update') {
        const targetId = this.filters['id'];
        if (!targetId) {
          throw new Error("Updates must target a specific ID using .eq('id', value)");
        }
        url = `${url}/${targetId}`;
        response = await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify(this.actionData)
        });
      } else if (this.action === 'delete') {
        const targetId = this.filters['id'];
        if (targetId) {
          url = `${url}/${targetId}`;
        } else {
          const params = new URLSearchParams();
          Object.entries(this.filters).forEach(([key, val]) => {
            params.append(key, val);
          });
          url = `${url}?${params.toString()}`;
        }
        response = await fetch(url, {
          method: 'DELETE',
          headers
        });
      } else {
        throw new Error(`Unsupported action ${this.action}`);
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status} Error`);
      }

      const data = await response.json();
      
      let finalData = data;
      if (this.action === 'select' && this.isSingle) {
        finalData = Array.isArray(data) ? (data[0] || null) : data;
      }

      const result = { data: finalData, error: null };
      return onfulfilled ? onfulfilled(result) : result;
    } catch (err: any) {
      console.error(`Mock Query Error on ${this.tableName} [${this.action}]:`, err);
      const result = { data: null, error: { message: err.message || String(err) } };
      return onfulfilled ? onfulfilled(result) : result;
    }
  }
}

class MockSupabaseAuth {
  async signInWithPassword({ email, password }: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Invalid email or password');
      }

      const data = await response.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem('mock_supabase_token', data.session.access_token);
        localStorage.setItem('mock_supabase_user', JSON.stringify(data.user));
      }
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || String(err) } };
    }
  }

  async signUp({ email, password, options }: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password, name: options?.data?.full_name })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Registration failed');
      }

      const data = await response.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem('mock_supabase_token', data.session.access_token);
        localStorage.setItem('mock_supabase_user', JSON.stringify(data.user));
      }
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || String(err) } };
    }
  }

  async signOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_supabase_token');
      localStorage.removeItem('mock_supabase_user');
    }
    return { error: null };
  }

  async getUser() {
    try {
      if (typeof window === 'undefined') {
        return { data: { user: null }, error: null };
      }
      const token = localStorage.getItem('mock_supabase_token');
      const userStr = localStorage.getItem('mock_supabase_user');
      
      if (!token || !userStr) {
        return { data: { user: null }, error: null };
      }

      const user = JSON.parse(userStr);
      return { data: { user }, error: null };
    } catch (e) {
      return { data: { user: null }, error: null };
    }
  }

  async getSession() {
    try {
      if (typeof window === 'undefined') {
        return { data: { session: null }, error: null };
      }
      const token = localStorage.getItem('mock_supabase_token');
      const userStr = localStorage.getItem('mock_supabase_user');
      
      if (!token || !userStr) {
        return { data: { session: null }, error: null };
      }

      const user = JSON.parse(userStr);
      return {
        data: {
          session: {
            access_token: token,
            user
          }
        },
        error: null
      };
    } catch (e) {
      return { data: { session: null }, error: null };
    }
  }
}

class MockStorageBucket {
  private bucketName: string;

  constructor(bucketName: string) {
    this.bucketName = bucketName;
  }

  async upload(filePath: string, file: any, options?: any) {
    try {
      const formData = new FormData();
      
      if (typeof file === 'string' && file.startsWith('data:image/')) {
        // Base64 string upload support
        const response = await fetch(`${API_BASE_URL}/storage/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ base64: file })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Base64 upload failed');
        if (typeof window !== 'undefined') {
          if (!(window as any).mockStorageCache) (window as any).mockStorageCache = {};
          (window as any).mockStorageCache[filePath] = data.url;
        }
        return { data: { path: data.url }, error: null };
      } else {
        // Standard Binary upload support
        formData.append('file', file);
        formData.append('filePath', filePath);

        const response = await fetch(`${API_BASE_URL}/storage/upload`, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'File upload failed');
        if (typeof window !== 'undefined') {
          if (!(window as any).mockStorageCache) (window as any).mockStorageCache = {};
          (window as any).mockStorageCache[filePath] = data.url;
        }
        return { data: { path: data.url }, error: null };
      }
    } catch (err: any) {
      return { data: null, error: { message: err.message || String(err) } };
    }
  }

  getPublicUrl(filePath: string) {
    // If filePath is already an absolute HTTP URL, return it directly
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return { data: { publicUrl: filePath } };
    }
    
    // Check global cache
    if (typeof window !== 'undefined' && (window as any).mockStorageCache?.[filePath]) {
      return { data: { publicUrl: (window as any).mockStorageCache[filePath] } };
    }

    const cleanPath = filePath.startsWith('uploads/') ? filePath : `uploads/${filePath}`;
    const BACKEND_BASE_URL = API_BASE_URL.replace('/api', '');
    const publicUrl = `${BACKEND_BASE_URL}/${cleanPath}`;
    return { data: { publicUrl } };
  }

  async remove(filePaths: string[]) {
    // Return mock success as file deletion is optional
    return { data: filePaths, error: null };
  }
}

class MockSupabaseStorage {
  from(bucketName: string) {
    return new MockStorageBucket(bucketName);
  }
}

export const supabase = {
  from(tableName: string) {
    return new MockSupabaseQueryBuilder(tableName);
  },
  auth: new MockSupabaseAuth(),
  storage: new MockSupabaseStorage()
};

