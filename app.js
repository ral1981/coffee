// Global variables
let allCoffees = [];
let filteredCoffees = [];

// Supabase client
const API_BASE = 'http://localhost:3000/api/coffee-beans';

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://vrasvqmlpdqogghtkqfu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyYXN2cW1scGRxb2dnaHRrcWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNTQ5ODgsImV4cCI6MjA2NTkzMDk4OH0.K5wuITvCrQdCvfsRRpWZnFtZ3cvHLAdXhudBxiP9hAc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Authentication variables
let currentUser = null;
let isAuthorized = false;

// Auth state listener - automatically updates when user signs in/out
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  
  if (event === 'SIGNED_IN' && session) {
    console.log('User signed in:', session.user)
    currentUser = session.user.email
    isAuthorized = true
    updateUIForAuthorizedUser()
    showNotification('Logged in successfully.', 'success')
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out')
    currentUser = null
    isAuthorized = false
    updateUIForUnauthorizedUser()
    showNotification('Logged out successfully.', 'info')    
  }
})

/*
// Optional: Functions to handle UI updates after auth changes
function onUserSignedIn(user) {
  // Update your UI to show authenticated state
  console.log('Welcome back,', user.email)
}

function onUserSignedOut() {
  // Update your UI to show unauthenticated state
  console.log('User logged out')
}
*/

// NEW promptForEmail function
async function promptForEmail() {
    const email = prompt('Please enter your email:');
    if (!email || !email.trim()) return;
    
    const password = prompt('Please enter your password:');
    if (!password || !password.trim()) return;
    
    showNotification('Signing in...', 'info');
    
    // Try to sign in first
    const signInResult = await signIn(email.trim().toLowerCase(), password);
    
    if (signInResult.success) {
        // Success! The auth state listener will handle UI updates
        return;
    }
    
    // If sign in failed, offer to create account
    const createAccount = confirm(
        `Sign in failed: ${signInResult.error}\n\nWould you like to create a new account with this email?`
    );
    
    if (createAccount) {
        showNotification('Creating account...', 'info');
        const signUpResult = await signUp(email.trim().toLowerCase(), password);
        
        if (signUpResult.success) {
            showNotification('Account created! Please check your email to verify your account, then try signing in again.', 'success');
        } else {
            showNotification('Failed to create account: ' + signUpResult.error, 'error');
        }
    }
}

// Core Supabase auth functions
async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  })
  
  if (error) {
    console.error('Sign up error:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, data }
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  })
  
  if (error) {
    console.error('Sign in error:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, data }
}

async function signOut() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Sign out error:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// NEW logout function - replace the old one
async function logout() {
    showNotification('Signing out...', 'info');
    await signOut();
    // The auth state listener will handle UI updates
}

// For saveNotes function - simpler login prompt
async function promptForLogin() {
    const email = prompt('Please enter your email to save:');
    if (!email || !email.trim()) return false;
    
    const password = prompt('Please enter your password:');
    if (!password || !password.trim()) return false;
    
    showNotification('Signing in...', 'info');
    const signInResult = await signIn(email.trim().toLowerCase(), password);
    
    if (signInResult.success) {
        return true; // Success - can proceed with save
    } else {
        showNotification('Sign in failed: ' + signInResult.error, 'error');
        return false; // Failed - don't proceed with save
    }
}

function updateUIForAuthorizedUser() {
    document.querySelectorAll('.notes-btn-edit').forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('disabled');
    });
    document.querySelectorAll('.notes-btn-save, .notes-btn-cancel').forEach(btn => btn.style.display = 'inline-flex');
    document.querySelectorAll('.notes-input').forEach(input => input.disabled = false);

    const addCoffeeToggle = document.getElementById('add-coffee-toggle');
    if (addCoffeeToggle) {
        addCoffeeToggle.disabled = false;
    }
	
    addLogoutButton();
    renderCoffeeCards(filteredCoffees);
}

