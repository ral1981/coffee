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
        coffee.name?.toLowerCase().includes(query) ||
        (coffee.shops?.name || coffee.shop_name || coffee.shop || '')
          .toLowerCase().includes(query) ||
        coffee.origin?.toLowerCase().includes(query) ||
        coffee.flavor?.toLowerCase().includes(query)
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
      filtered = filtered.filter(coffee => {
        const shopName = coffee.shops?.name || coffee.shop_name || coffee.shop
        return shopName === filters.value.shop
      })
    }

    // Container filter
    if (activeContainers.value.length > 0) {
      filtered = filtered.filter(coffee => {
        // Check if coffee has container assignments
        if (!coffee.coffee_container_assignments || !Array.isArray(coffee.coffee_container_assignments)) {
          return false
        }
        
        // Check if any of the active containers match the coffee's assignments
        return activeContainers.value.some(activeContainer => {
          return coffee.coffee_container_assignments.some(assignment => {
            // Handle both direct container_id and nested containers object
            const assignmentContainerId = assignment.container_id || assignment.containers?.id
            return assignmentContainerId === activeContainer.id
          })
        })
      })
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