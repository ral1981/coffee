import { supabase } from "./supabase.js";
import { allCoffees, filteredCoffees, setFilteredCoffees } from './coffees.js';
import { renderCoffeeCards } from './ui.js';


function toggleFilters() {
  const filtersContent = document.getElementById("filters-content");
  const toggleButton = document.getElementById("toggle-filters-btn");
  if (!filtersContent || !toggleButton) return;

  filtersContent.classList.toggle("collapsed");
  const isCollapsed = filtersContent.classList.contains("collapsed");
  toggleButton.setAttribute("aria-expanded", String(!isCollapsed));
}

function populateFilters(coffees) {
  const containers = [...new Set(coffees.map(c => c.container || "N/A"))]
    .filter(c => c !== "N/A")
    .sort();
  const shops = [...new Set(coffees.map((coffee) => coffee.shop_name || "N/A"))]
    .filter((shop) => shop !== "N/A")
    .sort();
  const origins = [...new Set(coffees.map((coffee) => coffee.origin || "N/A"))]
    .filter((origin) => origin !== "N/A")
    .sort();
  const containerFilter = document.getElementById("container-filter");
  containerFilter.innerHTML = '<option value="">All Containers</option>';
  containers.forEach(container => {
    const option = document.createElement("option");
    option.value = container.toLowerCase();
    option.textContent = container;
    containerFilter.appendChild(option);
  });
  const shopFilter = document.getElementById("shop-filter");
  shopFilter.innerHTML = '<option value="">All Shops</option>';
  shops.forEach((shop) => {
    const option = document.createElement("option");
    option.value = shop;
    option.textContent = shop;
    shopFilter.appendChild(option);
  });
  const originFilter = document.getElementById("origin-filter");
  originFilter.innerHTML = '<option value="">All Origins</option>';
  origins.forEach((origin) => {
    const option = document.createElement("option");
    option.value = origin;
    option.textContent = origin;
    originFilter.appendChild(option);
  });
}

function getUrlParameters() {
  const params = new URLSearchParams(window.location.search);
  return {
    container: params.get("container"),
    shop: params.get("shop"),
    origin: params.get("origin"),
  };
}

function normalizeForComparison(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[באהג]/g, "a")
    .replace(/[יטכך]/g, "e")
    .replace(/[םלןמ]/g, "i")
    .replace(/[ףעצפ]/g, "o")
    .replace(/[תש]/g, "u");
}

function updateUrlParameters() {
  const containerFilter = document.getElementById("container-filter").value;
  const shopFilter = document.getElementById("shop-filter").value;
  const originFilter = document.getElementById("origin-filter").value;
  const params = new URLSearchParams();
  if (containerFilter) params.set("container", containerFilter);
  if (shopFilter) params.set("shop", shopFilter);
  if (originFilter) params.set("origin", originFilter);
  const newUrl = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;
  window.history.replaceState({}, "", newUrl);
}

function clearUrlParameters() {
  window.history.replaceState({}, "", window.location.pathname);
}

