/**
 * Policy Reference Synchronization Utility
 * Ensures policy references are properly generated, stored, and synchronized
 * across all ban-related operations and collections
 */

import { generatePolicyReference, isValidPolicyReference } from './policyReference';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export class PolicyReferenceSync {
  /**
   * Ensure a visitor has a valid policy reference
   * Generates one if missing and updates the visitor document
   */
  static async ensurePolicyReference(uuid: string): Promise<string> {
    try {
      // First check if visitor already has a valid policy reference
      const visitorRef = doc(db, 'visitors', uuid);
      const visitorDoc = await getDoc(visitorRef);
      
      if (visitorDoc.exists()) {
        const data = visitorDoc.data();
        const existingRef = data.policyReference;
        
        // If valid policy reference exists, return it
        if (existingRef && isValidPolicyReference(existingRef)) {
          console.log(`✅ Valid policy reference found for ${uuid}: ${existingRef}`);
          return existingRef;
        }
      }
      
      // Generate new policy reference
      const newPolicyRef = generatePolicyReference();
      console.log(`🔄 Generated new policy reference for ${uuid}: ${newPolicyRef}`);
      
      // Update visitor document with new policy reference
      await updateDoc(visitorRef, {
        policyReference: newPolicyRef,
        policyReferenceGeneratedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log(`✅ Policy reference stored for ${uuid}`);
      return newPolicyRef;
      
    } catch (error) {
      console.error(`❌ Error ensuring policy reference for ${uuid}:`, error);
      // Return a fallback policy reference
      return generatePolicyReference();
    }
  }

  /**
   * Synchronize policy reference between visitor and ban collections
   */
  static async syncPolicyReference(uuid: string, policyReference: string): Promise<void> {
    try {
      const updates = [];
      
      // Update visitor document
      const visitorRef = doc(db, 'visitors', uuid);
      updates.push(
        updateDoc(visitorRef, {
          policyReference,
          policyReferenceSyncedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      );
      
      // Update ban document if it exists
      const banRef = doc(db, 'bans', uuid);
      const banDoc = await getDoc(banRef);
      
      if (banDoc.exists()) {
        updates.push(
          updateDoc(banRef, {
            policyReference,
            policyReferenceSyncedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        );
      }
      
      // Execute all updates
      await Promise.all(updates);
      console.log(`✅ Policy reference synchronized for ${uuid}: ${policyReference}`);
      
    } catch (error) {
      console.error(`❌ Error synchronizing policy reference for ${uuid}:`, error);
      throw error;
    }
  }

  /**
   * Validate and fix policy references for a visitor
   * Used for data integrity checks and repairs
   */
  static async validateAndFixPolicyReference(uuid: string): Promise<{
    isValid: boolean;
    policyReference: string;
    wasFixed: boolean;
  }> {
    try {
      const visitorRef = doc(db, 'visitors', uuid);
      const visitorDoc = await getDoc(visitorRef);
      
      if (!visitorDoc.exists()) {
        return {
          isValid: false,
          policyReference: '',
          wasFixed: false
        };
      }
      
      const data = visitorDoc.data();
      const existingRef = data.policyReference;
      
      // Check if policy reference is valid
      if (existingRef && isValidPolicyReference(existingRef)) {
        return {
          isValid: true,
          policyReference: existingRef,
          wasFixed: false
        };
      }
      
      // Fix invalid or missing policy reference
      const newPolicyRef = await this.ensurePolicyReference(uuid);
      await this.syncPolicyReference(uuid, newPolicyRef);
      
      return {
        isValid: true,
        policyReference: newPolicyRef,
        wasFixed: true
      };
      
    } catch (error) {
      console.error(`❌ Error validating policy reference for ${uuid}:`, error);
      return {
        isValid: false,
        policyReference: '',
        wasFixed: false
      };
    }
  }

  /**
   * Batch validate and fix policy references for multiple visitors
   */
  static async batchValidateAndFix(uuids: string[]): Promise<{
    processed: number;
    fixed: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      fixed: 0,
      errors: [] as string[]
    };
    
    for (const uuid of uuids) {
      try {
        const result = await this.validateAndFixPolicyReference(uuid);
        results.processed++;
        
        if (result.wasFixed) {
          results.fixed++;
        }
        
      } catch (error) {
        results.errors.push(`${uuid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`✅ Batch policy reference validation completed:`, results);
    return results;
  }

  /**
   * Get policy reference with fallback mechanisms
   */
  static async getPolicyReferenceWithFallback(uuid: string): Promise<string | null> {
    try {
      // Try visitor document first
      const visitorRef = doc(db, 'visitors', uuid);
      const visitorDoc = await getDoc(visitorRef);
      
      if (visitorDoc.exists()) {
        const visitorData = visitorDoc.data();
        if (visitorData.policyReference && isValidPolicyReference(visitorData.policyReference)) {
          return visitorData.policyReference;
        }
      }
      
      // Try ban document as fallback
      const banRef = doc(db, 'bans', uuid);
      const banDoc = await getDoc(banRef);
      
      if (banDoc.exists()) {
        const banData = banDoc.data();
        if (banData.policyReference && isValidPolicyReference(banData.policyReference)) {
          // Sync back to visitor document
          await this.syncPolicyReference(uuid, banData.policyReference);
          return banData.policyReference;
        }
      }
      
      // No valid policy reference found
      return null;
      
    } catch (error) {
      console.error(`❌ Error getting policy reference for ${uuid}:`, error);
      return null;
    }
  }
}