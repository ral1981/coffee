import {
  getIsAuthorized,
  logout,
  promptForEmail
} from "./auth.js";
import {
  clearAllFilters
} from "./filters.js";
import {
  allCoffees,
  filteredCoffees,
  setAllCoffees,
  setFilteredCoffees,
  submitNewCoffee,
  deleteCoffeeById,
  updateCoffeeById
} from "./coffees.js";
import { editNotes } from "./notes.js";
import {
  loadCoffeeData,
  populateFilters,
  applyFilters,
  applyUrlParameters,
  getUrlParameters,
  clearUrlParameters,
  updateResultsCount,
  toggleFilters,
  updateFilterStates
} from "./filters.js";
import {
  toggleContainer,
  showContainerModal
} from "./containers.js";

let editingCoffeeIndex = null;

function getDomainFromUrl(url) {
  try {
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function getFaviconUrl(url) {
  const domain = getDomainFromUrl(url);
  return domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    : null;
}

function createShopLogoElement(shopLogo, shopUrl, shopName) {
  const logoContainer = document.createElement("div");

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

function toggleSlide(switchEl) {
  const isDouble = switchEl.dataset.state === "double";
  const shotIcon = switchEl.parentElement.querySelector(".shot-icon");
  switchEl.dataset.state = isDouble ? "single" : "double";
  shotIcon.src = isDouble ? "1shot.svg" : "2shot.svg";

  const card = switchEl.closest(".recipe-grid");
  if (!card) return;
  const factor = isDouble ? 0.5 : 2;
  const inVal = card.querySelector(".in-val");
  const outVal = card.querySelector(".out-val");
  inVal.textContent = (parseFloat(inVal.textContent) * factor).toFixed(1);
  outVal.textContent = (parseFloat(outVal.textContent) * factor).toFixed(1);
}

window.toggleSlide = toggleSlide;

function createShotToggle(currentState = "single") {
  const isDouble = currentState === "double";
  return `
    <div class="shot-toggle" data-state="${isDouble ? "double" : "single"}" onclick="toggleSlide(this)">
      <img src="${isDouble ? "2shot.svg" : "1shot.svg"}" class="shot-icon" alt="${isDouble ? "Double Shot" : "Single Shot"}" />
      <span>${isDouble ? "Double" : "Single"}</span>
    </div>
  `;
}

window.toggleSlide = toggleSlide;

function showNotification(message, type = "info") {
  document.querySelectorAll(".notification").forEach((n) => n.remove());
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    info: "#3b82f6",
    warning: "#f59e0b"
  };
  notification.style.cssText = `position: fixed; top: 80px; right: 20px; padding: 12px 20px; border-radius: 8px; color: white; font-weight: 500; z-index: 9999; transform: translateX(100%); transition: transform 0.3s ease; max-width: 300px; background: ${colors[type] || colors.info}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);`;
  document.body.appendChild(notification);
  setTimeout(() => (notification.style.transform = "translateX(0)"), 100);
  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (notification.parentNode)
        notification.parentNode.removeChild(notification);
    }, 300);
  }, 4000);
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

function updateUIForAuthorizedUser() {
  const addCoffeeToggle = document.getElementById("add-coffee-toggle");
  if (addCoffeeToggle) addCoffeeToggle.disabled = false;
  addLogoutButton();
  renderCoffeeCards(filteredCoffees);
}

function updateUIForUnauthorizedUser() {
  const addCoffeeToggle = document.getElementById("add-coffee-toggle");
  if (addCoffeeToggle) addCoffeeToggle.disabled = true;
  addLoginButton();
  renderCoffeeCards(filteredCoffees);
}

