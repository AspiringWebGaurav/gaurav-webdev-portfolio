import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { BanPageDesign, BanCategory } from '@/types/banSystem';

export class BanPageDesignService {
  private static cache = new Map<BanCategory, BanPageDesign>();
  private static cacheExpiry = new Map<BanCategory, number>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get design configuration for a specific category
   */
  static async getDesign(category: BanCategory): Promise<BanPageDesign | null> {
    try {
      // Check cache first
      const cached = this.getCachedDesign(category);
      if (cached) return cached;

      const docRef = doc(db, 'banPageDesigns', category);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const design = docSnap.data() as BanPageDesign;
        this.setCachedDesign(category, design);
        return design;
      }
      
      // Return default design if not found
      return this.getDefaultDesign(category);
    } catch (error) {
      console.error(`Error fetching design for category ${category}:`, error);
      return this.getDefaultDesign(category);
    }
  }

  /**
   * Get all active design configurations
   */
  static async getAllDesigns(): Promise<BanPageDesign[]> {
    try {
      const q = query(
        collection(db, 'banPageDesigns'),
        where('isActive', '==', true),
        orderBy('sortOrder', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const designs = querySnapshot.docs.map(doc => doc.data() as BanPageDesign);
      
      // If no designs found, return defaults
      if (designs.length === 0) {
        return this.getAllDefaultDesigns();
      }
      
      return designs;
    } catch (error) {
      console.error('Error fetching all designs:', error);
      return this.getAllDefaultDesigns();
    }
  }

  /**
   * Subscribe to design changes for real-time updates
   */
  static subscribeToDesign(
    category: BanCategory,
    callback: (design: BanPageDesign | null) => void
  ): () => void {
    const docRef = doc(db, 'banPageDesigns', category);
    
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const design = doc.data() as BanPageDesign;
        this.setCachedDesign(category, design);
        callback(design);
      } else {
        // Return default design if not found
        callback(this.getDefaultDesign(category));
      }
    }, (error) => {
      console.error(`Error in design subscription for ${category}:`, error);
      callback(this.getDefaultDesign(category));
    });
  }

  /**
   * Get cached design if still valid
   */
  private static getCachedDesign(category: BanCategory): BanPageDesign | null {
    const cached = this.cache.get(category);
    const expiry = this.cacheExpiry.get(category);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }
    
    // Clean up expired cache
    this.cache.delete(category);
    this.cacheExpiry.delete(category);
    return null;
  }

  /**
   * Set cached design with expiry
   */
  private static setCachedDesign(category: BanCategory, design: BanPageDesign): void {
    this.cache.set(category, design);
    this.cacheExpiry.set(category, Date.now() + this.CACHE_TTL);
  }

  /**
   * Clear all cached designs
   */
  static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get default design for a category (fallback when Firebase is unavailable)
   */
  private static getDefaultDesign(category: BanCategory): BanPageDesign {
    const designs = {
      normal: {
        id: 'normal',
        name: 'normal',
        displayName: 'Normal',
        isActive: true,
        sortOrder: 1,
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#06B6D4',
          gradientFrom: '#3B82F6',
          gradientTo: '#06B6D4',
          accentColor: '#60A5FA',
          textColor: '#FFFFFF',
          backgroundColor: 'from-slate-900 via-gray-900 to-black',
          borderColor: 'border-blue-500/20',
          shadowColor: 'shadow-blue-500/25'
        },
        content: {
          title: 'Access Temporarily Restricted',
          subtitle: 'Portfolio access under policy review',
          description: 'Your access has been temporarily suspended for policy review. This is a standard procedure.',
          warningLevel: 'info' as const,
          icon: {
            type: 'svg' as const,
            value: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            size: 'w-6 h-6',
            color: 'text-blue-400'
          },
          processingTime: '24-48 hours',
          appealMessage: 'If you believe this restriction was applied in error, you may submit an appeal for review.',
          buttonText: 'Submit Appeal',
          statusBadge: 'Under Review'
        },
        layout: {
          headerHeight: 'h-32',
          contentPadding: 'p-6',
          borderRadius: 'rounded-2xl',
          shadowIntensity: 'medium' as const,
          animationStyle: 'subtle' as const,
          spacing: {
            small: '0.5rem',
            medium: '1rem',
            large: '1.5rem'
          }
        },
        animations: {
          transition: {
            duration: '300ms',
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
          },
          pulse: {
            enabled: true,
            color: '#60A5FA',
            duration: '2s'
          },
          entrance: {
            type: 'fade' as const,
            duration: '500ms',
            delay: '100ms'
          }
        },
        responsive: {
          mobile: {
            padding: '1rem',
            fontSize: {
              title: 'text-lg',
              subtitle: 'text-sm',
              body: 'text-xs'
            },
            gridColumns: 1
          },
          tablet: {
            padding: '1.5rem',
            fontSize: {
              title: 'text-xl',
              subtitle: 'text-base',
              body: 'text-sm'
            },
            gridColumns: 2
          },
          desktop: {
            padding: '2rem',
            fontSize: {
              title: 'text-2xl',
              subtitle: 'text-lg',
              body: 'text-base'
            },
            gridColumns: 3
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        version: 1,
        changelog: [{
          version: 1,
          changes: 'Default design configuration',
          updatedBy: 'system',
          updatedAt: new Date().toISOString()
        }]
      },
      medium: {
        id: 'medium',
        name: 'medium',
        displayName: 'Medium',
        isActive: true,
        sortOrder: 2,
        theme: {
          primaryColor: '#F59E0B',
          secondaryColor: '#EAB308',
          gradientFrom: '#F59E0B',
          gradientTo: '#EAB308',
          accentColor: '#FBBF24',
          textColor: '#FFFFFF',
          backgroundColor: 'from-slate-900 via-amber-900/10 to-black',
          borderColor: 'border-amber-500/20',
          shadowColor: 'shadow-amber-500/25'
        },
        content: {
          title: 'Access Suspended',
          subtitle: 'Policy violations detected',
          description: 'Your access has been suspended due to policy violations. Immediate attention required.',
          warningLevel: 'warning' as const,
          icon: {
            type: 'svg' as const,
            value: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
            size: 'w-6 h-6',
            color: 'text-amber-400'
          },
          processingTime: '24-48 hours',
          appealMessage: 'Review the policy violations and submit an appeal if you believe this action was taken in error.',
          buttonText: 'Submit Appeal',
          statusBadge: 'Review Required'
        },
        layout: {
          headerHeight: 'h-32',
          contentPadding: 'p-6',
          borderRadius: 'rounded-2xl',
          shadowIntensity: 'medium' as const,
          animationStyle: 'moderate' as const,
          spacing: {
            small: '0.5rem',
            medium: '1rem',
            large: '1.5rem'
          }
        },
        animations: {
          transition: {
            duration: '400ms',
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
          },
          pulse: {
            enabled: true,
            color: '#FBBF24',
            duration: '1.5s'
          },
          entrance: {
            type: 'slide' as const,
            duration: '600ms',
            delay: '150ms'
          }
        },
        responsive: {
          mobile: {
            padding: '1rem',
            fontSize: {
              title: 'text-lg',
              subtitle: 'text-sm',
              body: 'text-xs'
            },
            gridColumns: 1
          },
          tablet: {
            padding: '1.5rem',
            fontSize: {
              title: 'text-xl',
              subtitle: 'text-base',
              body: 'text-sm'
            },
            gridColumns: 2
          },
          desktop: {
            padding: '2rem',
            fontSize: {
              title: 'text-2xl',
              subtitle: 'text-lg',
              body: 'text-base'
            },
            gridColumns: 3
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        version: 1,
        changelog: [{
          version: 1,
          changes: 'Default design configuration',
          updatedBy: 'system',
          updatedAt: new Date().toISOString()
        }]
      },
      danger: {
        id: 'danger',
        name: 'danger',
        displayName: 'Danger',
        isActive: true,
        sortOrder: 3,
        theme: {
          primaryColor: '#F97316',
          secondaryColor: '#EF4444',
          gradientFrom: '#F97316',
          gradientTo: '#EF4444',
          accentColor: '#FB923C',
          textColor: '#FFFFFF',
          backgroundColor: 'from-slate-900 via-red-900/20 to-black',
          borderColor: 'border-orange-500/30',
          shadowColor: 'shadow-orange-500/25'
        },
        content: {
          title: 'Access Denied',
          subtitle: 'Serious policy violations detected',
          description: 'Access has been denied due to serious policy violations. This action requires immediate administrative review.',
          warningLevel: 'danger' as const,
          icon: {
            type: 'svg' as const,
            value: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
            size: 'w-6 h-6',
            color: 'text-orange-400'
          },
          processingTime: '48-72 hours',
          appealMessage: 'Serious violations have been detected. Appeals will be thoroughly reviewed by our security team.',
          buttonText: 'Submit Formal Appeal',
          statusBadge: 'Security Review'
        },
        layout: {
          headerHeight: 'h-36',
          contentPadding: 'p-6',
          borderRadius: 'rounded-2xl',
          shadowIntensity: 'heavy' as const,
          animationStyle: 'intense' as const,
          spacing: {
            small: '0.75rem',
            medium: '1.25rem',
            large: '2rem'
          }
        },
        animations: {
          transition: {
            duration: '500ms',
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
          },
          pulse: {
            enabled: true,
            color: '#FB923C',
            duration: '1s'
          },
          entrance: {
            type: 'scale' as const,
            duration: '700ms',
            delay: '200ms'
          }
        },
        responsive: {
          mobile: {
            padding: '1rem',
            fontSize: {
              title: 'text-lg',
              subtitle: 'text-sm',
              body: 'text-xs'
            },
            gridColumns: 1
          },
          tablet: {
            padding: '1.5rem',
            fontSize: {
              title: 'text-xl',
              subtitle: 'text-base',
              body: 'text-sm'
            },
            gridColumns: 2
          },
          desktop: {
            padding: '2rem',
            fontSize: {
              title: 'text-2xl',
              subtitle: 'text-lg',
              body: 'text-base'
            },
            gridColumns: 3
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        version: 1,
        changelog: [{
          version: 1,
          changes: 'Default design configuration',
          updatedBy: 'system',
          updatedAt: new Date().toISOString()
        }]
      },
      severe: {
        id: 'severe',
        name: 'severe',
        displayName: 'Severe',
        isActive: true,
        sortOrder: 4,
        theme: {
          primaryColor: '#DC2626',
          secondaryColor: '#991B1B',
          gradientFrom: '#DC2626',
          gradientTo: '#991B1B',
          accentColor: '#F87171',
          textColor: '#FFFFFF',
          backgroundColor: 'from-slate-900 via-red-900/30 to-black',
          borderColor: 'border-red-600/40',
          shadowColor: 'shadow-red-600/25'
        },
        content: {
          title: 'Access Permanently Restricted',
          subtitle: 'Critical security violation',
          description: 'Access has been permanently restricted due to critical policy violations. This decision requires executive review.',
          warningLevel: 'critical' as const,
          icon: {
            type: 'svg' as const,
            value: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728',
            size: 'w-8 h-8',
            color: 'text-red-400'
          },
          processingTime: '72-96 hours',
          appealMessage: 'Critical violations detected. Appeals require executive review and may take extended time to process.',
          buttonText: 'Submit Executive Appeal',
          statusBadge: 'Executive Review'
        },
        layout: {
          headerHeight: 'h-40',
          contentPadding: 'p-8',
          borderRadius: 'rounded-3xl',
          shadowIntensity: 'heavy' as const,
          animationStyle: 'intense' as const,
          spacing: {
            small: '1rem',
            medium: '1.5rem',
            large: '2.5rem'
          }
        },
        animations: {
          transition: {
            duration: '600ms',
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
          },
          pulse: {
            enabled: true,
            color: '#F87171',
            duration: '0.8s'
          },
          entrance: {
            type: 'scale' as const,
            duration: '800ms',
            delay: '250ms'
          }
        },
        responsive: {
          mobile: {
            padding: '1.25rem',
            fontSize: {
              title: 'text-xl',
              subtitle: 'text-base',
              body: 'text-sm'
            },
            gridColumns: 1
          },
          tablet: {
            padding: '1.75rem',
            fontSize: {
              title: 'text-2xl',
              subtitle: 'text-lg',
              body: 'text-base'
            },
            gridColumns: 2
          },
          desktop: {
            padding: '2.5rem',
            fontSize: {
              title: 'text-3xl',
              subtitle: 'text-xl',
              body: 'text-lg'
            },
            gridColumns: 3
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system',
        version: 1,
        changelog: [{
          version: 1,
          changes: 'Default design configuration',
          updatedBy: 'system',
          updatedAt: new Date().toISOString()
        }]
      }
    };

    return designs[category];
  }

  /**
   * Get all default designs
   */
  private static getAllDefaultDesigns(): BanPageDesign[] {
    return [
      this.getDefaultDesign('normal'),
      this.getDefaultDesign('medium'),
      this.getDefaultDesign('danger'),
      this.getDefaultDesign('severe')
    ];
  }
}