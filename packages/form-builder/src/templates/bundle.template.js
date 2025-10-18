/**
 * Emma Form Bundle - ESM Module
 * Generated bundle for form: __FORM_ID__
 * This module depends on the Emma Forms runtime (emma-forms.esm.js)
 */

import FormRenderer from './emma-forms.esm.js';

// Form schema embedded in bundle
const FORM_SCHEMA = __FORM_SCHEMA__;

/**
 * Ensure container has an ID for targeting
 */
function ensureContainerId(el, index) {
  if (!el.id) {
    el.id = `emma-form-__FORM_ID__-${index}`;
  }
  return el.id;
}

/**
 * Initialize all forms with data attribute
 */
function init() {
  const containers = document.querySelectorAll(
    '[data-emma-form="__FORM_ID__"]'
  );

  if (containers.length === 0) {
    console.warn(
      '[Emma] No containers found for form "__FORM_ID__". Add data-emma-form="__FORM_ID__" to your container element.'
    );
  }

  containers.forEach((container, idx) => {
    const containerId = ensureContainerId(container, idx);
    try {
      const renderer = new FormRenderer({
        formId: '__FORM_ID__',
        containerId,
        schema: FORM_SCHEMA,
        theme: FORM_SCHEMA.theme,
      });
      renderer.render();
      console.log(`[Emma] Form "__FORM_ID__" rendered in #${containerId}`);
    } catch (error) {
      console.error(`[Emma] Failed to render form "__FORM_ID__":`, error);
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
