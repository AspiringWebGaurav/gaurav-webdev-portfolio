/**
 * Scroll Restoration Test Utility
 * 
 * Use this in browser console to test scroll restoration
 * 
 * Usage:
 * 1. Open portfolio in browser
 * 2. Open DevTools console
 * 3. Scroll to any position
 * 4. Type: testScrollRestoration()
 * 5. Hard refresh (Ctrl+F5)
 * 6. Check if position is restored
 */

declare global {
  interface Window {
    testScrollRestoration: () => void;
    getScrollPosition: () => void;
    clearScrollPosition: () => void;
  }
}

/**
 * Test scroll restoration functionality
 */
export function testScrollRestoration() {
  console.group('🧪 Scroll Restoration Test');
  
  try {
    // Check if sessionStorage is available
    const storage = window.sessionStorage;
    console.log('✓ sessionStorage available');
    
    // Check if position is saved
    const savedPosition = storage.getItem('portfolio_scroll_position');
    
    if (savedPosition) {
      const position = JSON.parse(savedPosition);
      console.log('✓ Saved position found:', {
        scrollY: Math.round(position.y),
        timestamp: new Date(position.timestamp).toLocaleTimeString(),
        viewportHeight: position.viewportHeight,
        documentHeight: position.documentHeight,
      });
    } else {
      console.log('ℹ No saved position (scroll and wait ~200ms, then check again)');
    }
    
    // Current position
    const currentY = window.scrollY || window.pageYOffset;
    console.log('📍 Current scroll position:', Math.round(currentY), 'px');
    
    // Instructions
    console.log('\n📋 Test Instructions:');
    console.log('1. Scroll to any position on the page');
    console.log('2. Wait ~200ms for position to save');
    console.log('3. Press Ctrl+F5 (hard refresh)');
    console.log('4. Page should restore to same position');
    console.log('\n💡 Test in incognito mode to verify it works there too!');
    
  } catch (error) {
    console.error('✗ Test failed:', error);
  }
  
  console.groupEnd();
}

/**
 * Get current scroll position details
 */
export function getScrollPosition() {
  console.group('📍 Current Scroll Position');
  
  const scrollY = window.scrollY || window.pageYOffset;
  const viewportHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollPercentage = ((scrollY / (documentHeight - viewportHeight)) * 100).toFixed(1);
  
  console.log('Scroll Y:', Math.round(scrollY), 'px');
  console.log('Viewport Height:', viewportHeight, 'px');
  console.log('Document Height:', documentHeight, 'px');
  console.log('Scroll Progress:', scrollPercentage, '%');
  
  // Check saved position
  try {
    const saved = window.sessionStorage.getItem('portfolio_scroll_position');
    if (saved) {
      const position = JSON.parse(saved);
      const savedAt = new Date(position.timestamp);
      console.log('\n💾 Saved Position:', Math.round(position.y), 'px');
      console.log('Saved At:', savedAt.toLocaleTimeString());
      console.log('Time Since Save:', Math.round((Date.now() - position.timestamp) / 1000), 'seconds ago');
    } else {
      console.log('\n💾 No saved position');
    }
  } catch (error) {
    console.error('Error reading saved position:', error);
  }
  
  console.groupEnd();
}

/**
 * Clear saved scroll position
 */
export function clearScrollPosition() {
  try {
    window.sessionStorage.removeItem('portfolio_scroll_position');
    console.log('✓ Scroll position cleared from sessionStorage');
  } catch (error) {
    console.error('✗ Failed to clear position:', error);
  }
}

// Expose to window for console testing
if (typeof window !== 'undefined') {
  window.testScrollRestoration = testScrollRestoration;
  window.getScrollPosition = getScrollPosition;
  window.clearScrollPosition = clearScrollPosition;
  
  console.log('🧪 Scroll Restoration Test Utilities Loaded');
  console.log('Available commands:');
  console.log('  • testScrollRestoration() - Run full test');
  console.log('  • getScrollPosition() - Check current position');
  console.log('  • clearScrollPosition() - Clear saved position');
}
