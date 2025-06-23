// === Imports ===
import { getIsAuthorized, promptForLogin, logout } from './auth.js';
import { showNotification } from './ui.js';
import { allCoffees, filteredCoffees } from './coffees.js';
import { API_BASE } from './api.js'; // assuming this holds your localhost URL
import lucide from 'https://cdn.jsdelivr.net/npm/lucide@latest/+esm';

// === Edit Notes ===
export function editNotes(coffeeIndex) {
  const notesSection = document.getElementById(`notes-${coffeeIndex}`);
  const currentNotes = filteredCoffees[coffeeIndex].notes || '';
  notesSection.classList.add('notes-editing');

  notesSection.innerHTML = `
    <h4><i data-lucide="sticky-note"></i>Edit Notes</h4>
    <textarea class="notes-input" id="notes-input-${coffeeIndex}" placeholder="Add grinder settings, tasting notes, or any other observations...">${currentNotes}</textarea>
    <div class="notes-actions">
      <button class="notes-btn notes-btn-save">
        <i data-lucide="check"></i>Save
      </button>
      <button class="notes-btn notes-btn-cancel">
        <i data-lucide="x"></i>Cancel
      </button>
    </div>
  `;

  lucide.createIcons();

  const notesInput = document.getElementById(`notes-input-${coffeeIndex}`);
  notesInput.focus();

  const saveBtn = notesSection.querySelector('.notes-btn-save');
  const cancelBtn = notesSection.querySelector('.notes-btn-cancel');

  if (saveBtn) saveBtn.addEventListener('click', () => saveNotes(coffeeIndex));
  if (cancelBtn) cancelBtn.addEventListener('click', () => cancelEditNotes(coffeeIndex));
}

// === Save Notes ===
export async function saveNotes(coffeeIndex) {
  if (!getIsAuthorized()) {
    showNotification('Please log in to save notes.', 'error');
    const loginSuccess = await promptForLogin();
    if (!loginSuccess) return;
  }

  const notesInput = document.getElementById(`notes-input-${coffeeIndex}`);
  const newNotes = notesInput?.value.trim() || '';
  const coffeeId = filteredCoffees[coffeeIndex].id;
  const saveButton = notesInput.parentNode.querySelector('.notes-btn-save');
  const originalSaveText = saveButton.innerHTML;

  saveButton.innerHTML = '<i data-lucide="loader-2"></i> Saving...';
  saveButton.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: coffeeId, notes: newNotes })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();

    if (result.success) {
      // Update local state
      filteredCoffees[coffeeIndex].notes = newNotes;
      const match = allCoffees.find(c => c.id === coffeeId);
      if (match) match.notes = newNotes;

      renderNotesSection(coffeeIndex, newNotes);
      showNotification('Notes saved successfully!', 'success');
    } else {
      throw new Error(result.error || 'Failed to save notes');
    }
  } catch (err) {
    console.error('Save notes error:', err);
    saveButton.innerHTML = originalSaveText;
    saveButton.disabled = false;

    if (err.message.includes('Unauthorized')) {
      showNotification('Session expired. Please log in again.', 'warning');
      logout();
    } else {
      showNotification('Failed to save notes. Please try again.', 'error');
    }
    lucide.createIcons();
  }
}

// === Cancel Edit ===
export function cancelEditNotes(coffeeIndex) {
  renderNotesSection(coffeeIndex, filteredCoffees[coffeeIndex].notes || '');
}

// === Render Notes View ===
function renderNotesSection(coffeeIndex, notes) {
  const notesSection = document.getElementById(`notes-${coffeeIndex}`);
  notesSection.classList.remove('notes-editing');
  notesSection.innerHTML = `
    <h4><i data-lucide="sticky-note"></i>Notes</h4>
    <div class="notes-content ${notes ? '' : 'empty'}" id="notes-content-${coffeeIndex}">
      ${notes || 'No notes yet.'}
    </div>
    <div class="notes-actions">
      <button class="notes-btn notes-btn-edit ${!getIsAuthorized() ? 'disabled' : ''}" ${!getIsAuthorized() ? 'disabled' : ''}>
        <i data-lucide="square-pen"></i>Edit
      </button>
    </div>
  `;

  lucide.createIcons();

  const editBtn = notesSection.querySelector('.notes-btn-edit');
  if (editBtn) editBtn.addEventListener('click', () => editNotes(coffeeIndex));
}
