// main.js
import './supabase.js';
import './auth.js';
import './coffees.js';
import './containers.js';
import './filters.js';
import './notes.js';
import './ui.js';

// Highlight filter toggle button when any filter is active
function updateFilterButtonHighlight() {
  const container = document.getElementById('container-filter');
  const shop = document.getElementById('shop-filter');
  const origin = document.getElementById('origin-filter');
  const btn = document.getElementById('toggle-filters-btn');
  const anyActive = [container, shop, origin].some(
    sel => sel && sel.value && sel.value !== ''
  );
  if (btn) btn.classList.toggle('has-active-filters', anyActive);
}

// Attach listeners to filter selects and clear button
window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('container-filter');
  const shop = document.getElementById('shop-filter');
  const origin = document.getElementById('origin-filter');
  const clearBtn = document.getElementById('clear-filters-btn');
  if (container) container.addEventListener('change', updateFilterButtonHighlight);
  if (shop) shop.addEventListener('change', updateFilterButtonHighlight);
  if (origin) origin.addEventListener('change', updateFilterButtonHighlight);
  if (clearBtn) clearBtn.addEventListener('click', () => {
    setTimeout(updateFilterButtonHighlight, 0);
  });
  // Initial state
  updateFilterButtonHighlight();
});
