import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnterpriseAIAssistant from '../EnterpriseAIAssistant';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock window.matchMedia for reduced motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('EnterpriseAIAssistant', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('renders floating action button when not visible', () => {
    render(<EnterpriseAIAssistant isPortfolioLoaded={true} />);
    
    const floatingButton = screen.getByLabelText('Open AI Assistant');
    expect(floatingButton).toBeInTheDocument();
  });

  it('opens assistant interface when floating button is clicked', async () => {
    render(<EnterpriseAIAssistant isPortfolioLoaded={true} />);
    
    const floatingButton = screen.getByLabelText('Open AI Assistant');
    fireEvent.click(floatingButton);
    
    await waitFor(() => {
      expect(screen.getByText("Gaurav's Personal Assistance")).toBeInTheDocument();
    });
  });

  it('shows onboarding for first-time users', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(<EnterpriseAIAssistant isPortfolioLoaded={true} />);
    
    const floatingButton = screen.getByLabelText('Open AI Assistant');
    fireEvent.click(floatingButton);
    
    await waitFor(() => {
      expect(screen.getByText("Welcome to Gaurav's AI Assistant")).toBeInTheDocument();
    });
  });

  it('does not show onboarding for returning users', async () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ seen: true }));
    
    render(<EnterpriseAIAssistant isPortfolioLoaded={true} />);
    
    const floatingButton = screen.getByLabelText('Open AI Assistant');
    fireEvent.click(floatingButton);
    
    await waitFor(() => {
      expect(screen.getByText("Gaurav's Personal Assistance")).toBeInTheDocument();
      expect(screen.queryByText("Welcome to Gaurav's AI Assistant")).not.toBeInTheDocument();
    });
  });

  it('navigates between tabs correctly', async () => {
    render(<EnterpriseAIAssistant isPortfolioLoaded={true} />);
    
    const floatingButton = screen.getByLabelText('Open AI Assistant');
    fireEvent.click(floatingButton);
    
    await waitFor(() => {
      expect(screen.getByText('Quick Questions')).toBeInTheDocument();
    });
    
    const chatTab = screen.getByText('AI Chat');
    fireEvent.click(chatTab);
    
    await waitFor(() => {
      expect(screen.getByText('Ask me anything about Gaurav\'s portfolio')).toBeInTheDocument();
    });
  });

  it('handles keyboard shortcuts correctly', async () => {
    render(<EnterpriseAIAssistant isPortfolioLoaded={true} />);
    
    // Test Ctrl+Shift+A to open
    fireEvent.keyDown(window, { key: 'A', ctrlKey: true, shiftKey: true });
    
    await waitFor(() => {
      expect(screen.getByText("Gaurav's Personal Assistance")).toBeInTheDocument();
    });
    
    // Test Escape to close
    fireEvent.keyDown(window, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByText("Gaurav's Personal Assistance")).not.toBeInTheDocument();
    });
  });

  it('toggles Jarvis animation setting', async () => {
    render(<EnterpriseAIAssistant isPortfolioLoaded={true} />);
    
    const floatingButton = screen.getByLabelText('Open AI Assistant');
    fireEvent.click(floatingButton);
    
    await waitFor(() => {
      const settingsTab = screen.getByText('Settings');
      fireEvent.click(settingsTab);
    });
    
    await waitFor(() => {
      const jarvisToggle = screen.getByText('Enabled');
      fireEvent.click(jarvisToggle);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'ai-assistant-flags',
        JSON.stringify({ jarvisEnabled: false })
      );
    });
  });

  it('handles question clicks correctly', async () => {
    render(<EnterpriseAIAssistant isPortfolioLoaded={true} />);
    
    const floatingButton = screen.getByLabelText('Open AI Assistant');
    fireEvent.click(floatingButton);
    
    await waitFor(() => {
      const questionCard = screen.getByText('What projects has Gaurav worked on?');
      fireEvent.click(questionCard);
    });
    
    await waitFor(() => {
      expect(screen.getByText('AI Chat')).toBeInTheDocument();
      expect(screen.getByText('What projects has Gaurav worked on?')).toBeInTheDocument();
    });
  });

  it('sends chat messages correctly', async () => {
    render(<EnterpriseAIAssistant isPortfolioLoaded={true} />);
    
    const floatingButton = screen.getByLabelText('Open AI Assistant');
    fireEvent.click(floatingButton);
    
    await waitFor(() => {
      const chatTab = screen.getByText('AI Chat');
      fireEvent.click(chatTab);
    });
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Type your question or pick a suggested prompt...');
      const sendButton = screen.getByText('Send');
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('minimizes and restores correctly', async () => {
    render(<EnterpriseAIAssistant isPortfolioLoaded={true} />);
    
    const floatingButton = screen.getByLabelText('Open AI Assistant');
    fireEvent.click(floatingButton);
    
    await waitFor(() => {
      const minimizeButton = screen.getByTitle('Minimize (Ctrl+Shift+A)');
      fireEvent.click(minimizeButton);
    });
    
    // Should show minimized state
    await waitFor(() => {
      expect(screen.queryByText("Gaurav's Personal Assistance")).not.toBeInTheDocument();
    });
  });
});