const PAYSTACK_BASE = "https://api.paystack.co";

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  data: {
    status: string; // "success" | "failed" | "abandoned"
    reference: string;
    amount: number; // in kobo
    customer: { email: string };
  };
}

export function createPaystackClient(secretKey: string) {
  return {
    async initializePayment(params: {
      email: string;
      amount: number; // in NGN (will convert to kobo)
      reference: string;
      callbackUrl: string;
      metadata?: Record<string, unknown>;
    }): Promise<PaystackInitResponse> {
      const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: params.email,
          amount: Math.round(params.amount * 100), // kobo
          reference: params.reference,
          callback_url: params.callbackUrl,
          metadata: params.metadata,
        }),
      });

      return res.json();
    },

    async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
      const res = await fetch(
        `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: { Authorization: `Bearer ${secretKey}` },
        }
      );

      return res.json();
    },

    async createPlan(params: {
      name: string;
      amount: number; // NGN
      interval: "weekly" | "monthly";
    }) {
      const res = await fetch(`${PAYSTACK_BASE}/plan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: params.name,
          amount: Math.round(params.amount * 100),
          interval: params.interval,
        }),
      });

      return res.json();
    },

    async createSubscription(params: {
      customer: string; // email or customer code
      plan: string; // plan code
    }) {
      const res = await fetch(`${PAYSTACK_BASE}/subscription`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      return res.json();
    },

    verifyWebhookSignature(body: string, signature: string): boolean {
      const crypto = require("crypto");
      const hash = crypto
        .createHmac("sha512", secretKey)
        .update(body)
        .digest("hex");
      return hash === signature;
    },
  };
}

// Default client for backwards compatibility
export const defaultPaystack = createPaystackClient(
  process.env.PAYSTACK_SECRET_KEY!
);

// Re-export individual functions using the default client for legacy imports
export const initializePayment = defaultPaystack.initializePayment;
export const verifyPayment = defaultPaystack.verifyPayment;
export const createPlan = defaultPaystack.createPlan;
export const createSubscription = defaultPaystack.createSubscription;
export const verifyWebhookSignature = defaultPaystack.verifyWebhookSignature;
