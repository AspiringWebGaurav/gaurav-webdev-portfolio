/**
 * Firebase Cloud Functions Entry Point
 * 
 * Exports all cloud functions for the portfolio project
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export scheduled functions
export { scheduledCacheClear } from './scheduledCacheClear';
export { autoUnbanScheduler } from './autoUnban';
