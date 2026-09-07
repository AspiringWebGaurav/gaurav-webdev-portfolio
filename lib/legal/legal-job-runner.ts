/**
 * Legal Broadcast Notification Job Runner Engine
 *
 * Dedicated server-side execution engine that processes durable legal broadcast jobs
 * directly in-process. Eliminates fragile external loopback HTTP fetch calls in Server Actions
 * and guarantees transactional delivery via Brevo with pacing and lease management.
 */

import crypto from "crypto";
import { legalDocumentsRepository } from "@/lib/dal/repositories/legal-documents.repository";
import { sendLegalNotificationEmail } from "@/lib/email/legal-notification";
import type { RecipientDeliveryStatus, LegalJobStatus } from "@/types/legal";

export interface LegalJobWorkerResult {
  status: LegalJobStatus;
  jobId: string;
  processedBatchCount: number;
  remainingPending: number;
  message?: string;
  error?: string;
}

/**
 * Executes or continues processing a legal notification broadcast job.
 * Runs micro-batches of up to 10 recipients with 100ms SMTP pacing.
 */
export async function executeLegalJobWorker(
  jobId: string,
  maxBatches = 5
): Promise<LegalJobWorkerResult> {
  const workerToken = `worker_${crypto.randomUUID()}`;
  let totalProcessed = 0;

  for (let batchNum = 0; batchNum < maxBatches; batchNum++) {
    // 1. Claim or renew the 90-second lease
    const leaseRes = await legalDocumentsRepository.claimJobLease(jobId, workerToken);
    if (!leaseRes.data?.claimed) {
      return {
        status: leaseRes.data?.job?.status || "FAILED",
        jobId,
        processedBatchCount: totalProcessed,
        remainingPending: leaseRes.data?.job?.pendingCount ?? 0,
        message: "Job is locked by an active worker or has already finalized.",
      };
    }

    const job = leaseRes.data.job;

    // 2. Fetch up to 10 pending recipients from subcollection
    const batchRes = await legalDocumentsRepository.fetchPendingBatch(jobId, 10);
    const pendingRecipients = batchRes.data || [];

    if (pendingRecipients.length === 0) {
      return {
        status: job.status === "PROCESSING" ? "COMPLETED" : job.status,
        jobId,
        processedBatchCount: totalProcessed,
        remainingPending: 0,
        message: "No pending recipients found.",
      };
    }

    // 3. Process each recipient sequentially with 100ms pacing
    const updates: Array<{
      id: string;
      status: RecipientDeliveryStatus;
      sentAt?: string | null;
      brevoMessageId?: string | null;
      lastError?: string | null;
      isPermanentFailure?: boolean;
      attempts?: number;
    }> = [];

    for (const rec of pendingRecipients) {
      try {
        const dispatchResult = await sendLegalNotificationEmail({
          toEmail: rec.email,
          toName: rec.name,
          docType: job.docType,
          version: job.version,
          effectiveDate: job.effectiveDate,
          changeSummary: job.changeSummary,
          recipientType: rec.type,
          idempotencyKey: rec.idempotencyKey,
        });

        if (dispatchResult.success) {
          updates.push({
            id: rec.id,
            status: "SENT",
            sentAt: new Date().toISOString(),
            brevoMessageId: dispatchResult.messageId || null,
            attempts: (rec.attempts || 0) + 1,
          });
        } else {
          const nextAttempts = (rec.attempts || 0) + 1;
          const isPermanent = nextAttempts >= 3;
          updates.push({
            id: rec.id,
            status: isPermanent ? "FAILED" : "PENDING",
            lastError: dispatchResult.error || "Email delivery failed",
            isPermanentFailure: isPermanent,
            attempts: nextAttempts,
          });
        }
      } catch (err: unknown) {
        const nextAttempts = (rec.attempts || 0) + 1;
        const isPermanent = nextAttempts >= 3;
        updates.push({
          id: rec.id,
          status: isPermanent ? "FAILED" : "PENDING",
          lastError: err instanceof Error ? err.message : "Unexpected dispatch error",
          isPermanentFailure: isPermanent,
          attempts: nextAttempts,
        });
      }

      // 100ms pacing between SMTP provider requests
      await new Promise((res) => setTimeout(res, 100));
    }

    totalProcessed += updates.length;

    // 4. Commit batch progress to Firestore with strict lease verification
    const commitRes = await legalDocumentsRepository.commitBatchProgress(
      jobId,
      workerToken,
      updates
    );

    if (commitRes.error) {
      return {
        status: "FAILED",
        jobId,
        processedBatchCount: totalProcessed,
        remainingPending: 0,
        error: `Commit rejected: ${commitRes.error}`,
      };
    }

    const remaining = commitRes.data?.pendingCount ?? 0;
    if (remaining === 0) {
      return {
        status: commitRes.data?.status || "COMPLETED",
        jobId,
        processedBatchCount: totalProcessed,
        remainingPending: 0,
      };
    }
  }

  return {
    status: "PROCESSING",
    jobId,
    processedBatchCount: totalProcessed,
    remainingPending: 1,
  };
}
