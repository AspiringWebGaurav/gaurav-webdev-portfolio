export interface ResumeBasics {
  name: string;
  label: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
}

export interface ResumeSkillCategory {
  category: string;
  skills: string[];
}

export interface ResumeExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  highlights: string[];
}

export interface ResumeProjectItem {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  highlights: string[];
  liveUrl?: string;
  githubUrl?: string;
}

export interface ResumeEducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  honors?: string;
}

export interface ResumeCertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface ResumeData {
  basics: ResumeBasics;
  skillCategories: ResumeSkillCategory[];
  experience: ResumeExperienceItem[];
  projects: ResumeProjectItem[];
  education: ResumeEducationItem[];
  certifications: ResumeCertificationItem[];
  updatedAt: number;
  version: number;
  status?: "active" | "suspended" | "hired";
  statusMessage?: string;
}

export interface ResumeVisitorSession {
  email: string;
  name: string;
  company?: string | null;
  countryCode?: string | null;
  verifiedAt: number;
  expiresAt: number;
}

export interface ResumeOtpChallengePayload {
  email: string;
  name: string;
  company?: string | null;
  otpHash: string;
  salt: string;
  clientIp: string;
  countryCode?: string | null;
  attempts: number;
  createdAt: number;
  expiresAt: number;
}
