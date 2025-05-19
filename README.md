# TabindexManager.js - WCAG 2.3 AA Compliance Tool

## Overview

TabindexManager.js is a JavaScript utility designed to fix common tabindex issues on websites to ensure WCAG 2.3 AA compliance. This tool helps improve keyboard accessibility by creating a logical tab order, ensuring all interactive elements are keyboard accessible, and managing focus for dialogs and modals. It provides extended support for JSP applications, dynamic content, wizards, and complex UI components.

## Features

- Automatically corrects improper tabindex values
- Ensures all interactive elements are keyboard accessible
- Removes unnecessary tabindex from non-interactive elements
- Provides focus trapping for modals and dialogs
- Analyzes and reports on tab order issues
- Manages dynamic content loaded via AJAX or JSP
- Supports multi-step wizards and form flows
- Handles JSP-specific components and interactions
- Provides keyboard accessibility for autocomplete components
- Supports tooltips and dropdown menus

## WCAG Requirements Addressed

This tool specifically addresses the following WCAG 2.3 AA requirements:

- **2.1.1 Keyboard:** All functionality is operable through a keyboard interface
- **2.4.3 Focus Order:** The navigation order of focusable elements is logical and intuitive
- **2.4.7 Focus Visible:** Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible
- **3.2.1 On Focus:** When any user interface component receives focus, it does not initiate a change of context
- **4.1.2 Name, Role, Value:** For all user interface components, the name and role can be programmatically determined

## Installation

Simply include the script in your HTML:

```html
<script src="TabindexManager.js"></script>
```

Or import it as a module:

```javascript
import TabindexManager from './TabindexManager.js';
```

## Basic Usage

```javascript
// Initialize with default options
const tabManager = new TabindexManager();

// Fix tabindex issues across the page
tabManager.fix();
```

## Advanced Usage

### Custom Options

```javascript
// Initialize with custom options
const tabManager = new TabindexManager({
  container: '#main-content',                // Only fix issues within this container
  fixNegativeTabindex: true,                 // Fix elements with tabindex="-1"
  fixHighTabindex: true,                     // Fix elements with tabindex values greater than 0
  ensureInteractiveElements: true,           // Ensure all interactive elements are tabbable
  enableMutationObserver: true,              // Watch for DOM changes and fix automatically
  enableDynamicContentSupport: true,         // Add support for dynamically loaded content
  focusFirstElementInDynamicContent: true,   // Focus first element in new content
  returnFocusOnDynamicContentClose: true,    // Return focus when content is closed
  supportWizardNavigation: true,             // Support keyboard navigation in wizards
  handleTooltipsAndDropdowns: true           // Add keyboard support for tooltips and dropdowns
});

// Fix tabindex issues
tabManager.fix();
```

### JSP Application Support

```javascript
// Initialize the TabindexManager
const tabManager = new TabindexManager({
  enableDynamicContentSupport: true
});

// Fix general tabindex issues
tabManager.fix();

// Set up JSP-specific component handling
tabManager.handleJspComponents({
  jspFormSelector: 'form[action$=".jsp"]',
  jspErrorSelector: '.error-message, .validation-error'
});

// Set up handling for JSP modals
tabManager.setupJspModalHandling();

// Set up handling for multi-step wizards
tabManager.setupJspWizards();

// Set up autocomplete components
tabManager.setupAccessibleAutocomplete(document.body);
```

### Dynamic Content Handling

```javascript
// Initialize with dynamic content support
const tabManager = new TabindexManager({
  enableMutationObserver: true,
  enableDynamicContentSupport: true
});

tabManager.fix();

// For manual AJAX updates
document.addEventListener('ajax:complete', (event) => {
  // Process dynamic content after AJAX updates
  tabManager.processDynamicContent(document.body);
});
```

### Focus Trapping for Modals

```javascript
// Get the modal element
const modal = document.getElementById('myModal');
const triggerButton = document.getElementById('openModalBtn');

// Set up focus trapping when opening the modal
const focusTrap = tabManager.setupFocusTrap(modal, {
  triggerElement: triggerButton,
  returnFocusOnClose: true
});

// When the modal closes
closeButton.addEventListener('click', () => {
  modal.style.display = 'none';
  focusTrap.remove();
});

// If the modal's content changes dynamically
updateModalContentBtn.addEventListener('click', () => {
  // Update modal content here...
  
  // Then update the focus trap's tabbable elements
  focusTrap.updateTabbableElements();
});
```

## Key Methods

