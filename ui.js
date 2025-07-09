import { getIsAuthorized, logout, promptForEmail } from "./auth.js";
import { clearAllFilters } from "./filters.js";
import { allCoffees,
	 filteredCoffees,
         setAllCoffees,
         setFilteredCoffees,
         submitNewCoffee,
         deleteCoffeeById,
         updateCoffeeById
       } from "./coffees.js";
import { editNotes } from "./notes.js";
import { loadCoffeeData,
	 populateFilters,
	 applyFilters,
	 applyUrlParameters,
	 getUrlParameters,
	 clearUrlParameters,
	 updateResultsCount,
	 toggleFilters,
	 updateFilterStates
	} from "./filters.js";
import { toggleContainer, showContainerModal } from "./containers.js";

function getDomainFromUrl(url) {
  try {
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function updateUIForAuthorizedUser() {
  document.querySelectorAll(".notes-btn-edit").forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove("disabled");
  });
  document
    .querySelectorAll(".notes-btn-save, .notes-btn-cancel")
    .forEach((btn) => (btn.style.display = "inline-flex"));
  document
    .querySelectorAll(".notes-input")
    .forEach((input) => (input.disabled = false));

  const addCoffeeToggle = document.getElementById("add-coffee-toggle");
  if (addCoffeeToggle) {
    addCoffeeToggle.disabled = false;
  }

  addLogoutButton();
  renderCoffeeCards(filteredCoffees);
}

function updateUIForUnauthorizedUser() {
  document.querySelectorAll(".notes-btn-edit").forEach((btn) => {
    btn.disabled = true;
    btn.classList.add("disabled");
  });
  document
    .querySelectorAll(".notes-btn-save, .notes-btn-cancel")
    .forEach((btn) => (btn.style.display = "none"));
  document
    .querySelectorAll(".notes-input")
    .forEach((input) => (input.disabled = true));

  const addCoffeeToggle = document.getElementById("add-coffee-toggle");
  const addCoffeeContent = document.getElementById("add-coffee-content");
  if (addCoffeeToggle) {
    addCoffeeToggle.disabled = true;
    addCoffeeToggle.setAttribute("aria-expanded", "false");
  }
  if (addCoffeeContent) {
    addCoffeeContent.classList.remove("expanded");
    addCoffeeContent.classList.add("collapsed");
  }

  addLoginButton();
  renderCoffeeCards(filteredCoffees);
}

function addLoginButton() {
  const existingBtn = document.getElementById("auth-btn");
  if (existingBtn) existingBtn.remove();
  const loginBtn = document.createElement("button");
  loginBtn.id = "auth-btn";
  loginBtn.innerHTML = '<i data-lucide="lock-keyhole"></i>Unlock';
  loginBtn.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 1000; display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: background 0.2s;`;
  loginBtn.onmouseover = () => (loginBtn.style.background = "#2563eb");
  loginBtn.onmouseout = () => (loginBtn.style.background = "#3b82f6");
  loginBtn.onclick = promptForEmail;
  document.body.appendChild(loginBtn);
  lucide.createIcons();
}

function addLogoutButton() {
  const existingBtn = document.getElementById("auth-btn");
  if (existingBtn) existingBtn.remove();
  const logoutBtn = document.createElement("button");
  logoutBtn.id = "auth-btn";
  logoutBtn.innerHTML = `<i data-lucide="lock-keyhole-open"></i>Lock`;
  logoutBtn.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 1000; display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: #6b7280; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: background 0.2s;`;
  logoutBtn.onmouseover = () => (logoutBtn.style.background = "#4b5563");
  logoutBtn.onmouseout = () => (logoutBtn.style.background = "#6b7280");
  logoutBtn.onclick = logout;
  document.body.appendChild(logoutBtn);
  lucide.createIcons();
}

