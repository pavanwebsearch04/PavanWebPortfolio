import { NextResponse } from "next/server";
import { services } from "@/data/services";

// Contact form endpoint. It reports success ONLY when a real email service
// accepts the message. With no service configured it answers 503 with
// { error: "not_configured" } and the form shows a mailto fallback instead.
//
// Required environment variables (server-side only — never NEXT_PUBLIC_):
//   RESEND_API_KEY       API key from https://resend.com
//   CONTACT_TO_EMAIL     inbox that receives enquiries
//   CONTACT_FROM_EMAIL   verified sender, e.g. "Portfolio <contact@your-domain.com>"

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// the nine services plus "Something else": the same list the form offers
const PROJECT_TYPES = [...services.map((s) => s.title), "Something else"];
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;

// Best-effort, per-instance rate limit (resets on cold start). A hosted
// deployment should add platform-level limiting as well.
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_HITS;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // honeypot: real visitors never see or fill this field
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 30);
  const projectType = clean(body.projectType, 80);
  const budget = clean(body.budget, 120);
  const message = clean(body.message, 4000);

  const phoneLen = phone.replace(/\D/g, "").length;
  if (!name || !EMAIL_RE.test(email) || !PHONE_RE.test(phone) || phoneLen < 7 || phoneLen > 15 || message.length < 10 || !PROJECT_TYPES.includes(projectType)) {
    return NextResponse.json({ error: "invalid_fields" }, { status: 422 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Portfolio enquiry: ${projectType} — ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nProject type: ${projectType}\nBudget: ${budget || "not given"}\n\n${message}`,
        html: `<p><strong>Name:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}<br><strong>Phone:</strong> ${escapeHtml(phone)}<br><strong>Project type:</strong> ${escapeHtml(projectType)}<br><strong>Budget:</strong> ${escapeHtml(budget || "not given")}</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
      }),
    });
    if (!res.ok) return NextResponse.json({ error: "send_failed" }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
}
