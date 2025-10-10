const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Template loader
const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, 'templates', templateName);
  return fs.readFileSync(templatePath, 'utf8');
};

// Serve static files
app.use('/dist', express.static(path.join(__dirname, '../dist')));
app.use('/themes', express.static(path.join(__dirname, '../themes')));
app.use(express.json());

// Test scenarios configuration
const scenarios = [
  {
    id: 'contact',
    name: 'Contact Form',
    description: 'All field types, complex validation',
    tests: ['Text input', 'Email', 'Tel', 'Select', 'Radio', 'Textarea', 'Checkboxes', 'Validation', 'Honeypot']
  },
  {
    id: 'newsletter',
    name: 'Newsletter Signup',
    description: 'Simple form with minimal fields',
    tests: ['Email validation', 'Dropdown', 'Quick submission']
  },
  {
    id: 'survey',
    name: 'Customer Survey',
    description: 'Number validation, ratings, checkboxes',
    tests: ['Number validation (18-120)', 'Radio ratings', 'Multiple checkboxes', 'Hidden fields']
  },
  {
    id: 'validation',
    name: 'Validation Tests',
    description: 'Test all validation scenarios',
    tests: ['Required fields', 'Min/max length', 'Email patterns', 'Number ranges', 'Error clearing']
  },
  {
    id: 'accessibility',
    name: 'Accessibility Check',
    description: 'ARIA attributes and screen reader support',
    tests: ['ARIA labels', 'Keyboard navigation', 'Focus management', 'Error announcements']
  }
];

// API endpoint for form submissions (mock)
app.post('/api/submit/:formId', (req, res) => {
  console.log(`📨 Form submission received for ${req.params.formId}:`, req.body);
  
  // Simulate API delay
  setTimeout(() => {
    res.json({
      success: true,
      message: 'Form submitted successfully!',
      submissionId: `sub_${Date.now()}`,
      data: req.body.data
    });
  }, 500);
});

// Main test page
app.get('/', (req, res) => {
  // Helper function for icons
  const getIcon = (id) => {
    const icons = {
      contact: '📧',
      newsletter: '📬',
      survey: '📊',
      validation: '✅',
      accessibility: '♿'
    };
    return icons[id] || '📝';
  };

  const scenariosHtml = scenarios.map(s => `
    <div class="scenario-card" onclick="location.href='/test/${s.id}'">
      <h3>
        <span class="icon">${getIcon(s.id)}</span>
        ${s.name}
      </h3>
      <p>${s.description}</p>
      <div class="tests">
        ${s.tests.slice(0, 3).map(t => `<span class="test-badge">${t}</span>`).join('')}
        ${s.tests.length > 3 ? `<span class="test-badge">+${s.tests.length - 3} more</span>` : ''}
      </div>
    </div>
  `).join('');

  const html = loadTemplate('index.html')
    .replace('{{SCENARIOS}}', scenariosHtml);
  
  res.send(html);
});

// Individual test pages
app.get('/test/:scenario', (req, res) => {
  const scenario = req.params.scenario;
  const schemas = require('./scenarios');
  const schema = schemas[scenario];
  
  if (!schema) {
    return res.status(404).send('Scenario not found');
  }

  // Generate checklist HTML if present
  const checklistHtml = schema.checklist ? `
    <div class="test-checklist">
      <h3>✅ Test Checklist</h3>
      ${schema.checklist.map((item, i) => `
        <label>
          <input type="checkbox" id="check-${i}">
          ${item}
        </label>
      `).join('')}
    </div>
  ` : '';

  const html = loadTemplate('test-page.html')
    .replace(/\{\{FORM_NAME\}\}/g, schema.name)
    .replace(/\{\{FORM_DESCRIPTION\}\}/g, schema.description || 'Test this form scenario')
    .replace(/\{\{SCENARIO_ID\}\}/g, scenario)
    .replace('{{SCHEMA}}', JSON.stringify(schema, null, 2))
    .replace('{{CHECKLIST}}', checklistHtml);
  
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`\n🚀 Emma Test Server running!`);
  console.log(`📍 Open: http://localhost:${PORT}`);
  console.log(`\n✨ Available scenarios:`);
  scenarios.forEach(s => console.log(`   - ${s.name}: http://localhost:${PORT}/test/${s.id}`));
  console.log(`\n`);
});
