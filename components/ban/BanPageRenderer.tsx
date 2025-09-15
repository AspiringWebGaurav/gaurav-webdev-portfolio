"use client";

import { BanPageDesign, BanCategory } from '@/types/banSystem';
import { formatPolicyReferenceForDisplay } from '@/utils/policyReference';

interface BanPageRendererProps {
  design: BanPageDesign;
  category: BanCategory;
  uuid: string;
  banReason: string;
  policyReference: string;
  onAppealClick: () => void;
}

export function BanPageRenderer({
  design,
  category,
  uuid,
  banReason,
  policyReference,
  onAppealClick
}: BanPageRendererProps) {
  const { theme, content, layout, responsive } = design;

  return (
    <div 
      className={`h-screen bg-gradient-to-br ${theme.backgroundColor} flex items-center justify-center p-2 sm:p-4 relative overflow-hidden`}
      style={{
        '--primary-color': theme.primaryColor,
        '--secondary-color': theme.secondaryColor,
        '--accent-color': theme.accentColor,
      } as React.CSSProperties}
    >
      {/* Background Effects */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-current/20 via-transparent to-transparent"
        style={{ color: theme.primaryColor }}
      />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] sm:bg-[size:50px_50px]" />
      
      <div className="w-full max-w-7xl h-full flex items-center relative z-10">
        {/* Main ban notice */}
        <div className={`w-full bg-gradient-to-br from-slate-900/90 to-gray-900/90 backdrop-blur-xl ${theme.borderColor} ${layout.borderRadius} shadow-2xl overflow-hidden`}>
          
          {/* Header */}
          <div 
            className={`relative ${layout.contentPadding} border-b ${theme.borderColor}`}
            style={{
              background: `linear-gradient(to right, ${theme.primaryColor}20, ${theme.secondaryColor}20)`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div 
                  className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${layout.borderRadius} flex items-center justify-center backdrop-blur-sm ${theme.borderColor}`}
                  style={{
                    background: `linear-gradient(to bottom right, ${theme.primaryColor}30, ${theme.secondaryColor}30)`
                  }}
                >
                  <svg 
                    className={`${content.icon.size} ${content.icon.color}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d={content.icon.value} 
                    />
                  </svg>
                </div>
                <div>
                  <h1 className={`${responsive.mobile.fontSize.title} sm:${responsive.tablet.fontSize.title} lg:${responsive.desktop.fontSize.title} font-bold text-white`}>
                    {content.title}
                  </h1>
                  <p className={`${content.icon.color} ${responsive.mobile.fontSize.subtitle} sm:${responsive.tablet.fontSize.subtitle} hidden sm:block`}>
                    {content.subtitle}
                  </p>
                  <p className={`${content.icon.color} text-xs sm:hidden`}>
                    {content.subtitle}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                  <div 
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                  <span 
                    className={`font-medium text-xs sm:text-sm`}
                    style={{ color: theme.accentColor }}
                  >
                    {content.statusBadge}
                  </span>
                </div>
                <p className="text-slate-400 text-xs">{content.processingTime}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={layout.contentPadding}>
            <div className={`grid grid-cols-1 sm:grid-cols-${responsive.tablet.gridColumns} lg:grid-cols-${responsive.desktop.gridColumns} gap-3 sm:gap-6 h-full`}>
              
              {/* Policy Reference */}
              <div className="space-y-3 sm:space-y-4">
                <div 
                  className={`bg-gradient-to-r ${theme.borderColor} ${layout.borderRadius} ${layout.contentPadding} backdrop-blur-sm`}
                  style={{
                    background: `linear-gradient(to right, ${theme.primaryColor}10, ${theme.secondaryColor}10)`
                  }}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className={`${responsive.mobile.fontSize.subtitle} sm:${responsive.tablet.fontSize.subtitle} font-bold text-white flex items-center`}>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" style={{ color: theme.accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="hidden sm:inline">Policy Reference</span>
                      <span className="sm:hidden">Policy ID</span>
                    </h3>
                    <div 
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${theme.primaryColor}20` }}
                    >
                      <span style={{ color: theme.accentColor }} className="text-xs font-medium">ID</span>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2 sm:p-3 border border-slate-700/50">
                    <div className="font-mono text-sm sm:text-lg font-bold tracking-wider text-center break-all" style={{ color: theme.accentColor }}>
                      {policyReference ? formatPolicyReferenceForDisplay(policyReference) : (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50"></div>
                          <span className="opacity-75">Generating Reference...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs text-center mt-1">
                      <span className="hidden sm:inline">
                        {policyReference ? 'Use for support communications' : 'Policy reference will appear shortly'}
                      </span>
                      <span className="sm:hidden">
                        {policyReference ? 'For support' : 'Generating...'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Ban Reason */}
                <div 
                  className={`bg-gradient-to-r ${theme.borderColor} ${layout.borderRadius} ${layout.contentPadding} backdrop-blur-sm`}
                  style={{
                    background: `linear-gradient(to right, ${theme.primaryColor}10, ${theme.secondaryColor}10)`
                  }}
                >
                  <h3 className={`${responsive.mobile.fontSize.subtitle} sm:${responsive.tablet.fontSize.subtitle} font-bold text-white mb-2 sm:mb-3 flex items-center`}>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" style={{ color: theme.accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="hidden sm:inline">Restriction Reason</span>
                    <span className="sm:hidden">Reason</span>
                  </h3>
                  <div 
                    className="border rounded-lg p-2 sm:p-3"
                    style={{ 
                      backgroundColor: `${theme.primaryColor}10`,
                      borderColor: `${theme.primaryColor}30`
                    }}
                  >
                    <p className="font-medium text-sm sm:text-base" style={{ color: theme.textColor }}>{banReason}</p>
                  </div>
                </div>
              </div>

              {/* Information */}
              <div 
                className={`bg-gradient-to-r ${theme.borderColor} ${layout.borderRadius} ${layout.contentPadding} backdrop-blur-sm`}
                style={{
                  background: `linear-gradient(to right, ${theme.primaryColor}10, ${theme.secondaryColor}10)`
                }}
              >
                <h4 className="text-white font-bold mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" style={{ color: theme.accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">What happens next?</span>
                  <span className="sm:hidden">Next Steps</span>
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" style={{ backgroundColor: theme.accentColor }}></div>
                    <p className="text-xs sm:text-sm" style={{ color: theme.textColor }}>
                      <span className="hidden sm:inline">Appeal reviewed within {content.processingTime}</span>
                      <span className="sm:hidden">Review: {content.processingTime}</span>
                    </p>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" style={{ backgroundColor: theme.accentColor }}></div>
                    <p className="text-xs sm:text-sm" style={{ color: theme.textColor }}>
                      <span className="hidden sm:inline">Email response if contact provided</span>
                      <span className="sm:hidden">Email response sent</span>
                    </p>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" style={{ backgroundColor: theme.accentColor }}></div>
                    <p className="text-xs sm:text-sm" style={{ color: theme.textColor }}>
                      <span className="hidden sm:inline">Automatic access restoration if approved</span>
                      <span className="sm:hidden">Auto-restore if approved</span>
                    </p>
                  </div>
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" style={{ backgroundColor: theme.accentColor }}></div>
                    <p className="text-xs sm:text-sm" style={{ color: theme.textColor }}>
                      <span className="hidden sm:inline">Use policy reference for all communications</span>
                      <span className="sm:hidden">Use policy ID for support</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex flex-col justify-center items-center space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
                <div className="text-center mb-2 sm:mb-4">
                  <h3 className="text-white font-bold text-base sm:text-lg mb-1 sm:mb-2">Need Help?</h3>
                  <p className="text-slate-300 text-xs sm:text-sm">
                    <span className="hidden sm:inline">{content.appealMessage}</span>
                    <span className="sm:hidden">Submit an appeal if this was an error</span>
                  </p>
                </div>
                
                <button
                  onClick={onAppealClick}
                  className="group py-3 sm:py-4 px-6 sm:px-8 rounded-lg sm:rounded-xl transition-all duration-300 font-semibold flex items-center justify-center space-x-2 sm:space-x-3 shadow-lg transform hover:scale-105 w-full max-w-xs text-sm sm:text-base"
                  style={{
                    background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})`,
                    boxShadow: `0 10px 25px ${theme.primaryColor}25`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `linear-gradient(to right, ${theme.secondaryColor}, ${theme.primaryColor})`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})`;
                  }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{content.buttonText}</span>
                </button>

                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-2 sm:p-3 w-full max-w-xs">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-1">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-slate-300 text-xs sm:text-sm font-medium">
                        <span className="hidden sm:inline">Processing Time</span>
                        <span className="sm:hidden">Processing</span>
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">
                      <span className="hidden sm:inline">Standard review: {content.processingTime}</span>
                      <span className="sm:hidden">{content.processingTime}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}