/**
 * Test Data Generator for API Testing
 * 
 * This file contains sample data generators for all API resources.
 * Use these to create consistent test data across different test suites.
 */

export const TestData = {
  // Tech Stacks
  techStacks: {
    valid: [
      { name: "TypeScript", order: 1, isActive: true },
      { name: "React", order: 2, isActive: true },
      { name: "Next.js", order: 3, isActive: true },
      { name: "Node.js", order: 4, isActive: true },
      { name: "Firebase", order: 5, isActive: true },
    ],
    invalid: {
      tooShort: { name: "T" }, // Name too short (< 2 chars)
      tooLong: { name: "A".repeat(31) }, // Name too long (> 30 chars)
      missingName: { order: 1 }, // Missing required field
      invalidType: { name: 123 }, // Wrong data type
    },
    minimal: { name: "Go" }, // Minimal valid data
  },

  // Projects
  projects: {
    valid: [
      {
        title: "E-Commerce Platform",
        des: "A full-stack e-commerce platform built with Next.js, featuring real-time inventory management and secure payment processing.",
        img: "https://example.com/images/ecommerce.jpg",
        images: [
          "https://example.com/images/ecommerce-1.jpg",
          "https://example.com/images/ecommerce-2.jpg",
        ],
        iconLists: [
          "/icons/react.svg",
          "/icons/nextjs.svg",
          "/icons/stripe.svg",
        ],
        link: "https://github.com/example/ecommerce",
        order: 1,
        isActive: true,
      },
      {
        title: "Task Management App",
        des: "Collaborative task management application with real-time updates, team workspaces, and productivity analytics.",
        img: "https://example.com/images/taskapp.jpg",
        iconLists: ["/icons/react.svg", "/icons/firebase.svg"],
        link: "https://taskapp.example.com",
        order: 2,
        isActive: true,
      },
    ],
    invalid: {
      shortTitle: {
        title: "AB",
        des: "Valid description here",
        img: "https://example.com/image.jpg",
        iconLists: ["/icon.svg"],
        link: "https://example.com",
      },
      shortDescription: {
        title: "Valid Title",
        des: "Too short",
        img: "https://example.com/image.jpg",
        iconLists: ["/icon.svg"],
        link: "https://example.com",
      },
      invalidUrl: {
        title: "Valid Title",
        des: "Valid description here",
        img: "not-a-url",
        iconLists: ["/icon.svg"],
        link: "https://example.com",
      },
      emptyIconList: {
        title: "Valid Title",
        des: "Valid description here",
        img: "https://example.com/image.jpg",
        iconLists: [],
        link: "https://example.com",
      },
      tooManyIcons: {
        title: "Valid Title",
        des: "Valid description here",
        img: "https://example.com/image.jpg",
        iconLists: Array(11).fill("/icon.svg"),
        link: "https://example.com",
      },
      missingRequired: {
        title: "Valid Title",
        des: "Valid description here",
        // Missing img, iconLists, link
      },
    },
    minimal: {
      title: "Minimal Project",
      des: "This is a minimal valid project with all required fields only.",
      img: "https://example.com/minimal.jpg",
      iconLists: ["/icons/default.svg"],
      link: "https://example.com/minimal",
    },
  },

  // Testimonials
  testimonials: {
    valid: [
      {
        quote: "Working with this developer was an absolute pleasure. The project was delivered on time and exceeded all expectations.",
        name: "John Smith",
        title: "CEO at TechCorp",
        img: "https://example.com/images/john.jpg",
        order: 1,
        isActive: true,
      },
      {
        quote: "Exceptional quality and attention to detail. The final product was exactly what we needed and more.",
        name: "Sarah Johnson",
        title: "Product Manager at StartupXYZ",
        order: 2,
        isActive: true,
      },
    ],
    batch: [
      {
        quote: "Outstanding work! The developer demonstrated deep technical expertise and excellent communication throughout the project.",
        name: "Michael Chen",
        title: "CTO at InnovateLab",
      },
      {
        quote: "Highly recommend! Professional, efficient, and delivered a product that truly transformed our business operations.",
        name: "Emily Rodriguez",
        title: "Founder of DesignStudio",
      },
    ],
    invalid: {
      shortQuote: {
        quote: "Too short",
        name: "Valid Name",
        title: "Valid Title",
      },
      longQuote: {
        quote: "A".repeat(501),
        name: "Valid Name",
        title: "Valid Title",
      },
      shortName: {
        quote: "This is a valid testimonial quote that meets the minimum length requirement.",
        name: "A",
        title: "Valid Title",
      },
      shortTitle: {
        quote: "This is a valid testimonial quote that meets the minimum length requirement.",
        name: "Valid Name",
        title: "A",
      },
      missingRequired: {
        quote: "This is a valid testimonial quote that meets the minimum length requirement.",
        // Missing name and title
      },
    },
    minimal: {
      quote: "Great experience working together!",
      name: "Jane Doe",
      title: "Developer",
    },
  },

  // Work Experience
  workExperience: {
    valid: [
      {
        title: "Senior Full-Stack Developer",
        desc: "Led development of microservices architecture, mentored junior developers, and implemented CI/CD pipelines.",
        thumbnail: "https://example.com/images/company1.png",
        company: "Tech Giants Inc.",
        duration: "2021 - Present",
        location: "San Francisco, CA",
        order: 1,
        isActive: true,
      },
      {
        title: "Frontend Developer",
        desc: "Developed responsive web applications using React and TypeScript, optimized performance and user experience.",
        thumbnail: "https://example.com/images/company2.png",
        company: "StartupXYZ",
        duration: "2019 - 2021",
        location: "Remote",
        order: 2,
        isActive: true,
      },
    ],
    invalid: {
      shortTitle: {
        title: "AB",
        desc: "Valid description here with enough characters",
        thumbnail: "https://example.com/thumb.png",
      },
      shortDescription: {
        title: "Valid Title",
        desc: "Too short",
        thumbnail: "https://example.com/thumb.png",
      },
      invalidThumbnail: {
        title: "Valid Title",
        desc: "Valid description here with enough characters",
        thumbnail: "not-a-valid-url",
      },
      missingRequired: {
        title: "Valid Title",
        // Missing desc and thumbnail
      },
    },
    minimal: {
      title: "Junior Developer",
      desc: "Developed web applications and learned new technologies.",
      thumbnail: "https://example.com/thumb.png",
    },
  },

  // Currently Working
  currentlyWorking: {
    valid: [
      {
        headingTitle: "Currently Working",
        title: "Building a real-time collaboration platform",
        description: "Developing a WebRTC-based platform for seamless team collaboration with video, chat, and screen sharing features.",
        blogContent: "# Project Overview\n\nThis platform aims to revolutionize remote work...",
        images: [
          "https://example.com/images/project1.jpg",
          "https://example.com/images/project2.jpg",
        ],
        iconLists: [
          "/icons/react.svg",
          "/icons/webrtc.svg",
          "/icons/nodejs.svg",
        ],
        githubLink: "https://github.com/example/collab-platform",
        liveLink: "https://collab.example.com",
        isActive: true,
        showBlogNotification: true,
      },
    ],
    invalid: {
      shortHeadingTitle: {
        headingTitle: "AB",
        title: "Valid title here",
        description: "Valid description with enough characters",
        iconLists: ["/icon.svg"],
      },
      shortTitle: {
        headingTitle: "Currently Working",
        title: "AB",
        description: "Valid description with enough characters",
        iconLists: ["/icon.svg"],
      },
      shortDescription: {
        headingTitle: "Currently Working",
        title: "Valid title here",
        description: "Too short",
        iconLists: ["/icon.svg"],
      },
      emptyIconList: {
        headingTitle: "Currently Working",
        title: "Valid title here",
        description: "Valid description with enough characters",
        iconLists: [],
      },
      tooManyImages: {
        headingTitle: "Currently Working",
        title: "Valid title here",
        description: "Valid description with enough characters",
        iconLists: ["/icon.svg"],
        images: Array(6).fill("https://example.com/image.jpg"),
      },
      longBlogContent: {
        headingTitle: "Currently Working",
        title: "Valid title here",
        description: "Valid description with enough characters",
        iconLists: ["/icon.svg"],
        blogContent: "A".repeat(10001),
      },
    },
    minimal: {
      headingTitle: "Working On",
      title: "New project",
      description: "Building something cool",
      iconLists: ["/icons/default.svg"],
    },
  },

  // Bubble Sessions
  bubbleSessions: {
    valid: [
      {
        mask: "visitor_" + Date.now(),
        role: "visitor",
      },
    ],
    invalid: {
      missingMask: {
        role: "visitor",
      },
      invalidRole: {
        mask: "visitor_123",
        role: "invalid_role",
      },
    },
  },

  // Bubble Messages
  bubbleMessages: {
    valid: [
      {
        sessionId: "uuid-placeholder",
        role: "visitor",
        content: "Hello! I have a question about your portfolio.",
        visitorEmail: "visitor@example.com",
      },
      {
        sessionId: "uuid-placeholder",
        role: "admin",
        content: "Hi! I'd be happy to help. What would you like to know?",
      },
    ],
    invalid: {
      missingSessionId: {
        role: "visitor",
        content: "Message content",
      },
      missingRole: {
        sessionId: "uuid-placeholder",
        content: "Message content",
      },
      emptyContent: {
        sessionId: "uuid-placeholder",
        role: "visitor",
        content: "",
      },
      invalidRole: {
        sessionId: "uuid-placeholder",
        role: "invalid",
        content: "Message content",
      },
    },
  },

  // Bubble Questions
  bubbleQuestions: {
    valid: [
      {
        question: "What services do you offer?",
        answer: "I offer full-stack web development, including frontend (React, Next.js), backend (Node.js, Python), and cloud infrastructure setup.",
        order: 1,
      },
      {
        question: "What's your hourly rate?",
        answer: "My rate varies depending on project complexity and duration. Please contact me for a custom quote.",
        order: 2,
      },
    ],
    invalid: {
      missingQuestion: {
        answer: "This is an answer",
      },
      missingAnswer: {
        question: "This is a question",
      },
      emptyStrings: {
        question: "",
        answer: "",
      },
    },
  },

  // Ban Appeals
  banAppeals: {
    valid: [
      {
        visitorMask: "visitor_banned_123",
        reason: "I believe I was banned by mistake. I was simply browsing the portfolio and submitting a legitimate contact form. I would appreciate if you could review my ban. Thank you.",
        contactEmail: "banned.user@example.com",
      },
    ],
    invalid: {
      shortReason: {
        visitorMask: "visitor_123",
        reason: "Too short reason",
        contactEmail: "user@example.com",
      },
      longReason: {
        visitorMask: "visitor_123",
        reason: "A".repeat(1001),
        contactEmail: "user@example.com",
      },
      invalidEmail: {
        visitorMask: "visitor_123",
        reason: "Valid reason with enough characters to meet minimum length requirement.",
        contactEmail: "not-an-email",
      },
      missingRequired: {
        visitorMask: "visitor_123",
        // Missing reason and contactEmail
      },
    },
  },

  // Visitor Ban
  visitorBan: {
    valid: [
      {
        mask: "visitor_spam_123",
        reason: "Spam submissions",
        bannedBy: "admin",
        duration: "1day",
      },
      {
        mask: "visitor_abuse_456",
        reason: "Abusive language",
        bannedBy: "admin",
        duration: "permanent",
      },
    ],
    invalid: {
      missingMask: {
        reason: "Valid reason",
        duration: "1day",
      },
      invalidDuration: {
        mask: "visitor_123",
        reason: "Valid reason",
        duration: "invalid_duration",
      },
    },
  },

  // Helper functions
  generators: {
    /**
     * Generate a random tech stack
     */
    randomTechStack: () => {
      const techs = ["TypeScript", "React", "Vue", "Angular", "Node.js", "Python", "Go", "Rust"];
      return {
        name: techs[Math.floor(Math.random() * techs.length)],
        order: Math.floor(Math.random() * 20) + 1,
        isActive: Math.random() > 0.2,
      };
    },

    /**
     * Generate a random project
     */
    randomProject: () => {
      const titles = ["E-Commerce Platform", "Task Manager", "Social Network", "Blog Engine", "CMS System"];
      const title = titles[Math.floor(Math.random() * titles.length)];
      return {
        title,
        des: `A full-featured ${title.toLowerCase()} built with modern technologies and best practices.`,
        img: `https://picsum.photos/400/300?random=${Math.random()}`,
        iconLists: ["/icons/react.svg", "/icons/nodejs.svg"],
        link: `https://github.com/example/${title.toLowerCase().replace(/\s+/g, '-')}`,
        isActive: Math.random() > 0.3,
      };
    },

    /**
     * Generate a random visitor mask
     */
    randomVisitorMask: () => {
      return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Generate a random email
     */
    randomEmail: () => {
      const domains = ["example.com", "test.com", "demo.com"];
      const name = Math.random().toString(36).substr(2, 8);
      return `${name}@${domains[Math.floor(Math.random() * domains.length)]}`;
    },

    /**
     * Generate a random UUID (for testing)
     */
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
  },
};

// Export individual categories for convenience
export const {
  techStacks,
  projects,
  testimonials,
  workExperience,
  currentlyWorking,
  bubbleSessions,
  bubbleMessages,
  bubbleQuestions,
  banAppeals,
  visitorBan,
  generators,
} = TestData;

export default TestData;
