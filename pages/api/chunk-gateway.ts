import { NextApiRequest, NextApiResponse } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

interface ChunkRequest {
  chunks: string[];
  buildId: string;
}

interface ChunkResponse {
  bundle: string;
  contentType: string;
  etag: string;
}

export default async function chunkGateway(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chunks, buildId } = req.body as ChunkRequest;
    
    // Validate request
    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({ error: 'Invalid chunks array' });
    }

    // Security: Validate chunk names
    const validChunks = chunks.filter(chunk => 
      /^[a-zA-Z0-9._-]+\.js$/.test(chunk) && !chunk.includes('..')
    );

    if (validChunks.length !== chunks.length) {
      return res.status(400).json({ error: 'Invalid chunk names detected' });
    }

    // Bundle critical chunks
    const bundle = await bundleChunks(validChunks, buildId);
    const etag = generateETag(bundle);
    
    // Check client cache
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    // Compress response
    const compressed = await gzipAsync(bundle);
    
    // Set aggressive caching headers
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', etag);
    res.setHeader('X-Chunk-Gateway', 'enterprise');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.status(200).send(compressed);
    
  } catch (error) {
    console.error('Chunk gateway error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

async function bundleChunks(chunks: string[], buildId: string): Promise<string> {
  const staticPath = join(process.cwd(), '.next', 'static', 'chunks');
  const bundledChunks: string[] = [];
  
  for (const chunkName of chunks) {
    try {
      const chunkPath = join(staticPath, chunkName);
      const chunkContent = readFileSync(chunkPath, 'utf-8');
      
      // Wrap chunk in IIFE to prevent scope pollution
      const wrappedChunk = `
        (function() {
          // Chunk: ${chunkName}
          ${chunkContent}
        })();
      `;
      
      bundledChunks.push(wrappedChunk);
      
    } catch (error) {
      console.warn(`Failed to load chunk ${chunkName}:`, (error as Error).message);
      // Continue with available chunks
    }
  }
  
  if (bundledChunks.length === 0) {
    throw new Error('No chunks could be loaded');
  }
  
  // Add bundle metadata
  const bundleHeader = `
    // Enterprise Chunk Gateway Bundle
    // Build ID: ${buildId}
    // Chunks: ${chunks.join(', ')}
    // Generated: ${new Date().toISOString()}
    
  `;
  
  return bundleHeader + bundledChunks.join('\n\n');
}

function generateETag(content: string): string {
  const crypto = require('crypto');
  return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
}