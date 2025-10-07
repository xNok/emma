# Troubleshooting Guide

Common issues and their solutions.

## Form Not Rendering

### Symptom
Form container is empty, no form appears on the page.

### Possible Causes

**1. Form ID is incorrect**
```bash
# Verify form exists
curl -I https://forms.yourdomain.com/your-form-id.js

# Should return: 200 OK
# If 404: Form ID is wrong or not deployed
```

**2. CDN URL is not configured**
```toml
# Check hugo.toml
[params.emma]
  cdnUrl = "https://forms.yourdomain.com"  # Must be set
```

**3. JavaScript file not loading**
- Check browser console for errors
- Check Network tab for failed requests
- Verify CORS headers are present

**4. JavaScript error in form renderer**
- Open browser console
- Look for errors related to EmmaForms
- Check if form schema is valid JSON

### Solutions

```bash
# Rebuild Hugo site
hugo --cleanDestinationDir

# Verify shortcode syntax
{{< embed-form "correct-form-id" >}}

# Check browser console
# Open DevTools → Console → Look for errors

# Test form JS directly
curl https://forms.yourdomain.com/your-form-id.js
```

---

## Form Submission Failing

### Symptom
Form displays but submission doesn't work.

### Possible Causes

**1. API endpoint is incorrect**
Check form schema:
```yaml
apiEndpoint: "https://api.yourdomain.com/submit"  # Verify URL
```

**2. CORS blocking request**
Browser console shows: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution:**
```toml
# In api-worker/wrangler.toml
[vars]
ALLOWED_ORIGINS = "https://yoursite.com"  # Or "*" for dev
```

**3. Form not found in database**
API returns 404 - form doesn't exist in D1.

**Solution:**
```bash
# Check D1 database
wrangler d1 execute emma-submissions --command="SELECT id, name FROM forms;"

# If missing, register form (form-builder will do this)
```

**4. Validation failing**
Check browser console for validation errors.

**Solution:**
- Review required fields in schema
- Ensure field IDs match schema
- Check validation rules are correct

---

## CORS Errors

### Symptom
Browser console shows CORS policy error.

### Solutions

**For R2 CDN Worker:**
```typescript
// workers/r2-proxy.ts
headers.set('Access-Control-Allow-Origin', '*');
headers.set('Access-Control-Allow-Methods', 'GET');
headers.set('Access-Control-Allow-Headers', 'Content-Type');
```

**For API Worker:**
```toml
# wrangler.toml
[vars]
ALLOWED_ORIGINS = "*"  # Or specific domains: "https://site1.com,https://site2.com"
```

**Redeploy workers:**
```bash
cd packages/api-worker
wrangler deploy
```

---

## Styling Issues

### Form Styles Not Applied

**Cause:** Theme CSS not loading or CSS conflicts

**Solutions:**

1. **Check theme is specified:**
```yaml
# form schema
theme: "default"  # or "minimal"
```

2. **Clear browser cache:**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or open in incognito mode

3. **Check for CSS conflicts:**
```css
/* Add in your site's CSS to debug */
.emma-form * {
  border: 1px solid red !important; /* See if elements exist */
}
```

4. **Override with custom styles:**
```css
.emma-form-wrapper {
  /* Your custom styles */
}
```

### Form Looks Broken on Mobile

**Solution:**
```css
/* Ensure viewport meta tag in Hugo */
<meta name="viewport" content="width=device-width, initial-scale=1">

/* Add responsive styles */
@media (max-width: 640px) {
  .emma-form-wrapper {
    padding: 1rem;
  }
  
  .emma-form-input {
    font-size: 16px; /* Prevents zoom on iOS */
  }
}
```

---

## Validation Issues

### Required Fields Not Validated

**Cause:** Client-side validation bypassed

**Note:** Server-side validation always runs - client-side is UX only.

**Check:**
1. Field has `required: true` in schema
2. Browser console for validation errors
3. API response for validation errors

### Pattern Validation Not Working

**Example:**
```yaml
validation:
  pattern: "email"  # Use preset
  # OR
  pattern: "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$"  # Custom regex
```

**Test:**
```javascript
// In browser console
const pattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
pattern.test("test@example.com"); // Should be true
```

---

## Deployment Issues

### Cloudflare Worker Not Deploying

**Error:** `Authentication error`

**Solution:**
```bash
# Login to Cloudflare
wrangler login

# Or set API token
export CLOUDFLARE_API_TOKEN=your-token

# Then deploy
wrangler deploy
```

**Error:** `D1 database not found`

**Solution:**
```bash
# Create D1 database
wrangler d1 create emma-submissions

# Copy database_id to wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "emma-submissions"
database_id = "your-database-id-here"  # Paste here
```

