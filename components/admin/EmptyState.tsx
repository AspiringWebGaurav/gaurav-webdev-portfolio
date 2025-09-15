"use client";

interface EmptyStateProps {
  type: 'loading' | 'error' | 'no-results' | 'empty' | 'has-data';
  title?: string;
  message?: string;
  action?: 'retry' | 'clear-filters' | 'refresh' | 'custom';
  onAction?: () => void;
  actionLabel?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  type,
  title,
  message,
  action,
  onAction,
  actionLabel,
  icon
}: EmptyStateProps) {
  if (type === 'has-data' || type === 'loading') {
    return null;
  }

  const getDefaultIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'no-results':
        return (
          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'empty':
      default:
        return (
          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
    }
  };

  const getDefaultActionLabel = () => {
    switch (action) {
      case 'retry': return 'Try Again';
      case 'clear-filters': return 'Clear Filters';
      case 'refresh': return 'Refresh';
      default: return actionLabel || 'Action';
    }
  };

  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {icon || getDefaultIcon()}
      </div>
      <h3 className="text-slate-900 text-lg font-medium mb-2">
        {title || 'No data available'}
      </h3>
      <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
        {message || 'There is no data to display at this time.'}
      </p>
      {action && onAction && (
        <button
          onClick={onAction}
          className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
            type === 'error'
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {getDefaultActionLabel()}
        </button>
      )}
    </div>
  );
}