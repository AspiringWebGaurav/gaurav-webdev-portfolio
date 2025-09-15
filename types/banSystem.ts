export type BanCategory = 'normal' | 'medium' | 'danger' | 'severe';

export interface BanPageDesign {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  sortOrder: number;
  theme: BanPageTheme;
  content: BanPageContent;
  layout: BanPageLayout;
  animations: BanPageAnimations;
  responsive: BanPageResponsive;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  changelog: BanPageChangelogEntry[];
}

export interface BanPageTheme {
  primaryColor: string;
  secondaryColor: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  shadowColor: string;
}

export interface BanPageContent {
  title: string;
  subtitle: string;
  description: string;
  warningLevel: 'info' | 'warning' | 'danger' | 'critical';
  icon: BanPageIcon;
  processingTime: string;
  appealMessage: string;
  buttonText: string;
  statusBadge: string;
}

export interface BanPageIcon {
  type: 'svg' | 'emoji' | 'icon';
  value: string;
  size: string;
  color: string;
}

export interface BanPageLayout {
  headerHeight: string;
  contentPadding: string;
  borderRadius: string;
  shadowIntensity: 'light' | 'medium' | 'heavy';
  animationStyle: 'subtle' | 'moderate' | 'intense';
  spacing: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface BanPageAnimations {
  transition: {
    duration: string;
    easing: string;
  };
  pulse: {
    enabled: boolean;
    color: string;
    duration: string;
  };
  entrance: {
    type: 'fade' | 'slide' | 'scale';
    duration: string;
    delay: string;
  };
}

export interface BanPageResponsive {
  mobile: BanPageBreakpoint;
  tablet: BanPageBreakpoint;
  desktop: BanPageBreakpoint;
}

export interface BanPageBreakpoint {
  padding: string;
  fontSize: {
    title: string;
    subtitle: string;
    body: string;
  };
  gridColumns: number;
}

export interface BanPageChangelogEntry {
  version: number;
  changes: string;
  updatedBy: string;
  updatedAt: string;
}

export interface BanCategoryHistory {
  category: BanCategory;
  timestamp: string;
  adminId: string;
  reason: string;
  previousCategory?: BanCategory;
}

export interface BanMetadata {
  severity: number;
  autoCategory: boolean;
  manualOverride: boolean;
  escalationPath: BanEscalation[];
}

export interface BanEscalation {
  fromCategory: BanCategory;
  toCategory: BanCategory;
  timestamp: string;
  adminId: string;
  reason: string;
}

export interface BanCategoryOption {
  value: BanCategory;
  label: string;
  description: string;
  color: string;
  icon: string;
  severity: number;
}