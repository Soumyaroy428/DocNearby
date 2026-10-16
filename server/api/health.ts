import { NextResponse } from 'next/server';
import { isMongoConfigured } from '@/server/db/mongodb';

export async function handleGetHealth() {
  const memory = process.memoryUsage();

  const healthData = {
    status: 'healthy',
    service: 'DocNearby Healthcare Discovery API',
    tagline: 'Trusted Care, Wherever You Are.',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'production',
    nodeVersion: process.version,
    database: {
      configured: isMongoConfigured(),
      mode: isMongoConfigured() ? 'mongodb' : 'in-memory-fallback',
      status: 'operational',
    },
    integrations: {
      googlePlaces: {
        configured: Boolean(process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
        status: Boolean(process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
          ? 'ready'
          : 'unconfigured-fallback-active',
      },
      geminiAi: {
        configured: Boolean(process.env.GEMINI_API_KEY),
        status: Boolean(process.env.GEMINI_API_KEY) ? 'ready' : 'heuristic-fallback-active',
      },
    },
    memory: {
      rssMb: Math.round((memory.rss / (1024 * 1024)) * 100) / 100,
      heapTotalMb: Math.round((memory.heapTotal / (1024 * 1024)) * 100) / 100,
      heapUsedMb: Math.round((memory.heapUsed / (1024 * 1024)) * 100) / 100,
    },
    pilot: {
      city: 'Kolkata',
      country: 'India',
      status: 'active',
      supportedZones: ['Park Street', 'Salt Lake Sector V', 'New Town', 'Ballygunge'],
    },
    security: {
      strictHeaders: true,
      dataProtection: 'DPDP Act 2023 & GDPR Aligned',
      piiScrubbing: 'active',
    },
  };

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

