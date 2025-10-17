---
title: "Hugo Integration"
weight: 6
---

Emma provides a Hugo shortcode to easily embed your forms into a Hugo website.

## Configure Your Hugo Site

In your Hugo site's configuration file (`config.toml` or `hugo.toml`), add the following lines to the `params` section:

```toml
[params]
  emmaCdnUrl = "your-r2-public-url"
```

Replace `your-r2-public-url` with the public URL of your R2 bucket.

## Use the Shortcode

To embed a form, use the `embed-form` shortcode in your Markdown content, passing the form ID as a parameter.

```
{{</* embed-form "my-contact-form" */>}}
```

This will render the form in your Hugo site, using the assets from your R2 bucket.