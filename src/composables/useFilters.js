import { ref, computed } from 'vue'

export function useFilters(coffees) {
  const searchQuery = ref('')
  const filters = ref({
    origin: '',
    shop: ''
  })
  const activeContainers = ref([])

  const filteredCoffees = computed(() => {
    let filtered = coffees.value || []

    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(coffee => 
        coffee.name.toLowerCase().includes(query) ||
        coffee.shop.toLowerCase().includes(query)
      )
    }

    // Origin filter
    if (filters.value.origin) {
      filtered = filtered.filter(coffee => 
        coffee.origin === filters.value.origin
      )
    }

    // Shop filter
    if (filters.value.shop) {
      filtered = filtered.filter(coffee => 
        coffee.shop === filters.value.shop
      )
    }

    // Container filter
    if (activeContainers.value.length > 0) {
      filtered = filtered.filter(coffee => 
        activeContainers.value.some(container => 
          coffee.container?.id === container.id
        )
      )
    }

    return filtered
  })

  const clearAllFilters = () => {
    searchQuery.value = ''
    filters.value = { origin: '', shop: '' }
    activeContainers.value = []
  }

  const clearSearch = () => {
    searchQuery.value = ''
  }

  const syncFiltersWithRoute = (query) => {
    // Handle URL query parameters
    if (query.search) {
      searchQuery.value = query.search
    }
    if (query.origin) {
      filters.value.origin = query.origin
    }
    if (query.shop) {
      filters.value.shop = query.shop
    }
    // Handle container parameter from legacy URLs
    if (query.container) {
      // This will be handled in the component
    }
  }

  const updateRoute = () => {
    // Placeholder for URL updates
    console.log('Would update route with:', {
      search: searchQuery.value,
      origin: filters.value.origin,
      shop: filters.value.shop,
      containers: activeContainers.value.map(c => c.id)
    })
  }

  return {
    searchQuery,
    filters,
    activeContainers,
    filteredCoffees,
    clearAllFilters,
    clearSearch,
    syncFiltersWithRoute,
    updateRoute
  }
}