# Emma Form Renderer - Test Server

Interactive test server for manual testing with visual checklists.

## Quick Start

```bash
# Install dependencies (first time only)
yarn install

# Run server
yarn dev

# Open browser
http://localhost:3000
```

## Features

- 5 test scenarios with visual checklists
- Real-time form submission feedback
- Console logging for debugging
- Tests all field types and validation rules

## Scenarios

1. **Contact Form** - Complex form with all field types
2. **Newsletter** - Simple email signup
3. **Survey** - Number validation and ratings
4. **Validation** - All validation rules
5. **Accessibility** - ARIA and keyboard navigation

## Usage

1. Click any scenario card on the home page
2. Follow the checklist items
3. Fill out the form and submit
4. Check results in the output panel
5. Open DevTools (F12) for detailed console logs

## API Endpoints

The server provides a mock API at:

- `POST /api/submit/:formId` - Accepts form submissions

## Customization

Edit `scenarios.js` to add or modify test scenarios.
