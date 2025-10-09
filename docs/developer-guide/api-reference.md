# API Reference

Emma's REST API handles form submissions and queries.

## Base URL

```
Production: https://api.yourdomain.com
Development: http://localhost:8787
```

## Endpoints

### Submit Form

Submit data for a specific form.

```
POST /submit/:formId
```

**Headers:**

```
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `formId` | string | Unique form identifier |

**Request Body:**

```json
{
  "formId": "contact-form-001",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello world!"
  },
  "meta": {
    "timestamp": "2025-10-07T12:00:00Z",
    "userAgent": "Mozilla/5.0...",
    "referrer": "https://example.com/contact"
  }
}
```

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "submissionId": "sub_abc123xyz"
}
```

**Response (Validation Error - 400 Bad Request):**

```json
{
  "success": false,
  "error": "Email is required",
  "field": "email"
}
```

**Response (Rate Limited - 429 Too Many Requests):**

```json
{
  "success": false,
  "error": "Rate limit exceeded"
}
```

**Response (Form Not Found - 404 Not Found):**

```json
{
  "success": false,
  "error": "Form not found"
}
```

---

### Health Check

Check API status and environment.

```
GET /health
```

**Response (200 OK):**

```json
{
  "status": "ok",
  "environment": "production"
}
```

---

## Request Details

### Submission Data Object

| Field    | Type   | Required | Description              |
| -------- | ------ | -------- | ------------------------ |
| `formId` | string | Yes      | Must match URL parameter |
| `data`   | object | Yes      | Form field values        |
| `meta`   | object | No       | Submission metadata      |

### Data Object

The `data` object contains field values where keys are field IDs:

```json
{
  "data": {
    "fieldId1": "value",
    "fieldId2": "value",
    "checkboxField": ["option1", "option2"]
  }
}
```

**Notes:**

- Single-value fields: string values
- Multi-value fields (checkboxes): array of strings
- All values are strings (numbers converted to strings)

### Meta Object

Optional metadata about the submission:

| Field       | Type   | Description        |
| ----------- | ------ | ------------------ |
| `timestamp` | string | ISO 8601 timestamp |
| `userAgent` | string | Browser user agent |
| `referrer`  | string | Referring page URL |

**Note:** The API will also capture the IP address from request headers.

---

## Response Details

### Success Response

```typescript
{
  success: true;
  submissionId: string; // e.g., "sub_abc123xyz"
}
```

### Error Response

```typescript
{
  success: false;
  error: string;      // Human-readable error message
  field?: string;     // Field ID if validation error
}
```

---

## Status Codes

| Code | Meaning               | Description                           |
| ---- | --------------------- | ------------------------------------- |
| 200  | OK                    | Submission successful                 |
| 400  | Bad Request           | Validation error or malformed request |
| 404  | Not Found             | Form ID not found                     |
| 405  | Method Not Allowed    | Wrong HTTP method                     |
| 413  | Payload Too Large     | Submission exceeds size limit         |
| 429  | Too Many Requests     | Rate limit exceeded                   |
| 500  | Internal Server Error | Server error                          |

---

## CORS

The API includes CORS headers for cross-origin requests:

```
Access-Control-Allow-Origin: *  (or specific domain)
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

### Preflight Requests

The API handles OPTIONS preflight requests automatically.

```
OPTIONS /submit/:formId
```

**Response:** 204 No Content with CORS headers

---

## Rate Limiting

**Current Limits:**

- 5 requests per minute per IP address
- Window: 60 seconds rolling

**When Exceeded:**

- Status: 429 Too Many Requests
- Retry-After header (future)

---

## Security

### Honeypot Protection

If a form has honeypot enabled and the honeypot field is filled:

- API returns success (to fool bots)
- Submission is **not** stored in database
- Submission ID is fake: `bot_1234567890`

### Input Sanitization

All input is sanitized to prevent XSS:

- HTML entities are escaped
- Script tags are removed
- SQL injection protected by parameterized queries

### Size Limits

Maximum submission size: **10KB** (configurable)

Exceeding this returns 413 Payload Too Large.

---

## Example Requests

### Using Fetch API

```javascript
const response = await fetch(
  'https://api.example.com/submit/contact-form-001',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      formId: 'contact-form-001',
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello!',
      },
      meta: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      },
    }),
  }
);

const result = await response.json();
if (result.success) {
  console.log('Submitted!', result.submissionId);
} else {
  console.error('Error:', result.error);
}
```

### Using curl

```bash
curl -X POST https://api.example.com/submit/contact-form-001 \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "contact-form-001",
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "message": "Hello!"
    }
  }'
```

---

## Environment Variables

Configure the API Worker via wrangler.toml:

```toml
[vars]
ENVIRONMENT = "production"
RATE_LIMIT_REQUESTS = "5"
RATE_LIMIT_WINDOW = "60"
MAX_SUBMISSION_SIZE = "10000"
ALLOWED_ORIGINS = "*"
```

See [Configuration](./configuration.md) for details.

---

## Error Messages

Common error messages and meanings:

| Error                                   | Meaning                              |
| --------------------------------------- | ------------------------------------ |
| "Form ID required"                      | Missing formId in URL                |
| "Form ID mismatch"                      | formId in body doesn't match URL     |
| "Form not found"                        | Form ID doesn't exist or is inactive |
| "Method not allowed"                    | Used GET instead of POST             |
| "Content-Type must be application/json" | Wrong Content-Type header            |
| "Submission too large"                  | Exceeded MAX_SUBMISSION_SIZE         |
| "Rate limit exceeded"                   | Too many requests                    |
| "[Field] is required"                   | Required field is missing/empty      |
| "[Field] has an invalid format"         | Field fails validation               |
| "Internal server error"                 | Server error (check logs)            |

---

## Next Steps

- Learn about [Database Schema](./database.md)
- Review [Form Schemas](./form-schemas.md)
- See [Troubleshooting](./troubleshooting.md)
