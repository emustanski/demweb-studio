// Cloudflare Pages Function — POST /api/contact
// Verifies the Turnstile token server-side, then sends the submission via
// Resend. Lives outside src/ because Astro builds statically (no adapter);
// Cloudflare's own file-based Functions routing picks this up independently
// of the Astro build. See CLAUDE.md Section 1.

import { Resend } from 'resend';

interface Env {
  RESEND_API_KEY: string;
  RESEND_TO_EMAIL: string;
  RESEND_FROM_EMAIL: string;
  TURNSTILE_SECRET_KEY: string;
}

interface ContactPayload {
  name: string;
  email: string;
  interested: string;
  message: string;
  turnstileToken: string;
  projectStatus: string;
  budget: string;
  timeline: string;
  websiteUrl: string;
  biggestConcern: string;
}

// Hand-written in place of @cloudflare/workers-types (not on the approved
// package list — see CLAUDE.md Section 1). Cloudflare's Functions bundler
// transpiles this without type-checking, so this is purely for editor DX.
interface PagesFunctionContext<E> {
  request: Request;
  env: E;
}

// Keep in sync with the `interestOptions` array in src/pages/contact.astro —
// functions/ can't import from src/ (separate build pipeline, see header).
const INTEREST_OPTIONS = [
  'Custom Website Build',
  'Website Redesign',
  'Performance / Speed Optimization',
  'Full SEO Audit',
  'Other',
];

// Keep in sync with the projectStatus radio values in src/pages/contact.astro.
const PROJECT_STATUS_OPTIONS = ['new', 'existing'];

// Loose caps on the optional lead-qualification fields — these are hints for
// scoping the conversation, not validated against an allow-list like
// INTEREST_OPTIONS/PROJECT_STATUS_OPTIONS, so a length cap is the only real
// guard needed.
const OPTIONAL_FIELD_MAX = 300;

// Keep in sync with the minlength/maxlength attributes on the form fields in
// src/pages/contact.astro, same cross-pipeline reason as INTEREST_OPTIONS.
const NAME_MIN = 2;
const NAME_MAX = 100;
const EMAIL_MAX = 254; // RFC 5321's hard limit on total email address length
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Strips CR/LF so user input can never smuggle extra headers into the
// outgoing email ("email header injection") — used only on fields that get
// interpolated into a Subject line, not the email body, where newlines are
// legitimate. The email regex below already rejects embedded newlines on its
// own (they're whitespace), so this is only needed for name/interested.
function sanitizeForHeader(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

async function verifyTurnstile(token: string, secret: string, remoteIp: string | null): Promise<boolean> {
  const formData = new URLSearchParams();
  formData.append('secret', secret);
  formData.append('response', token);
  if (remoteIp) formData.append('remoteip', remoteIp);

  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });
  const outcome = (await result.json()) as { success: boolean };
  return outcome.success;
}

