# Emma Docs Theme - Style Guide

**Version:** 1.0  
**Date:** October 26, 2025  
**Theme Name:** emma-docs

## Overview

The Emma Docs theme is a custom Hugo theme designed for the Emma Forms documentation website. It provides a clean, modern, and accessible interface optimized for technical documentation.

## Design Inspiration

The theme draws inspiration from:

1. **Emma Form Renderer Themes** - The CSS architecture follows the same principles used in `packages/form-renderer/themes/`:
   - Use of CSS custom properties (CSS variables) for theming
   - Clean, modern aesthetic with focus on usability
   - Consistent spacing and typography systems
   - Mobile-first responsive design

2. **Modern Documentation Sites** - Clean layouts with:
   - Persistent sidebar navigation
   - Clear content hierarchy
   - Readable typography with optimal line length
   - Accessible color contrast ratios

## Design System

### Color Palette

#### Primary Colors
- **Primary Blue**: `#3b82f6` - Used for links, active states, and CTAs
- **Primary Hover**: `#2563eb` - Darker blue for hover states
- **Primary Light**: `rgba(59, 130, 246, 0.1)` - Light blue for backgrounds

#### Neutral Colors
- **Text Primary**: `#1f2937` - Main body text (light mode)
- **Text Secondary**: `#6b7280` - Supporting text, metadata
- **Text Tertiary**: `#9ca3af` - Disabled states, placeholders
- **Background**: `#ffffff` - Main background (light mode)
- **Background Alt**: `#f9fafb` - Alternate backgrounds (code blocks, cards)
- **Border**: `#e5e7eb` - Subtle borders
- **Border Dark**: `#d1d5db` - More prominent borders

#### Semantic Colors
- **Success**: `#10b981` - Success messages
- **Error**: `#ef4444` - Error states
- **Warning**: `#f59e0b` - Warnings
- **Info**: `#3b82f6` - Informational messages

#### Dark Mode
The theme supports `prefers-color-scheme: dark` with automatically adjusted colors for better readability in dark environments.

### Typography

#### Font Families
- **Body Text**: System font stack for optimal performance
  ```css
  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
  ```
- **Code**: Monospace stack optimized for code readability
  ```css
  ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace
  ```

#### Font Sizes
Following a modular scale with rem units:
- `xs`: 0.75rem (12px)
- `sm`: 0.875rem (14px)
- `base`: 1rem (16px) - Default body text
- `lg`: 1.125rem (18px)
- `xl`: 1.25rem (20px)
- `2xl`: 1.5rem (24px)
- `3xl`: 1.875rem (30px)
- `4xl`: 2.25rem (36px)

#### Heading Hierarchy
- **H1**: 1.875rem (30px) - Page titles
- **H2**: 1.5rem (24px) - Major sections
- **H3**: 1.25rem (20px) - Subsections
- **H4**: 1.125rem (18px) - Minor sections
- **H5**: 1rem (16px) - Small headings
- **H6**: 0.875rem (14px) - Smallest headings

### Spacing System

Using a consistent 8px-based spacing scale:
- `xs`: 0.25rem (4px)
- `sm`: 0.5rem (8px)
- `md`: 1rem (16px) - Default spacing
- `lg`: 1.5rem (24px)
- `xl`: 2rem (32px)
- `2xl`: 3rem (48px)
- `3xl`: 4rem (64px)

### Layout

#### Dimensions
- **Max Content Width**: 1200px - Prevents overly wide layouts
- **Max Text Width**: 720px - Optimal reading line length (60-80 characters)
- **Sidebar Width**: 280px (desktop) / 240px (tablet)
- **Header Height**: 64px (desktop) / 56px (mobile)

#### Breakpoints
- **Mobile**: ≤ 768px
- **Tablet**: 769px - 1024px
- **Desktop**: ≥ 1025px

### Visual Effects

#### Border Radius
- Default: `6px` - Subtle roundness
- Large: `8px` - Cards and major components

#### Shadows
- **Small**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` - Subtle depth
- **Medium**: `0 4px 6px -1px rgba(0, 0, 0, 0.1)` - Cards
- **Large**: `0 10px 15px -3px rgba(0, 0, 0, 0.1)` - Modals, popovers

#### Transitions
- **Fast**: 150ms - Quick interactions
- **Base**: 200ms - Standard transitions

## Components

### Header
- Fixed positioning with shadow for depth
- Logo/site title on the left
- Navigation menu on the right
- Mobile hamburger menu for small screens
- GitHub icon link when configured

### Sidebar Navigation
- Sticky positioning on desktop
- Collapsible on mobile via hamburger menu
- Active page highlighting
- Section titles in uppercase with lighter color
- Smooth hover transitions

### Content Area
- Centered with max-width for readability
- Clear heading hierarchy
- Pagination links between pages
- Code blocks with copy-to-clipboard functionality

### Footer
- Copyright notice
- Author attribution
- "Powered by Hugo" credit

## Accessibility Features

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Visible focus indicators on all focusable elements
- Skip-to-content link for screen readers

### Screen Readers
- Semantic HTML5 elements
- ARIA labels where needed
- Proper heading hierarchy
- Alt text support for images

### Motion Sensitivity
- Respects `prefers-reduced-motion` media query
- Disables animations for users who prefer reduced motion

### Color Contrast
- All text meets WCAG AA standards (4.5:1 minimum)
- Links are distinguishable from body text
- Focus indicators are clearly visible

## Responsive Design

### Mobile-First Approach
The theme is built mobile-first, with enhancements for larger screens:

1. **Mobile (≤ 768px)**
   - Stacked layout (no sidebar)
   - Hamburger menu for navigation
   - Full-width content
   - Larger touch targets
   - Font size adjusted to prevent zoom on iOS (16px minimum)

2. **Tablet (769px - 1024px)**
   - Sidebar visible but narrower
   - Two-column layout
   - Optimized spacing

3. **Desktop (≥ 1025px)**
   - Full sidebar width
   - Maximum content width enforced
   - Optimal reading experience

## Technical Implementation

### CSS Architecture
- **CSS Custom Properties**: All design tokens defined as CSS variables
- **No Preprocessor**: Pure vanilla CSS for simplicity
- **BEM-like Naming**: Clear component-based class names
- **Progressive Enhancement**: Base functionality works without JS

### JavaScript Features
- Mobile menu toggle
- Smooth scroll for anchor links
- Copy-to-clipboard for code blocks
- All features are non-critical enhancements

### Performance
- System fonts for fast loading
- Minimal JavaScript (< 5KB)
- CSS loaded in head for no FOUC
- No external dependencies

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

Potential improvements for future versions:
- Search functionality
- Dark mode toggle (manual switch in addition to auto)
- Table of contents for long pages
- Syntax highlighting themes
- Print stylesheet
- Breadcrumb navigation

## Maintenance Notes

### Updating Colors
All colors are defined in CSS variables in `static/css/main.css`. Update the `:root` selector to change the theme colors globally.

### Adding New Components
Follow the existing component structure:
1. Add styles in the appropriate section of `main.css`
2. Create partial template if needed in `layouts/partials/`
3. Document component usage in this guide

### Testing Checklist
When making changes, test:
- [ ] Desktop layout (1200px+)
- [ ] Tablet layout (768px-1024px)
- [ ] Mobile layout (≤ 768px)
- [ ] Dark mode appearance
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

## Credits

Designed and implemented for the Emma Forms project.
- Design: Inspired by Emma form renderer themes
- Implementation: Vanilla CSS and Hugo templates
- Icons: Inline SVG (GitHub icon, menu icons)
