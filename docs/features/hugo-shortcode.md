# Hugo Shortcode Integration

**Related Documents:**
- [00-mvp-embeddable-forms.md](../00-mvp-embeddable-forms.md)
- [02-technical-architecture.md](../02-technical-architecture.md)

## 1. Overview

The Emma Hugo module provides a simple shortcode that allows Hugo site owners to embed forms into their content with a single line of code.

## 2. Installation

### 2.1 As a Hugo Module (Recommended)

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

### 2.2 As a Git Submodule

```bash
git submodule add https://github.com/yourusername/emma-hugo-module.git themes/emma
```

Add to `hugo.toml`:

```toml
theme = ["emma", "your-existing-theme"]
```

### 2.3 Manual Installation

Copy the shortcode file to your Hugo site:

```bash
cp emma-hugo-module/layouts/shortcodes/embed-form.html layouts/shortcodes/
```

## 3. Configuration

Add Emma configuration to your `hugo.toml`:

```toml
[params.emma]
  # CDN URL where your forms are hosted
  cdnUrl = "https://forms.yourdomain.com"
  
  # Optional: Default CSS class for all forms
  defaultClass = "emma-form"
  
  # Optional: Enable loading indicator
  showLoadingIndicator = true
  
  # Optional: Custom fallback message when JS is disabled
  noJsFallback = "This form requires JavaScript. Please enable it or contact us at support@example.com"
```

## 4. Shortcode Implementation

### 4.1 Basic Shortcode

File: `layouts/shortcodes/embed-form.html`

```html
{{- /* 
  Emma Form Embed Shortcode
  Usage: {{< embed-form "form-id" >}}
  
  Parameters:
    - First positional argument: formId (required)
    - class: Additional CSS classes
    - loading: Custom loading message
*/ -}}

{{- $formId := .Get 0 -}}
{{- $class := .Get "class" | default "" -}}
{{- $cdnUrl := site.Params.emma.cdnUrl | default "https://forms.example.com" -}}
{{- $defaultClass := site.Params.emma.defaultClass | default "emma-form" -}}
{{- $showLoading := site.Params.emma.showLoadingIndicator | default true -}}
{{- $noJsFallback := site.Params.emma.noJsFallback | default "This form requires JavaScript to function." -}}
{{- $customLoading := .Get "loading" -}}

{{- if not $formId -}}
  {{- errorf "The 'embed-form' shortcode requires a formId as the first parameter. Usage: {{< embed-form \"your-form-id\" >}}" -}}
{{- end -}}

<div class="emma-form-wrapper {{ $defaultClass }} {{ $class }}" data-emma-form-wrapper="{{ $formId }}">
  {{- if $showLoading -}}
  <div class="emma-form-loading" data-emma-loading="{{ $formId }}">
    <div class="emma-spinner"></div>
    <p>{{ $customLoading | default "Loading form..." }}</p>
  </div>
  {{- end -}}
  
  <div 
    id="embeddable-form-{{ $formId }}" 
    class="emma-form-container"
    data-form-id="{{ $formId }}"
    data-cdn-url="{{ $cdnUrl }}"
  ></div>
  
  <noscript>
    <div class="emma-form-noscript">
      <p>{{ $noJsFallback }}</p>
    </div>
  </noscript>
</div>

<script 
  src="{{ $cdnUrl }}/{{ $formId }}.js" 
  async 
  defer
  data-emma-form="{{ $formId }}"
  {{- if $showLoading }}
  onload="document.querySelector('[data-emma-loading=\'{{ $formId }}\']')?.remove()"
  onerror="document.querySelector('[data-emma-loading=\'{{ $formId }}\']')?.remove()"
  {{- end }}
></script>

{{- /* Include base styles if not already included */ -}}
{{- if not (.Page.Scratch.Get "emma-styles-loaded") -}}
  {{- .Page.Scratch.Set "emma-styles-loaded" true -}}
  <style>
    .emma-form-wrapper {
      margin: 2rem 0;
    }
    
    .emma-form-loading {
      text-align: center;
      padding: 2rem;
      color: #666;
    }
    
    .emma-spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: emma-spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    @keyframes emma-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .emma-form-noscript {
      padding: 1.5rem;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      color: #856404;
    }
    
    .emma-form-container {
      min-height: 200px;
    }
  </style>
{{- end -}}
```

## 5. Usage Examples

### 5.1 Basic Usage

```markdown
---
title: Contact Us
---

# Get in Touch

{{< embed-form "contact-form-001" >}}
```

### 5.2 With Custom CSS Class

```markdown
{{< embed-form "newsletter-signup" class="my-custom-form sidebar-form" >}}
```

### 5.3 With Custom Loading Message

```markdown
{{< embed-form "survey-form" loading="Preparing survey..." >}}
```

### 5.4 Multiple Forms on One Page

```markdown
# Contact Information

{{< embed-form "contact-form-001" >}}

## Newsletter

Subscribe to our newsletter for updates.

{{< embed-form "newsletter-signup" class="inline-form" >}}
```

## 6. Styling

### 6.1 Default Styles

