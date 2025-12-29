'use client';

import { useState, useEffect } from 'react';

export default function NotFound404Standalone() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBackHome = () => {
    window.location.href = '/';
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
        setTimeout(() => {
          setShowContactForm(false);
          setSubmitStatus('idle');
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMobile = screenSize === 'mobile';
  const isTablet = screenSize === 'tablet';

  return (
    <>
      <div className="h-screen w-screen bg-gradient-to-br from-black via-slate-900 to-black text-white overflow-hidden flex flex-col">
        {/* Ambient background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Main content container */}
        <div className="relative flex-1 flex flex-col px-4 md:px-8 py-4 min-h-0">
          
          {/* Top branding bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/30 flex-shrink-0">
            <div className="flex items-center gap-2 md:gap-3">
              <div className={`${isMobile ? 'w-7 h-7' : 'w-9 h-9'} bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center`}>
                <span className={`text-white font-bold ${isMobile ? 'text-xs' : 'text-base'}`}>G</span>
              </div>
              <div>
                <h2 className={`text-white font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>Gaurav Portfolio</h2>
                <p className={`text-slate-400 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>Lost in Space</p>
              </div>
            </div>
            
            {/* Center clock and date - Hidden on mobile */}
            {!isMobile && (
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm md:text-base text-slate-200">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-mono font-medium" suppressHydrationWarning>
                    {currentTime.toLocaleTimeString()}
                  </span>
                </div>
                <div className="h-4 w-px bg-slate-600"></div>
                <div className="flex items-center gap-2 text-sm md:text-base text-slate-300">
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium" suppressHydrationWarning>
                    {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            )}

            <div className={`inline-flex items-center gap-2 md:gap-3 bg-purple-500/20 px-2 md:px-4 py-1 md:py-2 rounded-lg border border-purple-500/30`}>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className={`${isMobile ? 'text-[10px]' : 'text-sm'} font-medium text-purple-300`}>404 Not Found</span>
              </div>
            </div>
          </div>
          
          {/* Header section */}
          <div className="bg-gradient-to-r from-purple-900/40 to-blue-800/40 border border-purple-700/30 rounded-xl p-3 md:p-5 mt-3 flex-shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
              <div className={`${isMobile ? 'w-8 h-8' : 'w-11 h-11'} bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30`}>
                <svg className={`${isMobile ? 'w-5 h-5' : 'w-7 h-7'} text-purple-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h1 className={`${isMobile ? 'text-base' : isTablet ? 'text-xl' : 'text-2xl'} font-bold text-white`}>Page Not Found</h1>
                <p className={`text-purple-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>The page you're looking for doesn't exist</p>
              </div>
            </div>
          </div>

          {/* Content - Responsive layout */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 min-h-0 overflow-auto">
            
            {/* Large 404 Display */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 md:p-8 border border-slate-700/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="relative">
                  <h2 className={`${isMobile ? 'text-6xl' : isTablet ? 'text-8xl' : 'text-9xl'} font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-purple-600 animate-pulse`}>
                    404
                  </h2>
                  <div className={`absolute inset-0 ${isMobile ? 'text-6xl' : isTablet ? 'text-8xl' : 'text-9xl'} font-black text-purple-500/20 blur-2xl`}>
                    404
                  </div>
                </div>
                <p className={`${isMobile ? 'text-sm' : isTablet ? 'text-lg' : 'text-xl'} text-slate-300 font-semibold mt-3 md:mt-4 tracking-wider`}>ERROR NOT FOUND</p>
                <div className="flex items-center justify-center gap-2 mt-2 md:mt-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-400`}>Page does not exist</p>
                </div>
              </div>
            </div>

            {/* Actions panel */}
            <div className="bg-slate-800/50 rounded-xl p-4 md:p-5 border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-start gap-3 mb-4">
                <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-base font-semibold text-white">What can you do?</h3>
              </div>
              
              <div className="space-y-2 md:space-y-3 mb-4">
                <div className="flex items-start gap-2 md:gap-3 p-2 md:p-3 bg-slate-900/30 rounded-lg">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-200 font-medium`}>Return to Homepage</p>
                    <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-slate-400`}>Start fresh from the main page</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3 p-2 md:p-3 bg-slate-900/30 rounded-lg">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-400 rounded-full mt-1.5 md:mt-2 flex-shrink-0"></div>
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-200 font-medium`}>Contact Me</p>
                    <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-slate-400`}>Let me know if you need help</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 md:space-y-3">
                <button
                  onClick={handleBackHome}
                  className={`w-full flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-purple-600/60 hover:scale-[1.02] ${isMobile ? 'text-xs' : 'text-sm md:text-base'}`}
                >
                  <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Back to Homepage
                </button>
                
                <button
                  onClick={() => setShowContactForm(true)}
                  className={`w-full flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white font-semibold rounded-lg transition-all duration-300 border border-slate-600 hover:border-slate-500 ${isMobile ? 'text-xs' : 'text-sm md:text-base'}`}
                >
                  <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Lost? Reach out to me
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Contact Me</h3>
              <button
                onClick={() => setShowContactForm(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {submitStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white font-semibold">Message sent successfully!</p>
                <p className="text-slate-400 text-sm mt-2">I'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                    placeholder="How can I help you?"
                  />
                </div>
                {submitStatus === 'error' && (
                  <p className="text-red-400 text-sm">Failed to send message. Please try again.</p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
