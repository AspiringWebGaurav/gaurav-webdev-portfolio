import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COLLECTIONS = {
  SESSIONS: 'bubbleSessions',
  MESSAGES: 'bubbleMessages',
  TOOLTIP_EVENTS: 'bubbleTooltipEvents',
};

// GET: Fetch bubble management statistics
export async function GET() {
  try {
    // Get total visitors (sessions)
    const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
    const sessionsSnapshot = await getDocs(sessionsRef);
    const totalVisitors = sessionsSnapshot.size;

    // Get active sessions (within last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const activeSessionsQuery = query(
      sessionsRef,
      where('lastActive', '>=', Timestamp.fromDate(oneDayAgo))
    );
    const activeSessionsSnapshot = await getDocs(activeSessionsQuery);
    const activeSessions = activeSessionsSnapshot.size;

    // Get unread admin messages
    const messagesRef = collection(db, COLLECTIONS.MESSAGES);
    const unreadQuery = query(
      messagesRef,
      where('role', '==', 'admin'),
      where('read', '==', false)
    );
    const unreadSnapshot = await getDocs(unreadQuery);
    const unreadMessages = unreadSnapshot.size;

    // Get tooltip triggers (total unread tooltips)
    const tooltipRef = collection(db, COLLECTIONS.TOOLTIP_EVENTS);
    const tooltipQuery = query(tooltipRef, where('readAt', '==', null));
    const tooltipSnapshot = await getDocs(tooltipQuery);
    const tooltipTriggers = tooltipSnapshot.size;

    // Get messages this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekMessagesQuery = query(
      messagesRef,
      where('timestamp', '>=', Timestamp.fromDate(oneWeekAgo))
    );
    const weekMessagesSnapshot = await getDocs(weekMessagesQuery);
    const messagesThisWeek = weekMessagesSnapshot.size;

    // Calculate average response time (simplified)
    let totalResponseTime = 0;
    let responseCount = 0;

    const allMessages = await getDocs(query(messagesRef, where('deletedAt', '==', null)));
    const messagesBySession: { [key: string]: any[] } = {};

    allMessages.docs.forEach(doc => {
      const data = doc.data();
      if (!messagesBySession[data.sessionId]) {
        messagesBySession[data.sessionId] = [];
      }
      messagesBySession[data.sessionId].push({
        role: data.role,
        timestamp: data.timestamp?.toDate() || new Date(),
      });
    });

    Object.values(messagesBySession).forEach(messages => {
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].role === 'visitor' && messages[i + 1].role === 'admin') {
          const responseTime = messages[i + 1].timestamp.getTime() - messages[i].timestamp.getTime();
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    });

    const averageResponseTime = responseCount > 0 ? Math.floor(totalResponseTime / responseCount / 1000 / 60) : 0; // in minutes

    return NextResponse.json({
      totalVisitors,
      activeSessions,
      unreadMessages,
      tooltipTriggers,
      messagesThisWeek,
      averageResponseTime,
    });
  } catch (error) {
    console.error('Error in stats GET:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
