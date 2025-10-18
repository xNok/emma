/**
 * Emma Form Bundle - ESM Module
 * Generated bundle for form: contact-form
 * This module depends on the Emma Forms runtime (emma-forms.esm.js)
 */

import FormRenderer from './emma-forms.esm.js';

// Form schema embedded in bundle
const FORM_SCHEMA = {
  "name": "Contact Us",
  "version": "0.0.1",
  "fields": [
    {
      "name": "name",
      "label": "Your Name",
      "type": "text",
      "required": true
    },
    {
      "name": "email",
      "label": "Your Email",
      "type": "email",
      "required": true
    },
    {
      "name": "message",
      "label": "Message",
      "type": "textarea",
      "required": true,
      "rows": 5,
      "resize": "vertical"
    }
  ],
  "options": {
    "theme": "default",
    "honeypot": "website",
    "apiEndpoint": "/api/submit/contact-form",
    "successUrl": "/thank-you",
    "errorUrl": "/error",
    "spamThreshold": 0.8,
    "allowedOrigins": [
      "http://localhost:1313",
      "https://example.com"
    ],
    "saveSubmissions": true,
    "submissionFormat": "json",
    "submissionFilename": "submissions/contact-form/{{timestamp}}-{{uuid}}.json",
    "enableRecaptcha": false,
    "enableTurnstile": false,
    "enableAkismet": false,
    "sendEmail": false,
    "emailSettings": {
      "fromAddress": "noreply@example.com",
      "toAddress": "contact@example.com",
      "subject": "New Contact Form Submission",
      "template": "default-email"
    },
    "customStyles": ".form-group {\n  margin-bottom: 1.5rem;\n}\nlabel {\n  font-weight: bold;\n}\n",
    "customScripts": "console.log(\"Contact form loaded!\");\n"
  },
  "formId": "contact-form"
};

/**
 * Ensure container has an ID for targeting
 */
function ensureContainerId(el, index) {
  if (!el.id) {
    el.id = `emma-form-contact-form-${index}`;
  }
  return el.id;
}

/**
 * Initialize all forms with data attribute
 */
function init() {
  const containers = document.querySelectorAll('[data-emma-form="contact-form"]');

  if (containers.length === 0) {
    console.warn('[Emma] No containers found for form "contact-form". Add data-emma-form="contact-form" to your container element.');
  }

  containers.forEach((container, idx) => {
    const containerId = ensureContainerId(container, idx);
    try {
      const renderer = new FormRenderer({
        formId: 'contact-form',
        containerId,
        schema: FORM_SCHEMA,
        theme: FORM_SCHEMA.theme,
      });
      renderer.render();
      console.log(`[Emma] Form "contact-form" rendered in #${containerId}`);
    } catch (error) {
      console.error(`[Emma] Failed to render form "contact-form":`, error);
    }
  });
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for manual initialization
export { FORM_SCHEMA, FormRenderer };
export default { init, schema: FORM_SCHEMA };
