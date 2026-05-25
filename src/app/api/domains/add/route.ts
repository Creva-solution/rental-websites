import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { subdomain } = await request.json();

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 });
    }

    const token = process.env.VERCEL_AUTH_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;
    const teamId = process.env.VERCEL_TEAM_ID;

    // Gracefully skip in local development if environment variables are not set
    if (!token || !projectId) {
      console.log('Vercel API environment variables not set. Skipping domain alias registration.');
      return NextResponse.json({ 
        success: true, 
        message: 'Skipped Vercel registration (local development).' 
      });
    }

    const domainName = `${subdomain.toLowerCase()}.crevasolution.in`;

    // Construct Vercel API URL (append teamId if it exists)
    let url = `https://api.vercel.com/v9/projects/${projectId}/domains`;
    if (teamId) {
      url += `?teamId=${teamId}`;
    }

    console.log(`Registering custom domain with Vercel: ${domainName}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domainName }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Vercel Domain API Error:', data);
      
      // If the domain is already configured on this project, treat it as a success
      if (data.error?.code === 'domain_already_in_use' || data.error?.message?.includes('already')) {
        return NextResponse.json({ success: true, message: 'Domain already registered' });
      }

      return NextResponse.json({ 
        error: data.error?.message || 'Failed to register domain with Vercel' 
      }, { status: response.status });
    }

    console.log(`Successfully registered custom domain: ${domainName}`);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Domain Registration Router Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