function applyUrlParameters() {
  const params = getUrlParameters();
  let hasParams = false;
  if (params.container) {
    const containerFilter = document.getElementById("container-filter");
    if (containerFilter) {
      containerFilter.value = params.container;
      hasParams = true;
    }
  }
  if (params.shop) {
    const shopFilter = document.getElementById("shop-filter");
    const shopOption = Array.from(shopFilter.options).find(
      (option) =>
        normalizeForComparison(option.value) ===
        normalizeForComparison(params.shop),
    );
    if (shopOption) {
      shopFilter.value = shopOption.value;
      hasParams = true;
    }
  }
  if (params.origin) {
    const originFilter = document.getElementById("origin-filter");
    const originOption = Array.from(originFilter.options).find(
      (option) =>
        normalizeForComparison(option.value) ===
        normalizeForComparison(params.origin),
    );
    if (originOption) {
      originFilter.value = originOption.value;
      hasParams = true;
    }
  }
  applyFilters();
  if (hasParams) {
    setTimeout(() => {
      const resultsSection = document.getElementById("results-count");
      if (resultsSection && resultsSection.style.display !== "none") {
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
  }
}

function applyFilters() {
  const containerFilter = document.getElementById("container-filter").value;
  const shopFilter = document.getElementById("shop-filter").value;
  const originFilter = document.getElementById("origin-filter").value;
  const filtered = allCoffees.filter((coffee) => {
    if (containerFilter) {
      const containerValue = (coffee.container || "").toLowerCase();
      if (
        containerFilter === "green" &&
        !(
          containerValue.includes("green") ||
          containerValue.includes("container_01")
        )
      )
        return false;
      if (
        containerFilter === "grey" &&
        !(
          containerValue.includes("grey") ||
          containerValue.includes("gray") ||
          containerValue.includes("container_02")
        )
      )
        return false;
      if (
        containerFilter === "none" &&
        containerValue &&
        containerValue.trim() !== ""
      )
        return false;
    }
    if (shopFilter && (coffee.shop_name || "N/A") !== shopFilter) return false;
    if (originFilter && (coffee.origin || "N/A") !== originFilter) return false;
    return true;
  });
  setFilteredCoffees(filtered);
  renderCoffeeCards(filteredCoffees);
  updateResultsCount(filteredCoffees.length, allCoffees.length);
  updateUrlParameters();
  updateFilterStates();
}

function clearAllFilters() {
  document.getElementById("container-filter").value = '';
  document.getElementById("shop-filter").value = '';
  document.getElementById("origin-filter").value = '';

  filteredCoffees.length = 0;
  filteredCoffees.push(...allCoffees);

  renderCoffeeCards(filteredCoffees);
  updateResultsCount(filteredCoffees.length, allCoffees.length);
  clearUrlParameters();
  updateFilterStates();
}

function hasActiveFilters() {
  return (
    document.getElementById("container-filter").value !== '' ||
    document.getElementById("shop-filter").value !== '' ||
    document.getElementById("origin-filter").value !== ''
  );
}

function updateFilterStates() {
  const container = document.getElementById("container-filter");
  const shop = document.getElementById("shop-filter");
  const origin = document.getElementById("origin-filter");
  const clearBtn = document.getElementById("clear-filters-btn");
  const toggle = document.querySelector(".filters-toggle");

  container.closest(".filter-group").classList.toggle("active", container.value !== '');
  shop.closest(".filter-group").classList.toggle("active", shop.value !== '');
  origin.closest(".filter-group").classList.toggle("active", origin.value !== '');

  const active = hasActiveFilters();
  clearBtn.disabled = !active;
  toggle.classList.toggle("has-active-filters", active);
}

function updateResultsCount(filtered, total) {
  const resultsElement = document.getElementById("results-count");
  const noResultsElement = document.getElementById("no-results");
  const gridElement = document.getElementById("coffee-grid");
  if (filtered === 0) {
    resultsElement.style.display = "none";
    noResultsElement.style.display = "block";
    gridElement.style.display = "none";
  } else {
    resultsElement.style.display = "block";
    noResultsElement.style.display = "none";
    gridElement.style.display = "grid";
    if (filtered === total) {
      resultsElement.textContent = `Showing all ${total} coffees`;
    } else {
      resultsElement.textContent = `Showing ${filtered} of ${total} coffees`;
    }
  }
}

async function loadCoffeeData() {
  try {
    const { data, error } = await supabase
      .from('coffee_beans')
      .select('*');

    if (error) throw error;

    console.log(`Loaded ${data.length} coffee beans from database`);
    return data;
  } catch (error) {
    console.error("Error loading coffee data:", error);
    return [];
  }
}

async function loadFilteredCoffeeData(filters = {}) {
  try {
    let query = supabase.from('coffee_beans').select('*');

    if (filters.shop_name) query = query.eq('shop_name', filters.shop_name);
    if (filters.origin) query = query.eq('origin', filters.origin);
    if (filters.processing_method) query = query.eq('processing_method', filters.processing_method);
    if (filters.container) query = query.eq('container', filters.container);

    const { data, error } = await query;

    if (error) throw error;

    console.log(`Found ${data.length} filtered coffee beans`);
    return data;
  } catch (error) {
    console.error("Error filtering coffee data:", error);
    return [];
  }
}

export {
  toggleFilters,
  populateFilters,
  applyFilters,
  clearAllFilters,
  hasActiveFilters,
  updateFilterStates,
  getUrlParameters,  
  applyUrlParameters,
  clearUrlParameters,
  updateResultsCount,
  loadCoffeeData,
  loadFilteredCoffeeData,
};
