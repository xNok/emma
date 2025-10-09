# Hugo Integration

Learn how to embed Emma forms in your Hugo website.

## Installation

### Method 1: Hugo Module (Recommended)

Add to your `hugo.toml`:

```toml
[module]
  [[module.imports]]
    path = "github.com/yourusername/emma-hugo-module"
```

Then run:

```bash
hugo mod get -u
```

### Method 2: Git Submodule

```bash
git submodule add https://github.com/yourusername/emma-hugo-module.git themes/emma
```

Add to `hugo.toml`:

```toml
theme = ["emma", "your-existing-theme"]
```

### Method 3: Manual Installation

Copy the shortcode file:

```bash
cp emma-hugo-module/layouts/shortcodes/embed-form.html layouts/shortcodes/
```

---

## Configuration

Add Emma configuration to your `hugo.toml`:

```toml
[params.emma]
  # Required: CDN URL where your forms are hosted
  cdnUrl = "https://forms.yourdomain.com"

  # Optional: Default CSS class for all forms
  defaultClass = "emma-form"

  # Optional: Show loading indicator while form loads
  showLoadingIndicator = true

  # Optional: Fallback message when JavaScript is disabled
  noJsFallback = "This form requires JavaScript. Please enable it or contact us at support@example.com"
```

---

## Basic Usage

### Simple Embed

Add a form to any content file:

```markdown
---
title: Contact Us
---

# Get in Touch

We'd love to hear from you!

{{< embed-form "contact-form-001" >}}
```

### With Custom CSS Class

```markdown
{{< embed-form "newsletter-signup" class="sidebar-form" >}}
```

### With Custom Loading Message

```markdown
{{< embed-form "survey-form" loading="Loading survey..." >}}
```

---

## Multiple Forms

You can embed multiple forms on the same page:

```markdown
# Contact Information

Fill out our contact form:

{{< embed-form "contact-form-001" >}}

## Subscribe to Newsletter

Stay updated with our latest news:

{{< embed-form "newsletter-signup" class="inline-form" >}}
```

Each form operates independently with its own state and validation.

---

## Styling

### Default Styles

The shortcode includes minimal default styles:

- Loading spinner
- NoScript fallback styling
- Basic container layout

Form-specific styling comes from the form's theme (defined in form schema).

### Custom Styling

Override Emma styles in your Hugo theme:

```css
/* assets/css/custom.css or static/css/custom.css */

/* Form wrapper */
.emma-form-wrapper {
  max-width: 600px;
  margin: 3rem auto;
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 8px;
}

/* Loading indicator */
.emma-form-loading {
  color: #666;
}

.emma-spinner {
  border-top-color: #3b82f6;
}

/* NoScript fallback */
.emma-form-noscript {
  background: #fff3cd;
  padding: 1rem;
}
```

### Per-Form Styling

Use the `class` parameter:

```markdown
{{< embed-form "contact-form" class="hero-form" >}}
```

```css
.hero-form .emma-form-container {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}
```

---

## Advanced Usage

### Conditional Rendering

Only show form on certain pages:

```html
<!-- layouts/partials/contact-form.html -->
{{- if .Params.showContactForm -}} {{< embed-form "contact-form-001" >}} {{- end
-}}
```

In your content:

```yaml
---
title: Contact
showContactForm: true
---
```

### Dynamic Form Selection

Choose form based on page type or parameters:

```html
{{- $formId := "default-contact" -}} {{- if eq .Type "product" -}} {{- $formId =
"product-inquiry" -}} {{- else if eq .Type "support" -}} {{- $formId =
"support-request" -}} {{- end -}} {{< embed-form $formId >}}
```

### Localization

Different forms for different languages:

```html
{{- $formId := "" -}} {{- if eq .Site.Language.Lang "en" -}} {{- $formId =
"contact-en" -}} {{- else if eq .Site.Language.Lang "es" -}} {{- $formId =
"contact-es" -}} {{- else if eq .Site.Language.Lang "fr" -}} {{- $formId =
"contact-fr" -}} {{- end -}} {{< embed-form $formId >}}
```

