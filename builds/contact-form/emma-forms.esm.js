/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

const PATTERN_PRESETS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^https?:\/\/.+/,
    tel: /^\+?[\d\s\-()]+$/,
};
function validateSubmissionData(data, schema) {
    const errors = [];
    schema.fields.forEach((field) => {
        const value = data[field.id];
        if (field.required && (value === undefined || value === '')) {
            errors.push({
                field: field.id,
                message: `${field.label} is required`,
            });
            return;
        }
        if (!value && !field.required) {
            return;
        }
        if (field.validation) {
            const fieldErrors = validateFieldValue(field.id, value, field.type, field.validation, field.label);
            errors.push(...fieldErrors);
        }
    });
    return { valid: errors.length === 0, errors };
}
function validateFieldValue(fieldId, value, type, rules, label) {
    const errors = [];
    const strValue = String(value);
    if (rules.pattern) {
        let regex;
        if (typeof rules.pattern === 'string') {
            if (rules.pattern in PATTERN_PRESETS) {
                regex = PATTERN_PRESETS[rules.pattern];
            }
            else {
                regex = new RegExp(rules.pattern);
            }
            if (!regex.test(strValue)) {
                errors.push({
                    field: fieldId,
                    message: `${label} has an invalid format`,
                });
            }
        }
    }
    if (rules.minLength !== undefined && strValue.length < rules.minLength) {
        errors.push({
            field: fieldId,
            message: `${label} must be at least ${rules.minLength} characters`,
        });
    }
    if (rules.maxLength !== undefined && strValue.length > rules.maxLength) {
        errors.push({
            field: fieldId,
            message: `${label} must be at most ${rules.maxLength} characters`,
        });
    }
    if (type === 'number') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
            errors.push({
                field: fieldId,
                message: `${label} must be a valid number`,
            });
        }
        else {
            if (rules.min !== undefined && numValue < rules.min) {
                errors.push({
                    field: fieldId,
                    message: `${label} must be at least ${rules.min}`,
                });
            }
            if (rules.max !== undefined && numValue > rules.max) {
                errors.push({
                    field: fieldId,
                    message: `${label} must be at most ${rules.max}`,
                });
            }
        }
    }
    return errors;
}

