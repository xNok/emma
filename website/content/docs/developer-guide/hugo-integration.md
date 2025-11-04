---
title: 'Hugo Integration'
weight: 6
---

Emma provides a Hugo shortcode to easily embed your forms into a Hugo website.

## Configure Your Hugo Site

In your Hugo site's configuration file (`config.toml` or `hugo.toml`), add the following lines to the `params` section:

```toml
[params]
  emmaCdnUrl = "your-r2-public-url"
```

Replace `your-r2-public-url` with the public URL of your R2 bucket (or deployment provider URL).

## Basic Usage

### Simple Embed

To embed a form, use the `embed-form` shortcode in your Markdown content, passing the form ID as a parameter:

```markdown
{{</* embed-form "my-contact-form" */>}}
```

This will render the form in your Hugo site, using the assets from your deployment provider.

### With Custom CSS Class

```markdown
{{</* embed-form "newsletter-signup" class="sidebar-form" */>}}
```

### Multiple Forms

You can embed multiple forms on the same page. Each form operates independently:

```markdown
# Contact Information

{{</* embed-form "contact-form-001" */>}}

## Subscribe to Newsletter

{{</* embed-form "newsletter-signup" class="inline-form" */>}}
```

## Troubleshooting

### Form Not Appearing

**Check:**

1. Form ID is correct (`emma list` to verify)
2. CDN URL is configured in `hugo.toml`
3. Form is deployed (`emma deploy <form-id>`)
4. Browser console for JavaScript errors
5. Network tab shows successful JS file load

**Solution:**

```bash
# Verify form exists
curl -I https://your-cdn-url/your-form-id.js

# Rebuild Hugo site
hugo --cleanDestinationDir

# Serve locally and test
hugo server
```

### Script Loading Errors

- Ensure CORS headers are properly configured on your deployment provider
- Verify the CDN URL in your Hugo config matches your deployment URL
- Check that the form bundle was successfully deployed

## Next Steps

- Learn about [Form Schema Versioning](./form-schema-versioning.md)
- Configure [Authentication](./authentication.md) for your API
- Set up [Cloudflare](./cloudflare-setup.md) for production deployment
