/**
 * Policy Reference Number Generation Utility
 * Generates unique policy reference numbers for ban actions
 * Format: BAN-YYYYMMDD-XXXXXX
 */

/**
 * Generates a unique policy reference number
 * @returns {string} Policy reference in format BAN-YYYYMMDD-XXXXXX
 */
export function generatePolicyReference(): string {
  // Get current date in YYYYMMDD format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;
  
  // Generate 6-character random alphanumeric suffix
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomSuffix = '';
  for (let i = 0; i < 6; i++) {
    randomSuffix += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return `BAN-${dateString}-${randomSuffix}`;
}

/**
 * Validates if a string is a valid policy reference format
 * @param {string} reference - The reference to validate
 * @returns {boolean} True if valid policy reference format
 */
export function isValidPolicyReference(reference: string): boolean {
  const policyReferenceRegex = /^BAN-\d{8}-[A-Z0-9]{6}$/;
  return policyReferenceRegex.test(reference);
}

/**
 * Extracts the date from a policy reference
 * @param {string} reference - The policy reference
 * @returns {Date | null} Date object or null if invalid
 */
export function extractDateFromPolicyReference(reference: string): Date | null {
  if (!isValidPolicyReference(reference)) {
    return null;
  }
  
  const datePart = reference.split('-')[1];
  const year = parseInt(datePart.substring(0, 4));
  const month = parseInt(datePart.substring(4, 6)) - 1; // Month is 0-indexed
  const day = parseInt(datePart.substring(6, 8));
  
  return new Date(year, month, day);
}

/**
 * Formats a policy reference for display with better readability
 * @param {string} reference - The policy reference
 * @returns {string} Formatted reference for display
 */
export function formatPolicyReferenceForDisplay(reference: string): string {
  if (!isValidPolicyReference(reference)) {
    return reference;
  }
  
  const parts = reference.split('-');
  const datePart = parts[1];
  const randomPart = parts[2];
  
  // Format as BAN-YYYY/MM/DD-XXXXXX for better readability
  const formattedDate = `${datePart.substring(0, 4)}/${datePart.substring(4, 6)}/${datePart.substring(6, 8)}`;
  return `BAN-${formattedDate}-${randomPart}`;
}

/**
 * Generates multiple unique policy references (for testing or bulk operations)
 * @param {number} count - Number of references to generate
 * @returns {string[]} Array of unique policy references
 */
export function generateMultiplePolicyReferences(count: number): string[] {
  const references = new Set<string>();
  
  while (references.size < count) {
    references.add(generatePolicyReference());
  }
  
  return Array.from(references);
}