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

let isAddCardActive = false;

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
  if (!getIsAuthorized()) {
    showNotification("Please log in to add coffee entries.", "warning");
    return;
  }
  isAddCardActive = true;
  renderAddCoffeeCard();
}

function getAddButtonHTML() {
  return `<button id="add-coffee-toggle" class="add-coffee-btn add-coffee-toggle"><i data-lucide="plus"></i>Add Coffee</button>`;
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

function renderAddCoffeeCard() {
  const section = document.querySelector('.add-coffee-section');
  section.innerHTML = ''; // Clear previous content

  // State for container selection
  let inGreen = false;
  let inGrey = false;

  const addCard = document.createElement("div");
  addCard.className = "coffee-card add-card expanded-card";
  addCard.innerHTML = `
    <div class="container-icons-top" style="display: flex; justify-content: flex-start; align-items: flex-start; gap: 8px;">
      <button class="container-icon green" data-container-type="green" title="Green Container" type="button">
        <i data-lucide="archive"></i>
      </button>
      <button class="container-icon grey" data-container-type="grey" title="Grey Container" type="button">
        <i data-lucide="archive"></i>
      </button>
    </div>
    <div class="coffee-header" style="display: flex; flex-direction: column; align-items: flex-start;">
      <div class="shop-row" style="display: flex; align-items: center; width: 100%;">
        <input class="edit-input" name="shop_name" value="" placeholder="Shop Name">
        <input class="edit-input" name="shop_url" value="" placeholder="Shop URL">
        <input class="edit-input" name="shop_logo" value="" placeholder="Shop Logo URL">
      </div>
      <div class="coffee-name-row" style="width: 100%;">
        <input class="edit-input" name="name" value="" placeholder="Coffee Name" style="width: 100%;">
      </div>
      <hr class="shop-divider" style="margin: 0.5em 0 0.2em 0; border: none; border-bottom: 1px solid #e5e7eb;" />
    </div>
    <div class="coffee-card-details">
      <div class="coffee-details">
        <input class="edit-input" name="origin" value="" placeholder="Origin">
        <input class="edit-input" name="region" value="" placeholder="Region">
        <input class="edit-input" name="height_m" value="" placeholder="Height (m)" type="number" step="0.1">
        <input class="edit-input" name="botanic_variety" value="" placeholder="Variety">
        <input class="edit-input" name="farm_producer" value="" placeholder="Farm/Producer">
        <input class="edit-input" name="processing_method" value="" placeholder="Processing">
        <input class="edit-input" name="sca" value="" placeholder="SCA Score" type="number" step="0.1">
      </div>
      <div class="flavor-notes">
        <h4>Flavor Profile</h4>
        <input class="edit-input" name="flavor" value="" placeholder="Flavor Profile">
      </div>
      <div class="notes-section">
        <h4><i data-lucide="sticky-note"></i>Notes</h4>
        <textarea class="edit-input" name="notes" placeholder="Notes"></textarea>
      </div>
      <div class="recipe">
        <h4>Espresso Recipe</h4>
        <div class="recipe-grid">
          <input class="edit-input" name="recipe_ratio" value="" placeholder="Ratio">
          <input class="edit-input" name="recipe_in_gr" value="" placeholder="In (g)" type="number" step="0.1">
          <input class="edit-input" name="recipe_out_gr" value="" placeholder="Out (g)" type="number" step="0.1">
          <input class="edit-input" name="recipe_time_s" value="" placeholder="Time (s)" type="number" step="0.1">
          <input class="edit-input" name="recipe_temperature_c" value="" placeholder="Temp (°C)" type="number" step="0.1">
        </div>
      </div>
      <div class="add-card-actions">
        <button class="btn-submit" type="button">Add</button>
        <button class="btn-cancel" type="button">Cancel</button>
      </div>
    </div>
  `;

  // Container icon logic
  const greenBtn = addCard.querySelector('.container-icon.green');
  const greyBtn = addCard.querySelector('.container-icon.grey');

  function updateContainerIcons() {
    greenBtn.classList.toggle('active', inGreen);
    greyBtn.classList.toggle('active', inGrey);
  }

  greenBtn.addEventListener('click', () => {
    inGreen = !inGreen;
    updateContainerIcons();
  });

  greyBtn.addEventListener('click', () => {
    inGrey = !inGrey;
    updateContainerIcons();
  });

  updateContainerIcons();

  // Save handler
  addCard.querySelector('.btn-submit').onclick = async () => {
    const newCoffee = {};
    addCard.querySelectorAll('.edit-input').forEach(input => {
      newCoffee[input.name] = input.value;
    });
    newCoffee.in_green_container = inGreen;
    newCoffee.in_grey_container = inGrey;

    // --- Container conflict check (reuse logic from submitNewCoffee) ---
    const conflicts = [];
    if (inGreen) {
      const otherGreen = allCoffees.find(c => c.in_green_container);
      if (otherGreen) conflicts.push({ container: "green", coffee: otherGreen });
    }
    if (inGrey) {
      const otherGrey = allCoffees.find(c => c.in_grey_container);
      if (otherGrey) conflicts.push({ container: "grey", coffee: otherGrey });
    }
    if (conflicts.length > 0) {
      const msg = conflicts
        .map(c => `The ${c.container} container is already in use by ${c.coffee.name}.`)
        .join("\n")
        + "\nDo you want to replace?";
      showContainerModal({
        message: msg,
        onConfirm: () => submitNewCoffee(newCoffee, true, conflicts).then(() => {
          isAddCardActive = false;
          section.innerHTML = getAddButtonHTML();
          section.querySelector('#add-coffee-toggle').addEventListener('click', toggleAddCoffee);
          renderCoffeeCards(filteredCoffees);
        }),
        onCancel: () => {}
      });
      return;
    }
    // --- End container conflict check ---

    await submitNewCoffee(newCoffee);
    isAddCardActive = false;
    section.innerHTML = getAddButtonHTML();
    section.querySelector('#add-coffee-toggle').addEventListener('click', toggleAddCoffee);
    renderCoffeeCards(filteredCoffees);
  };

  // Cancel handler
  addCard.querySelector('.btn-cancel').onclick = () => {
    isAddCardActive = false;
    section.innerHTML = getAddButtonHTML();
    section.querySelector('#add-coffee-toggle').addEventListener('click', toggleAddCoffee);
  };

  section.appendChild(addCard);

  // Re-render Lucide icons if needed
  if (typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
    lucide.createIcons();
  }
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

function renderCoffeeCards(coffees) {
  const grid = document.getElementById("coffee-grid");
  if (!grid) return;
  grid.innerHTML = "";

  coffees.forEach((coffee, index) => {
    const card = document.createElement("div");
    card.className = "coffee-card";
    card.setAttribute("data-coffee-index", index);

    // Shop favicon logic
    let faviconUrl = "";
    if (coffee.shop_url) {
      try {
        const domain = new URL(coffee.shop_url).hostname.replace(/^www\./, "");
        faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      } catch {}
    }
    const shopLogo = coffee.shop_logo
      ? `<img src="${coffee.shop_logo}" alt="Logo" class="shop-logo" style="height: 20px; width: 20px; border-radius: 4px; margin-right: 6px;" onerror="this.style.display='none'">`
      : (faviconUrl
        ? `<img src="${faviconUrl}" alt="Favicon" class="shop-logo" style="height: 20px; width: 20px; border-radius: 4px; margin-right: 6px;" onerror="this.style.display='none'">`
        : `<span class="shop-logo" style="display:inline-block;width:20px;height:20px;background:#eee;border-radius:4px;margin-right:6px;text-align:center;line-height:20px;">?</span>`);

    // Shop name as link if URL present
    const shopName = coffee.shop_url
      ? `<a href="${coffee.shop_url}" target="_blank" rel="noopener" class="shop-name">${coffee.shop_name || ""}</a>`
      : `<span class="shop-name">${coffee.shop_name || ""}</span>`;

    // Card HTML with favicon and shop name on first row, coffee name on second row
    card.innerHTML = `
      <div class="coffee-header" style="display: flex; flex-direction: column; align-items: flex-start;">
        <div class="shop-row" style="display: flex; align-items: center; width: 100%;">
          ${shopLogo}
          ${shopName}
        </div>
        <div class="coffee-name-row" style="display: flex; align-items: center; width: 100%; margin-top: 2px;">
          <span class="coffee-name" style="font-weight: 600;">${coffee.name || ""}</span>
          <button class="expand-toggle" aria-label="Expand/Collapse" style="margin-left: auto; background: none; border: none; cursor: pointer;">
            <i data-lucide="chevron-down"></i>
          </button>
        </div>
        <hr class="shop-divider" style="margin: 0.5em 0 0.2em 0; border: none; border-bottom: 1px solid #e5e7eb;" />
      </div>
      <div class="coffee-card-details" style="display: none;">
        <div class="coffee-details">
          <span>${coffee.origin || ""}</span>
          <span>${coffee.region || ""}</span>
          <span>${coffee.height_meters !== undefined ? coffee.height_meters : ""}</span>
          <span>${coffee.botanic_variety || ""}</span>
          <span>${coffee.farm_producer || ""}</span>
          <span>${coffee.processing_method || ""}</span>
          <span>${coffee.sca !== undefined ? coffee.sca : ""}</span>
        </div>
        <div class="flavor-notes">
          <h4>Flavor Profile</h4>
          <span>${coffee.flavor || ""}</span>
        </div>
        <div class="notes-section">
          <h4><i data-lucide="sticky-note"></i>Notes</h4>
          <span>${coffee.notes || ""}</span>
        </div>
        <div class="recipe">
          <h4>Espresso Recipe</h4>
          <div class="recipe-grid">
            <span>${coffee.recipe_ratio || ""}</span>
            <span>${coffee.recipe_in_grams !== undefined ? coffee.recipe_in_grams : ""}</span>
            <span>${coffee.recipe_out_grams !== undefined ? coffee.recipe_out_grams : ""}</span>
            <span>${coffee.recipe_time_seconds !== undefined ? coffee.recipe_time_seconds : ""}</span>
            <span>${coffee.recipe_temperature_c !== undefined ? coffee.recipe_temperature_c : ""}</span>
          </div>
        </div>
      </div>
    `;

    // Expand/collapse logic
    const details = card.querySelector(".coffee-card-details");
    const toggleBtn = card.querySelector(".expand-toggle");
    let expanded = false;
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      expanded = !expanded;
      details.style.display = expanded ? "block" : "none";
      card.classList.toggle("expanded-card", expanded);
      toggleBtn.innerHTML = expanded
        ? `<i data-lucide="chevron-up"></i>`
        : `<i data-lucide="chevron-down"></i>`;
      if (typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
        lucide.createIcons();
      }
    });

    // Optionally: expand card on header click (not just button)
    card.querySelector(".coffee-header").addEventListener("click", (e) => {
      if (e.target.closest(".expand-toggle")) return;
      expanded = !expanded;
      details.style.display = expanded ? "block" : "none";
      card.classList.toggle("expanded-card", expanded);
      toggleBtn.innerHTML = expanded
        ? `<i data-lucide="chevron-up"></i>`
        : `<i data-lucide="chevron-down"></i>`;
      if (typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
        lucide.createIcons();
      }
    });

    grid.appendChild(card);
  });

  // Render Lucide icons for all cards
  if (typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
    lucide.createIcons();
  }
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