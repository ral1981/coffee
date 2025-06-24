import { supabase } from "./supabase.js";
import { getIsAuthorized, logout } from "./auth.js";
import { showNotification } from "./ui.js";
import { populateFilters, applyFilters } from "./filters.js";

let allCoffees = [];
let filteredCoffees = [];

function setAllCoffees(data) {
  allCoffees = data;
}

function setFilteredCoffees(data) {
  filteredCoffees = data;
}

// Toggle Add Coffee Section
function toggleAddCoffee() {
  const toggle = document.getElementById("add-coffee-toggle");
  const content = document.getElementById("add-coffee-content");

  if (!getIsAuthorized()) {
    showNotification("Please log in to add coffee entries.", "warning");
    return;
  }

  const isExpanded = toggle.getAttribute("aria-expanded") === "true";

  toggle.setAttribute("aria-expanded", !isExpanded);
  if (isExpanded) {
    content.classList.remove("expanded");
    content.classList.add("collapsed");
  } else {
    content.classList.remove("collapsed");
    content.classList.add("expanded");
  }
}

// Function to ensure url starts with HTTPS://
function ensureHttps() {
  const shopUrlInput = document.getElementById("add-shop-url");
  let url = shopUrlInput.value.trim();

  if (url && !/^https?:\/\//i.test(url)) {
    url = "https://" + url;
    shopUrlInput.value = url;
  }
}

// Function to extract domain from URL
function extractDomain(url) {
  try {
    // Handle URLs without protocol
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.warn("Invalid URL:", url);
    return null;
  }
}

