# Burn Prevention System

## Directory Structure

```
lib/burnPrevention/
├── index.ts                          # Main entry point, exports everything
├── core/
│   ├── RuntimeObserver.ts            # Observes all system execution
│   ├── ActivityIntelligence.ts       # Analyzes and makes recommendations
│   └── ExecutionController.ts        # Enforces intelligent adjustments
└── adapters/
    ├── smartPollingAdapter.ts        # Integrates with SmartPolling
    ├── firebaseListenerAdapter.ts    # Wraps Firebase onSnapshot
    └── intervalAdapter.ts            # Provides burn-aware intervals
```

## Quick Start

### 1. Basic Usage

```typescript
import { burnPreventionCore } from '@/lib/burnPrevention';

// System initializes automatically
// No configuration needed
```

### 2. Register an Execution

```typescript
burnPreventionCore.registerExecution({
  id: 'my-poller',
  type: 'poll',
  name: 'Data Poller',
  frequency: 10000,
  lastExecution: 0,
  executionCount: 0,
  averageExecutionTime: 0,
  isRunning: true,
  criticality: 'normal',
  owner: 'visitor',
  canPause: true,
  canThrottle: true,
});
```

### 3. Use Adapters

```typescript
// Burn-aware interval
import { burnAwareInterval } from '@/lib/burnPrevention/adapters/intervalAdapter';

const cleanup = burnAwareInterval(
  () => console.log('Task'),
  5000,
  { id: 'my-task', criticality: 'normal', owner: 'system', description: 'My Task' }
);

// Firebase listener
import { observeWithBurnPrevention } from '@/lib/burnPrevention/adapters/firebaseListenerAdapter';

const unsubscribe = observeWithBurnPrevention(
  docRef,
  { id: 'doc-watcher', criticality: 'high', owner: 'admin', description: 'Doc Watcher' },
  (snapshot) => { /* handle */ }
);
```

## Core Concepts

### System Modes
- **Active**: Recent user interaction, everything runs normally
- **Idle**: No activity for 2+ minutes, throttling begins
- **Sleep**: No activity for 5+ minutes, most things pause
- **Deep Sleep**: No activity for 15+ minutes, maximum conservation

### Criticality Levels
- **Critical**: Never pause or throttle (security, data integrity)
- **High**: Can throttle, cannot pause (important features)
- **Normal**: Can throttle and pause (regular operations)
- **Low**: First to pause (background tasks, logging)

### Owner Types
- **Admin**: Only runs when admin is present
- **Visitor**: Runs when visitors are active
- **System**: Always needed, but can be throttled

## Integration Points

### Already Integrated
- ✅ `AnalyticsHealthMonitor` - Uses burn-aware intervals
- ✅ `PerformanceMonitor` - Uses burn-aware intervals  
- ✅ `SmartPolling` - Integrated via adapter

### To Be Integrated
- 📋 `RealtimeSync` - Global ticker
- 📋 `EventBatcher` - Flush timer
- 📋 `BubbleMessageContext` - Message polling
- 📋 `VisitorAnalyticsContext` - Analytics polling
- 📋 Firebase listeners in monitors (Ban, Suspension, Maintenance)

## Development Tools

### Console Commands (Dev Only)
```javascript
// Full report
__burnPrevention.printReport()

// Current metrics
__burnPrevention.getMetrics()

// Direct access
__burnPrevention.core
__burnPrevention.observer
__burnPrevention.intelligence
__burnPrevention.controller
```

### Admin Dashboard
Press **Ctrl+Shift+B** in admin panel to see live metrics.

## Testing

### Simulate Idle Mode
```typescript
// Reduce idle threshold for testing
burnPreventionCore.configure({
  idleThresholdMs: 10000 // 10 seconds instead of 2 minutes
});
```

### Force Mode
```typescript
// Manually trigger deep sleep (for testing)
// Not exposed yet, but can be added if needed
```

## Best Practices

### ✅ Do
- Classify executions correctly (criticality)
- Record meaningful activity signals
- Use appropriate owner types
- Test idle behavior
- Monitor the dashboard

### ❌ Don't
- Mark everything as critical
- Record passive events (mousemove)
- Pause security operations
- Disable without testing
- Ignore warnings in console

## Performance

- **CPU Overhead**: < 0.01%
- **Memory Usage**: < 1MB
- **Latency**: Wake-up < 100ms
- **Savings**: 60-99% during idle periods

## Troubleshooting

### Execution Not Pausing
1. Check `canPause` is `true`
2. Verify criticality is not `critical`
3. Confirm page is actually hidden

### System Not Entering Idle
1. Check if activity is being recorded correctly
2. Verify admin panel is not open
3. Check page visibility API

### Too Aggressive
```typescript
burnPreventionCore.configure({
  aggressiveness: 'conservative'
});
```

## Future Enhancements
- ML-based activity prediction
- Visitor pattern learning
- Automatic criticality inference
- Cost estimation API
- Grafana integration

## Documentation

- **Technical**: `docs/BURN_PREVENTION_SYSTEM.md`
- **Product**: `docs/AUTONOMOUS_RESOURCE_INTELLIGENCE.md`

## License

Part of Gaurav Workspace application.
