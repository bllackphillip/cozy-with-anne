import { Resend } from "resend";

/*
  ORDER EMAILS (Resend)

  Called from the Stripe webhook once an order is recorded:
    - a warm confirmation to the buyer (Anne's voice, extends the order-success copy)
    - a plain "new order" alert to Anne so she knows to pack and ship

  Configuration (.env.local, never commit):
    RESEND_API_KEY     required to actually send. If unset, sends are skipped and
                       the webhook still records the order and returns 200, so the
                       build and the order flow never depend on email being set up.
    ORDER_EMAIL_FROM   sender, e.g. "Cozy with Anne <orders@cozywithanne.com>".
                       Defaults to Resend's shared "onboarding@resend.dev" so it
                       works on the dissertation site before a domain is verified.
    ORDER_EMAIL_ADMIN  where Anne's new-order alert goes. Defaults to
                       support@cozywithanne.com.
    ORDER_EMAIL_REPLY_TO  optional. Where a customer's reply to the confirmation
                       goes (e.g. a Gmail you watch now, support@cozywithanne.com
                       at launch). If unset, replies go to ORDER_EMAIL_FROM.

  Identical in Stripe test and live mode. Only the sender domain differs: use
  onboarding@resend.dev for the test site, verify cozywithanne.com for live.
*/

let client = null;
function getClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

const FROM = process.env.ORDER_EMAIL_FROM || "Cozy with Anne <onboarding@resend.dev>";
const ADMIN_TO = process.env.ORDER_EMAIL_ADMIN || "support@cozywithanne.com";
const REPLY_TO = process.env.ORDER_EMAIL_REPLY_TO || undefined;

// Brand palette (literal hex; email clients can't read CSS variables).
const PLUM = "#4A2E2E";
const ACCENT = "#A06868";
const BG = "#FAF6F0";

// WhatsApp Business — kept in sync with src/data/social.js (international number,
// no "+" or leading 0). Used by the order confirmation + newsletter welcome.
const WHATSAPP_URL = "https://wa.me/31630457419";