| Method | Description |
|--------|-------------|
| `fix()` | Identifies and fixes all tabindex issues within the specified container |
| `setupFocusTrap(modalElement, options)` | Creates a focus trap within a modal or dialog element |
| `analyzeTabOrder(container)` | Analyzes and logs the tab order of all tabbable elements |
| `processDynamicContent(container)` | Processes newly added content for tabindex issues |
| `handleJspComponents(options)` | Sets up handling for JSP-specific components |
| `setupJspModalHandling(options)` | Sets up handling for modal popups in JSP applications |
| `setupJspWizards(options)` | Sets up handling for multi-step wizards in JSP applications |
| `setupAccessibleAutocomplete(container)` | Makes autocomplete components keyboard accessible |

## Use Cases Addressed

1. **Dynamic Content Loading:** Ensures that content loaded via AJAX or JSP updates maintains keyboard accessibility.

2. **Modal Dialogs:** Traps focus within modals and returns focus to the trigger element when closed.

3. **Multi-step Wizards:** Provides keyboard navigation between steps and ensures focus moves to the appropriate elements.

4. **Tooltips and Dropdowns:** Adds keyboard support for interactive UI components that typically rely on mouse interaction.

5. **Form Validation:** Moves focus to error messages or invalid fields when validation fails.

6. **Pagination:** Maintains focus position when content changes due to pagination.

7. **Autocomplete Components:** Makes autocomplete fields fully accessible via keyboard.

8. **Dynamic Forms:** Manages focus when form fields are conditionally shown or hidden.

9. **Infinite Scrolling:** Maintains keyboard focus position when new content is loaded through infinite scrolling.

10. **Tab Panels:** Enables keyboard navigation between tabs and ensures focus is properly managed when switching panels.

11. **Accordion Components:** Provides keyboard support for expanding and collapsing accordion sections.

12. **Data Tables with Sorting/Filtering:** Maintains focus when table data is reordered or filtered.

13. **Tree Views:** Enables keyboard navigation for hierarchical tree view components.

14. **File Upload Controls:** Makes custom file upload controls keyboard accessible.

15. **Date Pickers:** Ensures date picker components can be fully operated with a keyboard.

## Common Tabindex Issues Fixed

1. **Negative Tabindex:** Elements with `tabindex="-1"` that should be keyboard accessible.
2. **High Tabindex Values:** Elements with `tabindex` values greater than 0, which can disrupt tab order.
3. **Missing Tabindex:** Interactive elements that need a tabindex to be keyboard accessible.
4. **Unnecessary Tabindex:** Non-interactive elements with tabindex that don't need it.
5. **Lost Focus:** Focus getting lost during dynamic content updates.
6. **Focus Trapping:** Focus not being trapped within modal dialogs.
7. **Return Focus:** Focus not returning to trigger elements after dialogs close.
8. **Missing Keyboard Support:** Interactive components only accessible via mouse.

## JSP-Specific Features

JSP applications often have unique challenges for keyboard accessibility:

1. **Server-rendered Content:** The tool handles content that is dynamically rendered server-side through JSP.
2. **Form Validation:** Manages focus when server-side validation returns error messages.
3. **Modal Popups:** Handles JSP-specific modal implementations, which may use unique selectors or patterns.
4. **Multi-step Forms:** Provides keyboard navigation for JSP-based multi-step forms and wizards.
5. **AJAX Updates:** Handles content loaded asynchronously via AJAX in JSP applications.

## Implementation for Key UI Patterns

### Modal Dialogs

```javascript
// Set up all modals on the page
document.querySelectorAll('.modal, [role="dialog"]').forEach(modal => {
  // Find the trigger button
  const triggerId = modal.getAttribute('data-trigger-id');
  const trigger = triggerId ? document.getElementById(triggerId) : null;
  
  // Set up the focus trap
  const focusTrap = tabManager.setupFocusTrap(modal, {
    triggerElement: trigger,
    returnFocusOnClose: true
  });
  
  // Store the removal function on the modal
  modal._removeFocusTrap = focusTrap.remove;
  
  // Set up close button
  modal.querySelector('.close-btn').addEventListener('click', () => {
    modal.style.display = 'none';
    modal._removeFocusTrap();
  });
});
```

### Multi-step Wizards

```javascript
// Set up wizards with proper keyboard navigation
tabManager.setupJspWizards({
  wizardSelectors: ['.wizard', '.stepper', '.multi-step-form']
});

// Or manually set up a specific wizard
const wizard = document.querySelector('#registration-wizard');
const steps = wizard.querySelectorAll('.step');
const contents = wizard.querySelectorAll('.step-content');

// Add keyboard support
wizard.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') {
    // Move to next step...
    // Ensure focus moves to the first interactive element
  } else if (event.key === 'ArrowLeft') {
    // Move to previous step...
    // Ensure focus is properly managed
  }
});
```

### Autocomplete Components

```javascript
// Make all autocomplete components accessible
tabManager.setupAccessibleAutocomplete(document.body);

// Future updates can be processed as well
document.addEventListener('content-updated', (event) => {
  // Process new autocomplete components
  tabManager.setupAccessibleAutocomplete(event.detail.container);
});
```

