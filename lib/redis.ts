/**
 * Upstash Redis Client with Resilient In-Memory Fallback
 * 
 * Provides key-value operations for Next.js Edge & Node.js runtimes.
 * Supports: get, set, del, incr, expire, pipeline.
 * Backed by Upstash Redis REST API when configured, with thread-safe
 * in-memory TTL caching fallback when unconfigured or unreachable.
 */

import { fetchWithTimeout } from "@/lib/api/fetcher";

interface MemoryEntry {
  value: string;
  expiresAt: number | null;
}

class InMemoryStore {
  private store = new Map<string, MemoryEntry>();

  get(key: string): string | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: string, ttlSeconds?: number): void {
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  del(key: string): boolean {
    return this.store.delete(key);
  }

  incr(key: string): number {
    const current = this.get(key);
    const num = current ? parseInt(current, 10) : 0;
    const next = isNaN(num) ? 1 : num + 1;
    const existing = this.store.get(key);
    this.store.set(key, {
      value: next.toString(),
      expiresAt: existing ? existing.expiresAt : null,
    });
    return next;
  }

  expire(key: string, seconds: number): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    entry.expiresAt = Date.now() + seconds * 1000;
    return true;
  }
}

const memoryStore = new InMemoryStore();

export interface RedisSetOptions {
  ex?: number; // Expiration in seconds
  px?: number; // Expiration in milliseconds
  nx?: boolean;
  xx?: boolean;
}

export class UpstashRedisClient {
  private getCredentials(): { url: string | null; token: string | null } {
    const url = process.env.UPSTASH_REDIS_REST_URL || null;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || null;
    return { url, token };
  }

  /**
   * Dispatches a single command via Upstash Redis REST pipeline endpoint
   */
  private async executeCommand<T = unknown>(command: (string | number)[]): Promise<T | null> {
    const { url, token } = this.getCredentials();
    if (!url || !token) return null;

    try {
      const res = await fetchWithTimeout(
        `${url}/pipeline`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([command]),
          cache: "no-store",
        },
        2000
      );

      if (!res.ok) return null;
      const data = (await res.json()) as Array<{ result?: T; error?: string }>;
      if (Array.isArray(data) && data[0]) {
        if (data[0].error) {
          console.warn("[RedisClient] Upstash returned error:", data[0].error);
          return null;
        }
        return data[0].result !== undefined ? (data[0].result as T) : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * GET key
   */
  public async get<T = string>(key: string): Promise<T | null> {
    const remote = await this.executeCommand<string>(["GET", key]);
    const val = remote !== null && remote !== undefined ? remote : memoryStore.get(key);
    if (val === null || val === undefined) return null;

    if (typeof val === "string") {
      const trimmed = val.trim();
      if (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        try {
          return JSON.parse(trimmed) as T;
        } catch {
          return val as unknown as T;
        }
      }
      return val as unknown as T;
    }

    return val as unknown as T;
  }

  /**
   * SET key value [EX seconds]
   */
  public async set(key: string, value: unknown, options?: RedisSetOptions): Promise<boolean> {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    const ttlSeconds = options?.ex;

    // Keep memory fallback populated
    memoryStore.set(key, serialized, ttlSeconds);

    const cmd: (string | number)[] = ["SET", key, serialized];
    if (options?.ex) {
      cmd.push("EX", options.ex);
    } else if (options?.px) {
      cmd.push("PX", options.px);
    }
    if (options?.nx) {
      cmd.push("NX");
    } else if (options?.xx) {
      cmd.push("XX");
    }

    const res = await this.executeCommand<string>(cmd);
    return res === "OK" || res !== null;
  }

  /**
   * INCR key
   */
  public async incr(key: string): Promise<number> {
    const res = await this.executeCommand<number>(["INCR", key]);
    if (typeof res === "number") {
      return res;
    }
    return memoryStore.incr(key);
  }

  /**
   * EXPIRE key seconds
   */
  public async expire(key: string, seconds: number): Promise<boolean> {
    memoryStore.expire(key, seconds);
    const res = await this.executeCommand<number>(["EXPIRE", key, seconds]);
    return res === 1;
  }

  /**
   * DEL key
   */
  public async del(key: string): Promise<boolean> {
    memoryStore.del(key);
    const res = await this.executeCommand<number>(["DEL", key]);
    return res !== null && (res as unknown as number) > 0;
  }
}

export const redisClient = new UpstashRedisClient();
export default redisClient;
