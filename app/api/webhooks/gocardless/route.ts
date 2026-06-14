import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.GOCARDLESS_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

interface GCEvent {
  id: string;
  action: string;
  resource_type: string;
  links: Record<string, string>;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("Webhook-Signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let events: GCEvent[];
  try {
    ({ events } = JSON.parse(rawBody) as { events: GCEvent[] });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  for (const event of events) {
    try {
      if (event.resource_type === "billing_requests" && event.action === "fulfilled") {
        const updates: Record<string, string> = {};
        if (event.links.mandate) updates.gc_mandate_id = event.links.mandate;
        if (event.links.payment) updates.gc_payment_id = event.links.payment;
        if (Object.keys(updates).length > 0) {
          await supabaseAdmin
            .from("payments")
            .update(updates)
            .eq("gc_billing_request_id", event.links.billing_request);
        }
      }

      if (event.resource_type === "payments") {
        const gcPaymentId = event.links.payment;
        if (!gcPaymentId) continue;

        if (event.action === "confirmed" || event.action === "paid_out") {
          await supabaseAdmin
            .from("payments")
            .update({
              deposit_status: "paid",
              deposit_paid_at: new Date().toISOString(),
            })
            .eq("gc_payment_id", gcPaymentId);
        } else if (event.action === "failed" || event.action === "charged_back") {
          await supabaseAdmin
            .from("payments")
            .update({ deposit_status: "failed" })
            .eq("gc_payment_id", gcPaymentId);
        }
      }
    } catch (err) {
      // Log but don't fail the whole batch — GC retries on non-2xx
      console.error(`[gocardless webhook] event ${event.id} (${event.resource_type}.${event.action}):`, err);
      await supabaseAdmin.from("admin_audit_log").insert({
        action: "gocardless_webhook_error",
        target_table: "payments",
        target_id: event.links.payment ?? event.links.billing_request ?? event.id,
        metadata: {
          event_id: event.id,
          resource_type: event.resource_type,
          action: event.action,
          error: String(err),
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
