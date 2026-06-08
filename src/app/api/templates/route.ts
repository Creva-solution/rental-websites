import { NextResponse } from 'next/server';

const RENDER_API = 'https://rentalwebsite-backend-vn40.onrender.com/api';

export const dynamic = 'force-dynamic';

const DEFAULT_TEMPLATES = [
  { id: 'minimal', name: 'Minimal Elegance', category: 'Boutique', defaultThumb: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800' },
  { id: 'artisan', name: 'Artisan Craft', category: 'Natural Goods', defaultThumb: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800' },
  { id: 'bold', name: 'Bold Commerce', category: 'Commerce', defaultThumb: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800' },
  { id: 'luxe', name: 'Dark Luxe', category: 'Luxury', defaultThumb: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800' },
  { id: 'retro', name: 'Retro Grid', category: 'Creative', defaultThumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800' },
  { id: 'admire', name: 'Admire Organic', category: 'Organic', defaultThumb: 'https://images.unsplash.com/photo-1607006342411-91f11f6d021c?auto=format&fit=crop&q=80&w=800' },
];

export async function GET() {
  try {
    const res = await fetch(
      `${RENDER_API}/stores?subdomain=__creva_saas_global_settings__`,
      { cache: 'no-store', headers: { Accept: 'application/json' } }
    );

    if (!res.ok) throw new Error('Backend unavailable');

    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : rows;

    let thumbnails: Record<string, string> = {};
    let updatedAt: Record<string, number> = {};

    if (row?.description) {
      const settings = JSON.parse(row.description);
      thumbnails = settings.templateThumbnails || {};
      updatedAt = settings.templateThumbnailsUpdatedAt || {};
    }

    const templates = DEFAULT_TEMPLATES.map((tpl) => {
      const custom = thumbnails[tpl.id];
      const ts = updatedAt[tpl.id];
      let thumb = tpl.defaultThumb;

      if (custom && !custom.startsWith('data:')) {
        thumb = ts ? `${custom}${custom.includes('?') ? '&' : '?'}v=${ts}` : custom;
      } else if (custom && custom.startsWith('data:')) {
        thumb = custom;
      }

      return {
        id: tpl.id,
        name: tpl.name,
        category: tpl.category,
        thumb,
        previewPath: `/templates/preview?template=${tpl.id}`,
      };
    });

    return NextResponse.json(templates, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', Pragma: 'no-cache' },
    });
  } catch {
    return NextResponse.json(
      DEFAULT_TEMPLATES.map((tpl) => ({
        id: tpl.id,
        name: tpl.name,
        category: tpl.category,
        thumb: tpl.defaultThumb,
        previewPath: `/templates/preview?template=${tpl.id}`,
      })),
      { status: 200 }
    );
  }
}
