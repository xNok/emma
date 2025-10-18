---
menu:
  docs:
    parent: 'user-guide'
title: 'Cloudflare Setup'
weight: 3
---
menu:
  docs:
    parent: 'user-guide'

To use Emma with Cloudflare, you need to set up the following services:

- **R2:** For storing form assets.
- **D1:** For storing form submissions.
- **Workers:** For running the API worker that processes form submissions.

**Note:** The `emma init` command will automatically handle the creation and configuration of these services for you. The following steps are provided for your reference and for manual setup if needed.

## Step 1: Create an R2 Bucket

1.  Log in to your Cloudflare account and navigate to the **R2** section.
2.  Click **Create bucket** and give your bucket a name (e.g., `emma-forms`).
3.  Take note of the **Bucket Name** and your **Account ID**.

## Step 2: Create a D1 Database

1.  Navigate to the **Workers & Pages** section and click on **D1**.
2.  Click **Create database** and give your database a name (e.g., `emma-submissions`).
3.  Take note of the **Database Name** and **Database ID**.

## Step 3: Create a Worker

1.  Navigate to the **Workers & Pages** section and click on **Create application**.
2.  Select **Create Worker** and give your worker a name (e.g., `emma-api-worker`).
3.  Click **Deploy**.

## Step 4: Obtain API Credentials

1.  Go to **My Profile** > **API Tokens**.
2.  Click **Create Token** and select **Create Custom Token**.
3.  Give your token a name (e.g., `emma-cli-token`).
4.  Grant the following permissions:
    - **Account** > **Workers R2 Storage**: `Edit`
    - **Account** > **Workers Scripts**: `Edit`
    - **Account** > **D1**: `Edit`
    - **Zone** > **Workers Routes**: `Edit` (if using a custom domain)
5.  Click **Continue to summary** and then **Create Token**.
6.  Copy the generated token and store it in a secure location.

## Step 5: Get R2 S3 API Credentials

1.  Navigate to the **R2** section and click on your R2 bucket.
2.  Go to the **Settings** tab.
3.  Under **R2.dev API**, click **Connect to R2.dev**.
4.  Click **Create API token**.
5.  Copy the **Access Key ID** and **Secret Access Key**.
