import { supabase } from "./supabase.js";
import { getIsAuthorized, getCurrentUser, logout } from "./auth.js";
import { allCoffees, filteredCoffees, submitNewCoffee } from "./coffees.js";
import { showNotification, renderCoffeeCards } from "./ui.js";
import { loadCoffeeData, populateFilters, applyFilters } from "./filters.js";

// Function to show container replacement confirmation dialog
function showContainerReplacementDialog(result, originalEvent) {
  const dialog = document.createElement("div");
  dialog.className = "confirmation-dialog-overlay";
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

  const cancelBtn = dialog.querySelector(".btn-cancel");
  const confirmBtn = dialog.querySelector(".btn-confirm");

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeContainerReplacementDialog);
  }

  if (confirmBtn) {
    confirmBtn.addEventListener("click", (e) => confirmContainerReplacement(e));
  }

  dialog.originalEvent = originalEvent;
  document.body.appendChild(dialog);
  lucide.createIcons();
  
  dialog.querySelector(".btn-confirm").focus();

  const handleEscape = (e) => {
    if (e.key === "Escape") {
      closeContainerReplacementDialog();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);
}

function closeContainerReplacementDialog() {
  const dialog = document.querySelector(".confirmation-dialog-overlay");
  if (dialog) {
    dialog.remove();
  }
}

function confirmContainerReplacement(event) {
  const dialog = document.querySelector(".confirmation-dialog-overlay");
  const originalEvent = dialog ? dialog.originalEvent : event;

  closeContainerReplacementDialog();

  // Retry the submission with confirmation flag
  submitNewCoffee(originalEvent, true);
}

async function toggleContainer(coffeeIndex, containerType) {
  if (!getIsAuthorized()) {
    showNotification("Login required to add or edit content.", "info");
    return;
  }

  const coffee = filteredCoffees[coffeeIndex];
  let containerLabel = null;
  if (containerType === "green") containerLabel = "in_green_container";
  if (containerType === "grey") containerLabel = "in_grey_container";
  if (!containerLabel) return;

  // Toggling OFF (removal)
  if (coffee[containerLabel]) {
    showContainerModal(
      `Remove ${coffee.name} from the ${containerType} container?`,
      () => updateContainer(coffeeIndex, containerType),
      () => {}
    );
    return;
  }

  // Toggling ON (assignment)
  const otherCoffee = allCoffees.find(
    (c) => c.id !== coffee.id && c[containerLabel]
  );
  if (otherCoffee) {
    showContainerModal(
      `The ${containerType} container is already in use by ${otherCoffee.name}. This will remove it from that coffee. Continue?`,
      () => updateContainer(coffeeIndex, containerType),
      () => {}
    );
    return;
  }

  // No conflict, just assign
  updateContainer(coffeeIndex, containerType);
}

