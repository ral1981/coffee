// Global variables
let allCoffees = [];
let filteredCoffees = [];	    
	    
// Authentication variables
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyuenWBem5DtTOZgU1jL5hbSoHw-19ed2mDN0H6xb1K_qv5PrtoyAW77nTDS3QBa2YCrw/exec'; // Replace with your actual URL
let currentUser = null;
let isAuthorized = false;

// --- Authentication Functions ---
async function promptForEmail() {
    const email = prompt('Please enter your login details to access editing features:');
    if (email && email.trim()) {
        await checkAuthorization(email.trim().toLowerCase());
    }
}

async function checkAuthorization(email) {
    try {
        showNotification('Checking authorization...', 'info');
        
        // Use GET request with URL parameters instead of POST
        const url = `${APPS_SCRIPT_URL}?action=checkAuth&userEmail=${encodeURIComponent(email)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.authorized) {
            currentUser = email;
            isAuthorized = true;
            showNotification('Logged in successfully.', 'success');
            updateUIForAuthorizedUser();
        } else {
            showNotification('You are not authorized to edit notes.', 'error');
            updateUIForUnauthorizedUser();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showNotification('Authentication failed. Please try again.', 'error');
        updateUIForUnauthorizedUser();
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

function logout() {
    currentUser = null;
    isAuthorized = false;
    updateUIForUnauthorizedUser();
    showNotification('Logged out successfully.', 'info');
}

function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };

    notification.style.cssText = `position: fixed; top: 80px; right: 20px; padding: 12px 20px; border-radius: 8px; color: white; font-weight: 500; z-index: 9999; transform: translateX(100%); transition: transform 0.3s ease; max-width: 300px; background: ${colors[type] || colors.info}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);`;

    document.body.appendChild(notification);

    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) notification.parentNode.removeChild(notification);
        }, 300);
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

// Handle Add Coffee Form Submission
async function submitNewCoffee(event) {
    event.preventDefault();
    if (!isAuthorized) {
        showNotification('You must be logged in to add new coffee entries.', 'error');
        return;
    }

    const form = event.target;
    const formData = new FormData(form);
    const coffeeData = Object.fromEntries(formData.entries());

    // Add current user email to the data
    coffeeData.added_by = currentUser;

    // Validate required fields
    const requiredFields = ['name', 'shop_name', 'shop_url', 'origin'];
    for (const field of requiredFields) {
        if (!coffeeData[field]) {
            showNotification(`Please fill in the '${field.replace('_', ' ')}' field.`, 'error');
            return;
        }
    }
    
    // Ensure numerical fields are numbers
    coffeeData.height_m = coffeeData.height_m ? parseFloat(coffeeData.height_m) : null;
    coffeeData.sca = coffeeData.sca ? parseFloat(coffeeData.sca) : null;
    coffeeData.recipe_in_gr = coffeeData.recipe_in_gr ? parseFloat(coffeeData.recipe_in_gr) : null;
    coffeeData.recipe_out_gr = coffeeData.recipe_out_gr ? parseFloat(coffeeData.recipe_out_gr) : null;
    coffeeData.recipe_time_s = coffeeData.recipe_time_s ? parseInt(coffeeData.recipe_time_s, 10) : null;
    coffeeData.recipe_temperature_c = coffeeData.recipe_temperature_c ? parseInt(coffeeData.recipe_temperature_c, 10) : null;

    showNotification('Adding new coffee...', 'info');

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'addCoffee', data: coffeeData }),
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Coffee added successfully!', 'success');
            form.reset();
            resetAddCoffeeForm();
            loadCoffeeData().then(coffees => {
                allCoffees = coffees;
                applyFilters();
            });
        } else {
            showNotification(`Error adding coffee: ${result.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error submitting new coffee:', error);
        showNotification('Failed to add coffee. Please try again.', 'error');
    }
}

