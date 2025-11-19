import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy download endpoint - Forces file download instead of opening in browser
 * This solves the issue where Firebase Storage serves PDFs with Content-Disposition: inline
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const fileName = searchParams.get('name');

    if (!fileUrl || !fileName) {
      return NextResponse.json(
        { error: 'Missing url or name parameter' },
        { status: 400 }
      );
    }

    // Fetch the file from Firebase Storage
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch file from storage' },
        { status: response.status }
      );
    }

    // Get the file as ArrayBuffer
    const fileBuffer = await response.arrayBuffer();

    // Return the file with proper headers that FORCE download
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`, // KEY: attachment forces download
        'Content-Length': fileBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Download proxy error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}
