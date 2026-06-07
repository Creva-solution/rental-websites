export interface Store {
  id: string;
  owner_id: string;
  store_name: string;
  subdomain: string;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string;
  currency: string;
  contact_phone: string | null;
  contact_email: string | null;
  description: string | null;
  billing_plan: string | null;
  billing_price: number | null;
  plan_starts_at: string | null;
  plan_ends_at: string | null;
  status: 'active' | 'inactive' | 'suspended';
  is_paused: boolean;
  appearance_settings: Record<string, any> | null;
  business_settings: Record<string, any> | null;
  selected_template: string | null;
  whatsapp_number: string | null;
  whatsapp_enabled: boolean;
  payment_upi_id: string | null;
  cod_enabled: boolean;
  online_payment_enabled: boolean;
  address: string | null;
  social_links: Record<string, string> | null;
  checkout_mode: string | null;
  delivery_settings: Record<string, any> | null;
  announcement: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'merchant' | 'superadmin';
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  price: number;
  compare_price: number | null;
  description: string | null;
  image_url: string | null;
  images: string[];
  category_id: string | null;
  sizes: string[];
  colors: string[];
  stock: number;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: string | null;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  size: string | null;
  color: string | null;
}

export interface Discount {
  id: string;
  store_id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimum_order: number;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BlogPost {
  id: string;
  store_id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  cover_image: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
}

export interface Page {
  id: string;
  store_id: string;
  title: string;
  slug: string;
  content: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface VideoSession {
  id: string;
  store_id: string;
  title: string;
  video_url: string;
  product_ids: string[];
  created_at: string;
}

export interface Integration {
  id: string;
  store_id: string;
  type: string;
  is_enabled: boolean;
  config: Record<string, string>;
  created_at: string;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: string | Record<string, any>;
  created_at: string;
  updated_at: string;
}
