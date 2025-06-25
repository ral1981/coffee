import { getIsAuthorized, logout, promptForEmail } from "./auth.js";
import { renderCoffeeCards } from "./ui.js"; 
import { allCoffees,
	 filteredCoffees,
         setAllCoffees,
         setFilteredCoffees
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
import { getContainerType } from "./containers.js";

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
    const containerValue = coffee.container || "";
    const currentContainerType = getContainerType(containerValue);
    const isInContainer = containerValue && containerValue !== "";
    let containerClass = "";

    if (isInContainer) {
      const containerLower = containerValue.toLowerCase();
      if (
        containerLower.includes("green") ||
        containerLower.includes("container_01")
      ) {
        containerClass = "in-container-green";
      } else if (
        containerLower.includes("grey") ||
        containerLower.includes("gray") ||
        containerLower.includes("container_02")
      ) {
        containerClass = "in-container-grey";
      }
    }

    const card = document.createElement("div");
    card.className = `coffee-card ${containerClass}`;
    card.dataset.coffeeIndex = index;

    const shopLinkDiv = document.createElement("div");
    shopLinkDiv.className = "coffee-shop";
    const shopLink = document.createElement("a");
    shopLink.href =
      coffee.shop_url && coffee.shop_url !== "N/A" && coffee.shop_url !== "#"
        ? coffee.shop_url
        : "#";
    shopLink.target = "_blank";
    shopLink.className = "shop-link";
    const logoContainer = createShopLogoElement(
      coffee.shop_logo || "",
      coffee.shop_url || "#",
      coffee.shop_name || "N/A",
    );
    shopLink.appendChild(logoContainer.firstChild);
    const shopNameSpan = document.createElement("span");
    shopNameSpan.className = "shop-name";
    shopNameSpan.textContent = coffee.shop_name || "N/A";
    shopLink.appendChild(shopNameSpan);
    shopLinkDiv.appendChild(shopLink);

    const hasRecipe = coffee["recipe:_in_gr"] && coffee["recipe:_out_gr"];
    card.innerHTML = `
	            <div class="container-icons-top">
	                <button 
					  class="container-icon green ${currentContainerType === 'green' ? 'active' : ''}" 
					  data-container-type="green"
					  data-index="${index}" 
					  title="Green Container"
					  ${!getIsAuthorized() ? 'disabled' : ''}>
					  <i data-lucide="archive"></i>
					</button>
	                </div>
	                <div class="container-icon-wrapper">
	                    <button 
						  class="container-icon grey ${currentContainerType === 'grey' ? 'active' : ''}" 
						  data-container-type="grey"
						  data-index="${index}" 
						  title="Grey Container"
						  ${!getIsAuthorized() ? 'disabled' : ''}>
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
	                    <div class="detail-value">${coffee.origin || "N/A"}</div>
	                </div>
	                <div class="detail-item">
	                    <div class="detail-label">Region</div>
	                    <div class="detail-value">${coffee.region || "N/A"}</div>
	                </div>
	                <div class="detail-item">
	                    <div class="detail-label">Height (m)</div>
	                    <div class="detail-value">${coffee.height_m || "N/A"}</div>
	                </div>
	                <div class="detail-item">
	                    <div class="detail-label">Variety</div>
	                    <div class="detail-value">${coffee.botanic_variety || "N/A"}</div>
	                </div>
	                <div class="detail-item">
	                    <div class="detail-label">Farm/Producer</div>
	                    <div class="detail-value">${coffee["farm_/_producer"] || "N/A"}</div>
	                </div>
	                <div class="detail-item">
	                    <div class="detail-label">Processing</div>
	                    <div class="detail-value">${coffee.processing_method || "N/A"}</div>
	                </div>
	                <div class="detail-item">
	                    <div class="detail-label">SCA Score</div>
	                    <div class="detail-value">${coffee.sca || "N/A"}</div>
	                </div>
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
						<button 
						  class="notes-btn notes-btn-edit ${!getIsAuthorized() ? "disabled" : ""}" 
		     			  data-index="${index}"
						  title="Edit"						  
            			  ${!getIsAuthorized() ? "disabled" : ""}>
	                      <i data-lucide="square-pen"></i>Edit
	                    </button>												
	                </div>
	            </div>
	            <div class="recipe">
	                <h4>Espresso Recipe</h4>
	                <div class="recipe-grid" data-state="2">
		 	${
        hasRecipe
          ? `
			    <div class="shot-toggle">
				<img src="2shot.svg" alt="Shot icon" class="shot-icon" />
					<div class="slide-switch" data-state="double">
					  <span class="label single">Single</span>
					  <span class="label double">Double</span>
					  <div class="thumb"></div>
					</div>					
			    </div>
			`
          : ""
      }
	                    <div class="recipe-item">
	                        <div class="recipe-label">Ratio</div>
	                        <div class="recipe-value">${coffee["recipe:_ratio"] || "1:2"}</div>
	                    </div>
	                    <div class="recipe-item">
	                        <div class="recipe-label">In (g)</div>
	                        <div class="recipe-value in-val">${coffee["recipe:_in_gr"] || "18"}</div>
	                    </div>
	                    <div class="recipe-item">
	                        <div class="recipe-label">Out (g)</div>
	                        <div class="recipe-value out-val">${coffee["recipe:_out_gr"] || "36"}</div>
	                    </div>
	                    <div class="recipe-item">
	                        <div class="recipe-label">Time (s)</div>
	                        <div class="recipe-value">${coffee["recipe:_time_s"] || "28"}</div>
	                    </div>
	                    <div class="recipe-item">
	                        <div class="recipe-label">Temp (°C)</div>
	                        <div class="recipe-value">${coffee["recipe:_temperature_°c"] || "93"}</div>
	                    </div>
	                </div>
	            </div>
	        `;

    card.querySelector(".coffee-header").appendChild(shopLinkDiv);
    grid.appendChild(card);
	const greenBtn = card.querySelector('.container-icon.green');
	if (greenBtn) {
      greenBtn.addEventListener('click', () => {
        const index = parseInt(greenBtn.dataset.index);
        toggleContainer(index, 'green');
      });
	}
	const greyBtn = card.querySelector('.container-icon.grey');
	if (greyBtn) {
      greyBtn.addEventListener('click', () => {
        const index = parseInt(greyBtn.dataset.index);
        toggleContainer(index, 'grey');
      });
	}
	const editBtn = card.querySelector('.notes-btn-edit');
	if (editBtn) {
	  editBtn.addEventListener('click', () => editNotes(index));
	  }
	const switchEl = card.querySelector('.slide-switch');
	if (switchEl) {
	  switchEl.addEventListener('click', () => toggleSlide(switchEl));
	}
	lucide.createIcons();
	});
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

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- Event Listeners and Initialization ---
window.addEventListener("scroll", function () {
  const backToTopButton = document.getElementById("back-to-top");
  if (backToTopButton) {
    if (window.pageYOffset > 300) {
      backToTopButton.classList.add("visible");
    } else {
      backToTopButton.classList.remove("visible");
    }
  }
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
	
  // Back to top button
  const backToTopBtn = document.getElementById("back-to-top");
  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add("visible");
    }
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

export {
  updateUIForAuthorizedUser,
  updateUIForUnauthorizedUser,
  showNotification,
  addLoginButton,
  addLogoutButton,
  toggleAddCoffee,
  renderCoffeeCards,
  createShopLogoElement,
  scrollToTop
};