function updateUIForUnauthorizedUser() {
    document.querySelectorAll('.notes-btn-edit').forEach(btn => {
        btn.disabled = true;
        btn.classList.add('disabled');
    });
    document.querySelectorAll('.notes-btn-save, .notes-btn-cancel').forEach(btn => btn.style.display = 'none');
    document.querySelectorAll('.notes-input').forEach(input => input.disabled = true);

    const addCoffeeToggle = document.getElementById('add-coffee-toggle');
    const addCoffeeContent = document.getElementById('add-coffee-content');
    if (addCoffeeToggle) {
        addCoffeeToggle.disabled = true;
        addCoffeeToggle.setAttribute('aria-expanded', 'false');
    }
    if (addCoffeeContent) {
        addCoffeeContent.classList.remove('expanded');
        addCoffeeContent.classList.add('collapsed');
    }
    
    addLoginButton();
    renderCoffeeCards(filteredCoffees);
}

    function addLoginButton() {
        const existingBtn = document.getElementById('auth-btn');
        if (existingBtn) existingBtn.remove();
        const loginBtn = document.createElement('button');
        loginBtn.id = 'auth-btn';
        loginBtn.innerHTML = '<i data-lucide="lock-keyhole"></i>Unlock';
        loginBtn.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 1000; display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: background 0.2s;`;
        loginBtn.onmouseover = () => loginBtn.style.background = '#2563eb';
        loginBtn.onmouseout = () => loginBtn.style.background = '#3b82f6';
        loginBtn.onclick = promptForEmail;
        document.body.appendChild(loginBtn);
        lucide.createIcons();
    }

    function addLogoutButton() {
        const existingBtn = document.getElementById('auth-btn');
        if (existingBtn) existingBtn.remove();
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'auth-btn';
        logoutBtn.innerHTML = `<i data-lucide="lock-keyhole-open"></i>Lock`;
        logoutBtn.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 1000; display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: background 0.2s;`;
        logoutBtn.onmouseover = () => logoutBtn.style.background = '#4b5563';
        logoutBtn.onmouseout = () => logoutBtn.style.background = '#6b7280';
        logoutBtn.onclick = logout;
        document.body.appendChild(logoutBtn);
        lucide.createIcons();
    }

    function showNotification(message, type = 'info') {
        document.querySelectorAll('.notification').forEach(n => n.remove());
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };
        notification.style.cssText = `position: fixed; top: 80px; right: 20px; padding: 12px 20px; border-radius: 8px; color: white; font-weight: 500; z-index: 9999; transform: translateX(100%); transition: transform 0.3s ease; max-width: 300px; background: ${colors[type] || colors.info}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);`;
        document.body.appendChild(notification);
        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => { if (notification.parentNode) notification.parentNode.removeChild(notification); }, 300);
        }, 4000);
    }

    // --- Core Application Functions ---

    // Toggle Add Coffee Section
    function toggleAddCoffee() {
	const toggle = document.getElementById('add-coffee-toggle');
	const content = document.getElementById('add-coffee-content');
	    
	if (!isAuthorized) {
	    showNotification('Please log in to add coffee entries.', 'warning');
	    return;
	}
	   
	const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
	  
	toggle.setAttribute('aria-expanded', !isExpanded);
	    	if (isExpanded) {
	    content.classList.remove('expanded');
	    content.classList.add('collapsed');
	    } else {
	    content.classList.remove('collapsed');
	    content.classList.add('expanded');
	}
    }

    // Add Coffee Form Functions

	// Function to ensure url starts with HTTPS://
	function ensureHttps() {
	  const shopUrlInput = document.getElementById('add-shop-url');
	  let url = shopUrlInput.value.trim();
	
	  if (url && !/^https?:\/\//i.test(url)) {
	    url = 'https://' + url;
	    shopUrlInput.value = url;
	  }
	}
	    
	// Function to extract domain from URL
	function extractDomain(url) {
	    try {
	        // Handle URLs without protocol
	        if (!url.startsWith('http://') && !url.startsWith('https://')) {
	            url = 'https://' + url;
	        }
	        
	        const urlObj = new URL(url);
	        return urlObj.hostname;
	    } catch (error) {
	        console.warn('Invalid URL:', url);
	        return null;
	    }
	}
	
	// Function to generate favicon URL
	function generateFaviconUrl(domain) {
	    if (!domain) return '';
	    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
	}
	
	// Function to update favicon based on shop URL
	function updateFavicon() {
	    const shopUrlInput = document.getElementById('add-shop-url');
	    const faviconInput = document.getElementById('add-shop-logo');
	    const faviconImg = document.getElementById('favicon-img');
	    const faviconPlaceholder = document.getElementById('favicon-placeholder');
	    
	    if (!shopUrlInput || !faviconInput || !faviconImg || !faviconPlaceholder) {
	        console.warn('Required elements not found');
	        return;
	    }
	    
	    const shopUrl = shopUrlInput.value.trim();
	    
	    if (!shopUrl) {
	        // Clear favicon if no URL
	        faviconInput.value = '';
	        faviconImg.style.display = 'none';
	        faviconPlaceholder.style.display = 'block';
	        return;
	    }
	    
	    const domain = extractDomain(shopUrl);
	    
	    if (domain) {
	        const faviconUrl = generateFaviconUrl(domain);
	        faviconInput.value = faviconUrl;
	        
	        // Show loading state
	        faviconImg.classList.add('loading');
	        faviconPlaceholder.style.display = 'none';
	        
	        // Load and display favicon
	        faviconImg.onload = function() {
	            this.classList.remove('loading');
	            this.style.display = 'block';
	        };
	        
	        faviconImg.onerror = function() {
	            this.classList.remove('loading');
	            this.style.display = 'none';
	            faviconPlaceholder.style.display = 'block';
	        };
	        
	        faviconImg.src = faviconUrl;
	    } else {
	        // Invalid domain
	        faviconInput.value = '';
	        faviconImg.style.display = 'none';
	        faviconPlaceholder.style.display = 'block';
	    }
	}
	
	// Debounced version of updateFavicon to avoid too many calls
	let faviconUpdateTimeout;
	function debouncedUpdateFavicon() {
	    clearTimeout(faviconUpdateTimeout);
	    faviconUpdateTimeout = setTimeout(updateFavicon, 300);
	}
	
