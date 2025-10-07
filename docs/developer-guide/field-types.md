# Field Types

Emma supports 13 different field types for building forms.

## Text-Based Fields

### text
Single-line text input.

```yaml
- id: name
  type: text
  label: "Name"
  placeholder: "John Doe"
  required: true
  validation:
    minLength: 2
    maxLength: 100
```

**Attributes:**
- `minLength`, `maxLength` - Length constraints
- `pattern` - Regex pattern
- `autocomplete` - Browser autocomplete hint

**Use cases:** Names, titles, short text

---

### email
Email address input with validation.

```yaml
- id: email
  type: email
  label: "Email Address"
  required: true
  validation:
    pattern: "email"
```

**Validation:** Automatically validates email format
**Use cases:** Email addresses, contact information

---

### tel
Telephone number input.

```yaml
- id: phone
  type: tel
  label: "Phone Number"
  placeholder: "+1 (555) 123-4567"
  validation:
    pattern: "tel"
```

**Use cases:** Phone numbers, contact details

---

### url
Website URL input with validation.

```yaml
- id: website
  type: url
  label: "Website"
  placeholder: "https://example.com"
  validation:
    pattern: "url"
```

**Validation:** Ensures valid URL format
**Use cases:** Website addresses, links

---

### textarea
Multi-line text input.

```yaml
- id: message
  type: textarea
  label: "Message"
  rows: 6
  required: true
  validation:
    minLength: 10
    maxLength: 5000
```

**Attributes:**
- `rows` - Number of visible rows
- `minLength`, `maxLength` - Length constraints

**Use cases:** Messages, descriptions, comments, feedback

---

### number
Numeric input.

```yaml
- id: age
  type: number
  label: "Age"
  required: true
  validation:
    min: 18
    max: 120
```

**Attributes:**
- `min`, `max` - Number range
- `step` - Increment step (future)

**Use cases:** Ages, quantities, ratings

---

## Selection Fields

### select
Dropdown menu.

```yaml
- id: country
  type: select
  label: "Country"
  required: true
  placeholder: "Select a country..."
  options:
    - value: "us"
      label: "United States"
    - value: "ca"
      label: "Canada"
    - value: "uk"
      label: "United Kingdom"
```

**Attributes:**
- `options` - Array of {value, label, disabled?}
- `placeholder` - Shown when nothing selected

**Use cases:** Countries, categories, single-choice selections

---

### radio
Radio button group (single selection).

```yaml
- id: priority
  type: radio
  label: "Priority Level"
  required: true
  options:
    - value: "low"
      label: "Low"
    - value: "medium"
      label: "Medium"
    - value: "high"
      label: "High"
```

**Attributes:**
- `options` - Array of {value, label, disabled?}

**Use cases:** Priorities, preferences, ratings, yes/no questions

---

### checkbox
Checkbox group (multiple selection).

```yaml
- id: interests
  type: checkbox
  label: "Interests"
  required: false
  options:
    - value: "tech"
      label: "Technology"
    - value: "design"
      label: "Design"
    - value: "business"
      label: "Business"
```

**Attributes:**
- `options` - Array of {value, label, disabled?}

**Submission format:** Array of selected values
**Use cases:** Multiple selections, features, topics of interest

---

## Date & Time Fields

### date
Date picker.

```yaml
- id: birthdate
  type: date
  label: "Date of Birth"
  required: true
  validation:
    min: "1900-01-01"
    max: "2025-12-31"
```

**Format:** YYYY-MM-DD
**Use cases:** Birthdates, event dates, deadlines

---

### time
Time picker.

```yaml
- id: appointment
  type: time
  label: "Preferred Time"
  required: true
```

**Format:** HH:MM (24-hour)
**Use cases:** Appointment times, schedule preferences

---

### datetime-local
Combined date and time picker.

```yaml
- id: event_time
  type: datetime-local
  label: "Event Date & Time"
  required: true
```

**Format:** YYYY-MM-DDTHH:MM
**Use cases:** Event scheduling, timestamps

---

## Special Fields

### hidden
Hidden field (not visible to users).

```yaml
- id: source
  type: hidden
  defaultValue: "website"
```

**Use cases:** Tracking, UTM parameters, form variants

---

## Field Options

### Options Array
For select, radio, and checkbox fields:

```yaml
options:
  - value: "internal-id"      # Value submitted to API
    label: "User-Visible Text" # Text shown to user
    disabled: false           # Optional: disable this option
```

**Example:**
```yaml
options:
  - value: "1"
    label: "Very Dissatisfied"
  - value: "2"
    label: "Dissatisfied"
  - value: "3"
    label: "Neutral"
  - value: "4"
    label: "Satisfied"
  - value: "5"
    label: "Very Satisfied"
```

## Validation

Each field type supports different validation rules:

| Field Type | Supported Validation |
|------------|---------------------|
| text, email, tel, url | required, minLength, maxLength, pattern |
| textarea | required, minLength, maxLength |
| number | required, min, max |
| select, radio | required |
| checkbox | required (at least one) |
| date, time, datetime-local | required, min, max |
| hidden | (none) |

See [Validation](./validation.md) for detailed rules.

## Autocomplete

HTML5 autocomplete values for better UX:

```yaml
- id: email
  type: email
  autocomplete: "email"

- id: name
  type: text
  autocomplete: "name"

- id: address
  type: text
  autocomplete: "street-address"
```

Common values:
- `name`, `given-name`, `family-name`
- `email`
- `tel`, `tel-national`
- `street-address`, `address-line1`, `address-line2`
- `country`, `postal-code`
- `organization`, `organization-title`

## Best Practices

### Choosing Field Types
- Use specific types (email, tel, url) instead of text
- Use select for < 10 options, radio for 2-5 options
- Use checkbox for multi-select, radio for single-select
- Use textarea for > 100 characters of text

### Required Fields
- Mark only essential fields as required
- Provide clear indication (* asterisk)
- Validate on submit, not on blur for required fields

### Placeholders
- Use as hints, not as labels
- Show example format: "+1 (555) 123-4567"
- Keep them short

### Help Text
- Use for clarification, not instructions
- Place below the label
- Keep to one sentence

### Option Labels
- Be clear and specific
- Use parallel structure
- Avoid negatives in labels

## Examples

See complete field examples in:
- [/examples/contact-form.yaml](../../examples/contact-form.yaml)
- [/examples/survey.yaml](../../examples/survey.yaml)
- [/examples/newsletter.yaml](../../examples/newsletter.yaml)

## Next Steps

- Learn about [Validation](./validation.md)
- Understand [Form Schemas](./form-schemas.md)
- Review [API Reference](./api-reference.md)