function getContainerType(containerValue) {
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

function showContainerModal(message, onConfirm, onCancel) {
  // Remove existing modal if any
  const existingModal = document.getElementById("container-modal");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.id = "container-modal";
  modal.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-content">
        <h3>Confirm Container Change</h3>
        <p>${message}</p>
        <div class="modal-actions">
          <button class="modal-btn modal-btn-cancel">Cancel</button>
          <button class="modal-btn modal-btn-confirm">Confirm</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Bind buttons
  modal
    .querySelector(".modal-btn-cancel")
    .addEventListener("click", function() {
      closeContainerModal();
      if (onCancel) onCancel();
    });
  modal
    .querySelector(".modal-btn-confirm")
    .addEventListener("click", function() {
      Promise.resolve(onConfirm()).then(closeContainerModal);
    });

  // Add ESC key listener
  function handleEscape(e) {
    if (e.key === "Escape") {
      closeContainerModal();
      document.removeEventListener("keydown", handleEscape);
    }
  }
  document.addEventListener("keydown", handleEscape);
}

function closeContainerModal() {
  const modal = document.getElementById("container-modal");
  if (modal) {
    modal.remove();
  }
}

async function updateContainer(coffeeIndex, newContainerType) {
  const coffee = filteredCoffees[coffeeIndex];
  let updateObj = {};
  let containerLabel = null;
  if (newContainerType === "green") containerLabel = "in_green_container";
  if (newContainerType === "grey") containerLabel = "in_grey_container";

  // Helper to reload data and UI after DB update
  async function refreshCoffees() {
    const coffees = await loadCoffeeData();
    allCoffees.length = 0; allCoffees.push(...coffees);
    filteredCoffees.length = 0; filteredCoffees.push(...coffees);
    renderCoffeeCards(filteredCoffees);
    populateFilters(coffees);
    applyFilters();
  }

  if (!containerLabel) {
    // Remove from all containers
    updateObj = { in_green_container: false, in_grey_container: false };
    try {
      showNotification("Updating container...", "info");
      const { error } = await supabase
        .from("coffee_beans")
        .update(updateObj)
        .eq("id", coffee.id);
      if (error) throw error;
      Object.assign(coffee, updateObj);
      const coffeeInAll = allCoffees.find((c) => c.id === coffee.id);
      if (coffeeInAll) Object.assign(coffeeInAll, updateObj);
      await refreshCoffees();
      showNotification(`Removed from all containers!`, "success");
    } catch (error) {
      console.error("Error updating container:", error);
      if (error.message.includes("Unauthorized")) {
        showNotification("Session expired. Please log in again.", "warning");
        logout();
      } else {
        showNotification(
          "Failed to update container. Please try again.",
          "error"
        );
      }
    }
    return;
  }

  // Toggling OFF (removal)
  if (coffee[containerLabel]) {
    showContainerModal(
      `Remove ${coffee.name} from the ${newContainerType} container?`,
      async () => {
        try {
          const { error } = await supabase
            .from("coffee_beans")
            .update({ [containerLabel]: false })
            .eq("id", coffee.id);
          if (error) throw error;
          coffee[containerLabel] = false;
          const coffeeInAll = allCoffees.find((c) => c.id === coffee.id);
          if (coffeeInAll) coffeeInAll[containerLabel] = false;
          await refreshCoffees();
          showNotification(`${coffee.name} removed from ${newContainerType} container!`, "success");
        } catch (error) {
          console.error("Error updating container:", error);
          showNotification("Failed to update container. Please try again.", "error");
        }
      },
      () => {}
    );
    return;
  }

  // Toggling ON (assignment)
  const otherCoffee = allCoffees.find(
    (c) => c.id !== coffee.id && c[containerLabel]
  );
  if (otherCoffee) {
    showContainerModal(
      `The ${newContainerType} container is already in use by ${otherCoffee.name}. This will remove it from that coffee. Continue?`,
      async () => {
        try {
          // Remove other coffee from this container
          await supabase
            .from("coffee_beans")
            .update({ [containerLabel]: false })
            .eq("id", otherCoffee.id);
          otherCoffee[containerLabel] = false;
          // Assign this coffee to the container
          await supabase
            .from("coffee_beans")
            .update({ [containerLabel]: true })
            .eq("id", coffee.id);
          coffee[containerLabel] = true;
          const coffeeInAll = allCoffees.find((c) => c.id === coffee.id);
          if (coffeeInAll) coffeeInAll[containerLabel] = true;
          await refreshCoffees();
          showNotification(`${coffee.name} assigned to ${newContainerType} container!`, "success");
        } catch (error) {
          console.error("Error updating container:", error);
          showNotification("Failed to update container. Please try again.", "error");
        }
      },
      () => {}
    );
    return;
  }

  // No conflict, just assign
  updateObj[containerLabel] = true;
  try {
    showNotification("Updating container...", "info");
    const { error } = await supabase
      .from("coffee_beans")
      .update(updateObj)
      .eq("id", coffee.id);
    if (error) throw error;
    coffee[containerLabel] = true;
    const coffeeInAll = allCoffees.find((c) => c.id === coffee.id);
    if (coffeeInAll) coffeeInAll[containerLabel] = true;
    await refreshCoffees();
    showNotification(`${coffee.name} assigned to ${newContainerType} container!`, "success");
  } catch (error) {
    console.error("Error updating container:", error);
    if (error.message.includes("Unauthorized")) {
      showNotification("Session expired. Please log in again.", "warning");
      logout();
    } else {
      showNotification(
        "Failed to update container. Please try again.",
        "error"
      );
    }
  }
}



export {
  getContainerType,
  toggleContainer,
  showContainerModal
};
