# Manual Testing

**Package:** `@emma/form-renderer/test-server`

## Quick Start

```bash
# From repository root
yarn test:manual

# Opens http://localhost:3000
```

## Test Scenarios

The test server provides 5 interactive scenarios with visual checklists:

1. **Contact Form** - All field types, complex validation
2. **Newsletter** - Simple form, email validation
3. **Survey** - Number validation, ratings, checkboxes
4. **Validation** - All validation rules and error handling
5. **Accessibility** - ARIA attributes, keyboard navigation

## What to Test

### Visual Testing

- ✅ All field types render correctly
- ✅ Labels and help text display properly
- ✅ Error messages appear inline
- ✅ Success/failure feedback is clear
- ✅ Form resets after successful submission

### Interaction Testing

- ✅ Tab navigation works through all fields
- ✅ Required field validation triggers
- ✅ Email/phone/URL patterns validate correctly
- ✅ Min/max length validation works
- ✅ Submit button is disabled during submission

### Accessibility Testing

- ✅ Screen reader announces errors
- ✅ ARIA labels are present
- ✅ Keyboard-only navigation works
- ✅ Focus indicators are visible
- ✅ Error summaries are announced

## Console Output

The test server logs submission data to the browser console. Check the console to verify:

- Form data is correctly captured
- Validation errors are caught
- Submission flow works as expected

## Browser Testing

Test in multiple browsers:

- Chrome/Edge (Chromium)
- Firefox
- Safari (if available)
