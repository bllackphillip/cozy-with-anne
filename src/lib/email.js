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
                       cozywithanne@gmail.com.
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
const ADMIN_TO = process.env.ORDER_EMAIL_ADMIN || "cozywithanne@gmail.com";
const REPLY_TO = process.env.ORDER_EMAIL_REPLY_TO || undefined;

// Brand palette (literal hex; email clients can't read CSS variables).
const PLUM = "#4A2E2E";
const ACCENT = "#A06868";
const BG = "#FAF6F0";

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

function customerHtml({ firstName, items, amountTotal }) {
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
          <tr>
            <td style="padding:14px 0 0;font-weight:bold;color:${PLUM};">Total</td>
            <td style="padding:14px 0 0;text-align:right;font-weight:bold;color:${PLUM};">${money(amountTotal)}</td>
          </tr>
        </table>
      </div>
      <div style="padding:16px 32px 28px;">
        <p style="color:${PLUM};line-height:1.6;font-size:15px;">
          Next, I will pack everything by hand in recycled, plastic-free materials and
          send it on its way. I will be in touch with shipping details shortly. If you
          need anything at all, just reply to this email or write to
          <a href="mailto:support@cozywithanne.com" style="color:${ACCENT};">support@cozywithanne.com</a>.
        </p>
        <p style="color:${ACCENT};font-size:16px;margin-top:20px;">With love,<br/>Anne</p>
      </div>
    </div>
  </div>`;
}

function adminHtml({ customerName, customerEmail, items, amountTotal, shippingAddress }) {
  const addr = shippingAddress
    ? [shippingAddress.line1, shippingAddress.line2, shippingAddress.postal_code, shippingAddress.city, shippingAddress.country]
        .filter(Boolean)
        .map(escapeHtml)
        .join(", ")
    : "No shipping address on file";
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:${PLUM};font-size:15px;line-height:1.6;">
    <h2 style="color:${ACCENT};">New order</h2>
    <p><strong>From:</strong> ${escapeHtml(customerName || "Unknown")} (${escapeHtml(customerEmail || "no email")})</p>
    <table style="border-collapse:collapse;margin:8px 0;">
      ${itemRows(items)}
      <tr><td style="padding-top:10px;font-weight:bold;">Total</td><td style="padding-top:10px;text-align:right;font-weight:bold;">${money(amountTotal)}</td></tr>
    </table>
    <p><strong>Ship to:</strong> ${addr}</p>
  </div>`;
}

export async function sendOrderEmails(order) {
  const c = getClient();
  if (!c) {
    console.warn("RESEND_API_KEY not set; skipping order emails.");
    return;
  }

  const { customerEmail, customerName, items, amountTotal, shippingAddress } = order;
  const firstName = (customerName || "").trim().split(/\s+/)[0] || "there";
  const count = (items ?? []).length;

  if (customerEmail) {
    try {
      await c.emails.send({
        from: FROM,
        to: customerEmail,
        replyTo: REPLY_TO,
        subject: "Your Cozy with Anne order is confirmed 💌",
        html: customerHtml({ firstName, items, amountTotal }),
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
      subject: `New order: ${money(amountTotal)} (${count} item${count === 1 ? "" : "s"})`,
      html: adminHtml({ customerName, customerEmail, items, amountTotal, shippingAddress }),
    });
  } catch (err) {
    console.error("Admin order alert failed:", err);
  }
}