function showNotification(message, type = "info") {
  document.querySelectorAll(".notification").forEach((n) => n.remove());
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    info: "#3b82f6",
    warning: "#f59e0b",
  };
  notification.style.cssText = `position: fixed; top: 80px; right: 20px; padding: 12px 20px; border-radius: 8px; color: white; font-weight: 500; z-index: 9999; transform: translateX(100%); transition: transform 0.3s ease; max-width: 300px; background: ${colors[type] || colors.info}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);`;
  document.body.appendChild(notification);
  setTimeout(() => (notification.style.transform = "translateX(0)"), 100);
  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (notification.parentNode)
        notification.parentNode.removeChild(notification);
    }, 30);
  }, 4000);
}

function toggleAddCoffee() {
  const toggle = document.getElementById("add-coffee-toggle");
  const content = document.getElementById("add-coffee-content");

  if (!getIsAuthorized()) {
    showNotification("Please log in to add coffee entries.", "warning");
    return;
  }

  const isExpanded = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", !isExpanded);

  content.classList.toggle("collapsed", isExpanded);
  content.classList.toggle("expanded", !isExpanded);
}

function getFaviconUrl(url) {
  const domain = getDomainFromUrl(url);
  return domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    : null;
}

function createShopLogoElement(shopLogo, shopUrl, shopName) {
  const logoContainer = document.createElement("div");
  logoContainer.innerHTML = "";

  const fallbackIcon = () => {
    const icon = document.createElement("div");
    icon.className = "shop-icon";
    icon.textContent = "??";
    logoContainer.appendChild(icon);
  };

  const favicon = getFaviconUrl(shopUrl);

  if (shopLogo && shopLogo !== "N/A" && shopLogo.trim() !== "") {
    const img = document.createElement("img");
    img.src = shopLogo;
    img.alt = `${shopName} logo`;
    img.className = "shop-logo";
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
    const img = document.createElement("img");
    img.src = favicon;
    img.alt = `${shopName} favicon`;
    img.className = "shop-logo";
    img.onerror = fallbackIcon;
    logoContainer.appendChild(img);
  } else {
    fallbackIcon();
  }

  return logoContainer;
}

let editingCoffeeIndex = null;

