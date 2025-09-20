/**
 * Contact Form Submission API Route
 * POST /api/contact
 * Handles contact form submissions with Turnstile verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyTurnstileToken, getClientIP, checkRateLimit } from '@/lib/turnstile';
import { 
  ContactFormRequest, 
  ContactFormResponse, 
  ContactFormData 
} from '@/lib/types/turnstile';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ContactFormRequest = await request.json();
    const { formData, token } = body;

    // Get client IP for rate limiting and logging
    const clientIP = getClientIP(request.headers);
    const rateLimitKey = `contact-${clientIP || 'anonymous'}`;

    // Rate limiting - 3 contact attempts per 10 minutes per IP
    if (!checkRateLimit(rateLimitKey, 3, 600000)) {
      console.warn(`[Contact API] Rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Too many contact attempts. Please try again later.',
          errors: ['RATE_LIMIT_EXCEEDED']
        } as ContactFormResponse,
        { status: 429 }
      );
    }

    // Validate required fields
    const validation = validateContactForm(formData);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please fill in all required fields correctly.',
          errors: validation.errors
        } as ContactFormResponse,
        { status: 400 }
      );
    }

    // Validate Turnstile token
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Security verification required. Please try again.',
          errors: ['MISSING_TURNSTILE_TOKEN']
        } as ContactFormResponse,
        { status: 400 }
      );
    }

    console.log(`[Contact API] Verifying Turnstile for contact form from IP: ${clientIP}`);

    // Verify Turnstile token
    const verificationResult = await verifyTurnstileToken(token, clientIP);

    if (!verificationResult.success) {
      console.warn(`[Contact API] Turnstile verification failed for IP: ${clientIP}`, {
        errors: verificationResult.errors
      });
      
      return NextResponse.json(
        {
          success: false,
          message: 'Security verification failed. Please try again.',
          errors: verificationResult.errors || ['TURNSTILE_VERIFICATION_FAILED']
        } as ContactFormResponse,
        { status: 400 }
      );
    }

    console.log(`[Contact API] Turnstile verified successfully for contact from: ${formData.name} <${formData.email}>`);

    // Process the contact form (send email, save to database, etc.)
    const processResult = await processContactForm(formData, clientIP);

    if (!processResult.success) {
      console.error(`[Contact API] Failed to process contact form for IP: ${clientIP}`, processResult.error);
      
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send your message. Please try again later.',
          errors: ['PROCESSING_ERROR']
        } as ContactFormResponse,
        { status: 500 }
      );
    }

    // Log successful contact submission (without sensitive data)
    console.log(`[Contact API] Contact form submitted successfully from: ${formData.name} <${formData.email}>`);

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your message! I\'ll get back to you soon.'
      } as ContactFormResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error('[Contact API] Unexpected error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred. Please try again later.',
        errors: ['INTERNAL_ERROR']
      } as ContactFormResponse,
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

/**
 * Validate contact form data
 * @param formData - Contact form data to validate
 * @returns Validation result
 */
function validateContactForm(formData: ContactFormData): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];

  // Validate name
  if (!formData.name || typeof formData.name !== 'string') {
    errors.push('NAME_REQUIRED');
  } else if (formData.name.trim().length < 2) {
    errors.push('NAME_TOO_SHORT');
  } else if (formData.name.length > 100) {
    errors.push('NAME_TOO_LONG');
  }

  // Validate email
  if (!formData.email || typeof formData.email !== 'string') {
    errors.push('EMAIL_REQUIRED');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.push('EMAIL_INVALID');
    } else if (formData.email.length > 254) {
      errors.push('EMAIL_TOO_LONG');
    }
  }

  // Validate message
  if (!formData.message || typeof formData.message !== 'string') {
    errors.push('MESSAGE_REQUIRED');
  } else if (formData.message.trim().length < 10) {
    errors.push('MESSAGE_TOO_SHORT');
  } else if (formData.message.length > 5000) {
    errors.push('MESSAGE_TOO_LONG');
  }

  // Basic spam detection
  const spamKeywords = ['viagra', 'casino', 'lottery', 'winner', 'congratulations'];
  const content = `${formData.name} ${formData.email} ${formData.message}`.toLowerCase();
  
  for (const keyword of spamKeywords) {
    if (content.includes(keyword)) {
      errors.push('POTENTIAL_SPAM');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Process contact form submission
 * This is a stub implementation - integrate with your email service
 * @param formData - Validated contact form data
 * @param clientIP - Client IP address
 * @returns Processing result
 */
async function processContactForm(
  formData: ContactFormData, 
  clientIP?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // STUB: Replace this with your actual email service integration
    // Examples: EmailJS, SendGrid, Nodemailer, etc.
    
    console.log('[Contact Processing] Processing contact form submission:', {
      name: formData.name,
      email: formData.email,
      messageLength: formData.message.length,
      clientIP,
      timestamp: new Date().toISOString()
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // EXAMPLE: EmailJS Integration (uncomment and configure)
    /*
    const emailjs = require('@emailjs/nodejs');
    
    const templateParams = {
      from_name: formData.name,
      from_email: formData.email,
      message: formData.message,
      to_email: 'your-email@example.com'
    };

    await emailjs.send(
      'your_service_id',
      'your_template_id',
      templateParams,
      {
        publicKey: 'your_public_key',
        privateKey: 'your_private_key'
      }
    );
    */

    // EXAMPLE: Save to database (uncomment and configure)
    /*
    await saveContactToDatabase({
      name: formData.name,
      email: formData.email,
      message: formData.message,
      clientIP,
      createdAt: new Date()
    });
    */

    console.log('[Contact Processing] Contact form processed successfully');
    
    return { success: true };

  } catch (error) {
    console.error('[Contact Processing] Error processing contact form:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Save contact form submission to database
 * This is a stub - implement with your preferred database
 */
/*
async function saveContactToDatabase(contact: {
  name: string;
  email: string;
  message: string;
  clientIP?: string;
  createdAt: Date;
}) {
  // Implement database saving logic here
  // Examples: PostgreSQL, MongoDB, Firebase Firestore, etc.
}
*/