function money(n) {
  return `€${Number(n ?? 0).toFixed(2)}`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function itemRows(items) {
  return (items ?? [])
    .map((it) => {
      const qty = it.quantity ?? 1;
      const label = [it.title, it.variantLabel].filter(Boolean).map(escapeHtml).join(" · ");
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #ece3d8;color:${PLUM};">${label}${qty > 1 ? ` ×${qty}` : ""}</td>
        <td style="padding:10px 0;border-bottom:1px solid #ece3d8;text-align:right;white-space:nowrap;color:${PLUM};">${money((it.price ?? 0) * qty)}</td>
      </tr>`;
    })
    .join("");
}

function formatAddress(shippingAddress) {
  if (!shippingAddress) return null;
  const parts = [
    shippingAddress.line1,
    shippingAddress.line2,
    shippingAddress.postal_code,
    shippingAddress.city,
    shippingAddress.state,
    shippingAddress.country,
  ]
    .filter(Boolean)
    .map(escapeHtml);
  return parts.length ? parts.join(", ") : null;
}

function shippingRow(shippingCost) {
  if (shippingCost == null) return "";
  const label = shippingCost === 0 ? "Free" : money(shippingCost);
  return `<tr>
        <td style="padding:10px 0 0;color:${PLUM};">Shipping</td>
        <td style="padding:10px 0 0;text-align:right;color:${PLUM};">${label}</td>
      </tr>`;
}

function customerHtml({ firstName, items, amountTotal, shippingCost, shippingAddress, shippingName }) {
  const addr = formatAddress(shippingAddress);
  const shipToName = shippingName || firstName;
  const addressBlock = addr
    ? `<div style="padding:8px 32px 0;">
        <p style="color:${PLUM};font-size:14px;line-height:1.6;margin:0;">
          <strong>Shipping to</strong><br/>${escapeHtml(shipToName)}<br/>${addr}
        </p>
      </div>`
    : "";
  return `
  <div style="background:${BG};padding:32px 0;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:560px;margin:0 auto;background:#fffdfb;border-radius:16px;overflow:hidden;border:1px solid #ece3d8;">
      <div style="padding:28px 32px 8px;">
        <h1 style="margin:0;color:${ACCENT};font-size:24px;">Thank you, ${escapeHtml(firstName)}.</h1>
        <p style="color:${PLUM};line-height:1.6;font-size:15px;">
          Your order is confirmed and it honestly made my day. Each piece is something
          I poured a lot of care into, and I am so glad one is on its way to you.
        </p>
      </div>
      <div style="padding:8px 32px 4px;">
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          ${itemRows(items)}
          ${shippingRow(shippingCost)}
          <tr>
            <td style="padding:14px 0 0;font-weight:bold;color:${PLUM};">Total</td>
            <td style="padding:14px 0 0;text-align:right;font-weight:bold;color:${PLUM};">${money(amountTotal)}</td>
          </tr>
        </table>
      </div>
      ${addressBlock}
      <div style="padding:16px 32px 8px;">
        <p style="color:${PLUM};line-height:1.6;font-size:15px;">
          Next, I will pack everything by hand in recycled, plastic-free materials and
          send it on its way. I will be in touch with shipping details shortly.
        </p>
      </div>
      <div style="margin:8px 32px 0;padding:16px 0 0;border-top:1px solid #ece3d8;">
        <p style="color:${PLUM};line-height:1.6;font-size:15px;margin:0 0 8px;">
          If any of the details are wrong or you have any questions:
        </p>
        <ul style="color:${PLUM};line-height:1.9;font-size:15px;margin:0;padding-left:4px;list-style:none;">
          <li>💬 <a href="${WHATSAPP_URL}" style="color:${ACCENT};">Message me on WhatsApp</a></li>
          <li>🛟 <a href="mailto:support@cozywithanne.com" style="color:${ACCENT};">support@cozywithanne.com</a> - for help with an order</li>
        </ul>
      </div>
      <div style="padding:12px 32px 28px;">
        <p style="color:${ACCENT};font-size:16px;margin:0;">With love,<br/>Anne</p>
      </div>
    </div>
  </div>`;
}

function adminHtml({ customerName, customerEmail, items, amountTotal, shippingCost, shippingAddress, shippingName, conflict, conflictArtworkIds }) {
  const addr = formatAddress(shippingAddress) || "No shipping address on file";
  const recipient = shippingName ? `${escapeHtml(shippingName)}<br/>` : "";
  // Shown only when the webhook detected that a one-of-a-kind original in this
  // order was already claimed by an earlier order (a rare concurrent double-sale).
  const conflictBanner = conflict
    ? `<div style="background:#fde8e8;border:1px solid #f3a7a7;border-radius:8px;padding:12px 14px;margin-bottom:16px;color:#8a1f1f;">
        <strong>⚠ Possible double-sale - please review and refund.</strong><br/>
        An original in this order appears to have already sold:
        ${escapeHtml((conflictArtworkIds ?? []).join(", "))}.
      </div>`
    : "";
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:${PLUM};font-size:15px;line-height:1.6;">
    ${conflictBanner}
    <h2 style="color:${ACCENT};">New order</h2>
    <p><strong>From:</strong> ${escapeHtml(customerName || "Unknown")} (${escapeHtml(customerEmail || "no email")})</p>
    <table style="border-collapse:collapse;margin:8px 0;">
      ${itemRows(items)}
      ${shippingRow(shippingCost)}
      <tr><td style="padding-top:10px;font-weight:bold;">Total</td><td style="padding-top:10px;text-align:right;font-weight:bold;">${money(amountTotal)}</td></tr>
    </table>
    <p><strong>Ship to:</strong><br/>${recipient}${addr}</p>
  </div>`;
}

export async function sendOrderEmails(order) {
  const c = getClient();
  if (!c) {
    console.warn("RESEND_API_KEY not set; skipping order emails.");
    return;
  }

  const { customerEmail, customerName, items, amountTotal, shippingCost, shippingAddress, shippingName, conflict, conflictArtworkIds } = order;
  const firstName = (customerName || "").trim().split(/\s+/)[0] || "there";
  const count = (items ?? []).length;

  if (customerEmail) {
    try {
      await c.emails.send({
        from: FROM,
        to: customerEmail,
        replyTo: REPLY_TO,
        subject: "Your Cozy with Anne order is confirmed 💌",
        html: customerHtml({ firstName, items, amountTotal, shippingCost, shippingAddress, shippingName }),
      });
    } catch (err) {
      console.error("Customer confirmation email failed:", err);
    }
  }

  try {
    await c.emails.send({
      from: FROM,
      to: ADMIN_TO,
      replyTo: customerEmail || undefined,
      subject: `${conflict ? "⚠ REVIEW - " : ""}New order: ${money(amountTotal)} (${count} item${count === 1 ? "" : "s"})`,
      html: adminHtml({ customerName, customerEmail, items, amountTotal, shippingCost, shippingAddress, shippingName, conflict, conflictArtworkIds }),
    });
  } catch (err) {
    console.error("Admin order alert failed:", err);
  }
}

/* ── COMMISSION ENQUIRY EMAILS ──────────────────────────────────────────────
   Sent from /api/enquiry after the enquiry is stored: a warm confirmation to the
   sender (so they know it arrived and isn't a black hole) + an alert to Anne so
   she does not have to watch the admin inbox. Same best-effort, RESEND-gated
   contract as the order emails. */

function customerEnquiryHtml({ firstName }) {
  return `
  <div style="background:${BG};padding:32px 0;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:560px;margin:0 auto;background:#fffdfb;border-radius:16px;overflow:hidden;border:1px solid #ece3d8;">
      <div style="padding:28px 32px;">
        <h1 style="margin:0 0 12px;color:${ACCENT};font-size:24px;">Thank you, ${escapeHtml(firstName)}.</h1>
        <p style="color:${PLUM};line-height:1.6;font-size:15px;">
          I have received your commission enquiry and I am so excited to hear what you have in mind.
          I reply to every message personally, usually within 24 hours.
        </p>
        <p style="color:${PLUM};line-height:1.6;font-size:15px;">
          If you would like to add anything in the meantime - a reference, a size, a deadline - just
          reply to this email and it comes straight to me.
        </p>
        <p style="color:${ACCENT};font-size:16px;margin-top:20px;">With love,<br/>Anne</p>
      </div>
    </div>
  </div>`;
}

function adminEnquiryHtml({ name, email, vision, attachmentUrl }) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:${PLUM};font-size:15px;line-height:1.6;">
    <h2 style="color:${ACCENT};">New commission enquiry</h2>
    <p><strong>From:</strong> ${escapeHtml(name || "Unknown")} (${escapeHtml(email || "no email")})</p>
    <p><strong>Their idea:</strong><br/>${escapeHtml(vision || "").replace(/\n/g, "<br/>")}</p>
    ${attachmentUrl ? `<p><strong>Reference image:</strong> <a href="${escapeHtml(attachmentUrl)}">view attachment</a></p>` : ""}
    <p style="color:#777;">Reply directly to this email to reach ${escapeHtml(name || "them")}.</p>
  </div>`;
}

export async function sendEnquiryEmails({ name, email, vision, attachmentUrl }) {
  const c = getClient();
  if (!c) {
    console.warn("RESEND_API_KEY not set; skipping enquiry emails.");
    return;
  }
  const firstName = (name || "").trim().split(/\s+/)[0] || "there";

  if (email) {
    try {
      await c.emails.send({
        from: FROM,
        to: email,
        replyTo: REPLY_TO,
        subject: "I have your commission enquiry 💌",
        html: customerEnquiryHtml({ firstName }),
      });
    } catch (err) {
      console.error("Customer enquiry confirmation failed:", err);
    }
  }

  try {
    await c.emails.send({
      from: FROM,
      to: ADMIN_TO,
      replyTo: email || undefined,
      subject: `New commission enquiry from ${name || "someone"}`,
      html: adminEnquiryHtml({ name, email, vision, attachmentUrl }),
    });
  } catch (err) {
    console.error("Admin enquiry alert failed:", err);
  }
}

/* ── NEWSLETTER WELCOME EMAIL ────────────────────────────────────────────────
   Sent from /api/newsletter the FIRST time an email subscribes (a repeat sign-up
   gets no second welcome). A warm welcome in Anne's voice: what the newsletter is
   for, and the ways to reach her. Same best-effort, RESEND-gated contract as the
   order + enquiry emails. */

function newsletterWelcomeHtml() {
  return `
  <div style="background:${BG};padding:32px 0;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:560px;margin:0 auto;background:#fffdfb;border-radius:16px;overflow:hidden;border:1px solid #ece3d8;">
      <div style="padding:28px 32px;">
        <h1 style="margin:0 0 12px;color:${ACCENT};font-size:24px;">Welcome - I'm so glad you're here.</h1>
        <p style="color:${PLUM};line-height:1.6;font-size:15px;">
          Thank you for joining my little newsletter. It is where I share the parts of
          this small art practice I am most excited about, sent gently and never too often.
        </p>
        <p style="color:${PLUM};line-height:1.6;font-size:15px;margin:0 0 6px;">Here is what to expect:</p>
        <ul style="color:${PLUM};line-height:1.7;font-size:15px;margin:0 0 12px;padding-left:20px;">
          <li>A gentle note whenever new artworks arrive</li>
          <li>The occasional discount or little giveaway</li>
          <li>Where to find me next at local art-market pop-ups</li>
        </ul>
        <p style="color:${PLUM};line-height:1.6;font-size:15px;margin:0 0 6px;">
          And whenever you would like to reach me, I would love to hear from you:
        </p>
        <ul style="color:${PLUM};line-height:1.8;font-size:15px;margin:0 0 8px;padding-left:20px;list-style:none;">
          <li>💬 <a href="${WHATSAPP_URL}" style="color:${ACCENT};">Message me on WhatsApp</a></li>
          <li>✉️ <a href="mailto:hello@cozywithanne.com" style="color:${ACCENT};">hello@cozywithanne.com</a> - for anything at all</li>
          <li>🛟 <a href="mailto:support@cozywithanne.com" style="color:${ACCENT};">support@cozywithanne.com</a> - for help with an order</li>
        </ul>
        <p style="color:${ACCENT};font-size:16px;margin-top:20px;">With love,<br/>Anne</p>
      </div>
    </div>
  </div>`;
}

export async function sendNewsletterWelcome({ email }) {
  const c = getClient();
  if (!c) {
    console.warn("RESEND_API_KEY not set; skipping newsletter welcome email.");
    return;
  }
  if (!email) return;
  try {
    await c.emails.send({
      from: FROM,
      to: email,
      replyTo: REPLY_TO,
      subject: "Welcome to Cozy with Anne 💌",
      html: newsletterWelcomeHtml(),
    });
  } catch (err) {
    console.error("Newsletter welcome email failed:", err);
  }
}
