/**
 * Geolocation API Route
 * Provides accurate IP-based geolocation using server-side detection
 * Supports multiple geolocation providers with fallback
 */

import { NextRequest, NextResponse } from 'next/server';

// Geolocation data interface
interface GeoData {
  ip: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  source: string;
  isBot?: boolean;
  botName?: string;
}

// Get client IP from request headers
function getClientIP(request: NextRequest): string {
  // Try multiple headers for different platforms
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    // Return the first non-private IP
    for (const ip of ips) {
      if (!isPrivateIP(ip)) {
        return ip;
      }
    }
    return ips[0]; // Fallback to first IP
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP && !isPrivateIP(realIP)) return realIP;
  
  const cfIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfIP && !isPrivateIP(cfIP)) return cfIP;
  
  const clientIP = request.headers.get('x-client-ip');
  if (clientIP && !isPrivateIP(clientIP)) return clientIP;
  
  return 'unknown';
}

// Check if IP is private/local
function isPrivateIP(ip: string): boolean {
  if (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1') return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('10.')) return true;
  if (ip.match(/^172\.(1[6-9]|2\d|3[01])\./)) return true;
  if (ip.startsWith('fc00:') || ip.startsWith('fd00:')) return true;
  return false;
}

// Detect bot/crawler
function isBotOrCrawler(userAgent: string): { isBot: boolean; botName?: string } {
  const ua = userAgent.toLowerCase();
  
  const bots = [
    { pattern: /googlebot/i, name: 'Googlebot' },
    { pattern: /bingbot/i, name: 'Bingbot' },
    { pattern: /slurp/i, name: 'Yahoo Slurp' },
    { pattern: /duckduckbot/i, name: 'DuckDuckBot' },
    { pattern: /baiduspider/i, name: 'Baiduspider' },
    { pattern: /yandexbot/i, name: 'YandexBot' },
    { pattern: /facebookexternalhit/i, name: 'Facebook Bot' },
    { pattern: /twitterbot/i, name: 'Twitter Bot' },
    { pattern: /linkedinbot/i, name: 'LinkedIn Bot' },
    { pattern: /whatsapp/i, name: 'WhatsApp Bot' },
    { pattern: /telegrambot/i, name: 'Telegram Bot' },
    { pattern: /applebot/i, name: 'Applebot' },
    { pattern: /semrushbot/i, name: 'SEMrush Bot' },
    { pattern: /ahrefsbot/i, name: 'Ahrefs Bot' },
    { pattern: /dotbot/i, name: 'DotBot' },
    { pattern: /petalbot/i, name: 'PetalBot' },
  ];
  
  for (const bot of bots) {
    if (bot.pattern.test(ua)) {
      return { isBot: true, botName: bot.name };
    }
  }
  
  return { isBot: false };
}

// Fetch geolocation from ipapi.co (most accurate, includes ASN)
async function fetchFromIPAPI(ip: string): Promise<GeoData | null> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Portfolio-Analytics/1.0)',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && !data.error && data.country_name && data.country_name !== 'Unknown') {
        return {
          ip: data.ip || ip,
          city: data.city || 'Unknown',
          region: data.region || data.region_code || 'Unknown',
          country: data.country_name,
          countryCode: data.country_code || data.country || 'XX',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          timezone: data.timezone || 'UTC',
          isp: data.org || data.asn || 'Unknown ISP',
          source: 'ipapi.co',
        };
      }
    }
  } catch (error) {
    console.error('[Geolocation] ipapi.co failed:', error);
  }
  return null;
}

