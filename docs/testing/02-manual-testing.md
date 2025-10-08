# Manual Testing Guide - Form Renderer

**Date:** October 7, 2025  
**Status:** Ready for Testing  
**Package:** `@emma/form-renderer`

## Overview

This document provides step-by-step instructions for manually testing the Form Renderer implementation. Manual testing complements automated tests by verifying the user experience, visual appearance, and browser compatibility.

---

## Prerequisites

Before starting manual testing, ensure:

1. **Dependencies installed:**
   ```bash
   cd /workspaces/emma
   yarn install
   ```

2. **Build the form renderer:**
   ```bash
   cd packages/form-renderer
   yarn build
   ```

3. **Verify build output:**
   ```bash
   ls -lh dist/
   # Should see: emma-form.js, emma-form.min.js
   ```

---

## Test Environment Setup

### 1. Create Test HTML Page

Create `packages/form-renderer/test.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Emma Form Renderer - Test Page</title>
  
  <!-- Load theme -->
  <link rel="stylesheet" href="./themes/default.css">
  
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    
    h1 {
      color: #333;
      margin-bottom: 10px;
    }
    
    .test-section {
      background: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .test-section h2 {
      color: #555;
      margin-top: 0;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 10px;
    }
    
    .debug {
      background: #f0f0f0;
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
      font-family: monospace;
      font-size: 12px;
    }
    
    .debug h3 {
      margin-top: 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <h1>🧪 Emma Form Renderer - Manual Test Page</h1>
  <p>This page tests all form renderer features. Open browser console to see submission data.</p>

  <!-- Test 1: Contact Form -->
  <div class="test-section">
    <h2>Test 1: Contact Form (All Field Types)</h2>
    <div id="contact-form"></div>
    <div class="debug" id="debug-1">
      <h3>Debug Output:</h3>
      <pre id="output-1">No submissions yet</pre>
    </div>
  </div>

  <!-- Test 2: Newsletter Form (Simple) -->
  <div class="test-section">
    <h2>Test 2: Newsletter Form (Minimal Fields)</h2>
    <div id="newsletter-form"></div>
    <div class="debug" id="debug-2">
      <h3>Debug Output:</h3>
      <pre id="output-2">No submissions yet</pre>
    </div>
  </div>

  <!-- Test 3: Survey Form (Complex Validation) -->
  <div class="test-section">
    <h2>Test 3: Survey Form (Advanced Features)</h2>
    <div id="survey-form"></div>
    <div class="debug" id="debug-3">
      <h3>Debug Output:</h3>
      <pre id="output-3">No submissions yet</pre>
    </div>
  </div>

  <!-- Load form renderer -->
  <script type="module">
    // Import the form renderer
    import FormRenderer from './dist/emma-form.js';

    // Test 1: Contact Form
    const contactSchema = {
      formId: 'contact-test',
      name: 'Contact Form Test',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.example.com/submit/contact',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Full Name',
          placeholder: 'John Doe',
          required: true,
          validation: {
            minLength: 2,
            maxLength: 100
          }
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          placeholder: 'john@example.com',
          required: true,
          autocomplete: 'email',
          validation: {
            pattern: 'email'
          }
        },
        {
          id: 'phone',
          type: 'tel',
          label: 'Phone Number',
          placeholder: '+1 (555) 123-4567',
          required: false,
          helpText: 'Optional: We may call you to follow up'
        },
        {
          id: 'subject',
          type: 'select',
          label: 'Subject',
          required: true,
          options: [
            { value: 'general', label: 'General Inquiry' },
            { value: 'support', label: 'Technical Support' },
            { value: 'sales', label: 'Sales Question' },
            { value: 'feedback', label: 'Feedback' }
          ]
        },
        {
          id: 'priority',
          type: 'radio',
          label: 'Priority Level',
          required: true,
          options: [
            { value: 'low', label: 'Low - General question' },
            { value: 'medium', label: 'Medium - Need help soon' },
            { value: 'high', label: 'High - Urgent issue' }
          ]
        },
        {
          id: 'message',
          type: 'textarea',
          label: 'Message',
          placeholder: 'Tell us more about your inquiry...',
          required: true,
          rows: 5,
          validation: {
            minLength: 10,
            maxLength: 1000
          }
        },
        {
          id: 'subscribe',
          type: 'checkbox',
          label: 'Communications',
          options: [
            { value: 'newsletter', label: 'Subscribe to newsletter' },
            { value: 'updates', label: 'Receive product updates' }
          ]
        }
      ],
      settings: {
        submitButtonText: 'Send Message',
        successMessage: 'Thank you! We\'ll get back to you soon.',
        errorMessage: 'Oops! Something went wrong. Please try again.',
        honeypot: {
          enabled: true,
          fieldName: 'website'
        }
      }
    };

    const contactForm = new FormRenderer({
      formId: 'contact-test',
      containerId: 'contact-form',
      schema: contactSchema,
      onSubmit: (data) => {
        console.log('Contact form submitted:', data);
        document.getElementById('output-1').textContent = JSON.stringify(data, null, 2);
      },
      onError: (error) => {
        console.error('Contact form error:', error);
        document.getElementById('output-1').textContent = 'Error: ' + error.message;
      }
    });

    contactForm.render();

    // Test 2: Newsletter Form
    const newsletterSchema = {
      formId: 'newsletter-test',
      name: 'Newsletter Form Test',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.example.com/submit/newsletter',
      fields: [
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          placeholder: 'your@email.com',
          required: true,
          validation: {
            pattern: 'email'
          }
        },
        {
          id: 'frequency',
          type: 'select',
          label: 'Email Frequency',
          required: true,
          options: [
            { value: 'daily', label: 'Daily Digest' },
            { value: 'weekly', label: 'Weekly Summary' },
            { value: 'monthly', label: 'Monthly Newsletter' }
          ]
        }
      ],
      settings: {
        submitButtonText: 'Subscribe',
        successMessage: 'Welcome! Check your email to confirm subscription.',
        errorMessage: 'Subscription failed. Please try again.'
      }
    };

    const newsletterForm = new FormRenderer({
      formId: 'newsletter-test',
      containerId: 'newsletter-form',
      schema: newsletterSchema,
      onSubmit: (data) => {
        console.log('Newsletter form submitted:', data);
        document.getElementById('output-2').textContent = JSON.stringify(data, null, 2);
      }
    });

    newsletterForm.render();

    // Test 3: Survey Form
    const surveySchema = {
      formId: 'survey-test',
      name: 'Survey Form Test',
      version: '1.0.0',
      theme: 'default',
      apiEndpoint: 'https://api.example.com/submit/survey',
      fields: [
        {
          id: 'age',
          type: 'number',
          label: 'Age',
          required: true,
          validation: {
            min: 18,
            max: 120
          },
          helpText: 'Must be 18 or older'
        },
        {
          id: 'satisfaction',
          type: 'radio',
          label: 'How satisfied are you with our service?',
          required: true,
          options: [
            { value: '5', label: '⭐⭐⭐⭐⭐ Very Satisfied' },
            { value: '4', label: '⭐⭐⭐⭐ Satisfied' },
            { value: '3', label: '⭐⭐⭐ Neutral' },
            { value: '2', label: '⭐⭐ Dissatisfied' },
            { value: '1', label: '⭐ Very Dissatisfied' }
          ]
        },
        {
          id: 'features',
          type: 'checkbox',
          label: 'Which features do you use regularly?',
          options: [
            { value: 'feature-a', label: 'Feature A - Dashboard' },
            { value: 'feature-b', label: 'Feature B - Analytics' },
            { value: 'feature-c', label: 'Feature C - Reporting' },
            { value: 'feature-d', label: 'Feature D - Integrations' }
          ]
        },
        {
          id: 'feedback',
          type: 'textarea',
          label: 'Additional Feedback',
          placeholder: 'Share your thoughts...',
          rows: 4,
          required: false
        },
        {
          id: 'referral_source',
          type: 'hidden',
          label: 'Referral Source',
          defaultValue: 'test-page'
        }
      ],
      settings: {
        submitButtonText: 'Submit Survey',
        successMessage: 'Thank you for your feedback!',
        errorMessage: 'Failed to submit survey.',
        honeypot: {
          enabled: true,
          fieldName: 'url'
        }
      }
    };

    const surveyForm = new FormRenderer({
      formId: 'survey-test',
      containerId: 'survey-form',
      schema: surveySchema,
      onSubmit: (data) => {
        console.log('Survey form submitted:', data);
        document.getElementById('output-3').textContent = JSON.stringify(data, null, 2);
      }
    });

    surveyForm.render();
  </script>
</body>
</html>
```

