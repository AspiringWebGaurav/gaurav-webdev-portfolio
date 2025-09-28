import { NextApiRequest, NextApiResponse } from 'next';

interface MetricData {
  type: string;
  timestamp: number;
  userAgent?: string;
  loadTime?: number;
  errors?: any[];
  url?: string;
  chunkLoadTime?: number;
  serviceWorkerStatus?: string;
}

interface AlertThresholds {
  firstLoadFailures: number;
  chunkLoadErrors: number;
  avgLoadTime: number;
}

const ALERT_THRESHOLDS: AlertThresholds = {
  firstLoadFailures: 5, // per minute
  chunkLoadErrors: 10, // per minute
  avgLoadTime: 5000 // 5 seconds
};

// In-memory storage for demo (use Redis/Database in production)
const metricsCache: { [key: string]: MetricData[] } = {};

export default async function metricsHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const metric: MetricData = req.body;
    
    // Validate metric data
    if (!metric.type || !metric.timestamp) {
      return res.status(400).json({ error: 'Invalid metric data' });
    }
    
    // Store metric
    const minuteKey = getMinuteKey(metric.timestamp);
    if (!metricsCache[minuteKey]) {
      metricsCache[minuteKey] = [];
    }
    metricsCache[minuteKey].push(metric);
    
    // Log metric (in production, send to monitoring service like Sentry, DataDog)
    if (process.env.NODE_ENV === 'development') {
      console.log('[METRIC]', {
        type: metric.type,
        timestamp: new Date(metric.timestamp).toISOString(),
        userAgent: metric.userAgent?.substring(0, 50),
        data: metric
      });
    }
    
    // Check for critical conditions
    await checkAlertConditions(metric, minuteKey);
    
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Metrics handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function checkAlertConditions(metric: MetricData, minuteKey: string) {
  const minuteMetrics = metricsCache[minuteKey] || [];
  
  // Check first load failures
  if (metric.type === 'first_load_failure') {
    const failureCount = minuteMetrics.filter(m => m.type === 'first_load_failure').length;
    if (failureCount >= ALERT_THRESHOLDS.firstLoadFailures) {
      await triggerAlert('critical_first_load_failures', {
        count: failureCount,
        minute: minuteKey,
        latestError: metric
      });
    }
  }
  
  // Check chunk load errors
  if (metric.type === 'chunk_load_error') {
    const errorCount = minuteMetrics.filter(m => m.type === 'chunk_load_error').length;
    if (errorCount >= ALERT_THRESHOLDS.chunkLoadErrors) {
      await triggerAlert('critical_chunk_errors', {
        count: errorCount,
        minute: minuteKey,
        latestError: metric
      });
    }
  }
  
  // Check average load time
  if (metric.type === 'first_load_success' && metric.loadTime) {
    const loadTimeMetrics = minuteMetrics.filter(m => 
      m.type === 'first_load_success' && m.loadTime
    );
    
    if (loadTimeMetrics.length >= 5) { // Need at least 5 samples
      const avgLoadTime = loadTimeMetrics.reduce((sum, m) => 
        sum + (m.loadTime || 0), 0
      ) / loadTimeMetrics.length;
      
      if (avgLoadTime > ALERT_THRESHOLDS.avgLoadTime) {
        await triggerAlert('performance_degradation', {
          averageLoadTime: avgLoadTime,
          sampleCount: loadTimeMetrics.length,
          minute: minuteKey
        });
      }
    }
  }
}

async function triggerAlert(type: string, data: any) {
  console.error(`[ALERT] ${type.toUpperCase()}:`, data);
  
  // In production, integrate with:
  // - Sentry for error tracking
  // - Slack/Discord webhooks for notifications
  // - PagerDuty for critical alerts
  // - Email notifications
  
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Portfolio Alert: ${type}`,
          attachments: [{
            color: 'danger',
            fields: Object.entries(data).map(([key, value]) => ({
              title: key,
              value: String(value),
              short: true
            }))
          }]
        })
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }
}

function getMinuteKey(timestamp: number): string {
  const date = new Date(timestamp);
  date.setSeconds(0, 0); // Round to minute
  return date.toISOString();
}

// Cleanup old metrics (run periodically)
export function cleanupOldMetrics() {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  
  Object.keys(metricsCache).forEach(key => {
    const keyTime = new Date(key).getTime();
    if (keyTime < oneHourAgo) {
      delete metricsCache[key];
    }
  });
}

// Export metrics for debugging (development only)
export function getMetricsSnapshot() {
  if (process.env.NODE_ENV !== 'development') {
    return { error: 'Not available in production' };
  }
  
  return {
    totalKeys: Object.keys(metricsCache).length,
    recentMetrics: Object.entries(metricsCache)
      .slice(-5)
      .map(([key, metrics]) => ({
        minute: key,
        count: metrics.length,
        types: [...new Set(metrics.map(m => m.type))]
      }))
  };
}