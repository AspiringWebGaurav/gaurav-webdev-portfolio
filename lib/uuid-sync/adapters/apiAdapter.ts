/**
 * API Adapter - Integration with Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { identifyVisitor } from '../services/identityService';
import { translateMaskToUUID, translateUUIDToMask } from '../services/maskTranslator';
import { validateMask } from '../core/validator';
import { log, logError } from '../utils';
import { IdentifyResponse, TranslateResponse } from '../types';

/**
 * Handle visitor identification from API route
 */
export async function apiIdentifyVisitor(
  request: NextRequest
): Promise<NextResponse<IdentifyResponse>> {
  try {
    const body = await request.json();
    const { fingerprint } = body;

    if (!fingerprint) {
      return NextResponse.json(
        { mask: '', success: false },
        { status: 400 }
      );
    }

    const mask = await identifyVisitor(fingerprint);

    return NextResponse.json({
      mask,
      success: true,
    });
  } catch (error) {
    logError('API identify visitor failed', error);
    return NextResponse.json(
      { mask: '', success: false },
      { status: 500 }
    );
  }
}

/**
 * Translate mask to UUID (server-side only)
 */
export async function apiTranslateMaskToUUID(
  mask: string
): Promise<{ uuid: string | null; error?: string }> {
  try {
    validateMask(mask);
    const uuid = await translateMaskToUUID(mask);
    return { uuid };
  } catch (error: any) {
    logError('API translate mask failed', error);
    return { uuid: null, error: error.message };
  }
}

/**
 * Translate UUID to mask (for display)
 */
export async function apiTranslateUUIDToMask(
  uuid: string
): Promise<{ mask: string | null; error?: string }> {
  try {
    const mask = await translateUUIDToMask(uuid);
    return { mask };
  } catch (error: any) {
    logError('API translate UUID failed', error);
    return { mask: null, error: error.message };
  }
}

/**
 * Extract mask from API request body
 */
export function extractMaskFromRequest(body: any): string | null {
  return body.mask || null;
}

/**
 * Middleware: Extract mask and translate to UUID
 * Use this in API routes that need UUID
 */
export async function withUUIDFromMask(
  body: any,
  handler: (uuid: string, body: any) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const mask = extractMaskFromRequest(body);

    if (!mask) {
      return NextResponse.json(
        { error: 'Missing mask' },
        { status: 400 }
      );
    }

    const { uuid, error } = await apiTranslateMaskToUUID(mask);

    if (!uuid || error) {
      return NextResponse.json(
        { error: error || 'Invalid mask' },
        { status: 400 }
      );
    }

    // Call handler with resolved UUID
    return await handler(uuid, body);
  } catch (error: any) {
    logError('withUUIDFromMask middleware failed', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