### 2. Start Local Server

```bash
cd packages/form-renderer
python3 -m http.server 8080
# or
npx serve .
```

### 3. Open in Browser

Open `http://localhost:8080/test.html` in your browser.

---

## Manual Test Cases

### Test Suite 1: Visual & Layout Testing

#### Test 1.1: Form Rendering
**Steps:**
1. Load the test page
2. Verify all three forms render completely
3. Check that all field types are visible

**Expected:**
- ✅ All forms load without JavaScript errors
- ✅ All labels are visible and properly aligned
- ✅ All input fields render correctly
- ✅ Submit buttons are visible

#### Test 1.2: Responsive Design
**Steps:**
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test these viewport sizes:
   - Mobile: 375x667 (iPhone SE)
   - Tablet: 768x1024 (iPad)
   - Desktop: 1920x1080

**Expected:**
- ✅ Forms are readable at all sizes
- ✅ Input fields don't overflow
- ✅ Buttons are properly sized
- ✅ No horizontal scrolling required

#### Test 1.3: Theme Styling
**Steps:**
1. Inspect form elements visually
2. Check spacing, colors, borders
3. Test hover states on inputs
4. Test focus states (Tab through form)

**Expected:**
- ✅ Professional appearance
- ✅ Consistent spacing
- ✅ Clear focus indicators
- ✅ Hover effects work