function renderCoffeeCards(coffees) {
  const grid = document.getElementById("coffee-grid");
  if (!grid) return;
  grid.innerHTML = "";

  coffees.forEach((coffee, index) => {
    const card = document.createElement("div");
    card.className = "coffee-card";
    card.setAttribute("data-coffee-index", index);

    const favicon = getFaviconUrl(coffee.shop_url);
    const shopIcon = coffee.shop_logo
      ? `<img src="${coffee.shop_logo}" class="shop-logo" alt="Logo" onerror="this.src='${favicon}'">`
      : `<img src="${favicon}" class="shop-logo" alt="Favicon">`;

    const shopName = coffee.shop_name || "Unknown Shop";
    const coffeeName = coffee.name || "Unnamed Coffee";
    const inGreen = coffee.in_green_container;
    const inGrey = coffee.in_grey_container;

    card.innerHTML = `
      <div class="card-header">
        <div class="header-left">
          ${shopIcon}
          <span class="shop-name">${shopName}</span>
        </div>
        <div class="header-right">
          <button class="container-icon green ${inGreen ? 'active' : ''}" title="Green Container"><i data-lucide="archive"></i></button>
          <button class="container-icon grey ${inGrey ? 'active' : ''}" title="Grey Container"><i data-lucide="archive"></i></button>
          <button class="edit-btn" title="Edit"><i data-lucide="pencil"></i></button>
          <button class="delete-btn" title="Delete"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      <div class="card-body">
        <div class="coffee-name-row">
          <span class="coffee-name">${coffeeName}</span>
          <button class="expand-toggle" title="Expand"><i data-lucide="chevron-down"></i></button>
        </div>
        <div class="coffee-details" style="display:none;">
          <p><strong>Origin:</strong> ${coffee.origin || ""}</p>
          <p><strong>Region:</strong> ${coffee.region || ""}</p>
          <p><strong>Height:</strong> ${coffee.height_meters || ""}</p>
          <p><strong>Variety:</strong> ${coffee.botanic_variety || ""}</p>
          <p><strong>Producer:</strong> ${coffee.farm_producer || ""}</p>
          <p><strong>Processing:</strong> ${coffee.processing_method || ""}</p>
          <p><strong>SCA Score:</strong> ${coffee.sca || ""}</p>
          <p><strong>Flavor:</strong> ${coffee.flavor || ""}</p>
          <p><strong>Notes:</strong> ${coffee.notes || ""}</p>
        </div>
      </div>
    `;

    const greenBtn = card.querySelector(".container-icon.green");
    const greyBtn = card.querySelector(".container-icon.grey");
    const details = card.querySelector(".coffee-details");
    const toggleBtn = card.querySelector(".expand-toggle");

    greenBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const conflict = allCoffees.find((c, i) => i !== index && c.in_green_container);
      if (conflict && !inGreen) {
        showContainerModal({
          message: `Green container in use by ${conflict.name}. Replace?`,
          onConfirm: async () => {
            coffee.in_green_container = true;
            await updateCoffeeById(coffee.id, { in_green_container: true });
            renderCoffeeCards(filteredCoffees);
          }
        });
        return;
      }
      coffee.in_green_container = !inGreen;
      await updateCoffeeById(coffee.id, { in_green_container: coffee.in_green_container });
      renderCoffeeCards(filteredCoffees);
    });

    greyBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const conflict = allCoffees.find((c, i) => i !== index && c.in_grey_container);
      if (conflict && !inGrey) {
        showContainerModal({
          message: `Grey container in use by ${conflict.name}. Replace?`,
          onConfirm: async () => {
            coffee.in_grey_container = true;
            await updateCoffeeById(coffee.id, { in_grey_container: true });
            renderCoffeeCards(filteredCoffees);
          }
        });
        return;
      }
      coffee.in_grey_container = !inGrey;
      await updateCoffeeById(coffee.id, { in_grey_container: coffee.in_grey_container });
      renderCoffeeCards(filteredCoffees);
    });

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = details.style.display === "block";
      details.style.display = isVisible ? "none" : "block";
      toggleBtn.innerHTML = isVisible
        ? '<i data-lucide="chevron-down"></i>'
        : '<i data-lucide="chevron-up"></i>';
      lucide.createIcons();
    });

    card.querySelector(".edit-btn").addEventListener("click", () => {
  const body = card.querySelector(".card-body");
  body.innerHTML = `
    <div class="edit-fields">
      <input name="shop_name" value="${coffee.shop_name || ''}" class="edit-input" placeholder="Shop Name">
      <input name="shop_url" value="${coffee.shop_url || ''}" class="edit-input" placeholder="Shop URL">
      <input name="shop_logo" value="${coffee.shop_logo || ''}" class="edit-input" placeholder="Logo URL">
      <input name="name" value="${coffee.name || ''}" class="edit-input" placeholder="Coffee Name">
      <input name="origin" value="${coffee.origin || ''}" class="edit-input" placeholder="Origin">
      <input name="region" value="${coffee.region || ''}" class="edit-input" placeholder="Region">
      <input name="height_meters" value="${coffee.height_meters || ''}" class="edit-input" placeholder="Height (m)">
      <input name="botanic_variety" value="${coffee.botanic_variety || ''}" class="edit-input" placeholder="Variety">
      <input name="farm_producer" value="${coffee.farm_producer || ''}" class="edit-input" placeholder="Producer">
      <input name="processing_method" value="${coffee.processing_method || ''}" class="edit-input" placeholder="Processing">
      <input name="sca" value="${coffee.sca || ''}" class="edit-input" placeholder="SCA Score">
      <input name="flavor" value="${coffee.flavor || ''}" class="edit-input" placeholder="Flavor Profile">
      <textarea name="notes" class="edit-input" placeholder="Notes">${coffee.notes || ''}</textarea>
      <div class="actions">
        <button class="btn-submit">Save</button>
        <button class="btn-cancel">Cancel</button>
      </div>
    </div>
  `;

  card.querySelector(".btn-submit").addEventListener("click", async () => {
    const updated = {};
    body.querySelectorAll(".edit-input").forEach(input => {
      updated[input.name] = input.value;
    });

  card.querySelector(".btn-cancel").addEventListener("click", () => {
    renderCoffeeCards(filteredCoffees);
  });
});

  card.querySelector(".btn-cancel").addEventListener("click", () => {
    renderCoffeeCards(filteredCoffees);
  });
});

    card.querySelector(".delete-btn").addEventListener("click", () => {
      handleDeleteCoffee(index);
    });

    grid.appendChild(card);
  });

  lucide.createIcons();
}

