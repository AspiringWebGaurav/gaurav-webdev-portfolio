import { BaseRepository } from "./base.repository";
import { firestoreDataSource } from "@/lib/dal/datasource/firestore";
import { getAdminFirestore } from "@/lib/admin/firebase-admin";
import type { RepositoryResult } from "./types";
import type {
  RecruiterProfile,
  RecruiterChallenge,
  RecruiterSessionRecord,
  RecruiterActivityEvent,
} from "@/types/recruiter";
import crypto from "crypto";

export const RECRUITER_COLLECTIONS = {
  PROFILES: "recruiter_profiles",
  CHALLENGES: "recruiter_challenges",
  SESSIONS: "recruiter_sessions",
  ACTIVITY: "recruiter_activity",
} as const;

export class RecruiterRepository extends BaseRepository {
  constructor() {
    super("RecruiterRepository");
  }

  public getEmailDocId(email: string): string {
    return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  }

  // ==========================================
  // 1. Recruiter Profiles
  // ==========================================

  public async getProfileByEmail(email: string): Promise<RepositoryResult<RecruiterProfile | null>> {
    const docId = this.getEmailDocId(email);
    return this.getProfileById(docId);
  }

  public async getProfileById(id: string): Promise<RepositoryResult<RecruiterProfile | null>> {
    return this.executeQuery("getProfileById", async () => {
      return await firestoreDataSource.getDocument<RecruiterProfile>(RECRUITER_COLLECTIONS.PROFILES, id);
    });
  }

  public async upsertProfile(profile: RecruiterProfile): Promise<RepositoryResult<void>> {
    return this.executeMutation("upsertProfile", async () => {
      await firestoreDataSource.setDocument(RECRUITER_COLLECTIONS.PROFILES, profile.id, profile, true);
    });
  }

  public async touchProfileActivity(id: string, lastAction?: string): Promise<RepositoryResult<void>> {
    return this.executeMutation("touchProfileActivity", async () => {
      const db = getAdminFirestore();
      if (!db) return;
      const docRef = db.collection(RECRUITER_COLLECTIONS.PROFILES).doc(id);
      const updates: Record<string, unknown> = {
        lastActiveAt: Date.now(),
      };
      if (lastAction) {
        updates.lastAction = lastAction;
      }
      await docRef.set(updates, { merge: true });
    });
  }

  public async incrementProfileVisits(id: string, lastAction?: string): Promise<RepositoryResult<void>> {
    return this.executeMutation("incrementProfileVisits", async () => {
      const db = getAdminFirestore();
      if (!db) return;
      const docRef = db.collection(RECRUITER_COLLECTIONS.PROFILES).doc(id);
      const doc = await docRef.get();
      const currentVisits = doc.exists ? (doc.data()?.totalVisits || 0) : 0;
      const updates: Record<string, unknown> = {
        totalVisits: currentVisits + 1,
        lastActiveAt: Date.now(),
      };
      if (lastAction) {
        updates.lastAction = lastAction;
      }
      await docRef.set(updates, { merge: true });
    });
  }

  public async getAllProfiles(limit = 100): Promise<RepositoryResult<RecruiterProfile[]>> {
    return this.executeQuery("getAllProfiles", async () => {
      const res = await firestoreDataSource.queryCollection<RecruiterProfile>(RECRUITER_COLLECTIONS.PROFILES, {
        limit,
        orderByField: "lastActiveAt",
        orderDirection: "desc",
      });
      return res.docs;
    });
  }

  // ==========================================
  // 2. Recruiter Challenges (OTP)
  // ==========================================

  public async createChallenge(challenge: RecruiterChallenge): Promise<RepositoryResult<void>> {
    return this.executeMutation("createChallenge", async () => {
      await firestoreDataSource.setDocument(RECRUITER_COLLECTIONS.CHALLENGES, challenge.id, challenge, false);
    });
  }

  public async getChallenge(id: string): Promise<RepositoryResult<RecruiterChallenge | null>> {
    return this.executeQuery("getChallenge", async () => {
      return await firestoreDataSource.getDocument<RecruiterChallenge>(RECRUITER_COLLECTIONS.CHALLENGES, id);
    });
  }

  public async updateChallenge(id: string, updates: Partial<RecruiterChallenge>): Promise<RepositoryResult<void>> {
    return this.executeMutation("updateChallenge", async () => {
      await firestoreDataSource.setDocument(RECRUITER_COLLECTIONS.CHALLENGES, id, updates, true);
    });
  }

  // ==========================================
  // 3. Recruiter Sessions
  // ==========================================

  public async createSession(session: RecruiterSessionRecord): Promise<RepositoryResult<void>> {
    return this.executeMutation("createSession", async () => {
      await firestoreDataSource.setDocument(RECRUITER_COLLECTIONS.SESSIONS, session.id, session, false);
    });
  }

  public async getSession(sessionId: string): Promise<RepositoryResult<RecruiterSessionRecord | null>> {
    return this.executeQuery("getSession", async () => {
      return await firestoreDataSource.getDocument<RecruiterSessionRecord>(RECRUITER_COLLECTIONS.SESSIONS, sessionId);
    });
  }

  public async touchSessionActivity(sessionId: string): Promise<RepositoryResult<void>> {
    return this.executeMutation("touchSessionActivity", async () => {
      const db = getAdminFirestore();
      if (!db) return;
      await db.collection(RECRUITER_COLLECTIONS.SESSIONS).doc(sessionId).set(
        { lastActiveAt: Date.now() },
        { merge: true }
      );
    });
  }

  public async revokeSession(sessionId: string): Promise<RepositoryResult<void>> {
    return this.executeMutation("revokeSession", async () => {
      const db = getAdminFirestore();
      if (!db) return;
      await db.collection(RECRUITER_COLLECTIONS.SESSIONS).doc(sessionId).set(
        {
          status: "REVOKED",
          revokedAt: Date.now(),
        },
        { merge: true }
      );
    });
  }

  public async unmaskSessionPhone(sessionId: string): Promise<RepositoryResult<void>> {
    return this.executeMutation("unmaskSessionPhone", async () => {
      const db = getAdminFirestore();
      if (!db) return;
      await db.collection(RECRUITER_COLLECTIONS.SESSIONS).doc(sessionId).set(
        {
          phoneUnmasked: true,
          phoneUnmaskedAt: Date.now(),
        },
        { merge: true }
      );
    });
  }

  // ==========================================
  // 4. Recruiter Activity Events
  // ==========================================

  public async logActivity(event: RecruiterActivityEvent): Promise<RepositoryResult<void>> {
    return this.executeMutation("logActivity", async () => {
      await firestoreDataSource.setDocument(RECRUITER_COLLECTIONS.ACTIVITY, event.id, event, false);
    });
  }

  public async getRecentActivity(limit = 100): Promise<RepositoryResult<RecruiterActivityEvent[]>> {
    return this.executeQuery("getRecentActivity", async () => {
      const res = await firestoreDataSource.queryCollection<RecruiterActivityEvent>(RECRUITER_COLLECTIONS.ACTIVITY, {
        limit,
        orderByField: "timestamp",
        orderDirection: "desc",
      });
      return res.docs;
    });
  }
}

export const recruiterRepository = new RecruiterRepository();