#### Test 1.4: Dark Mode (if system supports)
**Steps:**
1. Enable dark mode in OS settings
2. Refresh page
3. Verify readability

**Expected:**
- ✅ Form adapts to dark mode
- ✅ Text is readable
- ✅ Contrast is sufficient

---

### Test Suite 2: Field Validation Testing

#### Test 2.1: Required Field Validation
**Steps:**
1. Scroll to Contact Form
2. Click "Send Message" without filling anything
3. Observe error messages

**Expected:**
- ✅ Error messages appear for required fields
- ✅ Error messages are clear and specific
- ✅ Form does NOT submit
- ✅ Focus moves to first error field

#### Test 2.2: Email Validation
**Steps:**
1. Enter invalid email: "notanemail"
2. Tab to next field (blur event)
3. Observe validation

**Expected:**
- ✅ Error message appears
- ✅ Message says "invalid format"
- ✅ Field is highlighted as error

#### Test 2.3: Min/Max Length Validation
**Steps:**
1. In Name field, type just "A" (too short)
2. Tab away
3. Type a very long name (>100 chars)

**Expected:**
- ✅ Error for minimum length
- ✅ Error for maximum length
- ✅ Specific character counts shown

#### Test 2.4: Number Range Validation
**Steps:**
1. Scroll to Survey Form
2. Enter age: "10" (too young)
3. Enter age: "200" (too old)
4. Enter age: "25" (valid)

**Expected:**
- ✅ Error for age < 18
- ✅ Error for age > 120
- ✅ No error for valid age

#### Test 2.5: Real-time Error Clearing
**Steps:**
1. Trigger a validation error
2. Start typing in the field
3. Observe error message

**Expected:**
- ✅ Error clears as soon as you start typing
- ✅ Red border/highlight is removed
- ✅ No need to submit again to clear error

---

### Test Suite 3: Form Submission Testing

#### Test 3.1: Successful Submission
**Steps:**
1. Fill out Newsletter Form completely with valid data
2. Click "Subscribe"
3. Check debug output and console

**Expected:**
- ✅ Success message appears
- ✅ Form data appears in debug section
- ✅ Form is reset (fields cleared)
- ✅ Console shows submitted data

