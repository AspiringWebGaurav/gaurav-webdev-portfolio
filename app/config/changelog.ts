/**
 * CHANGELOG CONFIGURATION
 *
 * This file manages the version history of the Portfolio Admin application.
 * The version system is FULLY DYNAMIC and automatically synchronized across:
 * - package.json
 * - version.ts (imports from CHANGELOG[0].version)
 * - All UI components displaying version
 *
 * HOW TO ADD A NEW VERSION:
 * 1. Add new version entry at the TOP of the CHANGELOG array (newest first)
 * 2. Update package.json version to match (without 'v' prefix)
 * 3. The version will automatically update everywhere in the app
 *
 * VERSION FORMAT: "vX.Y.Z" (e.g., "v1.0.0")
 * DATE FORMAT: "YYYY-MM-DD" (e.g., "2025-11-07")
 */

export interface VersionLog {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: VersionLog[] = [
  {
    version: "v1.0.0",
    date: "2025-11-07",
    changes: [
      "Initial portfolio admin panel setup",
      "Added notification system",
      "Integrated Firebase authentication",
      "Version control system implementation",
    ],
  },
  // Add new versions here - newest first
];