---

## Performance Optimization

### Lazy Loading

Load forms only when they scroll into viewport:

```html
<!-- Custom lazy-load wrapper -->
<div id="form-container" data-lazy-form="contact-form-001"></div>

<script>
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const formId = entry.target.dataset.lazyForm;
          // Inject shortcode content here
          observer.unobserve(entry.target);
        }
      });
    });

    document.querySelectorAll('[data-lazy-form]').forEach((el) => {
      observer.observe(el);
    });
  }
</script>
```

### Preloading

For forms above the fold, add preload hint:

```html
<link
  rel="preload"
  as="script"
  href="https://forms.yourdomain.com/contact-form-001.js"
/>

{{< embed-form "contact-form-001" >}}
```

---

## Troubleshooting

### Form Not Appearing

**Check:**

1. Form ID is correct
2. CDN URL is configured in `hugo.toml`
3. Form is deployed to R2
4. Browser console for JavaScript errors
5. Network tab shows successful JS file load

**Solution:**

```bash
# Verify form exists
curl -I https://forms.yourdomain.com/contact-form-001.js

# Check Hugo config
hugo config | grep emma

# Rebuild Hugo site
hugo --cleanDestinationDir
```

### Script Loading Errors

Add error handling:

```html
<script>
  window.addEventListener(
    'error',
    function (e) {
      if (e.filename && e.filename.includes('forms.yourdomain.com')) {
        console.error('Emma form failed to load:', e.message);
        const container = document.querySelector('[data-emma-form-wrapper]');
        if (container) {
          container.innerHTML =
            '<p style="color: red;">Form could not be loaded. Please refresh the page or contact us directly.</p>';
        }
      }
    },
    true
  );
</script>
```

### CORS Issues

Ensure your CDN worker includes CORS headers:

```typescript
// In R2 proxy worker
headers.set('Access-Control-Allow-Origin', '*');
headers.set('Access-Control-Allow-Methods', 'GET');
```

### Styling Conflicts

If your theme's styles conflict:

```css
/* Scope Emma styles */
.emma-form-wrapper {
  all: initial; /* Reset all styles */
  * {
    all: unset;
  }
}

/* Then reapply Emma styles */
```

---

## Testing

### Manual Testing Checklist

- [ ] Form renders correctly
- [ ] Form submits successfully
- [ ] Validation errors display properly
- [ ] Success message appears
- [ ] NoScript fallback shows when JS disabled
- [ ] Loading indicator appears and disappears
- [ ] Multiple forms on one page work independently
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Works in different browsers

### Automated Testing

```bash
# Build Hugo site with forms
hugo --config hugo.toml --verbose

# Check for shortcode errors
hugo --printI18nWarnings --printPathWarnings

# Serve locally and test
hugo server
```

---

## Examples

### Contact Page

```markdown
---
title: Contact Us
description: Get in touch with our team
---

# Contact Us

Have a question? We're here to help!

{{< embed-form "contact-form-001" >}}

Or reach us at: support@example.com
```

### Newsletter Sidebar

```html
<!-- layouts/partials/sidebar.html -->
<aside class="sidebar">
  <h3>Subscribe to Newsletter</h3>
  <p>Get weekly updates delivered to your inbox.</p>

  {{< embed-form "newsletter-signup" class="sidebar-form compact" >}}
</aside>
```

### Multi-Step Form Page

```markdown
---
title: Product Inquiry
layout: form-page
---

{{< embed-form "product-inquiry-step-1" >}}
```

---

## Best Practices

1. **Use meaningful form IDs** - `contact-form` not `form-1`
2. **Test forms after Hugo builds** - Ensure shortcodes render correctly
3. **Monitor form load times** - Keep JS bundles under 15KB
4. **Provide fallback content** - Good NoScript messages
5. **Style consistently** - Match your site's design
6. **Version your forms** - Use versioning in form IDs if needed

---

## Next Steps

- Learn about [Themes & Styling](./themes.md)
- Review [Field Types](./field-types.md)
- See [Troubleshooting Guide](./troubleshooting.md)