function resetAddCoffeeForm() {
    document.getElementById('add-coffee-form').reset();
    document.getElementById('add-coffee-toggle').setAttribute('aria-expanded', 'false');
    document.getElementById('add-coffee-content').classList.remove('expanded');
    document.getElementById('add-coffee-content').classList.add('collapsed');
    updateFavicon(); // Reset favicon preview
    document.getElementById('add-recipe-ratio').value = ''; // Clear ratio
}

// Calculate Espresso Ratio
function calculateRatio() {
    const inputIn = parseFloat(document.getElementById('add-recipe-in').value);
    const inputOut = parseFloat(document.getElementById('add-recipe-out').value);
    const ratioInput = document.getElementById('add-recipe-ratio');

    if (inputIn > 0 && inputOut > 0) {
        const ratio = (inputOut / inputIn).toFixed(1);
        ratioInput.value = `1:${ratio}`;
    } else {
        ratioInput.value = '';
    }
}

// Update Favicon Preview
function updateFavicon() {
    const shopUrl = document.getElementById('add-shop-url').value;
    const faviconImg = document.getElementById('favicon-img');
    const faviconPlaceholder = document.getElementById('favicon-placeholder');
    const shopLogoInput = document.getElementById('add-shop-logo');

    if (shopUrl) {
        const url = new URL(shopUrl);
        const faviconUrl = `${url.protocol}//${url.hostname}/favicon.ico`;
        shopLogoInput.value = faviconUrl;

        faviconImg.src = faviconUrl;
        faviconImg.style.display = 'block';
        faviconPlaceholder.style.display = 'none';

        faviconImg.onerror = () => {
            faviconImg.style.display = 'none';
            faviconPlaceholder.style.display = 'block';
        };
    } else {
        shopLogoInput.value = '';
        faviconImg.style.display = 'none';
        faviconPlaceholder.style.display = 'block';
    }
}

function ensureHttps() {
    const shopUrlInput = document.getElementById('add-shop-url');
    let url = shopUrlInput.value.trim();
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
        shopUrlInput.value = url;
    }
    updateFavicon();
}

