import { NextRequest, NextResponse } from 'next/server';
import { OPENROUTER_MODELS, SYSTEM_PROMPT } from '@/components/ai-assistant/types';
import { prodLogger, devLogger } from '@/utils/secureLogger';

// Enhanced error handling and retry logic
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let attempt = 0;
  
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      devLogger.warn('Invalid message format received', { messageType: typeof message });
      return NextResponse.json(
        { success: false, error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length > 1000) {
      devLogger.warn('Message too long', { length: message.length });
      return NextResponse.json(
        { success: false, error: 'Message is too long. Please keep it under 1000 characters.' },
        { status: 400 }
      );
    }

    // Get OpenRouter API key with enhanced validation
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      prodLogger.error('OpenRouter API key not found in environment variables');
      return NextResponse.json(
        {
          success: false,
          error: 'AI service configuration error. Please contact support.',
          fallback: true
        },
        { status: 503 }
      );
    }

    // Validate API key format
    if (!apiKey.startsWith('sk-or-v1-')) {
      prodLogger.error('Invalid OpenRouter API key format');
      return NextResponse.json(
        {
          success: false,
          error: 'AI service configuration error. Please contact support.',
          fallback: true
        },
        { status: 503 }
      );
    }

    devLogger.debug('Processing chat message', {
      messageLength: message.length,
      timestamp: new Date().toISOString()
    });

    // Check if message is portfolio-related
    const portfolioKeywords = [
      'gaurav', 'portfolio', 'project', 'skill', 'experience', 'work', 'resume',
      'contact', 'about', 'developer', 'frontend', 'react', 'nextjs', 'javascript',
      'typescript', 'css', 'html', 'web', 'development', 'coding', 'programming'
    ];

    const isPortfolioRelated = portfolioKeywords.some(keyword =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    // If not portfolio-related, return polite redirect
    if (!isPortfolioRelated) {
      devLogger.debug('Non-portfolio related question received');
      return NextResponse.json({
        success: true,
        data: {
          message: "Sorry, I can only answer questions about Gaurav's portfolio. Feel free to ask about his projects, skills, experience, or how to contact him!",
          messageId: Date.now().toString(),
          source: 'redirect'
        }
      });
    }

    // Prepare OpenRouter request
    const openRouterRequest = {
      model: OPENROUTER_MODELS.GPT_3_5_TURBO,
      messages: [
        {
          role: 'system' as const,
          content: SYSTEM_PROMPT
        },
        {
          role: 'user' as const,
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    };

    // Get the site URL dynamically for Vercel deployment
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                   'http://localhost:3000');

    // Enhanced retry logic for OpenRouter API
    let lastError: Error | null = null;
    
    for (attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        devLogger.debug(`OpenRouter API attempt ${attempt}/${MAX_RETRIES}`);
        
        // Call OpenRouter API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': siteUrl,
            'X-Title': 'Gaurav Portfolio Assistant'
          },
          body: JSON.stringify(openRouterRequest),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
          
          // If it's a client error (4xx), don't retry
          if (response.status >= 400 && response.status < 500) {
            prodLogger.error('OpenRouter client error (no retry)', {
              status: response.status,
              error: errorText
            });
            
            return NextResponse.json(
              {
                success: false,
                error: response.status === 401 ? 'AI service authentication failed' :
                       response.status === 429 ? 'AI service rate limit exceeded. Please try again in a moment.' :
                       'AI service request failed. Please check your input and try again.',
                fallback: true
              },
              { status: response.status }
            );
          }
          
          throw error;
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid OpenRouter response structure');
        }

        const aiMessage = data.choices[0].message.content;

        // Log successful usage
        devLogger.debug('OpenRouter API success', {
          attempt,
          prompt_tokens: data.usage?.prompt_tokens || 0,
          completion_tokens: data.usage?.completion_tokens || 0,
          total_tokens: data.usage?.total_tokens || 0,
          model: data.model,
          duration: Date.now() - startTime
        });

        return NextResponse.json({
          success: true,
          data: {
            message: aiMessage,
            messageId: Date.now().toString(),
            model: data.model,
            usage: data.usage,
            source: 'api',
            attempt,
            duration: Date.now() - startTime
          }
        });

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        devLogger.warn(`OpenRouter API attempt ${attempt} failed`, {
          error: lastError.message,
          attempt,
          maxRetries: MAX_RETRIES
        });

        // If it's the last attempt, don't wait
        if (attempt === MAX_RETRIES) {
          break;
        }

        // Wait before retrying with exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
        devLogger.debug(`Waiting ${delay}ms before retry...`);
        await sleep(delay);
      }
    }

    // All retries failed
    prodLogger.error('OpenRouter API failed after all retries', {
      error: lastError?.message,
      attempts: MAX_RETRIES,
      duration: Date.now() - startTime
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'AI service is temporarily unavailable. Please try the predefined questions or try again later.',
        fallback: true,
        attempts: MAX_RETRIES
      },
      { status: 503 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    prodLogger.error('Chat API unexpected error', {
      error: errorMessage,
      duration: Date.now() - startTime
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try the predefined questions or try again later.',
        fallback: true
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  // Get the origin from the request
  const origin = request.headers.get('origin') || '*';
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}