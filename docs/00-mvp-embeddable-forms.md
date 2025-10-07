# MVP Plan: Embeddable Forms System for Hugo

## 1. Overview

The goal is to create a system that allows a user to build a form, deploy it as a static JavaScript asset to a CDN (like Cloudflare), and easily embed it into any Hugo website using a simple Form ID. The system will also handle collecting and storing the form submissions securely.

## 2. System Architecture

This system can be broken down into three core components:

  * **Form Builder & Deployment Service**: For the first iteration, this will be a Terminal User Interface (TUI) where users can define a form schema (fields), apply a theme for formatting, and deploy the form.
  * **Data Collection API**: A serverless API endpoint that receives the data submitted from the embedded forms and saves it to a database.
  * **Hugo Module**: A simple Hugo shortcode or partial that users add to their website. It takes a formId and generates the necessary HTML and script tags to render the form.

Here's a visual representation of how they interact:

```mermaid
graph TD
    subgraph User's Hugo Website
        A[Hugo Shortcode <br> `{{< embed-form "formId-123" >}}`] --> B{Renders HTML Placeholder & Script Tag};
        B --> C[Visitor sees & submits form];
    end

    subgraph Your Service Infrastructure (Cloudflare)
        D(Form Builder TUI) -- Generates & Deploys --> E[Static JS Asset <br> `formId-123.js`];
        C -- POST Request --> F(Data Collection API <br> Cloudflare Worker);
        F -- Saves Data --> G[(Database <br> Cloudflare D1)];
    end

    B -- Fetches --> E;

    style D fill:#cde4ff,stroke:#6a8ebf
    style F fill:#d5f4e6,stroke:#82ca9d
```

## 3. Component Breakdown & Tasks

### Part 1: Form Builder & Deployment Tooling (TUI First)

This is the command-line application for creating and deploying the forms.

#### Requirements:

* A TUI to define form schemas (fields, types, labels) in a structured format like YAML or JSON.
* Ability to apply a pre-defined theme (CSS) to the form during the build process.
* Automatically generate a unique formId for each new form.
* Upon publishing, it must compile the form's structure, styling, and logic into a single JavaScript file (e.g., [formId].js).
* This JS file should be automatically uploaded/deployed to a static asset host like Cloudflare R2.

#### Tasks:

* [ ] TUI: Define a clear JSON/YAML schema for form definitions (fields, validation rules, formId).
* [ ] TUI: Design and build the command-line tool for creating and managing these form definition files.
* [ ] TUI: Implement a publish command that:

  * Reads a local form definition file.
  * Generates the JavaScript embed code as a string, injecting the chosen theme.
  * Uses the Cloudflare API to upload this file to R2 or a Pages project.
* [ ] DevOps: Set up the Cloudflare R2 bucket or Pages project to serve the JavaScript files.
* [ ] Theming: Create a few default CSS themes that can be applied to the forms.

### Part 2: Data Collection API
This is the backend service that listens for form submissions. Using a serverless function is perfect for this.

#### Requirements:

* A serverless API endpoint (e.g., https://api.your-domain.com/submit/:formId).
* It must accept POST requests with a JSON payload.
* It needs to validate the incoming data against the expected form structure.
* It should include basic anti-spam measures (e.g., a honeypot field).
* Submissions must be saved to a database, associated with their `formId`.

Tasks:

* [ ] API: Write a Cloudflare Worker that handles the /submit/:formId route.
* [ ] API: Implement data validation logic inside the worker. Reject requests that don't match the form's expected fields.
* [ ] API: Add a "honeypot" field in the form JS. If the worker receives a submission with this field filled out (by a bot), reject it.
* [ ] Database: Set up a Cloudflare D1 database with a table for submissions (submissionId, formId, data, timestamp).
* [ ] API: Write the logic in the worker to insert validated submissions into the D1 database.

### Part 3: Hugo Module

This is the simple integration piece for the end-user.

#### Requirements:

A Hugo shortcode that is easy for users to add to their markdown files.

The shortcode must accept the formId as its only parameter.

It should render a placeholder <div> and the <script> tag pointing to the correct asset URL on your CDN.

#### Tasks:

* [ ] Hugo: Create a new file: /layouts/shortcodes/embed-form.html.
* [ ] Hugo: Add the following Go template code to the file:

```html
{{- $formId := .Get 0 -}}
{{- if $formId -}}
<div id="embeddable-form-{{ $formId }}"></div>
<script src="[https://your-static-assets.com/](https://your-static-assets.com/){{ $formId }}.js" async defer></script>
{{- else -}}
{{- errorf "The 'embed-form' shortcode requires a formId." -}}
{{- end -}}
```

* [ ] Documentation: Write clear instructions for users on how to add the shortcode to their site:

Simply add the following line to your content where you want the form to appear:

```
{{< embed-form "your-unique-form-id" >}}
```