// Toggle Filters Section
function toggleFilters() {
    const toggle = document.querySelector('.filters-toggle');
    const content = document.getElementById('filters-content');
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

// Load Coffee Data from Google Apps Script
async function loadCoffeeData() {
    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=getCoffeeData`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.coffees || [];
    } catch (error) {
        console.error('Error loading coffee data:', error);
        showNotification('Failed to load coffee data. Please try refreshing.', 'error');
        return [];
    }
}

// Render Coffee Cards
function renderCoffeeCards(coffees) {
    const coffeeGrid = document.getElementById('coffee-grid');
    const noResults = document.getElementById('no-results');
    coffeeGrid.innerHTML = '';

    if (coffees.length === 0) {
        noResults.style.display = 'block';
        return;
    } else {
        noResults.style.display = 'none';
    }

    coffees.forEach(coffee => {
        const card = document.createElement('div');
        card.className = 'coffee-card';
        card.dataset.id = coffee.id;

        const containerBadge = coffee.container ? `
            <span class="container-badge ${coffee.container}">
                <i data-lucide="archive" style="width: 16px; height: 16px;"></i>
                ${coffee.container === 'green' ? 'Green Container' : 'Grey Container'}
            </span>
        ` : '';

        const shopLogoHtml = coffee.shop_logo ? 
            `<img src="${coffee.shop_logo}" alt="${coffee.shop_name} logo" class="shop-logo" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'%3E%3Cline x1=\\'6\\' y1=\\'6\\' x2=\\'18\\' y2=\\'18\\'%3E%3C/line%3E%3Cline x1=\\'18\\' y1=\\'6\\' x2=\\'6\\' y2=\\'18\\'%3E%3C/line%3E%3C/svg%3E'; this.classList.add('broken-image');">` :
            `<div class="shop-logo-placeholder"><i data-lucide="store" style="width: 24px; height: 24px;"></i></div>`;

        card.innerHTML = `
            ${containerBadge}
            <div class="coffee-header">
                ${shopLogoHtml}
                <div class="coffee-title-group">
                    <h2 class="coffee-title">${coffee.name}</h2>
                    <p class="shop-name">
                        <a href="${coffee.shop_url}" target="_blank" rel="noopener noreferrer">${coffee.shop_name}</a>
                    </p>
                </div>
            </div>
            <div class="coffee-details">
                <div class="detail-item">
                    <i data-lucide="map-pin" class="icon"></i>
                    <div class="detail-content">
                        <strong>Origin</strong>
                        <span>${coffee.origin || '<span class="empty">N/A</span>'}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <i data-lucide="mountain" class="icon"></i>
                    <div class="detail-content">
                        <strong>Region</strong>
                        <span>${coffee.region || '<span class="empty">N/A</span>'}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <i data-lucide="trending-up" class="icon"></i>
                    <div class="detail-content">
                        <strong>Height</strong>
                        <span>${coffee.height_m ? `${coffee.height_m} m` : '<span class="empty">N/A</span>'}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <i data-lucide="leaf" class="icon"></i>
                    <div class="detail-content">
                        <strong>Botanic Variety</strong>
                        <span>${coffee.botanic_variety || '<span class="empty">N/A</span>'}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <i data-lucide="tractor" class="icon"></i>
                    <div class="detail-content">
                        <strong>Farm / Producer</strong>
                        <span>${coffee.farm_producer || '<span class="empty">N/A</span>'}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <i data-lucide="settings" class="icon"></i>
                    <div class="detail-content">
                        <strong>Processing Method</strong>
                        <span>${coffee.processing_method || '<span class="empty">N/A</span>'}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <i data-lucide="star" class="icon"></i>
                    <div class="detail-content">
                        <strong>SCA Score</strong>
                        <span>${coffee.sca ? coffee.sca.toFixed(1) : '<span class="empty">N/A</span>'}</span>
                    </div>
                </div>
                <div class="detail-item coffee-flavor">
                    <i data-lucide="heart" class="icon"></i>
                    <div class="detail-content">
                        <strong>Flavor Profile</strong>
                        <span>${coffee.flavor || '<span class="empty">N/A</span>'}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <i data-lucide="arrow-down" class="icon"></i>
                    <div class="detail-content">
                        <strong>Recipe In</strong>
                        <span>${coffee.recipe_in_gr ? `${coffee.recipe_in_gr} gr` : '<span class="empty">N/A</span>'}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <i data-lucide="arrow-up" class="icon"></i>
                    <div class="detail-content">
                        <strong>Recipe Out</strong>
                        <span>${coffee.recipe_out_gr ? `${coffee.recipe_out_gr} gr` : '<span class="empty">N/A</span>'}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <i data-lucide="calculator" class="icon"></i>
                    <div class="detail-content">
                        <strong>Ratio</strong>
                        <span>${coffee.recipe_ratio || '<span class="empty">N/A</span>'}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <i data-lucide="timer" class="icon"></i>
                    <div class="detail-content">
                        <strong>Time</strong>
                        <span>${coffee.recipe_time_s ? `${coffee.recipe_time_s} s` : '<span class="empty">N/A</span>'}</span>
                    </div>
                </div>
                 <div class="detail-item">
                    <i data-lucide="thermometer" class="icon"></i>
                    <div class="detail-content">
                        <strong>Temperature</strong>
                        <span>${coffee.recipe_temperature_c ? `${coffee.recipe_temperature_c} °C` : '<span class="empty">N/A</span>'}</span>
                    </div>
                </div>
            </div>
            <div class="coffee-notes-section">
                <div class="notes-header">
                    <h4>Notes by ${coffee.added_by || 'Unknown'}</h4>
                    <div class="notes-actions">
                        <button class="notes-btn-edit" onclick="editNotes('${coffee.id}')" ${!isAuthorized ? 'disabled' : ''}>
                            <i data-lucide="edit" style="width: 14px; height: 14px;"></i>
                            Edit
                        </button>
                        <button class="notes-btn-save" style="display: none;" onclick="saveNotes('${coffee.id}')">
                            <i data-lucide="save" style="width: 14px; height: 14px;"></i>
                            Save
                        </button>
                        <button class="notes-btn-cancel" style="display: none;" onclick="cancelNotesEdit('${coffee.id}')">
                            <i data-lucide="x" style="width: 14px; height: 14px;"></i>
                            Cancel
                        </button>
                    </div>
                </div>
                <textarea class="notes-input" id="notes-input-${coffee.id}" disabled>${coffee.notes || ''}</textarea>
                <div class="notes-display" id="notes-display-${coffee.id}">${coffee.notes || 'No notes yet. Click edit to add.'}</div>
            </div>
        `;
        coffeeGrid.appendChild(card);
    });
    lucide.createIcons(); // Re-render Lucide icons after populating cards
    updateResultsCount(coffees.length, allCoffees.length);
}

