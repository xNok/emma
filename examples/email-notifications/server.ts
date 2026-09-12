/**
 * Post-Submission Email Notification Handler Example
 * Uses @xnok/emma-provider-cloudflare email driver to send emails on submission.
 */

import { eventHandler, readBody, createError } from 'h3';
import { cloudflareEmailDriver } from '@xnok/emma-provider-cloudflare';

// Initialize Cloudflare Email Driver
// Options pick up environment variables when running in Node or worker bindings when on Cloudflare Workers
const emailDriver = cloudflareEmailDriver({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
});

export default eventHandler(async (event) => {
  const body = await readBody(event);

  if (!body || !body.data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid submission payload',
    });
  }

  const { name, email, subject, message } = body.data;

  // Basic validation check
  if (!name || !email || !message) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Missing required form fields',
    });
  }

  console.log(`Processing submission from ${name} (${email})...`);

  // 1. Dispatch Admin Notification Email
  const adminNotification = await emailDriver.send({
    to: process.env.ADMIN_EMAIL || 'admin@example.com',
    from: { name: 'Emma Form System', email: 'noreply@example.com' },
    replyTo: email,
    subject: `[New Contact Submission] ${subject || 'New Message'}`,
    text: `You received a new submission from ${name} (${email}):\n\n${message}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${name} (&lt;${email}&gt;)</p>
      <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
      <hr />
      <h3>Message:</h3>
      <p>${String(message).replace(/\n/g, '<br/>')}</p>
    `,
  });

  if (!adminNotification.success) {
    console.error('Failed to send admin notification email:', adminNotification.error);
  }

  // 2. Dispatch Auto-Responder Email to Form Submitter
  const autoResponder = await emailDriver.send({
    to: email,
    from: { name: 'Support Team', email: 'support@example.com' },
    subject: 'We received your message!',
    text: `Hi ${name},\n\nThank you for reaching out to us. We have received your message and will get back to you shortly.\n\nBest regards,\nThe Team`,
    html: `
      <h3>Hello ${name},</h3>
      <p>Thank you for reaching out to us! We have received your message regarding "<strong>${subject || 'your inquiry'}</strong>".</p>
      <p>Our team will review your submission and respond as soon as possible.</p>
      <br/>
      <p>Best regards,<br/><strong>The Team</strong></p>
    `,
  });

  return {
    success: true,
    message: 'Submission received and email notifications dispatched.',
    adminEmailSent: adminNotification.success,
    confirmationEmailSent: autoResponder.success,
  };
});