// Enhanced resetAddCoffeeForm function to also reset favicon
function resetAddCoffeeForm() {
  const form = document.getElementById('add-coffee-form');
  if (form) form.reset();

  const ratioField = document.getElementById('add-recipe-ratio');
  if (ratioField) ratioField.value = '';

  const faviconImg = document.getElementById('favicon-img');
  const faviconPlaceholder = document.getElementById('favicon-placeholder');
  if (faviconImg) {
    faviconImg.style.display = 'none';
    faviconImg.classList.remove('loading');
    faviconImg.onload = null;
    faviconImg.onerror = null;
  }
  if (faviconPlaceholder) {
    faviconPlaceholder.style.display = 'block';
  }

  const toggle = document.getElementById('add-coffee-toggle');
  const content = document.getElementById('add-coffee-content');
  if (toggle && content) {
    toggle.setAttribute('aria-expanded', 'false');
    content.classList.remove('expanded');
    content.classList.add('collapsed');
  }
}

	document.addEventListener('DOMContentLoaded', function() {
	    const shopUrlInput = document.getElementById('add-shop-url');
	    if (shopUrlInput) {
	        // Replace the existing oninput with the debounced version
	        shopUrlInput.removeAttribute('oninput');
	        shopUrlInput.addEventListener('input', debouncedUpdateFavicon);
	        
	        // Also update on paste events
	        shopUrlInput.addEventListener('paste', function() {
	            setTimeout(debouncedUpdateFavicon, 10);
	        });
	    }
	});
    
	function calculateRatio() {
	    const inGr = parseFloat(document.getElementById('add-recipe-in').value);
	    const outGr = parseFloat(document.getElementById('add-recipe-out').value);
	    const ratioField = document.getElementById('add-recipe-ratio');
	    
	    if (inGr && outGr && inGr > 0) {
	        const ratio = (outGr / inGr).toFixed(1);
	        ratioField.value = `1:${ratio}`;
	    } else {
	        ratioField.value = '';
	    }
	}

	async function submitNewCoffee(event, confirmContainerReplacement = false) {
	    event.preventDefault();
	    
	    if (!isAuthorized) {
	        showNotification('Please log in to add coffee entries.', 'error');
	        return;
	    }
	    
	    const form = document.getElementById('add-coffee-form');
	    const submitBtn = form.querySelector('.btn-submit');
	    const originalText = submitBtn.innerHTML;
	    
	    // Disable form and show loading state
	    submitBtn.innerHTML = '<i data-lucide="loader-2"></i> Adding Coffee...';
	    submitBtn.disabled = true;
	    
	    try {
	        // Collect form data
	        const formData = new FormData(form);
	        const coffeeData = {};
	        
	        // Updated field mapping to match your Supabase table columns
	        const fieldMapping = {
	            'container': 'container',
	            'name': 'name',
	            'shop_name': 'shop_name',
	            'shop_url': 'shop_url',
	            'shop_logo': 'shop_logo',
	            'origin': 'origin',
	            'region': 'region',
	            'height_m': 'height_meters',  // Updated to match DB column
	            'botanic_variety': 'botanic_variety',
	            'farm_producer': 'farm_producer',  // Simplified field name
	            'processing_method': 'processing_method',
	            'sca': 'sca',
	            'flavor': 'flavor',
	            'recipe_ratio': 'recipe_ratio',  // Simplified field names
	            'recipe_in_gr': 'recipe_in_grams',
	            'recipe_out_gr': 'recipe_out_grams',
	            'recipe_time_s': 'recipe_time_seconds',
	            'recipe_temperature_c': 'recipe_temperature_c'
	        };
	        
	        // Data collection with type conversion
	        for (const [formField, dbField] of Object.entries(fieldMapping)) {
	            const value = formData.get(formField);
	            if (value !== null && value !== undefined) {
	                const trimmedValue = value.toString().trim();
	                if (trimmedValue) {
	                    if (formField === 'container') {
	                        // Convert container value to display format
	                        coffeeData[dbField] = value === 'green' ? 'Green Container' : 
	                                             value === 'grey' ? 'Grey Container' : '';
	                    } else if (formField.includes('height_m') || formField.includes('sca') || 
	                               formField.includes('recipe_in_gr') || formField.includes('recipe_out_gr') ||
	                               formField.includes('recipe_temperature_c')) {
	                        // Convert numeric fields
	                        const numValue = parseFloat(trimmedValue);
	                        coffeeData[dbField] = isNaN(numValue) ? null : numValue;
	                    } else {
	                        coffeeData[dbField] = trimmedValue;
	                    }
	                }
	            }
	        }
	        
	        // Add notes field (empty by default)
	        coffeeData.notes = formData.get('notes') ? formData.get('notes').toString().trim() : '';
	        
	        // Debug logging to see what's being sent
	        console.log('Coffee data being sent:', coffeeData);
	        
	        // Validate required fields
	        const requiredFields = ['name', 'shop_name', 'shop_url', 'origin'];
	        const missingFields = requiredFields.filter(field => {
	            const mappedField = fieldMapping[field] || field;
	            return !coffeeData[mappedField] || !coffeeData[mappedField].toString().trim();
	        });
	        
	        if (missingFields.length > 0) {
	            throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
	        }
	        
	        // Check if coffee with same name already exists
	        const existingCoffee = allCoffees.find(coffee => 
	            coffee.name && coffee.name.toLowerCase() === coffeeData.name.toLowerCase()
	        );
	        
	        if (existingCoffee) {
	            throw new Error('A coffee with this name already exists');
	        }
	        
	        // Call your new Node.js API
	        const response = await fetch(API_BASE, {
	            method: 'POST',
	            headers: {
	                'Content-Type': 'application/json',
	            },
	            body: JSON.stringify(coffeeData)
	        });
	        
	        if (!response.ok) {
	            throw new Error(`HTTP error! status: ${response.status}`);
	        }
	        
	        const result = await response.json();
	        
	        if (result.success) {
	            // Add new coffee to local arrays (using the returned data from DB)
	            const newCoffee = result.data;
	            allCoffees.push(newCoffee);
	            
	            // Refresh filters and display
	            populateFilters(allCoffees);
	            applyFilters();
	            
	            // Reset form and close section
	            resetAddCoffeeForm();
	            
	            showNotification('Coffee added successfully!', 'success');
	            
	            // Scroll to the new coffee card if it's visible in current filter
	            setTimeout(() => {
	                const coffeeCards = document.querySelectorAll('.coffee-card');
	                const newCard = Array.from(coffeeCards).find(card => 
	                    card.querySelector('.coffee-name').textContent === newCoffee.name
	                );
	                if (newCard) {
	                    newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
	                    newCard.style.animation = 'highlight 2s ease-in-out';
	                }
	            }, 300);
	            
	        } else {
	            throw new Error(result.error || 'Failed to add coffee');
	        }
	        
	    } catch (error) {
	        console.error('Error adding coffee:', error);
	        
	        if (error.message.includes('Unauthorized')) {
	            showNotification('Session expired. Please log in again.', 'warning');
	            logout();
	        } else {
	            showNotification(error.message || 'Failed to add coffee. Please try again.', 'error');
	        }
	    } finally {
	        // Re-enable form
	        submitBtn.innerHTML = originalText;
	        submitBtn.disabled = false;
	        lucide.createIcons();
	    }
	}

	// Function to show container replacement confirmation dialog
	function showContainerReplacementDialog(result, originalEvent) {
	    const dialog = document.createElement('div');
	    dialog.className = 'confirmation-dialog-overlay';
	    dialog.innerHTML = `
	        <div class="confirmation-dialog">
	            <div class="confirmation-header">
	                <i data-lucide="alert-triangle" style="color: #f59e0b; width: 24px; height: 24px;"></i>
	                <h3>Container Conflict</h3>
	            </div>
	            <div class="confirmation-message">
	                <p>${result.message}</p>
	            </div>
	            <div class="confirmation-actions">
	                <button class="btn-cancel" onclick="closeContainerReplacementDialog()">
	                    <i data-lucide="x" style="width: 16px; height: 16px;"></i>
	                    Cancel
	                </button>
	                <button class="btn-confirm" onclick="confirmContainerReplacement(event)">
	                    <i data-lucide="check" style="width: 16px; height: 16px;"></i>
	                    Continue
	                </button>
	            </div>
	        </div>
	    `;
	    
	    // Store the original event for later use
	    dialog.originalEvent = originalEvent;
	    
	    document.body.appendChild(dialog);
	    lucide.createIcons();
	    
	    // Focus on the dialog for accessibility
	    dialog.querySelector('.btn-confirm').focus();
	    
	    // Handle escape key
	    const handleEscape = (e) => {
	        if (e.key === 'Escape') {
	            closeContainerReplacementDialog();
	            document.removeEventListener('keydown', handleEscape);
	        }
	    };
	    document.addEventListener('keydown', handleEscape);
	}
	
	function closeContainerReplacementDialog() {
	    const dialog = document.querySelector('.confirmation-dialog-overlay');
	    if (dialog) {
	        dialog.remove();
	    }
	}
	
	function confirmContainerReplacement(event) {
	    const dialog = document.querySelector('.confirmation-dialog-overlay');
	    const originalEvent = dialog ? dialog.originalEvent : event;
	    
	    closeContainerReplacementDialog();
	    
	    // Retry the submission with confirmation flag
	    submitNewCoffee(originalEvent, true);
	}
	    
    function toggleFilters() {
        const filtersContent = document.getElementById('filters-content');
        const toggleButton = document.querySelector('.filters-toggle');
        const isCollapsed = filtersContent.classList.contains('collapsed');
        if (isCollapsed) {
            filtersContent.classList.remove('collapsed');
            toggleButton.setAttribute('aria-expanded', 'true');
        } else {
            filtersContent.classList.add('collapsed');
            toggleButton.setAttribute('aria-expanded', 'false');
        }
    }

