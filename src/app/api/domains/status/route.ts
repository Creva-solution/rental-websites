import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainName = searchParams.get('domain');

    if (!domainName) {
      return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
    }

    const token = process.env.VERCEL_AUTH_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;
    const teamId = process.env.VERCEL_TEAM_ID;

    // Local development safety fallback
    if (!token || !projectId) {
      return NextResponse.json({
        success: true,
        status: 'active',
        verified: true,
        configured: true,
        message: 'Mock status for local development (active)'
      });
    }

    // 1. Fetch domain status from Vercel Project Domains API
    const projectDomainUrl = teamId
      ? `https://api.vercel.com/v9/projects/${projectId}/domains/${domainName}?teamId=${teamId}`
      : `https://api.vercel.com/v9/projects/${projectId}/domains/${domainName}`;

    const domainRes = await fetch(projectDomainUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (domainRes.status === 404) {
      return NextResponse.json({
        success: true,
        status: 'not_found',
        verified: false,
        configured: false,
        message: 'Domain not registered on this Vercel project.'
      });
    }

    const domainData = await domainRes.json();

    // 2. Fetch DNS config check from Vercel Domain Config API
    const configUrl = teamId
      ? `https://api.vercel.com/v6/domains/${domainName}/config?teamId=${teamId}`
      : `https://api.vercel.com/v6/domains/${domainName}/config`;

    const configRes = await fetch(configUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const configData = await configRes.json();

    const verified = domainData.verified;
    const misconfigured = configData.misconfigured;

    let status = 'not_configured';

    if (verified && !misconfigured) {
      status = 'active';
    } else if (verified && misconfigured) {
      status = 'ssl_verifying';
    } else if (!verified) {
      status = 'verifying';
    }

    return NextResponse.json({
      success: true,
      status,
      verified,
      configured: !misconfigured,
      domainInfo: domainData,
      dnsConfig: configData
    });
  } catch (error: any) {
    console.error('Domain Status Router Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
