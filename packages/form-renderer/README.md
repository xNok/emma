# Emma Form Renderer

Client-side JavaScript library that renders forms and handles submissions.

## Overview

The Form Renderer is a lightweight, framework-agnostic JavaScript library that:

- Renders forms from schema definitions
- Handles client-side validation
- Submits data via AJAX
- Displays success/error messages
- Applies themes

## Bundle Size

Target: < 15KB gzipped

## Usage

Forms are automatically rendered when embedded via the Hugo shortcode. The renderer is bundled with each form.

## Development

```bash
npm install
npm run dev
npm run build
```

## Theme Development

Create custom themes in `/themes`:

```css
/* themes/minimal.css */
.emma-form {
  /* Your styles */
}
```

## Technology

- TypeScript
- Vanilla JavaScript (no framework)
- Rollup or esbuild for bundling
- PostCSS for CSS processing

## Documentation

See [/docs/02-technical-architecture.md](../../docs/02-technical-architecture.md) for detailed architecture.
