# Logging Standards & Guidelines

This document outlines the new logging system implemented to clean up VS Code terminal output while maintaining detailed debugging capabilities in the browser console.

## Overview

The new `smartLogger` system separates logging into two channels:
- **Terminal Logs**: Only critical warnings and errors (clean development experience)
- **Browser Console**: Detailed debugging information (comprehensive development insights)

## Smart Logger Usage

### Import the Logger

```typescript
import { smartLogger } from '@/utils/smartLogger';
```

### Basic Logging Methods

#### Standard Logging (Both Terminal & Browser)
```typescript
// Only shows in terminal if it's a warning or error
// Always shows in browser console with styling
smartLogger.debug('Debug message', { data });
smartLogger.info('Info message', { data });
smartLogger.warn('Warning message', { data });  // Shows in terminal
smartLogger.error('Error message', { data });   // Shows in terminal
```

#### Browser-Only Logging (Detailed Debugging)
```typescript
// Only appears in browser console - perfect for development debugging
smartLogger.browserOnly.debug('Detailed debug info', { data });
smartLogger.browserOnly.info('Browser info', { data });
smartLogger.browserOnly.warn('Browser warning', { data });
smartLogger.browserOnly.log('Browser log', { data });
```

#### Terminal-Only Logging (Critical Messages)
```typescript
// Only appears in VS Code terminal - for critical server-side issues
smartLogger.terminalOnly.warn('Server warning', { data });
smartLogger.terminalOnly.error('Critical server error', { data });
```

#### Development-Only Logging
```typescript
// Only logs in development mode, browser console only
smartLogger.devOnly.debug('Dev debug info', { data });
smartLogger.devOnly.info('Dev info', { data });
smartLogger.devOnly.log('Dev log', { data });
```

### Specialized Logging

#### Firebase Logging
```typescript
// Firebase initialization (browser-only, detailed)
smartLogger.firebase.init('Firebase app initialized', config);

// Firebase debugging (browser-only)
smartLogger.firebase.debug('Firestore query completed', { results });

// Firebase errors (both terminal and browser)
smartLogger.firebase.error('Firebase connection failed', error);
```

#### API Logging
```typescript
// API requests (browser-only, non-verbose)
smartLogger.api.request('POST /api/visitors/track', requestData);

// API warnings (both terminal and browser)
smartLogger.api.warn('API rate limit approaching', { data });

// API errors (both terminal and browser)
smartLogger.api.error('API request failed', error);
```

## Environment-Specific Behavior

### Development Mode
- **Terminal**: Only warnings and errors
- **Browser Console**: Full debugging with styled output
- **Turbo/Webpack**: Suppressed compilation noise
- **Firebase**: Detailed initialization logs in browser only

### Production Mode
- **Terminal**: Only critical errors
- **Browser Console**: Minimal logging
- **Security**: Sensitive data automatically redacted
- **Performance**: Minimal overhead

## Migration Guide

### Before (Old Approach)
```typescript
console.log('🔥 Enhanced visitor tracking route called');
console.log('✅ New visitor created:', uuid);
console.error('❌ Firebase initialization error:', error);
logger.info('Firebase app initialized');
```

### After (New Smart Logger)
```typescript
smartLogger.browserOnly.debug('🔥 Enhanced visitor tracking route called');
smartLogger.browserOnly.info('✅ New visitor created', { uuid });
smartLogger.firebase.error('❌ Firebase initialization error', error);
smartLogger.firebase.init('Firebase app initialized');
```

## Best Practices

### 1. Choose the Right Log Level

**Use `browserOnly` for:**
- Detailed debugging information
- User interaction tracking
- Development-specific insights
- Non-critical operational data

**Use `api` methods for:**
- API request/response logging
- Server-side operation tracking
- Database query results

**Use `firebase` methods for:**
- Firebase initialization
- Firestore operations
- Storage operations

**Use standard methods for:**
- Critical errors that need terminal visibility
- Important warnings
- Production-relevant information

### 2. Context Parameters
Always include a context parameter for better log organization:

```typescript
smartLogger.browserOnly.debug('User action completed', userData, 'user-management');
smartLogger.api.error('Database connection failed', error, 'database');
smartLogger.firebase.init('Storage initialized', config, 'initialization');
```

### 3. Data Structure
Structure your log data consistently:

```typescript
// Good
smartLogger.browserOnly.info('Operation completed', {
  operationType: 'user_registration',
  userId: user.id,
  duration: Date.now() - startTime,
  success: true
});

// Avoid
smartLogger.browserOnly.info('User registered: ' + user.id + ' in ' + duration + 'ms');
```

### 4. Error Handling
Always use appropriate error logging:

```typescript
try {
  await riskyOperation();
  smartLogger.browserOnly.debug('Operation successful');
} catch (error) {
  // Critical errors - show in terminal and browser
  smartLogger.api.error('Operation failed', error);
}
```

## Security Features

### Automatic Data Sanitization
The smart logger automatically redacts sensitive information:

```typescript
const userData = {
  name: 'John Doe',
  apiKey: 'sk-1234567890abcdef',
  uuid: '123e4567-e89b-12d3-a456-426614174000'
};

smartLogger.browserOnly.info('User data processed', userData);
// Output: { name: 'John Doe', apiKey: '[REDACTED]', uuid: '[REDACTED]' }
```

### Sensitive Keys Detected
- API keys, tokens, passwords
- UUIDs, fingerprints, IP addresses
- Firebase config values
- Authentication data

## Configuration

The smart logger can be configured per instance:

```typescript
import { SmartLogger } from '@/utils/smartLogger';

// Custom logger instance
const customLogger = new SmartLogger({
  enableTerminalLogs: false,      // No terminal output
  enableBrowserLogs: true,        // Browser console only
  terminalLogLevel: 'error',      // Only errors in terminal
  browserLogLevel: 'debug',       // Full debugging in browser
  enableProductionLogs: false,    // Minimal production logging
  enableSensitiveData: false,     // Keep data redaction
});
```

## Browser Console Features

The browser console output includes:
- **Color-coded log levels** with custom styling
- **Collapsible groups** for detailed data
- **Timestamps** for all log entries
- **Context labels** for easy filtering
- **Structured data display** with expandable objects

## Performance Impact

- **Development**: Minimal impact, enhanced debugging experience
- **Production**: Near-zero overhead, automatic optimization
- **Memory**: Smart data sanitization prevents memory leaks
- **Network**: No network requests for logging

## Troubleshooting

### Terminal Still Showing Logs?
Check if you're using the correct logger methods:
```typescript
// This will show in terminal (correct for errors)
smartLogger.error('Critical error', error);

// This won't show in terminal (development debugging)
smartLogger.browserOnly.debug('Debug info', data);
```

### Browser Console Not Showing Logs?
Ensure you're in development mode and check browser console filters:
- Open DevTools (F12)
- Check console filter settings
- Look for grouped log entries
- Verify log level settings

### Production Logs Not Working?
Production logging is intentionally minimal:
```typescript
// Use prodLogger for production-specific logging
import { prodLogger } from '@/utils/smartLogger';
prodLogger.error('Production error', error);
```

## Summary

This logging system provides:
- ✅ **Clean terminal output** during development
- ✅ **Comprehensive browser debugging** capabilities
- ✅ **Automatic security redaction** of sensitive data
- ✅ **Environment-specific behavior** (dev vs prod)
- ✅ **Performance optimization** with minimal overhead
- ✅ **Easy migration path** from existing console.log statements

For questions or issues, refer to the `utils/smartLogger.ts` implementation or create an issue in the project repository.