function renderCoffeeCards(coffees) {
  const grid = document.getElementById("coffee-grid");
  grid.innerHTML = "";

  // Track collapsed state for each card (default: all collapsed)
  if (!window.coffeeCardCollapsed) window.coffeeCardCollapsed = {};
  coffees.forEach((_, idx) => {
    if (window.coffeeCardCollapsed[idx] === undefined) window.coffeeCardCollapsed[idx] = true;
  });

  coffees.forEach((coffee, index) => {
    // Determine container status from booleans
    const inGreen = coffee.in_green_container;
    const inGrey = coffee.in_grey_container;
    let containerClass = "";
    if (inGreen && inGrey) containerClass = "in-container-both";
    else if (inGreen) containerClass = "in-container-green";
    else if (inGrey) containerClass = "in-container-grey";

    const isEditing = editingCoffeeIndex === index;
    const isCollapsed = window.coffeeCardCollapsed[index] === true;

    // Add a class to the card for collapsed/expanded outline
    const card = document.createElement("div");
    card.className = `coffee-card ${containerClass} ${isCollapsed ? 'collapsed-card' : 'expanded-card'}`;
    card.dataset.coffeeIndex = index;

    card.innerHTML = `
      <div class="container-icons-top" style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div class="container-icons-left" style="display: flex; gap: 4px;">
          <button class="container-icon green ${inGreen ? "active" : ""}"
                  data-container-type="green" data-index="${index}" title="Green Container"
                  ${!getIsAuthorized() ? "disabled" : ""}>
            <i data-lucide="archive"></i>
          </button>
          <button class="container-icon grey ${inGrey ? "active" : ""}"
                  data-container-type="grey" data-index="${index}" title="Grey Container"
                  ${!getIsAuthorized() ? "disabled" : ""}>
            <i data-lucide="archive"></i>
          </button>
        </div>
        <div class="container-icons-right" style="display: flex; gap: 4px;">
          ${isEditing
            ? `<button class="save-coffee-btn" data-index="${index}" title="Save"><i data-lucide="check"></i></button>
               <button class="cancel-edit-coffee-btn" data-index="${index}" title="Cancel"><i data-lucide="x"></i></button>`
            : `<button class="edit-coffee-btn" data-index="${index}" title="Edit Coffee" ${!getIsAuthorized() ? "disabled" : ""}><i data-lucide="square-pen"></i></button>`}
          <button class="delete-coffee-btn" data-index="${index}" title="Delete Coffee" ${!getIsAuthorized() ? "disabled" : ""}>
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
      <div class="coffee-header" style="display: flex; flex-direction: column; align-items: flex-start; gap: 0; margin-bottom: 0.5rem;">
        <div class="shop-row" style="display: flex; align-items: center; width: 100%; position: relative; padding-right: 0;">
          <span class="shop-info" style="margin-left: 0; display: flex; align-items: center; gap: 0.5em;"></span>          
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; position: relative;">
      <div class="coffee-name">${coffee.name}</div>
        <button class="collapse-toggle-btn far-right"
              data-index="${index}"
              title="${isCollapsed ? 'Expand' : 'Collapse'}">
          <i data-lucide="chevron-${isCollapsed ? 'down' : 'up'}"></i>
        </button>
      </div>        
      <hr class="shop-divider" style="margin: 0.5em 0 0.2em 0; border: none; border-bottom: 1px solid #e5e7eb;" />
      </div>
      <div class="coffee-card-details${isCollapsed ? ' collapsed' : ''}">
        <div class="coffee-details">
          ${isEditing
            ? `
              <input class="edit-input" name="origin" value="${coffee.origin || ''}" placeholder="Origin">
              <input class="edit-input" name="region" value="${coffee.region || ''}" placeholder="Region">
              <input class="edit-input" name="height_meters" value="${coffee.height_meters || ''}" placeholder="Height (m)" type="number">
              <input class="edit-input" name="botanic_variety" value="${coffee.botanic_variety || ''}" placeholder="Variety">
              <input class="edit-input" name="farm_producer" value="${coffee.farm_producer || ''}" placeholder="Farm/Producer">
              <input class="edit-input" name="processing_method" value="${coffee.processing_method || ''}" placeholder="Processing">
              <input class="edit-input" name="sca" value="${coffee.sca || ''}" placeholder="SCA Score" type="number">
            `
            : `
              ${createDetail("Origin", coffee.origin)}
              ${createDetail("Region", coffee.region)}
              ${createDetail("Height (m)", coffee.height_meters)}
              ${createDetail("Variety", coffee.botanic_variety)}
              ${createDetail("Farm/Producer", coffee.farm_producer)}
              ${createDetail("Processing", coffee.processing_method)}
              ${createDetail("SCA Score", coffee.sca)}
            `}
        </div>
        <div class="flavor-notes">
          <h4>Flavor Profile</h4>
          ${isEditing
            ? `<input class="edit-input" name="flavor" value="${coffee.flavor || ''}" placeholder="Flavor Profile">`
            : `<p>${coffee.flavor || "N/A"}</p>`}
        </div>
        <div class="notes-section" id="notes-${index}">
          <h4><i data-lucide="sticky-note"></i>Notes</h4>
          <div class="notes-content ${coffee.notes ? "" : "empty"}" id="notes-content-${index}">
            ${isEditing
              ? `<textarea class="edit-input" name="notes" placeholder="Notes">${coffee.notes || ''}</textarea>`
              : (coffee.notes || "No notes yet.")}
          </div>
        </div>
        <div class="recipe">
          <h4>Espresso Recipe</h4>
          <div class="recipe-grid" data-state="2">
            ${isEditing
              ? `
                <input class="edit-input" name="recipe_ratio" value="${coffee.recipe_ratio || ''}" placeholder="Ratio">
                <input class="edit-input" name="recipe_in_grams" value="${coffee.recipe_in_grams || ''}" placeholder="In (g)" type="number">
                <input class="edit-input" name="recipe_out_grams" value="${coffee.recipe_out_grams || ''}" placeholder="Out (g)" type="number">
                <input class="edit-input" name="recipe_time_seconds" value="${coffee.recipe_time_seconds || ''}" placeholder="Time (s)" type="number">
                <input class="edit-input" name="recipe_temperature_c" value="${coffee.recipe_temperature_c || ''}" placeholder="Temp (°C)" type="number">
              `
              : `
                ${createRecipeItem("Ratio", coffee["recipe_ratio"] || "1:2")}
                ${createRecipeItem("In (g)", coffee["recipe_in_grams"] || "18", "in-val")}
                ${createRecipeItem("Out (g)", coffee["recipe_out_grams"] || "36", "out-val")}
                ${createRecipeItem("Time (s)", coffee["recipe_time_seconds"] || "28")}
                ${createRecipeItem("Temp (°C)", coffee["recipe_temperature_c"] || "93")}
              `}
          </div>
        </div>
      </div>
    `;

    // Insert shop link dynamically into the .shop-info span
    const shopInfoSpan = card.querySelector(".shop-info");
    if (shopInfoSpan) {
      const link = document.createElement("a");
      link.href = coffee.shop_url && coffee.shop_url !== "N/A" ? coffee.shop_url : "#";
      link.target = "_blank";
      link.className = "shop-link";
      const logo = createShopLogoElement(coffee.shop_logo || "", coffee.shop_url || "#", coffee.shop_name || "N/A");
      link.appendChild(logo.firstChild);
      const nameSpan = document.createElement("span");
      nameSpan.className = "shop-name";
      nameSpan.textContent = coffee.shop_name || "N/A";
      link.appendChild(nameSpan);
      shopInfoSpan.appendChild(link);
    }

    // Bind events
    const greenBtn = card.querySelector(".container-icon.green");
    greenBtn?.addEventListener("click", () => toggleContainer(index, "green"));

    const greyBtn = card.querySelector(".container-icon.grey");
    greyBtn?.addEventListener("click", () => toggleContainer(index, "grey"));

    const editBtn = card.querySelector(".edit-coffee-btn");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        editingCoffeeIndex = index;
        renderCoffeeCards(filteredCoffees);
      });
    }
    const saveBtn = card.querySelector(".save-coffee-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => saveEditCoffee(index));
    }
    const cancelBtn = card.querySelector(".cancel-edit-coffee-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        editingCoffeeIndex = null;
        renderCoffeeCards(filteredCoffees);
      });
    }
    // Delete coffee event
    const deleteBtn = card.querySelector(".delete-coffee-btn");
    deleteBtn?.addEventListener("click", () => handleDeleteCoffee(index));
    const switchEl = card.querySelector(".slide-switch");
    switchEl?.addEventListener("click", () => toggleSlide(switchEl));

    // Collapse/expand event
    const collapseBtn = card.querySelector(".collapse-toggle-btn.far-right");
    if (collapseBtn) {
      collapseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        // Only expand/collapse this card
        window.coffeeCardCollapsed[index] = !isCollapsed;
        renderCoffeeCards(filteredCoffees);
      });
    }

    lucide.createIcons();
    grid.appendChild(card);
  });
}