// Update Results Count
function updateResultsCount(filteredCount, totalCount) {
    const resultsCountElement = document.getElementById('results-count');
    if (filteredCount === totalCount) {
        resultsCountElement.textContent = `Displaying all ${totalCount} coffees`;
    } else {
        resultsCountElement.textContent = `Displaying ${filteredCount} of ${totalCount} coffees`;
    }
}

// Populate Filters with unique values
function populateFilters(coffees) {
    const shopFilter = document.getElementById('shop-filter');
    const originFilter = document.getElementById('origin-filter');

    const shops = [...new Set(coffees.map(coffee => coffee.shop_name).filter(Boolean))].sort();
    const origins = [...new Set(coffees.map(coffee => coffee.origin).filter(Boolean))].sort();

    shops.forEach(shop => {
        const option = document.createElement('option');
        option.value = shop;
        option.textContent = shop;
        shopFilter.appendChild(option);
    });

    origins.forEach(origin => {
        const option = document.createElement('option');
        option.value = origin;
        option.textContent = origin;
        originFilter.appendChild(option);
    });
}

// Apply Filters
function applyFilters() {
    const containerFilter = document.getElementById('container-filter').value;
    const shopFilter = document.getElementById('shop-filter').value;
    const originFilter = document.getElementById('origin-filter').value;
    const clearFiltersBtn = document.getElementById('clear-filters-btn');

    filteredCoffees = allCoffees.filter(coffee => {
        const matchesContainer = containerFilter === '' || 
                                 (containerFilter === 'none' ? !coffee.container : coffee.container === containerFilter);
        const matchesShop = shopFilter === '' || coffee.shop_name === shopFilter;
        const matchesOrigin = originFilter === '' || coffee.origin === originFilter;
        return matchesContainer && matchesShop && matchesOrigin;
    });

    renderCoffeeCards(filteredCoffees);
    updateFilterStates(); // Update URL parameters and button state
    
    if (containerFilter || shopFilter || originFilter) {
        clearFiltersBtn.disabled = false;
    } else {
        clearFiltersBtn.disabled = true;
    }
}

// Clear All Filters
function clearAllFilters() {
    document.getElementById('container-filter').value = '';
    document.getElementById('shop-filter').value = '';
    document.getElementById('origin-filter').value = '';
    applyFilters();
    updateFilterStates();
}

// Update URL parameters based on active filters
function updateFilterStates() {
    const container = document.getElementById('container-filter').value;
    const shop = document.getElementById('shop-filter').value;
    const origin = document.getElementById('origin-filter').value;

    const params = new URLSearchParams(window.location.search);
    
    if (container) params.set('container', container); else params.delete('container');
    if (shop) params.set('shop', shop); else params.delete('shop');
    if (origin) params.set('origin', origin); else params.delete('origin');

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
}

// Get URL parameters
function getUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    return {
        container: params.get('container') || '',
        shop: params.get('shop') || '',
        origin: params.get('origin') || ''
    };
}

// Apply URL parameters on page load
function applyUrlParameters() {
    const { container, shop, origin } = getUrlParameters();

    if (container) document.getElementById('container-filter').value = container;
    if (shop) document.getElementById('shop-filter').value = shop;
    if (origin) document.getElementById('origin-filter').value = origin;

    applyFilters();
    
    if (container || shop || origin) {
        document.getElementById('filters-content').classList.remove('collapsed');
        document.getElementById('filters-content').classList.add('expanded');
        document.querySelector('.filters-toggle').setAttribute('aria-expanded', 'true');
    }
}

