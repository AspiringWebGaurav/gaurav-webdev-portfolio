import { db } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { BanCategory, BanCategoryHistory } from '@/types/banSystem';

export class BanCategorySync {
  private static listeners = new Map<string, () => void>();

  /**
   * Update visitor's ban category
   */
  static async updateCategory(
    uuid: string,
    category: BanCategory,
    adminId: string,
    reason: string,
    previousCategory?: BanCategory
  ): Promise<void> {
    try {
      const visitorRef = doc(db, 'visitors', uuid);
      
      const historyEntry: BanCategoryHistory = {
        category,
        timestamp: new Date().toISOString(),
        adminId,
        reason,
        previousCategory
      };

      await updateDoc(visitorRef, {
        banCategory: category,
        banCategoryHistory: arrayUnion(historyEntry),
        updatedAt: serverTimestamp(),
        lastCategoryChange: serverTimestamp()
      });

      console.log(`✅ Updated ban category for ${uuid} to ${category}`);
    } catch (error) {
      console.error(`❌ Error updating ban category for ${uuid}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to category changes for a visitor
   */
  static subscribeToCategory(
    uuid: string,
    callback: (category: BanCategory | null) => void
  ): () => void {
    // Clean up existing listener if any
    const existingListener = this.listeners.get(uuid);
    if (existingListener) {
      existingListener();
    }

    const docRef = doc(db, 'visitors', uuid);
    
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const category = data.banCategory as BanCategory | null;
        callback(category);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error(`Error in category subscription for ${uuid}:`, error);
      callback(null);
    });

    // Store listener for cleanup
    this.listeners.set(uuid, unsubscribe);
    
    return () => {
      unsubscribe();
      this.listeners.delete(uuid);
    };
  }

  /**
   * Get current category for a visitor
   */
  static async getCurrentCategory(uuid: string): Promise<BanCategory | null> {
    try {
      const docRef = doc(db, 'visitors', uuid);
      const docSnap = await import('firebase/firestore').then(({ getDoc }) => getDoc(docRef));
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.banCategory as BanCategory || 'normal';
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting current category for ${uuid}:`, error);
      return null;
    }
  }

  /**
   * Cleanup all listeners
   */
  static cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }

  /**
   * Get category history for a visitor
   */
  static async getCategoryHistory(uuid: string): Promise<BanCategoryHistory[]> {
    try {
      const docRef = doc(db, 'visitors', uuid);
      const docSnap = await import('firebase/firestore').then(({ getDoc }) => getDoc(docRef));
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.banCategoryHistory as BanCategoryHistory[] || [];
      }
      
      return [];
    } catch (error) {
      console.error(`Error getting category history for ${uuid}:`, error);
      return [];
    }
  }

  /**
   * Subscribe to multiple visitors' category changes
   */
  static subscribeToMultipleCategories(
    uuids: string[],
    callback: (updates: Record<string, BanCategory | null>) => void
  ): () => void {
    const unsubscribers: (() => void)[] = [];
    const categoryStates: Record<string, BanCategory | null> = {};

    uuids.forEach(uuid => {
      const unsubscribe = this.subscribeToCategory(uuid, (category) => {
        categoryStates[uuid] = category;
        callback({ ...categoryStates });
      });
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Batch update multiple visitors' categories
   */
  static async batchUpdateCategories(
    updates: Array<{
      uuid: string;
      category: BanCategory;
      adminId: string;
      reason: string;
      previousCategory?: BanCategory;
    }>
  ): Promise<void> {
    try {
      const updatePromises = updates.map(update => 
        this.updateCategory(
          update.uuid,
          update.category,
          update.adminId,
          update.reason,
          update.previousCategory
        )
      );

      await Promise.all(updatePromises);
      console.log(`✅ Batch updated ${updates.length} visitor categories`);
    } catch (error) {
      console.error('❌ Error in batch category update:', error);
      throw error;
    }
  }

  /**
   * Check if category change is allowed
   */
  static isValidCategoryTransition(
    fromCategory: BanCategory | null,
    toCategory: BanCategory
  ): boolean {
    // Define valid transitions (can be customized based on business rules)
    const validTransitions: Record<string, BanCategory[]> = {
      'null': ['normal', 'medium', 'danger', 'severe'],
      'normal': ['medium', 'danger', 'severe'],
      'medium': ['normal', 'danger', 'severe'],
      'danger': ['normal', 'medium', 'severe'],
      'severe': ['normal', 'medium', 'danger']
    };

    const from = fromCategory || 'null';
    return validTransitions[from]?.includes(toCategory) || false;
  }

  /**
   * Get category escalation path
   */
  static getCategoryEscalationPath(currentCategory: BanCategory): BanCategory[] {
    const escalationPaths: Record<BanCategory, BanCategory[]> = {
      'normal': ['medium', 'danger', 'severe'],
      'medium': ['danger', 'severe'],
      'danger': ['severe'],
      'severe': []
    };

    return escalationPaths[currentCategory] || [];
  }

  /**
   * Auto-suggest category based on violation history
   */
  static suggestCategoryFromHistory(history: BanCategoryHistory[]): BanCategory {
    if (history.length === 0) return 'normal';

    // Count violations by category
    const categoryCounts = history.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + 1;
      return acc;
    }, {} as Record<BanCategory, number>);

    // If user has been banned multiple times, escalate
    const totalViolations = history.length;
    if (totalViolations >= 5) return 'severe';
    if (totalViolations >= 3) return 'danger';
    if (totalViolations >= 2) return 'medium';

    return 'normal';
  }
}