// Fetch geolocation from ip-api.com (good fallback, free tier)
async function fetchFromIPAPIcom(ip: string): Promise<GeoData | null> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,query`, {
      signal: AbortSignal.timeout(8000),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.status === 'success' && data.country && data.country !== 'Unknown') {
        return {
          ip: data.query || ip,
          city: data.city || 'Unknown',
          region: data.regionName || data.region || 'Unknown',
          country: data.country,
          countryCode: data.countryCode || 'XX',
          latitude: data.lat || 0,
          longitude: data.lon || 0,
          timezone: data.timezone || 'UTC',
          isp: data.isp || data.org || data.as || 'Unknown ISP',
          source: 'ip-api.com',
        };
      }
    }
  } catch (error) {
    console.error('[Geolocation] ip-api.com failed:', error);
  }
  return null;
}

// Fetch geolocation from ipwhois.io (reliable fallback)
async function fetchFromIPWhois(ip: string): Promise<GeoData | null> {
  try {
    const response = await fetch(`https://ipwhois.app/json/${ip}`, {
      signal: AbortSignal.timeout(8000),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.success && data.country && data.country !== 'Unknown') {
        return {
          ip: data.ip || ip,
          city: data.city || 'Unknown',
          region: data.region || 'Unknown',
          country: data.country,
          countryCode: data.country_code || 'XX',
          latitude: parseFloat(data.latitude) || 0,
          longitude: parseFloat(data.longitude) || 0,
          timezone: data.timezone?.id || data.timezone || 'UTC',
          isp: data.isp || data.org || data.connection?.isp || 'Unknown ISP',
          source: 'ipwhois.io',
        };
      }
    }
  } catch (error) {
    console.error('[Geolocation] ipwhois.io failed:', error);
  }
  return null;
}

// Fetch geolocation from ipinfo.io (alternative provider)
async function fetchFromIPInfo(ip: string): Promise<GeoData | null> {
  try {
    const response = await fetch(`https://ipinfo.io/${ip}/json`, {
      signal: AbortSignal.timeout(8000),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.country && data.country !== 'Unknown') {
        const [lat, lon] = (data.loc || '0,0').split(',').map((v: string) => parseFloat(v));
        return {
          ip: data.ip || ip,
          city: data.city || 'Unknown',
          region: data.region || 'Unknown',
          country: data.country,
          countryCode: data.country || 'XX',
          latitude: lat || 0,
          longitude: lon || 0,
          timezone: data.timezone || 'UTC',
          isp: data.org || 'Unknown ISP',
          source: 'ipinfo.io',
        };
      }
    }
  } catch (error) {
    console.error('[Geolocation] ipinfo.io failed:', error);
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Check if bot/crawler
    const botCheck = isBotOrCrawler(userAgent);
    
    // Check if private IP
    const isPrivate = isPrivateIP(clientIP);
    
    // If localhost/private network
    if (isPrivate || clientIP === 'unknown') {
      return NextResponse.json({
        ip: 'localhost',
        city: 'Local Development',
        region: 'Local',
        country: botCheck.isBot ? `Bot Crawler - ${botCheck.botName}` : 'LOCAL',
        countryCode: 'LOCAL',
        latitude: 0,
        longitude: 0,
        timezone: 'UTC',
        isp: 'Local Network',
        isLocalhost: true,
        isBot: botCheck.isBot,
        botName: botCheck.botName,
      });
    }
    
    // Try multiple geolocation services with fallback (priority order for accuracy)
    let geoData: GeoData | null = null;
    
    // Try ipapi.co first (most accurate with ASN data)
    geoData = await fetchFromIPAPI(clientIP);
    
    // Fallback to ip-api.com (good accuracy, reliable)
    if (!geoData) {
      geoData = await fetchFromIPAPIcom(clientIP);
    }
    
    // Fallback to ipinfo.io
    if (!geoData) {
      geoData = await fetchFromIPInfo(clientIP);
    }
    
    // Last resort: ipwhois.io
    if (!geoData) {
      geoData = await fetchFromIPWhois(clientIP);
    }
    
    // If all services fail, return basic info with timezone guess
    if (!geoData) {
      return NextResponse.json({
        ip: clientIP,
        city: 'Unknown',
        region: 'Unknown',
        country: botCheck.isBot ? `Bot - ${botCheck.botName}` : 'Unknown',
        countryCode: 'XX',
        latitude: 0,
        longitude: 0,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isp: 'Unknown ISP',
        isBot: botCheck.isBot,
        botName: botCheck.botName,
        source: 'fallback',
      });
    }
    
    // Enhance with bot detection (preserve original country, add bot info)
    const response: GeoData = {
      ...geoData,
      isBot: botCheck.isBot,
      botName: botCheck.botName,
    };
    
    // Optionally enhance country name with bot info for easy identification
    if (botCheck.isBot) {
      response.country = `${geoData.country} - ${botCheck.botName}`;
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[Geolocation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch geolocation' },
      { status: 500 }
    );
  }
}