// Function to generate favicon URL
function generateFaviconUrl(domain) {
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

// Function to update favicon based on shop URL
function updateFavicon() {
  const shopUrlInput = document.getElementById("add-shop-url");
  const faviconInput = document.getElementById("add-shop-logo");
  const faviconImg = document.getElementById("favicon-img");
  const faviconPlaceholder = document.getElementById("favicon-placeholder");

  if (!shopUrlInput || !faviconInput || !faviconImg || !faviconPlaceholder) {
    console.warn("Required elements not found");
    return;
  }

  const shopUrl = shopUrlInput.value.trim();

  if (!shopUrl) {
    // Clear favicon if no URL
    faviconInput.value = "";
    faviconImg.style.display = "none";
    faviconPlaceholder.style.display = "block";
    return;
  }

  const domain = extractDomain(shopUrl);

  if (domain) {
    const faviconUrl = generateFaviconUrl(domain);
    faviconInput.value = faviconUrl;

    // Show loading state
    faviconImg.classList.add("loading");
    faviconPlaceholder.style.display = "none";

    // Load and display favicon
    faviconImg.onload = function () {
      this.classList.remove("loading");
      this.style.display = "block";
    };

    faviconImg.onerror = function () {
      this.classList.remove("loading");
      this.style.display = "none";
      faviconPlaceholder.style.display = "block";
    };

    faviconImg.src = faviconUrl;
  } else {
    // Invalid domain
    faviconInput.value = "";
    faviconImg.style.display = "none";
    faviconPlaceholder.style.display = "block";
  }
}

// Debounced version of updateFavicon to avoid too many calls
let faviconUpdateTimeout;
function debouncedUpdateFavicon() {
  clearTimeout(faviconUpdateTimeout);
  faviconUpdateTimeout = setTimeout(updateFavicon, 300);
}

// Enhanced resetAddCoffeeForm function to also reset favicon
function resetAddCoffeeForm() {
  const form = document.getElementById("add-coffee-form");
  if (form) form.reset();

  const ratioField = document.getElementById("add-recipe-ratio");
  if (ratioField) ratioField.value = "";

  const faviconImg = document.getElementById("favicon-img");
  const faviconPlaceholder = document.getElementById("favicon-placeholder");
  if (faviconImg) {
    faviconImg.style.display = "none";
    faviconImg.classList.remove("loading");
    faviconImg.onload = null;
    faviconImg.onerror = null;
  }
  if (faviconPlaceholder) {
    faviconPlaceholder.style.display = "block";
  }

  const toggle = document.getElementById("add-coffee-toggle");
  const content = document.getElementById("add-coffee-content");
  if (toggle && content) {
    toggle.setAttribute("aria-expanded", "false");
    content.classList.remove("expanded");
    content.classList.add("collapsed");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const shopUrlInput = document.getElementById("add-shop-url");
  if (shopUrlInput) {
    // Replace the existing oninput with the debounced version
    shopUrlInput.removeAttribute("oninput");
    shopUrlInput.addEventListener("input", debouncedUpdateFavicon);

    // Also update on paste events
    shopUrlInput.addEventListener("paste", function () {
      setTimeout(debouncedUpdateFavicon, 10);
    });
  }
});

function calculateRatio() {
  const inGr = parseFloat(document.getElementById("add-recipe-in").value);
  const outGr = parseFloat(document.getElementById("add-recipe-out").value);
  const ratioField = document.getElementById("add-recipe-ratio");

  if (inGr && outGr && inGr > 0) {
    const ratio = (outGr / inGr).toFixed(1);
    ratioField.value = `1:${ratio}`;
  } else {
    ratioField.value = "";
  }
}

async function submitNewCoffee(event, confirmContainerReplacement = false) {
  event.preventDefault();

  if (!getIsAuthorized()) {
    showNotification("Please log in to add coffee entries.", "error");
    return;
  }

  const form = document.getElementById("add-coffee-form");
  const submitBtn = form.querySelector(".btn-submit");
  const originalText = submitBtn.innerHTML;

  // Disable form and show loading state
  submitBtn.innerHTML = '<i data-lucide="loader-2"></i> Adding Coffee...';
  submitBtn.disabled = true;

  try {
    // Collect form data
    const formData = new FormData(form);
    const coffeeData = {};

    // Updated field mapping to match your Supabase table columns
    const fieldMapping = {
      container: "container",
      name: "name",
      shop_name: "shop_name",
      shop_url: "shop_url",
      shop_logo: "shop_logo",
      origin: "origin",
      region: "region",
      height_m: "height_meters", // Updated to match DB column
      botanic_variety: "botanic_variety",
      farm_producer: "farm_producer", // Simplified field name
      processing_method: "processing_method",
      sca: "sca",
      flavor: "flavor",
      recipe_ratio: "recipe_ratio", // Simplified field names
      recipe_in_gr: "recipe_in_grams",
      recipe_out_gr: "recipe_out_grams",
      recipe_time_s: "recipe_time_seconds",
      recipe_temperature_c: "recipe_temperature_c",
    };

    // Data collection with type conversion
    for (const [formField, dbField] of Object.entries(fieldMapping)) {
      const value = formData.get(formField);
      if (value !== null && value !== undefined) {
        const trimmedValue = value.toString().trim();
        if (trimmedValue) {
          if (formField === "container") {
            // Convert container value to display format
            coffeeData[dbField] =
              value === "green"
                ? "Green Container"
                : value === "grey"
                  ? "Grey Container"
                  : "";
          } else if (
            formField.includes("height_m") ||
            formField.includes("sca") ||
            formField.includes("recipe_in_gr") ||
            formField.includes("recipe_out_gr") ||
            formField.includes("recipe_temperature_c")
          ) {
            // Convert numeric fields
            const numValue = parseFloat(trimmedValue);
            coffeeData[dbField] = isNaN(numValue) ? null : numValue;
          } else {
            coffeeData[dbField] = trimmedValue;
          }
        }
      }
    }

    // Add notes field (empty by default)
    coffeeData.notes = formData.get("notes")
      ? formData.get("notes").toString().trim()
      : "";

    // Debug logging to see what's being sent
    console.log("Coffee data being sent:", coffeeData);

    // Validate required fields
    const requiredFields = ["name", "shop_name", "shop_url", "origin"];
    const missingFields = requiredFields.filter((field) => {
      const mappedField = fieldMapping[field] || field;
      return (
        !coffeeData[mappedField] || !coffeeData[mappedField].toString().trim()
      );
    });

    if (missingFields.length > 0) {
      throw new Error(
        `Please fill in all required fields: ${missingFields.join(", ")}`,
      );
    }

    // Check if coffee with same name already exists
    const existingCoffee = allCoffees.find(
      (coffee) =>
        coffee.name &&
        coffee.name.toLowerCase() === coffeeData.name.toLowerCase(),
    );

    if (existingCoffee) {
      throw new Error("A coffee with this name already exists");
    }

    // Submit New Coffee
    const { data: inserted, error } = await supabase
      .from("coffee_beans")
      .insert(coffeeData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || "Failed to add coffee");
    }

    const newCoffee = inserted;
  } catch (error) {
    console.error("Error adding coffee:", error);

    if (error.message.includes("Unauthorized")) {
      showNotification("Session expired. Please log in again.", "warning");
      logout();
    } else {
      showNotification(
        error.message || "Failed to add coffee. Please try again.",
        "error",
      );
    }
  } finally {
    // Re-enable form
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    lucide.createIcons();
  }
}

const { data, error } = await supabase
  .from("coffee_beans")
  .insert(coffeeData)
  .select()
  .single();

if (error) {
  throw error;
}

async function addCoffeeBean(coffeeData) {
  const { data, error } = await supabase
    .from("coffee_beans")
    .insert(coffeeData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  console.log("Coffee bean added successfully:", data);
  return data;
}

export { allCoffees, filteredCoffees, setAllCoffees, setFilteredCoffees };
