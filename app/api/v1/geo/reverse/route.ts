import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ReverseGeoCacheEntry {
  data: {
    city: string;
    locality?: string;
    district?: string;
    state?: string;
    formatted: string;
    latitude: number;
    longitude: number;
  };
  expiresAt: number;
}

const reverseGeoCache = new Map<string, ReverseGeoCacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('latitude') || searchParams.get('lat');
    const lonStr = searchParams.get('longitude') || searchParams.get('lon');

    if (!latStr || !lonStr) {
      return NextResponse.json(
        { success: false, error: 'Missing latitude or longitude parameters' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lonStr);

    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { success: false, error: 'Invalid latitude or longitude values' },
        { status: 400 }
      );
    }

    // Cache key based on rounded coordinates (~100m radius)
    const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    const cached = reverseGeoCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ success: true, ...cached.data });
    }

    // 1. Try BigDataCloud free client reverse geocoding (fast, accurate for Indian localities & districts)
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const bdcRes = await fetch(bdcUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (bdcRes.ok) {
        const bdc = await bdcRes.json();
        const locality = bdc.locality || '';
        const city = bdc.city || locality || '';
        const state = bdc.principalSubdivision || '';
        const districtObj = bdc.localityInfo?.administrative?.find(
          (a: { description?: string; name?: string }) =>
            a.description?.toLowerCase().includes('district')
        );
        const district = districtObj ? districtObj.name.replace(/\s+district$/i, '') : '';

        const primaryName = locality || city || district || 'Your Area';
        const formatted = [primaryName, state].filter(Boolean).join(', ');

        const payload = {
          city: primaryName,
          locality: locality || undefined,
          district: district || undefined,
          state: state || undefined,
          formatted,
          latitude,
          longitude,
        };

        reverseGeoCache.set(cacheKey, {
          data: payload,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });

        return NextResponse.json({ success: true, ...payload });
      }
    } catch {
      // BigDataCloud failed or timed out, fallback to Nominatim
    }

    // 2. Fallback to OpenStreetMap Nominatim
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const nomRes = await fetch(nomUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'DocNearby-Healthcare/1.0',
        },
      });
      clearTimeout(timeoutId);

      if (nomRes.ok) {
        const nom = await nomRes.json();
        const addr = nom.address || {};
        const locality = addr.suburb || addr.village || addr.town || addr.city_district || '';
        const city = addr.city || addr.town || locality || addr.county || 'Your Area';
        const state = addr.state || '';
        const district = addr.state_district ? addr.state_district.replace(/\s+district$/i, '') : '';

        const primaryName = locality || city || district;
        const formatted = [primaryName, state].filter(Boolean).join(', ');

        const payload = {
          city: primaryName,
          locality: locality || undefined,
          district: district || undefined,
          state: state || undefined,
          formatted,
          latitude,
          longitude,
        };

        reverseGeoCache.set(cacheKey, {
          data: payload,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });

        return NextResponse.json({ success: true, ...payload });
      }
    } catch {
      // Nominatim failed
    }

    // 3. Fallback when reverse services fail: return coordinates with generic locality
    const fallbackPayload = {
      city: 'Detected Area',
      formatted: 'Detected Area',
      latitude,
      longitude,
    };

    return NextResponse.json({ success: true, ...fallbackPayload });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Reverse geocoding error',
      },
      { status: 500 }
    );
  }
}

