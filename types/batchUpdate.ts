/**
 * TypeScript interfaces for enterprise batch update system
 */

export interface BatchConfig {
  users: number;
  batchSize: number;
  interval: number; // seconds between batches
}

export interface BatchCalculation {
  totalBatches: number;
  batchSize: number;
  interval: number;
  estimatedTimeSeconds: number;
}

export interface BatchBroadcast {
  type: 'FORCE_RELOAD';
  batchId: string;
  batchNumber: number;
  totalBatches: number;
  delaySeconds: number;
  targetUserIds: string[];
  timestamp: any; // FirebaseFirestore.FieldValue
  layer: number;
  layerName: string;
  message: string;
  triggeredBy: string;
  triggeredByEmail: string;
}

export interface LayerBatchResult {
  name: string;
  collection: string;
  success: boolean;
  error?: string;
  broadcastIds: string[];
  batchCount: number;
}

export interface BatchUpdateResult {
  success: boolean;
  totalUsers: number;
  totalBatches: number;
  batchSize: number;
  interval: number;
  estimatedCompletionSeconds: number;
  layers: LayerBatchResult[];
  successfulLayers: number;
  failedLayers: number;
  timestamp: string;
  message: string;
  redundancy?: string;
}

export interface BatchProgress {
  batchNumber: number;
  status: 'pending' | 'broadcasting' | 'completed' | 'failed';
  userCount: number;
  delaySeconds: number;
  broadcastId?: string;
  error?: string;
}

export interface DiscoveryPhase {
  status: 'discovering' | 'completed' | 'failed';
  pingId: string;
  responseCount: number;
  elapsedSeconds: number;
  maxWaitSeconds: number;
  liveUserIds: string[];
}

export interface DiscoveryResponse {
  visitorId: string;
  timestamp: any;
  userAgent: string;
  url: string;
  status: string;
  tabId: string;
}
