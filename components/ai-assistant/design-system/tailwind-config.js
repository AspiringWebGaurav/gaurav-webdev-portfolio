// Enhanced Tailwind Configuration for Enterprise AI Assistant
// This extends the existing tailwind.config.ts with enterprise design tokens

const designTokens = require('./tokens.json');

const enterpriseConfig = {
  theme: {
    extend: {
      colors: {
        // Enterprise AI Assistant Colors
        'ai-primary': {
          navy: designTokens.colors.primary.navy,
          slate: designTokens.colors.primary.slate,
          blue: designTokens.colors.primary.blue,
          'blue-light': designTokens.colors.primary['blue-light'],
          'blue-dark': designTokens.colors.primary['blue-dark'],
        },
        'ai-secondary': {
          emerald: designTokens.colors.secondary.emerald,
          amber: designTokens.colors.secondary.amber,
          red: designTokens.colors.secondary.red,
        },
        'ai-surface': {
          primary: designTokens.colors.surface.primary,
          secondary: designTokens.colors.surface.secondary,
          tertiary: designTokens.colors.surface.tertiary,
          dark: designTokens.colors.surface.dark,
          'dark-secondary': designTokens.colors.surface['dark-secondary'],
        },
        'ai-text': {
          primary: designTokens.colors.text.primary,
          secondary: designTokens.colors.text.secondary,
          tertiary: designTokens.colors.text.tertiary,
          inverse: designTokens.colors.text.inverse,
          muted: designTokens.colors.text.muted,
        },
        'ai-border': {
          light: designTokens.colors.border.light,
          medium: designTokens.colors.border.medium,
          dark: designTokens.colors.border.dark,
        }
      },
      fontFamily: {
        'ai-primary': designTokens.typography.fontFamily.primary.split(', '),
        'ai-mono': designTokens.typography.fontFamily.mono.split(', '),
      },
      fontSize: {
        'ai-xs': designTokens.typography.fontSize.xs,
        'ai-sm': designTokens.typography.fontSize.sm,
        'ai-base': designTokens.typography.fontSize.base,
        'ai-lg': designTokens.typography.fontSize.lg,
        'ai-xl': designTokens.typography.fontSize.xl,
        'ai-2xl': designTokens.typography.fontSize['2xl'],
        'ai-3xl': designTokens.typography.fontSize['3xl'],
        'ai-4xl': designTokens.typography.fontSize['4xl'],
      },
      spacing: {
        'ai-xs': designTokens.spacing.xs,
        'ai-sm': designTokens.spacing.sm,
        'ai-md': designTokens.spacing.md,
        'ai-lg': designTokens.spacing.lg,
        'ai-xl': designTokens.spacing.xl,
        'ai-2xl': designTokens.spacing['2xl'],
        'ai-3xl': designTokens.spacing['3xl'],
      },
      borderRadius: {
        'ai-sm': designTokens.borderRadius.sm,
        'ai-md': designTokens.borderRadius.md,
        'ai-lg': designTokens.borderRadius.lg,
        'ai-xl': designTokens.borderRadius.xl,
        'ai-2xl': designTokens.borderRadius['2xl'],
      },
      boxShadow: {
        'ai-sm': designTokens.colors.shadow.sm,
        'ai-md': designTokens.colors.shadow.md,
        'ai-lg': designTokens.colors.shadow.lg,
        'ai-xl': designTokens.colors.shadow.xl,
      },
      animation: {
        'ai-fade-in': 'ai-fade-in 0.3s ease-out',
        'ai-slide-up': 'ai-slide-up 0.3s ease-out',
        'ai-scale-in': 'ai-scale-in 0.2s ease-out',
        'ai-jarvis-pulse': 'ai-jarvis-pulse 2s ease-in-out infinite',
        'ai-jarvis-scan': 'ai-jarvis-scan 3s linear infinite',
      },
      keyframes: {
        'ai-fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'ai-slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'ai-scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'ai-jarvis-pulse': {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'ai-jarvis-scan': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      transitionDuration: {
        'ai-fast': designTokens.animation.duration.fast,
        'ai-normal': designTokens.animation.duration.normal,
        'ai-slow': designTokens.animation.duration.slow,
      },
      transitionTimingFunction: {
        'ai-ease': designTokens.animation.easing.ease,
        'ai-ease-in': designTokens.animation.easing['ease-in'],
        'ai-ease-out': designTokens.animation.easing['ease-out'],
        'ai-ease-in-out': designTokens.animation.easing['ease-in-out'],
      }
    }
  }
};

module.exports = enterpriseConfig;