function toggleAddCoffee() {
  if (!getIsAuthorized()) {
    showNotification("Please log in to add coffee entries.", "warning");
    return;
  }

  const addSection = document.getElementById("add-coffee-section") || document.createElement("div");
  addSection.id = "add-coffee-section";
  addSection.className = "coffee-card add-card expanded-card";
  document.getElementById("coffee-grid").prepend(addSection);
  addSection.innerHTML = "";

  let inGreen = false;
  let inGrey = false;

  const form = document.createElement("div");
  form.className = "add-coffee-form";
  form.innerHTML = `
    <div class="card-header">
      <div class="header-left">
        <input name="shop_name" placeholder="Shop Name" class="edit-input" />
        <input name="shop_url" placeholder="Shop URL" class="edit-input" />
        <input name="shop_logo" placeholder="Logo URL" class="edit-input" />
      </div>
      <div class="header-right">
        <button class="container-icon green" title="Green Container"><i data-lucide="archive"></i></button>
        <button class="container-icon grey" title="Grey Container"><i data-lucide="archive"></i></button>
      </div>
    </div>
    <div class="coffee-name-row">
      <input name="name" placeholder="Coffee Name" class="edit-input" />
    </div>
    <div class="card-body">
      <textarea name="notes" placeholder="Notes" class="edit-input"></textarea>
      <div class="actions">
        <button class="btn-submit">Add</button>
        <button class="btn-cancel">Cancel</button>
      </div>
    </div>
  `;

  addSection.appendChild(form);
  lucide.createIcons();

  const greenBtn = form.querySelector(".container-icon.green");
  const greyBtn = form.querySelector(".container-icon.grey");

  const updateContainerUI = () => {
    greenBtn.classList.toggle("active", inGreen);
    greyBtn.classList.toggle("active", inGrey);
  };

  greenBtn.addEventListener("click", () => {
    inGreen = !inGreen;
    updateContainerUI();
  });

  greyBtn.addEventListener("click", () => {
    inGrey = !inGrey;
    updateContainerUI();
  });

  updateContainerUI();

  form.querySelector(".btn-submit").addEventListener("click", async () => {
    const inputs = form.querySelectorAll(".edit-input");
    const newCoffee = { in_green_container: inGreen, in_grey_container: inGrey };
    inputs.forEach((input) => {
      newCoffee[input.name] = input.value;
    });

    const conflicts = [];
    if (inGreen) {
      const other = allCoffees.find(c => c.in_green_container);
      if (other) conflicts.push({ container: "green", coffee: other });
    }
    if (inGrey) {
      const other = allCoffees.find(c => c.in_grey_container);
      if (other) conflicts.push({ container: "grey", coffee: other });
    }

    if (conflicts.length) {
      const msg = `${conflicts.map(c => `${c.container} is used by ${c.coffee.name}`).join("\n")}\nReplace them?`;

      showContainerModal({
        message: msg,
        onConfirm: async () => {
          await submitNewCoffee(newCoffee, true, conflicts);
          addSection.remove();
          renderCoffeeCards(filteredCoffees);
        }
      });
      return;
    }

    await submitNewCoffee(newCoffee);
    addSection.remove();
    renderCoffeeCards(filteredCoffees);
  });

  form.querySelector(".btn-cancel").addEventListener("click", () => {
    addSection.remove();
  });
}

