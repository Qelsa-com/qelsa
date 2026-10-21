import { DodoPayments, type DodoPaymentsClientConfig } from "@dodopayments/convex";
import { components, internal } from "./_generated/api";

/**
 * Dodo is used for checkout, billing-management sessions, and signed webhooks.
 * Our own billing tables remain the read model for entitlements.
 */
export const dodo = new DodoPayments(components.dodopayments, {
  identify: async (ctx): Promise<{ dodoCustomerId: string } | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const customer = await ctx.runQuery(internal.billingCustomers.getCustomerByAuthId, {
      authId: identity.subject,
    });
    if (!customer) return null;

    return { dodoCustomerId: customer.dodo_customer_id };
  },
  apiKey: process.env.DODO_PAYMENTS_API_KEY ?? "",
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT ?? "test_mode") as DodoPaymentsClientConfig["environment"],
});

export const { checkout, customerPortal } = dodo.api();