async function saveEditCoffee(index) {
  const card = document.querySelector(`.coffee-card[data-coffee-index='${index}']`);
  if (!card) return;
  const inputs = card.querySelectorAll('.edit-input');
  const updated = {};
  inputs.forEach(input => {
    updated[input.name] = input.value;
  });
  const coffee = filteredCoffees[index];
  // Backend update
  const { error } = await updateCoffeeById(coffee.id, updated);
  if (error) {
    showNotification("Failed to update coffee.", "error");
    return;
  }
  Object.assign(coffee, updated);
  editingCoffeeIndex = null;
  renderCoffeeCards(filteredCoffees);
  showNotification("Coffee updated.", "success");
}

function createDetail(label, value) {
  return `
    <div class="detail-item">
      <div class="detail-label">${label}</div>
      <div class="detail-value">${value || "N/A"}</div>
    </div>`;
}

function createRecipeItem(label, value, extraClass = "") {
  return `
    <div class="recipe-item">
      <div class="recipe-label">${label}</div>
      <div class="recipe-value ${extraClass}">${value}</div>
    </div>`;
}

function toggleSlide(switchEl) {
  const isDouble = switchEl.dataset.state === "double";
  const shotIcon = switchEl.parentElement.querySelector(".shot-icon");

  // Switch state
  switchEl.dataset.state = isDouble ? "single" : "double";

  // Update icon
  shotIcon.src = isDouble ? "1shot.svg" : "2shot.svg";

  // Optional: do something with recipe values
  const card = switchEl.closest(".recipe-grid");
  if (!card) return;
  const factor = isDouble ? 0.5 : 2;
  const inVal = card.querySelector(".in-val");
  const outVal = card.querySelector(".out-val");

  inVal.textContent = (parseFloat(inVal.textContent) * factor).toFixed(1);
  outVal.textContent = (parseFloat(outVal.textContent) * factor).toFixed(1);
}

