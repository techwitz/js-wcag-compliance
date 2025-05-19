  /**
   * Handle JSP specific view and component interactions
   * @param {Object} options - Configuration options
   * @param {string} options.jspFormSelector - Selector for JSP forms
   * @param {string} options.jspErrorSelector - Selector for JSP error messages
   */
  handleJspComponents(options = {}) {
    const jspFormSelector = options.jspFormSelector || 'form[action$=".jsp"]';
    const jspErrorSelector = options.jspErrorSelector || '.error-message, .validation-error';
    
    // Handle JSP forms
    document.querySelectorAll(jspFormSelector).forEach(form => {
      // Add form validation error handling
      form.addEventListener('submit', event => {
        // Check if the form has client-side validation
        if (form.hasAttribute('data-validate') || form.classList.contains('validate-form')) {
          // After validation (in a setTimeout to allow validation to complete)
          setTimeout(() => {
            // Check for error messages
            const errorMessages = form.querySelectorAll(jspErrorSelector);
            if (errorMessages.length > 0) {
              // Focus the first error message or the field with the error
              const firstErrorField = form.querySelector('.has-error input, .invalid input, input.error');
              if (firstErrorField) {
                firstErrorField.focus();
              } else {
                errorMessages[0].setAttribute('tabindex', '-1');
                errorMessages[0].focus();
                // Remove tabindex after focus
                setTimeout(() => {
                  errorMessages[0].removeAttribute('tabindex');
                }, 100);
              }
            }
          }, 100);
        }
      });
      
      // Handle dynamically loaded content in JSP forms
      form.addEventListener('ajax:success', () => {
        this.processDynamicContent(form);
      });
    });
    
    // Handle JSP ajax pagination
    document.querySelectorAll('.pagination a, .pager a').forEach(link => {
      link.addEventListener('click', () => {
        // After pagination content loads
        setTimeout(() => {
          const paginationContainer = link.closest('.pagination-container, .paginated-content');
          if (paginationContainer) {
            this.processDynamicContent(paginationContainer);
            
            // Focus the first item in the new page content
            const contentItems = paginationContainer.querySelectorAll('.item, .list-item, tr, .content-item');
            if (contentItems.length > 0) {
              contentItems[0].setAttribute('tabindex', '-1');
              contentItems[0].focus();
              // Remove tabindex after focus
              setTimeout(() => {
                contentItems[0].removeAttribute('tabindex');
              }, 100);
            }
          }
        }, 300);
      });
    });
  }
  
  /**
   * Set up handling for modal popups specific to JSP applications
   * @param {Object} options - Configuration options
   */
  setupJspModalHandling(options = {}) {
    // Common JSP modal selectors
    const modalSelectors = options.modalSelectors || [
      '.modal', '.popup', '.dialog', '.overlay',
      '[role="dialog"]', '[role="alertdialog"]'
    ];
    
    // Common modal trigger selectors
    const triggerSelectors = options.triggerSelectors || [
      '[data-toggle="modal"]', '[data-target]', '.modal-trigger',
      '[data-open-modal]', '.open-dialog', '.popup-trigger'
    ];
    
    // Get all modal triggers
    document.querySelectorAll(triggerSelectors.join(',')).forEach(trigger => {
      trigger.addEventListener('click', () => {
        // Find the target modal
        let targetModal = null;
        
        // Check different methods for identifying the target modal
        
        // Method 1: data-target attribute
        if (trigger.hasAttribute('data-target')) {
          const targetSelector = trigger.getAttribute('data-target');
          targetModal = document.querySelector(targetSelector);
        }
        
        // Method 2: href attribute for links
        if (!targetModal && trigger.tagName === 'A' && trigger.hasAttribute('href')) {
          const href = trigger.getAttribute('href');
          if (href.startsWith('#')) {
            targetModal = document.querySelector(href);
          }
        }
        
        // Method 3: data-modal or data-dialog attribute
        if (!targetModal && (trigger.hasAttribute('data-modal') || trigger.hasAttribute('data-dialog'))) {
          const modalId = trigger.getAttribute('data-modal') || trigger.getAttribute('data-dialog');
          targetModal = document.getElementById(modalId);
        }
        
        if (targetModal) {
          // Wait for the modal to be visible
          setTimeout(() => {
            // Set up focus trapping
            const focusTrap = this.setupFocusTrap(targetModal, {
              triggerElement: trigger,
              returnFocusOnClose: true
            });
            
            // Store the focus trap removal function
            targetModal._removeFocusTrap = focusTrap.remove;
            
            // Handle modal close events
            const closeButtons = targetModal.querySelectorAll(
              '.close, .modal-close, [data-dismiss], .btn-close, .cancel-btn'
            );
            
            closeButtons.forEach(button => {
              button.addEventListener('click', () => {
                if (targetModal._removeFocusTrap) {
                  targetModal._removeFocusTrap();
                }
              });
            });
          }, 100);
        }
      });
    });
    
    // Handle dynamically loaded modals
    // Many JSP applications load modals via AJAX
    document.addEventListener('ajax:complete', event => {
      setTimeout(() => {
        // Check if the response contains a modal
        modalSelectors.forEach(selector => {
          const newModals = document.querySelectorAll(`${selector}:not([data-accessibility-processed])`);
          
          newModals.forEach(modal => {
            // Mark as processed
            modal.setAttribute('data-accessibility-processed', 'true');
            
            // Set up focus trapping when the modal is shown
            const observer = new MutationObserver(mutations => {
              mutations.forEach(mutation => {
                if (mutation.type === 'attributes') {
                  // Check if the modal became visible
                  if (!this.isVisuallyHidden(modal) && !modal._focusTrapActive) {
                    modal._focusTrapActive = true;
                    
                    const focusTrap = this.setupFocusTrap(modal, {
                      returnFocusOnClose: true
                    });
                    
                    modal._removeFocusTrap = focusTrap.remove;
                  }
                  // Check if the modal became hidden
                  else if (this.isVisuallyHidden(modal) && modal._focusTrapActive) {
                    if (modal._removeFocusTrap) {
                      modal._removeFocusTrap();
                    }
                    modal._focusTrapActive = false;
                  }
                }
              });
            });
            
            observer.observe(modal, {
              attributes: true,
              attributeFilter: ['class', 'style', 'hidden', 'aria-hidden']
            });
          });
        });
      }, 200);
    });
  }
  
  /**
   * Handle multi-step wizards in JSP applications
   * @param {Object} options - Configuration options
   */
  setupJspWizards(options = {}) {
    // Common JSP wizard selectors
    const wizardSelectors = options.wizardSelectors || [
      '.wizard', '.stepper', '.multi-step-form', '.form-wizard',
      '[data-wizard]', '[data-stepper]'
    ];
    
    document.querySelectorAll(wizardSelectors.join(',')).forEach(wizard => {
      // Skip if already processed
      if (wizard.hasAttribute('data-wizard-processed')) {
        return;
      }
      
      wizard.setAttribute('data-wizard-processed', 'true');
      
      // Find elements for this wizard
      const steps = wizard.querySelectorAll('.step, .wizard-step, [data-step]');
      const nextButtons = wizard.querySelectorAll('.next, .btn-next, [data-action="next"]');
      const prevButtons = wizard.querySelectorAll('.prev, .btn-previous, [data-action="prev"]');
      const stepContents = wizard.querySelectorAll('.step-content, .wizard-content, [data-step-content]');
      
      // Create a state object to track the wizard
      wizard._wizardState = {
        currentStepIndex: 0,
        steps: Array.from(steps),
        contents: Array.from(stepContents)
      };
      
      // Function to handle step navigation
      const navigateToStep = (newIndex, focusManagement = true) => {
        // Validate the index
        if (newIndex < 0 || newIndex >= wizard._wizardState.steps.length) {
          return;
        }
        
        const currentIndex = wizard._wizardState.currentStepIndex;
        
        // Update classes on steps
        wizard._wizardState.steps.forEach((step, index) => {
          if (index < newIndex) {
            step.classList.remove('active', 'current');
            step.classList.add('completed');
            step.setAttribute('aria-selected', 'false');
          } else if (index === newIndex) {
            step.classList.add('active', 'current');
            step.classList.remove('completed');
            step.setAttribute('aria-selected', 'true');
          } else {
            step.classList.remove('active', 'current', 'completed');
            step.setAttribute('aria-selected', 'false');
          }
        });
        
        // Update content visibility
        wizard._wizardState.contents.forEach((content, index) => {
          if (index === newIndex) {
            content.classList.add('active');
            content.setAttribute('aria-hidden', 'false');
            
            // Focus management
            if (focusManagement) {
              // If moving forward, focus the first field
              if (newIndex > currentIndex) {
                const firstInput = content.querySelector('input, select, textarea, button, a, [tabindex]');
                if (firstInput) {
                  setTimeout(() => {
                    firstInput.focus();
                  }, 50);
                } else {
                  content.setAttribute('tabindex', '-1');
                  content.focus();
                  setTimeout(() => {
                    content.removeAttribute('tabindex');
                  }, 100);
                }
              }
              // If moving backward, focus the last field
              else if (newIndex < currentIndex) {
                const inputs = content.querySelectorAll('input, select, textarea, button, a, [tabindex]');
                if (inputs.length > 0) {
                  setTimeout(() => {
                    inputs[inputs.length - 1].focus();
                  }, 50);
                } else {
                  content.setAttribute('tabindex', '-1');
                  content.focus();
                  setTimeout(() => {
                    content.removeAttribute('tabindex');
                  }, 100);
                }
              }
            }
          } else {
            content.classList.remove('active');
            content.setAttribute('aria-hidden', 'true');
          }
        });
        
        // Update the current step index
        wizard._wizardState.currentStepIndex = newIndex;
        
        // Update the wizard's live region to announce the step change
        let announcement = wizard.querySelector('.wizard-announcement');
        if (!announcement) {
          announcement = document.createElement('div');
          announcement.className = 'wizard-announcement sr-only';
          announcement.setAttribute('aria-live', 'polite');
          announcement.setAttribute('aria-atomic', 'true');
          wizard.appendChild(announcement);
        }
        
        // Announce the step change
        const stepNumber = newIndex + 1;
        const totalSteps = wizard._wizardState.steps.length;
        announcement.textContent = `Step ${stepNumber} of ${totalSteps}`;
      };
      
      // Set up click handlers for steps (if they're clickable)
      steps.forEach((step, index) => {
        // Only handle clicks for steps that should be clickable
        if (!step.classList.contains('disabled') && !step.hasAttribute('disabled')) {
          step.addEventListener('click', () => {
            navigateToStep(index);
          });
          
          // Ensure keyboard accessibility
          if (!step.hasAttribute('tabindex')) {
            step.setAttribute('tabindex', '0');
          }
          
          step.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              navigateToStep(index);
            }
          });
        }
      });
      
      // Set up next/previous button handlers
      nextButtons.forEach(button => {
        button.addEventListener('click', () => {
          const currentIndex = wizard._wizardState.currentStepIndex;
          navigateToStep(currentIndex + 1);
        });
      });
      
      prevButtons.forEach(button => {
        button.addEventListener('click', () => {
          const currentIndex = wizard._wizardState.currentStepIndex;
          navigateToStep(currentIndex - 1);
        });
      });
      
      // Set up keyboard navigation for the wizard
      wizard.addEventListener('keydown', event => {
        // Only handle keyboard navigation when inside the wizard steps
        if (!event.target.closest('.step, .wizard-step, [data-step]')) {
          return;
        }
        
        const currentIndex = wizard._wizardState.currentStepIndex;
        
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          navigateToStep(currentIndex + 1);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          navigateToStep(currentIndex - 1);
        }
      });
      
      // Initialize the wizard
      navigateToStep(0, false);
    });
  }
  
  /**
   * Handle accessible autocomplete components
   * @param {Element} container - The container to search in
   */
  setupAccessibleAutocomplete(container) {
    // Look for autocomplete inputs
    const autocompleteInputs = container.querySelectorAll(
      'input[role="combobox"], input.autocomplete, .autocomplete input, ' +
      'input[list], input[data-autocomplete]'
    );
    
    autocompleteInputs.forEach(input => {
      // Skip if already processed
      if (input.hasAttribute('data-autocomplete-processed')) {
        return;
      }
      
      input.setAttribute('data-autocomplete-processed', 'true');
      
      // Ensure ARIA attributes are set correctly
      if (input.getAttribute('role') !== 'combobox') {
        input.setAttribute('role', 'combobox');
      }
      
      if (!input.hasAttribute('aria-autocomplete')) {
        input.setAttribute('aria-autocomplete', 'list');
      }
      
      if (!input.hasAttribute('aria-expanded')) {
        input.setAttribute('aria-expanded', 'false');
      }
      
      // Find or create the suggestion list
      let suggestionList = null;
      
      // Method 1: Check for list attribute
      if (input.hasAttribute('list')) {
        const listId = input.getAttribute('list');
        suggestionList = document.getElementById(listId);
        
        // If this is a datalist, convert it to an ARIA-compatible list
        if (suggestionList && suggestionList.tagName === 'DATALIST') {
          const newList = document.createElement('ul');
          newList.id = listId + '-accessible';
          newList.className = 'autocomplete-list';
          newList.setAttribute('role', 'listbox');
          newList.style.display = 'none';
          
          // Convert options to list items
          const options = suggestionList.querySelectorAll('option');
          options.forEach(option => {
            const listItem = document.createElement('li');
            listItem.setAttribute('role', 'option');
            listItem.setAttribute('tabindex', '-1');
            listItem.textContent = option.value;
            newList.appendChild(listItem);
          });
          
          // Insert the new list after the input
          input.parentNode.insertBefore(newList, input.nextSibling);
          
          // Update reference to the new list
          suggestionList = newList;
          
          // Update ARIA attributes
          input.setAttribute('aria-controls', listId + '-accessible');
          input.removeAttribute('list'); // Remove the list attribute to prevent duplicates
        }
      }
      
      // Method 2: Check for a sibling list
      if (!suggestionList) {
        suggestionList = input.nextElementSibling;
        if (suggestionList && !suggestionList.matches('ul, ol, div[role="listbox"]')) {
          suggestionList = null;
        }
      }
      
      // Method 3: Look for a specific ID pattern
      if (!suggestionList) {
        const inputId = input.id || input.name;
        if (inputId) {
          const potentialIds = [
            inputId + '-list',
            inputId + '-suggestions',
            inputId + '-autocomplete',
            'suggestions-' + inputId,
            'list-' + inputId
          ];
          
          for (const id of potentialIds) {
            suggestionList = document.getElementById(id);
            if (suggestionList) break;
          }
        }
      }
      
      // If we found a suggestion list, set up keyboard interactions
      if (suggestionList) {
        // Ensure the list has the right ARIA attributes
        if (!suggestionList.hasAttribute('role')) {
          suggestionList.setAttribute('role', 'listbox');
        }
        
        // Link the input to the list
        const listId = suggestionList.id || 'autocomplete-list-' + this.generateUniqueId();
        suggestionList.id = listId;
        input.setAttribute('aria-controls', listId);
        
        // Get all option elements
        const optionElements = suggestionList.querySelectorAll('li, option, [role="option"]');
        
        // Set up keyboard navigation for the list
        let activeIndex = -1;
        
        input.addEventListener('keydown', event => {
          // Handle list navigation
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            
            // If the list is not expanded, expand it
            if (input.getAttribute('aria-expanded') !== 'true') {
              input.setAttribute('aria-expanded', 'true');
              suggestionList.style.display = '';
            }
            
            // Move to the next item
            activeIndex = Math.min(activeIndex + 1, optionElements.length - 1);
            updateActiveOption();
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            
            // Move to the previous item
            activeIndex = Math.max(activeIndex - 1, -1);
            updateActiveOption();
            
            // If we moved back to the input, collapse the list
            if (activeIndex === -1) {
              input.setAttribute('aria-expanded', 'false');
              suggestionList.style.display = 'none';
            }
          } else if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault();
            
            // Select the current option
            const selectedOption = optionElements[activeIndex];
            input.value = selectedOption.textContent;
            
            // Collapse the list
            input.setAttribute('aria-expanded', 'false');
            suggestionList.style.display = 'none';
            activeIndex = -1;
          } else if (event.key === 'Escape') {
            // Collapse the list
            input.setAttribute('aria-expanded', 'false');
            suggestionList.style.display = 'none';
            activeIndex = -1;
          }
        });
        
        // Update the active option visually and with ARIA
        const updateActiveOption = () => {
          optionElements.forEach((option, index) => {
            if (index === activeIndex) {
              option.classList.add('active', 'selected');
              option.setAttribute('aria-selected', 'true');
              option.scrollIntoView({ block: 'nearest' });
            } else {
              option.classList.remove('active', 'selected');
              option.setAttribute('aria-selected', 'false');
            }
          });
          
          // Update the active descendant
          if (activeIndex >= 0) {
            const activeId = optionElements[activeIndex].id || 
                            `${listId}-option-${activeIndex}`;
            optionElements[activeIndex].id = activeId;
            input.setAttribute('aria-activedescendant', activeId);
          } else {
            input.removeAttribute('aria-activedescendant');
          }
        };
        
        // Handle input focus and blur
        input.addEventListener('focus', () => {
          // Some autocomplete implementations show the list on focus
          const showOnFocus = input.hasAttribute('data-show-on-focus') || 
                             input.classList.contains('show-on-focus');
          
          if (showOnFocus) {
            input.setAttribute('aria-expanded', 'true');
            suggestionList.style.display = '';
          }
        });
        
        input.addEventListener('blur', event => {
          // Don't hide the list if focus moved to an option in the list
          if (event.relatedTarget && event.relatedTarget.closest('#' + listId)) {
            return;
          }
          
          // Hide the list after a small delay
          setTimeout(() => {
            input.setAttribute('aria-expanded', 'false');
            suggestionList.style.display = 'none';
            activeIndex = -1;
          }, 150);
        });
        
        // Handle clicks on options
        optionElements.forEach((option, index) => {
          option.addEventListener('click', () => {
            input.value = option.textContent;
            input.setAttribute('aria-expanded', 'false');
            suggestionList.style.display = 'none';
            activeIndex = -1;
            input.focus();
          });
          
          option.addEventListener('mouseover', () => {
            activeIndex = index;
            updateActiveOption();
          });
        });
      }
    });
  }
  
  /**
   * Generate a unique ID for accessibility purposes
   * @returns {string} - A unique ID
   */
  generateUniqueId() {
    return 'a11y-' + Math.random().toString(36).substring(2, 9);
  }/**
 * TabindexManager.js
 * 
 * A utility to handle tabindex issues for WCAG 2.3 AA compliance
 * 
 * This script helps to:
 * 1. Fix improper tabindex values
 * 2. Create a logical tab order for interactive elements
 * 3. Ensure all interactive elements are keyboard accessible
 * 4. Manage focus trapping in modals and dialogs
 * 5. Support dynamic content (JSP, AJAX, SPA updates)
 * 6. Handle multi-step wizards and form flows
 * 7. Manage complex interactive components
 */

