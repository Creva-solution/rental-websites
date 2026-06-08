import { NextResponse } from 'next/server';

const RENDER_API = 'https://rentalwebsite-backend-vn40.onrender.com/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch(
      `${RENDER_API}/stores?subdomain=__creva_saas_global_settings__`,
      { cache: 'no-store', headers: { Accept: 'application/json' } }
    );

    if (!res.ok) throw new Error('Backend unavailable');

    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : rows;

    let plans: any[] = [];

    if (row?.description) {
      const settings = JSON.parse(row.description);

      if (Array.isArray(settings.subscriptionPlans) && settings.subscriptionPlans.length > 0) {
        plans = settings.subscriptionPlans
          .filter((p: any) => p.isActive !== false)
          .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
      } else {
        // Legacy format — synthesize
        const disabled: string[] = settings.disabledDefaultPackages || [];
        let order = 1;

        if (!disabled.includes('30') && settings.plan30Price) {
          plans.push({ id: '30', name: '1 Month Plan', price: settings.plan30Price, days: 30, description: 'Best for trial storefronts', badge: '', isActive: true, displayOrder: order++ });
        }
        if (!disabled.includes('365') && settings.plan365Price) {
          plans.push({ id: '365', name: '1 Year Plan', price: settings.plan365Price, days: 365, description: 'Most popular for small shops', badge: 'Most Popular', isActive: true, displayOrder: order++ });
        }
        if (!disabled.includes('lifetime') && settings.planLifetimePrice) {
          plans.push({ id: 'lifetime', name: 'Lifetime Plan', price: settings.planLifetimePrice, days: 99999, description: 'Ultimate professional pack', badge: 'Best Value', isActive: true, displayOrder: order++ });
        }
        if (Array.isArray(settings.customPackages)) {
          settings.customPackages.forEach((pkg: any) => {
            plans.push({ id: pkg.id, name: pkg.name, price: pkg.price, days: pkg.days, description: `${pkg.days} Days Access`, badge: '', isActive: true, displayOrder: order++ });
          });
        }
      }
    }

    return NextResponse.json(plans, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', Pragma: 'no-cache' },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
