---
title: "Full Workflow Tutorial"
weight: 5
---

This tutorial will walk you through the entire process of creating and deploying a form with Emma.

## Step 1: Initialize Your Project

First, run `emma init` to configure your project and deploy the necessary infrastructure to Cloudflare.

```bash
emma init
```

## Step 2: Create a Form

Next, create a new form using the `emma create` command. This will open an interactive prompt where you can define the fields for your form.

```bash
emma create my-contact-form
```

## Step 3: Preview Your Form

Before deploying, you can preview your form locally using the `emma preview` command.

```bash
emma preview my-contact-form
```

This will start a local server, and you can view your form in a web browser.

## Step 4: Deploy Your Form

Once you are satisfied with your form, deploy it to Cloudflare using the `emma deploy` command.

```bash
emma deploy my-contact-form --target=cloudflare
```

This will upload your form assets to R2 and make your form available at a public URL. The CLI will output the URL of your deployed form.