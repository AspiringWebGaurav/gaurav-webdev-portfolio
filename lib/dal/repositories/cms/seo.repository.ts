import { BaseRepository } from "../base.repository";
import { firestoreDataSource } from "@/lib/dal/datasource/firestore";
import type { SeoDocument } from "@/types/portfolio";
import type { RepositoryResult } from "../types";
import { SEED_SEO } from "../seed-data";

export class SeoRepository extends BaseRepository {
  private collectionName = "portfolio_seo";
  private docId = "seo_main";
  private cachedSeo: { data: SeoDocument; expiresAt: number } | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5-minute in-process memory cache

  constructor() {
    super("SeoRepository");
  }

  public async getSeo(): Promise<RepositoryResult<SeoDocument>> {
    if (this.cachedSeo && Date.now() < this.cachedSeo.expiresAt) {
      return {
        success: true,
        data: this.cachedSeo.data,
        timestamp: new Date().toISOString(),
      };
    }

    const result = await this.executeQuery("getSeo", async () => {
      const doc = await firestoreDataSource.getDocument<SeoDocument>(this.collectionName, this.docId);
      if (!doc) {
        return SEED_SEO;
      }
      return doc;
    });

    if (result.success && result.data) {
      this.cachedSeo = {
        data: result.data,
        expiresAt: Date.now() + this.CACHE_TTL_MS,
      };
    }

    return result;
  }

  public async updateSeo(
    data: Partial<Omit<SeoDocument, "id">> & { expectedVersion?: number }
  ): Promise<RepositoryResult<SeoDocument>> {
    this.cachedSeo = null; // Invalidate cache immediately on update
    return this.executeMutation("updateSeo", async () => {
      const current = (await this.getSeo()).data || SEED_SEO;
      if (
        data.expectedVersion !== undefined &&
        current.version !== undefined &&
        data.expectedVersion !== current.version
      ) {
        throw new Error(
          `Concurrency Conflict: SEO is at version ${current.version}, expected ${data.expectedVersion}`
        );
      }

      const fields = { ...data };
      delete fields.expectedVersion;
      const updated: SeoDocument = {
        ...current,
        ...fields,
        id: "seo_main",
        updatedAt: new Date().toISOString(),
        version: (current.version || 1) + 1,
      };

      await firestoreDataSource.setDocument(this.collectionName, this.docId, updated, true);
      return updated;
    });
  }

  public async seedIfEmpty(): Promise<void> {
    const doc = await firestoreDataSource.getDocument<SeoDocument>(this.collectionName, this.docId);
    if (!doc) {
      await firestoreDataSource.setDocument(this.collectionName, this.docId, SEED_SEO, true);
    }
  }
}

export const seoRepository = new SeoRepository();
