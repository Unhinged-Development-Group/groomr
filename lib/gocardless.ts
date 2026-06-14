const GC_BASE_URL = "https://api.gocardless.com";
const GC_VERSION = "2015-07-06";

function getToken(): string {
  const token = process.env.GOCARDLESS_ACCESS_TOKEN;
  if (!token) throw new Error("GOCARDLESS_ACCESS_TOKEN is not set");
  return token;
}

async function gcRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GC_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "GoCardless-Version": GC_VERSION,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GoCardless ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export interface GCBillingRequest {
  id: string;
  status: "pending" | "fulfilled" | "cancelled" | "expired";
  links: { mandate?: string; payment?: string };
}

export interface GCBillingRequestFlow {
  id: string;
  authorisation_url: string;
}

export interface GCPayment {
  id: string;
  amount: number;
  currency: string;
  status:
    | "pending_customer_approval"
    | "pending_submission"
    | "submitted"
    | "confirmed"
    | "paid_out"
    | "cancelled"
    | "customer_approval_denied"
    | "failed"
    | "charged_back";
  links: { mandate: string };
}

export async function createBillingRequest(opts: {
  amountPence: number;
  description: string;
  metadata?: Record<string, string>;
}): Promise<GCBillingRequest> {
  const data = await gcRequest<{ billing_requests: GCBillingRequest }>(
    "/billing_requests",
    {
      method: "POST",
      body: JSON.stringify({
        billing_requests: {
          payment_request: {
            amount: opts.amountPence,
            currency: "GBP",
            description: opts.description,
          },
          ...(opts.metadata ? { metadata: opts.metadata } : {}),
        },
      }),
    },
  );
  return data.billing_requests;
}

export async function createBillingRequestFlow(opts: {
  billingRequestId: string;
  redirectUri: string;
  exitUri: string;
}): Promise<GCBillingRequestFlow> {
  const data = await gcRequest<{ billing_request_flows: GCBillingRequestFlow }>(
    "/billing_request_flows",
    {
      method: "POST",
      body: JSON.stringify({
        billing_request_flows: {
          redirect_uri: opts.redirectUri,
          exit_uri: opts.exitUri,
          links: { billing_request: opts.billingRequestId },
        },
      }),
    },
  );
  return data.billing_request_flows;
}

export async function getBillingRequest(id: string): Promise<GCBillingRequest> {
  const data = await gcRequest<{ billing_requests: GCBillingRequest }>(
    `/billing_requests/${id}`,
  );
  return data.billing_requests;
}

export async function getGCPayment(id: string): Promise<GCPayment> {
  const data = await gcRequest<{ payments: GCPayment }>(`/payments/${id}`);
  return data.payments;
}
