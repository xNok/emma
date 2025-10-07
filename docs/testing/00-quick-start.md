# Testing Quick Start Guide

**Date:** October 7, 2025  
**For:** Form Renderer Package  
**Time Required:** 30-60 minutes

## Quick Overview

The Form Renderer has been implemented but not yet tested. This guide helps you get started with testing immediately.

---

## 🚀 Quick Start (5 minutes)

### Step 1: Build the Package

```bash
cd /workspaces/emma/packages/form-renderer
yarn build
```

**Expected output:**
```
dist/
  ├── emma-form.js         (~40KB)
  ├── emma-form.min.js     (~12KB)
  └── index.d.ts
```

### Step 2: Start Test Server

```bash
python3 -m http.server 8080
```

### Step 3: Open Test Page

Open in browser: `http://localhost:8080/test.html`

### Step 4: Test Basic Functionality

1. ✅ Forms should render
2. ✅ Fill out a form and click submit
3. ✅ Check debug output below each form
4. ✅ Open browser console (F12) to see data

**If everything works:** ✅ You're good to go!  
**If something breaks:** 🔧 See troubleshooting below

---

## 📋 Testing Priorities

### Critical Path (Must test first)

1. **Form Rendering** ⭐⭐⭐
   - Do all forms appear?
   - Are all field types visible?
   - Is styling applied?

2. **Form Submission** ⭐⭐⭐
   - Does submit button work?
   - Is data captured correctly?
   - Does success message appear?

3. **Validation** ⭐⭐⭐
   - Do required fields show errors?
   - Do errors clear when typing?
   - Can't submit with invalid data?

### Important (Test second)

4. **Field Types** ⭐⭐
   - Text inputs work
   - Select dropdowns work
   - Radio buttons work
   - Checkboxes work
   - Textarea works

5. **User Experience** ⭐⭐
   - Tab navigation works
   - Keyboard input works
   - Help text is visible

### Nice to Have (Test last)

6. **Accessibility** ⭐
   - Screen reader compatibility
   - Focus indicators
   - ARIA attributes

7. **Cross-Browser** ⭐
   - Works in Chrome
   - Works in Firefox
   - Works in Safari

---

## 🧪 Quick Test Script (10 minutes)

Run through this checklist:

### Test 1: Visual Check (2 min)
```
[ ] Open test.html
[ ] All 3 forms are visible
[ ] Styling looks professional
[ ] No console errors
```

### Test 2: Basic Submission (3 min)
```
[ ] Fill out Newsletter Form (bottom one)
[ ] Click "Subscribe"
[ ] Success message appears
[ ] Debug output shows your data
[ ] Form is reset (fields cleared)
```

### Test 3: Validation (3 min)
```
[ ] Click submit on Contact Form (empty)
[ ] Error messages appear
[ ] Fill in name field
[ ] Error clears as you type
[ ] Fill all fields
[ ] Form submits successfully
```

### Test 4: Different Field Types (2 min)
```
[ ] Select a dropdown option
[ ] Click a radio button
[ ] Check multiple checkboxes
[ ] All work correctly
```

**Total time:** ~10 minutes  
**If all pass:** ✅ Core functionality works!

---

## 🐛 Troubleshooting

### Problem: Forms don't render

**Symptoms:** Blank page or empty containers

**Solution:**
1. Open browser console (F12)
2. Look for JavaScript errors
3. Check if build succeeded:
   ```bash
   ls -l packages/form-renderer/dist/
   ```
4. Verify test.html is using correct path to dist file

### Problem: "Cannot find module" errors

**Symptoms:** Error in console about missing modules

**Solution:**
```bash
cd /workspaces/emma
yarn install
cd packages/form-renderer
yarn build
```

### Problem: Styling looks broken

**Symptoms:** Forms render but look ugly

**Solution:**
1. Check if CSS is loaded:
   ```bash
   ls packages/form-renderer/themes/default.css
   ```
2. Verify CSS link in test.html is correct
3. Hard refresh browser (Ctrl+Shift+R)

### Problem: Submission doesn't work

**Symptoms:** Click submit, nothing happens

**Solution:**
1. Open console, look for errors
2. Check if `onSubmit` callback is defined
3. Verify schema has `apiEndpoint`