class FormRenderer {
    constructor(options) {
        this.form = null;
        this.options = options;
        this.schema = options.schema;
        const container = document.getElementById(options.containerId);
        if (!container) {
            throw new Error(`Container ${options.containerId} not found`);
        }
        this.container = container;
    }
    render() {
        var _a, _b;
        this.container.innerHTML = '';
        const form = document.createElement('form');
        form.className = 'emma-form';
        form.setAttribute('novalidate', '');
        form.addEventListener('submit', (event) => {
            void this.handleSubmit(event);
        });
        this.schema.fields.forEach((field) => {
            if (field.type === 'hidden') {
                form.appendChild(this.renderHiddenField(field));
            }
            else {
                const fieldGroup = this.renderFieldGroup(field);
                form.appendChild(fieldGroup);
            }
        });
        if ((_b = (_a = this.schema.settings) === null || _a === void 0 ? void 0 : _a.honeypot) === null || _b === void 0 ? void 0 : _b.enabled) {
            const honeypot = this.renderHoneypot(this.schema.settings.honeypot.fieldName);
            form.appendChild(honeypot);
        }
        const submitButton = this.renderSubmitButton();
        form.appendChild(submitButton);
        const messageContainer = document.createElement('div');
        messageContainer.className = 'emma-form-messages';
        messageContainer.setAttribute('role', 'alert');
        messageContainer.setAttribute('aria-live', 'polite');
        form.appendChild(messageContainer);
        this.form = form;
        this.container.appendChild(this.form);
    }
    renderFieldGroup(field) {
        const group = document.createElement('div');
        group.className = `emma-form-group emma-form-group--${field.type}`;
        group.setAttribute('data-field-id', field.id);
        const label = document.createElement('label');
        label.htmlFor = `emma-field-${field.id}`;
        label.className = 'emma-form-label';
        label.textContent = field.label;
        if (field.required) {
            const required = document.createElement('span');
            required.className = 'emma-form-required';
            required.textContent = ' *';
            required.setAttribute('aria-label', 'required');
            label.appendChild(required);
        }
        group.appendChild(label);
        if (field.helpText) {
            const help = document.createElement('small');
            help.className = 'emma-form-help';
            help.id = `emma-help-${field.id}`;
            help.textContent = field.helpText;
            group.appendChild(help);
        }
        const input = this.renderInput(field);
        group.appendChild(input);
        const error = document.createElement('div');
        error.className = 'emma-form-error';
        error.id = `emma-error-${field.id}`;
        error.setAttribute('role', 'alert');
        group.appendChild(error);
        return group;
    }
    renderInput(field) {
        switch (field.type) {
            case 'textarea':
                return this.renderTextarea(field);
            case 'select':
                return this.renderSelect(field);
            case 'radio':
                return this.renderRadio(field);
            case 'checkbox':
                return this.renderCheckbox(field);
            default:
                return this.renderTextInput(field);
        }
    }
    renderTextInput(field) {
        const input = document.createElement('input');
        input.type = field.type;
        input.id = `emma-field-${field.id}`;
        input.name = field.id;
        input.className = 'emma-form-input';
        if (field.placeholder)
            input.placeholder = field.placeholder;
        if (field.required)
            input.required = true;
        if (field.autocomplete)
            input.setAttribute('autocomplete', field.autocomplete);
        if (field.defaultValue)
            input.value = String(field.defaultValue);
        if (field.validation) {
            if (field.validation.minLength)
                input.minLength = field.validation.minLength;
            if (field.validation.maxLength)
                input.maxLength = field.validation.maxLength;
            if (field.validation.min)
                input.min = String(field.validation.min);
            if (field.validation.max)
                input.max = String(field.validation.max);
            if (field.validation.pattern &&
                typeof field.validation.pattern === 'string') {
                input.pattern = field.validation.pattern;
            }
        }
        if (field.helpText) {
            input.setAttribute('aria-describedby', `emma-help-${field.id}`);
        }
        input.addEventListener('blur', () => this.validateField(field.id));
        input.addEventListener('input', () => this.clearFieldError(field.id));
        return input;
    }
    renderTextarea(field) {
        const textarea = document.createElement('textarea');
        textarea.id = `emma-field-${field.id}`;
        textarea.name = field.id;
        textarea.className = 'emma-form-textarea';
        if (field.placeholder)
            textarea.placeholder = field.placeholder;
        if (field.required)
            textarea.required = true;
        if (field.rows)
            textarea.rows = field.rows;
        if (field.defaultValue)
            textarea.value = String(field.defaultValue);
        if (field.validation) {
            if (field.validation.minLength)
                textarea.minLength = field.validation.minLength;
            if (field.validation.maxLength)
                textarea.maxLength = field.validation.maxLength;
        }
        if (field.helpText) {
            textarea.setAttribute('aria-describedby', `emma-help-${field.id}`);
        }
        textarea.addEventListener('blur', () => this.validateField(field.id));
        textarea.addEventListener('input', () => this.clearFieldError(field.id));
        return textarea;
    }
    renderSelect(field) {
        var _a;
        const select = document.createElement('select');
        select.id = `emma-field-${field.id}`;
        select.name = field.id;
        select.className = 'emma-form-select';
        if (field.required)
            select.required = true;
        if (!field.required || field.placeholder) {
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = field.placeholder || 'Select an option...';
            placeholder.disabled = true;
            placeholder.selected = true;
            select.appendChild(placeholder);
        }
        (_a = field.options) === null || _a === void 0 ? void 0 : _a.forEach((option) => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            if (option.disabled)
                opt.disabled = true;
            select.appendChild(opt);
        });
        select.addEventListener('change', () => this.validateField(field.id));
        return select;
    }
    renderRadio(field) {
        var _a;
        const container = document.createElement('div');
        container.className = 'emma-form-radio-group';
        container.setAttribute('role', 'radiogroup');
        (_a = field.options) === null || _a === void 0 ? void 0 : _a.forEach((option, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'emma-form-radio-option';
            const input = document.createElement('input');
            input.type = 'radio';
            input.id = `emma-field-${field.id}-${index}`;
            input.name = field.id;
            input.value = option.value;
            input.className = 'emma-form-radio-input';
            if (field.required && index === 0)
                input.required = true;
            const label = document.createElement('label');
            label.htmlFor = `emma-field-${field.id}-${index}`;
            label.className = 'emma-form-radio-label';
            label.textContent = option.label;
            wrapper.appendChild(input);
            wrapper.appendChild(label);
            container.appendChild(wrapper);
            input.addEventListener('change', () => this.validateField(field.id));
        });
        return container;
    }
    renderCheckbox(field) {
        var _a;
        const container = document.createElement('div');
        container.className = 'emma-form-checkbox-group';
        (_a = field.options) === null || _a === void 0 ? void 0 : _a.forEach((option, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'emma-form-checkbox-option';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = `emma-field-${field.id}-${index}`;
            input.name = field.id;
            input.value = option.value;
            input.className = 'emma-form-checkbox-input';
            const label = document.createElement('label');
            label.htmlFor = `emma-field-${field.id}-${index}`;
            label.className = 'emma-form-checkbox-label';
            label.textContent = option.label;
            wrapper.appendChild(input);
            wrapper.appendChild(label);
            container.appendChild(wrapper);
            input.addEventListener('change', () => this.validateField(field.id));
        });
        return container;
    }
    renderHiddenField(field) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = field.id;
        input.value = field.defaultValue ? String(field.defaultValue) : '';
        return input;
    }
    renderHoneypot(fieldName) {
        const wrapper = document.createElement('div');
        wrapper.className = 'emma-form-honeypot';
        wrapper.setAttribute('aria-hidden', 'true');
        wrapper.style.position = 'absolute';
        wrapper.style.left = '-9999px';
        wrapper.style.width = '1px';
        wrapper.style.height = '1px';
        const input = document.createElement('input');
        input.type = 'text';
        input.name = fieldName;
        input.tabIndex = -1;
        input.autocomplete = 'off';
        wrapper.appendChild(input);
        return wrapper;
    }
    renderSubmitButton() {
        var _a;
        const wrapper = document.createElement('div');
        wrapper.className = 'emma-form-submit-wrapper';
        const button = document.createElement('button');
        button.type = 'submit';
        button.className = 'emma-form-submit';
        button.textContent = ((_a = this.schema.settings) === null || _a === void 0 ? void 0 : _a.submitButtonText) || 'Submit';
        wrapper.appendChild(button);
        return wrapper;
    }
    handleSubmit(event) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            event.preventDefault();
            if (!this.form)
                return;
            this.clearMessages();
            const formData = new FormData(this.form);
            const data = {};
            formData.forEach((value, key) => {
                var _a, _b;
                if (key === ((_b = (_a = this.schema.settings) === null || _a === void 0 ? void 0 : _a.honeypot) === null || _b === void 0 ? void 0 : _b.fieldName)) {
                    return;
                }
                if (data[key]) {
                    if (Array.isArray(data[key])) {
                        data[key].push(value);
                    }
                    else {
                        data[key] = [data[key], value];
                    }
                }
                else {
                    data[key] = value;
                }
            });
            const honeypotValue = formData.get(((_b = (_a = this.schema.settings) === null || _a === void 0 ? void 0 : _a.honeypot) === null || _b === void 0 ? void 0 : _b.fieldName) || '');
            if (honeypotValue) {
                this.showMessage('success', (_c = this.schema.settings) === null || _c === void 0 ? void 0 : _c.successMessage);
                return;
            }
            const validation = validateSubmissionData(data, this.schema);
            if (!validation.valid) {
                validation.errors.forEach((error) => {
                    this.showFieldError(error.field, error.message);
                });
                return;
            }
            if (this.options.onSubmit) {
                this.options.onSubmit(data);
                return;
            }
            yield this.submitToAPI(data);
        });
    }
    submitToAPI(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            try {
                const button = (_a = this.form) === null || _a === void 0 ? void 0 : _a.querySelector('.emma-form-submit');
                if (button) {
                    button.setAttribute('disabled', '');
                    button.textContent = 'Submitting...';
                }
                const response = yield fetch(this.schema.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        formId: this.schema.formId,
                        data,
                        meta: {
                            timestamp: new Date().toISOString(),
                            userAgent: navigator.userAgent,
                            referrer: document.referrer,
                        },
                    }),
                });
                const result = (yield response.json());
                if (button) {
                    button.removeAttribute('disabled');
                    button.textContent = ((_b = this.schema.settings) === null || _b === void 0 ? void 0 : _b.submitButtonText) || 'Submit';
                }
                if (result.success) {
                    this.showMessage('success', ((_c = this.schema.settings) === null || _c === void 0 ? void 0 : _c.successMessage) ||
                        'Thank you for your submission!');
                    (_d = this.form) === null || _d === void 0 ? void 0 : _d.reset();
                    if (this.options.onSuccess) {
                        this.options.onSuccess(result);
                    }
                    const redirectUrl = (_e = this.schema.settings) === null || _e === void 0 ? void 0 : _e.redirectUrl;
                    if (redirectUrl) {
                        setTimeout(() => {
                            window.location.href = redirectUrl;
                        }, 2000);
                    }
                }
                else {
                    throw new Error(result.error || 'Submission failed');
                }
            }
            catch (error) {
                const button = (_f = this.form) === null || _f === void 0 ? void 0 : _f.querySelector('.emma-form-submit');
                if (button) {
                    button.removeAttribute('disabled');
                    button.textContent = ((_g = this.schema.settings) === null || _g === void 0 ? void 0 : _g.submitButtonText) || 'Submit';
                }
                this.showMessage('error', ((_h = this.schema.settings) === null || _h === void 0 ? void 0 : _h.errorMessage) ||
                    'Something went wrong. Please try again.');
                if (this.options.onError) {
                    this.options.onError(error);
                }
            }
        });
    }
    validateField(fieldId) {
        var _a;
        const field = this.schema.fields.find((f) => f.id === fieldId);
        if (!field)
            return true;
        const input = (_a = this.form) === null || _a === void 0 ? void 0 : _a.querySelector(`[name="${fieldId}"]`);
        if (!input)
            return true;
        const value = input.value;
        if (field.required && !value) {
            this.showFieldError(fieldId, `${field.label} is required`);
            return false;
        }
        this.clearFieldError(fieldId);
        return true;
    }
    showFieldError(fieldId, message) {
        var _a, _b;
        const errorContainer = document.getElementById(`emma-error-${fieldId}`);
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
        }
        const fieldGroup = (_a = this.form) === null || _a === void 0 ? void 0 : _a.querySelector(`[data-field-id="${fieldId}"]`);
        if (fieldGroup) {
            fieldGroup.classList.add('emma-form-group--error');
        }
        const input = (_b = this.form) === null || _b === void 0 ? void 0 : _b.querySelector(`[name="${fieldId}"]`);
        if (input) {
            input.setAttribute('aria-invalid', 'true');
            input.setAttribute('aria-describedby', `emma-error-${fieldId}`);
        }
    }
    clearFieldError(fieldId) {
        var _a, _b;
        const errorContainer = document.getElementById(`emma-error-${fieldId}`);
        if (errorContainer) {
            errorContainer.textContent = '';
            errorContainer.style.display = 'none';
        }
        const fieldGroup = (_a = this.form) === null || _a === void 0 ? void 0 : _a.querySelector(`[data-field-id="${fieldId}"]`);
        if (fieldGroup) {
            fieldGroup.classList.remove('emma-form-group--error');
        }
        const input = (_b = this.form) === null || _b === void 0 ? void 0 : _b.querySelector(`[name="${fieldId}"]`);
        if (input) {
            input.removeAttribute('aria-invalid');
        }
    }
    showMessage(type, message) {
        var _a;
        const container = (_a = this.form) === null || _a === void 0 ? void 0 : _a.querySelector('.emma-form-messages');
        if (!container || !message)
            return;
        container.className = `emma-form-messages emma-form-messages--${type}`;
        container.textContent = message;
    }
    clearMessages() {
        var _a;
        const container = (_a = this.form) === null || _a === void 0 ? void 0 : _a.querySelector('.emma-form-messages');
        if (container) {
            container.className = 'emma-form-messages';
            container.textContent = '';
        }
        this.schema.fields.forEach((field) => {
            this.clearFieldError(field.id);
        });
    }
}
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
    });
}

export { FormRenderer, FormRenderer as default };
//# sourceMappingURL=emma-forms.esm.js.map
