import nodemailer from "nodemailer";

// ─── Transport ────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || "smtp.gmail.com",
  port:   parseInt(process.env.SMTP_PORT  || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM
  ? process.env.SMTP_FROM
  : `"WOW Lifestyle" <${process.env.SMTP_USER}>`;

// ─── Shared HTML shell ────────────────────────────────────────────────────────
function shell(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080808;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:32px auto;background:#0f0f0f;border:1px solid #1e1e1e;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#C9A84C,#E2BE6A);padding:28px 32px;text-align:center;">
    <h1 style="margin:0;color:#000;font-size:22px;font-weight:900;letter-spacing:.15em;">WOW LIFESTYLE</h1>
    <p style="margin:6px 0 0;color:#000;opacity:.6;font-size:12px;letter-spacing:.1em;">THURIUR · TAMIL NADU</p>
  </div>
  ${body}
  <div style="background:#0a0a0a;padding:16px 32px;text-align:center;border-top:1px solid #1a1a1a;">
    <p style="color:#555;font-size:12px;margin:0;">Questions? <a href="mailto:support@wowlifestyle.online" style="color:#C9A84C;text-decoration:none;">support@wowlifestyle.online</a></p>
    <p style="color:#333;font-size:11px;margin:6px 0 0;">© ${new Date().getFullYear()} WOW Lifestyle Thuriur. All rights reserved.</p>
  </div>
</div></body></html>`;
}

// ─── 1. Order Confirmation ────────────────────────────────────────────────────
export async function sendOrderConfirmation(order: {
  orderId:         string;
  contactEmail:    string;
  totalAmount:     number;
  paymentMethod:   string;
  shippingAddress?: { firstName?: string; lastName?: string; address?: string; apartment?: string; city?: string; state?: string; pinCode?: string; phone?: string };
  items: { title: string; price: number; quantity: number }[];
}) {
  if (!order.contactEmail || !process.env.SMTP_USER) return;

  const rows = order.items.map(i => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #1e1e1e;color:#ccc;font-size:14px;">${i.quantity}× ${i.title}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #1e1e1e;text-align:right;color:#C9A84C;font-weight:600;font-size:14px;">₹${(i.price * i.quantity).toLocaleString("en-IN")}</td>
    </tr>`).join("");

  const addr = order.shippingAddress;
  const addrBlock = addr ? `
    <div style="border-top:1px solid #1e1e1e;padding:20px 32px;">
      <p style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px;">Shipping Address</p>
      <p style="color:#888;font-size:13px;line-height:1.7;margin:0;">
        ${addr.firstName || ""} ${addr.lastName || ""}<br>
        ${addr.address || ""}${addr.apartment ? ", " + addr.apartment : ""}<br>
        ${addr.city || ""}, ${addr.state || ""} ${addr.pinCode || ""}<br>
        ${addr.phone ? "Ph: " + addr.phone : ""}
      </p>
    </div>` : "";

  const body = `
    <div style="padding:32px;text-align:center;">
      <div style="width:56px;height:56px;background:rgba(201,168,76,.1);border:2px solid #C9A84C;border-radius:50%;margin:0 auto 16px;line-height:56px;font-size:26px;">✓</div>
      <h2 style="color:#fff;margin:0 0 8px;font-size:22px;">Order Confirmed!</h2>
      <p style="color:#888;margin:0 0 24px;font-size:14px;">Hi ${addr?.firstName || "Customer"}, thank you for shopping with WOW Lifestyle.</p>
      <div style="background:rgba(201,168,76,.05);border:1px solid rgba(201,168,76,.2);border-radius:10px;padding:14px;margin-bottom:24px;">
        <p style="color:#888;margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;">Order ID</p>
        <p style="color:#C9A84C;margin:0;font-size:18px;font-weight:700;font-family:monospace;">${order.orderId}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;text-align:left;">${rows}
        <tr><td style="padding:14px 12px 0;color:#888;font-size:13px;">Payment</td>
            <td style="padding:14px 12px 0;text-align:right;color:#ccc;font-size:13px;text-transform:capitalize;">${order.paymentMethod}</td></tr>
        <tr><td style="padding:6px 12px 0;color:#fff;font-weight:700;font-size:16px;">Total</td>
            <td style="padding:6px 12px 0;text-align:right;color:#C9A84C;font-weight:700;font-size:18px;">₹${order.totalAmount.toLocaleString("en-IN")}</td></tr>
      </table>
    </div>
    ${addrBlock}`;

  await transporter.sendMail({
    from: FROM,
    to:   order.contactEmail,
    subject: `🎉 Order Confirmed — ${order.orderId} | WOW Lifestyle`,
    html: shell(body),
  });
}

