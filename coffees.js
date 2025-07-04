console.log("coffees.js loaded")

import { supabase } from "./supabase.js";
import { getIsAuthorized, logout } from "./auth.js";
import { showNotification } from "./ui.js";
import { populateFilters, applyFilters, loadCoffeeData } from "./filters.js";
import { showContainerModal, setCoffeeContainerExclusive } from "./containers.js";

let allCoffees = [];
let filteredCoffees = [];

function setAllCoffees(data) {
  allCoffees = data;

  console.log(allCoffees.map(c => ({
  name: c.name,
  in: c.recipe_in_grams,
  out: c.recipe_out_grams
})));

  
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

async function submitNewCoffee(eventOrData, confirmContainerReplacement = false, previousConflicts = null) {
  let formDataObj;
  let event = null;
  if (eventOrData instanceof Event) {
    event = eventOrData;
    event.preventDefault();
    // Collect form data as plain object for possible reuse
    const form = document.getElementById("add-coffee-form");
    const formData = new FormData(form);
    formDataObj = {};
    for (const [key, value] of formData.entries()) {
      formDataObj[key] = value;
    }
    // Checkboxes: add booleans for containers
    formDataObj.in_green_container = formData.get("in_green_container") === "true";
    formDataObj.in_grey_container = formData.get("in_grey_container") === "true";
  } else {
    // Called with formDataObj (from confirmation)
    formDataObj = eventOrData;
  }

  if (!getIsAuthorized()) {
    showNotification("Please log in to add coffee entries.", "error");
    return;
  }

  const form = document.getElementById("add-coffee-form");
  const submitBtn = form.querySelector(".btn-submit");
  if (!submitBtn) {
    showNotification("Submit button not found.", "error");
    return;
  }
  const originalText = submitBtn.innerHTML;

  // Disable form and show loading state
  submitBtn.innerHTML = '<i data-lucide="loader-2"></i> Adding Coffee...';

  try {
    // Use formDataObj instead of FormData
    const coffeeData = {};
    const fieldMapping = {
      name: "name",
      shop_name: "shop_name",
      shop_url: "shop_url",
      shop_logo: "shop_logo",
      origin: "origin",
      region: "region",
      height_m: "height_meters",
      botanic_variety: "botanic_variety",
      farm_producer: "farm_producer",
      processing_method: "processing_method",
      sca: "sca",
      flavor: "flavor",
      recipe_ratio: "recipe_ratio",
      recipe_in_gr: "recipe_in_grams",
      recipe_out_gr: "recipe_out_grams",
      recipe_time_s: "recipe_time_seconds",
      recipe_temperature_c: "recipe_temperature_c",
      in_green_container: "in_green_container",
      in_grey_container: "in_grey_container"
    };
    for (const [formField, dbField] of Object.entries(fieldMapping)) {
      const value = formDataObj[formField];
      if (value !== null && value !== undefined) {
        if (formField === "in_green_container" || formField === "in_grey_container") {
          coffeeData[dbField] = !!value;
        } else {
          const trimmedValue = value.toString().trim();
          if (trimmedValue) {
            if (
              formField.includes("height_m") ||
              formField.includes("sca") ||
              formField.includes("recipe_in_gr") ||
              formField.includes("recipe_out_gr") ||
              formField.includes("recipe_temperature_c")
            ) {
              const numValue = parseFloat(trimmedValue);
              coffeeData[dbField] = isNaN(numValue) ? null : numValue;
            } else {
              coffeeData[dbField] = trimmedValue;
            }
          }
        }
      }
    }
    coffeeData.notes = formDataObj["notes"] ? formDataObj["notes"].toString().trim() : "";

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

    // Check for container conflicts if not already confirmed
    if (!confirmContainerReplacement) {
      const conflicts = [];
      if (coffeeData.in_green_container) {
        const otherGreen = allCoffees.find(c => c.in_green_container);
        if (otherGreen) conflicts.push({ container: "green", coffee: otherGreen });
      }
      if (coffeeData.in_grey_container) {
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
          onConfirm: () => submitNewCoffee({ ...formDataObj }, true, conflicts),
          onCancel: () => {
          }
        });
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
      }
    }

    // If we replaced a container, clear the previous coffee's container in DB and UI FIRST
    if (confirmContainerReplacement && previousConflicts && Array.isArray(previousConflicts)) {
      for (const conflict of previousConflicts) {
        await setCoffeeContainerExclusive(conflict.coffee.id, conflict.container, false);
        conflict.coffee[conflict.container === "green" ? "in_green_container" : "in_grey_container"] = false;
      }
    }

    // Now insert the new coffee
    const { data: inserted, error } = await supabase
      .from("coffee_beans")
      .insert(coffeeData)
      .select()
      .single();
    if (error) {
      throw new Error(error.message || "Failed to add coffee");
    }
    const newCoffee = inserted;

    // Show success notification and reset form
    showNotification('Coffee added successfully!', 'success');
    resetAddCoffeeForm();
    // Wait a short moment to ensure DB is up-to-date
    await new Promise(res => setTimeout(res, 150));
    // Reload coffee data and update UI
    const coffees = await loadCoffeeData();
    setAllCoffees(coffees);
    setFilteredCoffees([...coffees]);
    populateFilters(coffees);
    applyFilters();
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
    if (typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
      lucide.createIcons();
    }
  }
}

/**
 * Delete a coffee entry from Supabase by id
 * @param {string|number} id - The id of the coffee to delete
 * @returns {Promise<{error: any}>}
 */
export async function deleteCoffeeById(id) {
  const { error } = await supabase
    .from('coffee_beans')
    .delete()
    .eq('id', id);
  return { error };
}

/**
 * Update a coffee entry in Supabase by id
 * @param {string|number} id - The id of the coffee to update
 * @param {object} updates - The fields to update
 * @returns {Promise<{error: any}>}
 */
export async function updateCoffeeById(id, updates) {
  const { error } = await supabase
    .from('coffee_beans')
    .update(updates)
    .eq('id', id);
  return { error };
}

document.addEventListener("DOMContentLoaded", () => {
  // Shop URL input handling
  const shopUrlInput = document.getElementById("add-shop-url");
  if (shopUrlInput) {
    shopUrlInput.removeAttribute("oninput");
    shopUrlInput.addEventListener("blur", ensureHttps);
    shopUrlInput.addEventListener("input", debouncedUpdateFavicon);
    shopUrlInput.addEventListener("paste", () => {
      setTimeout(debouncedUpdateFavicon, 10);
    });
  }

  // Espresso recipe inputs
  const recipeIn = document.getElementById("add-recipe-in");
  const recipeOut = document.getElementById("add-recipe-out");
  if (recipeIn) recipeIn.addEventListener("input", calculateRatio);
  if (recipeOut) recipeOut.addEventListener("input", calculateRatio);

  // Reset form button
  const cancelBtn = document.querySelector(".btn-cancel");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", resetAddCoffeeForm);
  }

  // Submit form handler (attach to the form, not the button)
  const addCoffeeForm = document.getElementById("add-coffee-form");
  if (addCoffeeForm) {
    addCoffeeForm.addEventListener("submit", submitNewCoffee);
  }
});




export { allCoffees, filteredCoffees, setAllCoffees, setFilteredCoffees, submitNewCoffee };
