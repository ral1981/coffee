import { getIsAuthorized, logout, promptForEmail } from "./auth.js";
import { clearAllFilters } from "./filters.js";
import { allCoffees,
	 filteredCoffees,
         setAllCoffees,
         setFilteredCoffees,
         submitNewCoffee,
         deleteCoffeeById
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

function renderCoffeeCards(coffees) {
  const grid = document.getElementById("coffee-grid");
  grid.innerHTML = "";

  coffees.forEach((coffee, index) => {
    // Determine container status from booleans
    const inGreen = coffee.in_green_container;
    const inGrey = coffee.in_grey_container;
    let containerClass = "";
    if (inGreen && inGrey) containerClass = "in-container-both";
    else if (inGreen) containerClass = "in-container-green";
    else if (inGrey) containerClass = "in-container-grey";

    const card = document.createElement("div");
    card.className = `coffee-card ${containerClass}`;
    card.dataset.coffeeIndex = index;

    card.innerHTML = `
      <div class="container-icons-top">
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
        <button class="delete-coffee-btn" data-index="${index}" title="Delete Coffee" ${!getIsAuthorized() ? "disabled" : ""}>
          <i data-lucide="trash-2"></i>
        </button>
      </div>

      <div class="coffee-header">
        <div class="coffee-name">${coffee.name}</div>
      </div>

      <div class="coffee-details">
        ${createDetail("Origin", coffee.origin)}
        ${createDetail("Region", coffee.region)}
        ${createDetail("Height (m)", coffee.height_m)}
        ${createDetail("Variety", coffee.botanic_variety)}
        ${createDetail("Farm/Producer", coffee["farm_/_producer"])}
        ${createDetail("Processing", coffee.processing_method)}
        ${createDetail("SCA Score", coffee.sca)}
      </div>

      <div class="flavor-notes">
        <h4>Flavor Profile</h4>
        <p>${coffee.flavor || "N/A"}</p>
      </div>

      <div class="notes-section" id="notes-${index}">
        <h4><i data-lucide="sticky-note"></i>Notes</h4>
        <div class="notes-content ${coffee.notes ? "" : "empty"}" id="notes-content-${index}">
          ${coffee.notes || "No notes yet."}
        </div>
        <div class="notes-actions">
          <button class="notes-btn notes-btn-edit ${!getIsAuthorized() ? "disabled" : ""}" 
                  data-index="${index}" ${!getIsAuthorized() ? "disabled" : ""}>
            <i data-lucide="square-pen"></i>Edit
          </button>
        </div>
      </div>

      <div class="recipe">
        <h4>Espresso Recipe</h4>
        <div class="recipe-grid" data-state="2">
          ${coffee["recipe_in_grams"] !== null && coffee["recipe_out_grams"] !== null && coffee["recipe_in_grams"] !== undefined && coffee["recipe_out_grams"] !== undefined ? `
            <div class="shot-toggle">
              <img src="2shot.svg" alt="Shot icon" class="shot-icon" />
              <div class="slide-switch" data-id="${coffee.id}" data-state="double">
                <span class="label single">Single</span>
                <span class="label double">Double</span>
                <div class="thumb"></div>
              </div>
            </div>` : ""
          }
          ${createRecipeItem("Ratio", coffee["recipe_ratio"] || "1:2")}
          ${createRecipeItem("In (g)", coffee["recipe_in_grams"] || "18", "in-val")}
          ${createRecipeItem("Out (g)", coffee["recipe_out_grams"] || "36", "out-val")}
          ${createRecipeItem("Time (s)", coffee["recipe_time_seconds"] || "28")}
          ${createRecipeItem("Temp (°C)", coffee["recipe_temperature_c"] || "93")}
        </div>
      </div>
    `;

    // Insert shop link dynamically
    const shopContainer = document.createElement("div");
    shopContainer.className = "coffee-shop";
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
    shopContainer.appendChild(link);
    card.querySelector(".coffee-header").appendChild(shopContainer);

    // Bind events - using the unified container system
    const greenBtn = card.querySelector(".container-icon.green");
    greenBtn?.addEventListener("click", () => toggleContainer(index, "green"));

    const greyBtn = card.querySelector(".container-icon.grey");
    greyBtn?.addEventListener("click", () => toggleContainer(index, "grey"));

    const editBtn = card.querySelector(".notes-btn-edit");
    editBtn?.addEventListener("click", () => editNotes(index));

    // Delete coffee event
    const deleteBtn = card.querySelector(".delete-coffee-btn");
    deleteBtn?.addEventListener("click", () => handleDeleteCoffee(index));

    const switchEl = card.querySelector(".slide-switch");
    switchEl?.addEventListener("click", () => toggleSlide(switchEl));

    lucide.createIcons();
    grid.appendChild(card);
  });
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
    onCancel: () => {}
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