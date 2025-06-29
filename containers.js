import { supabase } from "./supabase.js";
import { getIsAuthorized, getCurrentUser, logout } from "./auth.js";
import { allCoffees, filteredCoffees } from "./coffees.js";
import { showNotification, renderCoffeeCards } from "./ui.js";
import { loadCoffeeData, populateFilters, applyFilters } from "./filters.js";

/**
 * Unified container management system
 * Handles both new coffee submissions and existing coffee container toggles
 */

// Centralized container conflict detection
function findContainerConflict(containerType, excludeCoffeeId = null) {
  const containerLabel = getContainerLabel(containerType);
  if (!containerLabel) return null;
  
  return allCoffees.find(
    (coffee) => coffee.id !== excludeCoffeeId && coffee[containerLabel]
  );
}

// Get container label from type
function getContainerLabel(containerType) {
  if (containerType === "green") return "in_green_container";
  if (containerType === "grey") return "in_grey_container";
  return null;
}

// Refresh coffee data and UI after changes
async function refreshCoffeesData() {
  const coffees = await loadCoffeeData();
  allCoffees.length = 0;
  allCoffees.push(...coffees);
  filteredCoffees.length = 0;
  filteredCoffees.push(...coffees);
  renderCoffeeCards(filteredCoffees);
  populateFilters(coffees);
  applyFilters();
}

/**
 * Universal container assignment function
 * Works for both new coffee submissions and existing coffee toggles
 */
export async function handleContainerAssignment(options) {
  const {
    coffeeId,
    coffeeName,
    containerTypes = [], // Array of container types to assign
    isNewCoffee = false,
    onSuccess,
    onCancel
  } = options;

  if (!getIsAuthorized()) {
    showNotification("Login required to add or edit content.", "info");
    return { success: false, error: "Not authorized" };
  }

  // Check for conflicts across all requested containers
  const conflicts = [];
  for (const containerType of containerTypes) {
    const conflict = findContainerConflict(containerType, coffeeId);
    if (conflict) {
      conflicts.push({ containerType, conflictCoffee: conflict });
    }
  }

  // If no conflicts, proceed directly
  if (conflicts.length === 0) {
    return await executeContainerAssignment(coffeeId, containerTypes, onSuccess);
  }

  // Show confirmation dialog for conflicts
  const conflictMessage = buildConflictMessage(conflicts, coffeeName, isNewCoffee);
  
  return new Promise((resolve) => {
    showContainerConflictDialog({
      message: conflictMessage,
      onConfirm: async () => {
        const result = await executeContainerAssignment(coffeeId, containerTypes, onSuccess);
        resolve(result);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        resolve({ success: false, cancelled: true });
      }
    });
  });
}

// Build conflict message based on conflicts found
function buildConflictMessage(conflicts, coffeeName, isNewCoffee) {
  const action = isNewCoffee ? "add" : "assign";
  
  if (conflicts.length === 1) {
    const { containerType, conflictCoffee } = conflicts[0];
    return `The ${containerType} container is already in use by "${conflictCoffee.name}". ${action === 'add' ? 'Adding' : 'Assigning'} "${coffeeName}" will remove "${conflictCoffee.name}" from this container. Continue?`;
  } else {
    const containerList = conflicts.map(c => `${c.containerType} (currently: ${c.conflictCoffee.name})`).join(', ');
    return `Multiple containers are in use: ${containerList}. ${action === 'add' ? 'Adding' : 'Assigning'} "${coffeeName}" will remove the existing coffees from these containers. Continue?`;
  }
}

// Execute the actual container assignment
async function executeContainerAssignment(coffeeId, containerTypes, onSuccess) {
  try {
    showNotification("Updating containers...", "info");
    
    // Update all requested containers
    for (const containerType of containerTypes) {
      const result = await setCoffeeContainerExclusive(coffeeId, containerType, true);
      if (!result.success) {
        throw result.error;
      }
    }

    await refreshCoffeesData();
    
    const successMessage = containerTypes.length === 1 
      ? `Coffee assigned to ${containerTypes[0]} container!`
      : `Coffee assigned to ${containerTypes.join(' and ')} containers!`;
    
    showNotification(successMessage, "success");
    
    if (onSuccess) onSuccess();
    
    return { success: true };
  } catch (error) {
    console.error("Error updating containers:", error);
    
    if (error.message && error.message.includes("Unauthorized")) {
      showNotification("Session expired. Please log in again.", "warning");
      logout();
    } else {
      showNotification("Failed to update containers. Please try again.", "error");
    }
    
    return { success: false, error };
  }
}

/**
 * Handle container removal
 */
export async function handleContainerRemoval(coffeeId, coffeeName, containerType, onSuccess) {
  if (!getIsAuthorized()) {
    showNotification("Login required to add or edit content.", "info");
    return { success: false, error: "Not authorized" };
  }

  return new Promise((resolve) => {
    showContainerConflictDialog({
      message: `Remove "${coffeeName}" from the ${containerType} container?`,
      onConfirm: async () => {
        try {
          showNotification("Updating container...", "info");
          
          const result = await setCoffeeContainerExclusive(coffeeId, containerType, false);
          if (!result.success) throw result.error;
          
          await refreshCoffeesData();
          showNotification(`Coffee removed from ${containerType} container!`, "success");
          
          if (onSuccess) onSuccess();
          resolve({ success: true });
        } catch (error) {
          console.error("Error updating container:", error);
          showNotification("Failed to update container. Please try again.", "error");
          resolve({ success: false, error });
        }
      },
      onCancel: () => {
        resolve({ success: false, cancelled: true });
      },
      title: "Remove Coffee Container",
      icon: "trash-2",
      iconColor: "#dc2626"
    });
  });
}