export async function onRequestPost({ request, env }: PagesFunctionContext<Env>): Promise<Response> {
  // Parsed JSON is `unknown` per-field at runtime regardless of what the type
  // annotation below claims — a request built by hand (not through the form)
  // could send any shape at all, so every field is type-checked before any
  // string method is called on it.
  let payload: Partial<Record<keyof ContactPayload, unknown>>;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, 400);
  }

  const rawTurnstileToken = payload.turnstileToken;
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const interested = typeof payload.interested === 'string' ? payload.interested.trim() : '';
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';
  const projectStatus = typeof payload.projectStatus === 'string' ? payload.projectStatus.trim() : '';
  const budget = typeof payload.budget === 'string' ? payload.budget.trim().slice(0, OPTIONAL_FIELD_MAX) : '';
  const timeline = typeof payload.timeline === 'string' ? payload.timeline.trim().slice(0, OPTIONAL_FIELD_MAX) : '';
  const websiteUrl = typeof payload.websiteUrl === 'string' ? payload.websiteUrl.trim().slice(0, OPTIONAL_FIELD_MAX) : '';
  const biggestConcern =
    typeof payload.biggestConcern === 'string' ? payload.biggestConcern.trim().slice(0, OPTIONAL_FIELD_MAX) : '';

  // Each check returns which field is at fault, not just a generic message —
  // lets the client point at the actual input even if a request bypasses
  // client-side validation entirely (e.g. a direct API call).
  if (!name) {
    return jsonResponse({ error: 'Please enter your name.', field: 'name' }, 400);
  }
  if (name.length < NAME_MIN) {
    return jsonResponse({ error: `Your name must be at least ${NAME_MIN} characters.`, field: 'name' }, 400);
  }
  if (name.length > NAME_MAX) {
    return jsonResponse({ error: `Please keep your name under ${NAME_MAX} characters.`, field: 'name' }, 400);
  }

  if (!email) {
    return jsonResponse({ error: 'Please enter your email address.', field: 'email' }, 400);
  }
  if (email.length > EMAIL_MAX) {
    return jsonResponse({ error: `Please keep your email under ${EMAIL_MAX} characters.`, field: 'email' }, 400);
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return jsonResponse({ error: 'Please enter a valid email address.', field: 'email' }, 400);
  }

  if (interested && !INTEREST_OPTIONS.includes(interested)) {
    return jsonResponse({ error: 'Please choose a valid option for "Interested in".', field: 'interested' }, 400);
  }

  if (!projectStatus || !PROJECT_STATUS_OPTIONS.includes(projectStatus)) {
    return jsonResponse({ error: 'Please choose whether this is a new or existing website.', field: 'projectStatus' }, 400);
  }

  if (!message) {
    return jsonResponse({ error: 'Please enter a message.', field: 'message' }, 400);
  }
  if (message.length < MESSAGE_MIN) {
    return jsonResponse({ error: `Please enter at least ${MESSAGE_MIN} characters.`, field: 'message' }, 400);
  }
  if (message.length > MESSAGE_MAX) {
    return jsonResponse({ error: `Please keep your message under ${MESSAGE_MAX} characters.`, field: 'message' }, 400);
  }

  if (!rawTurnstileToken || typeof rawTurnstileToken !== 'string') {
    return jsonResponse({ error: 'Missing spam check token.' }, 400);
  }

  const remoteIp = request.headers.get('CF-Connecting-IP');
  const turnstileOk = await verifyTurnstile(rawTurnstileToken, env.TURNSTILE_SECRET_KEY, remoteIp);
  if (!turnstileOk) {
    return jsonResponse({ error: 'Spam check failed. Please try again.' }, 400);
  }

  const safeName = sanitizeForHeader(name);
  const safeInterested = sanitizeForHeader(interested);

  // One shared block of conditional lines for both emails below, rather than
  // two separate templates — only the fields relevant to the chosen
  // projectStatus path are ever included.
  const projectStatusLabel = projectStatus === 'new' ? 'New website' : 'Already have a website';
  const extraLines = [
    `Project status: ${projectStatusLabel}`,
    ...(projectStatus === 'new'
      ? [budget ? `Budget: ${budget}` : '', timeline ? `Timeline: ${timeline}` : '']
      : [websiteUrl ? `Website: ${websiteUrl}` : '', biggestConcern ? `Biggest concern: ${biggestConcern}` : '']
    ).filter((line) => line.length > 0),
  ].join('\n');

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: env.RESEND_TO_EMAIL,
    replyTo: email,
    subject: `New enquiry: ${safeInterested || 'General'} — ${safeName}`,
    text: `Name: ${name}\nEmail: ${email}\nInterested in: ${interested || 'Not specified'}\n${extraLines}\n\n${message}`,
  });

  if (error) {
    return jsonResponse({ error: 'Could not send message. Please try again later.' }, 502);
  }

  // Best-effort confirmation to the visitor — the enquiry itself already
  // succeeded above, so a failure here shouldn't turn into a user-facing
  // error. replyTo points back at the studio inbox, not this automated
  // address, so hitting "reply" reaches a real person.
  const { error: confirmationError } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: email,
    replyTo: env.RESEND_TO_EMAIL,
    subject: "I've got your message — DEMWeb Studio",
    text: `Hi ${name},\n\nThanks for reaching out to DEMWeb Studio — this confirms I've received your message and will reply within one business day.\n\nFor your records, here's what you sent:\n\nInterested in: ${interested || 'Not specified'}\n${extraLines}\nMessage: ${message}\n\nIf anything's missing or you want to add something, just reply directly to this email.\n\nTalk soon,\nEdi`,
  });

  if (confirmationError) {
    console.error('Confirmation email failed to send:', confirmationError);
  }

  return jsonResponse({ success: true });
}