function handleDeleteCoffee(index) {
  const coffee = filteredCoffees[index];
  if (!coffee || !coffee.id) {
    showNotification("Unable to delete: coffee entry not found.", "error");
    return;
  }

  showContainerModal({
    message: `Are you sure you want to delete <b>${coffee.name}</b>? This action cannot be undone.`,
    onConfirm: async () => {
      const { error } = await deleteCoffeeById(coffee.id);
      if (error) {
        showNotification("Failed to delete coffee.", "error");
        return;
      }

      const allIdx = allCoffees.findIndex(c => c.id === coffee.id);
      if (allIdx !== -1) allCoffees.splice(allIdx, 1);
      filteredCoffees.splice(index, 1);
      renderCoffeeCards(filteredCoffees);
      showNotification("Coffee deleted.", "success");
    },
    onCancel: () => {},
    title: "Delete Coffee",
    icon: "trash-2",
    iconColor: "#ef4444"
  });
}

// Add event listeners for filters and load data on DOMContentLoaded

function initializeApp() {
  const addCoffeeBtn = document.getElementById("add-coffee-toggle");
  if (addCoffeeBtn) {
    addCoffeeBtn.addEventListener("click", toggleAddCoffee);
  }

  const toggleFiltersBtn = document.getElementById("toggle-filters-btn");
  if (toggleFiltersBtn) {
    toggleFiltersBtn.addEventListener("click", toggleFilters);
  }

  const containerFilter = document.getElementById("container-filter");
  const shopFilter = document.getElementById("shop-filter");
  const originFilter = document.getElementById("origin-filter");
  const clearBtn = document.getElementById("clear-filters-btn");

  if (containerFilter) containerFilter.addEventListener("change", applyFilters);
  if (shopFilter) shopFilter.addEventListener("change", applyFilters);
  if (originFilter) originFilter.addEventListener("change", applyFilters);
  if (clearBtn) clearBtn.addEventListener("click", clearAllFilters);

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

  const backToTopBtn = document.getElementById("back-to-top");
  if (backToTopBtn) {
    window.addEventListener("scroll", () => {
      backToTopBtn.classList.toggle("visible", window.pageYOffset > 300);
    });
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

document.addEventListener("DOMContentLoaded", initializeApp);

export {
  updateUIForAuthorizedUser,
  updateUIForUnauthorizedUser,
  showNotification,
  addLoginButton,
  addLogoutButton,
  toggleAddCoffee,
  renderCoffeeCards
};