class TabindexManager {
  /**
   * Initialize the TabindexManager
   * @param {Object} options - Configuration options
   * @param {string} options.container - The container selector to apply fixes to (default: 'body')
   * @param {boolean} options.fixNegativeTabindex - Whether to fix negative tabindex values (default: true)
   * @param {boolean} options.fixHighTabindex - Whether to fix high tabindex values (default: true)
   * @param {boolean} options.ensureInteractiveElements - Whether to ensure all interactive elements are tabbable (default: true)
   */
  constructor(options = {}) {
    this.container = options.container || 'body';
    this.fixNegativeTabindex = options.fixNegativeTabindex !== false;
    this.fixHighTabindex = options.fixHighTabindex !== false;
    this.ensureInteractiveElements = options.ensureInteractiveElements !== false;
    this.enableMutationObserver = options.enableMutationObserver !== false;
    this.enableDynamicContentSupport = options.enableDynamicContentSupport !== false;
    this.focusFirstElementInDynamicContent = options.focusFirstElementInDynamicContent !== false;
    this.returnFocusOnDynamicContentClose = options.returnFocusOnDynamicContentClose !== false;
    this.supportWizardNavigation = options.supportWizardNavigation !== false;
    this.handleTooltipsAndDropdowns = options.handleTooltipsAndDropdowns !== false;
    
    // Selectors for interactive elements that should be keyboard accessible
    this.interactiveSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[role="button"]',
      '[role="checkbox"]',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="option"]',
      '[role="radio"]',
      '[role="switch"]',
      '[role="tab"]',
      '[contenteditable="true"]',
      // Additional selectors for complex UI components
      '[role="dialog"]',
      '[role="alertdialog"]',
      '[role="tooltip"]',
      '[role="navigation"]',
      '[role="menu"]',
      '[role="tablist"]',
      '[role="combobox"]',
      '[role="listbox"]',
      '[role="tree"]',
      '[role="grid"]',
      'details summary',
      '.dropdown-toggle',
      '.accordion-header',
      '.carousel-control'
    ];
    
    this.nonInteractiveWithTabindex = [
      'div[tabindex]',
      'span[tabindex]',
      'p[tabindex]',
      'h1[tabindex]',
      'h2[tabindex]',
      'h3[tabindex]',
      'h4[tabindex]',
      'h5[tabindex]',
      'h6[tabindex]'
    ];
  }

  /**
   * Start fixing tabindex issues
   */
  fix() {
    const container = document.querySelector(this.container);
    if (!container) {
      console.error(`Container ${this.container} not found`);
      return;
    }

    if (this.fixNegativeTabindex) {
      this.fixNegativeTabindexValues(container);
    }
    
    if (this.fixHighTabindex) {
      this.fixHighTabindexValues(container);
    }
    
    if (this.ensureInteractiveElements) {
      this.makeInteractiveElementsTabbable(container);
    }
    
    this.validateNonInteractiveElements(container);
    this.analyzeTabOrder(container);
    
    // Set up observers for dynamic content if enabled
    if (this.enableMutationObserver) {
      this.setupMutationObserver(container);
    }
    
    // Handle dynamic content loading events if enabled
    if (this.enableDynamicContentSupport) {
      this.setupDynamicContentHandlers();
    }
    
    // Setup wizard navigation support if enabled
    if (this.supportWizardNavigation) {
      this.setupWizardNavigationSupport(container);
    }
    
    // Setup handlers for tooltips and dropdowns if enabled
    if (this.handleTooltipsAndDropdowns) {
      this.setupTooltipAndDropdownHandlers(container);
    }
  }

  /**
   * Fix elements with negative tabindex values
   * @param {Element} container - The container element
   */
  fixNegativeTabindexValues(container) {
    const elements = container.querySelectorAll('[tabindex="-1"]');
    elements.forEach(element => {
      // Only fix if it's an interactive element that should be tabbable
      if (this.isInteractiveElement(element) && !this.shouldBeRemovedFromTabOrder(element)) {
        element.setAttribute('tabindex', '0');
        console.log('Fixed negative tabindex on element:', element);
      }
    });
  }

  /**
   * Fix elements with high tabindex values (greater than 0)
   * @param {Element} container - The container element
   */
  fixHighTabindexValues(container) {
    const elements = container.querySelectorAll('[tabindex]');
    elements.forEach(element => {
      const tabindex = parseInt(element.getAttribute('tabindex'), 10);
      if (tabindex > 0) {
        element.setAttribute('tabindex', '0');
        console.log('Fixed high tabindex on element:', element);
      }
    });
  }

  /**
   * Ensure all interactive elements are tabbable
   * @param {Element} container - The container element
   */
  makeInteractiveElementsTabbable(container) {
    const selector = this.interactiveSelectors.join(',');
    const elements = container.querySelectorAll(selector);
    
    elements.forEach(element => {
      // Skip if the element is hidden or has a parent that's hidden
      if (this.isVisuallyHidden(element) || this.hasHiddenParent(element)) {
        return;
      }
      
      // If element doesn't have a tabindex, add tabindex="0"
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
      }
    });
  }

  /**
   * Check if an element should be considered interactive
   * @param {Element} element - The element to check
   * @returns {boolean} - Whether the element is interactive
   */
  isInteractiveElement(element) {
    // Check if the element matches any of our interactive selectors
    return this.interactiveSelectors.some(selector => 
      element.matches(selector)
    );
  }

  /**
   * Check if an element should be removed from the tab order
   * @param {Element} element - The element to check
   * @returns {boolean} - Whether the element should be removed from tab order
   */
  shouldBeRemovedFromTabOrder(element) {
    // Hidden elements should be removed from tab order
    if (this.isVisuallyHidden(element) || this.hasHiddenParent(element)) {
      return true;
    }
    
    // Elements with aria-hidden="true" should be removed
    if (element.getAttribute('aria-hidden') === 'true') {
      return true;
    }
    
    return false;
  }

  /**
   * Check if an element is visually hidden
   * @param {Element} element - The element to check
   * @returns {boolean} - Whether the element is visually hidden
   */
  isVisuallyHidden(element) {
    const style = window.getComputedStyle(element);
    return style.display === 'none' || 
           style.visibility === 'hidden' || 
           style.opacity === '0' ||
           (style.position === 'absolute' && 
            (style.width === '1px' || style.height === '1px') && 
            style.overflow === 'hidden');
  }

  /**
   * Check if an element has a hidden parent
   * @param {Element} element - The element to check
   * @returns {boolean} - Whether the element has a hidden parent
   */
  hasHiddenParent(element) {
    let parent = element.parentElement;
    while (parent) {
      if (this.isVisuallyHidden(parent) || parent.getAttribute('aria-hidden') === 'true') {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  }

  /**
   * Validate that non-interactive elements don't have unnecessary tabindex
   * @param {Element} container - The container element
   */
  validateNonInteractiveElements(container) {
    const selector = this.nonInteractiveWithTabindex.join(',');
    const elements = container.querySelectorAll(selector);
    
    elements.forEach(element => {
      const tabindex = parseInt(element.getAttribute('tabindex'), 10);
      
      // If the element has a tabindex but no role, check if it's necessary
      if (tabindex >= 0 && !element.hasAttribute('role')) {
        // Check if it has keyboard event listeners
        const hasKeyboardEvents = this.hasKeyboardEventListeners(element);
        
        if (!hasKeyboardEvents) {
          console.warn('Non-interactive element has unnecessary tabindex:', element);
          element.removeAttribute('tabindex');
        }
      }
    });
  }

  /**
   * Check if an element has keyboard event listeners
   * @param {Element} element - The element to check
   * @returns {boolean} - Whether the element has keyboard event listeners
   */
  hasKeyboardEventListeners(element) {
    // This is a simplistic check and won't catch all cases,
    // especially for listeners added via frameworks
    return element.hasAttribute('onkeydown') || 
           element.hasAttribute('onkeyup') || 
           element.hasAttribute('onkeypress');
  }

  /**
   * Analyze and report on the tab order of the page
   * @param {Element} container - The container element
   */
  analyzeTabOrder(container) {
    const tabbableElements = [];
    
    // Get all elements with tabindex
    const elementsWithTabindex = container.querySelectorAll('[tabindex]');
    elementsWithTabindex.forEach(element => {
      const tabindex = parseInt(element.getAttribute('tabindex'), 10);
      if (tabindex >= 0 && !this.shouldBeRemovedFromTabOrder(element)) {
        tabbableElements.push({
          element,
          tabindex
        });
      }
    });
    
    // Get all naturally tabbable elements
    const selector = this.interactiveSelectors.join(',');
    const naturallyTabbable = container.querySelectorAll(selector);
    naturallyTabbable.forEach(element => {
      if (!element.hasAttribute('tabindex') && !this.shouldBeRemovedFromTabOrder(element)) {
        tabbableElements.push({
          element,
          tabindex: 0
        });
      }
    });
    
    // Sort by tabindex
    tabbableElements.sort((a, b) => {
      // Elements with tabindex > 0 come first, in ascending order
      if (a.tabindex > 0 && b.tabindex > 0) {
        return a.tabindex - b.tabindex;
      }
      
      // Elements with tabindex > 0 come before elements with tabindex = 0
      if (a.tabindex > 0) {
        return -1;
      }
      if (b.tabindex > 0) {
        return 1;
      }
      
      // For elements with tabindex = 0, use DOM order
      return 0;
    });
    
    console.log('Tab order analysis:', tabbableElements);
  }

  /**
   * Set up focus trapping within a modal or dialog
   * @param {Element} modalElement - The modal or dialog element
   * @param {Object} options - Options for the focus trap
   * @param {boolean} options.returnFocusOnClose - Whether to return focus to the element that triggered the modal
   * @param {Element} options.triggerElement - The element that triggered the modal (for returning focus)
   * @returns {Object} - Functions to control the focus trap
   */
  setupFocusTrap(modalElement, options = {}) {
    if (!modalElement) {
      return { 
        remove: () => {},
        updateTabbableElements: () => {}
      };
    }
    
    const returnFocusOnClose = options.returnFocusOnClose !== false;
    const triggerElement = options.triggerElement || document.activeElement;
    
    // Store the element that had focus before the modal was opened
    const previouslyFocusedElement = triggerElement;
    
    // Find all tabbable elements within the modal
    let tabbableElements = this.findTabbableElements(modalElement);
    
    if (tabbableElements.length === 0) {
      console.warn('No tabbable elements found in modal');
      // Add a tabindex to the modal itself if there are no tabbable elements
      modalElement.setAttribute('tabindex', '0');
      tabbableElements = [modalElement];
    }
    
    const firstTabbable = tabbableElements[0];
    const lastTabbable = tabbableElements[tabbableElements.length - 1];
    
    // Set initial focus after a small delay to ensure the modal is visible
    setTimeout(() => {
      firstTabbable.focus();
    }, 50);
    
    // Handle keyboard events
    const handleKeyDown = (event) => {
      // Check for Tab key
      if (event.key === 'Tab') {
        // Shift + Tab
        if (event.shiftKey) {
          if (document.activeElement === firstTabbable) {
            event.preventDefault();
            lastTabbable.focus();
          }
        } 
        // Tab
        else {
          if (document.activeElement === lastTabbable) {
            event.preventDefault();
            firstTabbable.focus();
          }
        }
      }
      
      // Check for Escape key
      if (event.key === 'Escape') {
        if (modalElement.hasAttribute('aria-modal') || modalElement.getAttribute('role') === 'dialog') {
          const closeButton = modalElement.querySelector('[aria-label="Close"], .close, .btn-close');
          if (closeButton) {
            closeButton.click();
          }
        }
      }
    };
    
    modalElement.addEventListener('keydown', handleKeyDown);
    
    // Create a function to update the tabbable elements (useful for dynamic content)
    const updateTabbableElements = () => {
      const updatedElements = this.findTabbableElements(modalElement);
      if (updatedElements.length > 0) {
        tabbableElements = updatedElements;
        firstTabbable = tabbableElements[0];
        lastTabbable = tabbableElements[tabbableElements.length - 1];
      }
    };
    
    // Return functions to control the focus trap
    return {
      remove: () => {
        modalElement.removeEventListener('keydown', handleKeyDown);
        if (returnFocusOnClose && previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
          // Return focus to the element that opened the modal
          setTimeout(() => {
            previouslyFocusedElement.focus();
          }, 50);
        }
      },
      updateTabbableElements
    };
  }
  
  /**
   * Find all tabbable elements within a container
   * @param {Element} container - The container element
   * @returns {Array} - Array of tabbable elements
   */
  findTabbableElements(container) {
    const selector = this.interactiveSelectors.join(',');
    return Array.from(container.querySelectorAll(selector))
      .filter(element => {
        const tabindex = parseInt(element.getAttribute('tabindex') || '0', 10);
        return tabindex >= 0 && !this.shouldBeRemovedFromTabOrder(element);
      });
  }
  
  /**
   * Set up a mutation observer to handle dynamically added content
   * @param {Element} container - The container to observe
   */
  setupMutationObserver(container) {
    // Create a mutation observer to watch for changes in the DOM
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      
      // Check if any mutations are relevant to tabindex accessibility
      mutations.forEach(mutation => {
        // Check if nodes were added
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              shouldProcess = true;
              break;
            }
          }
        }
        
        // Check for attribute changes related to visibility or tabindex
        if (mutation.type === 'attributes') {
          const relevantAttributes = [
            'tabindex', 'disabled', 'aria-hidden', 
            'hidden', 'style', 'display', 'visibility'
          ];
          
          if (relevantAttributes.includes(mutation.attributeName)) {
            shouldProcess = true;
          }
        }
      });
      
      // If relevant changes were detected, process the container
      if (shouldProcess) {
        this.processDynamicContent(container);
      }
    });
    
    // Start observing the container
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'tabindex', 'disabled', 'aria-hidden', 
        'hidden', 'style', 'display', 'visibility'
      ]
    });
    
    // Store the observer reference for potential cleanup
    this.mutationObserver = observer;
  }
  
  /**
   * Process dynamically added content for tabindex issues
   * @param {Element} container - The container with dynamic content
   */
  processDynamicContent(container) {
    // Apply the same fixes as the main fix() method
    if (this.fixNegativeTabindex) {
      this.fixNegativeTabindexValues(container);
    }
    
    if (this.fixHighTabindex) {
      this.fixHighTabindexValues(container);
    }
    
    if (this.ensureInteractiveElements) {
      this.makeInteractiveElementsTabbable(container);
    }
    
    this.validateNonInteractiveElements(container);
    
    // Check for dialogs, modals, or other components that might need focus trapping
    this.detectAndHandleDialogs(container);
  }
  
  /**
   * Detect and set up focus trapping for dialogs and modals in dynamic content
   * @param {Element} container - The container to search in
   */
  detectAndHandleDialogs(container) {
    const dialogSelectors = [
      '[role="dialog"]',
      '[role="alertdialog"]',
      '.modal[aria-modal="true"]',
      '.dialog[aria-modal="true"]'
    ];
    
    const dialogs = container.querySelectorAll(dialogSelectors.join(','));
    
    dialogs.forEach(dialog => {
      // Only set up if the dialog is visible and doesn't already have a focus trap
      if (!this.isVisuallyHidden(dialog) && !dialog.hasAttribute('data-focus-trap-active')) {
        dialog.setAttribute('data-focus-trap-active', 'true');
        
        const focusTrap = this.setupFocusTrap(dialog, {
          returnFocusOnClose: this.returnFocusOnDynamicContentClose
        });
        
        // Store the focus trap removal function on the dialog element
        dialog._removeFocusTrap = focusTrap.remove;
        
        // Set up a listener for when the dialog is closed or hidden
        const dialogObserver = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            if (mutation.type === 'attributes') {
              if (this.isVisuallyHidden(dialog) || dialog.getAttribute('aria-hidden') === 'true') {
                // Dialog was hidden, remove the focus trap
                if (dialog._removeFocusTrap) {
                  dialog._removeFocusTrap();
                  delete dialog._removeFocusTrap;
                }
                dialog.removeAttribute('data-focus-trap-active');
                dialogObserver.disconnect();
              }
            }
          });
        });
        
        dialogObserver.observe(dialog, {
          attributes: true,
          attributeFilter: ['style', 'class', 'hidden', 'aria-hidden']
        });
      }
    });
  }
  
  /**
   * Set up event handlers for dynamic content loading
   */
  setupDynamicContentHandlers() {
    // Common events that might load dynamic content in JSP/AJAX applications
    const dynamicContentEvents = [
      'ajaxComplete',       // jQuery ajax complete
      'ajax:success',       // Rails ajax success
      'htmx:afterSwap',     // HTMX content swap
      'load-complete',      // Custom event for content loading
      'content-update',     // Custom event for content updates
      'dialog:opened',      // Dialog opened event
      'modal:opened',       // Modal opened event
      'pagination-complete' // Pagination event
    ];
    
    // Listen for events that might signal dynamic content
    dynamicContentEvents.forEach(eventName => {
      document.addEventListener(eventName, (event) => {
        // For events that include target information
        let target = event.target || document.body;
        
        // Special case for jQuery events
        if (event.detail && event.detail.target) {
          target = event.detail.target;
        }
        
        // Process the new content
        setTimeout(() => {
          this.processDynamicContent(target);
          
          // Focus the first interactive element if configured to do so
          if (this.focusFirstElementInDynamicContent) {
            const tabbableElements = this.findTabbableElements(target);
            if (tabbableElements.length > 0) {
              tabbableElements[0].focus();
            }
          }
        }, 100); // Small delay to ensure the DOM is fully updated
      });
    });
    
    // Listen for XHR completions (for AJAX not using jQuery)
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;
    const self = this;
    
    XMLHttpRequest.prototype.open = function() {
      this._tabindexManagerUrl = arguments[1];
      return originalXhrOpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function() {
      const xhr = this;
      const originalOnReadyStateChange = xhr.onreadystatechange;
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          // XHR completed, check for DOM updates after a small delay
          setTimeout(() => {
            self.processDynamicContent(document.body);
          }, 300);
        }
        
        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.apply(xhr, arguments);
        }
      };
      
      return originalXhrSend.apply(xhr, arguments);
    };
  }
  
  /**
   * Set up support for multi-step wizards
   * @param {Element} container - The container to search in
   */
  setupWizardNavigationSupport(container) {
    // Common wizard selectors
    const wizardSelectors = [
      '.wizard',
      '.stepper',
      '[role="tablist"]',
      '.multi-step-form',
      '.form-wizard',
      '.step-progress'
    ];
    
    const wizards = container.querySelectorAll(wizardSelectors.join(','));
    
    wizards.forEach(wizard => {
      // Look for step indicators
      const steps = wizard.querySelectorAll(
        '.step, .wizard-step, .form-step, [role="tab"], .step-indicator'
      );
      
      // Look for next/previous buttons
      const nextButtons = wizard.querySelectorAll(
        '.next-step, .btn-next, [data-action="next"], .wizard-next'
      );
      
      const prevButtons = wizard.querySelectorAll(
        '.prev-step, .btn-prev, [data-action="previous"], .wizard-prev'
      );
      
      // Handle next button clicks
      nextButtons.forEach(button => {
        button.addEventListener('click', () => {
          // Wait for the next step to become visible
          setTimeout(() => {
            // Find the current active step
            const activeStep = wizard.querySelector(
              '.step.active, .wizard-step.active, .form-step.active, ' +
              '[role="tab"][aria-selected="true"], .step-indicator.active'
            );
            
            if (activeStep) {
              // Find the step content associated with this step
              let stepContent = null;
              
              // Try different methods to find the step content
              // 1. Check for aria-controls attribute
              if (activeStep.hasAttribute('aria-controls')) {
                const contentId = activeStep.getAttribute('aria-controls');
                stepContent = document.getElementById(contentId);
              }
              
              // 2. Check for data-target attribute
              if (!stepContent && activeStep.hasAttribute('data-target')) {
                const contentSelector = activeStep.getAttribute('data-target');
                stepContent = document.querySelector(contentSelector);
              }
              
              // 3. Look for a corresponding content element
              if (!stepContent) {
                const stepIndex = Array.from(steps).indexOf(activeStep);
                const contentElements = wizard.querySelectorAll(
                  '.step-content, .wizard-content, .form-step-content, [role="tabpanel"]'
                );
                
                if (contentElements.length > stepIndex) {
                  stepContent = contentElements[stepIndex];
                }
              }
              
              // If we found step content, focus the first interactive element
              if (stepContent) {
                const tabbableElements = this.findTabbableElements(stepContent);
                if (tabbableElements.length > 0) {
                  tabbableElements[0].focus();
                } else {
                  // If no interactive elements, focus the step content itself
                  stepContent.setAttribute('tabindex', '-1');
                  stepContent.focus();
                  // Remove tabindex after focus
                  setTimeout(() => {
                    stepContent.removeAttribute('tabindex');
                  }, 100);
                }
              }
            }
          }, 100);
        });
      });
      
      // Handle keyboard navigation for the wizard steps
      steps.forEach(step => {
        step.addEventListener('keydown', (event) => {
          // Arrow keys for navigation between steps
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            const direction = event.key === 'ArrowRight' ? 1 : -1;
            const currentIndex = Array.from(steps).indexOf(step);
            const targetIndex = currentIndex + direction;
            
            // Ensure the target index is within bounds
            if (targetIndex >= 0 && targetIndex < steps.length) {
              const targetStep = steps[targetIndex];
              
              // Check if the step is accessible (not disabled)
              if (!targetStep.hasAttribute('disabled') && 
                  !targetStep.classList.contains('disabled')) {
                targetStep.click();
                targetStep.focus();
              }
            }
            
            event.preventDefault();
          }
        });
      });
    });
  }
  
  /**
   * Set up handlers for tooltips and dropdowns
   * @param {Element} container - The container to search in
   */
  setupTooltipAndDropdownHandlers(container) {
    // Handle tooltips
    const tooltipTriggers = container.querySelectorAll(
      '[data-tooltip], [data-toggle="tooltip"], [aria-describedby], ' +
      '[role="tooltip"], .tooltip-trigger'
    );
    
    tooltipTriggers.forEach(trigger => {
      // Ensure the trigger is keyboard accessible
      if (!trigger.hasAttribute('tabindex')) {
        trigger.setAttribute('tabindex', '0');
      }
      
      // Add keyboard event listeners if they don't exist
      if (!trigger.hasAttribute('data-tooltip-keyboard-handled')) {
        trigger.setAttribute('data-tooltip-keyboard-handled', 'true');
        
        // Add keyboard support
        trigger.addEventListener('keydown', (event) => {
          // Show tooltip on Space or Enter
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            trigger.click(); // This should trigger the tooltip in most implementations
            
            // For custom implementations, try to find and show the tooltip
            const tooltipId = trigger.getAttribute('aria-describedby') || 
                             trigger.getAttribute('data-tooltip-id');
            
            if (tooltipId) {
              const tooltip = document.getElementById(tooltipId);
              if (tooltip) {
                tooltip.classList.add('show', 'visible');
                tooltip.setAttribute('aria-hidden', 'false');
              }
            }
          }
          
          // Hide tooltip on Escape
          if (event.key === 'Escape') {
            const tooltipId = trigger.getAttribute('aria-describedby') || 
                             trigger.getAttribute('data-tooltip-id');
            
            if (tooltipId) {
              const tooltip = document.getElementById(tooltipId);
              if (tooltip) {
                tooltip.classList.remove('show', 'visible');
                tooltip.setAttribute('aria-hidden', 'true');
              }
            }
          }
        });
      }
    });
    
    // Handle dropdowns
    const dropdownTriggers = container.querySelectorAll(
      '.dropdown-toggle, [data-toggle="dropdown"], ' +
      '[aria-haspopup="true"], .has-dropdown > a'
    );
    
    dropdownTriggers.forEach(trigger => {
      // Ensure the trigger is keyboard accessible
      if (!trigger.hasAttribute('tabindex')) {
        trigger.setAttribute('tabindex', '0');
      }
      
      // Add keyboard event listeners if they don't exist
      if (!trigger.hasAttribute('data-dropdown-keyboard-handled')) {
        trigger.setAttribute('data-dropdown-keyboard-handled', 'true');
        
        trigger.addEventListener('keydown', (event) => {
          // Toggle dropdown on Space or Enter
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            trigger.click(); // This should toggle the dropdown in most implementations
            
            // For custom implementations, try to find and show the dropdown
            let dropdown = null;
            
            // Method 1: Check for aria-controls
            if (trigger.hasAttribute('aria-controls')) {
              const dropdownId = trigger.getAttribute('aria-controls');
              dropdown = document.getElementById(dropdownId);
            }
            
            // Method 2: Check for next sibling
            if (!dropdown) {
              dropdown = trigger.nextElementSibling;
              if (dropdown && !dropdown.classList.contains('dropdown-menu')) {
                dropdown = null;
              }
            }
            
            // Method 3: Check for parent container's child
            if (!dropdown && trigger.parentElement) {
              dropdown = trigger.parentElement.querySelector('.dropdown-menu');
            }
            
            // If we found the dropdown, make its items focusable
            if (dropdown) {
              const dropdownItems = dropdown.querySelectorAll(
                '.dropdown-item, .dropdown-option, li > a'
              );
              
              // Make items focusable and focus the first one
              dropdownItems.forEach(item => {
                if (!item.hasAttribute('tabindex')) {
                  item.setAttribute('tabindex', '0');
                }
              });
              
              if (dropdownItems.length > 0) {
                setTimeout(() => {
                  dropdownItems[0].focus();
                }, 50);
              }
              
              // Add keyboard navigation for dropdown items
              dropdown.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                  // Close dropdown and return focus to trigger
                  trigger.click();
                  trigger.focus();
                } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  
                  const direction = event.key === 'ArrowDown' ? 1 : -1;
                  const items = Array.from(dropdownItems);
                  const currentIndex = items.indexOf(document.activeElement);
                  let targetIndex = currentIndex + direction;
                  
                  // Wrap around the list if needed
                  if (targetIndex < 0) {
                    targetIndex = items.length - 1;
                  } else if (targetIndex >= items.length) {
                    targetIndex = 0;
                  }
                  
                  items[targetIndex].focus();
                }
              });
            }
          }
          
          // Close dropdown on Escape
          if (event.key === 'Escape') {
            // Check if dropdown is open by checking aria-expanded
            if (trigger.getAttribute('aria-expanded') === 'true') {
              trigger.click(); // Close the dropdown
            }
          }
        });
      }
    });
  }
}