window.toggleSlide = toggleSlide;

document.addEventListener("DOMContentLoaded", () => {
  const backToTopBtn = document.getElementById("back-to-top");

  if (!backToTopBtn) return;

  // Show/hide button on scroll
  window.addEventListener("scroll", () => {
    backToTopBtn.classList.toggle("visible", window.pageYOffset > 300);
  });

  // Smooth scroll on click
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

document.addEventListener("DOMContentLoaded", () => {
// Add coffee button toggle
const addCoffeeBtn = document.getElementById("add-coffee-toggle");
if (addCoffeeBtn) {
  addCoffeeBtn.addEventListener("click", toggleAddCoffee);
}

  // Bind filter toggle
  const toggleBtn = document.getElementById("toggle-filters-btn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleFilters);
  }

  // Bind filter <select> changes
  const container = document.getElementById("container-filter");
  const shop = document.getElementById("shop-filter");
  const origin = document.getElementById("origin-filter");
  const clearBtn = document.getElementById("clear-filters-btn");

  if (container) container.addEventListener("change", applyFilters);
  if (shop) shop.addEventListener("change", applyFilters);
  if (origin) origin.addEventListener("change", applyFilters);
  if (clearBtn)  {
  	clearBtn.addEventListener("click", clearAllFilters);
  }
	
  // Coffee data + UI setup
  loadCoffeeData().then((coffees) => {
    setAllCoffees(coffees);
    setFilteredCoffees([...coffees]);
    populateFilters(coffees);
    applyUrlParameters();

    const params = getUrlParameters();
    if (!params.container && !params.shop && !params.origin) {
      renderCoffeeCards(filteredCoffees);
      updateResultsCount(filteredCoffees.length, allCoffees.length);
    }

    updateFilterStates();
  });

  updateUIForUnauthorizedUser();
  setTimeout(() => {
    showNotification("Login required to add or edit content.", "info");
  }, 1000);

  lucide.createIcons();
});

async function handleDeleteCoffee(index) {
  if (!getIsAuthorized()) return;
  const coffee = filteredCoffees[index];
  if (!coffee || !coffee.id) {
    showNotification("Could not find coffee id for deletion.", "error");
    return;
  }
  showContainerModal({
    message: `Are you sure you want to delete <b>${coffee.name}</b>? This action cannot be undone.`,
    onConfirm: async () => {
      const { error } = await deleteCoffeeById(coffee.id);
      if (error) {
        showNotification("Failed to delete coffee from backend.", "error");
        return;
      }
      const allIdx = allCoffees.findIndex(c => c.id === coffee.id);
      if (allIdx !== -1) allCoffees.splice(allIdx, 1);
      filteredCoffees.splice(index, 1);
      renderCoffeeCards(filteredCoffees);
      showNotification("Coffee deleted.", "success");
    },
    onCancel: () => {},
    title: 'Delete Coffee',
    icon: 'trash-2',
    iconColor: '#ef4444'
  }, {
    title: 'Delete Coffee',
    icon: 'trash-2',
    iconColor: '#ef4444'
  });
}

export {
  updateUIForAuthorizedUser,
  updateUIForUnauthorizedUser,
  showNotification,
  addLoginButton,
  addLogoutButton,
  toggleAddCoffee,
  renderCoffeeCards,
  createShopLogoElement
};