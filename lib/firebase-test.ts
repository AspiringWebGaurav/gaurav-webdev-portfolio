// lib/firebase-test.ts
// Test script to verify Firebase functions are properly exported and available

import * as firebaseModule from './firebase';

export function testFirebaseExports(): { [key: string]: boolean } {
  const testResults: { [key: string]: boolean } = {};
  
  const requiredFunctions = [
    'addDirectQuestion',
    'getVisitorQuestions', 
    'markQuestionsAsRead',
    'listenToVisitorQuestions',
    'getVisitorQuestionStats',
    'updateQuestionStatus'
  ];
  
  console.log('🧪 Testing Firebase exports...');
  
  requiredFunctions.forEach(funcName => {
    const func = (firebaseModule as any)[funcName];
    testResults[funcName] = typeof func === 'function';
    
    if (testResults[funcName]) {
      console.log(`✅ ${funcName} is available`);
    } else {
      console.error(`❌ ${funcName} is missing or not a function`);
    }
  });
  
  // Test basic Firebase exports
  testResults['db'] = !!firebaseModule.db;
  testResults['app'] = !!firebaseModule.app;
  testResults['storage'] = !!firebaseModule.storage;
  
  console.log('📊 Firebase exports test results:', testResults);
  
  return testResults;
}

// Test askDirectly functions as well
export function testAskDirectlyExports(): { [key: string]: boolean } {
  const testResults: { [key: string]: boolean } = {};
  
  try {
    // Dynamic import to test if functions are available
    import('./askDirectly').then(askDirectlyModule => {
      const requiredFunctions = [
        'validateQuestion',
        'canSendQuestion', 
        'submitQuestion',
        'getCurrentVisitorQuestions',
        'markCurrentVisitorQuestionsAsRead',
        'getCurrentVisitorStats',
        'getQuestionListenerManager'
      ];
      
      console.log('🧪 Testing askDirectly exports...');
      
      requiredFunctions.forEach(funcName => {
        const func = (askDirectlyModule as any)[funcName];
        testResults[funcName] = typeof func === 'function';
        
        if (testResults[funcName]) {
          console.log(`✅ ${funcName} is available`);
        } else {
          console.error(`❌ ${funcName} is missing or not a function`);
        }
      });
      
      console.log('📊 AskDirectly exports test results:', testResults);
    }).catch(error => {
      console.error('❌ Failed to import askDirectly module:', error);
    });
  } catch (error) {
    console.error('❌ Error testing askDirectly exports:', error);
  }
  
  return testResults;
}

// Combined test function
export function runAllTests(): void {
  console.log('🚀 Running all Firebase function tests...');
  
  try {
    const firebaseResults = testFirebaseExports();
    const askDirectlyResults = testAskDirectlyExports();
    
    const allPassed = Object.values({...firebaseResults, ...askDirectlyResults}).every(result => result);
    
    if (allPassed) {
      console.log('🎉 All tests passed! Firebase functions should work in production.');
    } else {
      console.warn('⚠️ Some tests failed. Check the console for details.');
    }
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  }
}

// Auto-run tests in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  console.log('🔧 Development mode detected - running Firebase tests...');
  runAllTests();
}