// Test scenario definitions
module.exports = {
  contact: {
    formId: 'contact-test',
    name: 'Contact Form',
    version: '1.0.0',
    theme: 'default',
    apiEndpoint: 'http://localhost:3000/api/submit',
    description: 'Test all field types and complex validation',
    checklist: [
      'Fill all required fields and submit',
      'Try submitting with empty required fields',
      'Test email validation with invalid email',
      'Test phone number field',
      'Select different options in dropdown',
      'Test radio button selection',
      'Check multiple checkboxes',
      'Verify textarea accepts multi-line text',
      'Check that honeypot field is hidden',
      'Test keyboard navigation (Tab through fields)'
    ],
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Full Name',
        placeholder: 'John Doe',
        required: true,
        validation: { minLength: 2, maxLength: 100 }
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email Address',
        placeholder: 'john@example.com',
        required: true,
        autocomplete: 'email',
        validation: { pattern: 'email' }
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
        placeholder: 'Choose a topic...',
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
        placeholder: 'Tell us more...',
        required: true,
        rows: 5,
        validation: { minLength: 10, maxLength: 1000 }
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
      errorMessage: 'Please check your inputs and try again.',
      honeypot: { enabled: true, fieldName: 'website' }
    }
  },

  newsletter: {
    formId: 'newsletter-test',
    name: 'Newsletter Signup',
    version: '1.0.0',
    theme: 'default',
    apiEndpoint: 'http://localhost:3000/api/submit',
    description: 'Simple form with minimal validation',
    checklist: [
      'Enter a valid email address',
      'Try an invalid email (e.g., "notanemail")',
      'Select a frequency option',
      'Submit the form',
      'Verify success message appears'
    ],
    fields: [
      {
        id: 'email',
        type: 'email',
        label: 'Email Address',
        placeholder: 'your@email.com',
        required: true,
        helpText: 'We\'ll never share your email.',
        validation: { pattern: 'email' }
      },
      {
        id: 'frequency',
        type: 'select',
        label: 'Email Frequency',
        required: true,
        placeholder: 'How often?',
        options: [
          { value: 'daily', label: 'Daily Digest' },
          { value: 'weekly', label: 'Weekly Summary' },
          { value: 'monthly', label: 'Monthly Newsletter' }
        ]
      }
    ],
    settings: {
      submitButtonText: 'Subscribe',
      successMessage: 'Welcome! Check your email to confirm.',
      errorMessage: 'Subscription failed. Please try again.'
    }
  },

  survey: {
    formId: 'survey-test',
    name: 'Customer Survey',
    version: '1.0.0',
    theme: 'default',
    apiEndpoint: 'http://localhost:3000/api/submit',
    description: 'Number validation, ratings, and multi-select',
    checklist: [
      'Enter age less than 18 (should fail)',
      'Enter age greater than 120 (should fail)',
      'Enter valid age (18-120)',
      'Select a satisfaction rating',
      'Check multiple feature checkboxes',
      'Submit with valid data',
      'Verify hidden field is not visible'
    ],
    fields: [
      {
        id: 'age',
        type: 'number',
        label: 'Age',
        placeholder: '25',
        required: true,
        validation: { min: 18, max: 120 },
        helpText: 'Must be 18 or older'
      },
      {
        id: 'satisfaction',
        type: 'radio',
        label: 'How satisfied are you?',
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
        label: 'Which features do you use?',
        options: [
          { value: 'dashboard', label: 'Dashboard' },
          { value: 'analytics', label: 'Analytics' },
          { value: 'reporting', label: 'Reporting' },
          { value: 'integrations', label: 'Integrations' }
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
        defaultValue: 'test-suite'
      }
    ],
    settings: {
      submitButtonText: 'Submit Survey',
      successMessage: 'Thank you for your feedback!',
      errorMessage: 'Please check your inputs.',
      honeypot: { enabled: true, fieldName: 'url' }
    }
  },

  validation: {
    formId: 'validation-test',
    name: 'Validation Tests',
    version: '1.0.0',
    theme: 'default',
    apiEndpoint: 'http://localhost:3000/api/submit',
    description: 'Test all validation scenarios',
    checklist: [
      'Submit empty form (all fields should show errors)',
      'Enter username with 1 character (too short)',
      'Enter username with 3+ characters (should pass)',
      'Enter email without @ symbol',
      'Enter valid email',
      'Start typing in a field with error (error should clear)',
      'Fill all fields correctly and submit'
    ],
    fields: [
      {
        id: 'username',
        type: 'text',
        label: 'Username',
        required: true,
        validation: { minLength: 3, maxLength: 20 },
        helpText: '3-20 characters'
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email',
        required: true,
        validation: { pattern: 'email' }
      },
      {
        id: 'password',
        type: 'text',
        label: 'Password',
        required: true,
        validation: { minLength: 8 },
        helpText: 'At least 8 characters'
      },
      {
        id: 'bio',
        type: 'textarea',
        label: 'Bio',
        required: true,
        validation: { minLength: 10, maxLength: 200 },
        helpText: '10-200 characters',
        rows: 3
      }
    ],
    settings: {
      submitButtonText: 'Validate',
      successMessage: 'All validations passed!',
      errorMessage: 'Please fix the errors above.'
    }
  },

  accessibility: {
    formId: 'a11y-test',
    name: 'Accessibility Check',
    version: '1.0.0',
    theme: 'default',
    apiEndpoint: 'http://localhost:3000/api/submit',
    description: 'ARIA attributes and keyboard navigation',
    checklist: [
      'Use Tab key to navigate through all fields',
      'Verify focus is visible on all fields',
      'Use screen reader to read form labels',
      'Submit empty form and hear error announcements',
      'Check that help text is announced',
      'Use Space to check/uncheck checkbox',
      'Use arrow keys in radio group',
      'Press Enter to submit form'
    ],
    fields: [
      {
        id: 'name',
        type: 'text',
        label: 'Name',
        required: true,
        helpText: 'Enter your full name'
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email',
        required: true,
        validation: { pattern: 'email' }
      },
      {
        id: 'role',
        type: 'radio',
        label: 'Role',
        required: true,
        options: [
          { value: 'developer', label: 'Developer' },
          { value: 'designer', label: 'Designer' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        id: 'agree',
        type: 'checkbox',
        label: 'Agreement',
        options: [
          { value: 'terms', label: 'I agree to the terms' }
        ]
      }
    ],
    settings: {
      submitButtonText: 'Submit',
      successMessage: 'Form submitted successfully!',
      errorMessage: 'Please correct the errors.'
    }
  }
};