## Best Practices for Dynamic Content

When working with dynamic content in JSP applications:

1. **Process After Updates:** Always process content after dynamic updates
   ```javascript
   document.addEventListener('ajax:complete', (event) => {
     tabManager.processDynamicContent(document.body);
   });
   ```

2. **Manage Focus:** Explicitly move focus when content changes
   ```javascript
   function updateContentArea(newContent) {
     const contentArea = document.getElementById('content-area');
     contentArea.innerHTML = newContent;
     
     // Process for accessibility
     tabManager.processDynamicContent(contentArea);
     
     // Focus the first interactive element
     const firstInteractive = contentArea.querySelector('a, button, input, select');
     if (firstInteractive) {
       firstInteractive.focus();
     }
   }
   ```

3. **Update Focus Traps:** Update focus traps when modal content changes
   ```javascript
   function updateModalContent(modal, newContent) {
     const contentArea = modal.querySelector('.modal-content');
     contentArea.innerHTML = newContent;
     
     // Update the focus trap if it exists
     if (modal._focusTrap && modal._focusTrap.updateTabbableElements) {
       modal._focusTrap.updateTabbableElements();
     }
   }
   ```

## Browser Compatibility

Compatible with all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 10.1+
- Edge 18+

## Testing

After implementing the TabindexManager, it's recommended to test your website with a keyboard-only navigation test to verify the tab order is logical and all interactive elements are accessible.

For JSP applications, be sure to test:
1. Server-rendered form validation
2. AJAX-loaded content
3. Multi-step wizards
4. Modal dialogs
5. Dynamic form fields

## License

MIT License
# TabindexManager.js - WCAG 2.3 AA Compliance Tool

## Overview

TabindexManager.js is a JavaScript utility designed to fix common tabindex issues on websites to ensure WCAG 2.3 AA compliance. This tool helps improve keyboard accessibility by creating a logical tab order, ensuring all interactive elements are keyboard accessible, and managing focus for dialogs and modals.

## Features

- Automatically corrects improper tabindex values
- Ensures all interactive elements are keyboard accessible
- Removes unnecessary tabindex from non-interactive elements
- Provides focus trapping for modals and dialogs
- Analyzes and reports on tab order issues

## WCAG Requirements Addressed

This tool specifically addresses the following WCAG 2.3 AA requirements:

- **2.1.1 Keyboard:** All functionality is operable through a keyboard interface
- **2.4.3 Focus Order:** The navigation order of focusable elements is logical and intuitive
- **2.4.7 Focus Visible:** Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible

## Installation

Simply include the script in your HTML:

```html
<script src="TabindexManager.js"></script>
```

Or import it as a module:

```javascript
import TabindexManager from './TabindexManager.js';
```

## Basic Usage

```javascript
// Initialize with default options
const tabManager = new TabindexManager();

// Fix tabindex issues across the page
tabManager.fix();
```

## Advanced Usage

### Custom Options

```javascript
// Initialize with custom options
const tabManager = new TabindexManager({
  container: '#main-content', // Only fix issues within this container
  fixNegativeTabindex: true,  // Fix elements with tabindex="-1"
  fixHighTabindex: true,      // Fix elements with tabindex values greater than 0
  ensureInteractiveElements: true // Ensure all interactive elements are tabbable
});

// Fix tabindex issues
tabManager.fix();
```

### Focus Trapping for Modals

```javascript
// Get the modal element
const modal = document.getElementById('myModal');

// Set up focus trapping when opening the modal
const removeFocusTrap = tabManager.setupFocusTrap(modal);

// Remove the focus trap when closing the modal
closeButton.addEventListener('click', () => {
  modal.style.display = 'none';
  removeFocusTrap();
});
```

## Methods

| Method | Description |
|--------|-------------|
| `fix()` | Identifies and fixes all tabindex issues within the specified container |
| `setupFocusTrap(modalElement)` | Creates a focus trap within a modal or dialog element |
| `analyzeTabOrder(container)` | Analyzes and logs the tab order of all tabbable elements |

## Common Tabindex Issues Fixed

1. **Negative Tabindex:** Elements with `tabindex="-1"` that should be keyboard accessible
2. **High Tabindex Values:** Elements with `tabindex` values greater than 0, which can disrupt tab order
3. **Missing Tabindex:** Interactive elements that need a tabindex to be keyboard accessible
4. **Unnecessary Tabindex:** Non-interactive elements with tabindex that don't need it

## Browser Compatibility

Compatible with all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 10.1+
- Edge 18+

## Testing

After implementing the TabindexManager, it's recommended to test your website with a keyboard-only navigation test to verify the tab order is logical and all interactive elements are accessible.

## License

MIT License