The shortcode includes minimal default styles. Form-specific styling comes from the form's theme.

### 6.2 Custom Styling

Override Emma styles in your Hugo theme CSS:

```css
/* assets/css/custom.css */

/* Form wrapper */
.emma-form-wrapper {
  max-width: 600px;
  margin: 3rem auto;
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 8px;
}

/* Loading state */
.emma-form-loading {
  font-family: 'Your Font', sans-serif;
}

.emma-spinner {
  border-top-color: var(--primary-color);
}

/* Form container */
.emma-form-container {
  background: white;
  padding: 1rem;
}

/* NoScript fallback */
.emma-form-noscript {
  /* Your custom styles */
}
```

### 6.3 Per-Form Styling

Use the `class` parameter for form-specific styles:

```markdown
{{< embed-form "contact-form" class="hero-form" >}}
```

```css
.hero-form .emma-form-container {
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  border-radius: 12px;
}
```

## 7. Advanced Features

### 7.1 Conditional Rendering

Only show form on certain pages:

```html
{{- if .Params.showContactForm -}}
  {{< embed-form "contact-form-001" >}}
{{- end -}}
```

### 7.2 Dynamic Form Selection

Choose form based on page type:

```html
{{- $formId := cond (eq .Type "product") "product-inquiry" "general-contact" -}}
{{< embed-form $formId >}}
```

### 7.3 Localization

Different forms for different languages:

```html
{{- $formId := "" -}}
{{- if eq .Site.Language.Lang "en" -}}
  {{- $formId = "contact-en" -}}
{{- else if eq .Site.Language.Lang "es" -}}
  {{- $formId = "contact-es" -}}
{{- end -}}
{{< embed-form $formId >}}
```

## 8. Troubleshooting

### 8.1 Form Not Appearing

**Check:**
1. Form ID is correct
2. CDN URL is configured in `hugo.toml`
3. Form is deployed to R2
4. Browser console for JavaScript errors
5. Network tab shows successful JS file load

### 8.2 Script Loading Errors

```html
<!-- Add error handling -->
<script>
window.addEventListener('error', function(e) {
  if (e.filename && e.filename.includes('emma')) {
    console.error('Emma form failed to load:', e.message);
    document.querySelector('[data-emma-form-wrapper]').innerHTML = 
      '<p style="color: red;">Form could not be loaded. Please refresh the page.</p>';
  }
}, true);
</script>
```

### 8.3 CORS Issues

Ensure your CDN worker includes CORS headers:

```typescript
headers.set('Access-Control-Allow-Origin', '*');
headers.set('Access-Control-Allow-Methods', 'GET');
```

## 9. Performance Optimization

### 9.1 Lazy Loading

Load forms only when they scroll into view:

```html
<div 
  id="embeddable-form-{{ $formId }}"
  data-form-lazy="{{ $formId }}"
  data-cdn-url="{{ $cdnUrl }}"
></div>

<script>
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const formId = entry.target.dataset.formLazy;
        const cdnUrl = entry.target.dataset.cdnUrl;
        const script = document.createElement('script');
        script.src = `${cdnUrl}/${formId}.js`;
        script.async = true;
        document.head.appendChild(script);
        observer.unobserve(entry.target);
      }
    });
  });
  
  document.querySelectorAll('[data-form-lazy]').forEach(el => {
    observer.observe(el);
  });
}
</script>
```

### 9.2 Preloading

For forms above the fold:

```html
<link rel="preload" as="script" href="{{ $cdnUrl }}/{{ $formId }}.js">
```

## 10. Testing

### 10.1 Manual Testing Checklist

- [ ] Form renders correctly
- [ ] Form submits successfully
- [ ] Validation errors display properly
- [ ] Success message appears
- [ ] NoScript fallback shows when JS disabled
- [ ] Loading indicator appears and disappears
- [ ] Multiple forms on one page work independently
- [ ] Mobile responsive
- [ ] Keyboard navigation works

### 10.2 Automated Testing

```bash
# Test Hugo build with forms
hugo --config hugo.toml --verbose

# Check for shortcode errors
hugo --printI18nWarnings --printPathWarnings
```

## 11. Migration Guide

### 11.1 From Other Form Solutions

**From Formspree:**
```markdown
<!-- Before -->
<form action="https://formspree.io/f/xyz">
  <!-- fields -->
</form>

<!-- After -->
{{< embed-form "contact-form-001" >}}
```

**From Netlify Forms:**
```markdown
<!-- Before -->
<form name="contact" netlify>
  <!-- fields -->
</form>

<!-- After -->
{{< embed-form "contact-form-001" >}}
```

## 12. Best Practices

1. **Use meaningful form IDs**: `contact-form-001` not `form-1`
2. **Test forms after Hugo builds**: Ensure shortcode renders correctly
3. **Monitor form load times**: Keep JS bundles under 15KB
4. **Provide fallback content**: Good NoScript messages
5. **Style consistently**: Match your site's design
6. **Version your forms**: Use versioning in form IDs if needed

---

**Next:** Begin implementing the Form Builder TUI.
