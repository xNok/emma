# Form Schemas

Form schemas define the structure, fields, and behavior of your forms. They are written in YAML format for readability.

## Basic Structure

```yaml
formId: unique-form-id # Unique identifier
name: 'Form Display Name' # Human-readable name
version: '1.0.0' # Schema version
theme: 'default' # Theme name (default or minimal)
apiEndpoint: 'https://api.example.com/submit' # Submission endpoint

fields:
  - id: fieldName # Unique field ID
    type: text # Field type
    label: 'Field Label' # Display label
    required: true # Required flag
    validation: # Validation rules
      minLength: 2
      maxLength: 100

settings:
  submitButtonText: 'Submit' # Button text
  successMessage: 'Thank you!' # Success message
  errorMessage: 'Error!' # Error message
  honeypot: # Spam protection
    enabled: true
    fieldName: 'website'
```

## Schema Properties

### Top-Level Properties

| Property      | Type   | Required | Description                |
| ------------- | ------ | -------- | -------------------------- |
| `formId`      | string | Yes      | Unique form identifier     |
| `name`        | string | Yes      | Human-readable form name   |
| `version`     | string | Yes      | Schema version (semver)    |
| `theme`       | string | Yes      | Theme name                 |
| `apiEndpoint` | string | Yes      | API endpoint URL           |
| `fields`      | array  | Yes      | Array of field definitions |
| `settings`    | object | No       | Form settings              |

### Field Properties

| Property       | Type      | Required | Description                                      |
| -------------- | --------- | -------- | ------------------------------------------------ |
| `id`           | string    | Yes      | Unique field identifier                          |
| `type`         | FieldType | Yes      | Field type (see [Field Types](./field-types.md)) |
| `label`        | string    | Yes      | Display label                                    |
| `placeholder`  | string    | No       | Placeholder text                                 |
| `required`     | boolean   | No       | Whether field is required                        |
| `validation`   | object    | No       | Validation rules                                 |
| `options`      | array     | No       | Options (for select/radio/checkbox)              |
| `rows`         | number    | No       | Rows (for textarea)                              |
| `defaultValue` | string    | No       | Default value                                    |
| `helpText`     | string    | No       | Help text below label                            |
| `autocomplete` | string    | No       | HTML autocomplete attribute                      |

### Settings Properties

| Property           | Type    | Required | Description                            |
| ------------------ | ------- | -------- | -------------------------------------- |
| `submitButtonText` | string  | No       | Submit button text (default: "Submit") |
| `successMessage`   | string  | No       | Success message                        |
| `errorMessage`     | string  | No       | Error message                          |
| `honeypot`         | object  | No       | Honeypot spam protection               |
| `reCaptcha`        | object  | No       | reCAPTCHA configuration (future)       |
| `doubleOptIn`      | boolean | No       | Require email confirmation             |
| `redirectUrl`      | string  | No       | Redirect after success                 |

## Complete Example

```yaml
formId: contact-form-001
name: 'Contact Form'
version: '1.0.0'
theme: 'default'
apiEndpoint: 'https://api.example.com/submit'

fields:
  # Text input
  - id: name
    type: text
    label: 'Your Name'
    placeholder: 'John Doe'
    required: true
    autocomplete: 'name'
    validation:
      minLength: 2
      maxLength: 100
    helpText: 'Please enter your full name'

  # Email input
  - id: email
    type: email
    label: 'Email Address'
    placeholder: 'john@example.com'
    required: true
    autocomplete: 'email'
    validation:
      pattern: 'email'

  # Textarea
  - id: message
    type: textarea
    label: 'Message'
    placeholder: 'Your message here...'
    required: true
    rows: 6
    validation:
      minLength: 10
      maxLength: 5000

  # Select dropdown
  - id: subject
    type: select
    label: 'Subject'
    required: true
    options:
      - value: 'general'
        label: 'General Inquiry'
      - value: 'support'
        label: 'Technical Support'
      - value: 'billing'
        label: 'Billing Question'

  # Radio buttons
  - id: priority
    type: radio
    label: 'Priority'
    required: false
    options:
      - value: 'low'
        label: 'Low'
      - value: 'medium'
        label: 'Medium'
      - value: 'high'
        label: 'High'

settings:
  submitButtonText: 'Send Message'
  successMessage: "Thank you! We'll get back to you soon."
  errorMessage: 'Something went wrong. Please try again.'
  honeypot:
    enabled: true
    fieldName: 'website'
  redirectUrl: '/thank-you'
```

## Validation Rules

See [Validation](./validation.md) for detailed validation rule documentation.

## Best Practices

### Form IDs

- Use descriptive, kebab-case names: `contact-form`, `newsletter-signup`
- Include version or variant if needed: `contact-form-v2`, `contact-form-sidebar`
- Keep them unique across your project

### Field IDs

- Use lowercase, descriptive names: `email`, `first_name`, `phone_number`
- Avoid special characters except underscore
- Match common autocomplete values when possible

### Labels

- Be clear and concise
- Use title case: "Email Address" not "email address"
- Avoid technical jargon

### Validation

- Only validate what's necessary
- Provide clear error messages
- Use appropriate field types (email for emails, not text)

### Help Text

- Use for clarification, not instructions
- Keep it short (one sentence)
- Example: "We'll never share your email" not "Please enter a valid email address in the format user@domain.com"

## Schema Validation

Schemas are validated when:

1. Building forms (Form Builder TUI)
2. Receiving submissions (API Worker)

Invalid schemas will be rejected with detailed error messages.

## Versioning

Use semantic versioning for schemas:

- **Major**: Breaking changes to field structure
- **Minor**: New optional fields
- **Patch**: Fixes, text changes, validation tweaks

Example: `1.0.0` → `1.1.0` (added optional field) → `2.0.0` (removed required field)

## Next Steps

- Learn about [Field Types](./field-types.md)
- Understand [Validation Rules](./validation.md)
- See [Example Forms](../../examples/)
