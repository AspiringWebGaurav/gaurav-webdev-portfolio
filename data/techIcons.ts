/**
 * Technology Icons Library
 * Common technology stack icons for portfolio projects
 */

export interface TechIcon {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const TECH_ICON_CATEGORIES = [
  "Frontend",
  "Backend",
  "Database",
  "Cloud",
  "Tools",
  "Mobile",
  "AI/ML",
  "Other",
] as const;

export type TechIconCategory = (typeof TECH_ICON_CATEGORIES)[number];

/**
 * Technology Icons Collection
 * Using CDN URLs for popular tech icons with @latest for reliability
 */
export const TECH_ICONS: TechIcon[] = [
  // Frontend
  {
    id: "react",
    name: "React",
    category: "Frontend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg",
  },
  {
    id: "nextjs",
    name: "Next.js",
    category: "Frontend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg",
  },
  {
    id: "vue",
    name: "Vue.js",
    category: "Frontend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg",
  },
  {
    id: "angular",
    name: "Angular",
    category: "Frontend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angularjs/angularjs-original.svg",
  },
  {
    id: "typescript",
    name: "TypeScript",
    category: "Frontend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg",
  },
  {
    id: "javascript",
    name: "JavaScript",
    category: "Frontend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg",
  },
  {
    id: "tailwind",
    name: "Tailwind CSS",
    category: "Frontend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg",
  },
  {
    id: "html5",
    name: "HTML5",
    category: "Frontend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg",
  },
  {
    id: "css3",
    name: "CSS3",
    category: "Frontend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg",
  },
  {
    id: "sass",
    name: "Sass",
    category: "Frontend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/sass/sass-original.svg",
  },
  {
    id: "redux",
    name: "Redux",
    category: "Frontend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/redux/redux-original.svg",
  },
  {
    id: "threejs",
    name: "Three.js",
    category: "Frontend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/threejs/threejs-original.svg",
  },

  // Backend
  {
    id: "nodejs",
    name: "Node.js",
    category: "Backend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg",
  },
  {
    id: "express",
    name: "Express",
    category: "Backend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg",
  },
  {
    id: "python",
    name: "Python",
    category: "Backend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg",
  },
  {
    id: "django",
    name: "Django",
    category: "Backend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/django/django-plain.svg",
  },
  {
    id: "flask",
    name: "Flask",
    category: "Backend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/flask/flask-original.svg",
  },
  {
    id: "php",
    name: "PHP",
    category: "Backend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg",
  },
  {
    id: "laravel",
    name: "Laravel",
    category: "Backend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/laravel/laravel-original.svg",
  },
  {
    id: "java",
    name: "Java",
    category: "Backend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg",
  },
  {
    id: "spring",
    name: "Spring",
    category: "Backend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/spring/spring-original.svg",
  },
  {
    id: "go",
    name: "Go",
    category: "Backend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg",
  },
  {
    id: "ruby",
    name: "Ruby",
    category: "Backend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ruby/ruby-original.svg",
  },
  {
    id: "rails",
    name: "Rails",
    category: "Backend",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rails/rails-plain.svg",
  },

  // Database
  {
    id: "mongodb",
    name: "MongoDB",
    category: "Database",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg",
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    category: "Database",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg",
  },
  {
    id: "mysql",
    name: "MySQL",
    category: "Database",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg",
  },
  {
    id: "redis",
    name: "Redis",
    category: "Database",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/redis/redis-original.svg",
  },
  {
    id: "firebase",
    name: "Firebase",
    category: "Database",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-plain.svg",
  },
  {
    id: "supabase",
    name: "Supabase",
    category: "Database",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/supabase/supabase-original.svg",
  },

  // Cloud & Infrastructure
  {
    id: "aws",
    name: "AWS",
    category: "Cloud",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg",
  },
  {
    id: "gcp",
    name: "Google Cloud",
    category: "Cloud",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg",
  },
  {
    id: "azure",
    name: "Azure",
    category: "Cloud",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg",
  },
  {
    id: "docker",
    name: "Docker",
    category: "Cloud",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg",
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    category: "Cloud",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kubernetes/kubernetes-plain.svg",
  },
  {
    id: "vercel",
    name: "Vercel",
    category: "Cloud",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vercel/vercel-original.svg",
  },
  {
    id: "netlify",
    name: "Netlify",
    category: "Cloud",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/netlify/netlify-original.svg",
  },

  // Tools & Version Control
  {
    id: "git",
    name: "Git",
    category: "Tools",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg",
  },
  {
    id: "github",
    name: "GitHub",
    category: "Tools",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg",
  },
  {
    id: "gitlab",
    name: "GitLab",
    category: "Tools",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/gitlab/gitlab-original.svg",
  },
  {
    id: "vscode",
    name: "VS Code",
    category: "Tools",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vscode/vscode-original.svg",
  },
  {
    id: "figma",
    name: "Figma",
    category: "Tools",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg",
  },
  {
    id: "webpack",
    name: "Webpack",
    category: "Tools",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/webpack/webpack-original.svg",
  },
  {
    id: "vite",
    name: "Vite",
    category: "Tools",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg",
  },

  // Mobile
  {
    id: "react-native",
    name: "React Native",
    category: "Mobile",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg",
  },
  {
    id: "flutter",
    name: "Flutter",
    category: "Mobile",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/flutter/flutter-original.svg",
  },
  {
    id: "android",
    name: "Android",
    category: "Mobile",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/android/android-original.svg",
  },
  {
    id: "swift",
    name: "Swift",
    category: "Mobile",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swift/swift-original.svg",
  },
  {
    id: "kotlin",
    name: "Kotlin",
    category: "Mobile",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kotlin/kotlin-original.svg",
  },

  // AI/ML
  {
    id: "tensorflow",
    name: "TensorFlow",
    category: "AI/ML",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tensorflow/tensorflow-original.svg",
  },
  {
    id: "pytorch",
    name: "PyTorch",
    category: "AI/ML",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/pytorch/pytorch-original.svg",
  },
  {
    id: "opencv",
    name: "OpenCV",
    category: "AI/ML",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/opencv/opencv-original.svg",
  },

  // Other
  {
    id: "graphql",
    name: "GraphQL",
    category: "Other",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/graphql/graphql-plain.svg",
  },
  {
    id: "socketio",
    name: "Socket.io",
    category: "Other",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/socketio/socketio-original.svg",
  },
  {
    id: "nginx",
    name: "Nginx",
    category: "Other",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nginx/nginx-original.svg",
  },
  {
    id: "jest",
    name: "Jest",
    category: "Other",
    url: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jest/jest-plain.svg",
  },
];

/**
 * Get icons by category
 */
export function getIconsByCategory(category: TechIconCategory): TechIcon[] {
  return TECH_ICONS.filter((icon) => icon.category === category);
}

/**
 * Search icons by name
 */
export function searchIcons(query: string): TechIcon[] {
  const lowerQuery = query.toLowerCase();
  return TECH_ICONS.filter((icon) =>
    icon.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get icon by ID
 */
export function getIconById(id: string): TechIcon | undefined {
  return TECH_ICONS.find((icon) => icon.id === id);
}
