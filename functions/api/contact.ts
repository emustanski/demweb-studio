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

  if (!name?.trim() || !email?.trim() || !message?.trim() || !turnstileToken) {
    return jsonResponse({ error: 'Missing required fields.' }, 400);
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return jsonResponse({ error: 'Invalid email address.' }, 400);
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

  return jsonResponse({ success: true });
}