#### Test 3.2: Validation Before Submit
**Steps:**
1. Fill Contact Form with some invalid data
2. Try to submit
3. Fix errors one by one
4. Submit again

**Expected:**
- ✅ Form prevents submission with errors
- ✅ All errors are shown at once
- ✅ Form submits after all errors fixed

#### Test 3.3: Honeypot Spam Protection
**Steps:**
1. Open browser console
2. Type: `document.querySelector('input[name="website"]').value = 'spam'`
3. Fill rest of form validly
4. Submit

**Expected:**
- ✅ Form appears to succeed (shows success message)
- ✅ But data is NOT logged (silent fail)
- ✅ No API call is made

#### Test 3.4: Multiple Form Instances
**Steps:**
1. Fill and submit Newsletter Form
2. Then fill and submit Contact Form
3. Then fill and submit Survey Form

**Expected:**
- ✅ Each form submits independently
- ✅ No interference between forms
- ✅ Each debug section shows correct data

---

### Test Suite 4: User Experience Testing

#### Test 4.1: Keyboard Navigation
**Steps:**
1. Click in first field
2. Press Tab repeatedly to navigate through form
3. Use Space/Enter on checkboxes/radio buttons
4. Press Enter on submit button

**Expected:**
- ✅ Tab order is logical
- ✅ All fields are reachable
- ✅ Radio/checkbox can be selected with keyboard
- ✅ Enter submits the form

#### Test 4.2: Help Text Display
**Steps:**
1. Find fields with help text
2. Read the help text
3. Verify it's visible and helpful

**Expected:**
- ✅ Help text is visible below label
- ✅ Help text is readable (not too small)
- ✅ Helpful information is provided

#### Test 4.3: Field Autocomplete
**Steps:**
1. Type in email field
2. Check if browser offers autocomplete
3. Select an autocomplete suggestion

**Expected:**
- ✅ Browser autocomplete works
- ✅ Autocomplete doesn't break validation

#### Test 4.4: Select Dropdown Behavior
**Steps:**
1. Click on Subject select dropdown
2. Select an option
3. Try changing selection

**Expected:**
- ✅ Dropdown opens properly
- ✅ Options are readable
- ✅ Selection works
- ✅ Dropdown closes after selection

#### Test 4.5: Radio Button Selection
**Steps:**
1. Click different radio options
2. Verify only one can be selected

**Expected:**
- ✅ Only one radio selected at a time
- ✅ Visual feedback on selection
- ✅ Labels are clickable

#### Test 4.6: Checkbox Multiple Selection
**Steps:**
1. Check multiple checkboxes
2. Uncheck some
3. Submit and check data

**Expected:**
- ✅ Multiple checkboxes can be selected
- ✅ Visual feedback on check/uncheck
- ✅ Data includes all selected values

#### Test 4.7: Textarea Resizing
**Steps:**
1. Type in message textarea
2. Try resizing if browser allows
3. Type a lot of text

**Expected:**
- ✅ Textarea accommodates text
- ✅ No overflow issues
- ✅ Scrolling works if needed

---

### Test Suite 5: Accessibility Testing

#### Test 5.1: Screen Reader Simulation
**Steps:**
1. Install NVDA (Windows) or VoiceOver (Mac)
2. Navigate through form with screen reader
3. Listen to announced information

**Expected:**
- ✅ Labels are announced
- ✅ Required fields indicated
- ✅ Error messages are announced
- ✅ Help text is read
- ✅ Field types are clear

#### Test 5.2: Color Contrast
**Steps:**
1. Use browser extension like "WAVE" or "axe DevTools"
2. Run accessibility audit
3. Check for contrast issues

**Expected:**
- ✅ Text has sufficient contrast
- ✅ Error messages are visible
- ✅ No contrast violations

#### Test 5.3: Focus Indicators
**Steps:**
1. Tab through form
2. Observe focus outlines
3. Verify visibility

**Expected:**
- ✅ Focus is always visible
- ✅ Focus outline is clear
- ✅ Focus doesn't get lost

