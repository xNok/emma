# Form Renderer Testing - Quick Reference Card

**One-page cheat sheet for testing the Form Renderer**

---

## ⚡ Quick Commands

```bash
# Build
cd /workspaces/emma/packages/form-renderer && yarn build

# Test (Manual)
python3 -m http.server 8080
# Open: http://localhost:8080/test.html

# Test (Automated)
yarn test
yarn test --coverage
yarn test --watch
```

---

## 📖 Documentation Files

| File | Purpose | Time |
|------|---------|------|
| `00-quick-start.md` | Get started fast | 5 min |
| `01-automated-testing.md` | Vitest setup | 2-3 hrs |
| `02-manual-testing.md` | Test checklists | 1-2 hrs |
| `README.md` | Overview | 5 min |

---

## ✅ 5-Minute Test

1. **Build:** `yarn build` (1 min)
2. **Server:** `python3 -m http.server 8080` (30 sec)
3. **Open:** `http://localhost:8080/test.html` (10 sec)
4. **Test:** Fill form, submit, check output (3 min)

**Expected:** ✅ Forms work, data captured, no errors

---

## 🧪 Test Forms Available

| Form | Tests | Complexity |
|------|-------|------------|
| Contact | All field types, validation | Complex |
| Newsletter | Simple form, email | Simple |
| Survey | Number validation, ratings | Medium |

---

## 🎯 Critical Tests (Must Pass)

- [ ] Forms render
- [ ] Submit captures data
- [ ] Required field validation
- [ ] Error messages show
- [ ] Success messages show

**Time:** 10 minutes

---

## 🔍 Debugging

```javascript
// Check if loaded
console.log(typeof FormRenderer);

// Get form data
const form = document.querySelector('form');
const data = new FormData(form);
for (let [k, v] of data.entries()) console.log(k, v);

// Check honeypot
console.log(document.querySelector('input[name="website"]'));
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Forms don't render | Run `yarn build` |
| Import errors | `yarn install` |
| Port in use | Try port 8081 |
| No validation | Check schema has `validation` |

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Test coverage | ≥ 80% |
| Bundle size | < 15KB |
| Browsers | Chrome, Firefox, Safari |
| Accessibility | WCAG 2.1 AA |

---

## 🚦 Ship Decision

### ✅ Green (Ship)
- All tests pass
- Coverage > 80%
- Works in 3+ browsers
- No critical bugs

### 🟡 Yellow (Fix First)
- Coverage 60-80%
- Works in 2 browsers
- Minor bugs only

### 🔴 Red (Don't Ship)
- Tests failing
- Coverage < 60%
- Critical bugs
- Broken in major browsers

---

## 📞 Quick Help

**Forms not working?**
→ Check console (F12) for errors

**Build failing?**
→ `yarn install` then `yarn build`

**Need test code?**
→ See `01-automated-testing.md`

**Where to start?**
→ Read `00-quick-start.md`

---

## 🎓 Testing Path

```
Beginner    → 00-quick-start.md → test.html
Developer   → 01-automated-testing.md → Write tests
QA Tester   → 02-manual-testing.md → Run checklists
```

---

## 📈 Test Workflow

```
Day 1:  Quick test (10 min)
Week 1: Automated tests (3-4 hrs)
Week 2: Manual testing (3-4 hrs)
Week 3: Bug fixes + retest
```

---

## 🔗 Key Files

```
/workspaces/emma/
├── docs/testing/
│   ├── 00-quick-start.md      ← Start here
│   ├── 01-automated-testing.md
│   ├── 02-manual-testing.md
│   └── README.md
└── packages/form-renderer/
    ├── test.html              ← Test page
    ├── src/index.ts
    └── dist/
        ├── emma-form.js
        └── emma-form.min.js
```

---

## 💾 Save This!

Bookmark this page for quick reference during testing.

**Full documentation:** [docs/testing/README.md](./README.md)

**Created:** October 7, 2025
