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
}

// Hand-written in place of @cloudflare/workers-types (not on the approved
// package list — see CLAUDE.md Section 1). Cloudflare's Functions bundler
// transpiles this without type-checking, so this is purely for editor DX.
interface PagesFunctionContext<E> {
  request: Request;
  env: E;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

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
  let payload: Partial<ContactPayload>;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, 400);
  }

  const { name, email, interested, message, turnstileToken } = payload;

  // Returns which field is at fault, not just a generic message — lets the
  // client point at the actual input even if a request bypasses client-side
  // validation entirely (e.g. a direct API call).
  if (!name?.trim()) {
    return jsonResponse({ error: 'Please enter your name.', field: 'name' }, 400);
  }
  if (!email?.trim()) {
    return jsonResponse({ error: 'Please enter your email address.', field: 'email' }, 400);
  }
  if (!message?.trim()) {
    return jsonResponse({ error: 'Please enter a message.', field: 'message' }, 400);
  }
  if (!turnstileToken) {
    return jsonResponse({ error: 'Missing spam check token.' }, 400);
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return jsonResponse({ error: 'Please enter a valid email address.', field: 'email' }, 400);
  }

  const remoteIp = request.headers.get('CF-Connecting-IP');
  const turnstileOk = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, remoteIp);
  if (!turnstileOk) {
    return jsonResponse({ error: 'Spam check failed. Please try again.' }, 400);
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: env.RESEND_TO_EMAIL,
    replyTo: email,
    subject: `New enquiry: ${interested?.trim() || 'General'} — ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nInterested in: ${interested?.trim() || 'Not specified'}\n\n${message}`,
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
    subject: "We've got your message — DEMWeb Studio",
    text: `Hi ${name},\n\nThanks for reaching out to DEMWeb Studio — this confirms we've received your message and will reply within one business day.\n\nFor your records, here's what you sent:\n\nInterested in: ${interested?.trim() || 'Not specified'}\nMessage: ${message}\n\nIf anything's missing or you want to add something, just reply directly to this email.\n\nTalk soon,\nDEMWeb Studio`,
  });

  if (confirmationError) {
    console.error('Confirmation email failed to send:', confirmationError);
  }

  return jsonResponse({ success: true });
}
