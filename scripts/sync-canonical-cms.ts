import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { firestoreDataSource } from "../lib/dal/datasource/firestore";
import { redisDataSource } from "../lib/dal/datasource/redis";
import { CANONICAL_PILLAR_DEFINITIONS } from "../lib/dal/lifecycle/seed-registry";
import { emitCmsChangeSignal } from "../lib/dal/repositories/live-sync.service";

async function syncCanonicalCms() {
  console.log("\n=======================================================");
  console.log("🔄 SYNCING CANONICAL CMS DATA TO LIVE FIRESTORE");
  console.log("=======================================================\n");

  let totalUpserted = 0;
  let totalDeleted = 0;

  for (const pillar of CANONICAL_PILLAR_DEFINITIONS) {
    console.log(`\n📁 Processing pillar: ${pillar.collectionName} (${pillar.isSingleton ? "Singleton" : "Collection"})`);

    if (pillar.isSingleton) {
      for (const doc of pillar.documents) {
        const docId = String((doc as { id?: string }).id || `${pillar.collectionName}_main`);
        await firestoreDataSource.setDocument(pillar.collectionName, docId, doc, false);
        totalUpserted++;
        console.log(`   ✓ Upserted singleton doc [${docId}]`);
      }
    } else {
      // 1. Get existing docs to identify orphans
      const existing = await firestoreDataSource.getAllDocuments<{ id: string }>(pillar.collectionName);
      const canonicalIds = new Set(pillar.documents.map((d: any) => String(d.id)));

      // 2. Delete orphans
      for (const ex of existing) {
        if (!canonicalIds.has(ex.id)) {
          await firestoreDataSource.deleteDocument(pillar.collectionName, ex.id);
          totalDeleted++;
          console.log(`   🗑️  Deleted orphan doc [${ex.id}] from ${pillar.collectionName}`);
        }
      }

      // 3. Upsert canonical documents
      for (const doc of pillar.documents) {
        const docId = String((doc as { id?: string }).id);
        await firestoreDataSource.setDocument(pillar.collectionName, docId, doc, false);
        totalUpserted++;
        console.log(`   ✓ Upserted canonical doc [${docId}]`);
      }
    }
  }

  // 4. Invalidate Redis cache if available
  try {
    const redisInfo = await redisDataSource.getDbInfo();
    if (redisInfo.connected) {
      console.log(`\n🧹 Clearing Upstash Redis cache (${redisInfo.dbsize} keys)...`);
      await redisDataSource.flushAll();
      console.log("   ✓ Redis cache purged.");
    }
  } catch (err) {
    console.warn("   ⚠️ Redis clear skipped or unavailable:", err);
  }

  // 5. Emit live synchronization signal across RTDB and Firestore
  console.log("\n📡 Emitting CMS realtime change signal...");
  const signalResult = await emitCmsChangeSignal("all");
  console.log("   ✓ Signal emit result:", signalResult);

  console.log("\n=======================================================");
  console.log(`✅ SYNC COMPLETE: ${totalUpserted} docs upserted, ${totalDeleted} orphans removed`);
  console.log("=======================================================\n");
}

syncCanonicalCms().catch((err) => {
  console.error("❌ Fatal sync failure:", err);
  process.exit(1);
});
