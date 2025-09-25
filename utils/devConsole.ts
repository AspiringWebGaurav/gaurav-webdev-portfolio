// utils/devConsole.ts
// Development console utility for clean production builds

const isDev = process.env.NODE_ENV === 'development';

export const devConsole = {
  log: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[DEV] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (isDev) {
      console.warn(`[DEV] ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: any[]) => {
    if (isDev) {
      console.error(`[DEV] ${message}`, ...args);
    } else {
      // In production, still log errors but without sensitive details
      console.error('[ERROR] An error occurred');
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (isDev) {
      console.info(`[DEV] ${message}`, ...args);
    }
  },
  
  group: (label: string) => {
    if (isDev) {
      console.group(`[DEV] ${label}`);
    }
  },
  
  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  },
  
  time: (label: string) => {
    if (isDev) {
      console.time(`[DEV] ${label}`);
    }
  },
  
  timeEnd: (label: string) => {
    if (isDev) {
      console.timeEnd(`[DEV] ${label}`);
    }
  }
};

export default devConsole;