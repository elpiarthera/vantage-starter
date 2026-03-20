/**
 * Email — Transactional emails via @convex-dev/resend
 *
 * Templates:
 * 1. sendWelcomeEmail — Triggered after user signs up
 * 2. sendBillingConfirmationEmail — Triggered after credit purchase or subscription start
 *
 * Note: resend.sendEmail() requires RunMutationCtx — these must be internalMutation,
 * not internalAction. Callers (webhook handlers, crons) use runMutation().
 */

import { Resend } from "@convex-dev/resend";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";

const FROM = "noreply@vantagestarter.com";

const resend = new Resend(components.resend, {
	// API key read from RESEND_API_KEY env var automatically.
	// Set testMode: false in production.
	testMode: true,
});

// ============================================
// 1. sendWelcomeEmail
// ============================================
/**
 * Send a welcome email to a newly registered user.
 * Call from: Clerk webhook user.created handler (via ctx.runMutation).
 */
export const sendWelcomeEmail = internalMutation({
	args: {
		toEmail: v.string(),
		firstName: v.optional(v.string()),
	},
	returns: v.object({
		success: v.boolean(),
		emailId: v.optional(v.string()),
		error: v.optional(v.string()),
	}),
	handler: async (ctx, { toEmail, firstName }) => {
		const name = firstName ?? "there";

		try {
			const emailId = await resend.sendEmail(ctx, {
				from: FROM,
				to: toEmail,
				subject: "Welcome to VantageStarter",
				html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">Welcome, ${name}!</h1>
          <p style="margin:0 0 24px;font-size:16px;color:#6b7280;line-height:1.6;">
            Your account is ready. You have <strong style="color:#111827;">200 free credits</strong> to get started.
          </p>
          <a href="https://vantagestarter.com/dashboard"
             style="display:inline-block;background:#111827;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;">
            Go to Dashboard
          </a>
          <p style="margin:32px 0 0;font-size:13px;color:#9ca3af;">
            Questions? Reply to this email — we read everything.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
			});

			return { success: true, emailId };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error("sendWelcomeEmail failed:", message);
			return { success: false, error: message };
		}
	},
});

// ============================================
// 2. sendBillingConfirmationEmail
// ============================================
/**
 * Send a billing confirmation after a credit purchase or subscription activation.
 * Call from: Polar webhook handlers (via ctx.runMutation).
 */
export const sendBillingConfirmationEmail = internalMutation({
	args: {
		toEmail: v.string(),
		firstName: v.optional(v.string()),
		credits: v.number(),
		amountUsd: v.optional(v.number()),
		planName: v.string(),
		type: v.union(v.literal("purchase"), v.literal("subscription")),
	},
	returns: v.object({
		success: v.boolean(),
		emailId: v.optional(v.string()),
		error: v.optional(v.string()),
	}),
	handler: async (
		ctx,
		{ toEmail, firstName, credits, amountUsd, planName, type },
	) => {
		const name = firstName ?? "there";
		const isSubscription = type === "subscription";
		const subject = isSubscription
			? `Subscription confirmed: ${planName}`
			: `${credits.toLocaleString()} credits added to your account`;

		const billingLine = amountUsd
			? `<p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Amount charged: <strong style="color:#111827;">$${amountUsd.toFixed(2)}</strong></p>`
			: "";

		try {
			const emailId = await resend.sendEmail(ctx, {
				from: FROM,
				to: toEmail,
				subject,
				html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
            ${isSubscription ? "Subscription confirmed" : "Credits added"}
          </h1>
          <p style="margin:0 0 24px;font-size:16px;color:#6b7280;line-height:1.6;">
            Hi ${name}, here is your billing confirmation.
          </p>
          <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:0 0 24px;">
            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Plan: <strong style="color:#111827;">${planName}</strong></p>
            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Credits: <strong style="color:#111827;">${credits.toLocaleString()}</strong></p>
            ${billingLine}
          </div>
          <a href="https://vantagestarter.com/dashboard"
             style="display:inline-block;background:#111827;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;">
            View Dashboard
          </a>
          <p style="margin:32px 0 0;font-size:13px;color:#9ca3af;">
            This is an automated receipt. Reply if you have questions.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
			});

			return { success: true, emailId };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error("sendBillingConfirmationEmail failed:", message);
			return { success: false, error: message };
		}
	},
});