/**
 * Unified toggle function for existing coffee cards
 */
export async function toggleContainer(coffeeIndex, containerType) {
  const coffee = filteredCoffees[coffeeIndex];
  const containerLabel = getContainerLabel(containerType);
  
  if (!containerLabel) return;

  // If currently assigned, handle removal
  if (coffee[containerLabel]) {
    return await handleContainerRemoval(
      coffee.id,
      coffee.name,
      containerType
    );
  }

  // If not assigned, handle assignment
  return await handleContainerAssignment({
    coffeeId: coffee.id,
    coffeeName: coffee.name,
    containerTypes: [containerType],
    isNewCoffee: false
  });
}

/**
 * Handler for new coffee form submissions with container selection
 */
export async function handleNewCoffeeContainers(coffeeData, selectedContainers) {
  if (selectedContainers.length === 0) {
    return { success: true }; // No containers selected, proceed normally
  }

  return await handleContainerAssignment({
    coffeeId: coffeeData.id,
    coffeeName: coffeeData.name,
    containerTypes: selectedContainers,
    isNewCoffee: true
  });
}

/**
 * Universal container conflict dialog
 */
function showContainerConflictDialog({ message, onConfirm, onCancel, title = "Container Conflict", icon = "alert-triangle", iconColor = "#f59e0b" }) {
  // Remove existing dialog if any
  const existingDialog = document.querySelector(".container-conflict-dialog-overlay");
  if (existingDialog) {
    existingDialog.remove();
  }

  const dialog = document.createElement("div");
  dialog.className = "container-conflict-dialog-overlay";
  dialog.innerHTML = `
    <div class="container-conflict-dialog">
      <div class="dialog-header">
        <i data-lucide="${icon}" style="color: ${iconColor}; width: 24px; height: 24px;"></i>
        <h3>${title}</h3>
      </div>
      <div class="dialog-message">
        <p>${message}</p>
      </div>
      <div class="dialog-actions">
        <button class="btn-cancel">
          <i data-lucide="x" style="width: 16px; height: 16px;"></i>
          Cancel
        </button>
        <button class="btn-confirm">
          <i data-lucide="check" style="width: 16px; height: 16px;"></i>
          Continue
        </button>
      </div>
    </div>
  `;

  // Event handlers
  const cancelBtn = dialog.querySelector(".btn-cancel");
  const confirmBtn = dialog.querySelector(".btn-confirm");

  cancelBtn.addEventListener("click", () => {
    closeContainerConflictDialog();
    if (onCancel) onCancel();
  });

  confirmBtn.addEventListener("click", () => {
    closeContainerConflictDialog();
    if (onConfirm) onConfirm();
  });

  // ESC key handler
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      closeContainerConflictDialog();
      if (onCancel) onCancel();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);

  document.body.appendChild(dialog);
  lucide.createIcons();
  confirmBtn.focus();
}

function closeContainerConflictDialog() {
  const dialog = document.querySelector(".container-conflict-dialog-overlay");
  if (dialog) {
    dialog.remove();
  }
}

/**
 * Set a coffee as the only one in a given container, removing any other coffee from that container.
 * @param {string|number} coffeeId - The id of the coffee to assign.
 * @param {"green"|"grey"} containerType - The container type to assign ("green" or "grey").
 * @param {boolean} assign - true to assign, false to remove from container
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function setCoffeeContainerExclusive(coffeeId, containerType, assign = true) {
  const containerLabel = getContainerLabel(containerType);
  if (!containerLabel) return { success: false, error: "Invalid container type" };

  try {
    // Remove any other coffee from this container if assigning
    if (assign) {
      const { data: others, error: findErr } = await supabase
        .from("coffee_beans")
        .select("id")
        .eq(containerLabel, true)
        .neq("id", coffeeId);
      
      if (findErr) throw findErr;
      
      if (others && others.length > 0) {
        const otherIds = others.map(c => c.id);
        const { error: removeErr } = await supabase
          .from("coffee_beans")
          .update({ [containerLabel]: false })
          .in("id", otherIds);
        
        if (removeErr) throw removeErr;
      }
    }
    
    // Assign or remove this coffee
    const { error: updateErr } = await supabase
      .from("coffee_beans")
      .update({ [containerLabel]: assign })
      .eq("id", coffeeId);
    
    if (updateErr) throw updateErr;
    
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

// Utility function to get container type from form values
export function getContainerType(containerValue) {
  if (!containerValue) return null;
  const containerLower = containerValue.toLowerCase();

  // Check for both containers
  const hasGreen =
    containerLower.includes("green") || containerLower.includes("container_01");
  const hasGrey =
    containerLower.includes("grey") ||
    containerLower.includes("gray") ||
    containerLower.includes("container_02");

  if (hasGreen && hasGrey) return "both";
  if (hasGreen) return "green";
  if (hasGrey) return "grey";
  return null;
}

// Legacy compatibility - keeping old function names for existing code
export const showContainerModal = showContainerConflictDialog;
export const updateContainer = toggleContainer;