// Edit/Save/Cancel Notes
let originalNotes = {}; // Store original notes for cancel functionality

function editNotes(coffeeId) {
    if (!isAuthorized) {
        showNotification('Please log in to edit notes.', 'warning');
        return;
    }

    const notesDisplay = document.getElementById(`notes-display-${coffeeId}`);
    const notesInput = document.getElementById(`notes-input-${coffeeId}`);
    const editBtn = notesDisplay.closest('.coffee-notes-section').querySelector('.notes-btn-edit');
    const saveBtn = notesDisplay.closest('.coffee-notes-section').querySelector('.notes-btn-save');
    const cancelBtn = notesDisplay.closest('.coffee-notes-section').querySelector('.notes-btn-cancel');

    originalNotes[coffeeId] = notesInput.value; // Store current notes

    notesDisplay.style.display = 'none';
    notesInput.style.display = 'block';
    notesInput.disabled = false;
    notesInput.focus();

    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-flex';
    cancelBtn.style.display = 'inline-flex';
}

async function saveNotes(coffeeId) {
    if (!isAuthorized) {
        showNotification('You must be logged in to save notes.', 'error');
        return;
    }

    const notesInput = document.getElementById(`notes-input-${coffeeId}`);
    const newNotes = notesInput.value;

    showNotification('Saving notes...', 'info');

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'updateNotes', id: coffeeId, notes: newNotes, updated_by: currentUser }),
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Notes saved successfully!', 'success');
            const notesDisplay = document.getElementById(`notes-display-${coffeeId}`);
            notesDisplay.textContent = newNotes;
            exitNotesEdit(coffeeId);
            // Update the notes in the allCoffees array
            const coffeeIndex = allCoffees.findIndex(coffee => coffee.id === coffeeId);
            if (coffeeIndex > -1) {
                allCoffees[coffeeIndex].notes = newNotes;
            }
        } else {
            showNotification(`Error saving notes: ${result.error || 'Unknown error'}`, 'error');
            // Revert to original notes on error
            notesInput.value = originalNotes[coffeeId];
            const notesDisplay = document.getElementById(`notes-display-${coffeeId}`);
            notesDisplay.textContent = originalNotes[coffeeId];
            exitNotesEdit(coffeeId);
        }
    } catch (error) {
        console.error('Error saving notes:', error);
        showNotification('Failed to save notes. Please try again.', 'error');
        // Revert to original notes on error
        notesInput.value = originalNotes[coffeeId];
        const notesDisplay = document.getElementById(`notes-display-${coffeeId}`);
        notesDisplay.textContent = originalNotes[coffeeId];
        exitNotesEdit(coffeeId);
    }
}

function cancelNotesEdit(coffeeId) {
    const notesInput = document.getElementById(`notes-input-${coffeeId}`);
    notesInput.value = originalNotes[coffeeId]; // Revert to original notes
    const notesDisplay = document.getElementById(`notes-display-${coffeeId}`);
    notesDisplay.textContent = originalNotes[coffeeId];
    exitNotesEdit(coffeeId);
}

function exitNotesEdit(coffeeId) {
    const notesDisplay = document.getElementById(`notes-display-${coffeeId}`);
    const notesInput = document.getElementById(`notes-input-${coffeeId}`);
    const editBtn = notesDisplay.closest('.coffee-notes-section').querySelector('.notes-btn-edit');
    const saveBtn = notesDisplay.closest('.coffee-notes-section').querySelector('.notes-btn-save');
    const cancelBtn = notesDisplay.closest('.coffee-notes-section').querySelector('.notes-btn-cancel');

    notesInput.style.display = 'none';
    notesInput.disabled = true;
    notesDisplay.style.display = 'block';

    editBtn.style.display = 'inline-flex';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';

    delete originalNotes[coffeeId]; // Clean up stored original notes
}

// Scroll to top button functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Event Listeners
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
