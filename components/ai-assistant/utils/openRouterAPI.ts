/**
 * OpenRouter API Integration
 * Provides real AI chat functionality with intelligent routing
 */

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

class OpenRouterAPI {
  private apiKey: string;
  private baseURL: string = 'https://openrouter.ai/api/v1';
  private defaultConfig: ChatConfig = {
    model: 'anthropic/claude-3-haiku',
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  };

  constructor(apiKey?: string) {
    const envKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    this.apiKey = apiKey || envKey || '';
    
    // Production-safe logging
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 OpenRouter API Initialization');
      console.log('Manual API Key:', apiKey ? '✅ Provided' : '❌ Not provided');
      console.log('Environment Key:', envKey ? '✅ Found' : '❌ Not found');
      console.log('Final API Key:', this.apiKey ? '✅ Available' : '❌ Missing');
      console.log('API Key Format Valid:', this.apiKey.startsWith('sk-or-v1-') ? '✅ Valid' : '❌ Invalid');
      console.log('isConfigured():', this.isConfigured());
      console.groupEnd();
    }
  }

  /**
   * Check if API is properly configured
   */
  isConfigured(): boolean {
    const isConfigured = !!this.apiKey && this.apiKey.startsWith('sk-or-v1-');
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 isConfigured() check:', {
        hasApiKey: !!this.apiKey,
        validFormat: this.apiKey.startsWith('sk-or-v1-'),
        result: isConfigured
      });
    }
    
    return isConfigured;
  }

  /**
   * Generate system prompt based on user context
   */
  private generateSystemPrompt(): string {
    return `You are Gaurav Patil's AI Assistant, an intelligent and helpful assistant representing Gaurav's portfolio. 

About Gaurav:
- Full-stack developer with expertise in React, Next.js, Node.js, Python, and modern web technologies
- Experienced in building scalable applications, AI integrations, and enterprise solutions
- Passionate about clean code, user experience, and innovative problem-solving
- Currently working on smart tracking systems and portfolio optimization
- Strong background in both frontend and backend development

Your role:
- Answer questions about Gaurav's skills, projects, experience, and capabilities
- Provide insights into his development approach and methodologies
- Help visitors understand his technical expertise and project portfolio
- Be professional, knowledgeable, and engaging
- If asked about specific projects, focus on the technical aspects and problem-solving approaches
- For contact or hiring inquiries, encourage visitors to reach out through the provided contact methods

Keep responses concise but informative, and always maintain a professional tone that reflects Gaurav's expertise.`;
  }

  /**
   * Generate intelligent suggested prompts based on user input
   */
  generateSuggestedPrompts(userInput: string): string[] {
    const input = userInput.toLowerCase();
    
    // Context-aware prompt suggestions
    if (input.includes('project') || input.includes('work')) {
      return [
        "Tell me about Gaurav's most challenging project",
        "What technologies does Gaurav prefer for new projects?",
        "How does Gaurav approach project planning?",
        "What makes Gaurav's projects stand out?"
      ];
    }
    
    if (input.includes('skill') || input.includes('technology') || input.includes('tech')) {
      return [
        "What are Gaurav's core technical skills?",
        "How does Gaurav stay updated with new technologies?",
        "What's Gaurav's preferred development stack?",
        "Which programming languages is Gaurav most proficient in?"
      ];
    }
    
    if (input.includes('experience') || input.includes('career')) {
      return [
        "Tell me about Gaurav's professional journey",
        "What industries has Gaurav worked in?",
        "How many years of experience does Gaurav have?",
        "What are Gaurav's career achievements?"
      ];
    }
    
    if (input.includes('contact') || input.includes('hire') || input.includes('work together')) {
      return [
        "How can I get in touch with Gaurav?",
        "Is Gaurav available for new projects?",
        "What's the best way to collaborate with Gaurav?",
        "Does Gaurav work on freelance projects?"
      ];
    }
    
    // Default suggestions
    return [
      "What makes Gaurav's development approach unique?",
      "Tell me about Gaurav's problem-solving methodology",
      "How does Gaurav ensure code quality?",
      "What are Gaurav's future goals in tech?"
    ];
  }

  /**
   * Send chat completion request to OpenRouter
   */
  async sendMessage(
    messages: OpenRouterMessage[],
    config?: Partial<ChatConfig>
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter API key not configured');
    }

    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Add system prompt if not present
    const systemMessage: OpenRouterMessage = {
      role: 'system',
      content: this.generateSystemPrompt()
    };
    
    const hasSystemMessage = messages.some(msg => msg.role === 'system');
    const finalMessages = hasSystemMessage ? messages : [systemMessage, ...messages];

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Gaurav Patil Portfolio'
        },
        body: JSON.stringify({
          model: finalConfig.model,
          messages: finalMessages,
          temperature: finalConfig.temperature,
          max_tokens: finalConfig.max_tokens,
          top_p: finalConfig.top_p,
          frequency_penalty: finalConfig.frequency_penalty,
          presence_penalty: finalConfig.presence_penalty,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `OpenRouter API error: ${response.status} ${response.statusText}`
        );
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response generated from OpenRouter API');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to communicate with AI service');
    }
  }

  /**
   * Check API configuration (simplified - no network calls)
   */
  checkHealth(): boolean {
    const isConfigured = this.isConfigured();
    
    // Production-safe logging
    if (process.env.NODE_ENV === 'development') {
      if (isConfigured) {
        console.log('✅ OpenRouter API: Ready (API key configured)');
      } else {
        console.warn('⚠️ OpenRouter API: Not configured (missing API key)');
      }
    }
    
    return isConfigured;
  }

  /**
   * Get available models (for future enhancement)
   */
  async getAvailableModels(): Promise<string[]> {
    // This would require additional API endpoint
    // For now, return commonly available models
    return [
      'anthropic/claude-3-haiku',
      'anthropic/claude-3-sonnet',
      'openai/gpt-3.5-turbo',
      'openai/gpt-4',
      'meta-llama/llama-2-70b-chat'
    ];
  }
}

// Export singleton instance
export const openRouterAPI = new OpenRouterAPI();

// Export utility functions
export const isAIEnabled = () => openRouterAPI.isConfigured();

export const generateContextualPrompts = (input: string) => 
  openRouterAPI.generateSuggestedPrompts(input);

export default OpenRouterAPI;