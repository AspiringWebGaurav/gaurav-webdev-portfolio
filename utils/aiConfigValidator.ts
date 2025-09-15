// AI Configuration Validator
// Utility to validate and verify AI configuration across environments

interface AIConfigStatus {
  isConfigured: boolean;
  hasValidKey: boolean;
  environment: string;
  keySource: 'manual' | 'environment' | 'missing';
  issues: string[];
  recommendations: string[];
}

export class AIConfigValidator {
  static validateConfig(): AIConfigStatus {
    const environment = process.env.NODE_ENV || 'development';
    const envKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    const serverKey = process.env.OPENROUTER_API_KEY;
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check API key availability
    let keySource: 'manual' | 'environment' | 'missing' = 'missing';
    let hasValidKey = false;
    let finalKey = '';
    
    if (envKey) {
      keySource = 'environment';
      finalKey = envKey;
    } else if (serverKey) {
      keySource = 'environment';
      finalKey = serverKey;
      issues.push('Only server-side API key found. Client-side key recommended for direct API calls.');
    }
    
    // Validate key format
    if (finalKey) {
      if (finalKey.startsWith('sk-or-v1-')) {
        hasValidKey = true;
      } else {
        issues.push('API key format is invalid. Should start with "sk-or-v1-"');
        recommendations.push('Get a valid OpenRouter API key from https://openrouter.ai/keys');
      }
    } else {
      issues.push('No OpenRouter API key found in environment variables');
      recommendations.push('Add NEXT_PUBLIC_OPENROUTER_API_KEY to your .env.local file');
    }
    
    // Environment-specific checks
    if (environment === 'production') {
      if (!hasValidKey) {
        issues.push('Production environment requires valid API key');
        recommendations.push('Ensure API key is set in production environment variables');
      }
      
      if (envKey && serverKey && envKey !== serverKey) {
        issues.push('Client and server API keys differ in production');
        recommendations.push('Use the same API key for both NEXT_PUBLIC_OPENROUTER_API_KEY and OPENROUTER_API_KEY');
      }
    }
    
    // Generate recommendations
    if (hasValidKey && environment === 'development') {
      recommendations.push('AI functionality should work correctly');
    }
    
    if (!hasValidKey) {
      recommendations.push('The AI Assistant will run in demo mode until a valid API key is configured');
    }
    
    return {
      isConfigured: hasValidKey,
      hasValidKey,
      environment,
      keySource,
      issues,
      recommendations
    };
  }
  
  static logConfigStatus(): void {
    const status = this.validateConfig();
    
    console.group('🔍 AI Configuration Status');
    console.log('Environment:', status.environment);
    console.log('Is Configured:', status.isConfigured ? '✅ Yes' : '❌ No');
    console.log('Has Valid Key:', status.hasValidKey ? '✅ Yes' : '❌ No');
    console.log('Key Source:', status.keySource);
    
    if (status.issues.length > 0) {
      console.group('⚠️ Issues Found');
      status.issues.forEach(issue => console.log(`- ${issue}`));
      console.groupEnd();
    }
    
    if (status.recommendations.length > 0) {
      console.group('💡 Recommendations');
      status.recommendations.forEach(rec => console.log(`- ${rec}`));
      console.groupEnd();
    }
    
    console.groupEnd();
  }
  
  static getQuickStatus(): 'enabled' | 'demo' | 'error' {
    const status = this.validateConfig();
    
    if (status.hasValidKey && status.isConfigured) {
      return 'enabled';
    } else if (status.issues.length === 0 || status.keySource === 'missing') {
      return 'demo';
    } else {
      return 'error';
    }
  }
}

// Export convenience functions
export const validateAIConfig = () => AIConfigValidator.validateConfig();
export const logAIConfigStatus = () => AIConfigValidator.logConfigStatus();
export const getAIQuickStatus = () => AIConfigValidator.getQuickStatus();

export default AIConfigValidator;