// ─── 2. Order Status Update ───────────────────────────────────────────────────
export async function sendOrderStatusUpdate(order: {
  orderId:      string;
  contactEmail: string;
  totalAmount:  number;
  orderStatus:  string;
  shippingAddress?: { firstName?: string };
}) {
  if (!order.contactEmail || !process.env.SMTP_USER) return;

  const cfg: Record<string, { icon: string; color: string; msg: string }> = {
    Processing: { icon: "⏳", color: "#C9A84C", msg: "Your order is being processed and will be packed soon."   },
    Shipped:    { icon: "🚚", color: "#60a5fa", msg: "Great news! Your order has been shipped and is on its way." },
    Delivered:  { icon: "✅", color: "#34d399", msg: "Your order has been delivered. Enjoy your purchase!"        },
    Cancelled:  { icon: "❌", color: "#f87171", msg: "Your order has been cancelled. Contact us if you need help." },
  };
  const { icon, color, msg } = cfg[order.orderStatus] || cfg.Processing;

  const body = `
    <div style="padding:40px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">${icon}</div>
      <h2 style="color:#fff;margin:0 0 10px;font-size:22px;">Order ${order.orderStatus}</h2>
      <p style="color:#888;margin:0 0 28px;font-size:14px;line-height:1.6;">${msg}</p>
      <div style="background:rgba(255,255,255,.03);border:1px solid #1e1e1e;border-radius:10px;padding:16px;margin-bottom:20px;">
        <p style="color:#555;font-size:11px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 4px;">Order ID</p>
        <p style="color:${color};font-size:16px;font-weight:700;font-family:monospace;margin:0;">${order.orderId}</p>
      </div>
      <p style="color:#666;font-size:13px;margin:0;">
        Hi ${order.shippingAddress?.firstName || "Customer"}, your order for
        <strong style="color:#fff;">₹${order.totalAmount.toLocaleString("en-IN")}</strong> is now
        <strong style="color:${color};">${order.orderStatus}</strong>.
      </p>
    </div>`;

  await transporter.sendMail({
    from: FROM,
    to:   order.contactEmail,
    subject: `Order ${order.orderStatus} — ${order.orderId} | WOW Lifestyle`,
    html: shell(body),
  });
}

// ─── 3. New Order Alert to Admin ──────────────────────────────────────────────
export async function sendAdminOrderAlert(order: {
  orderId:      string;
  contactEmail: string;
  totalAmount:  number;
  paymentMethod:string;
  shippingAddress?: { firstName?: string; lastName?: string; city?: string; phone?: string };
  items: { title: string; quantity: number; price: number }[];
}) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (!adminEmail || !process.env.SMTP_USER) return;

  const rows = order.items.map(i => `<li style="color:#ccc;font-size:14px;margin-bottom:4px;">${i.quantity}× ${i.title} — ₹${(i.price*i.quantity).toLocaleString("en-IN")}</li>`).join("");

  const body = `
    <div style="padding:28px 32px;">
      <div style="background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.3);border-radius:10px;padding:16px;margin-bottom:20px;">
        <p style="color:#C9A84C;font-size:13px;font-weight:700;margin:0 0 4px;text-transform:uppercase;letter-spacing:.1em;">New Order Received</p>
        <p style="color:#fff;font-size:20px;font-weight:700;font-family:monospace;margin:0;">${order.orderId}</p>
      </div>
      <table style="width:100%;font-size:13px;">
        <tr><td style="color:#888;padding:6px 0;">Customer</td><td style="color:#fff;font-weight:600;">${order.shippingAddress?.firstName || ""} ${order.shippingAddress?.lastName || ""}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">Email</td><td style="color:#ccc;">${order.contactEmail}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">Phone</td><td style="color:#ccc;">${order.shippingAddress?.phone || "—"}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">City</td><td style="color:#ccc;">${order.shippingAddress?.city || "—"}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">Payment</td><td style="color:#C9A84C;font-weight:600;text-transform:capitalize;">${order.paymentMethod}</td></tr>
        <tr><td style="color:#888;padding:6px 0;">Total</td><td style="color:#C9A84C;font-weight:700;font-size:16px;">₹${order.totalAmount.toLocaleString("en-IN")}</td></tr>
      </table>
      <div style="border-top:1px solid #1e1e1e;padding-top:16px;margin-top:16px;">
        <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px;">Items</p>
        <ul style="margin:0;padding-left:18px;">${rows}</ul>
      </div>
    </div>`;

  await transporter.sendMail({
    from:    FROM,
    to:      adminEmail,
    subject: `🛍️ New Order ${order.orderId} — ₹${order.totalAmount.toLocaleString("en-IN")} | WOW Lifestyle`,
    html: shell(body),
  });
}
