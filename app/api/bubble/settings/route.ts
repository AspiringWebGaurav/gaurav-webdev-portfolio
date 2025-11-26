import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, getDocs, updateDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

const COLLECTIONS = {
  SETTINGS: 'bubbleSettings',
};

// GET: Fetch bubble settings
export async function GET() {
  try {
    const settingsRef = collection(db, COLLECTIONS.SETTINGS);
    const querySnapshot = await getDocs(settingsRef);

    if (querySnapshot.empty) {
      // Return default settings
      const defaultSettings = {
        id: 'default',
        bubbleText: 'Chat with me!',
        welcomeMessage: 'Hi there! How can I help you today?',
        quickActionsTitle: 'Quick Actions',
        predefinedQuestionsTitle: 'Common Questions',
        tooltipDelay: 500,
        bubbleColor: '#2563eb',
        bubblePosition: 'bottom-right' as const,
        enableTooltip: true,
        chatPlaceholder: 'Type your message...',
        bubbleIcon: 'message-circle',
        bubbleSize: 'medium',
        showBubbleText: false,
        panelWidth: 400,
        panelHeight: 600,
        theme: 'light',
        soundEnabled: false,
        showBranding: true,
        updatedAt: new Date(),
      };
      return NextResponse.json({ success: true, settings: defaultSettings });
    }

    const settingsDoc = querySnapshot.docs[0];
    const data = settingsDoc.data() as any;

    return NextResponse.json({
      success: true,
      settings: {
        id: data.id || 'default',
        bubbleText: data.bubbleText || 'Chat with me!',
        welcomeMessage: data.welcomeMessage || 'Hi there! How can I help you today?',
        quickActionsTitle: data.quickActionsTitle || 'Quick Actions',
        predefinedQuestionsTitle: data.predefinedQuestionsTitle || 'Common Questions',
        tooltipDelay: data.tooltipDelay || 500,
        bubbleColor: data.bubbleColor || '#2563eb',
        bubblePosition: data.bubblePosition || 'bottom-right',
        enableTooltip: data.enableTooltip !== undefined ? data.enableTooltip : true,
        chatPlaceholder: data.chatPlaceholder || 'Type your message...',
        bubbleIcon: data.bubbleIcon || 'message-circle',
        bubbleSize: data.bubbleSize || 'medium',
        showBubbleText: data.showBubbleText !== undefined ? data.showBubbleText : false,
        panelWidth: data.panelWidth || 400,
        panelHeight: data.panelHeight || 600,
        theme: data.theme || 'light',
        soundEnabled: data.soundEnabled !== undefined ? data.soundEnabled : false,
        showBranding: data.showBranding !== undefined ? data.showBranding : true,
        updatedAt: data.updatedAt?.toDate() || new Date(),
      },
    });
  } catch (error) {
    console.error('Error in settings GET:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT: Update bubble settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bubbleText,
      welcomeMessage,
      quickActionsTitle,
      predefinedQuestionsTitle,
      tooltipDelay,
      bubbleColor,
      bubblePosition,
      enableTooltip,
      chatPlaceholder,
      bubbleIcon,
      bubbleSize,
      showBubbleText,
      panelWidth,
      panelHeight,
      theme,
      soundEnabled,
      showBranding,
    } = body;

    const settingsRef = collection(db, COLLECTIONS.SETTINGS);
    const querySnapshot = await getDocs(settingsRef);

    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    if (bubbleText !== undefined) updateData.bubbleText = bubbleText;
    if (welcomeMessage !== undefined) updateData.welcomeMessage = welcomeMessage;
    if (quickActionsTitle !== undefined) updateData.quickActionsTitle = quickActionsTitle;
    if (predefinedQuestionsTitle !== undefined) updateData.predefinedQuestionsTitle = predefinedQuestionsTitle;
    if (tooltipDelay !== undefined) updateData.tooltipDelay = tooltipDelay;
    if (bubbleColor !== undefined) updateData.bubbleColor = bubbleColor;
    if (bubblePosition !== undefined) updateData.bubblePosition = bubblePosition;
    if (enableTooltip !== undefined) updateData.enableTooltip = enableTooltip;
    if (chatPlaceholder !== undefined) updateData.chatPlaceholder = chatPlaceholder;
    if (bubbleIcon !== undefined) updateData.bubbleIcon = bubbleIcon;
    if (bubbleSize !== undefined) updateData.bubbleSize = bubbleSize;
    if (showBubbleText !== undefined) updateData.showBubbleText = showBubbleText;
    if (panelWidth !== undefined) updateData.panelWidth = panelWidth;
    if (panelHeight !== undefined) updateData.panelHeight = panelHeight;
    if (theme !== undefined) updateData.theme = theme;
    if (soundEnabled !== undefined) updateData.soundEnabled = soundEnabled;
    if (showBranding !== undefined) updateData.showBranding = showBranding;

    if (querySnapshot.empty) {
      // Create new settings document
      await addDoc(collection(db, COLLECTIONS.SETTINGS), {
        id: 'default',
        ...updateData,
      });
    } else {
      // Update existing settings
      const settingsDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, COLLECTIONS.SETTINGS, settingsDoc.id), updateData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in settings PUT:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
