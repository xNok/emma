/**
 * Emma Documentation Theme - Main JavaScript
 * Handles mobile menu toggle and basic interactions
 */

(function() {
  'use strict';
  
  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
  
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function() {
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      
      // Toggle aria-expanded
      this.setAttribute('aria-expanded', !isExpanded);
      
      // Toggle sidebar and drawer visibility
      if (sidebar) {
        sidebar.classList.toggle('active');
      }
      if (mobileNavDrawer) {
        mobileNavDrawer.classList.toggle('active');
      }
      
      // Update button icon
      const icon = this.querySelector('svg');
      if (icon) {
        const isActive = (sidebar && sidebar.classList.contains('active')) || (mobileNavDrawer && mobileNavDrawer.classList.contains('active'));
        if (isActive) {
          // Change to X icon
          icon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>';
        } else {
          // Change to hamburger icon
          icon.innerHTML = '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
        }
      }
    });
    
    // Close sidebar/drawer when clicking outside on mobile
    document.addEventListener('click', function(event) {
      if (window.innerWidth <= 768) {
        const isClickInsideSidebar = sidebar && sidebar.contains(event.target);
        const isClickInsideDrawer = mobileNavDrawer && mobileNavDrawer.contains(event.target);
        const isClickOnToggle = mobileMenuToggle.contains(event.target);
        
        if (!isClickInsideSidebar && !isClickInsideDrawer && !isClickOnToggle) {
          if (sidebar) sidebar.classList.remove('active');
          if (mobileNavDrawer) mobileNavDrawer.classList.remove('active');
          mobileMenuToggle.setAttribute('aria-expanded', 'false');
          
          // Reset icon
          const icon = mobileMenuToggle.querySelector('svg');
          if (icon) {
            icon.innerHTML = '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>';
          }
        }
      }
    });
  }

  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update URL without scrolling
        history.pushState(null, null, href);
      }
    });
  });
  
  // Add copy button to code blocks
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach(function(codeBlock) {
    const pre = codeBlock.parentElement;
    
    // Create wrapper for positioning
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    
    // Create copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = 'Copy';
    copyButton.setAttribute('aria-label', 'Copy code to clipboard');
    
    copyButton.addEventListener('click', function() {
      const code = codeBlock.textContent;
      
      navigator.clipboard.writeText(code).then(function() {
        copyButton.textContent = 'Copied!';
        setTimeout(function() {
          copyButton.textContent = 'Copy';
        }, 2000);
      }).catch(function(err) {
        console.error('Failed to copy:', err);
        copyButton.textContent = 'Failed';
        setTimeout(function() {
          copyButton.textContent = 'Copy';
        }, 2000);
      });
    });
    
    wrapper.appendChild(copyButton);
  });
  
  // Style for copy button
  const style = document.createElement('style');
  style.textContent = `
    .copy-button {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      background-color: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    .copy-button:hover {
      background-color: var(--color-background-alt);
    }
    
    pre:hover .copy-button {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
  
})();
