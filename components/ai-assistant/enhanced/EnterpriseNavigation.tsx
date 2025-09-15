"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button, Badge, Tooltip, Icons } from '../design-system/components';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  shortcut?: string;
  badge?: {
    text: string;
    variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  };
}

interface EnterpriseNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'portfolio',
    label: 'Portfolio Home',
    icon: Icons.Home,
    description: 'Return to main portfolio view',
    shortcut: 'P'
  },
  {
    id: 'predefined',
    label: 'Quick Questions',
    icon: Icons.Question,
    description: 'Pre-written questions about Gaurav',
    shortcut: 'Q',
    badge: {
      text: 'Popular',
      variant: 'info'
    }
  },
  {
    id: 'chat',
    label: 'AI Chat',
    icon: Icons.Chat,
    description: 'Chat directly with AI assistant',
    shortcut: 'C'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Icons.Settings,
    description: 'Customize your experience',
    shortcut: 'S'
  }
];

const EnterpriseNavigation: React.FC<EnterpriseNavigationProps> = ({
  activeTab,
  onTabChange,
  className,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when Alt is pressed (to avoid conflicts)
      if (!event.altKey) return;

      const item = NAVIGATION_ITEMS.find(item => 
        item.shortcut?.toLowerCase() === event.key.toLowerCase()
      );

      if (item) {
        event.preventDefault();
        onTabChange(item.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTabChange]);

  const NavigationButton: React.FC<{ item: NavigationItem }> = ({ item }) => {
    const isActive = activeTab === item.id;
    const isHovered = hoveredItem === item.id;

    const buttonContent = (
      <Button
        variant={isActive ? 'primary' : 'ghost'}
        size="sm"
        className={cn(
          'w-full justify-start transition-all duration-200 group relative h-10',
          isCollapsed ? 'px-2' : 'px-3',
          isActive && 'shadow-sm',
          !isActive && 'hover:bg-ai-surface-tertiary hover:border-ai-border-medium'
        )}
        onClick={() => onTabChange(item.id)}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {/* Icon */}
        <item.icon
          className={cn(
            'w-4 h-4 transition-colors duration-200 flex-shrink-0',
            isActive ? 'text-white' : 'text-ai-text-secondary group-hover:text-ai-primary-blue'
          )}
        />
        
        {/* Label and Badge */}
        {!isCollapsed && (
          <>
            <span className={cn(
              'ml-2 font-medium transition-colors duration-200 text-sm',
              isActive ? 'text-white' : 'text-ai-text-primary'
            )}>
              {item.label}
            </span>
            
            {item.badge && (
              <Badge
                variant={item.badge.variant}
                size="sm"
                className="ml-auto text-xs"
              >
                {item.badge.text}
              </Badge>
            )}
          </>
        )}

        {/* Keyboard shortcut indicator */}
        {!isCollapsed && item.shortcut && !item.badge && (
          <div className={cn(
            'ml-auto px-1 py-0.5 rounded text-xs font-mono border transition-colors duration-200',
            isActive
              ? 'bg-white/20 text-white border-white/30'
              : 'bg-ai-surface-tertiary text-ai-text-tertiary border-ai-border-light group-hover:border-ai-primary-blue/30'
          )}>
            Alt+{item.shortcut}
          </div>
        )}

        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
        )}
      </Button>
    );

    // Wrap with tooltip when collapsed
    if (isCollapsed) {
      return (
        <Tooltip content={`${item.label} - ${item.description}`} position="right">
          {buttonContent}
        </Tooltip>
      );
    }

    return buttonContent;
  };

  return (
    <nav className={cn(
      'flex flex-col bg-ai-surface-secondary border-r border-ai-border-light transition-all duration-300',
      isCollapsed ? 'w-14' : 'w-56',
      className
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between p-4 border-b border-ai-border-light',
        isCollapsed && 'justify-center'
      )}>
        {!isCollapsed && (
          <div>
            <h2 className="font-semibold text-ai-text-primary">
              Gaurav's Assistant
            </h2>
            <p className="text-xs text-ai-text-secondary mt-1">
              AI-powered portfolio guide
            </p>
          </div>
        )}
        
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-2"
            aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            <Icons.ChevronRight 
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                isCollapsed ? 'rotate-0' : 'rotate-180'
              )} 
            />
          </Button>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-2 space-y-1">
        {NAVIGATION_ITEMS.map((item) => (
          <NavigationButton key={item.id} item={item} />
        ))}
      </div>

      {/* Help Section */}
      <div className={cn(
        'p-3 border-t border-ai-border-light',
        isCollapsed && 'px-2'
      )}>
        {!isCollapsed ? (
          <div className="bg-ai-primary-blue/10 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-ai-primary-blue/20 flex items-center justify-center">
                <span className="text-xs">💡</span>
              </div>
              <span className="text-sm font-medium text-ai-text-primary">
                Quick Help
              </span>
            </div>
            <p className="text-xs text-ai-text-secondary leading-relaxed">
              Use <kbd className="px-1 py-0.5 bg-ai-surface-primary rounded text-xs">Alt + Key</kbd> for 
              quick navigation. Hover over items for more details.
            </p>
          </div>
        ) : (
          <Tooltip content="Use Alt + Key shortcuts for quick navigation" position="right">
            <div className="w-10 h-10 rounded-lg bg-ai-primary-blue/10 flex items-center justify-center cursor-help">
              <span className="text-sm">💡</span>
            </div>
          </Tooltip>
        )}
      </div>

      {/* Status Indicator */}
      <div className={cn(
        'p-3 border-t border-ai-border-light',
        isCollapsed && 'px-2'
      )}>
        {!isCollapsed ? (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-ai-secondary-emerald rounded-full animate-pulse" />
            <span className="text-xs text-ai-text-secondary">
              AI Assistant Online
            </span>
          </div>
        ) : (
          <Tooltip content="AI Assistant Online" position="right">
            <div className="w-2 h-2 bg-ai-secondary-emerald rounded-full animate-pulse mx-auto" />
          </Tooltip>
        )}
      </div>
    </nav>
  );
};

export default EnterpriseNavigation;