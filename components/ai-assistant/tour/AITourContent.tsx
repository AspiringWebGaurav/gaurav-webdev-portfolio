import React from 'react';
import { TourStep } from './types';

// Tour step content with engaging copy and visuals
export const tourSteps: TourStep[] = [
  {
    id: 1,
    title: "Welcome to Gaurav's AI Assistant! 👋",
    description: "Your personal guide to exploring Gaurav's portfolio",
    icon: "🎉",
    content: (
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl mb-4 animate-pulse">
          🤖
        </div>
        <div className="space-y-3">
          <p className="text-lg text-white/90">
            Hi there! I'm Gaurav's Personal AI Assistant, here to help you discover his amazing work.
          </p>
          <p className="text-sm text-white/70">
            I can answer questions about his projects, skills, experience, and much more!
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mt-4">
            <div className="flex items-center justify-center space-x-6 text-xs text-white/60">
              <div className="flex items-center space-x-1">
                <span>💼</span>
                <span>Portfolio</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🚀</span>
                <span>Projects</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>⚡</span>
                <span>Skills</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    skipable: true
  },
  {
    id: 2,
    title: "How to Ask Questions 💬",
    description: "Learn the best ways to interact with me",
    icon: "💬",
    content: (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-2xl mb-3">
            💬
          </div>
          <p className="text-white/90">Here are some great questions you can ask:</p>
        </div>
        
        <div className="space-y-3">
          {[
            { icon: "🚀", text: "What projects has Gaurav worked on?" },
            { icon: "⚡", text: "What are his technical skills?" },
            { icon: "📞", text: "How can I contact Gaurav?" },
            { icon: "📄", text: "Can I see his resume?" }
          ].map((item, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm text-white/80">{item.text}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-3 border border-blue-400/30">
          <p className="text-xs text-white/70 text-center">
            💡 Tip: I understand natural language, so feel free to ask in your own words!
          </p>
        </div>
      </div>
    ),
    skipable: true
  },
  {
    id: 3,
    title: "Key Features ⚡",
    description: "Discover what makes me special",
    icon: "⚡",
    content: (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl mb-3">
            ⚡
          </div>
          <p className="text-white/90">Here's what I can do for you:</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { 
              icon: "🎯", 
              title: "Smart Answers", 
              desc: "Get detailed responses about Gaurav's work" 
            },
            { 
              icon: "🔗", 
              title: "Quick Links", 
              desc: "Direct access to projects and portfolio sections" 
            },
            { 
              icon: "📱", 
              title: "Mobile Friendly", 
              desc: "Perfectly optimized for all screen sizes" 
            },
            { 
              icon: "⚡", 
              title: "Lightning Fast", 
              desc: "Get instant responses to your questions" 
            }
          ].map((feature, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-200">
              <div className="text-center space-y-2">
                <div className="text-2xl">{feature.icon}</div>
                <div className="text-sm font-medium text-white/90">{feature.title}</div>
                <div className="text-xs text-white/60">{feature.desc}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-3 border border-green-400/30">
          <p className="text-xs text-white/70 text-center">
            🌟 I'm constantly learning and improving to help you better!
          </p>
        </div>
      </div>
    ),
    skipable: true
  },
  {
    id: 4,
    title: "Ready to Start Chatting? 🚀",
    description: "Let's begin your journey!",
    icon: "🚀",
    content: (
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-3xl mb-4 animate-bounce">
          🚀
        </div>
        
        <div className="space-y-3">
          <p className="text-lg text-white/90 font-medium">
            You're all set to explore Gaurav's portfolio!
          </p>
          <p className="text-sm text-white/70">
            Click "Start Chatting" below and I'll be ready to answer any questions you have.
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-400/30 space-y-3">
          <p className="text-sm text-white/80 font-medium">Popular starter questions:</p>
          <div className="space-y-2">
            {[
              "Tell me about Gaurav's latest projects",
              "What technologies does he specialize in?",
              "How can I get in touch with him?"
            ].map((question, index) => (
              <div key={index} className="text-xs text-white/60 bg-white/5 rounded-md px-3 py-2">
                "{question}"
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-2 text-white/60">
          <span className="text-lg">✨</span>
          <span className="text-sm">Let's make this conversation amazing!</span>
          <span className="text-lg">✨</span>
        </div>
      </div>
    ),
    action: {
      text: "Start Chatting",
      handler: () => {
        // This will be handled by the AIAssistant component
        console.log('Tour completed - opening AI chat...');
      }
    },
    skipable: false
  }
];

// Helper function to get step by ID
export const getTourStep = (stepId: number): TourStep | undefined => {
  return tourSteps.find(step => step.id === stepId);
};

// Helper function to get next step
export const getNextStep = (currentStepId: number): TourStep | undefined => {
  return tourSteps.find(step => step.id === currentStepId + 1);
};

// Helper function to get previous step
export const getPreviousStep = (currentStepId: number): TourStep | undefined => {
  return tourSteps.find(step => step.id === currentStepId - 1);
};

// Get total number of steps
export const getTotalSteps = (): number => {
  return tourSteps.length;
};