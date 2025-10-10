(function() {
  'use strict';

  // Form schema embedded in bundle
  const FORM_SCHEMA = __FORM_SCHEMA__;

  function ensureContainerId(el, index) {
    if (!el.id) {
      el.id = `emma-form-__FORM_ID__-${index}`;
    }
    return el.id;
  }

  function init() {
    if (!window.EmmaForms || !window.EmmaForms.FormRenderer) {
      console.error('[Emma] FormRenderer runtime not found. Make sure emma-forms.min.js is loaded before this bundle.');
      return;
    }

    const containers = document.querySelectorAll('[data-emma-form="__FORM_ID__"]');
    containers.forEach((container, idx) => {
      const containerId = ensureContainerId(container, idx);
      const renderer = new window.EmmaForms.FormRenderer({
        formId: '__FORM_ID__',
        containerId,
        schema: FORM_SCHEMA,
        theme: FORM_SCHEMA.theme,
      });
      renderer.render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Global API for manual initialization
  window.EmmaForm = window.EmmaForm || {};
  window.EmmaForm['__FORM_ID__'] = function(containerId) {
    if (!window.EmmaForms || !window.EmmaForms.FormRenderer) {
      throw new Error('[Emma] FormRenderer runtime not found. Load emma-forms.min.js first.');
    }
    return new window.EmmaForms.FormRenderer({
      formId: '__FORM_ID__',
      containerId,
      schema: FORM_SCHEMA,
      theme: FORM_SCHEMA.theme,
    });
  };

})();
