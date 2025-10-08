const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

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

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Emma Form Renderer - Test Suite</title>
  <link rel="stylesheet" href="/themes/default.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f7fa;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .header h1 { margin-bottom: 10px; }
    .header p { opacity: 0.9; }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .scenario-card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      cursor: pointer;
      transition: all 0.2s;
      border: 2px solid transparent;
    }
    
    .scenario-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      border-color: #667eea;
    }
    
    .scenario-card h3 {
      color: #333;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .scenario-card p {
      color: #666;
      font-size: 14px;
      margin-bottom: 15px;
    }
    
    .tests {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .test-badge {
      background: #e0e7ff;
      color: #4338ca;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .icon { font-size: 24px; }
    
    .instructions {
      background: #fff3cd;
      border: 2px solid #ffc107;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .instructions h3 {
      color: #856404;
      margin-bottom: 12px;
    }
    
    .instructions ul {
      color: #856404;
      margin-left: 20px;
    }
    
    .instructions li {
      margin-bottom: 8px;
    }
    
    .quick-commands {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
      font-family: 'Courier New', monospace;
    }
    
    .quick-commands h3 {
      color: #4ec9b0;
      margin-bottom: 12px;
    }
    
    .quick-commands code {
      display: block;
      margin: 8px 0;
      color: #ce9178;
    }
    
    footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🧪 Emma Form Renderer Test Suite</h1>
    <p>Interactive testing scenarios for manual validation</p>
  </div>

  <div class="instructions">
    <h3>🎯 How to Test</h3>
    <ul>
      <li><strong>Click any scenario card</strong> below to test that form</li>
      <li><strong>Fill out the form</strong> and click submit</li>
      <li><strong>Open DevTools (F12)</strong> to see submission data in console</li>
      <li><strong>Try different scenarios:</strong> valid data, invalid data, empty fields</li>
      <li><strong>Check accessibility:</strong> Use Tab key to navigate, test with screen reader</li>
    </ul>
  </div>

  <div class="quick-commands">
    <h3>⚡ Quick Commands</h3>
    <code># Run automated tests</code>
    <code>$ cd packages/form-renderer && yarn test</code>
    <code></code>
    <code># Start this test server</code>
    <code>$ cd packages/form-renderer/test-server && npm run dev</code>
  </div>

  <div class="grid">
    ${scenarios.map(s => `
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
    `).join('')}
  </div>

  <footer>
    <p>🚀 Emma Forms - Testing Infrastructure v1.0</p>
  </footer>

  <script>
    function getIcon(id) {
      const icons = {
        contact: '📧',
        newsletter: '📬',
        survey: '📊',
        validation: '✅',
        accessibility: '♿'
      };
      return icons[id] || '📝';
    }
  </script>
</body>
</html>
  `;
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

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${schema.name} - Emma Test</title>
  <link rel="stylesheet" href="/themes/default.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f7fa;
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .nav {
      margin-bottom: 20px;
    }
    
    .nav a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }
    
    .nav a:hover {
      text-decoration: underline;
    }
    
    .header {
      background: white;
      padding: 25px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .header h1 {
      color: #333;
      margin-bottom: 8px;
    }
    
    .header p {
      color: #666;
      font-size: 14px;
    }
    
    .test-checklist {
      background: #fff3cd;
      border: 2px solid #ffc107;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    
    .test-checklist h3 {
      color: #856404;
      margin-bottom: 12px;
    }
    
    .test-checklist label {
      display: block;
      margin: 8px 0;
      color: #856404;
      cursor: pointer;
    }
    
    .test-checklist input[type="checkbox"] {
      margin-right: 8px;
    }
    
    .form-container {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      margin-bottom: 30px;
    }
    
    .results {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 20px;
      border-radius: 12px;
      font-family: 'Courier New', monospace;
      margin-bottom: 30px;
    }
    
    .results h3 {
      color: #4ec9b0;
      margin-bottom: 12px;
    }
    
    .results pre {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .success { color: #4ade80; }
    .error { color: #f87171; }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav">
      <a href="/">← Back to all scenarios</a>
    </div>

    <div class="header">
      <h1>🧪 ${schema.name}</h1>
      <p>${schema.description || 'Test this form scenario'}</p>
    </div>

    ${schema.checklist ? `
    <div class="test-checklist">
      <h3>✅ Test Checklist</h3>
      ${schema.checklist.map((item, i) => `
        <label>
          <input type="checkbox" id="check-${i}">
          ${item}
        </label>
      `).join('')}
    </div>
    ` : ''}

    <div class="form-container">
      <div id="test-form"></div>
    </div>

    <div class="results">
      <h3>📊 Test Results</h3>
      <pre id="output">No submissions yet. Fill out the form above and click submit.</pre>
    </div>
  </div>

  <script type="module">
    import FormRenderer from '/dist/emma-forms.esm.js';

    const schema = ${JSON.stringify(schema, null, 2)};

    console.log('🚀 Loading scenario: ${scenario}');
    console.log('📋 Schema:', schema);

    try {
      const renderer = new FormRenderer({
        formId: '${scenario}-test',
        containerId: 'test-form',
        schema: schema,
        onSubmit: (data) => {
          console.log('✅ Form submitted:', data);
          document.getElementById('output').innerHTML = 
            '<span class="success">✅ SUCCESS</span>\\n\\n' +
            'Submitted Data:\\n' +
            JSON.stringify(data, null, 2);
        },
        onSuccess: (response) => {
          console.log('✅ API response:', response);
        },
        onError: (error) => {
          console.error('❌ Form error:', error);
          document.getElementById('output').innerHTML = 
            '<span class="error">❌ ERROR</span>\\n\\n' +
            error.message;
        }
      });

      renderer.render();
      console.log('✅ Form rendered successfully');
    } catch (error) {
      console.error('❌ Failed to render form:', error);
      document.getElementById('output').innerHTML = 
        '<span class="error">❌ FAILED TO RENDER</span>\\n\\n' +
        error.message;
    }
  </script>
</body>
</html>
  `;
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`\n🚀 Emma Test Server running!`);
  console.log(`📍 Open: http://localhost:${PORT}`);
  console.log(`\n✨ Available scenarios:`);
  scenarios.forEach(s => console.log(`   - ${s.name}: http://localhost:${PORT}/test/${s.id}`));
  console.log(`\n`);
});
