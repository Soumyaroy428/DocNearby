import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Check Vercel Edge IP Geolocation Headers
    const vercelLat = request.headers.get('x-vercel-ip-latitude');
    const vercelLon = request.headers.get('x-vercel-ip-longitude');
    const vercelCity = request.headers.get('x-vercel-ip-city');
    const vercelRegion = request.headers.get('x-vercel-ip-country-region');

    if (vercelLat && vercelLon) {
      const lat = parseFloat(vercelLat);
      const lon = parseFloat(vercelLon);
      if (!isNaN(lat) && !isNaN(lon)) {
        const decodedCity = vercelCity ? decodeURIComponent(vercelCity) : 'Your Area';
        const decodedRegion = vercelRegion ? decodeURIComponent(vercelRegion) : '';
        return NextResponse.json({
          success: true,
          latitude: lat,
          longitude: lon,
          city: decodedRegion ? `${decodedCity}, ${decodedRegion}` : decodedCity,
          source: 'vercel-edge-ip',
        });
      }
    }

    // 2. Fallback to public IP geolocation service (useful for localhost & non-edge environments)
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '';

    const ipQueryUrl = clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1'
      ? `https://ipwho.is/${clientIp}`
      : 'https://ipwho.is/';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      const res = await fetch(ipQueryUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          return NextResponse.json({
            success: true,
            latitude: data.latitude,
            longitude: data.longitude,
            city: data.region ? `${data.city}, ${data.region}` : data.city || 'Your Area',
            source: 'ip-lookup',
          });
        }
      }
    } catch {
      clearTimeout(timeoutId);
    }

    // 3. Fallback to default metropolitan coordinates (Kolkata)
    return NextResponse.json({
      success: true,
      latitude: 22.5726,
      longitude: 88.3639,
      city: 'Kolkata, West Bengal',
      source: 'default-fallback',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to determine IP location',
        latitude: 22.5726,
        longitude: 88.3639,
        city: 'Kolkata, West Bengal',
      },
      { status: 500 }
    );
  }
}