### Problem: TypeScript errors when building

**Symptoms:** `tsc` errors during build

**Solution:**
```bash
cd /workspaces/emma
yarn workspace @emma/shared build
cd packages/form-renderer
yarn build
```

---

## 📊 Understanding Test Results

### Good Test Output

**Browser Console:**
```javascript
Contact form submitted: {
  name: "John Doe",
  email: "john@example.com",
  subject: "general",
  message: "Test message"
}
```

**Debug Section:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "general",
  "message": "Test message"
}
```

### Bad Test Output

**Error in Console:**
```
Uncaught TypeError: Cannot read property 'fields' of undefined
```
👆 This means schema isn't being passed correctly

**No output at all:**
```
No submissions yet
```
👆 This means form didn't submit or callback didn't fire

---

## 📦 What's Included in Test Page

### Form 1: Contact Form
- Tests: All field types
- Tests: Complex validation
- Tests: Honeypot spam protection
- Tests: Multiple validation rules

### Form 2: Newsletter Form
- Tests: Simple form
- Tests: Basic validation
- Tests: Quick submission

### Form 3: Survey Form
- Tests: Number validation
- Tests: Rating system (radio)
- Tests: Multiple checkboxes
- Tests: Hidden fields

---

## 🎯 Testing Checklist by Role

### As a Developer
Focus on:
- [ ] Forms render without errors
- [ ] Data is captured correctly
- [ ] Validation logic works
- [ ] No console errors
- [ ] Bundle size is reasonable

### As a Designer
Focus on:
- [ ] Visual appearance
- [ ] Spacing and alignment
- [ ] Color and contrast
- [ ] Hover and focus states
- [ ] Responsive behavior

### As a QA Tester
Focus on:
- [ ] All test cases pass
- [ ] Edge cases handled
- [ ] Error messages clear
- [ ] No broken functionality
- [ ] Cross-browser compatibility

### As a User
Focus on:
- [ ] Easy to fill out
- [ ] Clear instructions
- [ ] Fast to submit
- [ ] Helpful error messages
- [ ] Works on mobile

---

## 📈 Next Steps After Testing

### If Tests Pass ✅
1. Run automated tests: `yarn test`
2. Check test coverage: `yarn test --coverage`
3. Test with real API endpoint
4. Integrate with Hugo site
5. Deploy to staging environment

### If Tests Fail ❌
1. Document all issues found
2. Create GitHub issues for bugs
3. Fix critical bugs first
4. Re-test after fixes
5. Repeat until all tests pass

---

## 🔗 Full Testing Documentation

For comprehensive testing:

1. **Automated Testing:** See [01-automated-testing.md](./01-automated-testing.md)
   - Vitest setup
   - Unit tests
   - Integration tests
   - Coverage reports

2. **Manual Testing:** See [02-manual-testing.md](./02-manual-testing.md)
   - Detailed test cases
   - Accessibility testing
   - Browser compatibility
   - Performance testing

---

## 💡 Tips for Effective Testing

1. **Test in order**: Start with critical path
2. **One thing at a time**: Don't rush
3. **Document issues**: Screenshot + description
4. **Use DevTools**: Console, Network, Elements tabs
5. **Test on real devices**: Not just desktop

---

## 📞 Getting Help

### Check These First
- Browser console for errors
- Network tab for failed requests
- Elements inspector for DOM issues

### Common Questions

**Q: Why isn't my form submitting?**  
A: Check validation. Try clicking submit on an empty form to see required field errors.

**Q: Where does the data go?**  
A: It calls the `onSubmit` callback. Check debug output or console.

**Q: How do I test the API endpoint?**  
A: Remove the `onSubmit` option to let it use real API. Or use a service like webhook.site.

**Q: Can I test without building?**  
A: No, you must run `yarn build` first to generate dist files.

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Build package | 1 min |
| Start server | 30 sec |
| Quick visual check | 2 min |
| Basic functionality | 10 min |
| Detailed testing | 30 min |
| Cross-browser testing | 20 min |
| Accessibility testing | 15 min |
| **Total (thorough)** | **~80 min** |

---

**Last Updated:** October 7, 2025  
**Status:** Ready for testing  
**Prerequisites:** Node.js, Yarn, Modern browser