### Database Migration Failed

**Solution:**
```bash
# Run migration
wrangler d1 execute emma-submissions --file=./migrations/0001_initial_schema.sql

# Verify tables exist
wrangler d1 execute emma-submissions --command="SELECT name FROM sqlite_master WHERE type='table';"

# Should show: forms, submissions, metadata
```

---

## Performance Issues

### Form Loading Slowly

**Solutions:**

1. **Check bundle size:**
```bash
cd packages/form-renderer
yarn build

# Check dist/emma-forms.min.js size
# Should be < 15KB gzipped
```

2. **Use CDN caching:**
```typescript
// R2 proxy worker
headers.set('Cache-Control', 'public, max-age=31536000');
```

3. **Lazy load forms below fold:**
```html
<script>
// Load form when it scrolls into view
const observer = new IntersectionObserver((entries) => {
  // ... load form JS
});
</script>
```

### Database Queries Slow

**Solution:**
```sql
-- Add indexes (already in migration)
CREATE INDEX idx_submissions_form_id ON submissions(form_id);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);
```

---

## Spam Issues

### Getting Spam Submissions

**Solutions:**

1. **Enable honeypot:**
```yaml
settings:
  honeypot:
    enabled: true
    fieldName: "website"  # Hidden field name
```

2. **Check honeypot is working:**
```bash
# Test submission with honeypot filled
curl -X POST https://api.example.com/submit/form-id \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "form-id",
    "data": {
      "email": "test@example.com",
      "website": "spam-value"  # Honeypot field
    }
  }'

# Should return success but NOT save to database
```

3. **Implement rate limiting:**
Currently a placeholder - will be implemented with KV or Durable Objects.

4. **Add reCAPTCHA (future):**
```yaml
settings:
  reCaptcha:
    enabled: true
    siteKey: "your-site-key"
```

---

## Hugo Build Errors

### Error: `embed-form` shortcode not found

**Solution:**
```bash
# Check shortcode file exists
ls layouts/shortcodes/embed-form.html

# If using module, update
hugo mod get -u

# If using theme, check theme is active
hugo config | grep theme
```

### Error: `formId` parameter required

**Fix shortcode usage:**
```markdown
# Wrong
{{< embed-form >}}

# Correct
{{< embed-form "your-form-id" >}}
```

---

## Database Issues

### Submissions Not Saving

**Check:**

1. **D1 database is bound:**
```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"  # Must match code
database_name = "emma-submissions"
database_id = "your-id"
```

2. **Tables exist:**
```bash
wrangler d1 execute emma-submissions \
  --command="SELECT name FROM sqlite_master WHERE type='table';"
```

3. **Form exists in database:**
```bash
wrangler d1 execute emma-submissions \
  --command="SELECT * FROM forms WHERE id='your-form-id';"
```

4. **Check worker logs:**
```bash
wrangler tail emma-api
# Submit a form and watch for errors
```

### Query Submissions

```bash
# Get all submissions for a form
wrangler d1 execute emma-submissions \
  --command="SELECT * FROM submissions WHERE form_id='contact-form-001' ORDER BY created_at DESC LIMIT 10;"

# Count submissions
wrangler d1 execute emma-submissions \
  --command="SELECT COUNT(*) FROM submissions WHERE form_id='contact-form-001';"

# Export submissions
wrangler d1 export emma-submissions --output=backup.sql
```

---

## Getting Help

### Debug Checklist

- [ ] Check browser console for JavaScript errors
- [ ] Check Network tab for failed requests
- [ ] Verify form ID is correct
- [ ] Confirm CDN URL is configured
- [ ] Test API endpoint directly with curl
- [ ] Check worker logs: `wrangler tail`
- [ ] Verify database has form registered
- [ ] Test in incognito mode (clears cache)
- [ ] Try different browser

### Logging

**Add debug logging to worker:**
```typescript
console.log('Form ID:', formId);
console.log('Submission data:', JSON.stringify(data));
console.log('Validation result:', validation);
```

**View logs:**
```bash
wrangler tail emma-api --format pretty
```

---

## Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Form ID required" | Missing formId parameter | Add form ID to shortcode |
| "Form not found" | Form doesn't exist in D1 | Register form in database |
| "Rate limit exceeded" | Too many requests | Wait 60 seconds and retry |
| "Submission too large" | Data exceeds 10KB | Reduce field sizes |
| "Invalid email format" | Email validation failed | Check email pattern |
| "CORS policy" | CORS headers missing | Add CORS to worker |
| "NetworkError" | Can't reach API | Check API URL and deployment |

---

## Next Steps

- Review [API Reference](./api-reference.md)
- Check [Hugo Integration](./hugo-integration.md)
- See [Example Forms](../../examples/)
