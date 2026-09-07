import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "@/lib/admin/constants";
import { verifyAdminSession } from "@/lib/admin/auth";
import { executeLegalJobWorker } from "@/lib/legal/legal-job-runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id: jobId } = await context.params;
  if (!jobId) {
    return Response.json({ error: "Job ID required" }, { status: 400 });
  }

  // 1. Authorization: Verify Admin Session or Internal Worker Bearer Token
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const session = sessionToken ? await verifyAdminSession(sessionToken) : null;

  const authHeader = req.headers.get("authorization");
  const workerSecret =
    process.env.CRON_SECRET ||
    process.env.JWT_SECRET ||
    "internal_legal_worker_secret";
  const isWorkerAuthorized =
    authHeader === `Bearer ${workerSecret}` ||
    req.headers.get("x-worker-secret") === workerSecret;

  if (!session && !isWorkerAuthorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Execute worker engine directly in-process
  const result = await executeLegalJobWorker(jobId);

  return Response.json(result, { status: result.error ? 500 : 200 });
}