---

### Test Suite 6: Browser Compatibility Testing

#### Test 6.1: Cross-Browser Testing
**Browsers to test:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Steps:**
1. Open test.html in each browser
2. Run through core test cases
3. Note any differences

**Expected:**
- ✅ Forms work in all browsers
- ✅ Visual appearance is consistent
- ✅ Validation works everywhere
- ✅ Submission works everywhere

#### Test 6.2: Mobile Browser Testing
**Browsers to test:**
- Chrome Mobile (Android)
- Safari Mobile (iOS)

**Steps:**
1. Open test page on mobile device
2. Test touch interactions
3. Test form submission

**Expected:**
- ✅ Forms work on mobile
- ✅ Touch targets are large enough
- ✅ Virtual keyboard doesn't break layout

---

## Performance Testing

### Test 7.1: Bundle Size Verification

```bash
cd packages/form-renderer
ls -lh dist/emma-form.min.js
# Check if < 15KB
```

**Expected:** File size under 15KB (ideally 10-12KB)

### Test 7.2: Load Time

**Steps:**
1. Open DevTools Network tab
2. Hard refresh (Ctrl+Shift+R)
3. Check load time of emma-form.min.js

**Expected:** 
- ✅ Loads in < 100ms on good connection
- ✅ Gzipped size is even smaller

---

## Debugging Tools

### Browser Console Commands

```javascript
// Check if FormRenderer is loaded
console.log(typeof FormRenderer);

// Inspect rendered form
console.log(document.querySelector('#contact-form'));

// Manually trigger validation
document.querySelector('form').dispatchEvent(new Event('submit'));

// Check honeypot field
console.log(document.querySelector('input[name="website"]'));

// Get form data
const form = document.querySelector('form');
const formData = new FormData(form);
for (let [key, value] of formData.entries()) {
  console.log(key, value);
}
```

---

## Test Results Template

Use this checklist to track your testing:

```markdown
## Test Results - [Date]

### Environment
- Browser: ___________
- OS: ___________
- Screen Resolution: ___________

### Test Results

#### Visual & Layout
- [ ] Form rendering
- [ ] Responsive design
- [ ] Theme styling
- [ ] Dark mode

#### Validation
- [ ] Required fields
- [ ] Email validation
- [ ] Length validation
- [ ] Number validation
- [ ] Error clearing

#### Submission
- [ ] Successful submission
- [ ] Validation blocks submit
- [ ] Honeypot works
- [ ] Multiple forms work

#### User Experience
- [ ] Keyboard navigation
- [ ] Help text visible
- [ ] Autocomplete works
- [ ] Select dropdowns work
- [ ] Radio buttons work
- [ ] Checkboxes work
- [ ] Textareas work

#### Accessibility
- [ ] Screen reader compatible
- [ ] Color contrast OK
- [ ] Focus indicators visible

#### Browser Compatibility
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Issues Found
1. ___________
2. ___________

### Notes
___________
```

---

## Common Issues & Solutions

### Issue: Forms don't render
**Solution:** Check browser console for errors. Ensure build step completed.

### Issue: Validation doesn't work
**Solution:** Verify schema has validation rules. Check console for validation errors.

### Issue: Honeypot field is visible
**Solution:** Check that CSS is loaded. Honeypot should have `position: absolute; left: -9999px`.

### Issue: Success message doesn't appear
**Solution:** Check that `settings.successMessage` is defined in schema.

### Issue: Form submits to API instead of using onSubmit
**Solution:** Ensure `onSubmit` callback is passed to FormRenderer constructor.

---

## Next Steps After Manual Testing

1. **Document all issues found** in GitHub issues
2. **Fix critical bugs** before proceeding
3. **Optimize performance** if bundle size is too large
4. **Add more test cases** for edge cases discovered
5. **Proceed to integration testing** with Hugo

---

**Related Documents:**
- [Automated Testing Guide](./01-automated-testing.md)
- [Form Renderer Summary](../agents-summaries/01-form-renderer-summary.md)
- [Hugo Integration Guide](../developer-guide/hugo-integration.md)