function getDomainFromUrl(url) {
  try {
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function getFaviconUrl(url) {
  const domain = getDomainFromUrl(url);
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : null;
}

function createShopLogoElement(shopLogo, shopUrl, shopName) {
  const logoContainer = document.createElement('div');
  logoContainer.innerHTML = ''; // prevent stacking duplicates

  const fallbackIcon = () => {
    const icon = document.createElement('div');
    icon.className = 'shop-icon';
    icon.textContent = '??';
    logoContainer.appendChild(icon);
  };

  const favicon = getFaviconUrl(shopUrl);

  if (shopLogo && shopLogo !== 'N/A' && shopLogo.trim() !== '') {
    const img = document.createElement('img');
    img.src = shopLogo;
    img.alt = `${shopName} logo`;
    img.className = 'shop-logo';
    img.onerror = () => {
      if (favicon) {
        img.src = favicon;
        img.onerror = fallbackIcon;
      } else {
        fallbackIcon();
      }
    };
    logoContainer.appendChild(img);
  } else if (favicon) {
    const img = document.createElement('img');
    img.src = favicon;
    img.alt = `${shopName} favicon`;
    img.className = 'shop-logo';
    img.onerror = fallbackIcon;
    logoContainer.appendChild(img);
  } else {
    fallbackIcon();
  }

  return logoContainer;
}

    function populateFilters(coffees) {
        const shops = [...new Set(coffees.map(coffee => coffee.shop_name || 'N/A'))].filter(shop => shop !== 'N/A').sort();
        const origins = [...new Set(coffees.map(coffee => coffee.origin || 'N/A'))].filter(origin => origin !== 'N/A').sort();
        const shopFilter = document.getElementById('shop-filter');
        shopFilter.innerHTML = '<option value="">All Shops</option>';
        shops.forEach(shop => { const option = document.createElement('option'); option.value = shop; option.textContent = shop; shopFilter.appendChild(option); });
        const originFilter = document.getElementById('origin-filter');
        originFilter.innerHTML = '<option value="">All Origins</option>';
        origins.forEach(origin => { const option = document.createElement('option'); option.value = origin; option.textContent = origin; originFilter.appendChild(option); });
    }

    function getUrlParameters() {
        const params = new URLSearchParams(window.location.search);
        return { container: params.get('container'), shop: params.get('shop'), origin: params.get('origin') };
    }

    function normalizeForComparison(str) {
        return str.toLowerCase().replace(/\s+/g, '').replace(/[באהג]/g, 'a').replace(/[יטכך]/g, 'e').replace(/[םלןמ]/g, 'i').replace(/[ףעצפ]/g, 'o').replace(/[תש]/g, 'u');
    }

    function updateUrlParameters() {
        const containerFilter = document.getElementById('container-filter').value;
        const shopFilter = document.getElementById('shop-filter').value;
        const originFilter = document.getElementById('origin-filter').value;
        const params = new URLSearchParams();
        if (containerFilter) params.set('container', containerFilter);
        if (shopFilter) params.set('shop', shopFilter);
        if (originFilter) params.set('origin', originFilter);
        const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
    }

    function clearUrlParameters() {
        window.history.replaceState({}, '', window.location.pathname);
    }

    function applyUrlParameters() {
        const params = getUrlParameters();
        let hasParams = false;
        if (params.container) { const containerFilter = document.getElementById('container-filter'); if (containerFilter) { containerFilter.value = params.container; hasParams = true; } }
        if (params.shop) { const shopFilter = document.getElementById('shop-filter'); const shopOption = Array.from(shopFilter.options).find(option => normalizeForComparison(option.value) === normalizeForComparison(params.shop)); if (shopOption) { shopFilter.value = shopOption.value; hasParams = true; } }
        if (params.origin) { const originFilter = document.getElementById('origin-filter'); const originOption = Array.from(originFilter.options).find(option => normalizeForComparison(option.value) === normalizeForComparison(params.origin)); if (originOption) { originFilter.value = originOption.value; hasParams = true; } }
        applyFilters();
        if (hasParams) {
            setTimeout(() => {
                const resultsSection = document.getElementById('results-count');
                if (resultsSection && resultsSection.style.display !== 'none') {
                    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        }
    }

    function applyFilters() {
        const containerFilter = document.getElementById('container-filter').value;
        const shopFilter = document.getElementById('shop-filter').value;
        const originFilter = document.getElementById('origin-filter').value;
        filteredCoffees = allCoffees.filter(coffee => {
            if (containerFilter) {
                const containerValue = (coffee.container || '').toLowerCase();
                if (containerFilter === 'green' && !(containerValue.includes('green') || containerValue.includes('container_01'))) return false;
                if (containerFilter === 'grey' && !(containerValue.includes('grey') || containerValue.includes('gray') || containerValue.includes('container_02'))) return false;
                if (containerFilter === 'none' && containerValue && containerValue.trim() !== '') return false;
            }
            if (shopFilter && (coffee.shop_name || 'N/A') !== shopFilter) return false;
            if (originFilter && (coffee.origin || 'N/A') !== originFilter) return false;
            return true;
        });
        renderCoffeeCards(filteredCoffees);
        updateResultsCount(filteredCoffees.length, allCoffees.length);
        updateUrlParameters();
        updateFilterStates();
    }

    function clearAllFilters() {
        document.getElementById('container-filter').value = '';
        document.getElementById('shop-filter').value = '';
        document.getElementById('origin-filter').value = '';
        filteredCoffees = [...allCoffees];
        renderCoffeeCards(filteredCoffees);
        updateResultsCount(filteredCoffees.length, allCoffees.length);
        clearUrlParameters();
        updateFilterStates();
    }

    function hasActiveFilters() {
        return document.getElementById('container-filter').value !== '' || document.getElementById('shop-filter').value !== '' || document.getElementById('origin-filter').value !== '';
    }

    function updateFilterStates() {
        const containerFilter = document.getElementById('container-filter');
        const shopFilter = document.getElementById('shop-filter');
        const originFilter = document.getElementById('origin-filter');
        const clearButton = document.getElementById('clear-filters-btn');
        const filtersToggle = document.querySelector('.filters-toggle');
        containerFilter.closest('.filter-group').classList.toggle('active', containerFilter.value !== '');
        shopFilter.closest('.filter-group').classList.toggle('active', shopFilter.value !== '');
        originFilter.closest('.filter-group').classList.toggle('active', originFilter.value !== '');
        const hasFilters = hasActiveFilters();
        clearButton.disabled = !hasFilters;
        filtersToggle.classList.toggle('has-active-filters', hasFilters);
    }

    function updateResultsCount(filtered, total) {
        const resultsElement = document.getElementById('results-count');
        const noResultsElement = document.getElementById('no-results');
        const gridElement = document.getElementById('coffee-grid');
        if (filtered === 0) {
            resultsElement.style.display = 'none';
            noResultsElement.style.display = 'block';
            gridElement.style.display = 'none';
        } else {
            resultsElement.style.display = 'block';
            noResultsElement.style.display = 'none';
            gridElement.style.display = 'grid';
            if (filtered === total) {
                resultsElement.textContent = `Showing all ${total} coffees`;
            } else {
                resultsElement.textContent = `Showing ${filtered} of ${total} coffees`;
            }
        }
    }

    async function loadCoffeeData() {
	try {
	   const response = await fetch(API_BASE);
	     
	   if (!response.ok) {
	       throw new Error(`HTTP error! status: ${response.status}`);
	   }
	       
	   const result = await response.json();
	       
	   if (result.success) {
	       console.log(`Loaded ${result.count} coffee beans from database`);
	       return result.data;
	   } else {
	       throw new Error(result.error || 'Failed to load data');
	   }
	        
	} catch (error) {
	    console.error('Error loading coffee data:', error);
	    // You can return an empty array or show an error message to users
	    return [];
	}
    }

    async function loadFilteredCoffeeData(filters = {}) {
	    try {
	        // Build query parameters
	        const params = new URLSearchParams();
	        if (filters.shop_name) params.append('shop_name', filters.shop_name);
	        if (filters.origin) params.append('origin', filters.origin);
	        if (filters.processing_method) params.append('processing_method', filters.processing_method);
	        if (filters.container) params.append('container', filters.container);
	        
	        const url = `API_BASE/filter?${params.toString()}`;
	        const response = await fetch(url);
	        
	        if (!response.ok) {
	            throw new Error(`HTTP error! status: ${response.status}`);
	        }
	        
	        const result = await response.json();
	        
	        if (result.success) {
	            console.log(`Found ${result.count} filtered coffee beans`);
	            return result.data;
	        } else {
	            throw new Error(result.error || 'Failed to filter data');
	        }
	        
	    } catch (error) {
	        console.error('Error filtering coffee data:', error);
	        return [];
	    }
	}

    async function addCoffeeBean(coffeeData) {
	    try {
	        const response = await fetch(API_BASE, {
	            method: 'POST',
	            headers: {
	                'Content-Type': 'application/json',
	            },
	            body: JSON.stringify(coffeeData)
	        });
	        
	        if (!response.ok) {
	            throw new Error(`HTTP error! status: ${response.status}`);
	        }
	        
	        const result = await response.json();
	        
	        if (result.success) {
	            console.log('Coffee bean added successfully:', result.data);
	            return result.data;
	        } else {
	            throw new Error(result.error || 'Failed to add coffee bean');
	        }
	        
	    } catch (error) {
	        console.error('Error adding coffee bean:', error);
	        throw error; // Re-throw so calling code can handle it
	    }
	}

	function renderCoffeeCards(coffees) {
	    const grid = document.getElementById('coffee-grid');
	    grid.innerHTML = '';
	    coffees.forEach((coffee, index) => {
	        const containerValue = coffee.container || '';
	        const currentContainerType = getContainerType(containerValue);
	        const isInContainer = containerValue && containerValue !== '';
	        let containerClass = '';
	        
	        if (isInContainer) {
	            const containerLower = containerValue.toLowerCase();
	            if (containerLower.includes('green') || containerLower.includes('container_01')) { 
	                containerClass = 'in-container-green'; 
	            }
	            else if (containerLower.includes('grey') || containerLower.includes('gray') || containerLower.includes('container_02')) { 
	                containerClass = 'in-container-grey'; 
	            }
	        }
	        
	        const card = document.createElement('div');
	        card.className = `coffee-card ${containerClass}`;
	        card.dataset.coffeeIndex = index;
	        
	        const shopLinkDiv = document.createElement('div');
	        shopLinkDiv.className = 'coffee-shop';
	        const shopLink = document.createElement('a');
	        shopLink.href = coffee.shop_url && coffee.shop_url !== 'N/A' && coffee.shop_url !== '#' ? coffee.shop_url : '#';
	        shopLink.target = '_blank';
	        shopLink.className = 'shop-link';
	        const logoContainer = createShopLogoElement(coffee.shop_logo || '', coffee.shop_url || '#', coffee.shop_name || 'N/A');
	        shopLink.appendChild(logoContainer.firstChild);
	        const shopNameSpan = document.createElement('span');
	        shopNameSpan.className = 'shop-name';
	        shopNameSpan.textContent = coffee.shop_name || 'N/A';
	        shopLink.appendChild(shopNameSpan);
	        shopLinkDiv.appendChild(shopLink);

			const hasRecipe = coffee['recipe:_in_gr'] && coffee['recipe:_out_gr'];
	        card.innerHTML = `
	            <div class="container-icons-top">
	                <div class="container-icon-wrapper">
	                    <button class="container-icon green ${currentContainerType === 'green' ? 'active' : ''}" 
	                            onclick="toggleContainer(${index}, 'green')" 
	                            title="Green Container"
	                            ${!isAuthorized ? 'disabled' : ''}>
	                        <i data-lucide="archive"></i>
	                    </button>
	                </div>
	                <div class="container-icon-wrapper">
	                    <button class="container-icon grey ${currentContainerType === 'grey' ? 'active' : ''}" 
	                            onclick="toggleContainer(${index}, 'grey')" 
	                            title="Grey Container"
	                            ${!isAuthorized ? 'disabled' : ''}>
	                        <i data-lucide="archive"></i>
	                    </button>
	                </div>
	            </div>
	            <div class="coffee-header">
	                <div class="coffee-name">${coffee.name}</div>
	            </div>
	            <div class="coffee-details">
	                <div class="detail-item">
	                    <div class="detail-label">Origin</div>
	                    <div class="detail-value">${coffee.origin || 'N/A'}</div>
	                </div>
	                <div class="detail-item">
	                    <div class="detail-label">Region</div>
	                    <div class="detail-value">${coffee.region || 'N/A'}</div>
	                </div>
	                <div class="detail-item">
	                    <div class="detail-label">Height (m)</div>
	                    <div class="detail-value">${coffee.height_m || 'N/A'}</div>
	                </div>
	                <div class="detail-item">
	                    <div class="detail-label">Variety</div>
	                    <div class="detail-value">${coffee.botanic_variety || 'N/A'}</div>
	                </div>
	                <div class="detail-item">
	                    <div class="detail-label">Farm/Producer</div>
	                    <div class="detail-value">${coffee['farm_/_producer'] || 'N/A'}</div>
	                </div>
	                <div class="detail-item">
	                    <div class="detail-label">Processing</div>
	                    <div class="detail-value">${coffee.processing_method || 'N/A'}</div>
	                </div>
	                <div class="detail-item">
	                    <div class="detail-label">SCA Score</div>
	                    <div class="detail-value">${coffee.sca || 'N/A'}</div>
	                </div>
	            </div>
	            <div class="flavor-notes">
	                <h4>Flavor Profile</h4>
	                <p>${coffee.flavor || 'N/A'}</p>
	            </div>
	            <div class="notes-section" id="notes-${index}">
	                <h4><i data-lucide="sticky-note"></i>Notes</h4>
	                <div class="notes-content ${coffee.notes ? '' : 'empty'}" id="notes-content-${index}">
	                    ${coffee.notes || 'No notes yet.'}
	                </div>
	                <div class="notes-actions">
	                    <button class="notes-btn notes-btn-edit ${!isAuthorized ? 'disabled' : ''}" 
		     			onclick="editNotes(${index})" 
            				${!isAuthorized ? 'disabled' : ''}>
	                        <i data-lucide="square-pen"></i>Edit
	                    </button>
	                </div>
	            </div>
	            <div class="recipe">
	                <h4>Espresso Recipe</h4>
	                <div class="recipe-grid" data-state="2">
		 	${hasRecipe ? `
			    <div class="shot-toggle">
				<img src="2shot.svg" alt="Shot icon" class="shot-icon" />
					<div class="slide-switch" onclick="toggleSlide(this)" data-state="double">
						<span class="label single">Single</span>
						<span class="label double">Double</span>
						<div class="thumb"></div>
					</div>
			    </div>
			` : ''}
	                    <div class="recipe-item">
	                        <div class="recipe-label">Ratio</div>
	                        <div class="recipe-value">${coffee['recipe:_ratio'] || '1:2'}</div>
	                    </div>
	                    <div class="recipe-item">
	                        <div class="recipe-label">In (g)</div>
	                        <div class="recipe-value in-val">${coffee['recipe:_in_gr'] || '18'}</div>
	                    </div>
	                    <div class="recipe-item">
	                        <div class="recipe-label">Out (g)</div>
	                        <div class="recipe-value out-val">${coffee['recipe:_out_gr'] || '36'}</div>
	                    </div>
	                    <div class="recipe-item">
	                        <div class="recipe-label">Time (s)</div>
	                        <div class="recipe-value">${coffee['recipe:_time_s'] || '28'}</div>
	                    </div>
	                    <div class="recipe-item">
	                        <div class="recipe-label">Temp (°C)</div>
	                        <div class="recipe-value">${coffee['recipe:_temperature_°c'] || '93'}</div>
	                    </div>
	                </div>
	            </div>
	        `;
	        
	        card.querySelector('.coffee-header').appendChild(shopLinkDiv);
	        grid.appendChild(card);
	    });
	    lucide.createIcons();
	}

    function toggleSlide(switchEl) {
		  const isDouble = switchEl.dataset.state === "double";
		  const shotIcon = switchEl.parentElement.querySelector('.shot-icon');
		
		  // Switch state
		  switchEl.dataset.state = isDouble ? "single" : "double";
		
		  // Update icon
		  shotIcon.src = isDouble ? "1shot.svg" : "2shot.svg";
		
		  // Optional: do something with recipe values
		  const card = switchEl.closest('.recipe-grid');
	    	  if (!card) return;
		  const factor = isDouble ? 0.5 : 2;
		  const inVal = card.querySelector('.in-val');
		  const outVal = card.querySelector('.out-val');
		
		  inVal.textContent = (parseFloat(inVal.textContent) * factor).toFixed(1);
		  outVal.textContent = (parseFloat(outVal.textContent) * factor).toFixed(1);
		}


    function editNotes(coffeeIndex) {
        const notesSection = document.getElementById(`notes-${coffeeIndex}`);
        const currentNotes = filteredCoffees[coffeeIndex].notes || '';
        notesSection.classList.add('notes-editing');
        notesSection.innerHTML = `<h4><i data-lucide="sticky-note"></i>Edit Notes</h4><textarea class="notes-input" id="notes-input-${coffeeIndex}" placeholder="Add grinder settings, tasting notes, or any other observations...">${currentNotes}</textarea><div class="notes-actions"><button class="notes-btn notes-btn-save" onclick="saveNotes(${coffeeIndex})"><i data-lucide="check"></i>Save</button><button class="notes-btn notes-btn-cancel" onclick="cancelEditNotes(${coffeeIndex})"><i data-lucide="x"></i>Cancel</button></div>`;
        lucide.createIcons();
        document.getElementById(`notes-input-${coffeeIndex}`).focus();
    }

    async function saveNotes(coffeeIndex) {
	    if (!isAuthorized) {
	        showNotification('Please log in to save notes.', 'error');
	        const loginSuccess = await promptForLogin();
			if (!loginSuccess) {
    				return; // Don't proceed with save if login failed
	        return;
	    }
	    
	    const notesInput = document.getElementById(`notes-input-${coffeeIndex}`);
	    const newNotes = notesInput.value.trim();
	    const coffeeId = filteredCoffees[coffeeIndex].id;
	    const saveButton = notesInput.parentNode.querySelector('.notes-btn-save');
	    const originalSaveText = saveButton.innerHTML;
	    
	    saveButton.innerHTML = '<i data-lucide="loader-2"></i> Saving...';
	    saveButton.disabled = true;
	    
	    try {
	        // Call your new Node.js API to update notes
	        const response = await fetch(API_BASE/notes, {
	            method: 'PATCH',
	            headers: {
	                'Content-Type': 'application/json',
	            },
	            body: JSON.stringify({
	                id: coffeeId,
	                notes: newNotes
	            })
	        });
	        
	        if (!response.ok) {
	            throw new Error(`HTTP error! status: ${response.status}`);
	        }
	        
	        const result = await response.json();
                console.log('Server response:', result);

	        
	        if (result.success) {
	            // Update local data
	            filteredCoffees[coffeeIndex].notes = newNotes;
		    const coffeeId = filteredCoffees[coffeeIndex].id;
		    const coffeeInAll = allCoffees.find(coffee => coffee.id === coffeeId);
	            if (coffeeInAll) coffeeInAll.notes = newNotes;
	            
	            // Re-render the notes section
	            renderNotesSection(coffeeIndex, newNotes);
	            showNotification('Notes saved successfully!', 'success');
	        } else {
	            throw new Error(result.error || 'Failed to save notes');
	        }
	    } catch (error) {
	        console.error('Error saving notes:', error);
	        saveButton.innerHTML = originalSaveText;
	        saveButton.disabled = false;
	        
	        if (error.message.includes('Unauthorized')) {
	            showNotification('Session expired. Please log in again.', 'warning');
	            logout();
	        } else {
	            showNotification('Failed to save notes. Please try again.', 'error');
	        }
	        lucide.createIcons();
	    }
	}

    function cancelEditNotes(coffeeIndex) {
        renderNotesSection(coffeeIndex, filteredCoffees[coffeeIndex].notes || '');
    }

    function renderNotesSection(coffeeIndex, notes) {
        const notesSection = document.getElementById(`notes-${coffeeIndex}`);
        notesSection.classList.remove('notes-editing');
        notesSection.innerHTML = 
		`<h4><i data-lucide="sticky-note"></i>Notes</h4>
  			<div class="notes-content ${notes ? '' : 'empty'}" id="notes-content-${coffeeIndex}">${notes || 'No notes yet.'}</div>
     			<div class="notes-actions">
				<button class="notes-btn notes-btn-edit ${!isAuthorized ? 'disabled' : ''}" 
            				onclick="editNotes(${coffeeIndex})" 
            				${!isAuthorized ? 'disabled' : ''}>
					<i data-lucide="square-pen"></i>Edit
 				</button>
 			</div>`;
        lucide.createIcons();
    }

    async function toggleContainer(coffeeIndex, containerType) {
	    if (!isAuthorized) {
	        showNotification('Login required to add or edit content.', 'info');
	        return;
	    }
	    
	    const coffee = filteredCoffees[coffeeIndex];
	    const currentContainer = getContainerType(coffee.container);
	    
	    if (currentContainer === containerType) {
	        // Coffee is already in this container - confirm removal
	        showContainerModal(
	            `Remove ${coffee.name} from ${containerType} container?`,
	            () => updateContainer(coffeeIndex, ''),
	            () => {}
	        );
	    } else {
	        // Check if another coffee is in this container
	        const coffeeInContainer = allCoffees.find(c => getContainerType(c.container) === containerType);
	            
	        if (coffeeInContainer) {
	            showContainerModal(
	                `Move ${coffee.name} to ${containerType} container? This will remove ${coffeeInContainer.name} from the container.`,
	                () => updateContainer(coffeeIndex, containerType),
	                () => {}
	            );
	        } else {
	            showContainerModal(
	                `Move ${coffee.name} to ${containerType} container?`,
	                () => updateContainer(coffeeIndex, containerType),
	                () => {}
	            );
	        }
	    }
	}

    function getContainerType(containerValue) {
	    if (!containerValue) return null;
	    const containerLower = containerValue.toLowerCase();
	    
	    // Check for both containers
	    const hasGreen = containerLower.includes('green') || containerLower.includes('container_01');
	    const hasGrey = containerLower.includes('grey') || containerLower.includes('gray') || containerLower.includes('container_02');
	    
	    if (hasGreen && hasGrey) return 'both';
	    if (hasGreen) return 'green';
	    if (hasGrey) return 'grey';
	    return null;
	}

    function showContainerModal(message, onConfirm, onCancel) {
	// Remove existing modal if any
	const existingModal = document.getElementById('container-modal');
	if (existingModal) {
	    existingModal.remove();
	}
	
	const modal = document.createElement('div');
	modal.id = 'container-modal';
	modal.innerHTML = `
	    <div class="modal-backdrop">
	        <div class="modal-content">
	            <h3>Confirm Container Change</h3>
	            <p>${message}</p>
	            <div class="modal-actions">
	                <button class="modal-btn modal-btn-cancel" onclick="closeContainerModal()">Cancel</button>
	                <button class="modal-btn modal-btn-confirm" onclick="confirmContainerAction()">Confirm</button>
	            </div>
	        </div>
	    </div>
	`;

	// Add modal styles
	const style = document.createElement('style');
	style.textContent = `
	    #container-modal .modal-backdrop {
	        position: fixed;
	        top: 0;
	        left: 0;
	        width: 100%;
	        height: 100%;
	        background: rgba(0, 0, 0, 0.5);
	        display: flex;
	        align-items: center;
	        justify-content: center;
	        z-index: 10000;
	    }
	    #container-modal .modal-content {
	        background: white;
	        padding: 24px;
	        border-radius: 12px;
	        max-width: 400px;
	        width: 90%;
	        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	    }
	    #container-modal .modal-content h3 {
	        margin: 0 0 16px 0;
	        color: #1f2937;
	        font-size: 18px;
	        font-weight: 600;
	    }
	    #container-modal .modal-content p {
	        margin: 0 0 24px 0;
	        color: #6b7280;
	        line-height: 1.5;
	    }
	    #container-modal .modal-actions {
	        display: flex;
	        gap: 12px;
	        justify-content: flex-end;
	    }
	    #container-modal .modal-btn {
	        padding: 8px 16px;
	        border: none;
	        border-radius: 6px;
	        font-weight: 500;
	        cursor: pointer;
	        transition: all 0.2s;
	    }
	    #container-modal .modal-btn-cancel {
	        background: #f3f4f6;
	        color: #374151;
	    }
	    #container-modal .modal-btn-cancel:hover {
	        background: #e5e7eb;
	    }
	    #container-modal .modal-btn-confirm {
	        background: #3b82f6;
	        color: white;
	    }
	    #container-modal .modal-btn-confirm:hover {
	        background: #2563eb;
	    }
	`;
	document.head.appendChild(style);
	document.body.appendChild(modal);
	    
	// Store callbacks for the modal buttons
	window.containerModalOnConfirm = onConfirm;
	window.containerModalOnCancel = onCancel;
    }

    function closeContainerModal() {
	const modal = document.getElementById('container-modal');
	if (modal) {
	    modal.remove();
	}
	if (window.containerModalOnCancel) {
	    window.containerModalOnCancel();
	}
    }
	
    function confirmContainerAction() {
	if (window.containerModalOnConfirm) {
	    window.containerModalOnConfirm();
	}
	closeContainerModal();
    }
	
    async function updateContainer(coffeeIndex, newContainerType) {
	    const coffee = filteredCoffees[coffeeIndex];
	    const containerValue = newContainerType ? 
	        (newContainerType === 'green' ? 'Green Container' : 'Grey Container') : '';
	       
	    try {
	        showNotification('Updating container...', 'info');
	        
	        // Build URL with parameters for GET request
	        const params = new URLSearchParams({
	            action: 'updateContainer',
	            coffeeName: coffee.name,
	            containerType: newContainerType || '', // Send empty string for removal
	            userEmail: currentUser
	        });
	        
	        const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
	        const response = await fetch(url);
	        
	        if (!response.ok) {
	            throw new Error(`HTTP error! status: ${response.status}`);
	        }
	        
	        const result = await response.json();
	        
	        if (result.success) {
	            // First, remove any other coffee from this container if setting a new container
	            if (newContainerType) {
	                const otherCoffeeIndex = allCoffees.findIndex(c => 
	                    c.name !== coffee.name && getContainerType(c.container) === newContainerType
	                );
	                if (otherCoffeeIndex !== -1) {
	                    allCoffees[otherCoffeeIndex].container = '';
	                    // Update in filtered coffees too if it exists there
	                    const filteredOtherIndex = filteredCoffees.findIndex(c => c.name === allCoffees[otherCoffeeIndex].name);
	                    if (filteredOtherIndex !== -1) {
	                        filteredCoffees[filteredOtherIndex].container = '';
	                    }
	                }
	            }
	               
	            // Update the current coffee
	            coffee.container = containerValue;
	            const coffeeInAll = allCoffees.find(c => c.name === coffee.name);
	            if (coffeeInAll) {
	                coffeeInAll.container = containerValue;
	            }
	            
	            // Re-render all cards to update container states
	            renderCoffeeCards(filteredCoffees);
	               
	            showNotification(
	                newContainerType ? 
	                `${coffee.name} moved to ${newContainerType} container!` : 
	                `${coffee.name} removed from container!`, 
	                'success'
	            );
	        } else {
	            throw new Error(result.error || 'Failed to update container');
	        }
	        
	    } catch (error) {
	        console.error('Error updating container:', error);
	        
	        if (error.message.includes('Unauthorized')) {
	            showNotification('Session expired. Please log in again.', 'warning');
	            logout();
	        } else {
	            showNotification('Failed to update container. Please try again.', 'error');
	        }
	    }
	}
	    
    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- Event Listeners and Initialization ---
    window.addEventListener('scroll', function() {
        const backToTopButton = document.getElementById('back-to-top');
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
        loadCoffeeData().then(coffees => {
            allCoffees = coffees;
            filteredCoffees = [...coffees];
            populateFilters(coffees);
            applyUrlParameters();
            if (!getUrlParameters().container && !getUrlParameters().shop && !getUrlParameters().origin) {
                renderCoffeeCards(filteredCoffees);
                updateResultsCount(filteredCoffees.length, allCoffees.length);
            }
            updateFilterStates();
        });

        const backToTopButton = document.getElementById('back-to-top');
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('visible');
        }

        updateUIForUnauthorizedUser();
        setTimeout(() => {
            showNotification('Login required to add or edit content.', 'info');
        }, 1000);
        
        lucide.createIcons();
    });