// Export the TabindexManager
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TabindexManager;
} else {
  window.TabindexManager = TabindexManager;
}

/**
 * Usage example:
 * 
 * // Initialize the TabindexManager with extended options
 * const tabManager = new TabindexManager({
 *   container: 'body',
 *   fixNegativeTabindex: true,
 *   fixHighTabindex: true,
 *   ensureInteractiveElements: true,
 *   enableMutationObserver: true,
 *   enableDynamicContentSupport: true,
 *   focusFirstElementInDynamicContent: true,
 *   returnFocusOnDynamicContentClose: true,
 *   supportWizardNavigation: true,
 *   handleTooltipsAndDropdowns: true
 * });
 * 
 * // Fix tabindex issues on the page
 * tabManager.fix();
 * 
 * // Set up JSP-specific component handling
 * tabManager.handleJspComponents();
 * 
 * // Set up handling for JSP modals
 * tabManager.setupJspModalHandling();
 * 
 * // Set up handling for JSP wizards
 * tabManager.setupJspWizards();
 * 
 * // Set up accessible autocomplete
 * tabManager.setupAccessibleAutocomplete(document.body);
 * 
 * // Handle AJAX updates
 * document.addEventListener('ajax:complete', (event) => {
 *   // Process dynamic content after AJAX updates
 *   tabManager.processDynamicContent(document.body);
 * });
 */
