import { BanCategory, BanCategoryOption } from '@/types/banSystem';

export class BanCategoryMapper {
  private static readonly reasonToCategory: Record<string, BanCategory> = {
    'spam': 'normal',
    'inappropriate': 'medium',
    'harassment': 'danger',
    'abuse': 'severe',
    'security': 'severe',
    'terms': 'medium',
    'custom': 'normal'
  };

  private static readonly severityToCategory: Record<number, BanCategory> = {
    1: 'normal',
    2: 'normal',
    3: 'medium',
    4: 'medium',
    5: 'medium',
    6: 'danger',
    7: 'danger',
    8: 'danger',
    9: 'severe',
    10: 'severe'
  };

  /**
   * Get all available ban category options
   */
  static getAllCategoryOptions(): BanCategoryOption[] {
    return [
      {
        value: 'normal',
        label: 'Normal',
        description: 'Standard policy violation',
        color: '#3B82F6',
        icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        severity: 2
      },
      {
        value: 'medium',
        label: 'Medium',
        description: 'Moderate policy violation',
        color: '#F59E0B',
        icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
        severity: 5
      },
      {
        value: 'danger',
        label: 'Danger',
        description: 'Serious policy violation',
        color: '#F97316',
        icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        severity: 7
      },
      {
        value: 'severe',
        label: 'Severe',
        description: 'Critical security violation',
        color: '#DC2626',
        icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728',
        severity: 9
      }
    ];
  }

  /**
   * Suggest category based on ban reason
   */
  static suggestCategoryFromReason(reason: string): BanCategory {
    const normalizedReason = reason.toLowerCase();
    
    // Check for exact matches first
    for (const [key, category] of Object.entries(this.reasonToCategory)) {
      if (normalizedReason.includes(key)) {
        return category;
      }
    }

    // Check for severity keywords
    if (this.containsSevereKeywords(normalizedReason)) {
      return 'severe';
    }
    
    if (this.containsDangerKeywords(normalizedReason)) {
      return 'danger';
    }
    
    if (this.containsMediumKeywords(normalizedReason)) {
      return 'medium';
    }

    // Default to normal
    return 'normal';
  }

  /**
   * Get category from severity score (1-10)
   */
  static getCategoryFromSeverity(severity: number): BanCategory {
    const clampedSeverity = Math.max(1, Math.min(10, Math.round(severity)));
    return this.severityToCategory[clampedSeverity] || 'normal';
  }

  /**
   * Get severity score from category
   */
  static getSeverityFromCategory(category: BanCategory): number {
    const categoryToSeverity: Record<BanCategory, number> = {
      'normal': 2,
      'medium': 5,
      'danger': 7,
      'severe': 9
    };
    
    return categoryToSeverity[category] || 2;
  }

  /**
   * Get display information for category
   */
  static getCategoryDisplayInfo(category: BanCategory) {
    const options = this.getAllCategoryOptions();
    return options.find(option => option.value === category) || options[0];
  }

  private static containsSevereKeywords(reason: string): boolean {
    const severeKeywords = [
      'threat', 'violence', 'illegal', 'criminal', 'fraud',
      'identity theft', 'doxxing', 'stalking', 'malware'
    ];
    
    return severeKeywords.some(keyword => reason.includes(keyword));
  }

  private static containsDangerKeywords(reason: string): boolean {
    const dangerKeywords = [
      'harassment', 'bullying', 'hate speech', 'discrimination',
      'explicit content', 'privacy violation', 'impersonation'
    ];
    
    return dangerKeywords.some(keyword => reason.includes(keyword));
  }

  private static containsMediumKeywords(reason: string): boolean {
    const mediumKeywords = [
      'repeated violation', 'suspicious activity', 'policy breach',
      'terms violation', 'community guidelines'
    ];
    
    return mediumKeywords.some(keyword => reason.includes(keyword));
  }
}