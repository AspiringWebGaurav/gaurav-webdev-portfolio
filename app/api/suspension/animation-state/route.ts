/**
 * Suspension Animation State Tracker - TEST ONLY
 * GET/POST /api/suspension/animation-state
 * 
 * Tracks restoration animation state for testing purposes.
 * Used by test scripts to verify animation runs for full duration.
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory state (resets on server restart)
let animationState = {
  isRunning: false,
  startTime: null as number | null,
  endTime: null as number | null,
  phase: 'idle' as string,
  completed: false,
};

export async function GET(request: NextRequest) {
  const now = Date.now();
  const duration = animationState.startTime && animationState.isRunning 
    ? now - animationState.startTime 
    : 0;
  
  return NextResponse.json({
    ...animationState,
    currentDuration: duration,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phase } = body;
    
    const now = Date.now();
    
    if (action === 'start') {
      animationState = {
        isRunning: true,
        startTime: now,
        endTime: null,
        phase: phase || 'preparing',
        completed: false,
      };
      console.log('[Animation Tracker] 🎬 Animation STARTED');
    } else if (action === 'update') {
      animationState.phase = phase || animationState.phase;
      console.log(`[Animation Tracker] 📊 Phase: ${animationState.phase}`);
    } else if (action === 'complete') {
      animationState.isRunning = false;
      animationState.endTime = now;
      animationState.completed = true;
      const duration = animationState.startTime ? now - animationState.startTime : 0;
      console.log(`[Animation Tracker] ✅ Animation COMPLETED (${duration}ms)`);
    } else if (action === 'reset') {
      animationState = {
        isRunning: false,
        startTime: null,
        endTime: null,
        phase: 'idle',
        completed: false,
      };
      console.log('[Animation Tracker] 🔄 State RESET');
    }
    
    return NextResponse.json({ success: true, state: animationState });
  } catch (error: any) {
    console.error('[Animation Tracker] Error:', error?.message);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
